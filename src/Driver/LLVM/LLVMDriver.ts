import Driver from "../Driver"

export default class LLVMDriver extends Driver {

    Compiler(): string {
        let exec: string = '';
        let precomp: string = '';

        precomp = exec = "clang++ -Wall -std=c++20 ";
        
        if(this.interface){
            exec += `-fmodules `;
            precomp += `-fmodules `;
            precomp += `--precompile -o ${this.precompiledOutput}.pcm `;
        };

        if(this.compile) {
            exec += "-c ";
        }

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

        for(let lib of this.objects) {
            precomp += `${lib} `;
            exec += `${lib} `;
        }

        if(this.interface) {
            return `${precomp} && ${exec}`;
        } else {
            return exec;
        }
    }

    Linker(): string {
        let exec: string = '';

        exec += "ld.lld -r ";

        exec += `-o ${this.objectOutput}.lib `;

        for(let lib of this.objects) {
            exec += `${lib} `;
        }

        return exec;
    }

    Resource(): string {
        let exec: string = '';

        exec += "clang-rc ";

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
    }
}