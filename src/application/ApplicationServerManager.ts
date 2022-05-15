import type { PteroApp } from '.';
import { ApplicationServer } from '../structures/ApplicationServer';
import { BaseManager } from '../structures/BaseManager';
import { Dict } from '../structures/Dict';
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
import {
    UpdateBuildOptions,
    UpdateDetailsOptions,
    UpdateStartupOptions
} from '../common/app';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';

export class ApplicationServerManager extends BaseManager {
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
        this.cache = new Dict();
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

    _patch(data: any): any {
        if (data.data) {
            const res = new Dict<number, ApplicationServer>();
            for (let o of data.data) {
                const s = new ApplicationServer(this.client, o.attributes);
                res.set(s.id, s);
            }
            if (this.client.options.servers.cache) this.cache = this.cache.join(res);
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

    adminURLFor(id: number): string {
        return `${this.client.domain}/admin/servers/view/${id}`;
    }

    panelURLFor(id: string): string {
        return `${this.client.domain}/server/${id}`;
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
            options, null, this
        );
        return this._patch(data);
    }

    async query(
        entity: string,
        options: Filter<Sort<{}>>
    ): Promise<Dict<number, ApplicationServer>> {
        if (!options.sort && !options.filter)
            throw new Error('Sort or filter is required.');

        if (options.filter === 'identifier') options.filter = 'uuidShort';
        if (options.filter === 'externalId') options.filter = 'external_id';

        const payload: FilterArray<Sort<{}>> = {};
        if (options.filter) payload.filter = [options.filter, entity];
        if (options.sort) payload.sort = options.sort;

        const data = await this.client.requests.get(
            endpoints.servers.main,
            payload as FilterArray<Sort<FetchOptions>>,
            null, this
        );
        return this._patch(data);
    }

    async updateDetails(
        id: number,
        options: UpdateDetailsOptions
    ): Promise<ApplicationServer> {
        if (!Object.keys(options).length)
            throw new Error('Too few options to update the server.');

        const server = await this.fetch(id, { force: true });
        options.name ||= server.name;
        options.owner ??= server.ownerId;
        options.externalId ||= server.externalId;
        options.description ||= server.description;

        const payload = caseConv.toSnakeCase<object>(options, { map:{ owner: 'user' }});
        const data = await this.client.requests.patch(
            endpoints.servers.details(id), payload
        );
        return this._patch(data);
    }

    async updateBuild(
        id: number,
        options: UpdateBuildOptions
    ): Promise<ApplicationServer> {
        if (!Object.keys(options).length)
            throw new Error('Too few options to update the server.');

        const server = await this.fetch(id, { force: true });
        options = Object.assign(server.limits, options);
        options = Object.assign(server.featureLimits, options);
        options.allocation ??= server.allocation;

        const data = await this.client.requests.patch(
            endpoints.servers.build(id),
            caseConv.toSnakeCase(options)
        );
        return this._patch(data);
    }

    async updateStartup(
        id: number,
        options: UpdateStartupOptions
    ) {}

    async suspend(id: number): Promise<void> {
        await this.client.requests.post(endpoints.servers.suspend(id));
    }

    async unsuspend(id: number): Promise<void> {
        await this.client.requests.post(endpoints.servers.unsuspend(id));
    }

    async reinstall(id: number): Promise<void> {
        await this.client.requests.post(endpoints.servers.reinstall(id));
    }

    async delete(
        id: number,
        force: boolean = false
    ): Promise<void> {
        await this.client.requests.delete(
            endpoints.servers.get(id) + (force ? '/force' : '')
        );
        this.cache.delete(id);
    }
}
