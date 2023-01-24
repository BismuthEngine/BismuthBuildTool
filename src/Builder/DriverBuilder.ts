import chalk from "chalk";
import { exec, execSync } from "child_process";
import { accessSync, constants, existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import Builder, { CompileWorker } from "./builder.js";
import Deploy from "../Classes/Deploy.js";
import Module from "../Classes/Module.js";
import { StagedModuleInfo, StagedSubModuleInfo, Timeline } from "../Types/Timeline.js";
import Utils from "../utils.js";
import Driver from "../Driver/Driver.js";
import { platform } from "process";
import LLVMDriver from "../Driver/LLVM/LLVMDriver.js";
import MSVCDriver from "../Driver/MSVC/MSVCDriver.js";
import EmscriptenDriver from "../Driver/Emscripten/EmscriptenDriver.js";

type PartitionData = {precompiled: string, objects: string[]};

class PartitionsMap {
    Partitions: StagedSubModuleInfo[] = [];
    Target: Target;
    Root: StagedModuleInfo;

    constructor(target: Target, root: StagedModuleInfo){
        this.Target = target;
        this.Root = root;
    }

    AddModule(module: StagedSubModuleInfo) {
        this.Partitions.push(module);
    }

    private GetBase(name: string): string {
        return resolve(Utils.GetModuleTempBase(this.Root, this.Target), `./${name}`);
    }
    
    // Returns artifact for clang compiler
    // Artifact contains .pcm links & .obj links
    // Resolves dependency for specified partition
    GetPartitionArtifact(name: string): PartitionData | undefined {
        let part = this.Partitions.find((obj) => {
            return (obj.Name === name);
        })

        if(part !== undefined) {
            // There can't be no interface
            let objects: string[] = [`${this.GetBase(part.Name)}_interface.obj`];
            if(part.Implementation.length > 0) {
                objects.push(`${this.GetBase(part.Name)}_implementation.obj`);
            }

            let ret: PartitionData = {
                precompiled: `${this.GetBase(part.Name)}`,
                objects: objects
            }
            return ret;
        }

        return;
    }

    GetAllPartitionArtifact(): PartitionData[] {
        let parts: PartitionData[] = [];

        for(let part of this.Partitions) {
            // There can't be no interface
            let objects: string[] = [`${this.GetBase(part.Name)}_interface.obj`];
            if(part.Implementation.length > 0) {
                objects.push(`${this.GetBase(part.Name)}_implementation.obj`);
            }

            let ret: PartitionData = {
                precompiled: `${this.GetBase(part.Name)}`,
                objects: objects
            }

            parts.push(ret);
        }

        return parts;
    }
}

export class DriverCompileWorker extends CompileWorker {

    root: StagedModuleInfo;
    entry: string;
    linkerRequests: string[] = [];
    Modules: StagedModuleInfo[] = [];
    driver: Driver;

    constructor(target: Target, driver: Driver) {
        super(target);
        this.driver = driver;
    }

    SetRoot(module: StagedModuleInfo) {
        this.root = module;
    }

    SetEntry(path: string) {
        
    }

    AddModule(module: StagedModuleInfo) {
        if(!this.Modules.includes(module)) {
            this.Modules.push(module);
        } else {
            console.log(chalk.yellowBright.bold("[WARN] ") + chalk.yellowBright(`Attempted adding module ${module.Name} into pipeline, but it's already registered!`));
        }
    }

    AddLinkerRequest(req: string) {
        this.linkerRequests.push(req);
    }

    ModifyDependencies(driver: Driver) {
        this.Modules.forEach(mod => {
            if(mod.Type == "Deploy") {
                // Deploy modifications
                let deploy: Deploy = <Deploy>(mod.Module);

                if (deploy.LinkerOptions) deploy.LinkerOptions.forEach((opt) => {
                    //Cmd += `${opt} `;
                });

                if (deploy.Includes) deploy.Includes.forEach((inc) => {
                    driver.AddInclude(resolve(mod.Path, inc));
                });

                if (deploy.StaticLibs) deploy.StaticLibs.forEach((so) => {
                    driver.AddObject(resolve(mod.Path, so));
                });
            } else {
                // Module modifications
                let module: Module = <Module>(mod.Module);
                if(module.Includes){
                    module.Includes.forEach((inc) => {
                        driver.AddInclude(resolve(mod.Path, inc));
                    });
                }

                const ModuleLibPath = resolve(Utils.GetRootFolderForModule(mod, this.Target), "./Intermediate/Modules/", `./${mod.Name}.lib`) + " ";

                // Sanity check
                try {
                    //accessSync(ModuleLibPath, constants.R_OK);

                    driver.AddObject(ModuleLibPath); 
                } catch(err) {
                    throw `Couldn't find compiled module at path: ${ModuleLibPath}`;
                } 
            }
        })

        if(this.root.Module.LinkerOptions) {
            this.root.Module.LinkerOptions.forEach((opt) => {
                //Cmd += `-l${opt} `;
            });
        }
    }

    IsModule() {
        return (<Module>(this.root.Module)).Module == true || (<Module>(this.root.Module)).Module == undefined;
    }

    GetRootCompilationFiles(): string[] {
        let CppmFiles: string[] = [];

        // if module should be treated as C++20 module, we find .cppm file
        if(this.IsModule()) {
            CppmFiles.push(resolve(dirname(this.root.Path), `./${this.GetModuleFile()} `));
        } 

        // Collect .cpp files
        Utils.GetFilesFiltered(dirname(this.root.Path), /.cpp/, true).forEach(file => {
            CppmFiles.push(file);
        });

        return CppmFiles;
    }

    GetModuleFile(): string {
        if(this.IsModule()) {

            if((<Module>(this.root.Module)).ModuleEntry) {
                return ((<Module>(this.root.Module)).ModuleEntry);
            } else {
                return (this.root.Name + ".cppm");
            }

        } else {
            return " ";
        }
    }

    DefinePlatforms(): string {
        return "PLATFORM_WINDOWS"
    }

    CompileSubmodules(driver: Driver): PartitionsMap {
        let map: PartitionsMap = new PartitionsMap(this.Target, this.root);

        for(let stage of this.root.Parts.Stages) {
            for(let part of stage.Modules) {
                let compiler = driver.Branch();
                compiler.UseLinker(false);

                // Solve dependencies
                for(let dep of part.Imports) { 
                    let foundDependency: PartitionData | undefined = map.GetPartitionArtifact(dep);
                    if(foundDependency != undefined) {
                        compiler.AddPrecompiled(foundDependency.precompiled);
                        for(let obj of foundDependency.objects) {
                            compiler.AddObject(obj);
                        }
                    }
                }

                let outputInterface = resolve(Utils.GetModuleTempBase(this.root, this.Target), `./${part.Name}`);

                compiler.SetSource(part.Interface);

                compiler.SetObjectOutput(`${outputInterface}_interface.obj`);
                compiler.SetPrecompiledOutput(outputInterface);
                compiler.Interface(true);

                map.AddModule(part)

                try {
                    if(this.Target.verbose) {
                        console.log(`[SUB-PCM/OBJ Interface] ${compiler.Flush()}`);
                    }
                    execSync(compiler.Flush(), {"encoding": "utf8", stdio: 'pipe'});
                } catch( stderr ) {
                    throw stderr.stderr;
                }

                if(part.Implementation.length > 0) {
                    let outputImplementation = resolve(Utils.GetModuleTempBase(this.root, this.Target), `./${part.Name}_implementation`);

                    compiler.SetSource(part.Implementation);

                    compiler.SetObjectOutput(`${outputImplementation}.obj`);
                    compiler.AddPrecompiled(outputInterface);
                    compiler.Interface(false);

                    try {
                        if(this.Target.verbose) {
                            console.log(`[SUB-PCM/OBJ Implementation] ${compiler.Flush()}`);
                        }
                        execSync(compiler.Flush(), {"encoding": "utf8", stdio: 'pipe'});
                    } catch( stderr ) {
                        throw stderr.stderr;
                    }
                }
            }
        }
        return map;
    } 

    async Compile(): Promise<void> {
        if(this.root == undefined)
            return new Promise<void>(async (res, rej) => {
                rej("Root was not set for the compiler");
            });
        else
            return new Promise<void>(async (res, rej) => {
                
                mkdirSync(resolve(Utils.GetRootFolderForModule(this.root, this.Target), `./Intermediate/Modules/${this.root.Name}_temp`), {recursive: true});

                let driver = this.driver.Branch();

                driver.SetExecutor("Compiler")

                if(this.Target.debug) { 
                    driver.EmmitDebugSymbols();
                    driver.Optimization("Debug");
                } else {
                    driver.Optimization("Performance");
                }
                
                driver.AddDefine("PLATFORM_WINDOWS");

                if(this.Target.includeEngine) {
                    driver.AddPrecompiledSearchDir(resolve(this.Target.enginePath, "./Intermediate/Modules/"));
                }
                driver.AddPrecompiledSearchDir(resolve(this.Target.projectPath, "./Intermediate/Modules/"));

                this.ModifyDependencies(driver);

                // Resolves dependencies for [.LIB] files
                for(let modlIdx = 0; modlIdx < this.Modules.length; modlIdx++) {
                    if(this.Modules[modlIdx].Type == "Module") { 
                        driver.AddObject(resolve(Utils.GetRootFolderForModule(this.Modules[modlIdx], this.Target), 
                                            "./Intermediate/Modules/", 
                                            `./${this.Modules[modlIdx].Name}.lib`));
                    } else {
                        let deploy: Deploy = <Deploy>(this.Modules[modlIdx].Module);
                        
                        if(deploy.StaticLibs) {
                            deploy.StaticLibs.forEach(lib => {
                                driver.AddObject(lib);
                            })
                        }
                    }
                }
                
                let PartitionsArtifacts: PartitionsMap;
    
                // Compile partitions, if bismuth module is c++20 module
                // Then compile main module
                if(this.IsModule()) {
                    try {
                        PartitionsArtifacts = this.CompileSubmodules(driver.Branch());
                    } catch(err) {
                        rej(err);
                    }
                    
                    let mainArtifact: PartitionData = {
                        precompiled: "",
                        objects: []
                    };

                    for(let part of PartitionsArtifacts!.GetAllPartitionArtifact()) {
                        driver.AddPrecompiled(part.precompiled);
                        for(let obj of part.objects) {
                            driver.AddObject(obj);
                        }
                    }

                    let entryName = (<Module>(this.root.Module)).ModuleEntry ? (<Module>(this.root.Module)).ModuleEntry : './' + (<Module>(this.root.Module)).Name;

                    let entryPath = resolve(dirname(this.root.Path), entryName);

                    let implementationExists = existsSync(`${entryPath}.cpp`);
                    let compileQueue: {path: string, unit: "implementation" | "interface"}[] = [{path: `${entryPath}.cppm`, unit: "interface"}];
                    
                    if(implementationExists) {
                        compileQueue.push({path: `${entryPath}.cpp`, unit: "implementation"});
                    }

                    for(let obj of compileQueue) {
                        let mainDriver = driver.Branch();
                        mainDriver.SetSource(obj.path);
                        if( obj.unit == "interface") {
                            mainDriver.Interface(true);
                            //mainDriver.SetObjectOutput();
                        } else {
                            mainDriver.Interface(false);
                        }
                        mainArtifact.objects.push();
                    }

                }

                // Save hash
                writeFileSync(`${Utils.GetModuleIntermediateBase(this.root, this.Target)}.hash`, this.root.ActualHash, {"encoding": "utf8"});
                
                // Clear temp directory
                //Utils.EmptyDir(Utils.GetModuleTempBase(this.root, this.Target));

                // Return
                res();
            })
        }
}

export default class DriverBuilder extends Builder {
    driver: Driver;

    constructor(target: Target, timeline: Timeline, driver: Driver) {
        super(target, timeline);
        this.driver = driver;
    }

    CreateCompileWorker(): CompileWorker {
        return new DriverCompileWorker(this.CompilationTarget, this.driver);
    }

    async Finalize(): Promise<void> {
        return new Promise<void>((res, rej) => {
            mkdirSync(Utils.GetOutputBase(this.CompilationTarget), {recursive: true});

            let driver: Driver = this.driver.Branch();

            driver.SetExecutor("Compiler");
            if(this.CompilationTarget.debug) {
                driver.EmmitDebugSymbols();
                driver.Optimization("Debug");
            } else {
                driver.Optimization("Performance");
            }
            
            driver.AddDefine("PLATFORM_WINDOWS");

            if(this.CompilationTarget.includeEngine) {
                driver.AddPrecompiledSearchDir(resolve(this.CompilationTarget.enginePath, "./Intermediate/Modules/"));
            }
            driver.AddPrecompiledSearchDir(resolve(this.CompilationTarget.projectPath, "./Intermediate/Modules/"));

            for(let finalIdx = 0; finalIdx < this.Timeline.Final.length; finalIdx++) {
                let final: StagedModuleInfo = this.Timeline.Final[finalIdx];

                driver.AddObject(`${Utils.GetModuleIntermediateBase(final, this.CompilationTarget)}.lib`);
            }

            driver.SetObjectOutput(resolve(Utils.GetOutputBase(this.CompilationTarget), `./${this.CompilationTarget.name}${this.CompilationTarget.configuration}_${this.CompilationTarget.platform}_${this.CompilationTarget.arch}`));

            if(this.CompilationTarget.verbose){
                console.log(chalk.bold('[FINAL] ') + driver.Flush());
            }
            
            try {
                execSync(driver.Flush(), {"encoding": "utf8", stdio: 'pipe'});
            } catch( stderr ) {
                rej(stderr.stderr);
            }

            console.log(chalk.greenBright.bold('\n[OK] ') + chalk.greenBright(`Compilation complete to "${Utils.GetOutputBase(this.CompilationTarget)}"!`));
            res();
        });
    }
}