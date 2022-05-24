import type { PteroApp } from '.';
import { ApplicationServer } from '../structures/ApplicationServer';
import { BaseManager } from '../structures/BaseManager';
import { Dict } from '../structures/Dict';
import { ValidationError } from '../structures/Errors';
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
    CreateServerOptions,
    UpdateBuildOptions,
    UpdateDetailsOptions,
    UpdateStartupOptions
} from '../common/app';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';

export class ApplicationServerManager extends BaseManager {
    public client: PteroApp;
    public cache: Dict<number, ApplicationServer>;

    /** Allowed filter arguments for servers. */
    get FILTERS() {
        return Object.freeze([
            'name', 'uuid', 'uuidShort',
            'externalId', 'image'
        ]);
    }

    /** Allowed include arguments for servers. */
    get INCLUDES() {
        return Object.freeze([
            'allocations', 'user', 'subusers',
            'nest', 'egg', 'variables',
            'location', 'node', 'databases'
        ]);
    }

    /** Allowed sort arguments for servers. */
    get SORTS() {
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

    /**
     * Resolves a server from an object. This can be:
     * * a string
     * * a number
     * * an object
     * 
     * @param obj The object to resolve from.
     * @returns The resolved server or undefined if not found.
     */
    resolve(obj: Resolvable<ApplicationServer>): ApplicationServer | undefined {
        if (obj instanceof ApplicationServer) return obj;
        if (typeof obj === 'number') return this.cache.get(obj);
        if (typeof obj === 'string') return this.cache.find(s => s.name === obj);
        if (obj.relationships?.servers) return this._patch(obj) as ApplicationServer;
        return undefined;
    }

    /**
     * @param id The ID of the server.
     * @returns The formatted URL to the server in the admin panel.
     */
    adminURLFor(id: number): string {
        return `${this.client.domain}/admin/servers/view/${id}`;
    }

    /**
     * @param id The ID of the server.
     * @returns The formatted URL to the server.
     */
    panelURLFor(id: string): string {
        return `${this.client.domain}/server/${id}`;
    }

    /**
     * Fetches a server or a list of servers from the Pterodactyl API.
     * @param [id] The ID of the server.
     * @param [options] Additional fetch options.
     * @returns The fetched server(s).
     */
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

    /**
     * Queries the Pterodactyl API for servers that match the specified query filters.
     * This fetches from the API directly and does not check the cache. Use cache methods
     * for filtering and sorting.
     * Available query filters:
     * * name
     * * uuid
     * * uuidShort
     * * identifier (alias for uuidShort)
     * * externalId
     * * image
     * 
     * Available sort options:
     * * id
     * * -id
     * * uuid
     * * -uuid
     * 
     * @param entity The entity to query.
     * @param options The query options to filter by.
     * @returns The queried servers.
     */
    async query(
        entity: string,
        options: Filter<Sort<{}>>
    ): Promise<Dict<number, ApplicationServer>> {
        if (!options.sort && !options.filter)
            throw new ValidationError('Sort or filter is required.');

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

    /**
     * Creates a server with the specified options.
     * @param options Create server options.
     * @see {@link CreateServerOptions}.
     * @returns The new server.
     */
    async create(options: CreateServerOptions): Promise<ApplicationServer> {
        options.limits = Object.assign(
            this.defaultLimits,
            options.limits || {}
        );
        options.featureLimits = Object.assign(
            this.defaultFeatureLimits,
            options.featureLimits || {}
        );

        const payload = caseConv.toSnakeCase<any>(
            options, { ignore:['environment'] }
        );
        payload.environment = options.environment;

        const data = await this.client.requests.post(
            endpoints.servers.main, payload
        );
        return this._patch(data);
    }

    /**
     * Updates the details of a server.
     * @param id The ID of the server.
     * @param options Update details options.
     * @see {@link UpdateDetailsOptions}.
     * @returns The updated server.
     */
    async updateDetails(
        id: number,
        options: UpdateDetailsOptions
    ): Promise<ApplicationServer> {
        if (!Object.keys(options).length)
            throw new ValidationError('Too few options to update the server.');

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

    /**
     * Updates the build configuration of a server.
     * @param id The ID of the server.
     * @param options Update build options.
     * @see {@link UpdateBuildOptions}.
     * @returns The updated server.
     */
    async updateBuild(
        id: number,
        options: UpdateBuildOptions
    ): Promise<ApplicationServer> {
        if (!Object.keys(options).length)
            throw new ValidationError('Too few options to update the server.');

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

    /**
     * Updates the startup configuration of a server.
     * @param id The ID of the server.
     * @param options Update startup options.
     * @see {@link UpdateStartupOptions}.
     * @todo
     */
    private async updateStartup(
        id: number,
        options: UpdateStartupOptions
    ) {}

    /**
     * Suspends a server.
     * @param id The ID of the server.
     */
    async suspend(id: number): Promise<void> {
        await this.client.requests.post(endpoints.servers.suspend(id));
    }

    /**
     * Unsuspends a server.
     * @param id The ID of the server.
     */
    async unsuspend(id: number): Promise<void> {
        await this.client.requests.post(endpoints.servers.unsuspend(id));
    }

    /**
     * Triggers the reinstall process of a server.
     * @param id The ID of the server.
     */
    async reinstall(id: number): Promise<void> {
        await this.client.requests.post(endpoints.servers.reinstall(id));
    }

    /**
     * Deletes a server.
     * @param id The ID of the server.
     * @param [force] Whether to force delete the server.
     */
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
