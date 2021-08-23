const ClientServer = require('../../structures/ClientServer');
const endpoints = require('./Endpoints');

class ServerManager {
    constructor(client) {
        this.client = client

        /**
         * @type {Map<string, ClientServer>}
         */
        this.cache = new Map();
    }

    _patch(data) {
        if (data.data) {
            const s = new Map();
            for (const o of data.data) {
                const server = new ClientServer(this.client, o);
                this.cache.set(server.identifier, server);
                s.set(server.identifier, server);
            }
            return s;
        }
        const s = new ClientServer(this.client, data);
        this.cache.set(s.identifier, s);
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
            const data = await this.client.requests.make(endpoints.servers.get(id) + joinParams(options.include));
            return this._patch(data);
        }
        const data = await this.client.requests.make(endpoints.get + joinParams(options.include));
        return this._patch(data);
    }
}

module.exports = ServerManager;

function joinParams(params) {
    if (!params) return '';
    const res = [];
    params.forEach(p => res.push(['include', p]));
    return '?'+ new URLSearchParams(res).toString();
}
