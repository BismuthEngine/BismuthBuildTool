#!/usr/bin/env node

import Builder from "./builder.js";
import CreateBuilderInstance from "./builder.factory.js";
import ParseArguments from "./arguments.js"
import Utils from "./utils.js";
import { execSync } from "child_process";
import chalk from "chalk";
import { exit } from "process";
import Crawler from "./Crawler/Crawler.js";
import { ModuleList, MultiModuleList } from "./Types/ModuleList.js";
import Solver from "./Solver/Solver.js";
import { Stage, Timeline } from "./Types/Timeline.js";

import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { existsSync, readdirSync, lstatSync } from "fs";

const __dirname = resolve();

const args: Arguments = ParseArguments(process.argv);

const target: Target = {
    platform: args.platform.isUsed ? args.platform.arg : Utils.GetPlatform(process.platform),
    arch: args.arch.isUsed ? args.arch.arg : Utils.GetArch(process.arch),
    includeEngine: args.project.isUsed,
    enginePath: "",
    entry: "",
    projectPath: (args.project.isUsed ? resolve(__dirname, args.project.arg) : (args.compile.isUsed ? resolve(__dirname, args.compile.arg) : "")),
    EnvArgs: process.env,
    editorMode: args.EditorCompilation
}

var project: Project;
var engineProject: Project;

//console.log(target)

// ensure correct arguments
if((!args.compile.isUsed && !args.project.isUsed)) {
    console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("Invalid arguments! \n") + 
                chalk.redBright.bold("[ERROR] ") +  chalk.redBright("See https://github.com/ for usage"));
    exit(-1);
}

// Check if Bismuth tool should be used and is installed
if(!args.NoBMT) {
    try {
        execSync("bismuth-module-tool", {stdio: 'ignore'})
        console.log(chalk.greenBright.bold("[OK] ") + chalk.greenBright("Found Bismuth Module Tool"));
    } catch(error) {
            console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("No --no-bmt detected, "+
            "so Bismuth Module Tool should be used, however it's not installed!") +
            chalk.redBright("\n\tIt's usually installed by installation script, but you may download it from https://github.com/"));
            exit(-1);
     };
} else {
    console.log(chalk.yellowBright.bold("[WARN] ") + chalk.yellowBright("\tSkipped Bismuth Module Tool\n") +
    chalk.yellowBright("\tYou shouldn't skip Module-Tool pass in most cases!"));
}

// Retrieve project file
try {
    project = Utils.ReadJSON(Utils.GetFilesFiltered(target.projectPath, /.project.json/)[0]);
    if(args.project.isUsed) {
        if(project.EnginePath) {
            target.enginePath = project.EnginePath;
            // Fetch engine's project file
            try {
                engineProject = Utils.ReadJSON(Utils.GetFilesFiltered(target.enginePath, /.project.json/)[0]);
                if(engineProject.Entry) {
                    target.entry = engineProject.Entry;
                } else {
                    console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("No Entry specified in Bismuth.project.json! That must be our bad, see https://github.com/"));
                    exit(-1);
                }
            } catch (err) {
                console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("No engine's .project.json file found! Check that engine is installed and reference is updated."));
                exit(-1);
            }
        } else {
            console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("No EnginePath specified in .project.json!"));
            exit(-1);
        }
    }
} catch (err) {
    console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("No correct .project.json file provided!"));
    exit(-1);
}

function CheckClangInstallation() {
    try {
        execSync("clang++ --version", {stdio: 'ignore'})
        console.log(chalk.greenBright.bold("[OK] ") + chalk.greenBright("Found Clang compiler"));
    } catch(error) {
            console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("Tried compiling with LLVM Clang, but it "+
            "is not installed or configured properly!"));
            exit(-1);
     };
}

function CheckMSVCInstallation() {
    try {
        execSync("cl", {stdio: 'ignore'})
        console.log(chalk.greenBright.bold("[OK] ") + chalk.greenBright("Found MSVC compiler"));
    } catch(error) {
            console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("Tried compiling with MSVC Compiler, but it "+
            "is not installed or configured properly!"));
            exit(-1);
     };
}

const CompilationToolkit: Toolkit = Utils.GetToolkit(target);

if(CompilationToolkit == "Clang") {
    CheckClangInstallation();
} else if(CompilationToolkit == "MSVC"){
    CheckMSVCInstallation();
}

console.log(chalk.bold("[LOG] ") + `Compiling ${project.Name}`);

const CrawlerInstance = new Crawler(target);

async function CompileAll(BuilderInstance: Builder, TimelineInstance: Timeline): Promise<any> {
    return new Promise<any>(async (res, rej) => {
        for(let i = 0; i < TimelineInstance.Stages.length; i++) {
            //console.log(TimelineInstance.Stages[i]);
            BuilderInstance.PushStage(<Stage>TimelineInstance.Stages[i]);
            await BuilderInstance.Compile();
        }

        res(undefined);
    });
}

CrawlerInstance.CollectModules().then(async (list: MultiModuleList)=>{
    let SolverInstance = new Solver(target, list);
    
    let TimelineInstance = SolverInstance.Solve();

    let BuilderInstance: Builder = CreateBuilderInstance(target);
    
    console.log(chalk.bold('======== BUILDER ========'));
    //console.log(TimelineInstance);
    CompileAll(BuilderInstance, TimelineInstance).then((result) => {
        console.log(chalk.bold('======== SUCCESS ========'));
    });
    //console.log(chalk.bold('======== FINISHED ========'));
});