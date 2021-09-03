const { EventEmitter } = require('events');
const ClientRequestManager = require('./managers/ClientRequestManager');
const ClientServerManager = require('./managers/ClientServerManager');
const { ClientUser } = require('../structures/User');
const endpoints = require('./managers/Endpoints');
const presets = require('../structures/Presets');

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
        this.options = presets.client(options);

        /**
         * @type {?Date}
         */
        this.readyAt = null;

        /**
          * @type {?number}
          */
        this.ping = null;

        /**
         * @type {?ClientUser}
         */
        this.user = null;

        this.requests = new ClientRequestManager(this);
        this.servers = new ClientServerManager(this);
    }

    /**
     * Sends a ping request to the API before establishing websocket connections.
     * @returns {Promise<boolean>}
     * @fires PteroClient#ready
     */
    async connect() {
        const start = Date.now();
        await this.requests.ping();
        this.ping = Date.now() - start;
        if (this.options.fetchClient) this.user = await this.fetchClient();
        if (this.options.fetchServers && this.options.cacheServers) await this.servers.fetch();
        this.readyAt = Date.now();
        return true;
    }

    /**
     * @returns {Promise<ClientUser>}
     */
    async fetchClient() {
        const data = await this.requests.make(endpoints.account.main);
        return new ClientUser(this, data.attributes);
    }

    /**
     * Adds a server or an array of servers to be connected to websockets.
     * @param {string|string[]} ids The identifier of the server, or an array of server identifiers.
     */
    addSocketServer(ids) {
        Array.isArray(ids) ? this.ws.servers.push(...ids) : this.ws.servers.push(ids);
    }

    /**
     * Removes a server from websocket connections.
     * @param {string} id The identifier of the server.
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
 * @property {boolean} [fetchClient] Whether to fetch the client user (default `true`).
 * @property {boolean} [fetchServers] Whether to fetch all servers (default: `false`).
 * @property {boolean} [cacheServers] Whether to cache servers (default `true`).
 * @property {boolean} [cacheSubUsers] Whether to cache server subusers (default `true`).
 * @property {string[]} [disableEvents] An array of events to disable (wont be emitted).
 */

/**
 * Emitted when the websocket manager is ready.
 * @event PteroClient#ready
 */

/**
 * Debug event emitted for websocket events.
 * @event PteroClient#debug
 * @param {string} message The message emitted with the event.
 */
