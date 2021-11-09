import { Message } from "discord.js"
import { isAdmin } from "../../libs/Authority";
import PugClient, { PickupChannel } from "../../structures/PugClient"

const callback = async(message: Message, args: string[], client: PugClient) => {
    // Check if the PickupChannel already exists
    let pickupChannel: PickupChannel = await client.pickups.fetchChannel(message.channel);

    // Check if user is authorized to perform the action
    if(!isAdmin(message.member, pickupChannel)) return message.channel.send("You are not allowed to do that!");

    // If not, create a new PickupChannel
    if(!pickupChannel) pickupChannel = await client.pickups.createChannel(message.channel);

    // Verify arguments
    let name = args[0], size = ~~args[1];
    if(!name && !size) return message.channel.send("You need to specify a name and size for the pickup!");
    if(size == NaN || size < 2 || size % 2 != 0) return message.channel.send("The pickup size must be a natural number divisible by 2.");

    // Check if pickup already exists
    if(pickupChannel.pickups.some(pickup => pickup.name == name)) return message.channel.send(`Pickup with name \`${name}\` already exists!`);

    // Create new Pickup
    let pickup = await pickupChannel.createPickup(name, size);

    message.channel.send(`Created pickup \`${pickup.name}\` with ${pickup.size / 2} players for each team`);
}

export default {
    name: "create_pickup",
    aliases: [],
    callback,
}