const Dict = require('../structures/Dict');
const build = require('../util/query');
const endpoints = require('./endpoints');

class NestEggsManager {
    static get INCLUDES() {
        return Object.freeze([
            'nest', 'servers', 'config',
            'script', 'variables'
        ]);
    }

    constructor(client) {
        this.client = client;

        /** @type {Dict<number, object>} */
        this.cache = new Dict();
    }

    /**
     * Fetches the eggs for the specified nest.
     * @param {number} nest The ID of the nest to fetch from.
     * @param {number} [id] The ID of the egg.
     * @param {object} [options] Additional fetch options.
     * @param {boolean} [options.force] Whether to skip checking the cache and fetch directly.
     * @param {string[]} [options.include] Additional fetch parameters to include.
     * @returns {Promise<object|Dict<number, object>>} The fetched egg(s).
     */
    async fetch(nest, id, options = {}) {
        if (id) {
            if (!options.force) {
                const e = this.cache.get(id);
                if (e) return e;
            }
        }

        const query = build(options, { include: NestEggsManager.INCLUDES });
        const data = await this.client.requests.get(
            (id ? endpoints.nests.eggs.get(nest, id) : endpoints.nests.eggs.main(nest)) + query
        );

        const res = new Dict();
        for (const egg of data.data) {
            this.cache.set(egg.attributes.id, egg.attributes);
            res.set(egg.attributes.id, egg.attributes);
        }
        return res;
    }

    /**
     * Searches the cache for eggs that are for the specified nest.
     * @param {number} nest The ID of the nest to search.
     * @returns {object[]} The nest's eggs.
     */
    for(nest) {
        const res = [];
        for (const [, egg] of this.cache) if (egg.nest === nest) res.push(egg);
        return res;
    }
}

module.exports = NestEggsManager;
