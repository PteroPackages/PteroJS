const ApplicationServer = require('../../structures/ApplicationServer');
const Dict = require('../../structures/Dict');
const { PteroUser } = require('../../structures/User');
const endpoints = require('./endpoints');

class ServerManager {
    constructor(client) {
        this.client = client;

        /** @type {Dict<number, ApplicationServer>} */
        this.cache = new Dict();
    }

    get defaultLimits() {
        return {
            memory: 128,
            swap: 0,
            disk: 512,
            io: 500,
            cpu: 100
        }
    }

    get defaultFeatureLimits() {
        return {
            databases: 5,
            backups: 1
        }
    }

    _patch(data) {
        if (data?.data) {
            const res = new Dict();
            for (let o of data.data) {
                o = o.attributes;
                const s = new ApplicationServer(this.client, o);
                res.set(s.id, s);
            }
            if (this.client.options.cacheServers) res.forEach((v, k) => this.cache.set(k, v));
            return res;
        }
        const s = new ApplicationServer(this.client, data.attributes);
        if (this.client.options.cacheServers) this.cache.set(s.id, s);
        return s;
    }

    /**
     * Resolves a server from an object. This can be:
     * * a string
     * * a number
     * * an object
     * 
     * Returns `null` if not found.
     * @param {string|number|object|ApplicationServer} obj The object to resolve from.
     * @returns {?ApplicationServer} The resolved server.
     */
    resolve(obj) {
        if (obj instanceof ApplicationServer) return obj;
        if (typeof obj === 'number') return this.cache.get(obj) || null;
        if (typeof obj === 'string') return this.cache.find(s => s.name === obj) || null;
        if (obj.relationships?.servers) return this._patch(obj.relationships.servers);
        return null;
    }

    /**
     * Fetches a server from the Pterodactyl API with an optional cache check.
     * @param {number} [id] The ID of the server.
     * @param {object} [options] Additional fetch options.
     * @param {boolean} [options.force] Whether to skip checking the cache and fetch directly.
     * @param {string[]} [options.include] Additional fetch parameters to include.
     * @returns {Promise<ApplicationServer|Dict<number, ApplicationServer>>} The fetched server(s).
     */
    async fetch(id, options = {}) {
        if (id) {
            if (options.force) {
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
     * Queries the API for a server (or servers) that match the specified query filter.
     * Keep in mind this does NOT check the cache first, it will fetch from the API directly.
     * Available query filters are:
     * * name
     * * uuid
     * * identifier
     * * externalId
     * * image
     * 
     * Available sort options are:
     * * id
     * * -id
     * * uuid
     * * -uuid
     */
    async query(entity, filter, sort) {
        if (filter && !['name', 'uuid', 'identifier', 'externalId', 'image'].includes(filter)) throw new Error('Invalid query filter.');
        if (sort && !['id', '-id', 'uuid', '-uuid'].includes(sort)) throw new Error('Invalid sort type.');
        if (!sort && !filter) throw new Error('Sort or filter is required.');

        if (filter === 'identifier') filter = 'uuidShort';
        if (filter === 'externalId') filter = 'external_id';

        const data = await this.client.requests.make(
            endpoints.servers.main +
            (filter ? `?filter[${filter}]=${entity}` : '') +
            (sort && filter ? `&sort=${sort}` : '') +
            (sort && !filter ? `?sort=${sort}` : '')
        );
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
     * @param {object} options.allocation Allocation options for the server.
     * @param {object} [options.limits] Resource limits for the server.
     * @param {object} [options.featureLimits] Feature limits for the server.
     * @returns {Promise<ApplicationServer>} The new server.
     */
    async create(user, options = {}) {
        if (
            !options.name ||
            !options.egg ||
            !options.image ||
            !options.startup ||
            !options.env
        ) throw new Error('Missing required server option.');
        if (user instanceof PteroUser) user = user.id;

        const payload = {};
        payload.user = user;
        payload.name = options.name;
        payload.egg = options.egg;
        payload.startup = options.startup;
        payload.docker_image = options.image;
        payload.environment = options.env;
        payload.allocation = { default: options.allocation };
        payload.limits = options.limits ?? this.defaultLimits;
        payload.feature_limits = options.featureLimits ?? this.defaultFeatureLimits;

        await this.client.requests.make(endpoints.servers.main, payload, 'POST');
        const s = await this.query(payload.name, 'name');
        return s.first();
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
            endpoints.servers.get(server) + (force ? '/force' : ''), null, 'DELETE'
        );
        this.cache.delete(server);
        return true;
    }
}

module.exports = ServerManager;

function joinParams(params) {
    if (!params || !params.length) return '';
    const valid = [
        'allocations', 'user', 'subusers',
        'pack', 'nest', 'egg', 'variables',
        'location', 'node', 'databases'
    ];
    params = params.filter(p => valid.includes(p));
    return '?include='+ params.toString();
}
