import type PteroApp from './app';
import ApplicationServer from '../structures/ApplicationServer';
import BaseManager from '../structures/BaseManager';
import Dict from '../structures/Dict';
import {
    FeatureLimits,
    FetchOptions,
    Filter,
    FilterArray,
    Include,
    Limits,
    Resolvable,
    Sort
} from '../common';
import endpoints from './endpoints';

export default class ApplicationServerManager extends BaseManager {
    public client: PteroApp;
    public cache: Dict<number, ApplicationServer>;

    get FILTERS(): Readonly<string[]> {
        return Object.freeze([
            'name', 'uuid', 'uuidShort',
            'externalId', 'image'
        ]);
    }

    get INCLUDES(): Readonly<string[]> {
        return Object.freeze([
            'allocations', 'user', 'subusers',
            'nest', 'egg', 'variables',
            'location', 'node', 'databases'
        ]);
    }

    get SORTS(): Readonly<string[]> {
        return Object.freeze(['id', '-id', 'uuid', '-uuid']);
    }

    constructor(client: PteroApp) {
        super();
        this.client = client;
        this.cache = new Dict<number, ApplicationServer>();
    }

    get defaultLimits(): Limits {
        return {
            memory: 128,
            swap: 0,
            disk: 512,
            io: 500,
            cpu: 100,
            threads: null
        }
    }

    get defaultFeatureLimits(): FeatureLimits {
        return {
            allocations: 1,
            databases: 5,
            backups: 1
        }
    }

    _patch(data: any): ApplicationServer | Dict<number, ApplicationServer> {
        if (data?.data) {
            const res = new Dict<number, ApplicationServer>();
            for (let o of data.data) {
                o = o.attributes;
                const s = new ApplicationServer(this.client, o);
                res.set(s.id, s);
            }
            if (this.client.options.servers.cache) res.forEach(
                (v, k) => this.cache.set(k, v)
            );
            return res;
        }

        const s = new ApplicationServer(this.client, data.attributes);
        if (this.client.options.servers.cache) this.cache.set(s.id, s);
        return s;
    }

    resolve(obj: Resolvable<ApplicationServer>): ApplicationServer | undefined {
        if (obj instanceof ApplicationServer) return obj;
        if (typeof obj === 'number') return this.cache.get(obj);
        if (typeof obj === 'string') return this.cache.find(s => s.name === obj);
        if (obj.relationships?.servers) return this._patch(obj) as ApplicationServer;
        return undefined;
    }

    adminURLFor(server: number | ApplicationServer): string {
        return `${this.client.domain}/admin/servers/view/${
            typeof server === 'number' ? server : server.id
        }`;
    }

    panelURLFor(server: string | ApplicationServer): string {
        return `${this.client.domain}/server/${
            typeof server === 'string' ? server : server.identifier
        }`;
    }

    async fetch<T extends number | undefined>(
        id?: T,
        options: Include<FetchOptions> = {}
    ): Promise<
        T extends undefined ? Dict<number, ApplicationServer> : ApplicationServer
    > {
        if (id && !options.force) {
            const s = this.cache.get(id);
            if (s) return Promise.resolve<any>(s);
        }

        const data = await this.client.requests.get(
            (id ? endpoints.servers.get(id) : endpoints.servers.main),
            options, this
        );
        return this._patch(data) as any;
    }

    async query(
        entity: string,
        options: Filter<Sort<{}>>
    ): Promise<Dict<number, ApplicationServer>> {
        if (!options.sort && !options.filter) throw new Error('Sort or filter is required.');
        if (options.filter === 'identifier') options.filter = 'uuidShort';
        if (options.filter === 'externalId') options.filter = 'external_id';

        const payload: FilterArray<Sort<{}>> = {};
        if (options.filter) payload.filter = [entity, options.filter];
        if (options.sort) payload.sort = options.sort;

        const data = await this.client.requests.get(
            endpoints.servers.main,
            payload as FilterArray<Sort<FetchOptions>>,
            this
        );
        return this._patch(data) as any;
    }

    async delete(
        server: number | ApplicationServer,
        force: boolean = false
    ): Promise<true> {
        const id = typeof server === 'number' ? server : server.id;
        await this.client.requests.delete(
            endpoints.servers.get(id) + (force ? '/force' : '')
        );
        this.cache.delete(id);
        return true;
    }
}
