const AllocationManager = require('../managers/AllocationManager');
const DatabaseManager = require('../managers/DatabaseManager');
const FileManager = require('../managers/FileManager');
const { PteroUser } = require('./User');
const endpoints = require('../application/managers/Endpoints');

class ApplicationServer {
    constructor(client, data) {
        this.client = client;

        /**
         * @type {number}
         */
        this.id = data.id;

        /**
         * @type {string}
         */
        this.externalId = data.external_id;

        /**
         * @type {string}
         */
        this.uuid = data.uuid;

        /**
         * @type {string}
         */
        this.identifier = data.identifier;

        /**
         * @type {string}
         */
        this.name = data.name;

        /**
         * @type {string}
         */
        this.description = data.description;

        /**
         * @type {boolean}
         */
        this.suspended = data.suspended;

        /**
         * @type {object}
         */
        this.limits = data.limits;

        /**
         * @type {object}
         */
        this.featureLimits = data.feature_limits;

        /**
         * @type {number}
         */
        this.user = data.user;

        /**
         * @type {number}
         */
        this.node = data.node;

        /**
         * @type {number}
         */
        this.allocation = data.allocation;

        /**
         * @type {number}
         */
        this.nest = data.nest;

        /**
         * @type {number}
         */
        this.egg = data.egg;

        /**
         * @todo Implement container manager
         */
        this.container = null;

        /**
         * @type {Date}
         */
        this.createdAt = new Date(data.created_at);

        /**
         * @type {number}
         */
        this.createdTimestamp = this.createdAt.getTime();

        /**
         * @type {?Date}
         */
        this.updatedAt = data.updated_at ? new Date(data.updated_at) : null;

        /**
         * @type {?number}
         */
        this.updatedTimestamp = this.updatedAt?.getTime() || null;

        this.databases = new DatabaseManager(this.client, data.databases);
        this.files = new FileManager(this.client, data.files);
        this.allocations = new AllocationManager(data.allocations);
    }

    /**
     * Updates details of the server.
     * @param {object} options Update details options.
     * @param {string} [options.name] The new name of the server.
     * @param {number|PteroUser} [options.owner] The new owner of the server.
     * @param {string} [options.externalId] The new external ID of the server.Array
     * @param {string} [options.description] The new description of the server.
     * @returns {Promise<ApplicationServer>}
     */
    async updateDetails(options) {
        if (!Object.keys(options).length) throw new Error('Too few options to update.');

        const payload = {};
        payload.name = options.name ?? this.name;
        payload.user = options.owner ?? this.user;
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
     * Updates the server's build structure.
     * @param {object} options Build options.
     * @todo
     */
    async updateBuild(options) {}

    /**
     * Updates the server's startup configuration.
     * @param {object} options Startup options.
     * @todo
     */
    async updateStartup(options) {}

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
     * @returns {Promise<boolean>}
     */
    async reinstall() {
        return await this.client.requests.make(endpoints.servers.reinstall(this.id), { method: 'POST' });
    }

    /**
     * Returns the JSON value of the server.
     * @returns {object}
     */
    toJSON() {
        return JSON.parse(JSON.stringify(this));
    }
}

module.exports = ApplicationServer;
