const { EventEmitter } = require('events');
const fetch = require('node-fetch');

class NodeStatus extends EventEmitter {
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'NodeStatus PteroJS v1.0.0'
    }
    limit = 0;

    /**
     * @param {StatusOptions} options
     */
    constructor(options) {
        /** @type {string} */
        this.name = options.name;
        /** @type {string} */
        this.address = options.address;
        /** @type {string} */
        this.auth = options.auth;
        this.headers['Authorization'] = 'Bearer '+ options.auth;
        /** @type {number} */
        this.interval = options.interval;
        /** @type {number} */
        this.retryLimit = options.retryLimit ?? 0;

        /** @type {?Function} */
        this.onStart = null;
        /** @type {?Function} */
        this.onInterval = null;
        /** @type {?Function} */
        this.onError = null;
        /** @type {?Function} */
        this.onClose = null;
    }

    #debug(message) { this.emit('debug', '[NS] '+ message) }

    async #fetch(url, data = null, method = 'GET') {
        data &&= JSON.stringify(data);
        this.#debug(`Fetching: ${url}`);
        const res = await fetch(url, {
            method,
            body: data,
            headers: this.headers
        });
        if (!res.ok) {
            if (this.limit > this.retryLimit) throw new Error('Maximum retry limit exceeded.');
            this.limit++;
            this.#debug('Attempting retry fetch...');
            this.#fetch(url, data, method);
            return;
        }
        if (res.status === 201) return;
        return await res.json();
    }

    async connect() {}

    async send(data) {}

    async close() {}
}

module.exports = NodeStatus;

/**
 * @typedef {object} StatusOptions
 * @property {string} name The name of the node.
 * @property {string} address The controller address.
 * @property {string} auth The API key authorization.
 * @property {number} interval The interval to wait between node checks (between 30-6000).
 * @property {number} retryLimit The amount of times to retry fetching the API.
 */
