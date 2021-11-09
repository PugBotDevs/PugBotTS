import { Message } from "discord.js";
import { isAdmin } from "../../libs/Authority";
import PickupConfig from "../../structures/PickupConfig";
import PugClient from "../../structures/PugClient";

const callback = async(message: Message, args: string[], client: PugClient) => {
    // Fetch PickupChannel
    let pickupChannel = await client.pickups.fetchChannel(message.channel);

    // Check if user is authorized to perform the action
    if(!isAdmin(message.member, pickupChannel)) return message.channel.send("You are not allowed to do that!");

    // Check if the PickupChannel exists
    if(!pickupChannel) return message.channel.send("This channel has not yet been configured for pickups");

    // Verify input
    let property = args[0].toLowerCase(), value = args[1];
    if(!property || !value) return message.channel.send("You need to specify a configuration property and its desired value");
    
    // Check if specified property is valid
    if(!PickupConfig.defaults.keyArray().includes(property)) return message.channel.send("Invalid configuration property!");

    // Validate value for the property

}

export default {
    name: "configure",
    alias: ["config"],
    callback
}