import { Snowflake } from "discord.js";
import { PickupConfigData } from "./PickupConfig";

interface PickupChannelData {
    id: string;
    adminrole: Snowflake;
    modrole: Snowflake;
    config: PickupConfigData;
    count: number;
    pickups: PickupData[];
}

interface PickupData {
    name: string;
    size: number;
    config: PickupConfigData;
}

export { PickupChannelData, PickupData };