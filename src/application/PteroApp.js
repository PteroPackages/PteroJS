const {
    NodeLocationManager,
    NodeManager,
    RequestManager,
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
        this.domain = domain.endsWith('/') ? domain.slice(0, -1) : domain;
        this.auth = auth;
        this.options = options;
        this.requests = new RequestManager(this);

        this.users = new UserManager(this);
        this.nodes = new NodeManager(this);
        this.locations = new NodeLocationManager(this);
    }

    async connect() {}
}

module.exports = PteroApp;

/**
 * Startup options for the application API.
 * @typedef {object} ApplicationOptions
 * @property {boolean} [fetchUsers] Whether to fetch all users.
 * @property {boolean} [fetchNodes] Whether to fetch all nodes.
 * @property {boolean} [fetchServers] Whether to fetch all servers.
 * @property {boolean} [fetchLocations] Whether to fetch all node locations.
 */
