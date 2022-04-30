import type { PteroApp } from './app';
import { BaseManager } from '../structures/BaseManager';
import { FetchOptions, Include } from '../common';
import { Nest } from '../common/app';
import endpoints from './endpoints';

export class NestManager extends BaseManager {
    public client: PteroApp;
    public cache: Set<Nest>;
    
    get FILTERS(): Readonly<string[]> { return Object.freeze([]); }

    get INCLUDES(): Readonly<string[]> {
        return Object.freeze(['eggs', 'servers']);
    }

    get SORTS(): Readonly<string[]> { return Object.freeze([]); }

    constructor(client: PteroApp) {
        super();
        this.client = client;
        this.cache = new Set<Nest>();
    }

    _patch(data: any) {
        const res = new Set<Nest>();
        if (data.data) {
            for (let o of data.data) {
                o = o.attributes;
                res.add({
                    id: o.id,
                    uuid: o.uuid,
                    author: o.author,
                    name: o.name,
                    description: o.description,
                    createdAt: new Date(o.created_at),
                    updatedAt: o.updated_at ? new Date(o.updated_at) : undefined
                });
            }

            if (this.client.options.nests.cache) res.forEach(n => this.cache.add(n));
            return res;
        }

        data = data.attributes;
        res.add({
            id: data.id,
            uuid: data.uuid,
            author: data.author,
            name: data.name,
            description: data.description,
            createdAt: new Date(data.created_at),
            updatedAt: data.updated_at ? new Date(data.updated_at) : undefined
        });

        if (this.client.options.nests.cache) res.forEach(n => this.cache.add(n));
        return res;
    }

    adminURLFor(id: number): string {
        return `${this.client.domain}/admin/nests/view/${id}`;
    }

    async fetch(id: number, include: string[] = []): Promise<Set<Nest>> {
        const data = await this.client.requests.get(
            endpoints.nests.get(id),
            { include } as Include<FetchOptions>,
            this
        );
        return this._patch(data);
    }
}
