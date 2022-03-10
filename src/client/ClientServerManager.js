const ClientServer = require('../structures/ClientServer');
const Dict = require('../structures/Dict');
const build = require('../util/query');
const endpoints = require('./endpoints');

class ClientServerManager {
    /**
     * Allowed include arguments for client servers.
     */
    static get INCLUDES() {
        return Object.freeze(['egg', 'subusers']);
    }

    constructor(client) {
        this.client = client

        /** @type {Dict<string, ClientServer>} */
        this.cache = new Dict();

        /** @type {PageData} */
        this.pageData = {};
    }

    _patch(data) {
        this._resolveMeta(data.meta?.pagination);
        if (data.data) {
            const res = new Dict();
            for (const o of data.data) {
                const s = new ClientServer(this.client, o);
                res.set(s.identifier, s);
            }

            if (this.client.options.servers.cache) res.forEach((v, k) => this.cache.set(k, v));
            return res;
        }

        const s = new ClientServer(this.client, data);
        if (this.client.options.servers.cache) this.cache.set(s.identifier, s);
        return s;
    }

    _resolveMeta(data) {
        if (!data) return;
        this.pageData = {
            current: data.current_page,
            total: data.total,
            count: data.count,
            perPage: data.per_page,
            totalPages: data.total_pages,
            links: data.links
        }
    }

    /**
     * Fetches a server (or all if no id is specified) from the Pterodactyl API.
     * @param {string} [id] The ID of the server.
     * @param {object} [options] Additional fetch options.
     * @param {boolean} [options.force] Whether to skip checking the cache and fetch directly.
     * @param {string[]} [options.include] Additional fetch parameters to include.
     * @returns {Promise<ClientServer|Dict<string, ClientServer>>} The fetched server(s).
     */
    async fetch(id, options = {}) {
        if (id) {
            if (!options.force) {
                const s = this.cache.get(id);
                if (s) return Promise.resolve(s);
            }
        }

        const query = build(options, { includes: ClientServerManager.INCLUDES });
        const data = await this.client.requests.get(
            (id ? endpoints.servers.get(id) : endpoints.servers.main) + query
        );
        this._resolveMeta(data);
        return this._patch(data);
    }
}

module.exports = ClientServerManager;

/**
 * @typedef {object} PageData
 * @property {number} current The current page.
 * @property {number} total
 * @property {number} count The number of items on that page.
 * @property {number} perPage The max amount of items per page.
 * @property {number} totalPages The total number of pages.
 * @property {object} links
 */
