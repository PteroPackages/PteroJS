import { Dict, PteroAPIError, PteroApp, User } from '../../src';
import auth from '../auth';

const app = new PteroApp(auth.url, auth.key);
let id: number;

describe('Application: Users', () => {
    it('fetches all users', async () => {
        let users = await app.users.fetch();

        expect(users).toBeInstanceOf(Dict);
        expect(users.size).toBeGreaterThan(0);
        for (let [, u] of users) expect(u).toBeInstanceOf(User);

        users = await app.users.fetch({ perPage: 3 });
        expect(users.size).toEqual(3);
    });

    it('creates a user', async () => {
        // @ts-expect-error
        expect(app.users.create({})).rejects.toThrowError(PteroAPIError);

        const user = await app.users.create({
            username: 'jester',
            email: 'jest@example.com',
            firstname: 'jest',
            lastname: 'jest',
            externalId: 'jester'
        });

        expect(user).toBeInstanceOf(User);
        expect(user.username).toEqual('jester');
        expect(user.email).toEqual('jest@example.com');
        expect(user.firstname).toEqual('jest');
        expect(user.lastname).toEqual('jest');
        expect(user.externalId).toEqual('jester');
        expect(user.isAdmin).toBe(false);

        id = user.id;
    });

    it('fetches a user', async () => {
        expect(app.users.fetch(0)).rejects.toThrowError(PteroAPIError);
        expect(app.users.fetch(id)).resolves.toBeInstanceOf(User);
        expect(app.users.fetch('jester')).resolves.toBeInstanceOf(User);
        expect(app.users.query('jest', { filter: 'name' })).resolves.toBeInstanceOf(Dict);

        let user = await app.users.fetch(id);

        expect(user).toBeInstanceOf(User);
        expect(user.servers).toBeUndefined();

        // TODO: not implemented in library yet
        // user = await app.users.fetch(id, { force: true, include: ['servers'] });

        // expect(user).toBeInstanceOf(User);
        // expect(user.servers).toBeInstanceOf(Dict);
        // expect(user.servers!.size).toEqual(0);
    });

    // TODO: currently broken
    //
    // it('updates a user', async () => {
    //     let user = await app.users.fetch('jester');

    //     expect(app.users.update(user.id, {
    //         // externalId: null,
    //         isAdmin: true
    //     })).resolves.toBeInstanceOf(User);

    //     user = await app.users.fetch(id, { force: true });

    //     // expect(user.externalId).toBeUndefined();
    //     expect(user.isAdmin).toBe(true);
    // });

    it('deletes a user', () => {
        expect(app.users.delete(id)).resolves.toBeUndefined();
    });
});
