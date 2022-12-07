import Deploy from "../Classes/Deploy";
import Module from "../Classes/Module";

// Deploys would be solved first without any queue
// They should be already solved before Builder pass
type ModuleType = "Module" | "Deploy";

interface StagedModuleInfo {
    Type: ModuleType,
    Name: string,
    Path: string
    Module: Module | Deploy,
    DependsOn: StagedModuleInfo[]
}

interface Stage {
    Modules: StagedModuleInfo[]
}

interface Timeline {
    // Compilation Queue
    Stages: Stage[],
}