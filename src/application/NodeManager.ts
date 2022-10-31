import type { PteroApp } from '.';
import { Dict } from '../structures/Dict';
import { Node } from '../structures/Node';
import {
    CreateNodeOptions,
    NodeConfiguration,
    NodeDeploymentOptions,
} from '../common/app';
import {
    FetchOptions,
    Filter,
    FilterArray,
    Include,
    PaginationMeta,
    Resolvable,
    Sort,
} from '../common';
import { ValidationError } from '../structures/Errors';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';
import { BaseManagerFetchAll } from '../structures/BaseManagerFetchAll';

export class NodeManager extends BaseManagerFetchAll<[options?: Include<FetchOptions>], number, Node>  {
    public client: PteroApp;
    public cache: Dict<number, Node>;
    public meta: PaginationMeta;

    /**
     * Allowed filter arguments for nodes:
     * * uuid
     * * name
     * * fqdn
     * * daemonTokenId
     */
    get FILTERS() {
        return Object.freeze(['uuid', 'name', 'fqdn', 'daemon_token_id']);
    }

    /**
     * Allowed include arguments for nodes:
     * * allocations
     * * location
     * * servers
     *
     * Note: not all of these include options have been implemented yet.
     */
    get INCLUDES() {
        return Object.freeze(['allocations', 'location', 'servers']);
    }

    /**
     * Allowed sort arguments for nodes:
     * * id
     * * uuid
     * * memory
     * * disk
     */
    get SORTS() {
        return Object.freeze(['id', 'uuid', 'memory', 'disk']);
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

    /**
     * Transforms the raw node object(s) into class objects.
     * @param data The resolvable node object(s).
     * @returns The resolved node object(s).
     */
    _patch(data: any): any {
        if (data?.meta?.pagination) {
            this.meta = caseConv.toCamelCase(data.meta.pagination, {
                ignore: ['current_page'],
            });
            this.meta.current = data.meta.pagination.current_page;
        }

        if (data?.data) {
            const res = new Dict<number, Node>();
            for (const obj of data.data) {
                const s = new Node(this.client, obj.attributes);
                res.set(s.id, s);
            }
            if (this.client.options.servers.cache) this.cache.update(res);
            return res;
        }

        const n = new Node(this.client, data.attributes);
        if (this.client.options.nodes.cache) this.cache.set(n.id, n);
        return n;
    }

    /**
     * Resolves a node from an object. This can be:
     * * a string
     * * a number
     * * an object
     *
     * @param obj The object to resolve from.
     * @returns The resolved node or undefined if not found.
     */
    resolve(obj: Resolvable<Node>): Node | undefined {
        if (obj instanceof Node) return obj;
        if (typeof obj === 'number') return this.cache.get(obj);
        if (typeof obj === 'string')
            return this.cache.find(n => n.name === obj);

        if (obj.relationships?.node)
            return this._patch(obj.relationships.node) as Node;

        return undefined;
    }

    /**
     * @param id The ID of the node.
     * @returns The formatted URL to the node in the admin panel.
     */
    adminURLFor(id: number): string {
        return `${this.client.domain}/admin/nodes/view/${id}`;
    }

    /**
     * Fetches a node from the API by its ID. This will check the cache first unless the force
     * option is specified.
     *
     * @param id The ID of the node.
     * @param [options] Additional fetch options.
     * @returns The fetched node.
     * @example
     * ```
     * app.nodes.fetch(2).then(console.log).catch(console.error);
     * ```
     */
    async fetch(id: number, options?: Include<FetchOptions>): Promise<Node>;
    /**
     * Fetches a list of nodes from the API with the given options (default is undefined).
     * @see {@link Include} and {@link FetchOptions}.
     *
     * @param [options] Additional fetch options.
     * @returns The fetched nodes.
     * @example
     * ```
     * app.nodes.fetch({ include:['servers'] })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async fetch(options?: Include<FetchOptions>): Promise<Dict<number, Node>>;
    async fetch(
        op?: number | Include<FetchOptions>,
        ops: Include<FetchOptions> = {},
    ): Promise<any> {
        let path = endpoints.nodes.main;
        if (typeof op === 'number') {
            if (!ops.force && this.cache.has(op)) return this.cache.get(op);

            path = endpoints.nodes.get(op);
        } else {
            if (op) ops = op;
        }

        const data = await this.client.requests.get(path, ops, null, this);
        return this._patch(data);
    }

    /**
     * Fetches the deployable nodes from the API following the specified deployable
     * node options. Note that memory and disk are required for deployment options.
     * @see {@link NodeDeploymentOptions}.
     * @param options Deployable node options.
     * @returns The deployable nodes.
     * @example
     * ```
     * app.nodes.fetchDeployable({ memory: 1024, disk: 4000 })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async fetchDeployable(
        options: NodeDeploymentOptions,
    ): Promise<Dict<number, Node>> {
        const data = await this.client.requests.get(
            endpoints.nodes.deploy,
            undefined,
            options,
        );
        return this._patch(data);
    }

    /**
     * Queries the API for nodes that match the specified query filters. This fetches from the
     * API directly and does not check the cache. Use cache methods for filtering and sorting.
     *
     * Available query filters:
     * * uuid
     * * name
     * * fqdn
     * * daemonTokenId
     *
     * Available sort options:
     * * id
     * * uuid
     * * memory
     * * disk
     *
     * @param entity The entity to query.
     * @param options The query options to filter by.
     * @returns The queried nodes.
     * @example
     * ```
     * app.nodes.query('nodes.pterodactyl.test', { filter: 'daemonTokenId' })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async query(
        entity: string,
        options: Filter<Sort<{}>>,
    ): Promise<Dict<number, Node>> {
        if (!options.sort && !options.filter)
            throw new ValidationError('Sort or filter is required.');
        if (options.filter === 'daemonTokenId')
            options.filter = 'daemon_token_id';

        const payload: FilterArray<Sort<{}>> = {};
        if (options.filter) payload.filter = [options.filter, entity];
        if (options.sort) payload.sort = options.sort;

        const data = await this.client.requests.get(
            endpoints.nodes.main,
            payload as FilterArray<Sort<FetchOptions>>,
            null,
            this,
        );
        return this._patch(data);
    }

    /**
     * Fetches the node configuration.
     * @param id The ID of the node.
     * @returns The node configuration.
     * @example
     * ```
     * app.nodes.getConfig(2).then(console.log).catch(console.error);
     * ```
     */
    async getConfig(id: number): Promise<NodeConfiguration> {
        const data = await this.client.requests.get(endpoints.nodes.config(id));
        return caseConv.toCamelCase(data);
    }

    /**
     * Creates a node.
     * @param options Create node options.
     * @see {@link CreateNodeOptions}.
     * @returns The new node.
     * @example
     * ```
     * app.nodes.create({
     *  name: 'node04',
     *  locationId: 2,
     *  public: false,
     *  fqdn: 'n4.nodes.pterodactyl.test',
     *  scheme: 'https',
     *  behindProxy: false,
     *  memory: 1024,
     *  disk: 4000,
     *  daemonSftp: 2022,
     *  daemonListen: 8080,
     *  maintenanceMode: false
     * })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async create(options: CreateNodeOptions): Promise<Node> {
        const payload = caseConv.toSnakeCase<object>(options);
        const data = await this.client.requests.post(
            endpoints.nodes.main,
            payload,
        );
        return this._patch(data);
    }

    /**
     * Updates a node with the specified options.
     * @param id The ID of the node.
     * @param options Update node options.
     * @see {@link CreateNodeOptions}.
     * @returns The updated node.
     * @example
     * ```
     * app.nodes.update(4, { maintenanceMode: true })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async update(
        id: number,
        options: Partial<CreateNodeOptions>,
    ): Promise<Node> {
        if (!Object.keys(options).length)
            throw new ValidationError('Too few options to update the node.');

        const _node = await this.fetch(id);
        options = Object.assign(options, _node);
        const payload = caseConv.toSnakeCase<object>(options);

        const data = await this.client.requests.patch(
            endpoints.nodes.get(id),
            payload,
        );
        return this._patch(data);
    }

    /**
     * Deletes a node.
     * Note: there must be no servers on the node for this operation to work.
     * Please ensure this before attempting to delete the node.
     * @param id The ID of the node.
     * @example
     * ```
     * app.nodes.delete(3).catch(console.error);
     * ```
     */
    async delete(id: number): Promise<void> {
        await this.client.requests.delete(endpoints.nodes.get(id));
        this.cache.delete(id);
    }
}
