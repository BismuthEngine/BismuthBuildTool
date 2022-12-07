import Utils from "./utils.js";

export default function (args: string[]): Arguments {
    let result: Arguments = {
        compile: {
            isUsed: false,
            arg: ""
        },
        project: {
            isUsed: false,
            arg: ""
        },
        platform: {
            isUsed: false,
            arg: "Win32"
        },
        arch: {
            isUsed: false,
            arg: "x86_32"
        },
        UpdateEngine: false,
        EditorCompilation: false,
        NoBMT: false,
        VisualStudioProject: {
            isUsed: false,
            arg: ""
        },
        Shipping: {
            isUsed: false,
            arg: ""
        }
    };

    for(let i = 0; i < args.length; i++)
    {
        let argument = args[i];
        switch(argument)
        {
            case "--project":
                result.project.isUsed = true;
                i++;
                argument = args[i];
                result.project.arg = argument;
                break;
            case "--compile":
                result.compile.isUsed = true;
                i++;
                argument = args[i];
                result.compile.arg = argument;
                break;
            case "-U":
                result.UpdateEngine = true;
                break;
            case "--editor":
                result.EditorCompilation = true;
                break;
            case "--platform":
                result.platform.isUsed = true;
                i++;
                argument = args[i];
                result.platform.arg = Utils.GetPlatform(argument);
                break;
            case "--arch":
                result.arch.isUsed = true;
                i++;
                argument = args[i];
                result.arch.arg = Utils.GetArch(argument);
                break;
            case "--no-bmt":
                result.NoBMT = true;
                break;
            case "--vsproj":
                result.VisualStudioProject.isUsed = true;
                i++;
                argument = args[i];
                result.VisualStudioProject.arg = argument;
                break;
            case "--shipping":
                result.Shipping.isUsed = true;
                i++;
                argument = args[i];
                result.Shipping.arg = argument;
                break;
        }
    }

    return result;
}