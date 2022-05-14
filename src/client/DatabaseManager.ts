import type { PteroClient } from '.';
import { BaseManager } from '../structures/BaseManager';
import { Dict } from '../structures/Dict';
import { FetchOptions, Include } from '../common';
import { Database } from '../common/client';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';

export class DatabaseManager extends BaseManager {
    public client: PteroClient;
    public cache: Dict<number, Database>;
    public serverId: string;

    get FILTERS(): Readonly<string[]> { return Object.freeze([]); }

    get SORTS(): Readonly<string[]> { return Object.freeze([]); }

    get INCLUDES(): Readonly<string[]> {
        return Object.freeze(['password']);
    }

    constructor(client: PteroClient, serverId: string) {
        super();
        this.client = client;
        this.cache = new Dict<number, Database>();
        this.serverId = serverId;
    }

    _patch(data: any): Dict<number, Database> {
        const res = new Dict<number, Database>();
        for (let o of data.data) {
            const d = caseConv.toCamelCase<Database>(o.attributes);
            res.set(d.id, d);
        }
        this.cache = this.cache.join(res);
        return res;
    }

    async fetch(options: Include<FetchOptions> = {}): Promise<Dict<number, Database>> {
        const data = await this.client.requests.get(
            endpoints.servers.databases.main(this.serverId),
            options, this
        );
        return this._patch(data);
    }

    async create(database: string, remote: string): Promise<Database> {
        const data = await this.client.requests.post(
            endpoints.servers.databases.main(this.serverId),
            { database, remote }
        );
        return this._patch(data) as any;
    }

    async rotate(id: number): Promise<Database> {
        const data = await this.client.requests.post(
            endpoints.servers.databases.rotate(this.serverId, id)
        );
        return this._patch(data) as any;
    }

    async delete(id: number): Promise<void> {
        await this.client.requests.delete(
            endpoints.servers.databases.get(this.serverId, id)
        );
        this.cache.delete(id);
    }
}
