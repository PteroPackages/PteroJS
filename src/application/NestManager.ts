import type { PteroApp } from '.';
import { BaseManager } from '../structures/BaseManager';
import { Dict } from '../structures/Dict';
import { FetchOptions, Include } from '../common';
import { Nest } from '../common/app';
import { NestEggsManager } from './NestEggsManager';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';

export class NestManager extends BaseManager {
    public client: PteroApp;
    public cache: Dict<number, Nest>;
    public eggs: NestEggsManager;

    /** Allowed filter arguments for nests. */
    get FILTERS() { return Object.freeze([]); }

    /** Allowed include arguments for nests. */
    get INCLUDES() {
        return Object.freeze(['eggs', 'servers']);
    }

    /** Allowed sort arguments for nests. */
    get SORTS() { return Object.freeze([]); }

    constructor(client: PteroApp) {
        super();
        this.client = client;
        this.cache = new Dict();
        this.eggs = new NestEggsManager(client);
    }

    _patch(data: any): any {
        if (data?.data) {
            const res = new Dict<number, Nest>();
            for (let o of data.data) {
                const n = caseConv.toCamelCase<Nest>(o.attributes);
                n.createdAt = new Date(n.createdAt);
                n.updatedAt &&= new Date(n.updatedAt);
                res.set(n.id, n);
            }

            if (this.client.options.nests.cache) this.cache = this.cache.join(res);
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
     * Fetches a nest or a list of nests from the Pterodactyl API.
     * @param [id] The ID of the nest.
     * @param [include] Optional include arguments.
     * @returns The fetched nest(s).
     */
    async fetch(id: number, include?: string[]): Promise<Nest>;
    async fetch(include?: string[]): Promise<Dict<number, Nest>>;
    async fetch(op?: number | string[], include: string[] = []): Promise<any> {
        let path = endpoints.nests.main;
        if (typeof op === 'number') {
            path = endpoints.nests.get(op);
        } else {
            include.push(...op || []);
        }

        const data = await this.client.requests.get(
            path,
            { include } as Include<FetchOptions>,
            null, this
        );
        return this._patch(data);
    }
}
