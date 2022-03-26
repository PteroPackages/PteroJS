const Shard = require('./Shard');

class WebSocketManager {
    constructor(client) {
        this.client = client;

        /**
         * A map of active server shards.
         * @type {Map<string, Shard>}
         */
        this.shards = new Map();
        this.totalShards = 0;
        this.readyAt = 0;
    }

    destroy() {
        if (!this.readyAt) return;
        for (const shard of this.shards.values()) shard.disconnect();
        this.shards.clear();
        this.readyAt = 0;
        this.client.emit('debug', `[WS] Destroyed ${this.totalShards} shard(s)`);
        this.totalShards = 0;
    }

    get ping() {
        if (!this.totalShards) return -1;
        let sum = 0;
        for (const shard of this.shards.values()) sum += shard.ping;
        return sum / this.totalShards;
    }

    /**
     * Adds a server to be connected to websockets.
     * @param {string} id The identifier of the server.
     * @returns {Shard} Created (or reused) shard.
     */
    createShard(id) {
        if (this.shards.has(id))
            return this.shards(id);

        const shard = new Shard(this.client, id);
        this.shards.set(id, shard);
        this.totalShards++;

        return shard;
    }

    /**
     * Removes a server from websocket connections.
     * @param {string} id The identifier of the server.
     * @returns {boolean} Whether shard was removed.
     */
    removeShard(id) {
        if (!this.shards.has(id))
            return false;

        this.shards.delete(id);
        this.totalShards--;

        return true;
    }
}

module.exports = WebSocketManager;
