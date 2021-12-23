const ClientServer = require('../structures/ClientServer');
const Dict = require('../structures/Dict');
const endpoints = require('./endpoints');

class ClientServerManager {
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
            if (this.client.options.cacheServers) res.forEach((v, k) => this.cache.set(k, v));
            return res;
        }
        const s = new ClientServer(this.client, data);
        if (this.client.options.cacheServers) this.cache.set(s.identifier, s);
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
            const data = await this.client.requests.make(
                endpoints.servers.get(id) + joinParams(options.include)
            );
            return this._patch(data);
        }
        const data = await this.client.requests.make(
            endpoints.main + joinParams(options.include)
        );
        return this._patch(data);
    }
}

module.exports = ClientServerManager;

function joinParams(params) {
    if (!params || !params.length) return '';
    params = params.filter(p => ['egg', 'subusers'].includes(p));
    return '?include='+ params.toString();
}

/**
 * @typedef {object} PageData
 * @property {number} current The current page.
 * @property {number} total
 * @property {number} count The number of items on that page.
 * @property {number} perPage The max amount of items per page.
 * @property {number} totalPages The total number of pages.
 * @property {object} links
 */
