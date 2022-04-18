const { PteroUser } = require('./User');
const Node = require('./Node');
const caseConv = require('../util/caseConv');
const endpoints = require('../application/endpoints');

class ApplicationServer {
    constructor(client, data) {
        this.client = client;

        /**
         * The of the server (separate from UUID).
         * @type {number}
         */
        this.id = data.id;

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

        this._patch(data);
    }

    _patch(data) {
        if ('external_id' in data) {
            /**
             * The external ID of the server (if set).
             * @type {?string}
             */
            this.externalId = data.external_id ?? null;
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
             * The ID of the server owner. Use {@link ApplicationServer.fetchOwner} to return the
             * full PteroUser object via {@link ApplicationServer.owner}.
             * @type {number}
             */
            this.ownerId = data.user;
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

        if (!this.node) {
            /**
             * The node object that the server is part of. This can be fetched by including
             * 'node' in the ApplicationServerManager.fetch.
             * @type {?Node}
             */
            this.node = this.client.nodes.resolve(data);
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
     * Returns a formatted URL to the server.
     * @returns {string} The formatted URL.
     */
    get panelURL() {
        return `${this.client.domain}/server/${this.identifier}`;
    }

    /**
     * Returns a formatted URL to the server in the admin panel.
     * @returns {string} The formatted URL.
     */
    get adminURL() {
        return `${this.client.domain}/admin/servers/view/${this.id}`;
    }

    /**
     * Fetches the PteroUser object of the server owner.
     * The user can be accessed via {@link ApplicationServer.owner}.
     * @returns {Promise<PteroUser>} The fetched user.
     */
    async fetchOwner() {
        if (this.owner) return this.owner;
        const user = await this.client.users.fetch(this.ownerId, { force: true });
        this.owner = user;
        return user;
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

        await this.client.requests.patch(
            endpoints.servers.details(this.id), payload
        );

        this._patch(payload);
        return this;
    }

    /**
     * Updates the server's build structure.
     * @param {object} options Update build options.
     * @param {number} [options.allocation] The ID of the allocation for the server.
     * @param {number} [options.swap] Server space swap option.
     * @param {number} [options.memory] The amount of memory allowed for the server.
     * @param {number} [options.disk] The amount of disk allowed for the server.
     * @param {number} [options.cpu] The amount of CPU to allow for the server.
     * @param {?number} [options.threads] The number of threads for the server.
     * @param {number} [options.io]
     * @param {object} [options.featureLimits] Feature limits options.
     * @param {number} [options.featureLimits.allocations] The server allocations limit.
     * @param {number} [options.featureLimits.backups] The server backups limit.
     * @param {number} [options.featureLimits.databases] The server databases limit.
     * @returns {Promise<ApplicationServer>} The updated server instance.
     */
    async updateBuild(options = {}) {
        if (!Object.keys(options).length) throw new Error('Too few options to update.');

        options.allocation ??= this.allocation;
        options.swap ??= this.limits.swap ?? 0;
        options.memory ??= this.memory;
        options.disk ??= this.disk;
        options.cpu ??= this.limits.cpu ?? 0;
        options.threads ??= this.limits.threads;
        options.io ??= this.limits.io;
        options.featureLimits ??= {};
        options.featureLimits.allocations ??= this.featureLimits.allocations ?? 0;
        options.featureLimits.backups ??= this.featureLimits.backups ?? 0;
        options.featureLimits.databases ??= this.featureLimits.databases ?? 0;

        // TODO: caseConv update
        options.feature_limits = caseConv.snakeCase(options.featureLimits);
        await this.client.requests.patch(
            endpoints.servers.build(this.id), options
        );

        this._patch(options);
        return this;
    }

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
        await this.client.requests.post(
            endpoints.servers.suspend(this.id), null
        );
        this.suspended = true;
    }

    /**
     * Unsuspends the server.
     * @returns {Promise<void>}
     */
    async unsuspend() {
        await this.client.requests.post(
            endpoints.servers.unsuspend(this.id), null
        );
        this.suspended = false;
    }

    /**
     * Reinstalls the server.
     * @returns {Promise<void>}
     */
    async reinstall() {
        await this.client.requests.post(
            endpoints.servers.reinstall(this.id), null
        );
    }

    /**
     * Deletes the server (with force option).
     * @param {boolean} [force] Whether to force delete the server.
     * @returns {Promise<boolean>}
     */
    async delete(force = false) {
        return this.client.servers.delete(this.id, force);
    }

    /**
     * Returns the JSON value of the server.
     * @returns {object} The JSON value.
     */
    toJSON() {
        return caseConv.snakeCase(this, ['client']);
    }
}

module.exports = ApplicationServer;
