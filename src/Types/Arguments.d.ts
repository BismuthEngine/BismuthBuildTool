
interface Arguments {
    compile: {
        isUsed: boolean,
        arg: string
    },
    project: {
        isUsed: boolean,
        arg: string
    },
    platform: {
        isUsed: boolean,
        arg: Platform
    },
    arch: {
        isUsed: boolean,
        arg: Arch
    },
    VisualStudioProject: {
        isUsed: boolean,
        arg: string
    },
    Shipping: {
        isUsed: boolean,
        arg: string
    },
    Output: {
        isUsed: boolean,
        arg: string
    },
    UpdateEngine: boolean,
    Configuration: {
        isUsed: boolean,
        arg: string
    },
    SaveToFile: {
        isUsed: boolean,
        arg: string
    },
    Toolkit: {
        isUsed: boolean,
        arg: string
    },
    NoBMT: boolean,
    Debug: boolean,
    Verbose: boolean
}