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
    PaginationMeta,
    Resolvable,
    Sort,
} from '../common';
import {
    CreateServerOptions,
    UpdateBuildOptions,
    UpdateDetailsOptions,
    UpdateStartupOptions,
} from '../common/app';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';

export class ApplicationServerManager extends BaseManager {
    public client: PteroApp;
    public cache: Dict<number, ApplicationServer>;
    public meta: PaginationMeta;

    /**
     * Allowed filter arguments for servers:
     * * name
     * * uuid
     * * uuidShort
     * * identifier (alias for uuidShort)
     * * externalId
     * * image
     */
    get FILTERS() {
        return Object.freeze([
            'name',
            'uuid',
            'uuidShort',
            'externalId',
            'image',
        ]);
    }

    /**
     * Allowed include arguments for servers:
     * * allocations
     * * user
     * * subusers
     * * nest
     * * egg
     * * variables
     * * location
     * * node
     * * databases
     *
     * Note: not all of these include options have been implemented yet.
     */
    get INCLUDES() {
        return Object.freeze([
            'allocations',
            'user',
            'subusers',
            'nest',
            'egg',
            'variables',
            'location',
            'node',
            'databases',
        ]);
    }

    /**
     * Allowed sort arguments for servers:
     * * id
     * * -id
     * * uuid
     * * -uuid
     *
     * Negative arguments reverse the sorted results.
     */
    get SORTS() {
        return Object.freeze(['id', '-id', 'uuid', '-uuid']);
    }

    constructor(client: PteroApp) {
        super();
        this.client = client;
        this.cache = new Dict();
        this.meta = {
            current: 0,
            total: 0,
            count: 0,
            perPage: 0,
            totalPages: 0,
        };
    }

    get defaultLimits(): Limits {
        return {
            memory: 128,
            swap: 0,
            disk: 512,
            io: 500,
            cpu: 100,
            threads: null,
        };
    }

    get defaultFeatureLimits(): FeatureLimits {
        return {
            allocations: 1,
            databases: 1,
            backups: 1,
        };
    }

    /**
     * Transforms the raw server object(s) into class objects.
     * @param data The resolvable server object(s).
     * @returns The resolved server object(s).
     */
    _patch(data: any): any {
        if (data?.meta?.pagination) {
            this.meta = caseConv.toCamelCase(data.meta.pagination, {
                ignore: ['current_page'],
            });
            this.meta.current = data.meta.pagination.current_page;
        }

        if (data.data) {
            const res = new Dict<number, ApplicationServer>();
            for (let o of data.data) {
                const s = new ApplicationServer(this.client, o.attributes);
                res.set(s.id, s);
            }
            if (this.client.options.servers.cache) this.cache.update(res);
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
    resolve(
        obj: Resolvable<ApplicationServer>,
    ): ApplicationServer | Dict<number, ApplicationServer> | undefined {
        if (obj instanceof ApplicationServer) return obj;
        if (typeof obj === 'number') return this.cache.get(obj);
        if (typeof obj === 'string')
            return this.cache.find((s) => s.name === obj);
        if (obj.relationships?.servers)
            return this._patch(obj.relationships.servers);
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
     * Fetches a server from the API by its ID. This will check the cache first unless the force
     * option is specified.
     *
     * @param id The ID of the server.
     * @param [options] Additional fetch options.
     * @returns The fetched server.
     * @example
     * ```
     * app.servers.fetch(12).then(console.log).catch(console.error);
     * ```
     */
    async fetch(
        id: number,
        options?: Include<FetchOptions>,
    ): Promise<ApplicationServer>;
    /**
     * Fetches a server from the API by its external ID. This will check the cache first unless the
     * force option is specified.
     *
     * @param id The external ID of the server.
     * @param [options] Additional fetch options.
     * @returns The fetched server.
     * @example
     * ```
     * app.servers.fetch('minecraft').then(console.log).catch(console.error);
     * ```
     */
    async fetch(
        id: string,
        options?: Include<FetchOptions>,
    ): Promise<ApplicationServer>;
    /**
     * Fetches a list of servers from the API with the given options (default is undefined).
     * @see {@link Include} and {@link FetchOptions}.
     *
     * @param [options] Additional fetch options.
     * @returns The fetched servers.
     * @example
     * ```
     * app.servers.fetch({ page: 2 }).then(console.log).catch(console.error);
     * ```
     */
    async fetch(
        options?: Include<FetchOptions>,
    ): Promise<Dict<number, ApplicationServer>>;
    async fetch(
        op?: number | string | Include<FetchOptions>,
        ops: Include<FetchOptions> = {},
    ): Promise<any> {
        let path: string;
        switch (typeof op) {
            case 'number': {
                if (!ops.force && this.cache.has(op)) return this.cache.get(op);

                path = endpoints.servers.get(op);
                break;
            }
            case 'string': {
                if (!ops.force) {
                    const u = this.cache.find((u) => u.externalId === op);
                    if (u) return u;
                }

                path = endpoints.servers.ext(op);
                break;
            }
            case 'undefined':
            case 'object': {
                path = endpoints.servers.main;
                if (op) ops = op;
                break;
            }
            default:
                throw new ValidationError(
                    `expected server id, external id or fetch options; got ${typeof op}`,
                );
        }

        const data = await this.client.requests.get(path, ops, null, this);
        return this._patch(data);
    }

    /**
     * Queries the API for servers that match the specified query filters. This fetches from the
     * API directly and does not check the cache. Use cache methods for filtering and sorting.
     *
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
     * @example
     * ```
     * app.servers.query('ARK', { filter: 'name', sort: 'id' })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async query(
        entity: string,
        options: Filter<Sort<{}>>,
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
            null,
            this,
        );
        return this._patch(data);
    }

    /**
     * Creates a server with the specified options.
     * @see {@link CreateServerOptions}.
     * @param options Create server options.
     * @returns The new server.
     * @example
     * ```
     * app.servers.create({
     *  name: 'ptero bot',
     *  user: 5,
     *  egg: 16,
     *  dockerImage: 'ghcr.io/parkervcp/yolks:nodejs_17',
     *  startup: 'if [ -f /home/container/package.json ];' +
     *   'then /usr/local/bin/npm install; fi;' +
     *   '/usr/local/bin/node /home/container/{{BOT_JS_FILE}}',
     *  environment:{
     *   USER_UPLOAD: false,
     *   AUTO_UPDATE: false,
     *   BOT_JS_FILE: 'index.js'
     *  },
     *  allocation:{
     *   default: 24
     *  }
     * })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async create(options: CreateServerOptions): Promise<ApplicationServer> {
        options.limits = Object.assign(
            this.defaultLimits,
            options.limits || {},
        );
        options.featureLimits = Object.assign(
            this.defaultFeatureLimits,
            options.featureLimits || {},
        );

        const payload = caseConv.toSnakeCase<any>(options, {
            ignore: ['environment'],
        });
        payload.environment = options.environment;

        const data = await this.client.requests.post(
            endpoints.servers.main,
            payload,
        );
        return this._patch(data);
    }

    /**
     * Updates the details of a server.
     * @see {@link UpdateDetailsOptions}.
     * @param id The ID of the server.
     * @param options Update details options.
     * @returns The updated server.
     * @example
     * ```
     * app.servers.updateDetails(12, { externalId: 'mc01' })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async updateDetails(
        id: number,
        options: UpdateDetailsOptions,
    ): Promise<ApplicationServer> {
        if (!Object.keys(options).length)
            throw new ValidationError('Too few options to update the server.');

        const server = await this.fetch(id, { force: true });
        options.name ||= server.name;
        options.owner ??= server.ownerId;
        options.externalId ||= server.externalId;
        options.description ||= server.description;

        const payload = caseConv.toSnakeCase<object>(options, {
            map: { owner: 'user' },
        });
        const data = await this.client.requests.patch(
            endpoints.servers.details(id),
            payload,
        );
        return this._patch(data);
    }

    /**
     * Updates the build configuration of a server.
     * @see {@link UpdateBuildOptions}.
     * @param id The ID of the server.
     * @param options Update build options.
     * @returns The updated server.
     * @example
     * ```
     * app.servers.updateBuild(12, {
     *  limits:{
     *   memory: 2048
     *  },
     *  addAllocations:[32]
     * })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async updateBuild(
        id: number,
        options: UpdateBuildOptions,
    ): Promise<ApplicationServer> {
        if (!Object.keys(options).length)
            throw new ValidationError('Too few options to update the server.');

        const server = await this.fetch(id, { force: true });
        options.limits = Object.assign(server.limits, options.limits);
        options.featureLimits = Object.assign(
            server.featureLimits,
            options.featureLimits,
        );
        options.allocation ??= server.allocation;

        const data = await this.client.requests.patch(
            endpoints.servers.build(id),
            caseConv.toSnakeCase(options),
        );
        return this._patch(data);
    }

    /**
     * Updates the startup configuration of a server.
     * @see {@link UpdateStartupOptions}.
     * @param id The ID of the server.
     * @param options Update startup options.
     * @returns The updated server.
     * @example
     * ```
     * app.servers.updateStartup(12, {
     *  image: 'ghcr.io/pterodactyl/yolks:java_17',
     *  skipScripts: false
     * })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async updateStartup(
        id: number,
        options: UpdateStartupOptions,
    ): Promise<ApplicationServer> {
        if (!Object.keys(options).length)
            throw new ValidationError('Too few options to update the server.');

        const server = await this.fetch(id, { force: true });
        options.egg ??= server.egg;
        options.environment ||= server.container.environment;
        options.image ||= server.container.image;
        options.skipScripts ??= false;
        options.startup ||= server.container.startupCommand;

        const payload = caseConv.toSnakeCase<any>(options, {
            ignore: ['environment'],
        });
        payload.environment = options.environment;

        const data = await this.client.requests.patch(
            endpoints.servers.startup(id),
            payload,
        );
        return this._patch(data);
    }

    /**
     * Suspends a server.
     * @param id The ID of the server.
     * @example
     * ```
     * app.servers.suspend(14).catch(console.error);
     * ```
     */
    suspend(id: number): Promise<void> {
        return this.client.requests.post(endpoints.servers.suspend(id));
    }

    /**
     * Unsuspends a server.
     * @param id The ID of the server.
     * @example
     * ```
     * app.servers.unsuspend(16).catch(console.error);
     * ```
     */
    unsuspend(id: number): Promise<void> {
        return this.client.requests.post(endpoints.servers.unsuspend(id));
    }

    /**
     * Triggers the reinstall process of a server.
     * @param id The ID of the server.
     * @example
     * ```
     * app.servers.reinstall(17).catch(console.error);
     * ```
     */
    reinstall(id: number): Promise<void> {
        return this.client.requests.post(endpoints.servers.reinstall(id));
    }

    /**
     * Deletes a server.
     * @param id The ID of the server.
     * @param [force] Whether to force delete the server.
     * @example
     * ```
     * app.servers.delete(21, true).catch(console.error);
     * ```
     */
    async delete(id: number, force: boolean = false): Promise<void> {
        await this.client.requests.delete(
            endpoints.servers.get(id) + (force ? '/force' : ''),
        );
        this.cache.delete(id);
    }
}
