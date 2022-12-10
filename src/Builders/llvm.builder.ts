import chalk from "chalk";
import { exec } from "child_process";
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
    Modules: StagedModuleInfo[];

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
            let Cmd = `clang++ -fprebuilt-module-path=${Utils.GetRootFolderForModule(this.root, this.Target)}`;

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
                        Cmd += `${so} `;
                    });
                } else {
                    // Module modifications
                    let module: Module = <Module>(mod.Module);

                    module.LinkerOptions.forEach((opt) => {
                        Cmd += `-l${opt} `;
                    });

                    module.Includes.forEach((inc) => {
                        Cmd += `-I${resolve(mod.Path, inc)} `;
                    });
                }
            })

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
}