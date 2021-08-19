const { EventEmitter } = require('events');
const { RequestManager, ServerManager } = require('./managers');
const { ClientUser } = require('../structures');

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
        this.wsServers = [];

        this.user = new ClientUser(this, null); // WIP
        this.requests = new RequestManager(this);
        this.servers = new ServerManager(this);
    }

    async connect() {
        if (!this.options?.ws) throw new Error('Websocket option not enabled.');
        return;
    }

    addSocketServer(id) {
        this.wsServers.push(id);
    }

    removeSocketServer(id) {
        this.wsServers.splice(id);
    }
}

module.exports = PteroClient;
