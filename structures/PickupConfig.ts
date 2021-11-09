import { Collection } from "discord.js";

const Validators = {
    boolean: value => { if(typeof value == "boolean") return value; else return undefined },
    posint: value => { if(Number(value) != NaN && Number(value) > 0) return Number(value).toFixed(0); else return undefined },
    strarr: value => { if(value instanceof Array && value.every(item => typeof item == "string")) return value; else return undefined }
}

class PickupConfig {
    collection: Collection<string, any>;

    static configs: Collection<string, { value: any, type: string }> = new Collection([
        ["check_in", { value: true, type: "boolean" }],
        ["ready_wait", { value: 120000, type: "posint" }],
        ["ranked", { value: false, type: "boolean" }],
        ["teams", { value: true, type: "boolean" }],
        ["maps", { value: [], type: "strarr" }]
    ]);

    constructor(config?: any) {
        this.collection = PickupConfig.configs.mapValues(e => e.value);
    }

    get(config: string) {
        return this.collection.get(config);
    }

    set(config: string, value: any) {
        if(value === undefined || value === null) return undefined;
        
        let def = PickupConfig.configs.get(config);
        if(!def) return null;
    }

    deserialize(): PickupConfigData | any {
        return Object.fromEntries(Object.entries(this));
    }
}

interface PickupConfigData {
    check_in: boolean;
    ready_wait: number;
    ranked: boolean;
    teams: boolean;
    maps: string[];
}

export default PickupConfig;
export { PickupConfigData };