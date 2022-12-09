import Module from "./Classes/Module.js";
import Deploy from "./Classes/Deploy.js";
import { Stage, StagedModuleInfo } from "./Types/Timeline";
import { BuilderFrame } from "./Types/BuilderFrame";
import chalk from "chalk";
import { join } from "path";
import { mkdirSync, writeFileSync } from "fs";

export class CompileWorker {
    Target: Target;
    constructor(target: Target) {
        this.Target = target;
    }

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
        throw "Unimplemented";
    }

    async Compile() {
        throw "Unimplemented";
    }
}

export default class Builder {
    constructor(target: Target) {
        this.CompilationTarget = target;
        this.Frame = {CurrentStage: null, PreviousStages: []};
    }

    CompilationTarget: Target;
    Frame: BuilderFrame;

    PushStage(stage: Stage) {
        this.Frame.PreviousStages.push(this.Frame.CurrentStage);
        this.Frame.CurrentStage = stage;
    }

    SaveHash(module: StagedModuleInfo) {
        let IntermediatePath: string = "";
        switch(module.Domain) {
            case "Engine":
                IntermediatePath = join(this.CompilationTarget.enginePath, "/Intermediate/");
            case "Project":
                IntermediatePath = join(this.CompilationTarget.projectPath, "/Intermediate/");
        }
        
        mkdirSync(join(IntermediatePath, "/Modules/"), {recursive: true});
        writeFileSync(join(IntermediatePath, "/Modules/", (module.Name + ".hash")), module.ActualHash);
    }

    CreateCompileWorker(): CompileWorker {
        return new CompileWorker(this.CompilationTarget);
    }

    async Compile(): Promise<void> {
        //console.log(this.Frame);
        for(let moduleIdx = 0; moduleIdx < this.Frame.CurrentStage.Modules.length; moduleIdx++) {
            let module: StagedModuleInfo = this.Frame.CurrentStage.Modules[moduleIdx];

            let worker = this.CreateCompileWorker();
            worker.SetRoot(module);
            await worker.Compile();
        }
    }
}