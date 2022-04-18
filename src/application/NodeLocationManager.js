const Dict = require('../structures/Dict');
const build = require('../util/query');
const endpoints = require('./endpoints');

class NodeLocationManager {
    /**
     * Allowed filter arguments for locations.
     */
    static get FILTERS() {
        return Object.freeze(['short', 'long']);
    }

    /**
     * Allowed include arguments for locations.
     */
    static get INCLUDES() {
        return Object.freeze(['nodes', 'servers']);
    }

    constructor(client) {
        this.client = client;

        /** @type {Dict<number, NodeLocation>} */
        this.cache = new Dict();
    }

    _patch(data) {
        if (data.data) {
            const res = new Map();
            for (let o of data.data) {
                o = o.attributes;
                res.set(o.id, {
                    id: o.id,
                    long: o.long,
                    short: o.short,
                    createdAt: new Date(o.created_at),
                    updatedAt: o.updated_at ? new Date(o.updated_at) : null
                });
            }

            if (this.client.options.locations.cache) res.forEach((v, k) => this.cache.set(k, v));
            return res;
        }

        data = data.attributes;
        const loc = {
            id: data.id,
            long: data.long,
            short: data.short,
            createdAt: new Date(data.created_at),
            updatedAt: data.updated_at ? new Date(data.updated_at) : null
        }

        if (this.client.options.locations.cache) this.cache.set(data.id, loc);
        return loc;
    }

    /**
     * Resolves a node location from an object. This can be:
     * * a number
     * * a string
     * * an object
     * 
     * Returns `undefined` if not found.
     * @param {string|number|object} obj The object to resolve from.
     * @returns {?NodeLocation} The resolved node location.
     */
    resolve(obj) {
        if (typeof obj === 'number') return this.cache.get(obj);
        if (typeof obj === 'string') return this.cache.find(
            o => (o.short === obj) || (o.long === obj)
        );
        if (obj.relationships?.location?.attributes)
            return this._patch(obj.relationships.location);

        return undefined;
    }

    /**
     * Returns a formatted URL to the node location in the admin panel.
     * @param {number} id The ID of the node location.
     * @returns {string} The formatted URL.
     */
    adminURLFor(id) {
        return `${this.client.domain}/admin/locations/view/${id}`;
    }

    /**
     * Fetches a node location from the Pterodactyl API with an optional cache check.
     * @param {number} [id] The ID of the location.
     * @param {object} [options] Additional fetch options.
     * @param {boolean} [options.force] Whether to skip checking the cache and fetch directly.
     * @param {string[]} [options.include] Additional data to include about the location.
     * @returns {Promise<NodeLocation|Dict<number, NodeLocation>>} The fetched node location(s).
     */
    async fetch(id, options = {}) {
        if (id && !options.force) {
            const loc = this.cache.get(id);
            if (loc) return Promise.resolve(loc);
        }

        const query = build(options, { include: NodeLocationManager.INCLUDES });
        const data = await this.client.requests.get(
            (id ? endpoints.locations.get(id) : endpoints.locations.main) + query
        );
        return this._patch(data);
    }

    /**
     * Queries the API for a location (or locations) that match the specified query filter/sort.
     * This does NOT check the cache first, it is a direct fetch from the API.
     * Available filters:
     * * short
     * * long
     * 
     * Available sort options:
     * * id
     * * -id
     * 
     * @param {string} entity The entity to query.
     * @param {string} [filter] The filter to use for the query.
     * @param {string} [sort] The order to sort the results in.
     * @returns {Promise<Dict<number, NodeLocation>>} A dict of the queried locations.
     */
    async query(entity, filter, sort) {
        if (!sort && !filter) throw new Error('Sort or filter is required.');

        const query = build(
            { filter:[filter, entity], sort },
            { filters: NodeLocationManager.FILTERS, sorts:['id'] }
        );
        const data = await this.client.requests.get(
            endpoints.locations.main + query
        );
        return this._patch(data);
    }

    /**
     * Creates a new node location.
     * @param {string} short The short location code of the location.
     * @param {string} long The long location code of the location.
     * @returns {Promise<NodeLocation>} The new node location.
     */
    async create(short, long) {
        return this._patch(
            await this.client.requests.post(
                endpoints.locations.main,
                { short, long }
            )
        );
    }

    /**
     * Updates an existing node location.
     * @param {number} id The ID of the node location.
     * @param {object} options Location update optioons.
     * @param {string} [options.short] The short location code of the location.
     * @param {string} [options.long] The long location code of the location.
     * @returns {Promise<NodeLocation>} The updated node location instance.
     */
    async update(id, options) {
        if (!options.short && !options.long)
            throw new Error('Either short or long option is required.');

        return this._patch(
            await this.client.requests.patch(endpoints.locations.get(id), options)
        );
    }

    /**
     * Deletes a node location.
     * @param {number} id The ID of the node location.
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        await this.client.requests.delete(endpoints.locations.get(id));
        this.cache.delete(id);
        return true;
    }
}

module.exports = NodeLocationManager;

/**
 * Represents a location on Pterodactyl.
 * @typedef {object} NodeLocation
 * @property {number} id The ID of the location.
 * @property {string} long The long location code.
 * @property {string} short The short location code (or country code).
 * @property {Date} createdAt The date the location was created.
 * @property {?Date} updatedAt The date the location was last updated.
 */
