import chalk from "chalk";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { exit } from "process";
import Module from "../Classes/Module";
import Rules from "../Classes/Rules";
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
        if(this.InteropFrame.Staged.length <= 0) {
            // Circular dependency must be
            console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("Circular dependency detected!"));
            exit(-1);
        }

        // Exclude staged modules from interop frame
        let UnstagedModules: StagedModuleInfo[];
        UnstagedModules = this.InteropFrame.Branches.Modules.filter((value: StagedModuleInfo) => {
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

    StageModule(module: RawModule, Domain: "Engine" | "Project"): StagedModuleInfo {
        let StagedModule: StagedModuleInfo = {
            Type: module.type,
            Name: module.object.Name,
            Path: module.path,
            UpToDate: false,
            Module: module.object,
            DependsOn: [],
            ActualHash: module.hash,
            Domain: Domain
        }

        // Get dependencies
        if(module.type == "Module") {
            StagedModule.DependsOn = (<Module>module.object).Imports;
        }

        return StagedModule;
    }

    SolveRules() {
        if(this.Objects.Project.Rules == undefined) {
            console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("Project's corresponding .rules.js file not found!"));
            exit(-1);
        }
        let rulesDependencies: string[] = [];
        rulesDependencies.concat((this.Objects.Project.Rules as Rules).Modules);
        if(this.CompilationTarget.includeEngine) {
            rulesDependencies.concat((this.Objects.Engine.Rules as Rules).Modules);
        }


    }

    SolveInteropFrame() {
        this.InteropFrame.Branches.Modules.forEach((mod: StagedModuleInfo) => {
            //console.log(chalk.bold("[LOG] ") + `Solving: ${mod.Name}`);
            //console.log(mod);

            if(mod.Type == "Deploy") {
                this.InteropFrame.Staged.push(mod);
                console.log(chalk.bold.greenBright.bgBlackBright("[OK] ") + chalk.greenBright.bgBlackBright(`Deployed: ${mod.Name}`));
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
                                // If dependency is not up-2-date, our module is not up-2-date
                                if(currentModule.UpToDate == false) mod.UpToDate = false;
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
                console.log(chalk.bold.greenBright("[OK] ") + chalk.greenBright(`Solved: ${mod.Name} ${(!mod.UpToDate ? "(Not up to date)" : "(Up to date)")}`));
            }
        })
    }

    CalculateUTD(module: StagedModuleInfo): StagedModuleInfo {
        let IntermediatePath: string = "";
        switch(module.Domain) {
            case "Engine":
                IntermediatePath = join(this.CompilationTarget.enginePath, "/Intermediate/");
                break;
            case "Project":
                IntermediatePath = join(this.CompilationTarget.projectPath, "/Intermediate/");
                break;
        }
        //console.log(IntermediatePath + " : " + module.Domain);

        const HashPath = join(IntermediatePath, "/Modules/", (module.Name + ".hash"));
        try{
            const newHash = readFileSync(HashPath, {encoding: "utf8"});

            module.UpToDate = (module.ActualHash === newHash);
        } catch (error) {
            module.UpToDate = false;
        }
        
        return module;
    }

    SolveInteropFrameUTD() {

    }

    VerifyResolutionsExist(stage: Stage): {Name: string, Res: string[]}[] {
        let Unresolved: {Name: string, Res: string[]}[] = [];
        stage.Modules.forEach((targetModule: StagedModuleInfo) => {
            let UnresolvedDeps: string[] = Array.from(targetModule.DependsOn);

            stage.Modules.forEach((testModule: StagedModuleInfo) => {
                if(UnresolvedDeps.includes(testModule.Name)) {
                    UnresolvedDeps.splice(UnresolvedDeps.indexOf(testModule.Name), 1);
                }
            });

            if(UnresolvedDeps.length > 0) {
                Unresolved.push({Name: targetModule.Name, Res: UnresolvedDeps});
            }
        });

        return Unresolved;
    }

    Solve(): Timeline {
        console.log(chalk.bold('======== SOLVER ========'));
        
        // Get leaves
        let LeavesBranch: Stage = {
            Modules: []
        }; 

        // Include Bismuth modules, if project is not self-contained
        if(this.CompilationTarget.includeEngine) {
            this.Objects.Engine.Modules.forEach((mod: RawModule) => {
                LeavesBranch.Modules.push(this.CalculateUTD(this.StageModule(mod, "Engine")));
            })
            this.Objects.Engine.Deploys.forEach((mod: RawModule) => {
                LeavesBranch.Modules.push(this.CalculateUTD(this.StageModule(mod, "Engine")));
            })
        }
        // Stage leaves from project
        this.Objects.Project.Modules.forEach((mod: RawModule) => {
            LeavesBranch.Modules.push(this.CalculateUTD(this.StageModule(mod, "Project")));
        })
        this.Objects.Project.Deploys.forEach((mod: RawModule) => {
            LeavesBranch.Modules.push(this.CalculateUTD(this.StageModule(mod, "Project")));
        })

        // Solve rules
        this.SolveRules();

        // Verify, that ALL dependencies & imports exist
        let Unresolved = this.VerifyResolutionsExist(LeavesBranch);
        if(Unresolved.length > 0) {
            console.log(chalk.redBright.bold('[ERROR] ') + chalk.redBright("Unable to resolve dependencies"));
            
            Unresolved.forEach((unres: {Name: string, Res: string[]}) => {
                console.log(chalk.redBright.bold(`\tIn module [${unres.Name}]:`));
                unres.Res.forEach((failedImport: string) => {
                    console.log(chalk.redBright(`\t\t${failedImport}`));
                });
            });

            exit(-1);
        }

        this.InteropFrame.Branches = LeavesBranch;
        console.log(chalk.bold("[LOG] ") + `Pending to solve ${LeavesBranch.Modules.length} modules`);

        this.SolveInteropFrame();

        this.PushInteropFrame();

        // Generate stages
        while(this.InteropFrame.Branches.Modules.length > 0) {
            this.SolveInteropFrame();

            this.PushInteropFrame();
        }

        console.log(chalk.bold(`Solved ${this.Timeline.Stages.length} stages`));
        //console.log(this.Timeline.Stages[0]);
        return this.Timeline;
    }
}