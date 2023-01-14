
export default class Rules {
    constructor(target: Target) {
        
    }

    // To exclude modules from unsupported platforms, should be calculated at Constructor
    Modules: string[] = []
    // Defines these definitions for each module in this project
    Defines: string[] = []
}