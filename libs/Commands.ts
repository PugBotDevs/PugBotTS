import { Collection } from "discord.js";
import { lstatSync, readdirSync } from "fs";
import { join } from "path";

async function readCommands(path){
    const folders = readdirSync(path);
    let modules: string[] = []
    let commands: Collection<string, { name: string, module: string, aliases: string[], callback: Function }> = new Collection()
    let aliases: any = {};
    
    for(let module of folders) {
        // Check if the file is a folder
        if(lstatSync(join(path, module)).isDirectory()){
            modules.push(module);

            // Read module folder for commands
            let files = readdirSync(join(path, module)).filter(file => file.endsWith(".js"));

            for(let file of files){
                let command = (await import(join(path, module, file))).default;
                
                // Validate command exports
                if(typeof command.name == "string" && command.aliases instanceof Array && command.callback instanceof Function){
                    command.module = module;
                    commands.set(command.name, command);
                    command.aliases.forEach(a => aliases[a] = command.name);
                } else {
                    console.warn(`Couldn't load command "${file}" from ${join(path, module)}`, command);
                }
            }
        }
    }

    return { modules, commands, aliases };
}

export default readCommands;