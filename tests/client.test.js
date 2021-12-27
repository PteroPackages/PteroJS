const { PteroClient } = require('@devnote-dev/pterojs');
const { assert } = require('.');
const { api_url, client_key } = require('./auth.json');

module.exports = async () => {
    const client = new PteroClient(api_url, client_key, { fetchClient: true });
    await client.connect();

    assert(client.user !== null);
    const servers = await client.servers.fetch();
    assert(servers.size);
    const server = servers.random();
    const users = await server.users.fetch();
    assert(users.size !== null);
    const schedules = await client.schedules.fetch(server.identifier);
    assert(schedules.size !== null);

    console.log(
        `Fetch Results:\n${servers.size} Server(s)\n${users.size} `+
        `User(s) in server ${server.identifier}\n${schedules.size} Schedule(s) `+
        `for server ${server.identifier}`
    );

    client.disconnect();
    delete servers, server, users, schedules;
}
