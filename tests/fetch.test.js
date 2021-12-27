const { PteroApp } = require('@devnote-dev/pterojs');
const { assert } = require('.');
const { api_url, api_key } = require('./auth.json');

module.exports = async () => {
    const client = new PteroApp(api_url, api_key);
    await client.connect();

    const users = await client.users.fetch();
    assert(users.size);
    const nodes = await client.nodes.fetch();
    assert(nodes.size);
    const nests = await client.nests.fetch();
    assert(nests.size);
    const servers = await client.servers.fetch();
    assert(servers.size);
    const locations = await client.locations.fetch();
    assert(locations.size);

    console.log(
        `Fetch Results:\n${users.size} Users\n${nodes.size} `+
        `Node(s)\n${nests.size} Nest(s)\n${servers.size} server(s)`+
        `\n${locations.size} location(s).`
    );

    client.disconnect();
    delete users, nodes, nests, servers, locations;
}
