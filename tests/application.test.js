const assert = require('assert');
const { PteroApp } = require('../src');
const { api_url, api_key } = require('./auth.json');

const app = new PteroApp(api_url, api_key);

assert.doesNotThrow(
    (async () => await app.connect()),
    'could not connect to api'
);
assert.ok(app.ping, 'ping not calculated');

assert.doesNotThrow(
    (async () => await app.servers.fetch()),
    'could not fetch servers endpoint'
);
assert.doesNotThrow(
    (async () => await app.users.fetch()),
    'could not fetch users endpoint'
);
assert.doesNotThrow(
    (async () => await app.nodes.fetch()),
    'could not fetch nodes endpoint'
);
assert.doesNotThrow(
    (async () => await app.locations.fetch()),
    'could not fetch locations endpoint'
);
assert.doesNotThrow(
    (async () => await app.nests.fetch()),
    'could not fetch nests'
);
