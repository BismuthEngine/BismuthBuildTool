import Deploy from "../Classes/Deploy";
import Module from "../Classes/Module";
import Rules from "../Classes/Rules";
import { ModuleType } from "./Timeline";

type RootModule = "Engine" | "Project";

interface RawModule {
    path: string,
    object: Module | Deploy,
    type: ModuleType
}

interface ModuleList {
    Modules: RawModule[],
    Deploys: RawModule[],
    Rules: Rules[]
}

interface MultiModuleList {
    Project: ModuleList, 
    Engine: ModuleList
}