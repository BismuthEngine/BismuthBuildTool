import Deploy from "../Classes/Deploy";
import Module from "../Classes/Module";
import Rules from "../Classes/Rules";

type RootModule = "Engine" | "Project";

interface RawModule {
    path: string,
    object: Module | Deploy
}

interface ModuleList {
    Modules: RawModule[],
    Deploys: RawModule[],
    Rules: Rules[]
}