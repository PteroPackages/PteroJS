const ApplicationRequestManager = require('./managers/ApplicationRequestManager');
const NestManager = require('./managers/NestManager');
const NodeLocationManager = require('./managers/NodeLocationManager');
const NodeManager = require('./managers/NodeManager');
const ServerManager = require('./managers/ServerManager');
const UserManager = require('./managers/UserManager');

/**
 * The base class for the Pterodactyl application API.
 */
class PteroApp {
    /**
     * @param {string} domain The Pterodactyl domain.
     * @param {string} auth The authentication key for Pterodactyl.
     * @param {ApplicationOptions} [options] Additional application options.
     */
    constructor(domain, auth, options = {}) {
        /**
         * @type {string}
         */
        this.domain = domain.endsWith('/') ? domain.slice(0, -1) : domain;

        /**
         * @type {string}
         */
        this.auth = auth;

        /**
         * @type {ApplicationOptions}
         */
        this.options = options;
        this.requests = new ApplicationRequestManager(this);

        /**
         * @type {?Date}
         */
        this.readyAt = null;

        /**
         * @type {?number}
         */
        this.ping = null;

        this.users = new UserManager(this);
        this.nodes = new NodeManager(this);
        this.nests = new NestManager(this);
        this.servers = new ServerManager(this);
        this.locations = new NodeLocationManager(this);
    }

    /**
     * Sends a ping request to the API before performing additional startup requests.
     * @returns {Promise<boolean>}
     */
    async connect() {
        const start = Date.now();
        await this.requests.make('/');
        this.ping = start - Date.now();
        if (this.options.fetchUsers) await this.users.fetch();
        if (this.options.fetchNodes) await this.nodes.fetch();
        if (this.options.fetchNests) await this.nests.fetch();
        if (this.options.fetchServers) await this.servers.fetch();
        if (this.options.fetchLocations) await this.locations.fetch();
        this.readyAt = Date.now();
        return true;
    }
}

module.exports = PteroApp;

/**
 * Startup options for the application API.
 * @typedef {object} ApplicationOptions
 * @property {boolean} [fetchUsers] Whether to fetch all users.
 * @property {boolean} [fetchNodes] Whether to fetch all nodes.
 * @property {boolean} [fetchNests] Whether to fetch all nests.
 * @property {boolean} [fetchServers] Whether to fetch all servers.
 * @property {boolean} [fetchLocations] Whether to fetch all node locations.
 */
