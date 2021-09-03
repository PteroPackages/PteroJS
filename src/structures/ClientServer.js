const AllocationManager = require('../managers/AllocationManager');
const DatabaseManager = require('../managers/DatabaseManager');
const FileManager = require('../managers/FileManager');
const Permissions = require('./Permissions');
const endpoints = require('../client/managers/Endpoints');

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
        this.sftp = {
            ip: attr.sftp_details.ip,
            port: attr.sftp_details.port
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
        this.suspended = attr.is_suspended;

        /**
         * @type {string}
         */
        this.state = 'unknown';

        /**
         * @type {boolean}
         */
        this.installing = attr.is_installing;

        this.allocations = new AllocationManager(attr);
        this.permissions = new Permissions(data.meta?.user_permissions ?? {});
        this.databases = new DatabaseManager(client, data.databases);
        this.files = new FileManager(client, data.files);
    }

    addWebSocket() {
        this.client.addSocketServer(this.identifier);
    }

    get resources() {}

    /**
     * Sends a command to the server terminal.
     * @param {string} command The command to send.
     * @returns {Promise<void>}
     */
    async sendCommand(command) {
        await this.client.requests.make(
            endpoints.servers.command(this.identifier), { command }, 'POST'
        );
    }

    /**
     * Changes the server's power state. This can be one of the following:
     * * start
     * * stop
     * * restart
     * * kill
     * @param {string} state The power state to set the server to.
     * @returns {Promise<void>}
     */
    async setPowerState(state) {
        if (!['start', 'stop', 'restart', 'kill'].includes(state)) throw new Error('Invalid power state.');
        await this.client.requests.make(
            endpoints.servers.power(this.identifier), { signal: state }, 'POST'
        );
        this.state = state;
    }
}

module.exports = ClientServer;
