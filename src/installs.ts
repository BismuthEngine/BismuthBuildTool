import chalk from "chalk";
import { execSync } from "child_process";
import { exit } from "process";

export function CheckClangInstallation() {
    try {
        execSync("clang++ --version", {stdio: 'ignore'})
        console.log(chalk.greenBright.bold("[OK] ") + chalk.greenBright("Found Clang compiler"));
    } catch(error) {
            console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("Tried compiling with LLVM Clang, but it "+
            "is not installed or configured properly!"));
            exit(-1);
     };
}

export function CheckMSVCInstallation() {
    try {
        execSync("cl", {stdio: 'ignore'})
        console.log(chalk.greenBright.bold("[OK] ") + chalk.greenBright("Found MSVC compiler"));
    } catch(error) {
            console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("Tried compiling with MSVC Compiler, but it "+
            "is not installed or configured properly!"));
            exit(-1);
     };
}

export function CheckGitInstallation() {
    try {
        execSync("git --version", {stdio: 'ignore'})
        console.log(chalk.greenBright.bold("[OK] ") + chalk.greenBright("Found Git"));
    } catch(error) {
            console.log(chalk.redBright.bold("[ERROR] ") + chalk.redBright("Git is essential for bismuth build tool. It's not found. You may download git from https://git-scm.com/"));
            exit(-1);
     };
}