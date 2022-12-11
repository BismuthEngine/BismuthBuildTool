import { Stage, StagedModuleInfo } from "./Timeline";

interface BuilderFrame {
    CurrentStage: Stage | any,
    PreviousModules: StagedModuleInfo[]
}