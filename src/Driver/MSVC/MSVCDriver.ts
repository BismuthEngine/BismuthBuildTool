import { execSync } from "child_process";
import { resolve } from "path";
import Driver from "../Driver.js"

export default class MSVCDriver extends Driver {
    static EnvCmd: string = '';

    constructor() {
        super();

        let installationPath: string = '';

        try {
            installationPath = execSync(`"%ProgramFiles(x86)%\\Microsoft Visual Studio\\Installer\\vswhere.exe" -latest -property installationPath`).toString().replace(/(\r\n|\n|\r)/gm, '');
        } catch(err) {
            try {
                installationPath = execSync(`"%ProgramFiles%\\Microsoft Visual Studio\\Installer\\vswhere.exe" -latest -property installationPath`).toString().replace(/(\r\n|\n|\r)/gm, '');
            } catch(err) {
                try {
                    installationPath = execSync(`"%ProgramFiles%\\chocolatey\\lib\\vswhere\\tools\\vswhere.exe" -latest -property installationPath`).toString().replace(/(\r\n|\n|\r)/gm, '');
                } catch(err) {
                    throw "Was not able to find MSVC on this system.";
                }
            }
        }

        MSVCDriver.EnvCmd = `"` + resolve(installationPath, `./Common7/Tools/VsDevCmd.bat`) + `"`;
        console.log(`Found MSVC Development Environment at: ${MSVCDriver.EnvCmd}`);
    }

    Compiler(): string {
        let exec: string = `cl.exe /nologo /W3 /WX- /EHsc /std:${this.standard} `;
        
        if(this.interface){
            exec += `/TP /interface `;
            exec += `/experimental:module `;
            exec += `/ifcOutput ${this.precompiledOutput}.ifc `;
        }

        if(this.useLinker == false) {
            exec += "/c ";
        }

        exec += `${this.sourceFile} `;

        for(let ifc of this.precompiled) {
            exec += `/reference ${ifc}.ifc `;
        }

        for(let def of this.defines) {
            exec += `/D ${def} `;
        }

        if(this.emmitDebugSymbols) {
            exec += `/DEBUG:FULL /Zi `;
        }

        switch(this.optimizationLevel) {
            case "Debug":
                exec += "/Od ";
                break;
            case "Performance":
                exec += "/O2 ";
                break;
            case "Space":
                exec += "/O1 ";
                break;
        }

        for(let dir of this.precompiledSearchDir) {
            exec += `/ifcSearchDir ${dir} `;
        }

        for(let incl of this.includes) {
            exec += `/I ${incl} `;
        }

        if(this.useLinker) {
            exec += `/Fe"${this.objectOutput}" `;
        } else {
            exec += `/Fo"${this.objectOutput}" `;
        }

        if(this.debugOutput.length > 0) {
            exec += `/Fd"${this.debugOutput}" `;
        }

        // TO-DO: Investigate object files with MSVC
        for(let lib of this.objects) {
            //exec += `${lib} `;
        }

        return `${MSVCDriver.EnvCmd} && ${exec}`;
    }

    Linker(): string {
        let exec: string = "link.exe /nologo /lib ";

        exec += `/out:${this.objectOutput}.lib `;

        for(let lib of this.objects) {
            exec += `${lib} `;
        }

        return `${MSVCDriver.EnvCmd} && ${exec}`;
    }

    Resource(): string {
        let exec: string = 'rc ';

        return `${MSVCDriver.EnvCmd} && ${exec}`;
    }

    Flush(): string {
        let exec: string = '';

        switch(this.executor) {
            case "Compiler":
               return this.Compiler();
                break;
            case "Linker":
                return this.Linker();
                break;
            case "Resource":
                return this.Resource();
                break;
        }

        return exec;
    }
}