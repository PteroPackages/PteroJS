import * as assert from 'assert';
import type { PteroClient } from '../../src';

export async function test(ctrl: PteroClient) {
    assert.doesNotThrow(async () => await ctrl.account.fetch());
    assert.ok(ctrl.account.id, 'failed to fetch client account');
}
