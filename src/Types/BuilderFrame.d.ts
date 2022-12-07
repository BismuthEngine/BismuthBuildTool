import { Stage } from "./Timeline";

interface BuilderFrame {
    CurrentStage: Stage,
    PreviousStages: Stage[]
}