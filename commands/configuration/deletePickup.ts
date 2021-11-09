import { Message } from "discord.js"
import { isAdmin } from "../../libs/Authority";
import PugClient from "../../structures/PugClient"

const callback = async(message: Message, args: string[], client: PugClient) => {
    let name = args[0]

    // Fetch PickupChannel
    let pickupChannel = await client.pickups.fetchChannel(message.channel);

    // Check if user is authorized to perform the action
    if(!isAdmin(message.member, pickupChannel)) return message.channel.send("You are not allowed to do that!");

    // Check if the PickupChannel exists
    if(!pickupChannel) return message.channel.send("This channel has not yet been configured for pickups");

    // Verify input
    if(!name) return message.channel.send("You need to specify a name for the pickup to delete");
    
    // Check if the Pickup exists
    let index = pickupChannel.pickups.findIndex(pickup => pickup.name == name);
    if(index == -1) return message.channel.send(`Could not find a pickup with name \`${name}\``);

    // Check if the Pickup has any active Games
    let pickup = pickupChannel.pickups[index];
    if(pickup.games.length > 0) return message.channel.send(`Pickup \`${pickup.name}\` has active games ${pickup.games.map(game => "`" + game.count + "`").join(", ")}`);

    // Remove Pickup
    let res = pickupChannel.removePickup(pickup.name);
    if(!res) return message.channel.send(`Something went wrong...`);
    
    message.channel.send(`Removed pickup \`${name}\`!`);
}

export default {
    name: "delete_pickup",
    aliases: [],
    callback
}