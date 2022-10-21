import type { PteroClient } from '..';
import { Shard } from './Shard';

export class WebSocketManager {
    public client: PteroClient;
    public shards: Map<string, Shard>;
    public active: boolean;
    public useOrigin: boolean;

    constructor(client: PteroClient) {
        this.client = client;
        this.shards = new Map();
        this.active = false;
        this.useOrigin = false;
    }

    /**
     * Creates a websocket shard instance for a specified server.
     * @param id The identifier of the server.
     * @returns The server websocket shard.
     */
    createShard(id: string): Shard {
        if (this.shards.has(id)) return this.shards.get(id)!;
        const shard = new Shard(this.client, id, this.useOrigin);
        this.shards.set(id, shard);
        this.active = true;
        return shard;
    }

    /**
     * Disconnects a server shard's websocket connection and removes it.
     * If some shards do not return a value, `undefined` will be set in place.
     * @param id The identifier of the server.
     * @returns Whether the websocket shard was disconnected and/or removed.
     */
    deleteShard(id: string): boolean {
        if (!this.shards.has(id)) return false;
        this.shards.get(id)!.disconnect();
        this.active = !!this.shards.size;
        return this.shards.delete(id);
    }

    get ping(): number {
        if (!this.shards.size) return -1;
        let sum = 0;
        for (let s of this.shards.values()) sum += s.ping;
        return sum / this.shards.size;
    }

    /**
     * Broadcasts an event to all shards and waits for the responses.
     * @param event The event to broadcast.
     * @param args Arguments to send with the event.
     * @returns A list of the returned values, if any.
     * @example
     * ```
     * const values = await client.ws.broadcast('sendStats');
     * console.log(values.map(s => s.resources.uptime));
     * ```
     */
    async broadcast<T>(event: string, args?: string): Promise<T[]> {
        const res = [] as T[];
        for (const shard of this.shards.values()) {
            let data = await shard.request(event, args);
            res.push(data);
        }
        return res;
    }

    /** Disconnects all active websocket shards and removes them. */
    destroy(): void {
        for (let s of this.shards.values()) s.disconnect();
        this.shards.clear();
        this.active = false;
    }
}
