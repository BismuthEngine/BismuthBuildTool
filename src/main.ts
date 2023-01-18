#!/usr/bin/env node

import Builder from "./Builder/builder.js";
import CreateBuilderInstance from "./Builder/builder.factory.js";
import ParseArguments from "./arguments.js"
import Utils from "./utils.js";
import { exec, execSync } from "child_process";
import chalk from "chalk";
import { exit } from "process";
import Crawler from "./Crawler/Crawler.js";
import { ModuleList, MultiModuleList } from "./Types/ModuleList.js";
import Solver from "./Solver/Solver.js";
import { Stage, Timeline } from "./Types/Timeline.js";

import { fileURLToPath } from 'url';
import { dirname, resolve, join } from 'path';
import { existsSync, readdirSync, lstatSync } from "fs";
import { CheckClangInstallation, CheckGitInstallation, CheckMSVCInstallation } from "./installs.js";

const __dirname = resolve();

const args: Arguments = ParseArguments(process.argv);

const extractProjDir = (path: string) => {
    return (/\.bismuth/.test(path) ? dirname(path) : path)
}

const target: Target = {
    platform: args.platform.isUsed ? args.platform.arg : Utils.GetPlatform(process.platform),
    arch: args.arch.isUsed ? args.arch.arg : Utils.GetArch(process.arch),
    includeEngine: args.project.isUsed,
    enginePath: "",
    entry: "",
    projectPath: (args.project.isUsed ? resolve(__dirname, extractProjDir(args.project.arg)) : (args.compile.isUsed ? resolve(__dirname, extractProjDir(args.compile.arg)) : "")),
    EnvArgs: process.env,
    configuration: (args.Configuration.isUsed ? args.Configuration.arg : ""),
    debug: args.Debug,
    outputhPath: (args.Output.isUsed ? args.Output.arg : "./Build"),
    verbose: args.Verbose,
    name: "",
    saveToFile: (args.SaveToFile.isUsed) ? args.SaveToFile.arg : "",
    toolkit: (args.Toolkit.isUsed) ? (args.Toolkit.arg as Toolkit) : undefined
}

var project: Project;
var engineProject: Project;

//console.log(target)

// ensure correct arguments
if((!args.compile.isUsed && !args.project.isUsed)) {
    console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("Invalid arguments! \n") + 
                chalk.redBright.bold("[ERROR] ") +  chalk.redBright("See https://github.com/BismuthEngine/BismuthBuildTool for usage"));
    exit(-1);
}

// Retrieve project file
try {
    project = Utils.ReadJSON(Utils.GetFilesFiltered(target.projectPath, /\.bismuth/)[0]);

    target.name = project.Name;
    
    if(args.project.isUsed) {
        if(project.EnginePath) {
            target.enginePath = project.EnginePath;
            // Fetch engine's project file
            try {
                engineProject = Utils.ReadJSON(Utils.GetFilesFiltered(target.enginePath, /\.bismuth/)[0]);
                /*if(engineProject.Entry) {
                    target.entry = engineProject.Entry;
                } else {
                    console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("No Entry specified in Bismuth.project.json! That must be our bad, see https://github.com/BismuthEngine/BismuthBuildTool"));
                    exit(-1);
                }*/
            } catch (err) {
                console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("No engine's .bismuth file found! Check that engine is installed and reference is updated."));
                exit(-1);
            }
        } else {
            console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("No EnginePath specified in .bismuth!"));
            exit(-1);
        }
    } else if(args.compile.isUsed) {
        /*if(project.Entry) {
            target.entry = project.Entry;
        } else {
            console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("No Entry specified in your project's .project.json!"));
            exit(-1);
        }*/
    }
} catch (err) {
    console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("No correct .bismuth file provided!"));
    exit(-1);
}

const CompilationToolkit: Toolkit = Utils.GetToolkit(target);

if(CompilationToolkit == "Clang") {
    CheckClangInstallation();
} else if(CompilationToolkit == "MSVC"){
    CheckMSVCInstallation();
}

CheckGitInstallation();

console.log(chalk.bold("[LOG] ") + `Compiling ${project.Name}`);

const CrawlerInstance = new Crawler(target);

CrawlerInstance.CollectModules().then(async (list: MultiModuleList)=>{
    let SolverInstance = new Solver(target, list);
    
    let TimelineInstance = SolverInstance.Solve();

    let BuilderInstance: Builder = CreateBuilderInstance(target, TimelineInstance);
    
    console.log(chalk.bold('======== BUILDER ========'));
    //console.log(TimelineInstance);
    // This would compile all solved modules
    BuilderInstance.Compile().then((result) => {
        // Link everything into executable
        BuilderInstance.Finalize().then(()=>{
            console.log(chalk.bold('======== SUCCESS ========'));
        }).catch((reason)=>{
            console.log(reason);
            console.log(chalk.bold.redBright('======== FAILED ========'));
        });
    }).catch((reason)=>{
        console.log(reason);
        console.log(chalk.bold.redBright('======== FAILED ========'));
    });
    //console.log(chalk.bold('======== FINISHED ========'));
});