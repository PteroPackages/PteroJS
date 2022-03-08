const Dict = require('../structures/Dict');
const endpoints = require('./endpoints');

class NodeLocationManager {
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
     * * an object
     * 
     * Returns `null` if not found.
     * @param {number|object} obj The object to resolve from.
     * @returns {?NodeLocation} The resolved node location.
     */
    resolve(obj) {
        if (typeof obj == 'number') return this.cache.get(obj) || null;
        if (obj.relationships?.location?.attributes) return this._patch(obj.relationships.location);
        return null;
    }

    /**
     * Fetches a node location from the Pterodactyl API with an optional cache check.
     * @param {number} [id] The ID of the location.
     * @param {boolean} [force] Whether to skip checking the cache and fetch directly.
     * @returns {Promise<NodeLocation|Dict<number, NodeLocation>>} The fetched node location(s).
     */
    async fetch(id, force = false) {
        if (id) {
            if (!force) {
                const l = this.cache.get(id);
                if (l) return Promise.resolve(l);
            }
            const data = await this.client.requests.get(endpoints.locations.get(id));
            return this._patch(data);
        }
        const data = await this.client.requests.get(endpoints.locations.main);
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
        if (!options.short && !options.long) throw new Error('Either short or long option is required.');
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
 * Location objects have little to no methodic usage so they are readonly.
 * @typedef {object} NodeLocation
 * @property {number} id The ID of the location.
 * @property {string} long The long location code.
 * @property {string} short The short location code (or country code).
 * @property {Date} createdAt The date the location was created.
 * @property {?Date} updatedAt The date the location was last updated.
 * @readonly
 */
