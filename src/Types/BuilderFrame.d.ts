import { Stage } from "./Timeline";

interface BuilderFrame {
    CurrentStage: Stage | any,
    PreviousStages: Stage[]
}