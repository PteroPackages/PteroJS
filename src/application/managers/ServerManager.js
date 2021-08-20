const { ApplicationServer } = require('../../structures');
const endpoints = require('./Endpoints');

class ServerManager {
    constructor(client) {
        this.client = client;

        /**
         * @type {Map<number, ApplicationServer>}
         */
        this.cache = new Map();
    }

    _patch(data) {
        if (data.data) {
            const s = new Map();
            for (const o of data.data) {
                const server = new ApplicationServer(this.client, o);
                this.cache.set(server.id, server);
                s.set(server.id, server);
            }
            return s;
        }
        const s = new ApplicationServer(this.client, data);
        this.cache.set(s.id, s);
        return s;
    }

    /**
     * Fetches a server from the Pterodactyl API with an optional cache check.
     * @param {number} id The ID of the server.
     * @param {object} options Additional fetch options.
     * @param {boolean} [options.force] Whether to skip checking the cache and fetch directly.
     * @param {Array<string>} [options.include] Additional fetch parameters to include.
     * @returns {Promise<ApplicationServer|Map<number, ApplicationServer>>}
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
        const data = await this.client.requests.make(endpoints.servers.main);
        return this._patch(data);
    }

    /** @todo */
    async create(options) {}

    /**
     * Deletes a specified server.
     * @param {number} id The ID of the server.
     * @param {boolean} [force] Whether to force delete the server.
     * @returns {Promise<number>}
     */
    async delete(id, force = false) {
        await this.client.requests.make(endpoints.servers.get(id) + (force ? '/force' : ''), { method: 'DELETE' });
        this.cache.delete(id);
        return id;
    }
}

module.exports = ServerManager;

function joinParams(params) {
    if (!params) return '';
    const res = [];
    params.forEach(p => res.push(['include', p]));
    return '?'+ new URLSearchParams(res).toString();
}
