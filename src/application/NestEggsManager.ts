import type { PteroApp } from './app';
import { BaseManager } from '../structures/BaseManager';
import { Dict } from '../structures/Dict';
import { FetchOptions, Include } from '../common';
import { Egg } from '../common/app';
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
        this.cache = new Dict<number, Egg>();
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

        const data: any = await this.client.requests.get(
            (id ? endpoints.nests.eggs.get(nest, id) : endpoints.nests.eggs.main(nest)),
            options, this
        );

        const res = new Dict<number, Egg>();
        for (const egg of data.data) {
            this.cache.set(egg.attributes.id, egg.attributes);
            res.set(egg.attributes.id, egg.attributes);
        }
        return res as any;
    }
}
