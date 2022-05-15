import type { PteroApp } from '.';
import { BaseManager } from '../structures/BaseManager';
import { Dict } from '../structures/Dict';
import { Node } from '../structures/Node';
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

    get FILTERS() {
        return Object.freeze(['uuid', 'name', 'fqdn', 'daemon_token_id']);
    }

    get INCLUDES() {
        return Object.freeze(['allocations', 'location', 'servers']);
    }

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
            if (this.client.options.servers.cache) this.cache = this.cache.join(res);
            return res;
        }

        const n = new Node(this.client, data.attributes);
        if (this.client.options.nodes.cache) this.cache.set(n.id, n);
        return n;
    }

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

    adminURLFor(id: number): string {
        return `${this.client.domain}/admin/nodes/view/${id}`;
    }

    async fetch<T extends number | undefined>(
        id?: T,
        options: Include<FetchOptions> = {}
    ): Promise<T extends undefined ? Dict<number, Node> : Node> {
        if (id && !options.force) {
            const n = this.cache.get(id);
            if (n) return Promise.resolve<any>(n);
        }

        const data = await this.client.requests.get(
            (id ? endpoints.nodes.get(id) : endpoints.nodes.main),
            options, null, this
        );
        return this._patch(data);
    }

    async fetchDeployable(options: NodeDeploymentOptions): Promise<Dict<number, Node>> {
        const data = await this.client.requests.get(
            endpoints.nodes.deploy, undefined, options
        );
        return this._patch(data);
    }

    async query(
        entity: string,
        options: Filter<Sort<{}>>
    ): Promise<Dict<number, Node>> {
        if (!options.sort && !options.filter) throw new Error('Sort or filter is required.');
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

    async getConfig(id: number): Promise<NodeConfiguration> {
        const data = await this.client.requests.get(
            endpoints.nodes.config(id), {}, null, this
        );
        return caseConv.toCamelCase(data);
    }

    async create(options: CreateNodeOptions): Promise<Node> {
        const payload = caseConv.toSnakeCase<object>(options);
        const data = await this.client.requests.post(
            endpoints.users.main, payload
        );
        return this._patch(data);
    }

    async update(
        id: number,
        options: Partial<CreateNodeOptions>
    ): Promise<Node> {
        if (!Object.keys(options).length)
            throw new Error('Too few options to update the node.');

        const _node = await this.fetch(id);
        options = Object.assign(options, _node);
        const payload = caseConv.toSnakeCase<object>(options);

        const data = await this.client.requests.patch(
            endpoints.nodes.get(id), payload
        );
        return this._patch(data);
    }

    async delete(id: number): Promise<void> {
        await this.client.requests.delete(endpoints.nodes.get(id));
        this.cache.delete(id);
    }
}
