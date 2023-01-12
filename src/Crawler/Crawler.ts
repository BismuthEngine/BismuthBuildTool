
// Class for module crawler
// Parses through whole folder structure
// Collects modules, rules, deploys

import Module from "../Classes/Module.js";
import Rules from "../Classes/Rules.js";
import { ModuleList, MultiModuleList, RawModule, RawSubModule } from "../Types/ModuleList";

import { join } from "path";
import { readFile, readdir, lstat, access,  } from "fs/promises";
import { constants, exists, readFileSync } from "fs";
import Deploy from "../Classes/Deploy.js";
import { pathToFileURL } from "url";
import Utils from "../utils.js";
import { createHash } from "crypto";
import chalk from "chalk";
import { Lexer } from "../Analyzer/Parser.js";

// Returns Module Tree
export default class Crawler {
    constructor(target: Target){
        this.CompilationTarget = target;
    }

    CompilationTarget: Target;

    Modules: Map<string, any> = new Map<string, any>();
    Rules: Rules[] = [];

    private async CollectHash(path: string): Promise<string> {
        let CommonBuffer: string = "";
        
        const Files = Utils.GetFilesFiltered(path, /./, true);
        Files.forEach(file => {
            CommonBuffer += readFileSync(file, {encoding: "utf8"});
        });

        return createHash('sha256').update(CommonBuffer).digest('hex');;
    }

    private async ParseSubmodule(path: string): Promise<RawSubModule> {
        if(this.CompilationTarget.verbose == true) {
            console.log(`Parsing submodule: ${path}`);
        }

        return new Promise<RawSubModule>((res, rej)=>{
            let module: RawSubModule = {
                name: "",
                interface: "",
                implementation: "",
                imports: []
            };

            // Create lexer
            let lexer = new Lexer(path, this.CompilationTarget.verbose);

            // Get module name
            module.name = Utils.GetPartitionName(lexer, this.CompilationTarget.verbose);

            // Store path of this current unit
            if(path.endsWith('.cppm')) {
                module.interface = path;
            } else {
                module.implementation = path;
            }

            // Parse imports
            module.imports = Utils.GetImportParts(lexer, this.CompilationTarget.verbose);

            res(module);
        });
    }

    private async CollectSubmodules(path: string, module: Module): Promise<RawSubModule[]> {
        return new Promise<RawSubModule[]>(async (res, rej)=>{
            let SubModules: RawSubModule[] = [];
            let moduleEntry = (module.ModuleEntry != undefined) ? module.ModuleEntry : (`${module.Name}.cppm`)

            let Paths: string[] = Utils.GetFilesFiltered(path, /(.cppm$)|(.cpp$)/, true);
            Paths = Paths.filter((value)=>{
                return `${Utils.GetPathFilename(value)}.cppm` != moduleEntry
            });

            if(this.CompilationTarget.verbose == true) {
                console.log(`Requested submodules: ${Paths}`);
            }

            for(let unit of Paths) {
                let subModule = await this.ParseSubmodule(unit);

                let registeredSubModule = SubModules.find(
                    (element)=>{
                        return (element.name == subModule.name);
                    }
                );

                if(!registeredSubModule) {
                    if(this.CompilationTarget.verbose == true) {
                        console.log(`Pushing submodule: ${subModule.name}`);
                    }
                    SubModules.push(subModule);
                } else {
                    if(this.CompilationTarget.verbose == true) {
                        console.log(`Merging submodule units: ${subModule.name}`);
                    }
                    SubModules[SubModules.indexOf(registeredSubModule)] = Utils.MergeObj<RawSubModule>(registeredSubModule, subModule);
                }
            }

            res(SubModules);
        });
    }

    private async CollectFolder(path: string, modlist: ModuleList): Promise<any> {
        return new Promise<any>(async (resolve, reject) => {
            try {
                access(path, constants.W_OK | constants.R_OK);
            } catch(err) {
                throw "Path doesn't exist or not accesible"
            }

            let files = (await readdir(path, {encoding: "utf8"}));
            for(let i = 0; i < files.length; i++) {
                let filepath = join(path, files[i]);

                if(this.CompilationTarget.verbose == true) {
                    console.log(`Crawler found: ${filepath}`);
                }

                let stat = await lstat(filepath);
                    
                if(stat.isDirectory()) {
                    await this.CollectFolder(filepath, modlist);
                } else if (/\.module\.js/.test(filepath))
                {
                    let expMod: RawModule = {
                        path: filepath,
                        object: (new (await this.ImportClass(filepath))(this.CompilationTarget)) as Module,
                        type: "Module",
                        hash: await this.CollectHash(path),
                        parts: []
                    };
                    expMod.parts = await this.CollectSubmodules(path, <Module>(expMod.object));
                    modlist.Modules.push(expMod);
                } else if (/\.deploy\.js/.test(filepath))
                {
                    modlist.Deploys.push({
                        path: filepath,
                        object: (new (await this.ImportClass(filepath))(this.CompilationTarget)) as Deploy,
                        type: "Deploy",
                        hash: "",
                        parts: []
                    })
                } else if (/\.rules\.js/.test(filepath) && !(/Editor\.rules\.js/.test(filepath)))
                {
                    if(!this.CompilationTarget.editorMode) {
                        modlist.Rules= (new (await this.ImportClass(filepath))(this.CompilationTarget) as Rules)
                    }
                } else if (/Editor\.rules\.js/.test(filepath))
                {
                    if(this.CompilationTarget.editorMode) {
                        modlist.Rules =(new (await this.ImportClass(filepath))(this.CompilationTarget) as Rules)
                    }
                }
            }

            resolve(true);
        });
    }
    
    async CollectModules(): Promise<MultiModuleList> {
        return new Promise<MultiModuleList>(async (resolve, reject) => {
            let modlist: ModuleList = {
                Modules: [],
                Deploys: [],
                Rules: null
            };
            let enginemodlist: ModuleList = {
                Modules: [],
                Deploys: [],
                Rules: null
            };


            try{
                if(this.CompilationTarget.includeEngine) {
                    await this.CollectFolder(join(this.CompilationTarget.enginePath, "Source/"), enginemodlist);
                } 

                await this.CollectFolder(join(this.CompilationTarget.projectPath, "Source/"), modlist);
            } catch(err) {
                throw err;
            }

            resolve({Project: modlist, Engine: enginemodlist});
        });
    }

    async ImportClass(path: string) {
        if(this.CompilationTarget.verbose == true) {
            console.log(`Importing class: ${path}`);
        }
        return (await import(pathToFileURL(path).toString())).default as any;
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