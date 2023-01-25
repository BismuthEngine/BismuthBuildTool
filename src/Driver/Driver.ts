import chalk from "chalk";

type OptimizationLevel = "Debug" | "Performance" | "Space";
type Executor = "Linker" | "Compiler" | "Resource";
type Standard = "c++11" | "c++17" | "c++20" | "c++23" | "c++latest" | "c99" | "c17"

export default class Driver {
    // Mode
    protected executor: Executor = 'Compiler';

    // Debug
    protected optimizationLevel: OptimizationLevel = "Performance";
    protected emmitDebugSymbols: boolean = false;

    // Language
    protected standard: Standard = "c++20";

    // C++20
    protected interface: boolean = false;

    // Inputs
    protected sourceFile: string = '';
    protected precompiled: string[] = [];
    protected objects: string[] = [];
    protected defines: string[] = [];
    protected includes: string[] = [];
    protected precompiledSearchDir: string[] = [];

    // Compiler
    protected useLinker: boolean = true;

    // Output
    protected objectOutput: string = '';
    protected precompiledOutput: string = '';
    protected debugOutput: string = '';

    // Platform
    protected arch: Arch = "x86_64";
    protected platform: Platform = "Win32";

    static Branch = (example: Driver): Driver => {
        let drv: Driver = Object.assign(Object.create(Object.getPrototypeOf(example)), example);

        drv.objects = [...example.objects];
        drv.precompiled = [...example.precompiled];
        drv.defines = [...example.defines];
        drv.includes = [...example.includes];

        return drv;
    }

    SetExecutor(executor: Executor) {
        this.executor = executor;
    }

    SetStandard(std: Standard) {
        this.standard = std;
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

    WipePrecompiled() {
        this.precompiled = [];
    }

    AddObject(path: string) {
        this.objects.push(path);
    }

    WipeObjects() {
        this.objects = [];
    }

    AddDefine(define: string) {
        this.defines.push(define);
    }

    WipeDefines() {
        this.defines = [];
    }

    Wipe() {
        this.WipeObjects();
        this.WipePrecompiled();
        this.WipeDefines();
    }

    EmmitDebugSymbols() {
        this.emmitDebugSymbols = true;
    }

    Optimization(level: OptimizationLevel) {
        this.optimizationLevel = level;
    }

    Interface(inter: boolean) {
        this.interface = inter;
    }

    UseLinker(use: boolean) {
        this.useLinker = use;
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