import type { PteroApp } from '.';
import { Allocation } from '../common/app';
import { Dict } from '../structures/Dict';
import { FetchOptions, Include, PaginationMeta } from '../common';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';
import { BaseManagerFetchAll } from '../structures/BaseManagerFetchAll';

export class NodeAllocationManager extends
    BaseManagerFetchAll<[node: number, options: Include<FetchOptions>], number, Dict<number, Allocation>> {

    public client: PteroApp;
    public cache: Dict<number, Dict<number, Allocation>>;
    public meta: PaginationMeta;

    /** Allowed filter arguments for allocations. */
    get FILTERS() {
        return Object.freeze([]);
    }

    /** Allowed include arguments for allocations. */
    get INCLUDES() {
        return Object.freeze(['node', 'server']);
    }

    /** Allowed sort arguments for allocations. */
    get SORTS() {
        return Object.freeze([]);
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

    _patch(node: number, data: any): any {
        if (data?.meta?.pagination) {
            this.meta = caseConv.toCamelCase(data.meta.pagination, {
                ignore: ['current_page'],
            });
            this.meta.current = data.meta.pagination.current_page;
        }

        const res = new Dict<number, Allocation>();
        for (let o of data.data) {
            const a = caseConv.toCamelCase<Allocation>(o.attributes);
            res.set(a.id, a);
        }

        const all = (this.cache.get(node) || new Dict()).join(res);
        this.cache.set(node, all);
        return res;
    }

    /**
     * @param id The ID of the allocation.
     * @returns The formatted URL to the allocation in the admin panel.
     */
    adminURLFor(id: number): string {
        return `${this.client.domain}/admin/nodes/view/${id}/allocation`;
    }

    /**
     * Fetches a list of allocations on a specific node from the API with the given options
     * (default is undefined).
     * @see {@link Include} and {@link FetchOptions}.
     *
     * @param [options] Additional fetch options.
     * @returns The fetched allocations.
     * @example
     * ```
     * app.allocations.fetch(4, { page: 3 })
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async fetch(
        node: number,
        options: Include<FetchOptions> = {},
    ): Promise<Dict<number, Allocation>> {
        if (!options.force) {
            const a = this.cache.get(node);
            if (a) return Promise.resolve(a);
        }

        const data = await this.client.requests.get(
            endpoints.nodes.allocations.main(node),
            options,
            null,
            this,
        );
        return this._patch(node, data);
    }

    /**
     * Fetches the available allocations on a node and returns a single one.
     * @param node The ID of the node.
     * @param single Whether to return a single allocation.
     * @returns The available allocation(s).
     * @example
     * ```
     * app.allocations.fetchAvailable(4, true)
     *  .then(console.log)
     *  .catch(console.error);
     * ```
     */
    async fetchAvailable(
        node: number,
        single: true,
    ): Promise<Allocation | undefined>;
    /**
     * Fetches the available allocations on a node.
     * @param node The ID of the node.
     * @param single Whether to return a single allocation.
     * @returns The available allocation(s).
     * @example
     * ```
     * app.allocations.fetchAvailable(4, false)
     *  .then(all => all.forEach(a => console.log(a)))
     *  .catch(console.error);
     * ```
     */
    async fetchAvailable(
        node: number,
        single: false,
    ): Promise<Dict<number, Allocation>>;
    async fetchAvailable(node: number, single: boolean): Promise<any> {
        const all = await this.fetch(node);
        return single
            ? all.filter(a => !a.assigned).first()
            : all.filter(a => !a.assigned);
    }

    /**
     * Creates a number of allocations based on the ports specified. Note that the created
     * allocations will not be returned due to the number that can be created in a single request,
     * which can cause unwanted issues.
     * @param node The ID of the node.
     * @param ip The IP for the allocation.
     * @param ports A list of ports or port ranges for the allocation.
     * @example
     * ```
     * app.allocations.create(4, '10.0.0.1', ['8000-9000'])
     *  .catch(console.error);
     * ```
     */
    async create(node: number, ip: string, ports: string[]): Promise<void> {
        if (!ports.every(p => typeof p === 'string'))
            throw new TypeError(
                'Allocation ports must be a string integer or string range.',
            );

        for (const port of ports) {
            if (!port.includes('-')) continue;
            const [_start, _stop] = port.split('-');
            const start = Number(_start),
                stop = Number(_stop);

            if (start > stop)
                throw new RangeError('Start cannot be greater than stop.');

            if (start <= 1024 || stop > 65535)
                throw new RangeError(
                    'Port range must be between 1024 and 65535.',
                );

            if (stop - start > 1000)
                throw new RangeError('Maximum port range exceeded (1000).');
        }

        await this.client.requests.post(
            endpoints.nodes.allocations.main(node),
            { ip, ports },
        );
    }

    /**
     * Deletes an allocation from a node.
     * @param node The ID of the node.
     * @param id The ID of the allocation.
     * @example
     * ```
     * app.allocations.delete(4, 92).catch(console.error);
     * ```
     */
    async delete(node: number, id: number): Promise<void> {
        await this.client.requests.delete(
            endpoints.nodes.allocations.get(node, id),
        );
        this.cache.get(node)?.delete(id);
    }
}
