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
         * Whether the client user is the owner of the server.
         * @type {boolean}
         */
        this.isOwner = attr.server_owner;

        /**
         * A substring of the server's UUID to easily identify it.
         * @type {string}
         */
        this.identifier = attr.identifier;

        /**
         * The internal UUID of the server.
         * @type {string}
         */
        this.uuid = attr.uuid;

        /**
         * The name of the server.
         * @type {string}
         */
        this.name = attr.name;

        /**
         * The name of the node the server is on.
         * @type {string}
         */
        this.node = attr.node;

        /**
         * An object containing SFTP details.
         * @type {object}
         */
        this.sftp = {
            ip: attr.sftp_details.ip,
            port: attr.sftp_details.port
        }

        /**
         * A brief description of the server (if set).
         * @type {?string}
         */
        this.description = attr.description || null;

        /**
         * An object containing the server's limits.
         * @type {object}
         */
        this.limits = attr.limits;

        /**
         * An object containing the server's feature limits.
         * @type {object}
         */
        this.featureLimits = attr.feature_limits;

        /**
         * Whether the server is suspended from action.
         * @type {boolean}
         */
        this.suspended = attr.is_suspended;

        /**
         * The current power state of the server.
         * @type {string}
         */
        this.state = 'unknown';

        /**
         * Whether the server is currently being installed.
         * @type {boolean}
         */
        this.installing = attr.is_installing;

        /** @type {AllocationManager} */
        this.allocations = new AllocationManager(attr);
        /** @type {Permissions} */
        this.permissions = new Permissions(data.meta?.user_permissions ?? {});
        /** @type {DatabaseManager} */
        this.databases = new DatabaseManager(client, this, attr.relationships);
        /** @type {FileManager} */
        this.files = new FileManager(client, this, attr.relationships);
    }

    /**
     * Adds the server to the WebSocket connection list to be established.
     * @returns {void}
     */
    addWebSocket() {
        this.client.addSocketServer(this.identifier);
    }

    /** @todo */
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
