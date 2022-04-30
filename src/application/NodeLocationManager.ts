import type { PteroApp } from './app';
import { BaseManager } from '../structures/BaseManager';
import { Dict } from '../structures/Dict';
import {
    FetchOptions,
    Filter,
    FilterArray,
    Include,
    NodeLocation,
    Sort,
    Resolvable
} from '../common';
import endpoints from './endpoints';

export class NodeLocationManager extends BaseManager {
    public client: PteroApp;
    public cache: Dict<number, NodeLocation>;

    get FILTERS(): Readonly<string[]> {
        return Object.freeze(['short', 'long']);
    }

    get INCLUDES(): Readonly<string[]> {
        return Object.freeze(['nodes', 'servers']);
    }

    get SORTS(): Readonly<string[]> { return Object.freeze([]); }

    constructor(client: PteroApp) {
        super();
        this.client = client;
        this.cache = new Dict<number, NodeLocation>();
    }

    _patch(data: any): NodeLocation | Dict<number, NodeLocation> {
        if (data?.data) {
            const res = new Dict<number, NodeLocation>();
            for (let obj of data.data) {
                obj = obj.attributes;
                res.set(obj.id, {
                    id: obj.id,
                    long: obj.long,
                    short: obj.short,
                    createdAt: new Date(obj.created_at),
                    updatedAt: obj.updated_at ? new Date(obj.updated_at) : null
                });
            }

            if (this.client.options.locations.cache)
                res.forEach((v, k) => this.cache.set(k, v));

            return res;
        }

        data = data.attributes;
        const loc: NodeLocation = {
            id: data.id,
            long: data.long,
            short: data.short,
            createdAt: new Date(data.created_at),
            updatedAt: data.updated_at ? new Date(data.updated_at) : null
        }

        if (this.client.options.locations.cache) this.cache.set(data.id, loc);
        return loc;
    }

    resolve(obj: Resolvable<any>): NodeLocation | undefined {
        if (typeof obj === 'number') return this.cache.get(obj);
        if (typeof obj === 'string') return this.cache.find(
            o => (o.short === obj) || (o.long === obj)
        );
        if (obj.relationships?.location?.attributes)
            return this._patch(obj.relationships.location) as NodeLocation;

        return undefined;
    }

    adminURLFor(id: number) {
        return `${this.client.domain}/admin/locations/view/${id}`;
    }

    async fetch<T extends number | undefined>(
        id?: T,
        options: Include<FetchOptions> = {}
    ): Promise<T extends undefined ? Dict<number, NodeLocation> : NodeLocation> {
        if (id && !options.force) {
            const loc = this.cache.get(id);
            if (loc) return Promise.resolve<any>(loc);
        }

        const data = await this.client.requests.get(
            (id ? endpoints.locations.get(id) : endpoints.locations.main),
            options, this
        );
        return this._patch(data) as any;
    }

    async query(
        entity: string,
        options: Filter<Sort<{}>>
    ): Promise<Dict<number, NodeLocation>> {
        if (!options.sort && !options.filter) throw new Error('Sort or filter is required.');

        const payload: FilterArray<Sort<{}>> = {};
        if (options.filter) payload.filter = [entity, options.filter];
        if (options.sort) payload.sort = options.sort;

        const data = await this.client.requests.get(
            endpoints.locations.main,
            payload as FilterArray<Sort<FetchOptions>>,
            this
        );
        return this._patch(data) as any;
    }

    async create(short: string, long: string): Promise<NodeLocation> {
        const data = await this.client.requests.post(
            endpoints.locations.main, { short, long }
        );
        return this._patch(data) as NodeLocation;
    }

    async update(
        id: number,
        options:{ short?: string; long?: string }
    ): Promise<NodeLocation> {
        if (!options.short && !options.long)
            throw new Error('Either short or long is required to update the location');

        const data = await this.client.requests.patch(
            endpoints.locations.get(id), options
        );
        return this._patch(data) as NodeLocation;
    }

    async delete(id: number): Promise<void> {
        await this.client.requests.delete(endpoints.locations.get(id));
        this.cache.delete(id);
    }
}
