import type { PteroApp } from '.';
import { BaseManager } from '../structures/BaseManager';
import { Dict } from '../structures/Dict';
import { FetchOptions, Include } from '../common';
import { Egg } from '../common/app';
import caseConv from '../util/caseConv';
import endpoints from './endpoints';

export class NestEggsManager extends BaseManager {
    public client: PteroApp;
    public cache: Dict<number, Egg>;

    /** Allowed filter arguments for eggs. */
    get FILTERS() { return Object.freeze([]); }

    /** Allowed include arguments for eggs. */
    get INCLUDES() {
        return Object.freeze([
            'nest', 'servers', 'config',
            'script', 'variables'
        ]);
    }

    /** Allowed sort arguments for eggs. */
    get SORTS() { return Object.freeze([]); }

    constructor(client: PteroApp) {
        super();
        this.client = client;
        this.cache = new Dict();
    }

    _patch(data: any): any {
        if (data?.data) {
            const res = new Dict<number, Egg>();
            for (let o of data.data) {
                let e = caseConv.toCamelCase<Egg>(o.attributes);
                e.createdAt = new Date(e.createdAt);
                e.updatedAt &&= new Date(e.updatedAt);
                res.set(e.id, e);
            }

            this.cache.update(res);
            return res;
        }

        let e = caseConv.toCamelCase<Egg>(data.attributes);
        e.createdAt = new Date(e.createdAt);
        e.updatedAt &&= new Date(e.updatedAt);
        this.cache.set(e.id, e);
        return e;
    }

    /**
     * @param id The ID of the egg.
     * @returns The formatted URL to the egg in the admin panel.
     */
    adminURLFor(id: number): string {
        return `${this.client.domain}/admin/nests/egg/${id}`;
    }

    /**
     * Fetches an egg or a list of eggs from the Pterodactyl API.
     * @param nest The ID of the nest.
     * @param [id] The ID of the egg.
     * @param [options] Additional fetch options.
     * @returns The fetched egg(s).
     */
    async fetch(nest: number, id: number, options?: Include<FetchOptions>): Promise<Egg>;
    async fetch(
        nest: number,
        options?: Include<FetchOptions>
    ): Promise<Dict<number, Egg>>;
    async fetch(
        nest: number,
        op1?: number | Include<FetchOptions>,
        op2: Include<FetchOptions> = {}
    ): Promise<any> {
        let path = endpoints.nests.eggs.main(nest);

        if (typeof op1 === 'number') {
            if (!op2.force && this.cache.has(op1))
                return this.cache.get(op1);

            path = endpoints.nests.eggs.get(nest, op1);
        } else {
            if (op1) op2 = op1;
        }

        const data = await this.client.requests.get(path, op2, null, this);
        return this._patch(data);
    }
}
