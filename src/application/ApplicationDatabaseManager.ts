import type { PteroApp } from '.';
import { BaseManager } from '../structures/BaseManager';
import { Dict } from '../structures/Dict';
import { ApplicationDatabase } from '../common/app';
import { FetchOptions, Include, Resolvable } from '../common';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';
import { ValidationError } from '../structures/Errors';

export class ApplicationDatabaseManager extends BaseManager {
    public client: PteroApp;
    public cache: Dict<number, ApplicationDatabase>;
    public serverId: number;

    /** Allowed filter arguments for server databases. */
    get FILTERS() {
        return Object.freeze([]);
    }

    /** Allowed include arguments for server databases. */
    get INCLUDES() {
        return Object.freeze(['host', 'password']);
    }

    /** Allowed sort arguments for server databases. */
    get SORTS() {
        return Object.freeze([]);
    }

    constructor(client: PteroApp, serverId: number) {
        super();
        this.client = client;
        this.cache = new Dict();
        this.serverId = serverId;
    }

    _patch(data: any): any {
        if (data.data) {
            const res = new Dict<number, ApplicationDatabase>();
            for (let o of data.data) {
                const d = caseConv.toCamelCase<ApplicationDatabase>(o.attributes);
            }
            this.cache.update(res);
            return res;
        }

        const d = caseConv.toCamelCase<ApplicationDatabase>(data.attributes);
        this.cache.set(d.id, d);
        return d;
    }

    async fetch(id: number, options?: Include<FetchOptions>): Promise<ApplicationDatabase>;
    async fetch(options?: Include<FetchOptions>): Promise<Dict<number, ApplicationDatabase>>;
    async fetch(op?: number | Include<FetchOptions>, ops: Include<FetchOptions> = {}): Promise<any> {
        let path: string;
        switch (typeof op) {
            case 'number':{
                if (!ops.force && this.cache.has(op))
                    return this.cache.get(op);

                path = endpoints.servers.databases.get(this.serverId, op);
                break;
            }
            case 'undefined':
            case 'object':{
                path = endpoints.servers.databases.main(this.serverId);
                if (op) ops = op;
                break;
            }
            default:
                throw new ValidationError(
                    `expected database id or fetch options; got ${typeof op}`
                );
        }

        const data = await this.client.requests.get(path, ops, null, this);
        return this._patch(data);
    }

    async create(
        database: string,
        remote: string,
        host: number
    ): Promise<ApplicationDatabase> {
        if (!/^[0-9%.]{1,15}$/.test(remote)) throw new ValidationError(
            'remote did not pass the required validation: /^[0-9%.]{1,15}$/'
        );

        const data = await this.client.requests.post(
            endpoints.servers.databases.main(this.serverId),
            { database, remote, host }
        );
        return this._patch(data);
    }

    async resetPasword(id: number): Promise<void> {
        await this.client.requests.post(
            endpoints.servers.databases.reset(this.serverId, id)
        );
    }

    async delete(id: number): Promise<void> {
        await this.client.requests.delete(
            endpoints.servers.databases.get(this.serverId, id)
        );
        this.cache.delete(id);
    }
}
