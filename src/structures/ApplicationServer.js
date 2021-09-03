const AllocationManager = require('../managers/AllocationManager');
const DatabaseManager = require('../managers/DatabaseManager');
const FileManager = require('../managers/FileManager');
const { PteroUser } = require('./User');
const endpoints = require('../application/managers/Endpoints');

class ApplicationServer {
    constructor(client, data) {
        this.client = client;

        /**
         * The of the server (separate from UUID).
         * @type {number}
         */
        this.id = data.id;

        /**
         * The external ID of the server (if set).
         * @type {?string}
         */
        this.externalId = data.external_id ?? null;

        /**
         * The internal UUID of the server.
         * @type {string}
         */
        this.uuid = data.uuid;

        /**
         * A substring of the server's UUID to easily identify it.
         * @type {string}
         */
        this.identifier = data.identifier;

        /**
         * The name of the server.
         * @type {string}
         */
        this.name = data.name;

        /**
         * A brief description of the server (if set).
         * @type {?string}
         */
        this.description = data.description || null;

        /**
         * Whether the server is suspended from action.
         * @type {boolean}
         */
        this.suspended = data.suspended;

        /**
         * An object containing the server's limits.
         * @type {object}
         */
        this.limits = data.limits;

        /**
         * An object containing the server's feature limits.
         * @type {object}
         */
        this.featureLimits = data.feature_limits;

        /**
         * The ID of the user. Use {@link ApplicationServer.fetchOwner} to return the
         * full PteroUser object via {@link ApplicationServer.owner}.
         * @type {number}
         */
        this.user = data.user;

        /**
         * The server owner PteroUser object. This is not received by default but can
         * be fetched using {@link ApplicationServer.fetchOwner}.
         * @type {?PteroUser}
         */
        this.owner = null;

        /**
         * The ID of the node. This is not received by default and must be fetched
         * via the client NodeManager.
         * @type {number}
         */
        this.node = data.node;

        /**
         * The ID of the allocation for this server.
         * @type {number}
         */
        this.allocation = data.allocation;

        /**
         * The ID of the nest this server is part of.
         * @type {number}
         */
        this.nest = data.nest;

        /**
         * The ID of the egg this server uses.
         * @type {number}
         */
        this.egg = data.egg;

        /**
         * @todo Implement container manager
         */
        this.container = null;

        /**
         * The date the server was created.
         * @type {Date}
         */
        this.createdAt = new Date(data.created_at);
        /** @type {number} */
        this.createdTimestamp = this.createdAt.getTime();

        /**
         * The date the server was last updated.
         * @type {?Date}
         */
        this.updatedAt = data.updated_at ? new Date(data.updated_at) : null;
        /** @type {?number} */
        this.updatedTimestamp = this.updatedAt?.getTime() || null;

        /** @type {DatabaseManager} */
        this.databases = new DatabaseManager(this.client, data.databases);
        /** @type {FileManager} */
        this.files = new FileManager(this.client, data.files);
        /** @type {AllocationManager} */
        this.allocations = new AllocationManager(data.allocations);
    }

    /**
     * Updates details of the server.
     * @param {object} options Update details options.
     * @param {string} [options.name] The new name of the server.
     * @param {number|PteroUser} [options.owner] The new owner of the server.
     * @param {string} [options.externalId] The new external ID of the server.Array
     * @param {string} [options.description] The new description of the server.
     * @returns {Promise<ApplicationServer>} The updated server instance.
     */
    async updateDetails(options = {}) {
        if (!Object.keys(options).length) throw new Error('Too few options to update.');

        const owner = options.owner instanceof PteroUser ? options.owner.id : options.owner;
        const payload = {};
        payload.name = options.name ?? this.name;
        payload.user = owner ?? this.user;
        payload.external_id = options.externalId ?? this.externalId;
        payload.description = options.description ?? this.description;

        await this.client.requests.make(
            endpoints.servers.get(this.id), payload, 'POST'
        );

        this.name = payload.name;
        this.user = payload.user;
        this.externalId = payload.external_id;
        this.description = payload.description;
        return this;
    }

    /**
     * Fetches the PteroUser object of the server owner.
     * The user can be accessed via {@link ApplicationServer.owner}.
     * @returns {Promise<PteroUser>} The fetched user.
     */
    async fetchOwner() {}

    /**
     * Updates the server's build structure.
     * @param {object} options Build options.
     * @todo
     */
    async updateBuild(options = {}) {}

    /**
     * Updates the server's startup configuration.
     * @param {object} options Startup options.
     * @todo
     */
    async updateStartup(options = {}) {}

    /**
     * Suspends the server.
     * @returns {Promise<void>}
     */
    async suspend() {
        await this.client.requests.make(endpoints.servers.suspend(this.id), { method: 'POST' });
        this.suspended = true;
    }

    /**
     * Unsuspends the server.
     * @returns {Promise<void>}
     */
    async unsuspend() {
        await this.client.requests.make(endpoints.servers.unsuspend(this.id), { method: 'POST' });
        this.suspended = false;
    }

    /**
     * Reinstalls the server.
     * @returns {Promise<void>}
     */
    async reinstall() {
        await this.client.requests.make(endpoints.servers.reinstall(this.id), { method: 'POST' });
    }

    /**
     * Returns the JSON value of the server.
     * @returns {object} The JSON value.
     */
    toJSON() {
        return JSON.parse(JSON.stringify(this));
    }
}

module.exports = ApplicationServer;
