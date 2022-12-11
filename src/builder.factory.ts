import Builder from "./builder.js"
import LLVMBuilder from "./Builders/llvm.builder.js"
import MSVCBuilder from "./Builders/msvc.builder.js"
import { Timeline } from "./Types/Timeline.js";

export default function CreateBuilderInstance(target: Target, timeline: Timeline): Builder
{
    return new LLVMBuilder(target, timeline);
}