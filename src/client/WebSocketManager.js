const Shard = require('../structures/Shard');
const endpoints = require('./endpoints');

// const EVENTS = {
//     'auth success': 'serverConnect',
//     'console output': 'serverOutput',
//     'token expired': 'serverDisconnect',
//     'status': 'statusUpdate',
//     'stats': 'statsUpdate'
// }

class WebSocketManager {
    constructor(client) {
        this.client = client;

        this.servers = [];

        /**
         * A map of active server shards.
         * @type {Map<string, Shard>}
         */
        this.shards = new Map();

        this.totalShards = 0;

        this.readyAt = 0;
    }

    async launch() {
        for (const id of this.servers) {
            const data = await this.client.requests.make(endpoints.servers.ws(id));
            try {
                const shard = new Shard(this.client, id, data);
                this.shards.set(id, shard);
                this.totalShards++;
            } catch {
                this.client.emit('debug', `[WS] Shard ${id} failed to launch`);
            }
        }
        this.readyAt = Date.now();
        this.client.emit('ready');
    }

    destroy() {
        if (!this.readyAt) return;
        for (const shard of this.shards.values()) shard.disconnect();
        this.shards.clear();
        this.readyAt = 0;
        this.client.emit('debug', `[WS] Destroyed ${this.totalShards} shards`);
        this.totalShards = 0;
    }

    get ping() {
        if (!this.totalShards) return -1;
        let sum = 0;
        for (const shard of this.shards.values()) sum += shard.ping;
        return sum / this.totalShards;
    }
}

module.exports = WebSocketManager;
