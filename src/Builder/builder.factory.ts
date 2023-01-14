import Builder from "./builder.js"
import LLVMBuilder from "./llvm/llvm.builder.js"
import MSVCBuilder from "./msvc/msvc.builder.js"
import { Timeline } from "../Types/Timeline.js";

export default function CreateBuilderInstance(target: Target, timeline: Timeline): Builder
{
    return new MSVCBuilder(target, timeline);
}