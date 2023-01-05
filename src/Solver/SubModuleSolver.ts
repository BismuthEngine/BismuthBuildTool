import chalk from "chalk";
import test from "node:test";
import { exit } from "process";
import Module from "../Classes/Module";
import { RawModule, RawSubModule } from "../Types/ModuleList";
import { StagedSubModuleInfo, SubModuleTimeline, SubStage } from "../Types/Timeline";

export default class SubModuleSolver {
    Timeline: SubModuleTimeline;
    Modules: RawSubModule[];
    Root: RawModule;
    Domain: "Engine" | "Project";
    InteropFrame: {Branches: SubStage | any, Leaves: SubStage[], Staged: StagedSubModuleInfo[]} = {Branches: null, Leaves: [], Staged: []}

    constructor(modules: RawSubModule[], Root: RawModule, Domain: "Engine" | "Project") {
        this.Root = Root;
        this.Domain = Domain;
        this.Modules = modules;
        this.Timeline = {
            Stages: []
        }
    }

    StageModule(module: RawSubModule): StagedSubModuleInfo {
        let StagedModule: StagedSubModuleInfo = {
            Name: module.name,
            Interface: module.interface,
            Implementation: module.implementation,
            Domain: this.Domain,
            Imports: module.imports
        }

        StagedModule.Imports = StagedModule.Imports.filter((obj)=>{ 
            let notGlobalModule = !((<Module>(this.Root.object)).Imports.includes(obj));
            let notHeaderUnit = !(/^</.test(obj));
            return notGlobalModule && notHeaderUnit;
        }); 

        return StagedModule;
    }

    PushInteropFrame() {
        if(this.InteropFrame.Staged.length <= 0) {
            // Circular dependency must be
            console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright(`Circular dependency detected in partitions: ${this.Root.object.Name}!`));
            console.log(chalk.redBright(`\tInterop Frame stack: ${(<SubStage>(this.InteropFrame.Branches)).Modules.map((obj)=>(obj.Name))}`));
            console.log(`${(<SubStage>(this.InteropFrame.Branches)).Modules.map((obj)=>(obj.Imports))}`);
            exit(-1);
        }

        // Exclude staged modules from interop frame
        let UnstagedModules: StagedSubModuleInfo[];
        UnstagedModules = this.InteropFrame.Branches.Modules.filter((value: StagedSubModuleInfo) => {
            return !this.InteropFrame.Staged.includes(value);
        })

        // Save staged modules to current stage & reset it
        this.InteropFrame.Branches.Modules = this.InteropFrame.Staged;

        // Push new stage into timeline
        this.Timeline.Stages.push({Modules: this.InteropFrame.Staged});

        this.InteropFrame.Staged = [];

        this.InteropFrame.Leaves.push(this.InteropFrame.Branches);
        
        this.InteropFrame.Branches = {Modules: UnstagedModules};
    }

    SolveInteropFrame() {
        this.InteropFrame.Branches.Modules.forEach(async (mod: StagedSubModuleInfo) => {
            //console.log(chalk.bold("[LOG] ") + `Solving: ${mod.Name}`);
            //console.log(mod);
            
            let RequiredDependencies = mod.Imports;
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
            }
        })
    }

    Solve(): SubModuleTimeline {

        // Get leaves
        let LeavesBranch: SubStage = {
            Modules: []
        }; 

        // Get first leaves ready
        this.Modules.forEach((mod: RawSubModule) => {
            LeavesBranch.Modules.push(this.StageModule(mod));
        })

        this.InteropFrame.Branches = LeavesBranch;

        while(this.InteropFrame.Branches.Modules.length > 0) {
            this.SolveInteropFrame();
            this.PushInteropFrame();
        }

        return this.Timeline;
    }
}