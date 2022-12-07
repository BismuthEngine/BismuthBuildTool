
// Imports/exports should be calculated at constructor() 
export default class Module {
    constructor(target: Target) {

    }

    // Module name
    Name: string = ""
    // Folders, that would be added to include list
    Include: string[] = ["./"]
    // Specifies dependencies
    Import: string[] = []
    // These modules would be exported with this module's code
    Export: string[] = []
    // Module(.cppm) that would be compiled as a module
    ModuleEntry: string = ""
    // C++20 Modules support, if false, compile legacy (excludes from BMT)
    Module: boolean = true
    // Legacy compilation files
    CompileFiles: string[] = []
    // Auto-generate PCH files for this module, using Bismuth Module Tool
    UseBMT: boolean = true
}