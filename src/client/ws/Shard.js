const EventEmitter = require('events');
const WebSocket = require('ws');
const handle = require('./packetHandler');
const endpoints = require('../endpoints');

class Shard extends EventEmitter {
    constructor(client, id) {
        super();

        this.client = client;
        this.id = id;
        this.token = null;
        this.socket = null;
        this.status = 'CLOSED';
        this.readyAt = 0;
        this.ping = -1;
        this.lastPing = 0;
    }

    /**
     * Emit `debug` client event with given message
     * @param {string} message Message text
     */
    #debug(message) {
        this.client.emit('debug', `[SHARD ${this.id}] ${message}`);
    }

    /**
     * Initialize connection and resolve after full authentication
     * @param {WebSocketAuth?} auth WebSocket URL to connect to
     * @returns {Promise<WebSocket>} WebSocket connection
     */
    connect(auth) {
        return new Promise(async (resolve, reject) => {
            if (!['CLOSED', 'RECONNECTING'].includes(this.status)) return;
            if (this.socket) this.socket = null;

            if (!auth)
                ({ data: auth } = await this.client.requests.get(endpoints.servers.ws(this.id)));

            this.socket = new WebSocket(auth.socket);
            this.status = 'CONNECTING';

            this.socket.on('open', () => this._onOpen());
            this.socket.on('message', data => this._onMessage(data.toString()));
            this.socket.on('error', error => this._onError(error));
            this.socket.on('close', () => this._onClose());

            this.token = auth.token;
            this.once('authSuccess', () => {
                this.emit('serverConnect', this.socket);
                resolve(this.socket);
            });
        })
    }

    /**
     * Close socket connection and start a new one
     * @returns {Promise<WebSocket>} WebSocket connection
     */
    async reconnect() {
        if (this.status === 'RECONNECTING') return;
        this.status = 'RECONNECTING';
        this.socket.close(4009, 'pterojs::reconnect');

        const { data } = await this.client.requests.get(endpoints.servers.ws(this.id));
        return this.connect(data.socket, data.token);
    }

    /**
     * Close socket connection
     */
    disconnect() {
        return new Promise(async (resolve, reject) => {
            if (!this.readyAt) return reject('Socket is not connected');

            this.once('serverDisconnect', resolve);
            this.socket.close(1000, 'pterojs::disconnect');

            this.readyAt = 0;
            this.lastPing = 0;
            this.ping = -1;
        });
    }

    /**
     * Get a new token from API and send it to active socket connection
     * @returns {Promise<void>}
     */
    async refreshToken() {
        return new Promise(async (resolve, reject) => {
            if (this.status !== 'CONNECTED') return reject('Socket is not connected');

            // using this transitional property to avoid double token issuing during init
            if (!this.token) {
                const { data } = await this.client.requests.get(endpoints.servers.ws(this.id));
                this.token = data.token;
            }

            this.send('auth', this.token);
            this.token = null;
            this.lastPing = Date.now();

            this.once('authSuccess', () => resolve(this.socket));
        });
    }

    /**
     * Send a message to socket server
     * @param {string} event Name of event
     * @param {any|any[]|undefined} args Event data
     */
    send(event, args) {
        if (!this.socket) throw new Error('Socket for this shard is unavailable.');
        if (!Array.isArray(args)) args = [args];
        this.socket.send(JSON.stringify({ event, args }));
    }

    _onOpen() {
        this.status = 'CONNECTED';
        this.readyAt = Date.now();
        this.refreshToken();

        this.#debug('Connection opened');
    }

    _onMessage(data) {
        if (!data) return this.#debug('Received a malformed packet');
        data = JSON.parse(data);

        this.emit('rawPayload', data);

        switch (data.event) {
            case 'auth success':
                this.ping = Date.now() - this.lastPing;
                this.#debug('Auth token refreshed');
                this.emit('authSuccess');

                break;

            case 'token expiring':
                this.refreshToken();
                return;

            case 'token expired':
                this.reconnect();
                break;
        }

        handle(this, data, this.id);
    }

    _onError(error) {
        if (!error) return;
        this.#debug(`Error received: ${error}`);
    }

    _onClose() {
        this.status = 'CLOSED';
        this.emit('serverDisconnect');
        this.#debug('Connection closed');
    }
}

/**
 * @typedef {object} WebSocketAuth
 * @property {string} token
 * @property {string} socket
 */

module.exports = Shard;
