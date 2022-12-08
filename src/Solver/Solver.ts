import chalk from "chalk";
import Module from "../Classes/Module";
import { ModuleList, MultiModuleList, RawModule } from "../Types/ModuleList";
import { Stage, StagedModuleInfo, Timeline } from "../Types/Timeline";

// Solving divides modules into stages, each of which represents Root, Branches or Leaves
// Leaves are always non-dependant, which means that they don't rely on any other bismuth-module
// Each branch stage should rely only on previous stages(!)
// Circular Dependency exception should be thrown, if two modules rely on eachother

// TODO: Investigate Chronological Leak as case of Circular Dependency

export default class Solver {
    Timeline: Timeline = {Stages: []};
    InteropFrame: {Branches: Stage | any, Leaves: Stage[], Staged: StagedModuleInfo[]} = {Branches: null, Leaves: [], Staged: []}
    Objects: MultiModuleList;
    CompilationTarget: Target;
    
    constructor(target: Target, crawler: MultiModuleList) {
        this.Objects = crawler;
        this.CompilationTarget = target;
    }

    PushInteropFrame() {
        // Exclude staged modules from interop frame
        let UnstagedModules: StagedModuleInfo[];
        UnstagedModules = this.InteropFrame.Branches.Modules.filter((value: StagedModuleInfo) => {
            return !this.InteropFrame.Staged.includes(value);
        })

        // Save staged modules to current stage & reset it
        this.InteropFrame.Branches.Modules = this.InteropFrame.Staged;
        this.InteropFrame.Staged = [];

        this.InteropFrame.Leaves.push(this.InteropFrame.Branches);

        // Push new stage(unsorted) into timeline
        let NewStageIndex = this.Timeline.Stages.push({Modules: UnstagedModules}) - 1;
        
        this.InteropFrame.Branches = this.Timeline.Stages[NewStageIndex];
    }

    StageModule(module: RawModule): StagedModuleInfo {
        let StagedModule: StagedModuleInfo = {
            Type: module.type,
            Name: module.object.Name,
            Path: module.path,
            UpToDate: false,
            Module: module.object,
            DependsOn: []
        }

        // Get dependencies
        if(module.type == "Module") {
            StagedModule.DependsOn = (<Module>module.object).Imports;
        }

        return StagedModule;
    }

    ResolveDependenciesRaw() {

    }

    SolveInteropFrame() {
        this.InteropFrame.Branches.Modules.forEach((mod: StagedModuleInfo) => {
            //console.log(chalk.bold("[LOG] ") + `Solving: ${mod.Name}`);
            //console.log(mod);

            if(mod.Type == "Deploy") {
                this.InteropFrame.Staged.push(mod);
                return;
            }
            
            let RequiredDependencies = mod.DependsOn;
            // Resolved is true by default, to stage modules that have no dependencies
            let Resolved = true;

            if(RequiredDependencies) {
                for(let depIdx = 0; depIdx < RequiredDependencies.length; depIdx++) {
                    let PreviousResolved = false;

                    // Loop through all InteropFrame.Leaves[] stages
                    ResolutionFromStages:
                    for(let stageIdx = 0; stageIdx < this.InteropFrame.Leaves.length; stageIdx++) {
                        let currentStage = this.InteropFrame.Leaves[stageIdx];

                        // Loop through all Stage.Modules
                        for(let modIdx = 0; modIdx < currentStage.Modules.length; modIdx++) {
                            let currentModule = currentStage.Modules[modIdx];

                            // If true, we found our dependency in Leaves
                            if(currentModule.Name === RequiredDependencies[depIdx]) {
                                PreviousResolved = true;
                                break ResolutionFromStages;
                            }
                        }
                    }

                    // If we can't resolve even one of dependencies, we can't stage
                    if(PreviousResolved == false) {
                        Resolved = false;
                        break;
                    }
                }
            }

            if(Resolved) {
                this.InteropFrame.Staged.push(mod);
                console.log(chalk.bold.greenBright("[OK] ") + chalk.greenBright(`Solved: ${mod.Name}`));
            }
        })
    }

    CalculateUTD(module: StagedModuleInfo): StagedModuleInfo {
        module.UpToDate = false;
        return module;
    }

    Solve(): Timeline {
        console.log(chalk.bold('======== SOLVER ========'));

        // Filter modules by rules

        // TODO: CRITICAL: Check for all imports to actually exist
        
        // Get leaves
        let LeavesBranch: Stage = {
            Modules: []
        }; 

        // Include Bismuth modules, if project is not self-contained
        if(this.CompilationTarget.includeEngine) {
            this.Objects.Engine.Modules.forEach((mod: RawModule) => {
                LeavesBranch.Modules.push(this.CalculateUTD(this.StageModule(mod)));
            })
            this.Objects.Engine.Deploys.forEach((mod: RawModule) => {
                LeavesBranch.Modules.push(this.CalculateUTD(this.StageModule(mod)));
            })
        }
        // Stage leaves from project
        this.Objects.Project.Modules.forEach((mod: RawModule) => {
            LeavesBranch.Modules.push(this.CalculateUTD(this.StageModule(mod)));
        })
        this.Objects.Project.Deploys.forEach((mod: RawModule) => {
            LeavesBranch.Modules.push(this.CalculateUTD(this.StageModule(mod)));
        })

        this.InteropFrame.Branches = LeavesBranch;
        console.log(chalk.bold("[LOG] ") + `Pending to solve ${LeavesBranch.Modules.length} modules`);

        this.SolveInteropFrame();

        this.PushInteropFrame();

        // Generate stages
        while(this.InteropFrame.Branches.Modules.length > 0) {
            this.SolveInteropFrame();

            this.PushInteropFrame();
        }

        console.log(chalk.bold(`Solved ${this.InteropFrame.Leaves.length} stages`));
        return this.Timeline;
    }
}