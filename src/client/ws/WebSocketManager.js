const Shard = require('./Shard');
const endpoints = require('../endpoints');

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
        if (!this.servers.length) {
            this.client.emit('debug', '[WS] No shards to launch');
            return;
        }

        this.client.emit('debug', `[WS] Attempting to launch ${this.servers.length} shard(s)`);
        for (const id of this.servers) {
            const { data } = await this.client.requests.get(endpoints.servers.ws(id));
            try {
                const shard = new Shard(this.client, id, data);
                this.shards.set(id, shard);
                this.totalShards++;
            } catch (err) {
                this.client.emit(
                    'debug',
                    `[WS] Shard '${id}' failed to launch\n[WS] ${err.message}`
                );
            }
        }

        process.on('SIGINT', () => this.destroy());
        process.on('SIGTERM', () => this.destroy());

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
