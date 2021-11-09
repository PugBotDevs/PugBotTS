import { Message } from "discord.js"
import PugClient from "../../structures/PugClient"

const callback = async(message: Message, args: string[], client: PugClient) => {
    // Check if the user is the owner of the guild
    if(message.member.id != message.guild.ownerID) return message.channel.send("You're not allowed to do that!");

    // Fetch PickupChannel
    let pickupChannel = await client.pickups.fetchChannel(message.channel);

    // Verify input
    let roleId = args[0];
    if(!roleId) return message.channel.send("You need to provide a role ID!");

    // Check if role exists
    let role = await message.guild.roles.fetch(roleId);
    if(!role) return message.channel.send(`Could not find role with ID \`${roleId}\``);

    // Set admin role
    role = await pickupChannel.setAdmin(role);

    message.channel.send(`Set role \`${role.name}\` as admin role`);
}

export default {
    name: "set_administrator",
    aliases: ["set_admin"],
    callback
}