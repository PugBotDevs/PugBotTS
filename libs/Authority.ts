import { GuildMember } from "discord.js";
import { PickupChannel } from "../structures/PugClient";

function isAdmin(member: GuildMember, pickupChannel?: PickupChannel): Boolean {
    // If admin role is configured
    if(pickupChannel?.adminrole) {
        // Check if user has the admin role
        if(member.roles.cache.find(role => role.id == pickupChannel.adminrole)) return true;
    } else {
        // Check if user is a server admin
        if(member.permissions.has("ADMINISTRATOR")) return true;
    }

    return false;
}

export { isAdmin };