import * as assert from 'assert';
import { Flags, Permissions } from '../../src';

export async function test() {
    const perms = new Permissions(
        Flags.CONTROL_START,
        Flags.CONTROL_STOP,
        Flags.CONTROL_RESTART,
        Flags.WEBSOCKET_CONNECT
    );

    assert.strictEqual(perms.value.length, 4);
    assert.ok(perms.remove(Flags.WEBSOCKET_CONNECT));
    assert.throws(() => perms.add('maybe.perm'));

    assert.strictEqual(perms.hasAny(Flags.CONTROL_CONSOLE), false);
    assert.doesNotThrow(() => perms.add(Flags.CONTROL_CONSOLE));
    assert.strictEqual(perms.hasAll(...Permissions.CONTROL), true);
    assert.strictEqual(perms.isAdmin(), false);

    const wild = new Permissions('*');
    assert.strictEqual(wild.hasAll(...Permissions.CONTROL), true);
    assert.strictEqual(wild.hasAll(...Permissions.USERS), true);
    assert.strictEqual(wild.hasAll(...Permissions.FILES), true);
    assert.strictEqual(wild.hasAll(...Permissions.BACKUPS), true);
    assert.strictEqual(wild.hasAll(...Permissions.ALLOCATIONS), true);
    assert.strictEqual(wild.hasAll(...Permissions.STARTUPS), true);
    assert.strictEqual(wild.hasAll(...Permissions.DATABASES), true);
    assert.strictEqual(wild.hasAll(...Permissions.SCHEDULES), true);
    assert.strictEqual(wild.hasAll(...Permissions.SETTINGS), true);
    assert.strictEqual(wild.hasAll(...Permissions.ADMIN), true);

    assert.strictEqual(wild.isAdmin(), true);
}
