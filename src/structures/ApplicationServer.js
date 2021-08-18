class ApplicationServer {
    constructor(client, data) {
        this.client = client;

        /**
         * @type {string}
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
    }

    /**
     * @todo database submanager
     */
    get databases() {}

    /**
     * @todo file submanager
     */
    get files() {}

    /**
     * @todo schedule submanager
     */
    get schedules() {}

    /**
     * @todo subuser manager
     */
    get users() {}

    /**
     * @todo backup submanager
     */
    get backups() {}

    /**
     * @todo resource manager
     */
    get resources() {}

    sendCommand(command) {}

    setState(state) {}
}

module.exports = ApplicationServer;
