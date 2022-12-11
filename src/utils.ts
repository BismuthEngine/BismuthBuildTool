import chalk from "chalk";
import { existsSync, lstatSync, readdirSync, readFileSync } from "fs";
import Module from "./Classes/Module";
import { resolve } from "path";
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

    static GetFilesFiltered(path: string, filter: RegExp): string[] {
        if (!existsSync(path)) {
            throw `Doesn't exist`;
        }

        let retfiles: string[] = [];
    
        var files = readdirSync(path);
        for (var i = 0; i < files.length; i++) {
            var filename = resolve(path, files[i]);
            var stat = lstatSync(filename);
            if (stat.isDirectory()) {
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
}