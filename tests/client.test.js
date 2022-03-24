const assert = require('assert');
const { PteroClient } = require('../src');
const { api_url, api_key } = require('./auth.json');

const app = new PteroClient(api_url, api_key);

assert.doesNotThrow(
    (async () => await app.connect()),
    'could not connect to api'
);

assert.doesNotThrow(
    (async () => await app.fetchClient()),
    'could not fetch users endpoint'
);

assert.ok(app.user, 'user not fetched');

assert.doesNotThrow(
    (async () => await app.servers.fetch()),
    'could not fetch servers endpoint'
);

app.disconnect();
