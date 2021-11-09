import { Client, ClientOptions, Collection, DMChannel, NewsChannel, Role, Snowflake, TextChannel, User } from "discord.js";
import readCommands from "../libs/Commands";
import { PickupChannelData, PickupData } from "./Database";
import Destroyable from "./Destroyable";
import { AlreadyExistsError, DoesNotExistError, HasActiveChildError } from "./Errors";
import Mongo from "./Mongo";
import PickupConfig from "./PickupConfig";

type Channel = TextChannel | DMChannel | NewsChannel

class PugClient extends Client {
    prefix: string;
    pickups: PickupsManager;
    puggers: PuggerManager;
    mongo: Mongo;

    commandDir: string;
    modules: string[];
    commands: Collection<string, { name: string, module: string, aliases: string[], callback: Function }>;
    aliases: any;

    constructor(prefix: string, commandDir: string, options?: ClientOptions) {
        super(options);
        this.prefix = prefix;
        this.commandDir = commandDir;
        this.pickups = new PickupsManager(this);
        this.puggers = new PuggerManager(this);

        this.mongo = new Mongo();
        this.on("ready", this.initialize);
    }

    async initialize() {
        // Initialize Database
        await this.mongo.initialize();
    
        // Register Commands
        Object.assign(this, await readCommands(this.commandDir));

        this.on("message", message => {
            if(message.author.bot || !message.content.startsWith(this.prefix)) return;

            let args = message.content.substr(this.prefix.length).split(" ");
            let cmd = args.shift();

            (this.commands.get(cmd)?.callback || this.commands.get(this.aliases[cmd])?.callback)?.(message, args, this);
        });
    }
}

class PickupsManager {
    client: PugClient;
    channels: Collection<Snowflake, PickupChannel> = new Collection();

    constructor(client: PugClient) {
        this.client = client;
    }

    async fetchChannel(channel: Channel): Promise<PickupChannel> {
        // Attempt to fetch PickupChannel from client cache
        let pickupChannel = this.channels.get(channel.id);
        if(pickupChannel) return pickupChannel;

        // If not cached, attempt to fetch PickupChannelData from database
        let data = await this.client.mongo.channels.findOne({ id: channel.id.toString()});
        if(!data) return undefined;

        // If data is fetched, serialize PickupChannelData and cache PickupChannel
        pickupChannel = new PickupChannel(this.client, channel, data);
        this.channels.set(channel.id, pickupChannel);
        return pickupChannel;
    }

    async createChannel(channel: Channel): Promise<PickupChannel> {
        // Check if channel already exists
        if(await this.fetchChannel(channel)) throw new AlreadyExistsError("");

        // If not, create and cache new PickupChannel instance
        let pickupChannel = new PickupChannel(this.client, channel);
        this.channels.set(channel.id, pickupChannel);

        // Register PickupChannelData to the database
        await this.client.mongo.channels.insertOne(pickupChannel.deserialize());

        return pickupChannel;
    }

}

class PickupChannel extends Destroyable {
    client: PugClient;
    channel: Channel;
    id: Snowflake;
    count: number;
    adminrole: Snowflake;
    modrole: Snowflake;
    config: PickupConfig;
    pickups: Pickup[] = [];

    constructor(client: PugClient, channel: Channel, data?: PickupChannelData) {
        super();
        this.client = client;
        this.channel = channel;
        this.id = channel.id;
        this.count = data?.count || 0;
        this.adminrole = data?.adminrole;
        this.modrole = data?.modrole;
        this.config = new PickupConfig(data?.config);

        // Serialize Pickup instances
        data?.pickups.forEach(pickup => {
            this.pickups.push(new Pickup(this.client, this, pickup));
        });
    }

    async createPickup(name: string, size: number): Promise<Pickup> {
        // Check if pickup already exists
        if(this.pickups.some(pickup => pickup.name == name)) throw new AlreadyExistsError(`Pickup '${name}' already exists for channel #${this.channel["name"]} (${this.channel.id})`);

        // Create and bind Pickup instance
        let pickup = new Pickup(this.client, this, { name, size, config:  });
        this.pickups.push(pickup);

        // Update PickupChannelData in the database
        await this.updateDB();
        
        return pickup;
    }

    async removePickup(name: string): Promise<Boolean> {
        // Check if the Pickup exists
        let index = this.pickups.findIndex(pickup => pickup.name == name);
        if(index == -1) throw new DoesNotExistError(`Pickup '${name}' does not exist for channel #${this.channel["name"]} (${this.channel.id})`);

        // Check if the Pickup has any active games
        let pickup = this.pickups[index];
        if(pickup.games.length > 0) throw new HasActiveChildError(`Pickup '${name}' in #${this.channel["name"]} (${this.channel.id}) has active game(s)`);

        // Destroy Pickup instance and remove it from parent PickupChannel
        pickup.destroy();
        this.pickups.splice(index, 1);

        // Update PickupChannelData in the database
        await this.updateDB();

        return true;
    }

    async setAdmin(role: Role): Promise<Role> {
        // Set adminrole and update the database
        this.adminrole = role.id;
        await this.updateDB();
        return role;
    }

    async setMod(role: Role): Promise<Role> {
        // Set modrole and update the database
        this.modrole = role.id;
        await this.updateDB();
        return role;
    }

    async updateDB() {
        return await this.client.mongo.channels.replaceOne({ id: this.id.toString()}, this.deserialize());
    }

    deserialize(): PickupChannelData {
        return {
            id: this.id,
            count: this.count,
            adminrole: this.adminrole,
            modrole: this.modrole,
            config: this.config.deserialize(),
            pickups: this.pickups.map(p => p.deserialize()),
        }
    }
}

class Pickup extends Destroyable {
    client: PugClient;
    channel: PickupChannel;
    name: string;
    size: number;
    config: PickupConfig;
    games: Game[] = [];

    constructor(client: PugClient, channel: PickupChannel, data: PickupData) {
        super();
        this.client = client;
        this.channel = channel;
        this.name = data.name;
        this.size = data.size;
        this.config = new PickupConfig(data.config);
    }

    deserialize(): PickupData {
        return {
            name: this.name,
            size: this.size,
            config: this.config.deserialize(),
        }
    }
}

class Game extends Destroyable {
    client: PugClient;
    pickup: Pickup;
    count: number;
    members: Pugger[];
    teams: [Pugger[], Pugger[]];
    state: "QUEUE" | "WAITING_READY" | "ONGOING" | "DONE";

    constructor(pickup: Pickup) {
        super();
        this.client = pickup.client;
        this.pickup = pickup;
    }
}

class PuggerManager {
    client: PugClient;
    cache: Collection<Snowflake, Pugger> = new Collection();

    constructor(client: PugClient) {
        this.client = client;
    }
}

class Pugger {
    client: PugClient;
    user: User;
    queued: Game[];
    game: Game;

    constructor(client: PugClient, user: User) {
        this.client = client;
        this.user = user;
    }
}

export default PugClient;
export { PickupsManager, PickupChannel, Pickup, Game, PuggerManager, Pugger };