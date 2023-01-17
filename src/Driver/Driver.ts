
type OptimizationLevel = "Debug" | "Performance" | "Space";
type Executor = "Linker" | "Compiler" | "Resource";

export default class Driver {
    protected executor: Executor = 'Compiler';

    protected optimizationLevel: OptimizationLevel = "Performance";
    protected emmitDebugSymbols: boolean = false;

    protected interface: boolean = false;

    // Inputs
    protected sourceFile: string = '';
    protected precompiled: string[] = [];
    protected objects: string[] = [];
    protected defines: string[] = [];
    protected includes: string[] = [];
    protected precompiledSearchDir: string[] = [];

    protected compile: boolean = true;

    protected objectOutput: string = '';
    protected precompiledOutput: string = '';
    protected debugOutput: string = '';

    protected arch: Arch = "x86_64";
    protected platform: Platform = "Win32";

    Branch = (): Driver => {return {...this};}

    SetExecutor(executor: Executor) {
        this.executor = executor;
    }
    
    SetSource(source: string) {
        this.sourceFile = source;
    }

    SetArch(arch: Arch) {
        this.arch = arch;
    }

    SetPlatform(platform: Platform) {
        this.platform = platform;
    }

    AddPrecompiledSearchDir(path: string) {
        this.precompiledSearchDir.push(path);
    }
    AddInclude(path: string) {
        this.includes.push(path);
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