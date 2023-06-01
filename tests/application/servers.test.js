const axios = require('axios');
const nock = require('nock');
require('dotenv').config();

const {
    Dict,
    PteroAPIError,
    PteroApp,
    User,
    ValidationError,
} = require('../../dist');

axios.defaults.adapter = require('axios/lib/adapters/http');

const app = new PteroApp(process.env.APP_URL, process.env.APP_KEY);

describe('Application: Servers', () => {
    // The main objective of this test is to ensure that toJSON works as expected.
    it('fetches all servers', async () => {
        let servers = await app.servers.fetchAll();

        expect(servers).toBeInstanceOf(Dict);

        let server = await app.servers.fetch(servers.first().id);

        const json = server.toJSON();

        expect(json).toHaveProperty('id');
    });
});
