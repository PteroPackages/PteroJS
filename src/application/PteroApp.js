const ApplicationServerManager = require('./ApplicationServerManager');
const NestManager = require('./NestManager');
const NodeAllocationManager = require('./NodeAllocationManager');
const NodeLocationManager = require('./NodeLocationManager');
const NodeManager = require('./NodeManager');
const UserManager = require('./UserManager');
const RequestManager = require('../http/RequestManager');
const loader = require('../util/configLoader');

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
         * Additional startup options for the application (optional).
         * @type {ApplicationOptions}
         */
        this.options = loader.appConfig(options);

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

        /** @type {NodeAllocationManager} */
        this.allocations = new NodeAllocationManager(this);

        /** @type {RequestManager} @internal */
        this.requests = new RequestManager('application', domain, auth);
    }

    /**
     * Used for performing preload requests to Pterodactyl.
     * @returns {Promise<boolean>}
     */
    async connect() {
        if (this.options.users.fetch && this.options.users.cache) await this.users.fetch();
        if (this.options.nodes.fetch && this.options.nodes.cache) await this.nodes.fetch();
        if (this.options.nests.fetch && this.options.nests.cache) await this.nests.fetch();
        if (this.options.servers.fetch && this.options.servers.cache) await this.servers.fetch();
        if (this.options.locations.fetch && this.options.locations.cache)
            await this.locations.fetch();

        return true;
    }

    get ping() {
        return this.requests.ping;
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
