import chalk from "chalk";
import { execSync } from "child_process";
import { accessSync, createWriteStream, mkdirSync } from "fs";
import { get } from "http";
import { resolve } from "path";
import { exit } from "process";

// Guarantees local calls for deploy modules
export default class DeployAPI {
    path: string = "";

    GitClone(git: string) {
        try{
            try{
                accessSync(resolve(this.path, './Deploy'))
            } catch(err){
                mkdirSync(resolve(this.path, './Deploy'));
            }
            execSync(`git clone ${git} `, {cwd: resolve(this.path, './Deploy')});
        } catch(err) {
            console.log(chalk.bgRedBright.bold("[DEPLOY-API] ") + chalk.bgRedBright(`Failed Git Clone from ${git}`));
            exit(-1);
        }
    }

    async Download (source: string, target: string): Promise<boolean> {
        return new Promise<boolean>((res, rej)=>{
            const file = createWriteStream(resolve(this.path, target));
            const request = get(source, function(response) {
                response.pipe(file);

                file.on("finish", () => {
                    file.close();
                    console.log(chalk.yellowBright.bold("[DEPLOY-API] ") + chalk.yellowBright(`Downloaded ${target} from '${source}'`));
                    res(true);
                });

                file.on("error", (err)=>{
                    console.error(err);
                    res(false);
                })
            });
        });
    }

    Exec(cmd: string) {
        try{
            execSync(cmd, {cwd: this.path});
        } catch(err) {
            console.log(chalk.redBright.bold("[DEPLOY-API] ") + chalk.redBright(`Failed executing: ${cmd}`));
            exit(-1);
        }
    }

    Unpack() {
        
    }

    Move() {
        
    }

    CreateDir(path: string) {
        try{
            mkdirSync(resolve(this.path, path), {recursive: true});
        } catch(err) {

        }
    }

    Manifest() {
        
    }

    Halt() {
        exit(-1);
    }

    Log(data: any[]) {
        console.log(chalk.yellowBright("[DEPLOY-API] ") + data);
    }

    Color() {
        return chalk;
    }
}