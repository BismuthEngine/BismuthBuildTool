type Platform = "Win32" | "Mach" | "Unix" | "WebASM";
type Arch = "x86_32" | "x86_64" | "ARM_32" | "ARM_64";
type Toolkit = "clang" | "msvc" | "emscripten";

interface Target {
    platform: Platform,
    arch: Arch,
    // If false, project won't be linked against Bismuth Engine (Should be false only when compiling engine & tools)
    includeEngine: boolean,
    enginePath: string, 
    projectPath: string,
    outputhPath: string
    EnvArgs: NodeJS.ProcessEnv,
    entry: string,
    configuration: string,
    debug: boolean,
    verbose: boolean,
    name: string,
    saveToFile: string,
    toolkit: Toolkit | undefined
}