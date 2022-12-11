import chalk from "chalk";
import { exec, execSync } from "child_process";
import { accessSync, constants, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import Builder, { CompileWorker } from "../builder.js";
import Deploy from "../Classes/Deploy.js";
import Module from "../Classes/Module.js";
import { StagedModuleInfo } from "../Types/Timeline.js";
import Utils from "../utils.js";

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

                deploy.LinkerOptions.forEach((opt) => {
                    Cmd += `-l${opt} `;
                });

                deploy.Includes.forEach((inc) => {
                    Cmd += `-I${resolve(mod.Path, inc)} `;
                });

                deploy.StaticLibs.forEach((so) => {
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

    GetRootCompilationFiles() {
        let CppmFile: string;

        // if module should be treated as C++20 module, we find .cppm file
        if(this.IsModule()) {

            if((<Module>(this.root.Module)).ModuleEntry) {
                CppmFile = (<Module>(this.root.Module)).ModuleEntry;
            } else {
                CppmFile = this.root.Name + ".cppm";
            }

        } 
        // If it's pre-processor's code, we should search for all .cpp files
        else {
            CppmFile = "";

            Utils.GetFilesFiltered(dirname(this.root.Path), /.cpp/, true).forEach(file => {
                CppmFile += ` ${file} `
            });

            return CppmFile;
            //throw "LLVM.Builder.ts: GetRootCompilationFiles()";
        }

        return CppmFile
    }

    async Compile(): Promise<void> {
        if(this.root == undefined)
            return new Promise<void>(async (res, rej) => {
                rej("Root was not set for the compiler");
            });
        else
            return new Promise<void>(async (res, rej) => {
                mkdirSync(resolve(Utils.GetRootFolderForModule(this.root, this.Target), "./Intermediate/Modules/"), {recursive: true});

                let Cmd = `${this.CompBase} ${this.Target.debug ? "-g -O0 " : "-O3 "} `;

                let lldCmd = this.LDBase + LLVMLinker.Relocatable(this.Target);

                if(this.Target.includeEngine) {
                    Cmd += `-fprebuilt-module-path=${resolve(this.Target.enginePath, "./Intermediate/Modules/")} `;
                }
                Cmd += `-fprebuilt-module-path=${resolve(this.Target.projectPath, "./Intermediate/Modules/")} `;

                Cmd += this.CmdModifyDependencies();

                Cmd += resolve(dirname(this.root.Path), `./${this.GetRootCompilationFiles()} `) + " ";

                // Resolves dependencies for [.LIB] files
                for(let modlIdx = 0; modlIdx < this.Modules.length; modlIdx++) {
                    Cmd += resolve(Utils.GetRootFolderForModule(this.Modules[modlIdx], this.Target), 
                                        "./Intermediate/Modules/", 
                                        `./${this.Modules[modlIdx].Name}.lib`) + " ";
                    lldCmd += resolve(Utils.GetRootFolderForModule(this.Modules[modlIdx], this.Target), 
                                        "./Intermediate/Modules/", 
                                        `./${this.Modules[modlIdx].Name}.lib`) + " ";
                }

                // Precompile module (if should)
                if(this.IsModule()) {
                    let pcmCmd = Cmd + `--precompile -o ${Utils.GetModuleIntermediateBase(this.root, this.Target)}.pcm `;
                    
                    //console.log(pcmCmd);
                    
                    try {
                        execSync(pcmCmd, {"encoding": "utf8", stdio: 'pipe'});
                    } catch( stderr ) {
                        rej(stderr.stderr);
                    }
                }

                // Compile object file

                let libCmd = Cmd + `-c -o ${Utils.GetModuleIntermediateBase(this.root, this.Target)}.lib`;

                //console.log(libCmd);

                try {
                    execSync(libCmd, {"encoding": "utf8", stdio: 'pipe'});
                } catch( stderr ) {
                    rej(stderr.stderr);
                }

                // Link against dependencies 
                if(this.Modules.length > 0) {
                    const libName = `${Utils.GetModuleIntermediateBase(this.root, this.Target)}`;

                    lldCmd += ` ${libName}.lib` +
                              ` ${LLVMLinker.Output(this.Target)}${libName}.lib`;
                    //console.log(lldCmd);

                    try {
                        execSync(lldCmd, {"encoding": "utf8", stdio: 'pipe'});
                    } catch( stderr ) {
                        rej(stderr.stderr);
                    }
                }

                // Save hash
                
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
            let Cmd = "clang++ -std=c++20 -fmodules -fuse-ld=lld ";
            
            if(this.CompilationTarget.includeEngine) {
                Cmd += `-fprebuilt-module-path=${resolve(this.CompilationTarget.enginePath, "./Intermediate/Modules/")} `;
            }
            Cmd += `-fprebuilt-module-path=${resolve(this.CompilationTarget.projectPath, "./Intermediate/Modules/")} `;

            for(let finalIdx = 0; finalIdx < this.Timeline.Final.length; finalIdx++) {
                let final: StagedModuleInfo = this.Timeline.Final[finalIdx];

                Cmd += `${Utils.GetModuleIntermediateBase(final, this.CompilationTarget)}.lib `;
            }

            Cmd += ` -o Builded.exe`;
            
            try {
                execSync(Cmd, {"encoding": "utf8", stdio: 'pipe'});
            } catch( stderr ) {
                rej(stderr.stderr);
            }

            console.log(chalk.greenBright.bold('[OK] ') + chalk.greenBright(`Compilation complete!`));
            res();
        });
    }
}