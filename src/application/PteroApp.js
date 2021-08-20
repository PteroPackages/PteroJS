const {
    NestManager,
    NodeLocationManager,
    NodeManager,
    RequestManager,
    ServerManager,
    UserManager
} = require('./managers');

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
         * @private
         */
        this.auth = auth;

        /**
         * @type {ApplicationOptions}
         */
        this.options = options;
        this.requests = new RequestManager(this);

        /**
         * @type {?Date}
         */
        this.readyAt = null;

        this.users = new UserManager(this);
        this.nodes = new NodeManager(this);
        this.nests = new NestManager(this);
        this.servers = new ServerManager(this);
        this.locations = new NodeLocationManager(this);
    }

    async connect() {
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
