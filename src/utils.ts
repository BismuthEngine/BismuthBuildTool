import chalk from "chalk";
import { existsSync, lstatSync, readdirSync, readFileSync, rmdirSync, statSync, unlinkSync } from "fs";
import Module from "./Classes/Module";
import { join, resolve } from "path";
import { pathToFileURL } from "url";
import { StagedModuleInfo } from "./Types/Timeline";

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
}