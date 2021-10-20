const { EventEmitter } = require('events');
const fetch = require('node-fetch');
const endpoints = require('../../application/managers/endpoints');

class NodeStatus extends EventEmitter {
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'NodeStatus PteroJS v1.0.0'
    }
    #interval = null;

    /**
     * @param {StatusOptions} options
     */
    constructor(options) {
        super()

        /** @type {string} */
        this.name = options.name;
        /** @type {string} */
        this.domain = options.domain;
        this.headers['Authorization'] = 'Bearer '+ options.auth;
        /** @type {number} */
        this.interval = options.interval;
        /** @type {number} */
        this.retryLimit = options.retryLimit ?? 0;

        /** @type {?Function} */
        this.onConnect = null;
        /** @type {?Function} */
        this.onInterval = null;
        /** @type {?Function} */
        this.onError = null;
        /** @type {?Function} */
        this.onDisconnect = null;

        this.current = 0;
        this.readyAt = 0;

        if (this.interval < 30 || this.interval > 43200)
            throw new RangeError('[NS] Interval must be between 30 seconds and 12 hours.');
    }

    #debug(message) { this.emit('debug', '[NS] '+ message) }

    async #fetch(path, data = null, method = 'GET') {
        data &&= JSON.stringify(data);
        this.#debug(`Fetching: ${method} ${path}`);
        const res = await fetch(this.domain + path, {
            method,
            body: data,
            headers: this.headers
        });
        if (!res.ok) {
            if (res.status === 401) return this.close('[NS:401] Invalid API credentials. Contact your panel administrator.', true);
            if (res.status === 403) return this.close('[NS:403] Missing access.', true);
            if (res.status === 404) return this.close('[NS:404] API not found.', true);
            if (this.current > this.retryLimit) return this.close('[NS] Maximum retry limit exceeded.');
            this.current++;
            this.#debug('Attempting retry fetch');
            this.#fetch(path, data, method);
            return;
        }
        if (res.status === 201) return;
        return await res.json();
    }

    async connect() {
        this.#debug('Starting connection to API');
        await this.#request();
        this.#interval = setInterval(() => this.#request(), this.interval * 1000);
        this.readyAt = Date.now();
        process.on('SIGINT', _ => this.close());
        process.on('SIGTERM', _ => this.close());
        this.emit('connect');
        if (this.onConnect !== null) this.onConnect();
    }

    async #request() {
        const { data } = await this.#fetch(endpoints.nodes.main +`?filter[name]=${encodeURIComponent(this.name)}`);
        this.emit('interval', data[0].attributes);
        if (this.onInterval !== null) this.onInterval(data[0].attributes);
    }

    close(message = null, error = false) {
        this.#debug('Closing connection');
        if (this.#interval) clearInterval(this.#interval);
        this.emit('disconnect', message);
        if (this.onDisconnect) this.onDisconnect(message);
        if (error && message) throw new Error(message);
    }
}

module.exports = NodeStatus;

/**
 * @typedef {object} StatusOptions
 * @property {string} name The name of the node.
 * @property {string} domain The domain for the API.
 * @property {string} auth The API key authorization.
 * @property {number} interval The interval to wait between node checks (between 30-6000).
 * @property {?number} retryLimit The amount of times to retry fetching the API.
 */
