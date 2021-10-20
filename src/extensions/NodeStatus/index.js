const { EventEmitter } = require('events');
const fetch = require('node-fetch');

class NodeStatus extends EventEmitter {
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'NodeStatus PteroJS v1.0.0'
    }
    #interval = null;
    #connected = new Set();

    /**
     * @param {StatusOptions} options
     */
    constructor(options) {
        super();

        Object.assign(this, options);
        this.headers['Authorization'] = 'Bearer '+ options.auth;
        this.nextInterval ||= 5;
        this.retryLimit ||= 0;

        /** @type {?Function} */
        this.onConnect = null;
        /** @type {?Function} */
        this.onInterval = null;
        /** @type {?Function} */
        this.onDisconnect = null;

        this.ping = -1;
        this.current = 0;
        this.readyAt = 0;

        if (this.nodes.some(i => typeof i !== 'number'))
            throw new TypeError('[NS] Node IDs must be numbers only.');

        if (this.callInterval < 30 || this.callInterval > 43200)
            throw new RangeError('[NS] Call interval must be between 30 seconds and 12 hours.');

        if (this.nextInterval >= this.callInterval)
            throw new RangeError('[NS] Next interval must be lessa than the call interval.');
    }

    #debug(message) { this.emit('debug', '[NS] '+ message) }

    async connect() {
        this.#debug('Starting connection to API');
        await this.#ping();
        await this.#handleNext();
        this.#interval = setInterval(() => this.#handleNext(), this.callInterval * 1000);
        this.readyAt = Date.now();
        process.on('SIGINT', _ => this.close());
        process.on('SIGTERM', _ => this.close());
    }

    async #ping() {
        const start = Date.now();
        const res = await fetch(`${this.domain}/api/application`, {
            method: 'GET', headers: this.headers
        });
        if (res.status === 401)
            return this.close('[NS:401] Invalid API credentials. Contact your panel administrator.', true);
        if (res.status === 403) return this.close('[NS:403] Missing access.', true);
        this.ping = Date.now() - start;
        const data = await res.json().catch(()=>{});
        if (data?.errors?.length) return;
        return this.close('[NS:404] Application API is unavailable.', true);
    }

    async #handleNext() {
        for (let i=0; i<this.nodes.length; i++) {
            await this.#request(this.nodes[i]);
            if (this.nodes[i+1]) await new Promise(res => setTimeout(res, this.nextInterval * 1000));
        }
    }

    async #request(id) {
        this.#debug(`Fetching: /api/application/nodes/${id}`);
        const res = await fetch(
            `${this.domain}/api/application/nodes/${id}`, {
            method: 'GET', headers: this.headers
        });

        if (!res.ok) {
            if (res.status === 401)
                return this.close('[NS:401] Invalid API credentials. Contact your panel administrator.', true);
            if (res.status === 403) return this.close('[NS:403] Missing access.', true);
            if (res.status === 404) {
                if (this.#connected.has(id)) {
                    this.emit('disconnect', id);
                    if (this.onDisconnect) this.onDisconnect(id);
                    this.#connected.delete(id);
                }
                return;
            }
            if (this.current > this.retryLimit) return this.close('[NS] Maximum retry limit exceeded.');
            this.current++;
            this.#debug('Attempting retry fetch');
            this.#request(id);
            return;
        }

        const { attributes } = await res.json();
        if (!this.#connected.has(id)) {
            this.#connected.add(id);
            this.emit('connect', id);
            if (this.onConnect !== null) this.onConnect(id);
        }
        this.emit('interval', attributes);
        if (this.onInterval !== null) this.onInterval(attributes);
    }

    close(message = null, error = false) {
        this.#debug('Closing connection');
        if (this.#interval) clearInterval(this.#interval);
        this.#connected.clear();
        if (error && message) throw new Error(message);
    }
}

module.exports = NodeStatus;

/**
 * @typedef {object} StatusOptions
 * @property {string} domain The domain for the API.
 * @property {string} auth The API key authorization.
 * @property {number[]} nodes An array of node IDs to listen for.
 * @property {number} callInterval The interval to wait between API calls (between 30-6000 seconds).
 * @property {?number} nextInterval The interval to wait between processing checks. Must be less than the callInterval.
 * @property {?number} retryLimit The amount of times to retry fetching the API.
 */
