import type { PteroApp } from '.';
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
import caseConv from '../util/caseConv';
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
        this.cache = new Dict();
    }

    _patch(data: any): any {
        if (data?.data) {
            const res = new Dict<number, NodeLocation>();
            for (let o of data.data) {
                const n = caseConv.toCamelCase<NodeLocation>(o.attributes);
                n.createdAt = new Date(n.createdAt);
                n.updatedAt &&= new Date(n.updatedAt);
                res.set(n.id, n);
            }

            if (this.client.options.locations.cache) this.cache = this.cache.join(res);
            return res;
        }

        const loc = caseConv.toCamelCase<NodeLocation>(data.attributes);
        loc.createdAt = new Date(loc.createdAt);
        loc.updatedAt &&= new Date(loc.updatedAt);
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
        return this._patch(data);
    }

    async query(
        entity: string,
        options: Filter<Sort<{}>>
    ): Promise<Dict<number, NodeLocation>> {
        if (!options.sort && !options.filter) throw new Error(
            'Sort or filter is required.'
        );

        const payload: FilterArray<Sort<{}>> = {};
        if (options.filter) payload.filter = [options.filter, entity];
        if (options.sort) payload.sort = options.sort;

        const data = await this.client.requests.get(
            endpoints.locations.main,
            payload as FilterArray<Sort<FetchOptions>>,
            null, this
        );
        return this._patch(data);
    }

    async create(short: string, long: string): Promise<NodeLocation> {
        const data = await this.client.requests.post(
            endpoints.locations.main, { short, long }
        );
        return this._patch(data);
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
        return this._patch(data);
    }

    async delete(id: number): Promise<void> {
        await this.client.requests.delete(endpoints.locations.get(id));
        this.cache.delete(id);
    }
}
