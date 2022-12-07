import { ModuleList } from "../Types/ModuleList";
import { Stage, StagedModuleInfo, Timeline } from "../Types/Timeline";

// Solving divides modules into stages, each of which represents Root, Branches or Leaves
// Leaves are always non-dependant, which means that they don't rely on any other bismuth-module
// Each branch stage should rely only on previous stages(!)
// Circular Dependency exception should be thrown, if two modules rely on eachother

// TODO: Investigate Chronological Leak as case of Circular Dependency

export default class Solver {
    Timeline: Timeline;
    InteropFrame: {Branches: Stage, Leaves: Stage[], Staged: StagedModuleInfo[]}
    
    constructor(target: Target, crawler: ModuleList) {

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

    Solve(): Timeline {
        return {Stages: []};
    }
}