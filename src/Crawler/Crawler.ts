
// Class for module crawler
// Parses through whole folder structure
// Collects modules, rules, deploys

import Module from "../Classes/Module.js";
import Rules from "../Classes/Rules.js";
import { ModuleList } from "../Types/ModuleList";

// Returns Module Tree
export default class Crawler {
    constructor(Target: Target){
        
    }

    Modules: Map<string, any> = new Map<string, any>();
    // Used to not compile Engine Modules, if not required  
    EngineModules: Map<string, any> = new Map<string, any>();
    Rules: Rules[] = [];
    
    async CollectModules(): Promise<ModuleList> {
        return new Promise<ModuleList>((resolve, reject) => {

        });
    }

    async ImportClass(path: string) {
        return (await import(path)) as any;
    }
    
    async RegisterModuleClass(path: string)
    {
        let mod: Module = (new (await this.ImportClass(path))()) as Module;
        if(!this.Modules.has(mod.Name)) {
            this.Modules.set(mod.Name, mod);
        } else {
            throw "2 modules with same name detected, should never happen in one space!";
        }
    }


}