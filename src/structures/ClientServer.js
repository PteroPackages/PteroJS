const ClientDatabaseManager = require('../client/ClientDatabaseManager');
const FileManager = require('../client/FileManager');
const NetworkAllocationManager = require('../client/NetworkAllocationManager');
const Permissions = require('./Permissions');
const SubUserManager = require('../client/SubUserManager');
const endpoints = require('../client/endpoints');

class ClientServer {
    constructor(client, data) {
        this.client = client;
        const attr = data.attributes;

        /**
         * The internal UUID of the server.
         * @type {string}
         */
        this.uuid = attr.uuid;

        /**
         * A substring of the server's UUID to easily identify it.
         * @type {string}
         */
        this.identifier = attr.identifier;

        /** @type {SubUserManager} */
        this.users = new SubUserManager(client, this);

        /** @type {NetworkAllocationManager} */
        this.allocations = new NetworkAllocationManager(client, this);

        /** @type {Permissions} */
        this.permissions = new Permissions(data.meta?.user_permissions ?? {});

        /** @type {ClientDatabaseManager} */
        this.databases = new ClientDatabaseManager(client, this, attr.relationships);

        /** @type {FileManager} */
        this.files = new FileManager(client, this, attr.relationships);

        this._patch(attr);
    }

    _patch(data) {
        if ('server_owner' in data) {
            /**
             * Whether the client user is the owner of the server.
             * @type {boolean}
             */
            this.isOwner = data.server_owner;
        }

        if ('name' in data) {
            /**
             * The name of the server.
             * @type {string}
             */
            this.name = data.name;
        }

        if ('node' in data) {
            /**
             * The name of the node the server is on.
             * @type {string}
             */
            this.node = data.node;
        }

        if ('sftp_details' in data) {
            /**
             * An object containing SFTP details.
             * @type {object}
             */
            this.sftp = {
                /** @type {string} */
                ip: data.sftp_details.ip,
                /** @type {number} */
                port: data.sftp_details.port
            }
        }

        if ('description' in data) {
            /**
             * A brief description of the server (if set).
             * @type {?string}
             */
            this.description = data.description || null;
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

        if ('is_suspended' in data) {
            /**
             * Whether the server is suspended from action.
             * @type {boolean}
             */
            this.suspended = data.is_suspended;
        }

        if ('state' in data) {
            /**
             * The current power state of the server.
             * @type {string}
             */
            this.state = data.state || 'unknown';
        }

        if ('is_installing' in data) {
            /**
             * Whether the server is currently being installed.
             * @type {boolean}
             */
            this.installing = data.is_installing;
        }
    }

    /**
     * Adds the server to the WebSocket connection list to be established.
     * @returns {void}
     */
    addWebSocket() {
        this.client.addSocketServer(this.identifier);
    }

    get schedules() {
        return this.client.schedules.cache.get(this.identifier);
    }

    /** @todo */
    async fetchResources() {}

    /**
     * Sends a command to the server terminal.
     * @param {string} command The command to send.
     * @returns {Promise<void>}
     */
    async sendCommand(command) {
        await this.client.requests.post(
            endpoints.servers.command(this.identifier), { command }
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
        if (!['start', 'stop', 'restart', 'kill'].includes(state))
            throw new Error('Invalid power state.');

        await this.client.requests.post(
            endpoints.servers.power(this.identifier), { signal: state }
        );
        this.state = state;
    }
}

module.exports = ClientServer;
