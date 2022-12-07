import Builder from "./builder.js"
import LLVMBuilder from "./Builders/llvm.builder.js"
import MSVCBuilder from "./Builders/msvc.builder.js"

export default function CreateBuilderInstance(target: Target): Builder
{
    return new LLVMBuilder(target);
}