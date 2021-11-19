const AllocationManager = require('../managers/AllocationManager');
const DatabaseManager = require('../managers/DatabaseManager');
const FileManager = require('../managers/FileManager');
const { PteroUser } = require('./User');
const Node = require('./Node');
const json = require('./Jsonifier');
const endpoints = require('../application/endpoints');

class ApplicationServer {
    constructor(client, data) {
        this.client = client;

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
        this.databases = new DatabaseManager(client, data);
        /** @type {FileManager} */
        this.files = new FileManager(client, data);
        /** @type {AllocationManager} */
        this.allocations = new AllocationManager(client, this, data);

        this._patch(data);
    }

    _patch(data) {
        if ('id' in data) {
            /**
             * The of the server (separate from UUID).
             * @type {number}
             */
            this.id = data.id;
        }

        if ('external_id' in data) {
            /**
             * The external ID of the server (if set).
             * @type {?string}
             */
            this.externalId = data.external_id ?? null;
        }

        if ('uuid' in data) {
            /**
             * The internal UUID of the server.
             * @type {string}
             */
            this.uuid = data.uuid;
        }

        if ('identifier' in data) {
            /**
             * A substring of the server's UUID to easily identify it.
             * @type {string}
             */
            this.identifier = data.identifier;
        }

        if ('name' in data) {
            /**
             * The name of the server.
             * @type {string}
             */
            this.name = data.name;
        }

        if ('description' in data) {
            /**
             * A brief description of the server (if set).
             * @type {?string}
             */
            this.description = data.description || null;
        }

        if ('suspended' in data) {
            /**
             * Whether the server is suspended from action.
             * @type {boolean}
             */
            this.suspended = data.suspended;
        }

        if ('limits' in data) {
            /**
             * An object containing the server's limits.
             * @type {object}
             */
            this.limits = data.limits;
        }

        if ('feature_limits' in data) {
            /**
             * An object containing the server's feature limits.
             * @type {object}
             */
            this.featureLimits = data.feature_limits;
        }

        if ('user' in data) {
            /**
             * The ID of the user. Use {@link ApplicationServer.fetchOwner} to return the
             * full PteroUser object via {@link ApplicationServer.owner}.
             * @type {number}
             */
            this.user = data.user;
        }

        if (!this.owner) {
            /**
             * The server owner PteroUser object. This can be fetched by including 'user' in
             * the ApplicationServerManager.fetch, or via {@link ApplicationServer.fetchOwner}.
             * @type {?PteroUser}
             */
            this.owner = this.client.users.resolve(data);
        }

        if ('node' in data) {
            /**
             * The ID of the node. This is not received by default and must be fetched
             * via the client NodeManager.
             * @type {number}
             */
            this.nodeId = data.node;
        }

        if ('-' in data) {
            /**
             * The node object that the server is part of. This can be fetched by including
             * 'node' in the ApplicationServerManager.fetch.
             * @type {?Node}
             */
            this.node = null;
        }

        if ('allocation' in data) {
            /**
             * The ID of the allocation for this server.
             * @type {number}
             */
            this.allocation = data.allocation;
        }

        if ('nest' in data) {
            /**
             * The ID of the nest this server is part of.
             * @type {number}
             */
            this.nest = data.nest;
        }

        if ('egg' in data) {
            /**
             * The ID of the egg this server uses.
             * @type {number}
             */
            this.egg = data.egg;
        }

        if ('-' in data) {
            /**
             * @todo Implement container manager
             */
            this.container = null;
        }
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
            endpoints.servers.details(this.id), payload, 'PATCH'
        );

        this._patch(payload);
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
        await this.client.requests.make(endpoints.servers.suspend(this.id), null, 'POST');
        this.suspended = true;
    }

    /**
     * Unsuspends the server.
     * @returns {Promise<void>}
     */
    async unsuspend() {
        await this.client.requests.make(endpoints.servers.unsuspend(this.id), null, 'POST');
        this.suspended = false;
    }

    /**
     * Reinstalls the server.
     * @returns {Promise<void>}
     */
    async reinstall() {
        await this.client.requests.make(endpoints.servers.reinstall(this.id), null, 'POST');
    }

    /**
     * Returns the JSON value of the server.
     * @returns {object} The JSON value.
     */
    toJSON() {
        return json(this, ['client']);
    }
}

module.exports = ApplicationServer;
