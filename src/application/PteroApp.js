const {
    NodeLocationManager,
    NodeManager,
    UserManager
} = require('./managers');

/**
 * The base class for the Pterodactyl application API.
 */
class PteroApp {
    /**
     * @param {string} domain The Pterodactyl domain.
     * @param {string} auth The authentication key for Pterodactyl.
     * @param {object} [options] Additional application options.
     */
    constructor(domain, auth, options = {}) {
        this.domain = domain.endsWith('/') ? domain.slice(0, -1) : domain;
        this.auth = auth;
        this.options = options;

        this.users = new UserManager(this);
        this.nodes = new NodeManager(this);
        this.locations = new NodeLocationManager(this);
    }

    async connect() {}
}

module.exports = PteroApp;
