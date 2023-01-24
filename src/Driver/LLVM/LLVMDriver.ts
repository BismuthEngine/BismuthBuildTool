import Driver from "../Driver.js"

export default class LLVMDriver extends Driver {

    Compiler(): string {
        let comp: string = '';
        let precomp: string = '';

        precomp = comp = `clang++ -Wall -std=${this.standard} `;
        
        if(this.interface){
            comp += `-fmodules `;
            precomp += `-fmodules `;
            precomp += `--precompile -o ${this.precompiledOutput}.pcm `;
        };

        if(this.useLinker) {
            comp += "-c ";
        } else {
            comp += "-fuse-ld=lld ";
        }

        precomp += `${this.sourceFile} `;
        comp += `${this.sourceFile} `;

        for(let pcm of this.precompiled) {
            precomp += `-fmodule-file=${pcm}.pcm `; 
            comp += `-fmodule-file=${pcm}.pcm `;
        }

        for(let def of this.defines) {
            precomp += `-D${def} `;
            comp += `-D${def} `;
        }
    
        if(this.emmitDebugSymbols) {
            precomp += `-g `;
            comp += `-g `;
        }
    
        switch(this.optimizationLevel) {
            case "Debug":
                precomp += "-O0 "; 
                comp += "-O0 ";
                break;
            case "Performance":
                precomp += "-Ofast "; 
                comp += "-Ofast ";
                break;
            case "Space":
                precomp += "-Os "; 
                comp += "-Os ";
                break;
        }
    
        for(let dir of this.precompiledSearchDir) {
            precomp += `-fprebuild-module-path=${dir} `; 
            comp += `-fprebuild-module-path=${dir} `;
        }
    
        for(let incl of this.includes) {
            precomp += `-I${incl} `; 
            comp += `-I${incl} `;
        }
    
        if(this.debugOutput.length > 0) {
            // exec += `/Fd"${this.debugOutput}" `;
        }
        if(this.useLinker == false) {
            comp += `-o ${this.objectOutput}.obj `;
        } else {
            // Executable
            let ext = 'exe';
            comp += `-o ${this.objectOutput}.${ext} `;
        }
        precomp += `-o ${this.objectOutput}.pcm `;

        for(let lib of this.objects) {
            precomp += `${lib} `;
            comp += `${lib} `;
        }

        if(this.interface) {
            return `${precomp} && ${comp}`;
        } else {
            return comp;
        }
    }

    Linker(): string {
        let exec: string = '';

        switch(this.platform) {
            case "Win32":
                exec += "lld-link /lib ";
                exec += `/out:${this.objectOutput}.lib `;
                break;
            case "Unix":
                exec += "ld.lld -r ";
                exec += `-o ${this.objectOutput}.lib `;
                break;
            case "Mach":
                exec += "ld64.lld -r ";
                exec += `-o ${this.objectOutput}.lib `;
                break;
            case "WebASM":
                exec += "wasm-ld ";
                exec += `-o ${this.objectOutput}.wasm `;
                break;
        }

        for(let lib of this.objects) {
            exec += `${lib} `;
        }

        return exec;
    }

    Resource(): string {
        let exec: string = `llvm-rc /FO ${this.objectOutput} ${this.sourceFile}`;

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