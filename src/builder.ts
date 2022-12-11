import Module from "./Classes/Module.js";
import Deploy from "./Classes/Deploy.js";
import { Stage, StagedModuleInfo, Timeline } from "./Types/Timeline";
import { BuilderFrame } from "./Types/BuilderFrame";
import chalk from "chalk";
import { join } from "path";
import { mkdirSync, writeFileSync } from "fs";
import { exit } from "process";
import {CompilationError, BuilderPipeline} from "./Types/Compilation";

export class CompileWorker {
    Target: Target;
    constructor(target: Target) {
        this.Target = target;
    }

    SetRoot(module: StagedModuleInfo) {
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
    constructor(target: Target, timeline: Timeline) {
        this.CompilationTarget = target;
        this.Timeline = timeline;
        this.Frame = {CurrentStage: null, PreviousStages: []};
    }

    CompilationTarget: Target;
    Timeline: Timeline;
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

    // Slow! Fix later
    SearchDependency(dependencyName: string){
        let retmodule: StagedModuleInfo | undefined = undefined;

        // Search
        this.Frame.PreviousStages.forEach(stage => {
            if(stage) {
                stage.Modules.forEach(module => {
                    if(module.Name === dependencyName) {
                        retmodule = module;
                        return;
                    }
                });
            }
            if(retmodule != undefined) return;
        });

        if(retmodule === undefined) 
            throw "couldn't find module";
        else
            return retmodule;
    }

    async ResolveAllDependencies(module: StagedModuleInfo, worker: CompileWorker) {
        return new Promise<void>((resolve, reject) => {
            module.DependsOn.forEach((UnresolvedDependency: string) => {
                try {
                    worker.AddModule(this.SearchDependency(UnresolvedDependency));
                } catch (error) {
                    //console.log(error);
                    reject(UnresolvedDependency);
                }
            })

            resolve();
        });
    }

    async Compile(): Promise<void> {
        
    }

    // All modules in Timeline are compiled. Now build executable.
    async Finalize(): Promise<void> {
        
    }
}