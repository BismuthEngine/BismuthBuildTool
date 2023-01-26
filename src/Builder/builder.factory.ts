import Builder from "./builder.js"
import LLVMBuilder from "./llvm/llvm.builder.js"
import MSVCBuilder from "./msvc/msvc.builder.js"
import { Timeline } from "../Types/Timeline.js";
import Driver from "../Driver/Driver.js";
import Utils from "../utils.js";
import { platform } from "process";
import MSVCDriver from "../Driver/MSVC/MSVCDriver.js";
import EmscriptenDriver from "../Driver/Emscripten/EmscriptenDriver.js";
import LLVMDriver from "../Driver/LLVM/LLVMDriver.js";
import DriverBuilder from "./DriverBuilder.js";

export default function CreateBuilderInstance(target: Target, timeline: Timeline): Builder
{
    let driver: Driver;

    if(target.toolkit == undefined) {
        if((target.platform == Utils.GetPlatform(platform)) && (target.platform == "Win32")) {
            driver = new MSVCDriver();
        } else {
            if(target.platform == "WebASM") {
                driver = new EmscriptenDriver();
            } else {
                driver = new LLVMDriver();
            }
        }
    } else {
        switch(target.toolkit) {
            case "clang":
                driver = new LLVMDriver();
                break;
            case "msvc":
                driver = new MSVCDriver();
                break;
            case "emscripten":
                driver = new EmscriptenDriver();
        }
    }
    
    return new DriverBuilder(target, timeline, new LLVMDriver());
    return new LLVMBuilder(target, timeline);
}