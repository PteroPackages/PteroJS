const ApplicationServer = require('../structures/ApplicationServer');
const Dict = require('../structures/Dict');
const { PteroUser } = require('../structures/User');
const build = require('../util/query');
const endpoints = require('./endpoints');

class ApplicationServerManager {
    /**
     * Allowed filter arguments for application servers.
     */
    static get FILTERS() {
        return Object.freeze([
            'name', 'uuid', 'uuidShort',
            'externalId', 'image'
        ]);
    }

    /**
     * Allowed include arguments for application servers.
     */
    static get INCLUDES() {
        return Object.freeze([
            'allocations', 'user', 'subusers',
            'nest', 'egg', 'variables',
            'location', 'node', 'databases'
        ]);
    }

    /**
     * Allowed sort arguments for application servers.
     */
    static get SORTS() {
        return Object.freeze(['id', '-id', 'uuid', '-uuid']);
    }

    constructor(client) {
        this.client = client;
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
            if (this.client.options.servers.cache) res.forEach((v, k) => this.cache.set(k, v));
            return res;
        }

        const s = new ApplicationServer(this.client, data.attributes);
        if (this.client.options.servers.cache) this.cache.set(s.id, s);
        return s;
    }

    /**
     * Resolves a server from an object. This can be:
     * * a string
     * * a number
     * * an object
     * 
     * Returns `undefined` if not found.
     * @param {string|number|object|ApplicationServer} obj The object to resolve from.
     * @returns {?ApplicationServer} The resolved server.
     */
    resolve(obj) {
        if (obj instanceof ApplicationServer) return obj;
        if (typeof obj === 'number') return this.cache.get(obj);
        if (typeof obj === 'string') return this.cache.find(s => s.name === obj);
        if (obj.relationships?.servers) return this._patch(obj.relationships.servers);
        return undefined;
    }

    /**
     * Returns a formatted URL to the server.
     * @param {string|ApplicationServer} server The server or server identifier.
     * @returns {string} The formatted URL.
     */
    panelURLFor(server) {
        if (server instanceof ApplicationServer) return server.panelURL;
        return `${this.client.domain}/server/${server}`;
    }

    /**
     * Returns a formatted URL to the server in the admin panel.
     * @param {number|ApplicationServer} server The server or server ID.
     * @returns {string} The formatted URL.
     */
    adminURLFor(server) {
        if (server instanceof ApplicationServer) return server.adminURL;
        return `${this.client.domain}/admin/servers/view/${server}`;
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
        if (id && !options.force) {
            const s = this.cache.get(id);
            if (s) return Promise.resolve(s);
        }

        const query = build(options, { includes: ApplicationServerManager.INCLUDES });
        const data = await this.client.requests.get(
            (id ? endpoints.servers.get(id) : endpoints.servers.main) + query
        );
        return this._patch(data);
    }

    /**
     * Queries the API for a server (or servers) that match the specified query filter.
     * Keep in mind this does NOT check the cache first, it will fetch from the API directly.
     * Available query filters are:
     * * name
     * * uuid
     * * uuidShort
     * * identifier (alias for uuidShort)
     * * externalId
     * * image
     * 
     * Available sort options are:
     * * id
     * * -id
     * * uuid
     * * -uuid
     * 
     * @param {string} entity The entity (string) to query.
     * @param {string} filter The filter to use for the query.
     * @param {string} sort The order to sort the results in.
     * @returns {Promise<Dict<number, ApplicationServer>>} A dict of the quiried servers.
     */
    async query(entity, filter, sort) {
        if (!sort && !filter) throw new Error('Sort or filter is required.');
        if (filter === 'identifier') filter = 'uuidShort';
        if (filter === 'externalId') filter = 'external_id';

        const { FILTERS, SORTS } = ApplicationServerManager;
        const query = build(
            { filter:[filter, entity], sort },
            { filters: FILTERS, sorts: SORTS }
        );

        const data = await this.client.requests.get(
            endpoints.servers.main + query
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
     * @param {number} options.allocation The allocation for the server.
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

        await this.client.requests.post(endpoints.servers.main, payload);
        const data = await this.query(payload.name, 'name', '-id');
        return data.find(s => s.name === payload.name);
    }

    /**
     * Deletes a specified server.
     * @param {number|ApplicationServer} server The ID of the server.
     * @param {boolean} [force] Whether to force delete the server.
     * @returns {Promise<boolean>}
     */
    async delete(server, force = false) {
        if (server instanceof ApplicationServer) server = server.id;
        await this.client.requests.delete(
            endpoints.servers.get(server) + (force ? '/force' : '')
        );
        this.cache.delete(server);
        return true;
    }
}

module.exports = ApplicationServerManager;
