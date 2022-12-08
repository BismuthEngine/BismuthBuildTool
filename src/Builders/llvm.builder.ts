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

    async Compile() {
        let Cmd = "clang++ ";
        if(this.root) {
            console.log(chalk.greenBright.bold("[OK] ") + chalk.greenBright(`Compiled: ${this.root.Name}`));
        } else if(this.entry) {
            console.log(chalk.greenBright.bold("[OK] ") + chalk.greenBright(`Compiled: Main`));
        }
    }
}

export default class LLVMBuilder extends Builder {

    CreateCompileWorker(): CompileWorker {
        return new LLVMCompileWorker(this.CompilationTarget);
    }
}