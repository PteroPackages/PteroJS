const ClientServer = require('../../structures/ClientServer');
const endpoints = require('./Endpoints');

class ClientServerManager {
    constructor(client) {
        this.client = client

        /**
         * @type {Map<string, ClientServer>}
         */
        this.cache = new Map();
    }

    _patch(data) {
        if (data.data) {
            const res = new Map();
            for (let o of data.data) {
                o = o.attributes;
                const s = new ClientServer(this.client, o);
                res.set(s.id, s);
            }
            if (this.client.options.cacheServers) res.forEach((v, k) => this.cache.set(k, v));
            return res;
        }
        const s = new ClientServer(this.client, data.attributes);
        if (this.client.options.cacheServers) this.cache.set(s.id, s);
        return s;
    }

    /**
     * Fetches a server (or all if no id is specified) from the Pterodactyl API.
     * @param {string} [id] The ID of the server.
     * @param {object} [options] Additional fetch options.
     * @param {boolean} [options.force] Whether to skip checking the cache and fetch directly.
     * @param {Array<string>} [options.include] Additional fetch parameters to include.
     * @returns {Promise<ClientServer|Map<string, ClientServer>>}
     */
    async fetch(id, options = {}) {
        if (id) {
            if (options.force !== true) {
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
    if (!params) return '';
    const res = [];
    params.forEach(p => res.push(['include', p]));
    return '?'+ new URLSearchParams(res).toString();
}
