const fetch = require('node-fetch');
const { RequestError } = require('../../structures/Errors');
const { version } = require('../../../package.json');

class ApplicationRequestManager {
    constructor(client) {
        this.client = client
        this.headers['Authorization'] = `Bearer ${client.auth}`;
    }

    suspended = false;
    headers = {
        'User-Agent': `Application PteroJS v${version}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }

    /** Sends a request to the Pterodactyl API. Returns a json object or `null` if
     * an unknown response code is received.
     * @param {string} path The path to request.
     * @param {object} [params] Optional payload data (POST, PUT and PATCH).
     * @param {string} [method] The method or HTTP verb to use.
     * @returns {Promise<object|null|void>}
     */
    async make(path, params, method = 'GET') {
        if (this.suspended) throw new RequestError('Application is ratelimited.');
        const body = params?.raw ?? (params ? JSON.stringify(params) : null);
        const data = await fetch(this.client.domain + path, {
            method,
            body,
            headers: this.headers
        });

        if ([401, 403, 429].includes(data.status)) {
            if (data.status === 401) throw new RequestError('401: Unauthorized API request.');
            if (data.status === 403) throw new RequestError('403: API Path forbidden.');

            this.suspended = true;
            setTimeout(() => this.suspended = false, 600000);
            throw new RequestError('429: Application is ratelimited, restarting in 10 minutes.');
        }

        if ([201, 204].includes(data.status)) return;
        if (data.ok) return await data.json();
        return null;
    }
}

module.exports = ApplicationRequestManager;
