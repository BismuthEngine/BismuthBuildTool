import Driver from "../Driver"

export default class LLVMDriver extends Driver {

    Flush(): string {
        let exec: string = '';
        let precomp: string = '';

        switch(this.executor) {
            case "Compiler":
                precomp = exec = "clang++ -Wall -std=c++20 ";
                if(this.interface){
                    exec += `-fmodules `;
                    precomp += `-fmodules `;
                    precomp += `--precompile -o ${this.precompiledOutput}.pcm `;
                }
                break;
            case "Linker":
                exec += "ld.lld -r ";
                break;
            case "Resource":
                exec += "clang-rc ";
                break;
        }

        if((this.compile == false) && this.executor == "Compiler") {
            exec += "-c ";
        }

        if(this.executor == "Compiler") {
            precomp += `${this.sourceFile} `;
            exec += `${this.sourceFile} `;

            for(let pcm of this.precompiled) {
                precomp += `-fmodule-file=${pcm}.pcm `; 
                exec += `-fmodule-file=${pcm}.pcm `;
            }

            for(let def of this.defines) {
                precomp += `-D${def} `;
                exec += `-D${def} `;
            }
    
            if(this.emmitDebugSymbols) {
                precomp += `-g `;
                exec += `-g `;
            }
    
            switch(this.optimizationLevel) {
                case "Debug":
                    precomp += "-O0 "; 
                    exec += "-O0 ";
                    break;
                case "Performance":
                    precomp += "-Ofast "; 
                    exec += "-Ofast ";
                    break;
                case "Space":
                    precomp += "-Os "; 
                    exec += "-Os ";
                    break;
            }
    
            for(let dir of this.precompiledSearchDir) {
                precomp += `-fprebuild-module-path=${dir} `; 
                exec += `-fprebuild-module-path=${dir} `;
            }
    
            for(let incl of this.includes) {
                precomp += `-I${incl} `; 
                exec += `-I${incl} `;
            }
    
            if(this.debugOutput.length > 0) {
                // exec += `/Fd"${this.debugOutput}" `;
            }

            exec += `-o ${this.objectOutput}.obj `;
            precomp += `-o ${this.objectOutput}.pcm `;

        } else if(this.executor == "Linker") {
            exec += `-o ${this.objectOutput}.lib `;
        } else {

        }

        for(let lib of this.objects) {
            precomp += `${lib} `;
            exec += `${lib} `;
        }

        if(this.executor == "Compiler" && this.interface)
            return `${precomp} && ${exec}`;
        else
            return exec;
    }
}