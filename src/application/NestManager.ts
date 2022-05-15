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

    get FILTERS(): Readonly<string[]> { return Object.freeze([]); }

    get INCLUDES(): Readonly<string[]> {
        return Object.freeze(['eggs', 'servers']);
    }

    get SORTS(): Readonly<string[]> { return Object.freeze([]); }

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
        return this._patch(data);
    }
}
