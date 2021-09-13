const ApplicationRequestManager = require('./managers/ApplicationRequestManager');
const ApplicationServerManager = require('./managers/ApplicationServerManager');
const NestManager = require('./managers/NestManager');
const NodeLocationManager = require('./managers/NodeLocationManager');
const NodeManager = require('./managers/NodeManager');
const UserManager = require('./managers/UserManager');
const presets = require('../structures/Presets');

/**
 * The base class for the Pterodactyl application API.
 * This operates using a Pterodactyl application API key which can be found
 * at <your.domain.name/admin/api>.
 * 
 * **Warning:** Keep your API key private at all times. Exposing this can lead
 * to your servers, nodes, configurations and more being corrupted and/or deleted.
 */
class PteroApp {
    /**
     * @param {string} domain The Pterodactyl domain.
     * @param {string} auth The authentication key for Pterodactyl.
     * @param {ApplicationOptions} [options] Additional application options.
     */
    constructor(domain, auth, options = {}) {
        /**
         * The domain for your Pterodactyl panel. This should be the main URL only
         * (not "/api"). Any additional paths will count as the API path.
         * @type {string}
         */
        this.domain = domain.endsWith('/') ? domain.slice(0, -1) : domain;

        /**
         * The API key for your Pterodactyl panel. This should be kept private at
         * all times. Full access must be granted in the panel for the whole library
         * to be accessible.
         * @type {string}
         */
        this.auth = auth;

        /**
         * Additional startup options for the application (optional).
         * @type {ApplicationOptions}
         */
        this.options = presets.application(options);

        /** @type {?Date} */
        this.readyAt = null;

        /** @type {?number} */
        this.ping = null;

        /** @type {UserManager} */
        this.users = new UserManager(this);
        /** @type {NodeManager} */
        this.nodes = new NodeManager(this);
        /** @type {NestManager} */
        this.nests = new NestManager(this);
        /** @type {ApplicationServerManager} */
        this.servers = new ApplicationServerManager(this);
        /** @type {NodeLocationManager} */
        this.locations = new NodeLocationManager(this);
        /** @type {ApplicationRequestManager} @internal */
        this.requests = new ApplicationRequestManager(this);
    }

    /**
     * Sends a ping request to the API before performing additional startup requests.
     * Attempting to use the application without connecting to the API will result
     * in an error.
     * @returns {Promise<boolean>}
     */
    async connect() {
        const start = Date.now();
        await this.requests.ping();
        this.ping = Date.now() - start;
        if (this.options.fetchUsers && this.options.cacheUsers) await this.users.fetch();
        if (this.options.fetchNodes && this.options.cacheNodes) await this.nodes.fetch();
        if (this.options.fetchNests && this.options.cacheNests) await this.nests.fetch();
        if (this.options.fetchServers && this.options.cacheServers) await this.servers.fetch();
        if (this.options.fetchLocations && this.options.fetchLocations) await this.locations.fetch();
        this.readyAt = Date.now();
        return true;
    }
}

module.exports = PteroApp;

/**
 * Startup options for the application API.
 * By default, all fetch options are `false`, and all cache options are `true`.
 * Enabling fetch and disabling cache for the same class will cancel out the request.
 * @typedef {object} ApplicationOptions
 * @property {boolean} [fetchUsers] Whether to fetch all users.
 * @property {boolean} [fetchNodes] Whether to fetch all nodes.
 * @property {boolean} [fetchNests] Whether to fetch all nests.
 * @property {boolean} [fetchServers] Whether to fetch all servers.
 * @property {boolean} [fetchLocations] Whether to fetch all node locations.
 * @property {boolean} [cacheUsers] Whether to cache users.
 * @property {boolean} [cacheNodes] Whether to cache nodes.
 * @property {boolean} [cacheNests] Whether to cache nests.
 * @property {boolean} [cacheServers] Whether to cache servers.
 * @property {boolean} [cacheLocations] Whether to cache node locations.
 */
