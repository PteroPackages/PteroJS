const { EventEmitter } = require('events');
const ClientRequestManager = require('./managers/ClientRequestManager');
const { ClientUser } = require('../structures/User');
const ServerManager = require('./managers/ServerManager');
const WebSocketManager = require('./managers/WebSocketManager');

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
         * @type {ClientOptions}
         */
        this.options = options;

        this.user = new ClientUser(this, null); // WIP
        this.ws = new WebSocketManager(this);
        this.requests = new ClientRequestManager(this);
        this.servers = new ServerManager(this);
    }

    /**
     * Sends a ping request to the API before establishing websocket connections.
     * @returns {Promise<boolean>}
     */
    async connect() {
        await this.requests.make('/');
        if (this.options?.fetchServers) await this.servers.fetch();
        return true;
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
 * @property {boolean} [fetchServers] Whether to fetch all servers (default: `false`).
 * @property {boolean} [reconnect] Whether to reconnect after token refreshes (default: `true`).
 * @property {Array<string>} [disableEvents] An array of events to disable (wont be emitted).
 */
