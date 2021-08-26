const { EventEmitter } = require('events');
const ClientRequestManager = require('./managers/ClientRequestManager');
const ClientServerManager = require('./managers/ClientServerManager');
const { ClientUser } = require('../structures/User');
const WebSocketManager = require('./managers/WebSocketManager');
const endpoints = require('./managers/Endpoints');

/**
 * The base class for the Pterodactyl client API.
 * @extends {EventEmitter}
 */
class PteroClient extends EventEmitter {
    /**
     * @param {string} domain The Pterodactyl domain.
     * @param {string} auth The authentication key for Pterodactyl.
     * @param {ClientOptions} [options] Additional client options.
     */
    constructor(domain, auth, options) {
        super();

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
         * @type {ClientOptions}
         */
        this.options = options;

        /**
         * @type {?Date}
         */
        this.readyAt = null;

        /**
          * @type {?number}
          */
        this.ping = null;

        this.user = null;
        this.ws = new WebSocketManager(this);
        this.requests = new ClientRequestManager(this);
        this.servers = new ClientServerManager(this);
    }

    /**
     * Sends a ping request to the API before establishing websocket connections.
     * @returns {Promise<boolean>}
     */
    async connect() {
        const start = Date.now();
        await this.requests.ping();
        this.ping = Date.now() - start;
        this.ping = await this._fetchClient();
        if (this.options?.fetchServers) await this.servers.fetch();
        if (this.options?.ws) await this.ws.connect();
        this.readyAt = Date.now();
        return true;
    }

    async _fetchClient() {
        const data = await this.requests.make(endpoints.account.main);
        this.user = new ClientUser(this, data.attributes);
    }

    /**
     * Adds a server or an array of servers to be connected to websockets.
     * @param {string|Array<string>} ids The identifier of the server, or an array of server identifiers.
     */
    addSocketServer(ids) {
        Array.isArray(ids) ? this.ws.servers.push(...ids) : this.ws.servers.push(ids);
    }

    /**
     * Removes a server from websocket connections.
     * @param {sting} id The identifier of the server.
     */
    removeSocketServer(id) {
        this.ws.servers.splice(id);
    }
}

module.exports = PteroClient;

/**
 * Startup options for the client API.
 * @typedef {object} ClientOptions
 * @property {boolean} [ws] Whether to enable server websocket connections (default: `false`).
 * @property {boolean} [fetchServers] Whether to fetch all servers (default: `false`).
 * @property {Array<string>} [disableEvents] An array of events to disable (wont be emitted).
 */
