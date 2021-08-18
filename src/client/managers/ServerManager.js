const { ApplicationServer } = require('../../structures');
const endpoints = require('./Endpoints');

class ServerManager {
    constructor(client) {
        this.client = client

        /**
         * @type {Map<string, Server>}
         */
        this.cache = new Map();
    }

    /**
     * Fetches a server (or all if no id is specified) from the Pterodactyl API.
     * @param {?string} id The ID of the server.
     * @param {?object} options Additional fetch options.
     * @returns {Promise<ApplicationServer|Array<ApplicationServer>>}
     */
    async fetch(id = '', options = {}) {
        if (!options?.force) {
            const s = this.cache.get(id);
            if (s) return Promise.resolve(s);
        }
        let extra = '';
        if (options?.withEgg) extra += '?egg=true';
        if (options?.withUsers) extra += (extra ? '&' : '?') +'subusers=true';

        if (id) {
            const data = await this.client.requests.make(endpoints.servers.get(id) + extra);
            const s = new ApplicationServer(this.client, data);
            this.cache.set(s.uuid, s);
            return s;
        }

        const data = await this.client.requests.make(endpoints.get + extra);
        const res = [];
        data.data.forEach(o => {
            const s = new ApplicationServer(this.client, o);
            this.cache.set(s.uuid, s);
            res.push(s);
        });
        return res;
    }

    resolve(resolvable) {}
}

module.exports = ServerManager;
