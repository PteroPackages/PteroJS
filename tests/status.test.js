const { NodeStatus } = require('@devnote-dev/pterojs');
const { assert } = require('.');
const { api_url, api_key } = require('./auth.json');

module.exports = async () => {
    const status = new NodeStatus({
        domain: api_url,
        auth: api_key,
        nodes:[1],
        callInterval: 30
    });

    status.on('connect', id => console.log(`Connected to node ${id}`));
    status.on('disconnect', id => console.log(`Disconnected from node ${id}`));
    status.on('interval', node => {
        assert(node !== null);
        assert(Object.keys(node).length);

        console.log(`
    Node Info
    ID:     ${node.id}
    Name:   ${node.name}
    Memory: ${node.memory}
    Disk:   ${node.disk}
        `);
        status.close();
    });

    await status.connect();
}
