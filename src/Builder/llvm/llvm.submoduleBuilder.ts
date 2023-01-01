import chalk from "chalk";
import { execSync } from "child_process";
import { resolve } from "path";
import { exit } from "process";
import { StagedModuleInfo, StagedSubModuleInfo } from "../../Types/Timeline";
import Utils from "../../utils.js";

class PartitionsMap {
    Partitions: StagedSubModuleInfo[] = [];
    Target: Target;
    Root: StagedModuleInfo;

    constructor(target: Target, root: StagedModuleInfo){
        this.Target = target;
        this.Root = root;
    }
    
    // Returns artifact for clang compiler
    // Artifact contains .pcm links & .obj links
    // Resolves dependency for specified partition
    GetPartitionArtifact(name: string): string {
        let partition = this.Partitions.find((value)=>{
            return value.Name == name;
        });

        if(partition === undefined) {
            console.log("PartitionsMap: Couldn't find partition for artifact gathering");
            exit();
        }

        let artifact: string = "";

        let tempDir = Utils.GetModuleTempBase(this.Root, this.Target);

        artifact += `-fmodule-file=${resolve(tempDir, `./${name}.pcm`)} `;
        if(partition.Implementation.length > 0)
        artifact += `${resolve(tempDir, `./${partition.Name}_implementation.obj`)} `;
    
        if(partition.Interface.length > 0)
        artifact += `${resolve(tempDir, `./${partition.Name}_interface.obj`)} `;

        return artifact;
    }

    GetAllPartitionArtifact(): string[] {
        let artifact: string[] = ["", ""];

        for(let partition of this.Partitions) {
    
            let tempDir = Utils.GetModuleTempBase(this.Root, this.Target);
    
            artifact[0] += ` -fmodule-file=${resolve(tempDir, `./${partition.Name}.pcm`)} `;
            if(partition.Implementation.length > 0)
                artifact[1] += `${resolve(tempDir, `./${partition.Name}_implementation.obj`)} `;
            
            if(partition.Interface.length > 0)
                artifact[1] += `${resolve(tempDir, `./${partition.Name}_interface.obj`)} `;
        }

        return artifact;
    }
}

export default class LLVMSubModuleBuilder {
    Root: StagedModuleInfo;
    Target: Target;

    constructor(target: Target, module: StagedModuleInfo) {
        this.Target = target;
        this.Root = module;
    }

    // Cmd argument must contain a basic clang envokation command
    // That would contain linker arguments for each dependency of main module
    // It's crucial for Partitions to be compilable
    //
    // Example: clang++ lib1.lib lib2.lib -fprebuilt-module-path=. 
    //
    // Returns artifacts with all partitions linkage
    async Build(Cmd: string): Promise<string[]> {
        return new Promise<string[]>((res, rej) => {
            let partMap: PartitionsMap = new PartitionsMap(this.Target, this.Root);
            if(this.Root.Parts) {
                console.log(this.Root);
                for(let stage of this.Root.Parts.Stages) {
                    for(let part of stage.Modules) {
                        let modCmd = Cmd;
                    
                        for(let imp of part.Imports) {
                            modCmd += " " + partMap.GetPartitionArtifact(imp);
                        }
                    
                        const pcmFile = resolve(Utils.GetModuleTempBase(this.Root, this.Target), `./${part.Name}.pcm`);
                    
                        // Precompile module
                        let pcmCmd = modCmd + ` ${part.Interface} --precompile -o ${pcmFile}`;
                    
                        try {
                            if(this.Target.verbose) {
                                console.log(`[SUB-PCM: ${part.Name}] ${pcmCmd}`);
                            }
                            execSync(pcmCmd, {"encoding": "utf8", stdio: 'pipe'});
                        } catch(err) {
                            rej(err);
                        }
                    
                        // Compile symbols
                        for(let i = 0; i < 2; i++) {
                            // At index 0 we compile interface(it CAN'T not exist)
                            // At index 1 we compile implementation(it CAN not exist)
                            if(i == 0 || part.Implementation.length > 1 ) {
                                let symCmd = modCmd + ` ${(i == 1) ? part.Implementation : part.Interface} `;
                                let partName = `${part.Name + ((i == 1) ? "_implementation" : "_interface")}`;
                                
                                let objCmd = symCmd + `-fmodule-file=${pcmFile} -c -o ${resolve(Utils.GetModuleTempBase(this.Root, this.Target), `./${partName}.obj`)}`;
                                
                                try {
                                    if(this.Target.verbose) {
                                        console.log(`[SUB-OBJ: ${part.Name}] ${objCmd}`);
                                    }
                                    execSync(objCmd, {"encoding": "utf8", stdio: 'pipe'});
                                } catch(err) {
                                    rej(err);
                                }
                            }
                        }
                    
                    
                        partMap.Partitions.push(part);
                    } 
                }
            }

            res(partMap.GetAllPartitionArtifact());
        });
    }
}