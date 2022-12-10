import { Timeline } from "./Timeline"

type CompilationError = "A" | "B"

interface BuilderPipeline {
    Entry: string,
    BismuthProject: boolean,
    // Only set if BismuthProject == true
    // Would be compiled before Project
    EngineTimeline?: Timeline | undefined,
    ProjectTimeline: Timeline,
    Target: Target
}