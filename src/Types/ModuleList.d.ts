import Deploy from "../Classes/Deploy";
import Module from "../Classes/Module";
import Rules from "../Classes/Rules";
import { ModuleType } from "./Timeline";

type RootModule = "Engine" | "Project";

interface RawModule {
    path: string,
    object: Module | Deploy,
    type: ModuleType,
    hash: string
}

interface ModuleList {
    Modules: RawModule[],
    Deploys: RawModule[],
    Rules: Rules | any
}

interface MultiModuleList {
    Project: ModuleList, 
    Engine: ModuleList
}