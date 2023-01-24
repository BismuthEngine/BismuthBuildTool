import DeployAPI from "./DeployAPI"

export default class Deploy {
    constructor(target: Target) {
        
    }

    // Name of deploy module
    Name: string = ""
    // Include directories
    Includes: string[] = []
    // Static libs (.o, .lib)
    StaticLibs: string[] = []
    // Dynamic libs
    DynamicLibs: string[] = []
    // Precompiled modules (result of .cppm compilation)
    PCM: string[] = []
    // Options that would be passed to compiler as -l{option}
    LinkerOptions: string[] = []
    // License 
    License: string = ""

    // If true, passed to Builder as compilation target
    Compiled: boolean = false
    // If true, Produces DLL. Inserted into executable as static library otherwise.
    DLL: boolean = false

    // Seeks, downloads, installs module and returns deployment information
    async Deploy(fetch: DeployAPI): Promise<any> {
        return new Promise<any>((resolve, reject) => {
                resolve(this);
        });
    }
}