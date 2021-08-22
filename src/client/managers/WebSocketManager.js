const endpoints = require('./Endpoints');

class WebSocketManager {
    constructor(client) {
        this.client = client;

        /**
         * Server identifiers to establish connections with.
         * @type {Array<string>}
         */
        this.servers = new Array(5);

        /**
         * The status of the manager.
         * @type {string}
         */
        this.status = 'DISCONNECTED';
    }

    /** @private */
    debug(msg) {
        this.client.emit('debug', msg);
    }

    /** @private */
    async send(data) {}

    async connect() {}

    /** @private */
    async reconnect() {}

    /** @private */
    async destroy() {}
}

module.exports = WebSocketManager;

/**
 * Represents a websocket response object.
 * @typedef {object} WebSocketResponse
 * @property {string} event The event received.
 * @property {?Array<*>} args Additional arguments received.
 */
