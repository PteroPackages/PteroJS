import type { PteroApp } from './app';
import { BaseManager } from '../structures/BaseManager';
import { Dict } from '../structures/Dict';
import { FetchOptions, Include } from '../common';
import { Nest } from '../common/app';
import { NestEggsManager } from './NestEggsManager';
import endpoints from './endpoints';

export class NestManager extends BaseManager {
    public client: PteroApp;
    public cache: Dict<number, Nest>;
    public eggs: NestEggsManager;

    get FILTERS(): Readonly<string[]> { return Object.freeze([]); }

    get INCLUDES(): Readonly<string[]> {
        return Object.freeze(['eggs', 'servers']);
    }

    get SORTS(): Readonly<string[]> { return Object.freeze([]); }

    constructor(client: PteroApp) {
        super();
        this.client = client;
        this.cache = new Dict<number, Nest>();
        this.eggs = new NestEggsManager(client);
    }

        _patch(data: any): Nest | Dict<number, Nest> {
            if (data?.data) {
                const res = new Dict<number, Nest>();
                for (let o of data.data) {
                    o = o.attributes;
                    res.set(o.id, {
                        id: o.id,
                        uuid: o.uuid,
                        author: o.author,
                        name: o.name,
                        description: o.description,
                        createdAt: new Date(o.created_at),
                        updatedAt: o.updated_at ? new Date(o.updated_at) : undefined
                    });
                }

                if (this.client.options.nests.cache)
                    res.forEach((v, k) => this.cache.set(k, v));

                return res;
            }

            data = data.attributes;
            const n = {
                id: data.id,
                uuid: data.uuid,
                author: data.author,
                name: data.name,
                description: data.description,
                createdAt: new Date(data.created_at),
                updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
            }
            if (this.client.options.nodes.cache) this.cache.set(n.id, n);
            return n;
        }

    adminURLFor(id: number): string {
        return `${this.client.domain}/admin/nests/view/${id}`;
    }

    async fetch<T extends number | undefined>(
        id?: T,
        include: string[] = []
    ): Promise<T extends undefined ? Dict<number, Nest> : Nest> {
        const data = await this.client.requests.get(
            id ? endpoints.nests.get(id) : endpoints.nests.main,
            { include } as Include<FetchOptions>,
            this
        );
        return this._patch(data) as any;
    }
}
