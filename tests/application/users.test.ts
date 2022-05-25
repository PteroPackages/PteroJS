import * as assert from 'assert';
import type { PteroApp } from '../../src';

export async function test(ctrl: PteroApp) {
    assert.doesNotThrow(async () => await ctrl.users.fetch());

    assert.doesNotThrow(async () => await ctrl.users.create({
        firstname: 'test',
        lastname: 'user',
        username: 'test_user',
        email: 'test_user@example.com'
    }));

    const results = await ctrl.users.query('test_user', { filter: 'username' });
    assert.ok(results.size, 'failed to fetch user account from the panel');
    let user = results.find(u => u.username === 'test_user');
    assert.ok(user, 'failed to get user account from results');

    user = await ctrl.users.update(user.id, { username: 'user_test' });
    assert.strictEqual(user.username, 'user_test', 'failed to update user account');

    assert.doesNotThrow(async () => await ctrl.users.delete(user!.id));
}
