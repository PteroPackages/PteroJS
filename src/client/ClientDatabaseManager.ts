import type { PteroClient } from '.';
import { BaseManager } from '../structures/BaseManager';
import { Dict } from '../structures/Dict';
import { FetchOptions, Include } from '../common';
import { ClientDatabase } from '../common/client';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';

export class ClientDatabaseManager extends BaseManager {
    public client: PteroClient;
    public cache: Dict<number, ClientDatabase>;
    public serverId: string;

    /** Allowed filter arguments for databases (none). */
    get FILTERS() { return Object.freeze([]); }

    /**
     * Allowed include arguments for databases:
     * * password
     */
    get INCLUDES() {
        return Object.freeze(['password']);
    }

    /** Allowed sort arguments for databases (none). */
    get SORTS() { return Object.freeze([]); }

    constructor(client: PteroClient, serverId: string) {
        super();
        this.client = client;
        this.cache = new Dict();
        this.serverId = serverId;
    }

    /**
     * Transforms the raw database object(s) into typed objects.
     * @param data The resolvable database object(s).
     * @returns The resolved database object(s).
     */
    _patch(data: any): any {
        if (data.data) {
            const res = new Dict<number, ClientDatabase>();
            for (let o of data.data) {
                const d = caseConv.toCamelCase<ClientDatabase>(o.attributes);
                res.set(d.id, d);
            }
            this.cache.update(res);
            return res;
        }

        const d = caseConv.toCamelCase<ClientDatabase>(data.attributes);
        this.cache.set(d.id, d);
        return d;
    }

    /**
     * Fetches a list of databases from the API with the given options (default is undefined).
     * 
     * @param [options] Additional fetch options.
     * @returns The fetched databases.
     * @example
     * ```
     * const server = await client.servers.fetch('1c639a86');
     * await server.databases.fetch({ page: 2 })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async fetch(
        options: Include<FetchOptions> = {}
    ): Promise<Dict<number, ClientDatabase>> {
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
    async create(database: string, remote: string): Promise<ClientDatabase> {
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
     * @example
     * ```
     * const server = await client.servers.fetch('1c639a86');
     * await server.databases.rotate(1)
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async rotate(id: number): Promise<ClientDatabase> {
        const data = await this.client.requests.post(
            endpoints.servers.databases.rotate(this.serverId, id)
        );
        return this._patch(data);
    }

    /**
     * Deletes a database from the server.
     * @param id The ID of the database.
     * @example
     * ```
     * const server = await client.servers.fetch('1c639a86');
     * await server.databases.delete(2).catch(console.error);
     * ```
     */
    async delete(id: number): Promise<void> {
        await this.client.requests.delete(
            endpoints.servers.databases.get(this.serverId, id)
        );
        this.cache.delete(id);
    }
}
