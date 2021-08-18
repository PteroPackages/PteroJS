const { EventEmitter } = require('events');
const { RequestManager, ServerManager } = require('./managers');

/**
 * The base class for the Pterodactyl client API.
 * @extends {EventEmitter}
 */
class PteroClient extends EventEmitter {
    /**
     * @param {string} domain The Pterodactyl domain.
     * @param {string} auth The authentication key for Pterodactyl.
     * @param {?object} options Additional client options.
     */
    constructor(domain, auth, options = {}) {
        this.domain = domain.endsWith('/') ? domain.slice(0, -1) : domain;
        this.auth = auth;
        this.options = options;

        this.requests = new RequestManager(this);
        this.servers = new ServerManager(this);
    }

    async connect() {
        if (!this.options?.ws) throw new Error('Websocket option not enabled.');
        return;
    }
}

module.exports = PteroClient;
