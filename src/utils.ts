import chalk from "chalk";
import { existsSync, lstatSync, readdirSync, readFileSync, rmdirSync, statSync, unlinkSync } from "fs";
import Module from "./Classes/Module";
import { join, resolve } from "path";
import { pathToFileURL } from "url";
import { StagedModuleInfo, StagedSubModuleInfo } from "./Types/Timeline";

export default class Utils {
    static GetPlatform(platform: string): Platform {
        switch(platform)
        {
            case "win32":
                return "Win32";
            case "darwin":
                return "Mach";
            case "linux":
                return "Unix";
            case "freebsd":
                return "Unix";
            default:
                throw "Unsupported platform";
        }
    }

    static GetArch(arch: string): Arch {
        switch(arch) {
            case "ia32":
                return "x86_32";
                break;
            case "x64":
                return "x86_64";
                break;
            case "arm":
                return "ARM_32";
                break;
            case "arm64":
                return "ARM_64";
                break;
            default:
                throw "Unsupported CPU architecture";
        }
    }

    static GetToolkit(target: Target): Toolkit {
        // TODO: MSVC support
        return "Clang";
    }

    static ReadJSON(path: string): any {
        return JSON.parse(readFileSync(path).toString());
    }

    static GetFilesFiltered(path: string, filter: RegExp, recursive: boolean = false): string[] {
        if (!existsSync(path)) {
            throw `Doesn't exist`;
        }

        let retfiles: string[] = [];
    
        var files = readdirSync(path);
        for (var i = 0; i < files.length; i++) {
            var filename = resolve(path, files[i]);
            var stat = lstatSync(filename);
            if (stat.isDirectory()) {
                if(recursive == true) {
                    retfiles.concat(this.GetFilesFiltered(filename, filter, recursive));
                }
            } else if (filter.test(filename)) {
                retfiles.push(filename);
            };
        };

        return retfiles;
    }

    // root: engine/project root folder
    static GetIntermediateFolder(root: string): string {
        return pathToFileURL(resolve(root, "./Intermediate/")).toString();
    }

    static GetModuleFolder(path: string): string {
        return path.substring(0, path.lastIndexOf("/"));
    }

    static GetRootFolderForModule(module: StagedModuleInfo, target: Target): string {
        switch(module.Domain) {
            case "Engine": 
                return target.enginePath;
            case "Project":
                return target.projectPath
        }
    }

    static GetModuleIntermediateBase(module: StagedModuleInfo, target: Target): string {
        switch(module.Domain) {
            case "Engine":
                return resolve(target.enginePath, "./Intermediate/Modules/", module.Name)
            case "Project":
                return resolve(target.projectPath, "./Intermediate/Modules/", module.Name)
        }
    }

    static GetModuleIntermediateFolder(module: StagedModuleInfo | StagedSubModuleInfo, target: Target): string {
        switch(module.Domain) {
            case "Engine":
                return resolve(target.enginePath, "./Intermediate/Modules/")
            case "Project":
                return resolve(target.projectPath, "./Intermediate/Modules/")
        }
    }

    static GetModuleTempBase(module: StagedModuleInfo, target: Target): string {
        return this.GetModuleIntermediateBase(module, target) + "_temp";
    }

    static GetPathFilename(path: string) {
        let s = path.split(/[\/\\]/);
        return s[s.length-1].split(/\./)[0];
    }

    static GetOutputBase(target: Target): string {
        return resolve(target.projectPath, target.outputhPath);
    }

    static EmptyDir(path: string) {
        const dirContents = readdirSync(path);
      
        for (const fileOrDirPath of dirContents) {
          try {
            const fullPath = join(path, fileOrDirPath);
            const stat = statSync(fullPath);
            if (stat.isDirectory()) {
              if (readdirSync(fullPath).length) this.EmptyDir(fullPath);
              rmdirSync(fullPath);
            } else unlinkSync(fullPath);
          } catch (ex) {
            console.error(ex.message);
          }
        }

        rmdirSync(path);
    }

    static MergeObj<Type>(...objs: Type[]): Type {
        let Final: any = objs[0];
        for(let obj of objs) {
            let Properties = Object.getOwnPropertyNames(obj);
            
            // If string is empty, object is undefined or array is empty
            for(let prop of Properties) {
                if( (<any>obj)[prop] === "" || 
                    (<any>obj)[prop] === undefined ||
                    ((<any>obj)[prop].hasOwnProperty("length") ? ((<any>obj)[prop].length == 0) : (false)))
                {} else {
                    Final[prop] = (<any>obj)[prop];
                }
            }
        }

        return <Type>Final;
    }

    static ExtractFirstTokenAfter(test: string, token: string): string | undefined {
        let afterText: string[] = test.split(token);
        
        if(afterText.length > 1) {
            let tokenized = afterText[1].split(';');
            if(tokenized.length > 1) {
                return tokenized[0].replace(' ', '');
            }
        }

        return undefined;
    }

    static ExtractAllTokensAfter(test: string, token: string): string[] {
        let afterText: string[] = test.split(token);
        let tokens: string[] = [];

        for(let artifact of afterText) {
            let splittedArtifact = artifact.split(';');
            if(splittedArtifact.length > 1) {
                tokens.push(splittedArtifact[0].replace(' ', ''));
            }
        }

        return tokens;
    }
}