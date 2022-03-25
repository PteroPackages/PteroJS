const WebSocket = require('ws');
const handle = require('./packetHandler');
const endpoints = require('../endpoints');

class Shard {
    constructor(client, id, auth) {
        this.client = client;
        this.id = id;
        this.token = auth.token;
        this.socket = null;
        this.status = 'CLOSED';
        this.readyAt = 0;
        this.ping = -1;
        this.lastPing = 0;

        this.connect(auth);
    }

    #debug(message) {
        this.client.emit('debug', `[SHARD ${this.id}] ${message}`);
    }

    connect({ socket }) {
        if (!['CLOSED', 'RECONNECTING'].includes(this.status)) return;
        if (this.socket) this.socket = null;
        this.socket = new WebSocket(socket);
        this.status = 'CONNECTING';

        this.socket.on('open', () => this._onOpen());
        this.socket.on('message', data => this._onMessage(data.toString()));
        this.socket.on('error', error => this._onError(error));
        this.socket.on('close', () => this._onClose());
    }

    async reconnect() {
        if (this.status === 'RECONNECTING') return;
        this.status = 'RECONNECTING';
        const { data } = await this.client.requests.get(endpoints.servers.ws(this.id));
        this.socket.close(4009, 'pterojs::reconnect');
        this.token = data.token;
        this.connect(data);
    }

    disconnect() {
        if (!this.readyAt) return;
        this.socket.close(1000, 'pterojs::disconnect');

        this.readyAt = 0;
        this.lastPing = 0;
        this.ping = -1;
        this.token = null;
    }

    send(event, args) {
        if (!this.socket) throw new Error('Socket for this shard is unavailable.');
        if (!Array.isArray(args)) args = [args];
        this.socket.send(JSON.stringify({ event, args }));
    }

    _onOpen() {
        this.send('auth', this.token);
        this.status = 'CONNECTED';
        this.lastPing = Date.now();

        this.#debug('Socket connected');
    }

    _onMessage(data) {
        if (!data) return this.#debug('Received a malformed packet');
        data = JSON.parse(data);

        this.client.emit('rawPayload', data);

        switch (data.event) {
            case 'auth success':
                this.ping = Date.now() - this.lastPing;
                break;

            case 'token expiring':
                // irrelevant
                return;

            case 'token expired':
                this.reconnect();
                break;
        }

        handle(this.client, data, this.id);
    }

    _onError({ error }) {
        if (!error) return;
        this.#debug(`Error received: ${error}`);
    }

    _onClose() {
        this.status = 'CLOSED';
        this.#debug('Connection closed');
    }
}

module.exports = Shard;
