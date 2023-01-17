import Driver from "../Driver"

export default class MSVCDriver extends Driver {

    Flush(): string {
        let exec: string = '';

        switch(this.executor) {
            case "Compiler":
                exec += "cl.exe /nologo /W3 /WX- /EHsc /std:c++20 ";
                if(this.interface){
                    exec += `/TP /interface `;
                    exec += `/experimental:module `;
                    exec += `/ifcOutput ${this.precompiledOutput}.ifc `;
                }
                break;
            case "Linker":
                exec += "link.exe /nologo /lib ";
                break;
            case "Resource":
                exec += "rc ";
                break;
        }

        if((this.compile == false) && this.executor == "Compiler") {
            exec += "/c ";
        }

        if(this.executor == "Compiler") {
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
        } else if(this.executor == "Linker") {
            exec += `/out:${this.objectOutput}.lib `;
        }

        for(let lib of this.objects) {
            exec += `${lib} `;
        }

        return exec;
    }
}