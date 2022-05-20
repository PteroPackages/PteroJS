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

    /** Allowed filter arguments for databases. */
    get FILTERS() { return Object.freeze([]); }

    /** Allowed include arguments for databases. */
    get INCLUDES() {
        return Object.freeze(['password']);
    }

    /** Allowed sort arguments for databases. */
    get SORTS() { return Object.freeze([]); }

    constructor(client: PteroClient, serverId: string) {
        super();
        this.client = client;
        this.cache = new Dict();
        this.serverId = serverId;
    }

    _patch(data: any): any {
        if (data.data) {
            const res = new Dict<number, Database>();
            for (let o of data.data) {
                const d = caseConv.toCamelCase<Database>(o.attributes);
                res.set(d.id, d);
            }
            this.cache = this.cache.join(res);
            return res;
        }

        const d = caseConv.toCamelCase<Database>(data.attributes);
        this.cache.set(d.id, d);
        return d;
    }

    /**
     * Fetches a list of databases from the Pterodactyl API.
     * @param [options] Additional fetch options.
     * @returns The fetched databases.
     */
    async fetch(options: Include<FetchOptions> = {}): Promise<Dict<number, Database>> {
        const data = await this.client.requests.get(
            endpoints.servers.databases.main(this.serverId),
            options, null, this
        );
        return this._patch(data);
    }

    /**
     * Creates a database on the server.
     * @param database The name of the database.
     * @param remote The connections allowed to the database.
     * @returns The new database.
     */
    async create(database: string, remote: string): Promise<Database> {
        const data = await this.client.requests.post(
            endpoints.servers.databases.main(this.serverId),
            { database, remote }
        );
        return this._patch(data);
    }

    /**
     * Rotates the password of a specified database.
     * @param id The ID of the database.
     * @returns The updated database.
     */
    async rotate(id: number): Promise<Database> {
        const data = await this.client.requests.post(
            endpoints.servers.databases.rotate(this.serverId, id)
        );
        return this._patch(data);
    }

    /**
     * Deletes a database from the server.
     * @param id The ID of the database.
     */
    async delete(id: number): Promise<void> {
        await this.client.requests.delete(
            endpoints.servers.databases.get(this.serverId, id)
        );
        this.cache.delete(id);
    }
}
