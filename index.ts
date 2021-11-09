import { config } from "dotenv";
import PugClient from "./structures/PugClient";
config();

const client = new PugClient("!", __dirname + "/commands");

client.on("ready", async () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);

