const WebSocket = require('ws');
const { WebSocketError } = require('../../structures/Errors');
const endpoints = require('./Endpoints');

// const EVENTS = {
//     'auth success': 'serverConnect',
//     'console output': 'serverOutput',
//     'token expired': 'serverDisconnect',
//     'status': 'statusUpdate',
//     'stats': 'statsUpdate'
// }

class WebSocketManager {
    constructor(client) {
        this.client = client;

        /**
         * Server identifiers to establish connections with.
         * @type {string[]}
         */
        this.servers = [];

        /**
         * The status of the manager.
         * @type {string}
         */
        this.status = 'DISCONNECTED';

        /**
         * A map of active websockets.
         * @type {Map<string, WebSocket>}
         */
        this.sockets = new Map();

        /**
         * The timestamp of the last WebSocketManager ping.
         * @type {number}
         */
        this.lastPing = -1;
    }

    #debug(msg) {
        this.client.emit('debug', `[DEBUG] ${msg}`);
    }

    async connect() {
        if (!this.servers.length) return this.client.emit('ready');
        if (this.status === 'CLOSED') throw new WebSocketError('WebSocket was closed by the client.');
        this.#debug('Attempting server websocket connections...');
        this.status = 'CONNECTING';

        for (const id of this.servers) {
            const { data:{ token, socket }} = await this.client.requests.make(endpoints.servers.ws(id));
            const WS = new WebSocket(socket, { headers:{ 'Authorization': `Bearer ${token}` }});

            WS.onopen = (_) => {
                this.#debug(`WebSocket ${id}: Opened`);
                // WS.send({ events:'auth', args:[token] });
                this.client.emit('serverConnect', id);
            }

            WS.onmessage = (event) => {
                console.log('WS MESSAGE', event);
            }

            WS.onerror = (event) => {
                console.log(event);
                // this.#debug(`WebSocket ${id}: Error\nMessage: ${message}`);
            }

            WS.onclose = ({ reason, code }) => {
                this.#debug(`WebSocket ${id}: Closed\nCode: ${code} - ${reason || 'No Reason Sent.'}`);
                this.client.emit('serverDisconnect', id);
                this.sockets.delete(id);
            }

            this.sockets.set(id, WS);
            this.#debug(`WebSocket ${id}: Launched`);
        }

        this.lastPing = Date.now();
        this.#debug('All websockets launched.');
        this.status = 'READY';
        this.#handleTimeout();
        return this.client.emit('ready');
    }

    send(id, event, data) {
        if (this.status !== 'READY') return;
        return this.sockets.get(id).send({ event, args:[data ?? null] });
    }

    async #reconnect() {
        if (this.status === 'DESTROYED') return;
        if (this.client.options.reconnect === false) return this.#destroy();
        try {
            this.#debug('Attempting reconnect...');
            this.status = 'RECONNECTING';
            return await this.connect();
        } catch (err) {
            console.error(err);
            return this.#destroy();
        }
    }

    #handleTimeout() {
        const since = Date.now() - this.lastPing;
        if (since < 600000) {
            this.sockets.forEach(s => s.readyState === 1 && s.ping());
            this.lastPing = Date.now();
            setTimeout(() => this.#handleTimeout(), 300000);
            return;
        }
        setTimeout(() => this.reconnect(), since);
    }

    #destroy() {
        this.status = 'DESTROYED';
        this.sockets.forEach((socket, key) => {
            this.#debug(`Websocket ${key}: Destroyed`);
            socket.close(1000, 'Client destroyed.');
        });
        this.sockets.clear();
    }
}

module.exports = WebSocketManager;

/**
 * Represents a websocket response object.
 * @typedef {object} WebSocketResponse
 * @property {string} event The event received.
 * @property {?any[]} args Additional arguments received.
 */
