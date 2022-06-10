import type { PteroApp } from '.';
import { BaseManager } from '../structures/BaseManager';
import { Dict } from '../structures/Dict';
import { FetchOptions, Include } from '../common';
import { Allocation } from '../common/app';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';

export class NodeAllocationManager extends BaseManager {
    public client: PteroApp;
    public cache: Dict<number, Dict<number, Allocation>>;

    /** Allowed filter arguments for allocations. */
    get FILTERS() { return Object.freeze([]); }

    /** Allowed include arguments for allocations. */
    get INCLUDES() {
        return Object.freeze(['node', 'server']);
    }

    /** Allowed sort arguments for allocations. */
    get SORTS() { return Object.freeze([]); }

    constructor(client: PteroApp) {
        super();
        this.client = client;
        this.cache = new Dict();
    }

    _patch(node: number, data: any): any {
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
     * Fetches a list of allocations from the Pterodactyl API.
     * @param node The ID of the node.
     * @param options Additional fetch options.
     * @returns The fetched allocations.
     */
    async fetch(
        node: number,
        options: Include<FetchOptions> = {}
    ): Promise<Dict<number, Allocation>> {
        if (!options.force) {
            const a = this.cache.get(node);
            if (a) return Promise.resolve(a);
        }

        const data = await this.client.requests.get(
            endpoints.nodes.allocations.main(node),
            options, null, this
        );
        return this._patch(node, data);
    }

    /**
     * Fetches the available allocations on a node.
     * @param node The ID of the node.
     * @param single Whether to return a single allocation.
     * @returns The available allocation(s).
     */
    async fetchAvailable(node: number, single: true): Promise<Allocation | undefined>;
    async fetchAvailable(node: number, single: false): Promise<Dict<number, Allocation>>;
    async fetchAvailable(node: number, single: boolean): Promise<any> {
        const all = await this.fetch(node);
        return single
            ? all.filter(a => !a.assigned).first()
            : all.filter(a => !a.assigned);
    }

    /**
     * Creates a number of allocations based on the ports specified.
     * @param node The ID of the node.
     * @param ip The IP for the allocation.
     * @param ports A list of ports or port ranges for the allocation.
     */
    async create(node: number, ip: string, ports: string[]): Promise<void> {
        if (!ports.every(p => typeof p === 'string')) throw new TypeError(
            'Allocation ports must be a string integer or string range.'
        );

        for (const port of ports) {
            if (!port.includes('-')) continue;
            const [_start, _stop] = port.split('-');
            const start = Number(_start), stop = Number(_stop);

            if (start > stop) throw new RangeError('Start cannot be greater than stop.');
            if (start <= 1024 || stop > 65535)
                throw new RangeError('Port range must be between 1024 and 65535.');

            if (stop - start > 1000) throw new RangeError(
                'Maximum port range exceeded (1000).'
            );
        }

        await this.client.requests.post(
            endpoints.nodes.allocations.main(node),
            { ip, ports }
        );
    }

    /**
     * Deletes an allocation from a node.
     * @param node The ID of the node.
     * @param id The ID of the allocation.
     */
    async delete(node: number, id: number): Promise<void> {
        await this.client.requests.delete(endpoints.nodes.allocations.get(node, id));
        this.cache.get(node)?.delete(id);
    }
}
