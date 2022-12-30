import chalk from "chalk";
import { exec, execSync } from "child_process";
import { accessSync, constants, existsSync, mkdirSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import Builder, { CompileWorker } from "../builder.js";
import Deploy from "../../Classes/Deploy.js";
import Module from "../../Classes/Module.js";
import { StagedModuleInfo } from "../../Types/Timeline.js";
import Utils from "../../utils.js";
import LLVMSubModuleBuilder from "./llvm.submoduleBuilder.js";

class LLVMLinker {
    static Relocatable(target: Target) {
        switch(target.platform) {
            case "Win32": 
                return " /lib ";
            case "Unix":
                return " -r ";
        }
    }

    static Output(target: Target) {
        switch(target.platform) {
            case "Win32": 
                return " /out:";
            case "Unix":
                return " -o ";
        }
    }
}

export class LLVMCompileWorker extends CompileWorker {

    root: StagedModuleInfo;
    entry: string;
    linkerRequests: string[] = [];
    Modules: StagedModuleInfo[] = [];

    CompBase: string = "clang++ -std=c++20 -fmodules "
    LDBase: string = "ld.lld -r "

    constructor(target: Target) {
        super(target);

        switch(target.platform) {
            case "Win32": 
                this.LDBase = "lld-link ";
                break;
            case "Unix": 
                this.LDBase = "ld.lld ";
                break;
            case "Mach": 
                this.LDBase = "ld64.lld ";
                break;
        }
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

    CmdModifyDependencies(): string {
        let Cmd: string = " ";
        this.Modules.forEach(mod => {
            if(mod.Type == "Deploy") {
                // Deploy modifications
                let deploy: Deploy = <Deploy>(mod.Module);

                if (deploy.LinkerOptions) deploy.LinkerOptions.forEach((opt) => {
                    Cmd += `-l${opt} `;
                });

                if (deploy.Includes) deploy.Includes.forEach((inc) => {
                    Cmd += `-I${resolve(mod.Path, inc)} `;
                });

                if (deploy.StaticLibs) deploy.StaticLibs.forEach((so) => {
                    Cmd += `${resolve(mod.Path, so)} `;
                });
            } else {
                // Module modifications
                let module: Module = <Module>(mod.Module);
                if(module.Includes){
                    module.Includes.forEach((inc) => {
                        Cmd += `-I${resolve(mod.Path, inc)} `;
                    });
                }

                const ModuleLibPath = resolve(Utils.GetRootFolderForModule(mod, this.Target), "./Intermediate/Modules/", `./${mod.Name}.lib`) + " ";

                // Sanity check
                try {
                    //accessSync(ModuleLibPath, constants.R_OK);

                    Cmd += ModuleLibPath; 
                } catch(err) {
                    throw `Couldn't find compiled module at path: ${ModuleLibPath}`;
                } 
            }
        })

        if(this.root.Module.LinkerOptions) {
            this.root.Module.LinkerOptions.forEach((opt) => {
                Cmd += `-l${opt} `;
            });
        }

        return Cmd;
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
        switch(this.Target.platform) {
            case "Mach":
                return " -DPLATFORM_MAC "
                break;
            case "Unix":
                return " -DPLATFORM_LINUX "
                break;
            case "Win32":
                return " -DPLATFORM_WINDOWS "
                break;
        }
    }

    async Compile(): Promise<void> {
        if(this.root == undefined)
            return new Promise<void>(async (res, rej) => {
                rej("Root was not set for the compiler");
            });
        else
            return new Promise<void>(async (res, rej) => {
                mkdirSync(resolve(Utils.GetRootFolderForModule(this.root, this.Target), `./Intermediate/Modules/${this.root.Name}_temp`), {recursive: true});

                let Cmd = `${this.CompBase} ${this.Target.debug ? "-g -O0 " : "-O3 "} `;

                Cmd += this.DefinePlatforms();

                let lldCmd = this.LDBase + LLVMLinker.Relocatable(this.Target);

                if(this.Target.includeEngine) {
                    Cmd += `-fprebuilt-module-path=${resolve(this.Target.enginePath, "./Intermediate/Modules/")} `;
                }
                Cmd += `-fprebuilt-module-path=${resolve(this.Target.projectPath, "./Intermediate/Modules/")} `;

                Cmd += this.CmdModifyDependencies();

                // Resolves dependencies for [.LIB] files
                for(let modlIdx = 0; modlIdx < this.Modules.length; modlIdx++) {
                    if(this.Modules[modlIdx].Type == "Module") { 
                        Cmd += resolve(Utils.GetRootFolderForModule(this.Modules[modlIdx], this.Target), 
                                            "./Intermediate/Modules/", 
                                            `./${this.Modules[modlIdx].Name}.lib`) + " ";
                        lldCmd += resolve(Utils.GetRootFolderForModule(this.Modules[modlIdx], this.Target), 
                                            "./Intermediate/Modules/", 
                                            `./${this.Modules[modlIdx].Name}.lib`) + " ";
                    } else {
                        let deploy: Deploy = <Deploy>(this.Modules[modlIdx].Module);
                        
                        if(deploy.StaticLibs) {
                            deploy.StaticLibs.forEach(lib => {
                                lldCmd += ` ${lib} `;
                            })
                        }
                    }
                }
                
                // [0] is for PCM
                // [1] is for OBJ
                let PartitionsArtifacts: string[] = ["", ""];
    
                // Compile partitions, if bismuth module is c++20 module
                if(this.IsModule()) {
                    PartitionsArtifacts = await (new LLVMSubModuleBuilder(this.Target, this.root)).Build(Cmd);
                }

                // Precompile module (if should)
                if(this.IsModule()) {
                    let pcmCmd = Cmd + PartitionsArtifacts[0] + `--precompile -o ${Utils.GetModuleIntermediateBase(this.root, this.Target)}.pcm `;

                    pcmCmd += resolve(dirname(this.root.Path), `./${this.GetModuleFile()} `) + " ";
                    
                    if(this.Target.verbose){
                        console.log(chalk.bold('[PCM] ') + pcmCmd);
                    }
                    
                    try {
                        execSync(pcmCmd, {"encoding": "utf8", stdio: 'pipe'});
                    } catch( stderr ) {
                        rej(stderr.stderr);
                    }
                }

                // Compile object files into temp directory
                if(!this.IsModule()) {
                    let libCmd = Cmd + `-c `;
                    
                    let Files = this.GetRootCompilationFiles();
                    // console.log(chalk.magenta(Files));

                    Files.forEach(file => {
                        let objPath = `${resolve(Utils.GetModuleTempBase(this.root, this.Target), Utils.GetPathFilename(file))}.obj`;
                        PartitionsArtifacts[1] += ` ${objPath} `;
                        let curLibCmd = libCmd + ` ${file} -o ${objPath}`

                        if(this.Target.verbose){
                            console.log(chalk.bold('[LIB] ') + curLibCmd);
                        }
                    
                        try {
                            execSync(curLibCmd, {"encoding": "utf8", stdio: 'pipe'});
                        } catch( stderr ) {
                            rej(stderr.stderr);
                        }
                    })
                } else {
                    let libCmd = Cmd + PartitionsArtifacts[1] + `-c `;

                    let entryName = (<Module>(this.root.Module)).ModuleEntry ? (<Module>(this.root.Module)).ModuleEntry : './' + (<Module>(this.root.Module)).Name;

                    let entryPath = resolve(dirname(this.root.Path), entryName);

                    let implementationExists = existsSync(`${entryPath}.cpp`);
                    let compileQueue: {path: string, unit: "implementation" | "interface"}[] = [{path: `${entryPath}.cppm`, unit: "interface"}];
                    
                    if(implementationExists) {
                        compileQueue.push({path: `${entryPath}.cpp`, unit: "implementation"});
                    }

                    for(let file of compileQueue) {
                        let objPath = `${resolve(Utils.GetModuleTempBase(this.root, this.Target), Utils.GetPathFilename(file.path))}_${file.unit}.obj`;
                        let curLibCmd = libCmd + ` ${file.path} -o ${objPath}`;

                        try {
                            if(this.Target.verbose){
                                console.log(chalk.bold('[LIB] ') + curLibCmd);
                            }
                            execSync(curLibCmd, {"encoding": "utf8", stdio: 'pipe'});

                            PartitionsArtifacts[1] += ` ${objPath}`;
                        } catch( stderr ) {
                            rej(stderr.stderr);
                        }
                    }
                    // Module main entry consists of Interface Unit & Implementation Unit(optional)
                    // We find those using .module.js's ModuleEntry files (module name if entry is null)
                    // We assemble them into .obj & concat artifacts
                }

                // Link against dependencies 
                const libName = `${Utils.GetModuleIntermediateBase(this.root, this.Target)}`;
                
                lldCmd += ` ` +
                          ` ${PartitionsArtifacts[1]}` +
                          ` ${LLVMLinker.Output(this.Target)}${libName}.lib`;
                
                if(this.Target.verbose){
                    console.log(chalk.bold('[LINKER] ') + lldCmd);
                }
                
                try {
                    execSync(lldCmd, {"encoding": "utf8", stdio: 'pipe'});
                } catch( stderr ) {
                    rej(stderr.stderr);
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

export default class LLVMBuilder extends Builder {

    CreateCompileWorker(): CompileWorker {
        return new LLVMCompileWorker(this.CompilationTarget);
    }

    async Finalize(): Promise<void> {
        return new Promise<void>((res, rej) => {
            mkdirSync(Utils.GetOutputBase(this.CompilationTarget), {recursive: true});

            let Cmd = `clang++ -std=c++20 -fmodules -fuse-ld=lld ${this.CompilationTarget.debug ? "-g -O0" : "-O3"} `;
            let OutputFolder = resolve('./Build/');
            
            if(this.CompilationTarget.includeEngine) {
                Cmd += `-fprebuilt-module-path=${resolve(this.CompilationTarget.enginePath, "./Intermediate/Modules/")} `;
            }
            Cmd += `-fprebuilt-module-path=${resolve(this.CompilationTarget.projectPath, "./Intermediate/Modules/")} `;

            for(let finalIdx = 0; finalIdx < this.Timeline.Final.length; finalIdx++) {
                let final: StagedModuleInfo = this.Timeline.Final[finalIdx];

                Cmd += `${Utils.GetModuleIntermediateBase(final, this.CompilationTarget)}.lib `;
            }

            Cmd += ` -o ${resolve(Utils.GetOutputBase(this.CompilationTarget), './App.exe')}`;

            if(this.CompilationTarget.verbose){
                console.log(chalk.bold('[FINAL] ') + Cmd);
            }
            
            try {
                execSync(Cmd, {"encoding": "utf8", stdio: 'pipe'});
            } catch( stderr ) {
                rej(stderr.stderr);
            }

            console.log(chalk.greenBright.bold('\n[OK] ') + chalk.greenBright(`Compilation complete to "${Utils.GetOutputBase(this.CompilationTarget)}"!`));
            res();
        });
    }
}