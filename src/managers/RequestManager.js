const fetch = require('node-fetch');
const { EventEmitter } = require('events');
const { PteroAPIError, RequestError } = require('../structures/Errors');
const { version } = require('../../package.json');

/**
 * The requests manager for the application and client API. This is not for public use.
 * Using this manually may result in unwanted modifications of your Pterodactyl panel.
 */
class RequestManager extends EventEmitter {
    constructor(type, domain, auth) {
        super();
        this.type = type;
        this.domain = domain;
        this.auth = auth;

        Object.defineProperty(this, 'delete', {
            get: path => this.#delete(path)
        });
    }

    getHeaders() {
        return {
            'User-Agent': `${this.type} PteroJS v${version}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${this.auth}`
        }
    }

    #debug(message) {
        super.emit('debug', message);
    }

    /** Sends a request to the Pterodactyl API. Returns a json object or an error if
     * an unknown response code is received.
     * @param {string} path The path to request.
     * @param {?object} [params] Optional payload data (POST, PUT and PATCH).
     * @param {string} [method] The method or HTTP verb to use.
     * @returns {Promise<object|void>} The response object, if any.
     */
    async _make(path, params, method = 'GET') {
        const body = params?.raw ?? (params ? JSON.stringify(params) : null);
        this.#debug(`sending request: ${method} ${this.domain + path}`);
        const res = await fetch(this.domain + path, {
            method,
            body,
            headers: this.getHeaders()
        });
        this.#debug(`received status: ${res.status}`);

        if ([202, 204].includes(res.status)) return null;
        const data = await res.json().catch(()=>{});
        if (data) {
            super.emit('receive', data);
            if (res.ok) return data;
            if (res.status >= 400 && res.status < 500) throw new PteroAPIError(data);
        }

        throw new RequestError(
            'Pterodactyl API returned an invalid or unacceptable response '+
            `(status: ${res.status})`
        );
    }

    /**
     * Shorthand method for performing a GET request to the Pterodactyl API.
     * @param {string} path The path to request.
     * @returns {Promise<object|void>} The response object, if any.
     */
    async get(path) {
        return await this._make(path, null, 'GET');
    }

    /**
     * Shorthand method for performing a POST request to the Pterodactyl API.
     * @param {string} path The path to request.
     * @param {?object} [params] Payload data (not always required with these requests).
     * @returns {Promise<object|void>} The response object, if any.
     */
    async post(path, params) {
        return await this._make(path, params, 'POST');
    }

    /**
     * Shorthand method for performing a PATCH request to the Pterodactyl API.
     * @param {string} path The path to request.
     * @param {?object} [params] Payload data (not always required with these requests).
     * @returns {Promise<object|void>} The response object, if any.
     */
    async patch(path, params) {
        return await this._make(path, params, 'PATCH');
    }

    /**
     * Shorthand method for performing a PUT request to the Pterodactyl API.
     * @param {string} path The path to request.
     * @param {?object} [params] Payload data (not always required with these requests).
     * @returns {Promise<object|void>} The response object, if any.
     */
    async put(path, params) {
        return await this._make(path, params, 'PUT');
    }

    /**
     * **INDIRECT** - used for `RequestManager#delete`.
     * Shorthand method for performing a DELETE request to the Pterodactyl API.
     * @param {string} path The path to request.
     * @returns {Promise<object|void>}
     */
    async #delete(path) {
        return await this._make(path, null, 'DELETE');
    }

    /**
     * Sends a ping request to the Pterodactyl API.
     * Because the API has no "ping" endpoint, we use a forced error to receive a 404 response
     * then check that it is a valid 404 error by the API and not a timeout response.
     * @returns {Promise<boolean>}
     */
    async ping() {
        try {
            await this.get(`/api/${this.type}`);
        } catch (err) {
            if (err instanceof PteroAPIError) return true;
            throw new RequestError(
                `Pterodactyl API is unavailable\nResponse: ${err}`
            );
        }
    }
}

module.exports = RequestManager;
