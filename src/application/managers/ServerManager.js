const ApplicationServer = require('../../structures/ApplicationServer');
const { PteroUser } = require('../../structures/User');
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
     * @param {number} [id] The ID of the server.
     * @param {object} [options] Additional fetch options.
     * @param {boolean} [options.force] Whether to skip checking the cache and fetch directly.
     * @param {Array<string>} [options.include] Additional fetch parameters to include.
     * @returns {Promise<ApplicationServer|Map<number, ApplicationServer>>}
     */
    async fetch(id, options) {
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
        const data = await this.client.requests.make(endpoints.servers.main);
        return this._patch(data);
    }

    /**
     * Creates a new Pterodactyl server for a specified user.
     * @param {number|PteroUser} user The user to create the server for.
     * @param {object} options Base server options.
     * @param {string} options.name The name of the server.
     * @param {number} options.egg The egg for the server.
     * @param {string} options.image The docker image for the server.
     * @param {string} options.startup The startup command for the server.
     * @param {object} options.env Server environment options.
     * @param {object} [options.limits] Resource limits for the server.
     * @param {object} [options.featureLimits] Feature limits for the server.
     * @param {object} [options.allocation] Allocation options for the server.
     * @returns {Promise<ApplicationServer>}
     */
    async create(user, options) {
        if (user instanceof PteroUser) user = user.id;
        if (
            !options.name ||
            !options.egg ||
            !options.image ||
            !options.startup ||
            !options.env
        ) throw new Error('Missing required server option.');

        const payload = { name, egg, startup } = options;
        payload.docker_image = options.image;
        payload.environment = options.env;
        if (options.limits) payload.limits = options.limits;
        if (options.featureLimits) payload.feature_limits = options.featureLimits;
        if (options.allocation) payload.allocation = options.allocation;

        const data = await this.client.requests.make(
            endpoints.servers.main, payload, 'POST'
        );
        return this._patch(data);
    }

    /**
     * Deletes a specified server.
     * @param {number|ApplicationServer} server The ID of the server.
     * @param {boolean} [force] Whether to force delete the server.
     * @returns {Promise<boolean>}
     */
    async delete(server, force = false) {
        if (server instanceof ApplicationServer) server = server.id;
        await this.client.requests.make(
            endpoints.servers.get(server) + (force ? '/force' : ''), { method: 'DELETE' }
        );
        this.cache.delete(server);
        return true;
    }
}

module.exports = ServerManager;

function joinParams(params) {
    if (!params) return '';
    const res = [];
    params.forEach(p => res.push(['include', p]));
    return '?'+ new URLSearchParams(res).toString();
}
