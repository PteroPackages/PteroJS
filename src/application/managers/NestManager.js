const NestEggsManager = require('./NestEggsManager');
const endpoints = require('./Endpoints');

class NestManager {
    constructor(client) {
        this.client = client;

        /**
         * @type {Set<Nest>}
         */
        this.cache = new Set();

        this.eggs = new NestEggsManager(this.client);
    }

    _patch(data) {
        const res = new Set();
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
                    updatedAt: o.updated_at ? new Date(o.updated_at) : null
                });
            }
            if (this.client.options.cacheNests) res.forEach(n => this.cache.add(n));
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
            updatedAt: data.updated_at ? new Date(data.updated_at) : null
        });
        if (this.client.options.cacheNests) res.forEach(n => this.cache.add(n));
        return res;
    }

    /**
     * Fetches a nest from the Pterodactyl API with an optional cache check.
     * @param {number} [id] The ID of the nest.
     * @returns {Promise<Set<Nest>>}
     */
    async fetch(id) {
        if (id) return this._patch(await this.client.requests.make(endpoints.nests.get(id)));
        return this._patch(await this.client.requests.make(endpoints.nests.main));
    }
}

module.exports = NestManager;

/**
 * Represents a nest on Pterodactyl.
 * @readonly
 * @typedef {object} Nest
 * @property {number} id The ID of the nest.
 * @property {string} uuid The UUID of the nest.
 * @property {string} author The author of the nest.
 * @property {string} name The name of the nest.
 * @property {string} description The description of the nest.
 * @property {Date} createdAt The date the nest was created.
 * @property {?Date} updatedAt The date the nest was last updated.
 */
