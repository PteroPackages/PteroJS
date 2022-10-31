import type { PteroApp } from '.';
import { Dict } from '../structures/Dict';
import { FetchOptions, Include, PaginationMeta } from '../common';
import { Nest } from '../common/app';
import { NestEggsManager } from './NestEggsManager';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';
import { BaseManager } from '../structures/BaseManager';

export class NestManager extends BaseManager {
    public client: PteroApp;
    public cache: Dict<number, Nest>;
    public meta: PaginationMeta;
    public eggs: NestEggsManager;

    /** Allowed filter arguments for nests (none). */
    get FILTERS() {
        return Object.freeze([]);
    }

    /**
     * Allowed include arguments for nests:
     * * eggs
     * * servers
     */
    get INCLUDES() {
        return Object.freeze(['eggs', 'servers']);
    }

    /** Allowed sort arguments for nests (none). */
    get SORTS() {
        return Object.freeze([]);
    }

    constructor(client: PteroApp) {
        super();
        this.client = client;
        this.cache = new Dict();
        this.eggs = new NestEggsManager(client);
        this.meta = {
            current: 0,
            total: 0,
            count: 0,
            perPage: 0,
            totalPages: 0,
        };
    }

    /**
     * Transforms the raw nest object(s) into typed objects.
     * @param data The resolvable nest object(s).
     * @returns The resolved nest object(s).
     */
    _patch(data: any): any {
        if (data?.meta?.pagination) {
            this.meta = caseConv.toCamelCase(data.meta.pagination, {
                ignore: ['current_page'],
            });
            this.meta.current = data.meta.pagination.current_page;
        }

        if (data?.data) {
            const res = new Dict<number, Nest>();
            for (let o of data.data) {
                const n = caseConv.toCamelCase<Nest>(o.attributes);
                n.createdAt = new Date(n.createdAt);
                n.updatedAt &&= new Date(n.updatedAt);
                res.set(n.id, n);
            }

            if (this.client.options.nests.cache) this.cache.update(res);
            return res;
        }

        const n = caseConv.toCamelCase<Nest>(data.attributes);
        n.createdAt = new Date(n.createdAt);
        n.updatedAt &&= new Date(n.updatedAt);
        if (this.client.options.nodes.cache) this.cache.set(n.id, n);
        return n;
    }

    /**
     * @param id The ID of the nest.
     * @returns The formatted URL to the nest in the admin panel.
     */
    adminURLFor(id: number): string {
        return `${this.client.domain}/admin/nests/view/${id}`;
    }

    /**
     * Fetches a nest from the API with the given options (default is undefined).
     * @param id The ID of the nest.
     * @param [include] Optional include arguments.
     * @returns The fetched nest.
     * @example
     * ```
     * app.nests.fetch(1).then(console.log).catch(console.error);
     * ```
     */
    async fetch(id: number, include?: string[]): Promise<Nest>;
    /**
     * Fetches a list of nests from the API with the given options (default is undefined).
     * @param [include] Optional include arguments.
     * @returns The fetched nest.
     * @example
     * ```
     * app.nests.fetch()
     *  .then(nests => nests.forEach(n => console.log(n)))
     *  .catch(console.error);
     * ```
     */
    async fetch(include?: string[]): Promise<Dict<number, Nest>>;
    async fetch(op?: number | string[], include: string[] = []): Promise<any> {
        let path = endpoints.nests.main;
        if (typeof op === 'number') {
            path = endpoints.nests.get(op);
        } else {
            include.push(...(op || []));
        }

        const data = await this.client.requests.get(
            path,
            { include } as Include<FetchOptions>,
            null,
            this,
        );
        return this._patch(data);
    }
}
