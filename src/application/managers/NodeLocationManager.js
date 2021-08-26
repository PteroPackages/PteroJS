const endpoints = require('./Endpoints');

class NodeLocationManager {
    constructor(client) {
        this.client = client;

        /**
         * @type {Map<number, NodeLocation>}
         */
        this.cache = new Map();
    }

    _patch(data) {
        if (data.data) {
            const s = new Map();
            for (let o of data.data) {
                o = o.attributes;
                this.cache.set(o.id, {
                    id: o.id,
                    long: o.long,
                    short: o.short,
                    createdAt: new Date(o.created_at),
                    updatedAt: o.updated_at ? new Date(o.updated_at) : null
                });
                s.set(o.id, this.cache.get(o.id));
            }
            return s;
        }
        data = data.attributes;
        this.cache.set(data.id, {
            id: data.id,
            long: data.long,
            short: data.short,
            createdAt: new Date(data.created_at),
            updatedAt: data.updated_at ? new Date(data.updated_at) : null
        });
        return this.cache.get(data.id);
    }

    /**
     * Fetches a node location from the Pterodactyl API with an optional cache check.
     * @param {number} [id] The ID of the location.
     * @param {boolean} [force] Whether to skip checking the cache and fetch directly.
     * @returns {Promise<NodeLocation|Map<number, NodeLocation>>}
     */
    async fetch(id, force = false) {
        if (id) {
            if (!force) {
                const l = this.cache.get(id);
                if (l) return l;
            }
            const data = await this.client.requests.make(endpoints.locations.get(id));
            return this._patch(data);
        }
        const data = await this.client.requests.make(endpoints.locations.main);
        return this._patch(data);
    }

    /**
     * Creates a new node location.
     * @param {string} short The short location code of the location.
     * @param {string} long The long location code of the location.
     * @returns {Promise<NodeLocation>}
     */
    async create(short, long) {
        return this._patch(
            await this.client.requests.make(
                endpoints.locations.main,
                { short, long },
                'POST'
            )
        );
    }

    /**
     * Updates an existing node location.
     * @param {number} id The ID of the node location.
     * @param {string} short The short location code of the location.
     * @param {string} long The long location code of the location.
     * @returns {Promise<NodeLocation>}
     */
    async update(id, { short, long } = {}) {
        return this._patch(
            await this.client.requests.make(
                endpoints.locations.get(id),
                { short, long },
                'PATCH'
            )
        );
    }

    /**
     * Deletes a node location.
     * @param {number} id The ID of the node location.
     * @returns {Promise<number>}
     */
    async delete(id) {
        await this.client.requests.make(endpoints.locations.get(id), { method: 'DELETE' });
        this.cache.delete(id);
        return id;
    }
}

module.exports = NodeLocationManager;

/**
 * Represents a location on Pterodactyl.
 * Location objects have little to no methodic usage so they are readonly.
 * @readonly
 * @typedef {object} NodeLocation
 * @property {number} id The ID of the location.
 * @property {string} long The long location code.
 * @property {string} short The short location code (or country code).
 * @property {Date} createdAt The date the location was created.
 * @property {?Date} updatedAt The date the location was last updated.
 */
