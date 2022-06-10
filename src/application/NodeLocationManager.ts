import type { PteroApp } from '.';
import { BaseManager } from '../structures/BaseManager';
import { Dict } from '../structures/Dict';
import { ValidationError } from '../structures/Errors';
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

    /** Allowed filter arguments for locations. */
    get FILTERS() {
        return Object.freeze(['short', 'long']);
    }

    /** Allowed include arguments for locations. */
    get INCLUDES() {
        return Object.freeze(['nodes', 'servers']);
    }

    /** Allowed sort arguments for locations. */
    get SORTS() { return Object.freeze([]); }

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

    /**
     * Resolves a location from an object. This can be:
     * * a string
     * * a number
     * * an object
     * 
     * @param obj The object to resolve from.
     * @returns The resolved location or undefined if not found.
     */
    resolve(obj: Resolvable<any>): NodeLocation | undefined {
        if (typeof obj === 'number') return this.cache.get(obj);
        if (typeof obj === 'string') return this.cache.find(
            o => (o.short === obj) || (o.long === obj)
        );
        if (obj.relationships?.location?.attributes)
            return this._patch(obj.relationships.location) as NodeLocation;

        return undefined;
    }

    /**
     * @param id The ID of the location.
     * @returns The formatted URL to the location in the admin panel.
     */
    adminURLFor(id: number) {
        return `${this.client.domain}/admin/locations/view/${id}`;
    }

    /**
     * Fetches a location or a list of locations from the Pterodactyl API.
     * @param [id] The ID of the location.
     * @param [options] Additional fetch options.
     * @returns The fetched locations(s).
     */
    async fetch(id: number, options?: Include<FetchOptions>): Promise<NodeLocation>;
    async fetch(options?: Include<FetchOptions>): Promise<Dict<number, NodeLocation>>;
    async fetch(
        op?: number | Include<FetchOptions>,
        ops: Include<FetchOptions> = {}
    ): Promise<any> {
        let path = endpoints.locations.main;
        if (typeof op === 'number') {
            if (!ops.force && this.cache.has(op))
                return this.cache.get(op);

            path = endpoints.locations.get(op);
        } else {
            if (op) ops = op;
        }

        const data = await this.client.requests.get(path, ops, null, this);
        return this._patch(data);
    }

    /**
     * Queries the Pterodactyl API for locations that match the specified query filters.
     * This fetches from the API directly and does not check the cache. Use cache methods
     * for filtering and sorting.
     * Available query filters:
     * * short
     * * long
     * 
     * @param entity The entity to query.
     * @param options The query options to filter by.
     * @returns The queried locations.
     */
    async query(
        entity: string,
        options: Filter<Sort<{}>> // might remove sort in future
    ): Promise<Dict<number, NodeLocation>> {
        if (!options.sort && !options.filter) throw new ValidationError(
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

    /**
     * Creates a location.
     * @param short The short name for the location (usually the country code).
     * @param long The long name for the location.
     * @returns The new location.
     */
    async create(short: string, long: string): Promise<NodeLocation> {
        const data = await this.client.requests.post(
            endpoints.locations.main, { short, long }
        );
        return this._patch(data);
    }

    /**
     * Updates a location.
     * @param id The ID of the location.
     * @param options The updated short and/or long name of the location.
     * @returns The updated location.
     */
    async update(
        id: number,
        options:{ short?: string; long?: string }
    ): Promise<NodeLocation> {
        if (!options.short && !options.long)
            throw new ValidationError(
                'Either short or long is required to update the location'
            );

        const data = await this.client.requests.patch(
            endpoints.locations.get(id), options
        );
        return this._patch(data);
    }

    /**
     * Deletes a location.
     * @param id The ID of the location.
     */
    async delete(id: number): Promise<void> {
        await this.client.requests.delete(endpoints.locations.get(id));
        this.cache.delete(id);
    }
}
