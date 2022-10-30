const axios = require('axios');
const nock = require('nock');
const { Dict, PteroAPIError, PteroApp, User } = require('../..');

axios.defaults.adapter = require('axios/lib/adapters/http');

const scope = nock('https://pterodactyl.test');
const app = new PteroApp(
    'https://pterodactyl.test',
    'ptlc_QRkkwxgiqmkybXs3wBpYvfvPsLEYvPEk3ZyJb30PV93',
);

scope.get('/api/application/users').reply(200, {
    object: 'list',
    data: [
        {
            object: 'user',
            attributes: {
                id: 1,
                username: 'jest',
                email: 'jest@example.com',
                first_name: 'jest',
                last_name: 'jest',
                language: 'en',
                external_id: null,
                updated_at: '2022-02-15T02:15:29+00:00',
                root_admin: true,
                '2fa': false,
                created_at: '2022-01-03T08:08:31+00:00',
            },
        },
        {
            object: 'user',
            attributes: {
                id: 2,
                username: 'example',
                email: 'example@example.com',
                first_name: 'example',
                last_name: 'example',
                language: 'en',
                external_id: null,
                updated_at: '2022-02-15T02:15:29+00:00',
                root_admin: false,
                '2fa': true,
                created_at: '2022-01-03T08:08:31+00:00',
            },
        },
    ],
});

scope.get('/api/application/users/1').reply(200, {
    object: 'user',
    attributes: {
        object: 'user',
        attributes: {
            id: 1,
            username: 'jest',
            email: 'jest@example.com',
            first_name: 'jest',
            last_name: 'jest',
            language: 'en',
            external_id: null,
            updated_at: '2022-02-15T02:15:29+00:00',
            root_admin: true,
            '2fa': false,
            created_at: '2022-01-03T08:08:31+00:00',
        },
    },
});

scope.post('/api/application/users').reply(400, {
    errors: [
        {
            code: 'ValidationException',
            detail: 'The email field is required.',
            meta: {
                rule: 'required',
                source_field: 'email',
            },
            status: '422',
        },
        {
            code: 'ValidationException',
            detail: 'The username field is required.',
            meta: {
                rule: 'required',
                source_field: 'username',
            },
            status: '422',
        },
        {
            code: 'ValidationException',
            detail: 'The first name field is required.',
            meta: {
                rule: 'required',
                source_field: 'first_name',
            },
            status: '422',
        },
        {
            code: 'ValidationException',
            detail: 'The last name field is required.',
            meta: {
                rule: 'required',
                source_field: 'last_name',
            },
            status: '422',
        },
    ],
});

scope
    .post('/api/application/users', {
        username: 'jester',
        email: 'jester@example.com',
        first_name: 'jester',
        last_name: 'jester',
    })
    .reply(200, {
        object: 'user',
        attributes: {
            id: 1,
            username: 'jest',
            email: 'jest@example.com',
            first_name: 'jest',
            last_name: 'jest',
            language: 'en',
            external_id: null,
            updated_at: '2022-02-15T02:15:29+00:00',
            root_admin: true,
            '2fa': false,
            created_at: '2022-01-03T08:08:31+00:00',
        },
    });

scope
    .patch('/api/application/users/1', {
        username: 'jest',
        email: 'jest@example.com',
        first_name: 'jest',
        last_name: 'jest',
        external_id: 'jest',
        root_admin: true,
    })
    .reply(200, {
        object: 'user',
        attributes: {
            object: 'user',
            attributes: {
                id: 1,
                username: 'jest',
                email: 'jest@example.com',
                first_name: 'jest',
                last_name: 'jest',
                language: 'en',
                external_id: 'jest',
                updated_at: '2022-02-15T02:15:29+00:00',
                root_admin: true,
                '2fa': false,
                created_at: '2022-01-03T08:08:31+00:00',
            },
        },
    });

scope.delete('/api/application/users/1').reply(204);

describe('Application: Users', () => {
    it('fetches all users', async () => {
        let users = await app.users.fetch();

        expect(users).toBeInstanceOf(Dict);
        expect(users.size).toEqual(2);
        users.forEach(u => expect(u).toBeInstanceOf(User));
    });

    it('fetches a user', async () => {
        let user = await app.users.fetch(1);

        expect(user).toBeInstanceOf(User);
        expect(user.id).toEqual(1);
        expect(user.username).toEqual('jest');
        expect(user.email).toEqual('jest@example.com');
        expect(user.firstname).toEqual('jest');
        expect(user.lastname).toEqual('jest');
        expect(user.language).toEqual('en');
        expect(user.externalId).toBeUndefined();
        expect(user.isAdmin).toBe(true);
        expect(user.twoFactor).toBe(false);
        expect(user.createdAt).toBeInstanceOf(Date);
        expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('creates a user', () => {
        expect(app.users.create({})).rejects.toThrowError(PteroAPIError);
        expect(
            app.users.create({
                username: 'jester',
                email: 'jester@example.com',
                firstname: 'jester',
                lastname: 'jester',
            }),
        ).resolves.toBeInstanceOf(User);
    });

    it('updates a user', () => {
        expect(app.users.update(1, {})).rejects.toThrow(
            'Too few options to update user.',
        );
        expect(
            app.users.update(1, { externalId: 'jest' }),
        ).resolves.toBeInstanceOf(User);
    });

    it('deletes a user', () => {
        expect(app.users.delete(1)).resolves.toBeUndefined();
    });
});
