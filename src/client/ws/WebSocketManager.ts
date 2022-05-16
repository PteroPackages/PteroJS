import type { PteroClient } from '..';
import { Shard } from './Shard';

export class WebSocketManager {
    public client: PteroClient;
    public shards: Map<string, Shard>;
    public active: boolean;

    constructor(client: PteroClient) {
        this.client = client;
        this.shards = new Map();
        this.active = false;
    }

    createShard(id: string): Shard {
        if (this.shards.has(id)) return this.shards.get(id)!;
        const shard = new Shard(this.client, id);
        this.shards.set(id, shard);
        this.active = true;
        return shard;
    }

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

    destroy(): void {
        for (let s of this.shards.values()) s.disconnect();
        this.shards.clear();
        this.active = false;
    }
}
