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

    get FILTERS(): Readonly<string[]> { return Object.freeze([]); }

    get INCLUDES(): Readonly<string[]> {
        return Object.freeze([
            'nest', 'servers', 'config',
            'script', 'variables'
        ]);
    }

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

    adminURLFor(id: number): string {
        return `${this.client.domain}/admin/nests/egg/${id}`;
    }

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
