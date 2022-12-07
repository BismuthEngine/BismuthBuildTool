import FetchAPI from "./FetchAPI"

export default class Deploy {
    constructor(target: Target) {
        
    }

    // Name of deploy module
    Name: string = ""
    // Include directories
    Includes: string[] = []
    // Static libs
    StaticLibs: string[] = []
    // Dynamic libs
    DynamicLibs: string[] = []
    // Precompiled modules (result of .cppm compilation)
    PCM: string[] = []
    // Options that would be passed to compiler as -l{option}
    LinkerOptions: string[] = []
    // License
    License: string = "";

    // Seeks, downloads, installs module and returns deployment information
    async Deploy(fetch: FetchAPI): Promise<any> {
        return new Promise<any>((resolve, reject) => {
                resolve(this);
        });
    }
}