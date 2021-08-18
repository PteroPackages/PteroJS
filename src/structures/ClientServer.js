const {
    AllocationManager,
    DatabaseManager,
    FileManager,
    Permissions
} = require('.');

class ClientServer {
    constructor(client, data) {
        this.client = client;
        const attr = data.attributes;

        /**
         * @type {boolean}
         */
        this.isOwner = attr.server_owner;

        /**
         * @type {string}
         */
        this.identifier = attr.identifier;

        /**
         * @type {string}
         */
        this.uuid = attr.uuid;

        /**
         * @type {string}
         */
        this.name = attr.name;

        /**
         * @type {string}
         */
        this.node = attr.node;

        /**
         * @type {object}
         */
        this.sfpt = {
            ip: attr.sfpt_details.ip,
            port: attr.sfpt_details.port
        }

        /**
         * @type {?string}
         */
        this.description = attr.description;

        /**
         * @type {object}
         */
        this.limits = attr.limits;

        /**
         * @type {object}
         */
        this.featureLimits = attr.feature_limits;

        /**
         * @type {boolean}
         */
        this.suspended = attr.suspended;

        /**
         * @type {boolean}
         */
        this.installing = attr.installing;

        this.allocations = new AllocationManager(attr);

        this.permissions = new Permissions(data.meta.user_permissions);

        this.databases = new DatabaseManager(client, null);

        this.files = new FileManager(client, null);
    }
}

module.exports = ClientServer;
