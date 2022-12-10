
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
    UpdateEngine: boolean,
    EditorCompilation: boolean,
    NoBMT: boolean,
    Debug: boolean
}