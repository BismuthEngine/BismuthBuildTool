
// Imports/exports should be calculated at constructor() 
export default class Module {
    constructor(target: Target) {

    }

    // Module name
    Name: string = ""
    // Folders, that would be added to include list
    Includes: string[] = ["./"]
    // Specifies dependencies
    Imports: string[] = []
    // Specifies files to include into build pipeline
    Exports: string[] = []
    // Module(.cppm) that would be compiled as a module
    ModuleEntry: string
    // C++20 Modules support, if false, compile legacy (excludes from BMT)
    Module: boolean = true
    // Legacy compilation files
    CompileFiles: string[] = []
    // Auto-generate PCM files for this module, using Bismuth Module Tool
    UseBMT: boolean = true

    // Options to pass when linking
    LinkerOptions: string[] = []
}