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
    get FILTERS(): Readonly<string[]> { return Object.freeze([]); }

    /** Allowed include arguments for eggs. */
    get INCLUDES(): Readonly<string[]> {
        return Object.freeze([
            'nest', 'servers', 'config',
            'script', 'variables'
        ]);
    }

    /** Allowed sort arguments for eggs. */
    get SORTS(): Readonly<string[]> { return Object.freeze([]); }

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

            this.cache = this.cache.join(res);
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
    async fetch<T extends number | undefined>(
        nest: number,
        id?: T,
        options: Include<FetchOptions> = {}
    ): Promise<T extends undefined ? Dict<number, Egg> : Egg> {
        if (id && !options.force) {
            const e = this.cache.get(id);
            if (e) return Promise.resolve<any>(e);
        }

        const data = await this.client.requests.get(
            id ? endpoints.nests.eggs.get(nest, id) : endpoints.nests.eggs.main(nest),
            options, null, this
        );
        return this._patch(data);
    }
}
