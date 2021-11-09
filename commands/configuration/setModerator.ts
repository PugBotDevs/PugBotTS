import { Message } from "discord.js"
import PugClient from "../../structures/PugClient"
import { isAdmin } from "../../libs/Authority"

const callback = async(message: Message, args: string[], client: PugClient) => {
    // Fetch PickupChannel
    let pickupChannel = await client.pickups.fetchChannel(message.channel);

    // Check if user is authorized to perform the action
    if(!isAdmin(message.member, pickupChannel)) return message.channel.send("You are not allowed to do that!");

    // Verify input
    let roleId = args[0];
    if(!roleId) return message.channel.send("You need to provide a role ID!");

    // Check if role exists
    let role = await message.guild.roles.fetch(roleId);
    if(!role) return message.channel.send(`Could not find role with ID \`${roleId}\``);

    // Set modrole
    role = await pickupChannel.setMod(role);

    message.channel.send(`Set role \`${role.name}\` as moderator role`)
}

export default {
    name: "set_moderator",
    aliases: ["set_mod"],
    callback
}