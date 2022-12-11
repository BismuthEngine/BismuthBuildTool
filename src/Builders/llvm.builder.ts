import chalk from "chalk";
import { exec } from "child_process";
import { accessSync, constants } from "fs";
import { resolve } from "path";
import Builder, { CompileWorker } from "../builder.js";
import Deploy from "../Classes/Deploy.js";
import Module from "../Classes/Module.js";
import { StagedModuleInfo } from "../Types/Timeline.js";
import Utils from "../utils.js";

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
                this.LDBase = "lld-link -r ";
                break;
            case "Unix": 
                this.LDBase = "ld.lld -r ";
                break;
            case "Mach": 
                this.LDBase = "ld64.lld -r ";
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

    async Compile(): Promise<void> {
        return new Promise<void>(async (res, rej) => {
            let Cmd = `clang++ ${this.Target.debug ? "-g -O0 " : "-O3 "} `;
            if(this.Target.includeEngine) {
                Cmd += `-fprebuilt-module-path=${resolve(Utils.GetIntermediateFolder(this.Target.enginePath), "/Modules/")} `;
            }
            Cmd += `-fprebuilt-module-path=${resolve(Utils.GetIntermediateFolder(this.Target.projectPath), "/Modules/")} `;

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

                    module.Includes.forEach((inc) => {
                        Cmd += `-I${resolve(mod.Path, inc)} `;
                    });

                    const ModuleLibPath = resolve(Utils.GetRootFolderForModule(mod, this.Target), "/Intermediate/Modules/", `${mod.Name}.lib `);

                    // Sanity check
                    try {
                        accessSync(ModuleLibPath, constants.R_OK);

                        Cmd += ModuleLibPath; 
                    } catch(err) {
                        rej(`Couldn't find compiled module at path: ${ModuleLibPath}`);
                    } 
                }
            })
            if(this.root) {
                this.root.Module.LinkerOptions.forEach((opt) => {
                    Cmd += `-l${opt} `;
                });

                Cmd += resolve(this.root.Path, ((<Module>this.root.Module).ModuleEntry ? `${this.root.Name}.cppm` : (<Module>this.root.Module).ModuleEntry)) + " ";

                Cmd+= resolve(Utils.GetRootFolderForModule(this.root, this.Target), "/Intermediate/Modules/", `${this.Modules}`);
            }

            exec(Cmd, (error, stdout, stderr) => {
                console.log(stdout);

                if(error) {
                    rej(stderr);
                } else {
                    res();
                }
            });
        })
    }
}

export default class LLVMBuilder extends Builder {

    CreateCompileWorker(): CompileWorker {
        return new LLVMCompileWorker(this.CompilationTarget);
    }

    async Finalize(): Promise<void> {
        return new Promise<void>((res, rej) => {

        });
    }
}