import Module from "./Classes/Module.js";
import Deploy from "./Classes/Deploy.js";
import { Stage, StagedModuleInfo } from "./Types/Timeline";
import { BuilderFrame } from "./Types/BuilderFrame";

export class CompileWorker {

    SetRoot(module: StagedModuleInfo) {
        throw "Unimplemented";
    }

    SetEntry(path: string) {
        throw "Unimplemented";
    }

    AddModule(module: StagedModuleInfo) {
        throw "Unimplemented";
    }

    AddLinkerRequest() {
        throw "Unimplemented";
    }

    async Compile() {
        throw "Unimplemented";
    }
}

export default class Builder {
    constructor(target: Target) {
        this.CompilationTarget = target;
    }

    CompilationTarget: Target;
    Frame: BuilderFrame;

    PushStage(stage: Stage) {
        this.Frame.PreviousStages.push(this.Frame.CurrentStage);
        this.Frame.CurrentStage = stage;
    }

    CreateCompileWorker(): CompileWorker {
        return new CompileWorker();
    }

    async Compile(): Promise<void> {
        for(let moduleIdx = 0; moduleIdx < this.Frame.CurrentStage.Modules.length; moduleIdx++) {
            let module: StagedModuleInfo = this.Frame.CurrentStage.Modules[moduleIdx];

            let worker = this.CreateCompileWorker();
            worker.AddModule(module);
        }
    }
}