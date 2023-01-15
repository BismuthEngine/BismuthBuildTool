import Driver from "../Driver"

export default class MSVCDriver extends Driver {

    Flush(): string {
        let exec: string = '';

        if(this.executor == "Compiler") {
            exec += "cl.exe /nologo /W3 /WX- /EHsc ";
            if(this.interface){
                exec += `/TP /interface `;
            }
        } else {
            exec += "link.exe /nologo /lib ";
        }

        if(this.compile == false) {
            exec += "/c ";
        }

        if(this.executor != "Linker") {
            for(let ifc of this.precompiled) {
                exec += `/reference ${ifc} `;
            }
        }

        for(let lib of this.objects) {
            exec += `${lib} `;
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

        if(this.interface) {
            exec += `/experimental:module `;
            exec += `/ifcOutput ${this.precompiledOutput} `;
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

        exec += `/Fd"${this.debugOutput}" `;

        return exec;
    }
}