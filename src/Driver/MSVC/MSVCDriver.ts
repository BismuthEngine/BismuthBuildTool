import Driver from "../Driver"

export default class MSVCDriver extends Driver {

    Compiler(): string {
        let exec: string = 'cl.exe /nologo /W3 /WX- /EHsc /std:c++20 ';
        
        if(this.interface){
            exec += `/TP /interface `;
            exec += `/experimental:module `;
            exec += `/ifcOutput ${this.precompiledOutput}.ifc `;
        }

        if(this.compile == false) {
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

        if(this.compile) {
            exec += `/Fe"${this.objectOutput}" `;
        } else {
            exec += `/Fo"${this.objectOutput}" `;
        }

        if(this.debugOutput.length > 0) {
            exec += `/Fd"${this.debugOutput}" `;
        }

        for(let lib of this.objects) {
            exec += `${lib} `;
        }

        return exec;
    }

    Linker(): string {
        let exec: string = "link.exe /nologo /lib ";

        exec += `/out:${this.objectOutput}.lib `;

        for(let lib of this.objects) {
            exec += `${lib} `;
        }

        return exec;
    }

    Resource(): string {
        let exec: string = 'rc ';

        return exec;
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