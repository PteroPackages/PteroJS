import { ApplicationServer, Dict, PteroAPIError, PteroApp } from '../../src';
import auth from '../auth';

const app = new PteroApp(auth.url, auth.key);
// let id: number;

describe('Application: Servers', () => {
    it('fetches all servers', async () => {
        let servers = await app.servers.fetch();

        expect(servers).toBeInstanceOf(Dict);
        expect(servers.size).toBeGreaterThan(0);
        for (let [_, s] of servers) expect(s).toBeInstanceOf(ApplicationServer);

        servers = await app.servers.fetch({ perPage: 3 });
        expect(servers.size).toEqual(3);
    });

    // TODO:
    // has some issues with the function, will come back to this when fixed
    //
    // it('creates a server', async () => {});

    it('fetches a server', async () => {
        expect(app.servers.fetch(0)).rejects.toThrowError(PteroAPIError);
        expect(app.servers.fetch(4 /** to be replaced with id var */)).resolves.toBeInstanceOf(ApplicationServer);
        // TODO: related to create test
        // expect(app.servers.fetch('jester')).resolves.toBeInstanceOf(ApplicationServer);
        expect(app.servers.query('jester', { filter: 'name' })).resolves.toBeInstanceOf(Dict);
    });

    // TODO: related to create test
    // it('updates a server\'s build', async () => {});
    // it('updates a server\'s details', async () => {});
    // it('updates a server\'s startup', async () => {});
    // it('deletes a server', async () => {});
});
