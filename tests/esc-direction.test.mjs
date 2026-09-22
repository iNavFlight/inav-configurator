import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEscDirection, canSetEscDirection, escDirectionPayload } from '../js/escDirection.js';
const data = bytes => new DataView(Uint8Array.from(bytes).buffer);
const status = parseEscDirection(data([1, 4, 0, 0, 0, 0]));
const ready = { status, acknowledged: true, armed: false, testing: false, busy: false, fresh: true, motor: 2 };
test('capability requires exact known response and valid operation fields', () => {
    assert.equal(parseEscDirection(null), null);
    for (const bytes of [[], [1], [2,4,0,0,0,0], [1,4,7,0,0,0], [1,4,2,4,0,1], [1,4,2,0,2,1], [1,4,2,0,0,0]]) {
        assert.equal(parseEscDirection(data(bytes)), null);
    }
    assert.equal(status.count, 4);
});
test('each safety gate independently blocks direction writes', () => {
    assert.equal(canSetEscDirection(ready), true);
    for (const override of [{ status: null }, { acknowledged: false }, { armed: true }, { testing: true },
        { busy: true }, { fresh: false }, { motor: -1 }, { motor: 4 }, { motor: 1.5 }, { status: { ...status, phase: 2 } }]) {
        assert.equal(canSetEscDirection({ ...ready, ...override }), false, JSON.stringify(override));
    }
});
test('motor is zero based, direction explicit, retry token advances and wraps', () => {
    assert.deepEqual(escDirectionPayload(status, 2, 1), [2,1,1]);
    assert.deepEqual(escDirectionPayload({ ...status, token: 255 }, 0, 0), [0,0,1]);
    assert.throws(() => escDirectionPayload(status, 4, 0));
    assert.throws(() => escDirectionPayload(status, 0, 2));
});

test('SITL is explicitly distinguished from real ESC output', () => {
    assert.equal(parseEscDirection(data([1,4,0,0,0,0])).simulated, false);
    assert.equal(parseEscDirection(data([1,4,0,0,0,0,0])).simulated, false);
    assert.equal(parseEscDirection(data([1,4,0,0,0,0,1])).simulated, true);
    assert.equal(parseEscDirection(data([1,4,0,0,0,0,2])), null);
});


test('bounded pulse capability validates running motor, token and state', () => {
    const active = parseEscDirection(data([2,4,6,0,1,1,1,2,1,3]));
    assert.equal(active.supportsTest, true);
    assert.equal(active.testActive, true);
    assert.equal(active.testMotor, 2);
    assert.equal(canSetEscDirection({...ready, status: active}), false);
    for (const bytes of [[2,4,0,0,0,0,1,4,1,1], [2,4,0,0,0,0,1,0,2,1],
        [2,4,0,0,0,0,1,0,1,0], [2,4,2,0,1,1,1,0,1,1]]) {
        assert.equal(parseEscDirection(data(bytes)), null);
    }
    assert.equal(status.supportsTest, false);
});
