const { EventEmitter } = require('events');
const ClientRequestManager = require('./managers/ClientRequestManager');
const ClientServerManager = require('./managers/ClientServerManager');
const { ClientUser } = require('../structures/User');
const WebSocketManager = require('./managers/WebSocketManager');
const endpoints = require('./managers/endpoints');
const presets = require('../structures/Presets');

/**
 * The base class for the Pterodactyl client API.
 * This operates using a Pterodactyl user access token which can be found at
 * <your.domain.name/admin/api>.
 * 
 * The access token will grant you access to your servers only, with the option
 * to fetch node and API key information and establish websockets to your servers.
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
         * Additional startup options for the client (optional).
         * @type {ClientOptions}
         */
        this.options = presets.client(options);

        /** @type {?Date} */
        this.readyAt = null;

        /** @type {?number} */
        this.ping = null;

        /** @type {?ClientUser} */
        this.user = null;

        /** @type {ClientServerManager} */
        this.servers = new ClientServerManager(this);
        /** @type {ClientRequestManager} @internal */
        this.requests = new ClientRequestManager(this);
        /** @type {WebSocketManager} @internal */
        this.ws = new WebSocketManager(this);
    }

    /**
     * Sends a ping request to the API before performing additional startup requests
     * as well as any websocket connections. Attempting to use the application without
     * connecting to the API will result in an error.
     * @returns {Promise<boolean>}
     * @fires PteroClient#ready
     */
    async connect() {
        const start = Date.now();
        await this.requests.ping();
        this.ping = Date.now() - start;
        if (this.options.fetchClient) this.user = await this.fetchClient();
        if (this.options.fetchServers && this.options.cacheServers) await this.servers.fetch();
        // if (this.options.ws) await this.ws.connect();
        this.readyAt = Date.now();
        return true;
    }

    /**
     * Fetches the client user's account. This will contain information such as 2FA
     * recovery tokens, API keys and email data.
     * @returns {Promise<ClientUser>} The client user.
     */
    async fetchClient() {
        const data = await this.requests.make(endpoints.account.main);
        return new ClientUser(this, data.attributes);
    }

    /**
     * Adds a server or an array of servers to be connected to websockets.
     * @param {string|string[]} ids The identifier of the server, or an array of server identifiers.
     * @returns {void}
     */
    addSocketServer(ids) {
        Array.isArray(ids) ? this.ws.servers.push(...ids) : this.ws.servers.push(ids);
    }

    /**
     * Removes a server from websocket connections.
     * @param {string} id The identifier of the server.
     * @returns {void}
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
