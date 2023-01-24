import Driver from "../Driver.js"

export default class EmscriptenDriver extends Driver {

    Compiler(): string {
        let exec: string = ' ';
        
        return exec;
    }

    Linker(): string {
        let exec: string = "";

        return exec;
    }

    Flush(): string {
        let exec: string = '';

        if(this.platform != "WebASM") {
            throw "Emscripten does not support any compilation target, except of WebASM";
        }

        switch(this.executor) {
            case "Compiler":
               return this.Compiler();
                break;
            case "Linker":
                return this.Linker();
                break;
        }

        return exec;
    }
}