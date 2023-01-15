
type OptimizationLevel = "Debug" | "Performance" | "Space";
type Executor = "Linker" | "Compiler";

export default class Driver {
    protected executor: Executor = 'Compiler';

    protected optimizationLevel: OptimizationLevel = "Performance";
    protected emmitDebugSymbols: boolean = false;

    protected interface: boolean = false;

    protected precompiled: string[] = [];
    protected objects: string[] = [];
    protected defines: string[] = [];

    protected compile: boolean = true;

    protected objectOutput: string = '';
    protected precompiledOutput: string = '';
    protected debugOutput: string = '';

    protected precompiledSearchDir: string[] = [];

    Branch = (): Driver => {return {...this};}

    AddPrecompiledSearchDir(path: string) {
        this.precompiledSearchDir.push(path);
    }

    SetExecutor(executor: Executor) {
        this.executor = executor;
    }

    AddPrecompiled(path: string) {
        this.precompiled.push(path);
    }

    AddObject(path: string) {
        this.objects.push(path);
    }

    AddDefine(define: string) {
        this.defines.push(define);
    }

    EmmitDebugSymbols() {
        this.emmitDebugSymbols = true;
    }

    Optimization(level: OptimizationLevel) {
        this.optimizationLevel = level;
    }

    Interface() {
        this.interface = true;
    }

    SetCompile(compile: boolean) {
        this.compile = compile;
    }

    SetObjectOutput(path: string) {
        this.objectOutput = path;
    }

    SetDebugOutput(path: string) {
        this.debugOutput = path;
    }

    SetPrecompiledOutput(path: string) {
        this.precompiledOutput = path;
    }

    Flush(): string {
        return '';
    }
}