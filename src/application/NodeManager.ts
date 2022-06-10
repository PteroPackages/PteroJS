import type { PteroApp } from '.';
import { BaseManager } from '../structures/BaseManager';
import { Dict } from '../structures/Dict';
import { Node } from '../structures/Node';
import { ValidationError } from '../structures/Errors';
import {
    CreateNodeOptions,
    NodeConfiguration,
    NodeDeploymentOptions
} from '../common/app';
import {
    Filter,
    FilterArray,
    Include,
    Sort,
    Resolvable,
    FetchOptions
} from '../common';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';

export class NodeManager extends BaseManager {
    public client: PteroApp;
    public cache: Dict<number, Node>;

    /** Allowed filter arguments for nodes. */
    get FILTERS() {
        return Object.freeze(['uuid', 'name', 'fqdn', 'daemon_token_id']);
    }

    /** Allowed include arguments for nodes. */
    get INCLUDES() {
        return Object.freeze(['allocations', 'location', 'servers']);
    }

    /** Allowed sort arguments for nodes. */
    get SORTS() {
        return Object.freeze(['id', 'uuid', 'memory', 'disk']);
    }

    constructor(client: PteroApp) {
        super();
        this.client = client;
        this.cache = new Dict();
    }

    _patch(data: any): any {
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
        if (typeof obj === 'string') return this.cache.find(
            n => n.name === obj
        );
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
     * Fetches a node or a list of nodes from the Pterodactyl API.
     * @param [id] The ID of the node.
     * @param [options] Additional fetch options.
     * @returns The fetched node(s).
     */
    async fetch(id: number, options?: Include<FetchOptions>): Promise<Node>;
    async fetch(options?: Include<FetchOptions>): Promise<Dict<number, Node>>;
    async fetch(
        op?: number | Include<FetchOptions>,
        ops: Include<FetchOptions> = {}
    ): Promise<any> {
        let path = endpoints.nodes.main;
        if (typeof op === 'number') {
            if (!ops.force && this.cache.has(op))
                return this.cache.get(op);

            path = endpoints.nodes.get(op);
        } else {
            if (op) ops = op;
        }

        const data = await this.client.requests.get(path, ops, null, this);
        return this._patch(data);
    }

    /**
     * Fetches the deployable nodes from the API following the specified deployable
     * node options.
     * @param options Deployable node options.
     * @see {@link NodeDeploymentOptions}.
     * @returns The deployable nodes.
     */
    async fetchDeployable(
        options: NodeDeploymentOptions
    ): Promise<Dict<number, Node>> {
        const data = await this.client.requests.get(
            endpoints.nodes.deploy, undefined, options
        );
        return this._patch(data);
    }

    /**
     * Queries the Pterodactyl API for nodes that match the specified query filters.
     * This fetches from the API directly and does not check the cache. Use cache methods
     * for filtering and sorting.
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
     */
    async query(
        entity: string,
        options: Filter<Sort<{}>>
    ): Promise<Dict<number, Node>> {
        if (!options.sort && !options.filter) throw new ValidationError(
            'Sort or filter is required.'
        );
        if (options.filter === 'daemonTokenId') options.filter = 'daemon_token_id';

        const payload: FilterArray<Sort<{}>> = {};
        if (options.filter) payload.filter = [options.filter, entity];
        if (options.sort) payload.sort = options.sort;

        const data = await this.client.requests.get(
            endpoints.nodes.main,
            payload as FilterArray<Sort<FetchOptions>>,
            null, this
        );
        return this._patch(data);
    }

    /**
     * Fetches the node configuration.
     * @param id The ID of the node.
     * @returns The node configuration.
     */
    async getConfig(id: number): Promise<NodeConfiguration> {
        const data = await this.client.requests.get(
            endpoints.nodes.config(id)
        );
        return caseConv.toCamelCase(data);
    }

    /**
     * Creates a node.
     * @param options Create node options.
     * @see {@link CreateNodeOptions}.
     * @returns The new node.
     */
    async create(options: CreateNodeOptions): Promise<Node> {
        const payload = caseConv.toSnakeCase<object>(options);
        const data = await this.client.requests.post(
            endpoints.users.main, payload
        );
        return this._patch(data);
    }

    /**
     * Updates a node with the specified options.
     * @param id The ID of the node.
     * @param options Update node options.
     * @see {@link CreateNodeOptions}.
     * @returns The updated node.
     */
    async update(
        id: number,
        options: Partial<CreateNodeOptions>
    ): Promise<Node> {
        if (!Object.keys(options).length)
            throw new ValidationError('Too few options to update the node.');

        const _node = await this.fetch(id);
        options = Object.assign(options, _node);
        const payload = caseConv.toSnakeCase<object>(options);

        const data = await this.client.requests.patch(
            endpoints.nodes.get(id), payload
        );
        return this._patch(data);
    }

    /**
     * Deletes a node.
     * Note: there must be no servers on the node for this operation to work.
     * Please ensure this before attempting to delete the node.
     * @param id The ID of the node.
     */
    async delete(id: number): Promise<void> {
        await this.client.requests.delete(endpoints.nodes.get(id));
        this.cache.delete(id);
    }
}
