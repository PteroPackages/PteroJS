const assert = require('assert');
const { NodeStatus } = require('../src');
const { api_url, app_key } = require('./auth.json');

const status = new NodeStatus({
    domain: api_url,
    auth: app_key,
    nodes:[1],
    callInterval: 30_000
});

status.on('connect', id => console.log(`connected to node ${id}`));
status.on('disconnect', id => console.log(`disconnected from node ${id}`));
status.on('interval', node => {
    assert.ok(node, 'invalid node payload received');
    assert.ok(Object.entries(node).length, 'empty node payload received');

    console.log(`
Node Info
ID:     ${node.id}
Name:   ${node.name}
Memory: ${node.memory}
Disk:   ${node.disk}
    `);
    status.close();
});

assert.doesNotThrow(
    (async () => await status.connect()),
    'could not connect node status to api'
);
