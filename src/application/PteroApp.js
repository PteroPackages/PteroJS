const ApplicationRequestManager = require('./ApplicationRequestManager');
const ApplicationServerManager = require('./ApplicationServerManager');
const NestManager = require('./NestManager');
const NodeLocationManager = require('./NodeLocationManager');
const NodeManager = require('./NodeManager');
const UserManager = require('./UserManager');
const loader = require('../structures/configLoader');

/**
 * The base class for the Pterodactyl application API.
 * This operates using a Pterodactyl application API key which can be found
 * at <your.domain.name/admin/api>.
 * 
 * **Warning:** Keep your API key private at all times. Exposing this can lead
 * to your servers, nodes, configurations and more being corrupted and/or deleted.
 */
class PteroApp {
    /**
     * @param {string} domain The Pterodactyl domain.
     * @param {string} auth The authentication key for Pterodactyl.
     * @param {ApplicationOptions} [options] Additional application options.
     */
    constructor(domain, auth, options = {}) {
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
         * Additional startup options for the application (optional).
         * @type {ApplicationOptions}
         */
        this.options = loader.appConfig(options);

        /** @type {?Date} */
        this.readyAt = null;

        /** @type {?number} */
        this.ping = null;

        /** @type {UserManager} */
        this.users = new UserManager(this);
        /** @type {NodeManager} */
        this.nodes = new NodeManager(this);
        /** @type {NestManager} */
        this.nests = new NestManager(this);
        /** @type {ApplicationServerManager} */
        this.servers = new ApplicationServerManager(this);
        /** @type {NodeLocationManager} */
        this.locations = new NodeLocationManager(this);
        /** @type {ApplicationRequestManager} @internal */
        this.requests = new ApplicationRequestManager(this);
    }

    /**
     * Sends a ping request to the API before performing additional startup requests.
     * Attempting to use the application without connecting to the API will result
     * in an error.
     * @returns {Promise<boolean>}
     */
    async connect() {
        if (this.readyAt) return;
        const start = Date.now();
        await this.requests.ping();
        this.ping = Date.now() - start;
        if (this.options.users.fetch && this.options.users.cache) await this.users.fetch();
        if (this.options.nodes.fetch && this.options.nodes.cache) await this.nodes.fetch();
        if (this.options.nests.fetch && this.options.nests.cache) await this.nests.fetch();
        if (this.options.servers.fetch && this.options.servers.cache) await this.servers.fetch();
        if (this.options.locations.fetch && this.options.locations.cache) await this.locations.fetch();
        this.readyAt = Date.now();
        return true;
    }

    /**
     * Disconnects from the Pterodactyl API.
     * @returns {void}
     */
    async disconnect() {
        if (!this.readyAt) return;
        this.ping = null;
        this.readyAt = null;
    }
}

module.exports = PteroApp;

/**
 * @typedef {object} OptionSpec
 * @property {boolean} fetch
 * @property {boolean} cache
 * @property {number} max
 */

/**
 * Startup options for the application API.
 * By default, all fetch options are `false`, and all cache options are `true`.
 * Enabling fetch and disabling cache for the same class will cancel out the request.
 * @typedef {object} ApplicationOptions
 * @property {OptionSpec} [users] Options for fetching and caching users.
 * @property {OptionSpec} [nodes] Options for fetching and caching nodes.
 * @property {OptionSpec} [nests] Options for fetching and caching nests.
 * @property {OptionSpec} [servers] Options for fetching and caching servers.
 * @property {OptionSpec} [locations] Options for fetching and caching node locations.
 */
