const fetch = require('node-fetch');
const { RequestError } = require('.');
const { version } = require('../../../package.json');

class RequestManager {
    constructor(client) {
        this.client = client
        this.headers['Authorization'] = `Bearer ${client.auth}`;
    }

    reset = 0;
    headers = {
        'User-Agent': `Client PteroJS v${version}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }

    async make(url, params = {}, method = 'GET') {
        if (this.reset > Date.now()) throw new RequestError('Client is ratelimited.');
        const data = await fetch(this.client.domain + url, {
            method,
            body: JSON.stringify(params),
            headers: this.headers
        });

        if ([401, 403, 429].includes(data.status)) {
            if (data.status === 401) throw new RequestError();
            if (data.status === 403) throw new RequestError('403: Path forbidden.');
            
            this.suspended = true;
            this.timeout = setTimeout(() => this.suspended = false, 600000);
            throw new RequestError('Ratelimited, resolving in 10 minutes.');
        }

        if (data.ok) return await data.json();
        return null;
    }
}

module.exports = RequestManager;
