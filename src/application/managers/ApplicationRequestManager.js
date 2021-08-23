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

    /**
     * @param {string} url
     * @param {object} [params]
     * @param {string} [method]
     * @returns {Promise<object|boolean>}
     */
    async make(url, params, method = 'GET') {
        if (this.suspended) throw new RequestError('Application is ratelimited.');
        const body = params?.raw ?? (params ? JSON.stringify(params) : null);
        const data = await fetch(this.client.domain + url, {
            method,
            body,
            headers: this.headers
        });

        if ([401, 403, 429].includes(data.status)) {
            if (data.status === 401) throw new RequestError();
            if (data.status === 403) throw new RequestError('403: Path forbidden.');

            this.suspended = true;
            setTimeout(() => this.suspended = false, 600000);
            throw new RequestError('Application is ratelimited, restarting in 10 minutes.');
        }

        if ([201, 204].includes(data.status)) return true;
        if (data.ok) return await data.json();
        return null;
    }
}

module.exports = ApplicationRequestManager;
