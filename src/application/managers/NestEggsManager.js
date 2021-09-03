const endpoints = require('./Endpoints');

class NestEggsManager {
    constructor(client) {
        this.client = client;

        /** @type {Map<number, object>} */
        this.cache = new Map();
    }

    /**
     * Fetches the eggs for the specified nest.
     * @param {number} nest The ID of the nest to fetch from.
     * @param {number} [id] The ID of the egg.
     * @param {object} [options] Additional fetch options.
     * @param {boolean} [options.force] Whether to skip checking the cache and fetch directly.
     * @param {string[]} [options.include] Additional fetch parameters to include.
     * @returns {Promise<object|Map<number, object>>} The fetched egg(s).
     */
    async fetch(nest, id, options = {}) {
        if (id) {
            if (options.force) {
                const e = this.cache.get(id);
                if (e) return Promise.resolve(e);
            }
            const data = await this.client.requests.make(
                endpoints.nests.eggs.get(nest, id) + joinParams(options.include)
            );
            this.cache.set(id, data.data.attributes);
            return data.data.attributes;
        }
        const data = await this.client.requests.make(
            endpoints.nests.eggs.main(nest) + joinParams(options.include)
        );
        const res = new Map();
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

function joinParams(params) {
    if (!params) return '';
    const res = [];
    params.forEach(p => res.push(['include', p]));
    return '?'+ new URLSearchParams(res).toString();
}
