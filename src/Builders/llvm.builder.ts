import chalk from "chalk";
import { exec } from "child_process";
import Builder, { CompileWorker } from "../builder.js";
import { StagedModuleInfo } from "../Types/Timeline.js";

export class LLVMCompileWorker extends CompileWorker {

    root: StagedModuleInfo;
    entry: string;
    linkerRequests: string[] = [];

    SetRoot(module: StagedModuleInfo) {
        this.root = module;
    }

    SetEntry(path: string) {
        
    }

    AddModule(module: StagedModuleInfo) {
        
    }

    AddLinkerRequest(req: string) {
        this.linkerRequests.push(req);
    }

    async Compile(): Promise<void> {
        return new Promise<void>(async (res, rej) => {
            let Cmd = "clang++ ";

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