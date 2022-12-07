import { exec } from "child_process";
import Builder, { CompileWorker } from "../builder.js";

export class LLVMCompileWorker extends CompileWorker {


    SetRoot() {
        throw "Unimplemented";
    }

    AddModule() {
        throw "Unimplemented";
    }

    AddLinkerRequest() {
        throw "Unimplemented";
    }

    async Compile() {
        await exec("clang++ -std=c++20");
    }
}

export default class LLVMBuilder extends Builder {

    CreateCompileWorker(): CompileWorker {
        return new LLVMCompileWorker();
    }
}