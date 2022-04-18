const { EventEmitter } = require('events');
const ClientServerManager = require('./ClientServerManager');
const { ClientUser } = require('../structures/User');
const RequestManager = require('../http/RequestManager');
const ScheduleManager = require('./ScheduleManager');
const WebSocketManager = require('./ws/WebSocketManager');
const endpoints = require('./endpoints');
const loader = require('../util/configLoader');
const Shard = require('./ws/Shard');

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

        if (!/https?\:\/\/(?:localhost\:\d{4}|[\w\.\-]{3,256})/gi.test(domain))
            throw new SyntaxError(
                "Domain URL must start with 'http://' or 'https://' and "+
                'must be bound to a port if using localhost.'
            );

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
        this.options = loader.clientConfig(options);

        /** @type {ClientUser} */
        this.user = null;

        /** @type {ClientServerManager} */
        this.servers = new ClientServerManager(this);

        /** @type {ScheduleManager} */
        this.schedules = new ScheduleManager(this);

        /** @type {RequestManager} @internal */
        this.requests = new RequestManager('Client', this.domain, this.auth);

        /** @type {WebSocketManager} */
        this.ws = new WebSocketManager(this);
    }

    /**
     * Performs preload requests to Pterodactyl and launches websocket connections.
     * @returns {Promise<boolean>}
     * @fires PteroClient#ready
     */
    async connect() {
        if (this.options.fetchClient) await this.fetchClient();
        if (this.options.servers.fetch && this.options.servers.cache) await this.servers.fetch();

        return true;
    }

    get ping() {
        return this.requests._ping;
    }

    /**
     * Fetches the client user's account. This will contain information such as 2FA
     * recovery tokens, API keys and email data.
     * @returns {Promise<ClientUser>} The client user.
     */
    async fetchClient() {
        const data = await this.requests.get(endpoints.account.main);
        this.user = new ClientUser(this, data.attributes);
        return this.user;
    }

    /**
     * Adds a server or an array of servers to be connected to websockets.
     * @param {string[] | string} ids The identifier(s) of the server.
     * @returns {Shard|Shard[]} Created (or reused) shard(s).
     */
    addSocketServer(ids) {
        if (typeof ids === 'string')
            return this.ws.createShard(ids);
        else if (ids instanceof Array)
            return ids.map(id => this.ws.createShard(id))
    }

    /**
     * Removes a server from websocket connections.
     * @param {string} id The identifier of the server.
     * @returns {boolean} Whether shard was removed.
     */
    removeSocketServer(id) {
        return this.ws.removeShard(id);
    }

    /**
     * Closes any existing websocket connections.
     * @returns {void}
     */
    disconnect() {
        if (this.ws.readyAt) this.ws.destroy();
    }
}

module.exports = PteroClient;

/**
 * @typedef {object} OptionSpec
 * @property {boolean} fetch
 * @property {boolean} cache
 * @property {number} max
 */

/**
 * Startup options for the client API.
 * @typedef {object} ClientOptions
 * @property {boolean} [fetchClient] Whether to fetch the client user (default `true`).
 * @property {OptionSpec} [servers] Options for fetching and caching servers.
 * @property {OptionSpec} [subUsers] Options for fetching and caching server subusers.
 * @property {string[]} [disableEvents] An array of events to disable (wont be emitted).
 */

/**
 * Debug event emitted for websocket events.
 * @event PteroClient#debug
 * @param {string} message The message emitted with the event.
 */

/**
 * Emitted when the websocket encounters an error.
 * @event PteroClient#error
 * @param {*} error The error received.
 */

/**
 * Emitted when the websocket manager is ready.
 * @event PteroClient#ready
 */
