import { exec } from "child_process";
import Builder, { CompileWorker } from "../builder.js";
import { StagedModuleInfo } from "../Types/Timeline.js";

export class LLVMCompileWorker extends CompileWorker {

    linkerRequests: string[] = [];

    SetRoot(module: StagedModuleInfo) {
        throw "Unimplemented";
    }

    SetEntry(path: string) {
        throw "Unimplemented";
    }

    AddModule(module: StagedModuleInfo) {
        throw "Unimplemented";
    }

    AddLinkerRequest(req: string) {
        this.linkerRequests.push(req);
    }

    async Compile() {
        let Cmd = "clang++ ";
        
    }
}

export default class LLVMBuilder extends Builder {

    CreateCompileWorker(): CompileWorker {
        return new LLVMCompileWorker(this.CompilationTarget);
    }
}