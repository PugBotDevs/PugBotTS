import { Db, MongoClient, Collection as MCollection } from "mongodb";

class Mongo {
    client: MongoClient;
    db: Db;
    channels: MCollection;
    users: MCollection;

    constructor() {
        this.client = new MongoClient(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true });
    }

    initialize(): Promise<Mongo> {
        return new Promise((res, rej) => {
            this.client.connect().then(() => {
                this.db = this.client.db(process.env.DB_NAME || "PugBot");
                this.channels = this.db.collection("channels");
                this.users = this.db.collection("users");
                console.log("DB Connected");
                res(this);
            }).catch(rej);
        })
    }
}

export default Mongo;