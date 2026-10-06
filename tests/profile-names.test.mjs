#!/usr/bin/env node
/**
 * Tests for parseProfileNames() / profileOptionLabel() (js/profileNames.js),
 * the decoder for MSP2_INAV_PROFILE_NAMES used to label the header profile
 * dropdowns.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseProfileNames, profileOptionLabel } from '../js/profileNames.js';

function buildPayload(maxLength, lists) {
    const bytes = [maxLength];
    for (const list of lists) {
        bytes.push(list.length);
        for (const name of list) {
            bytes.push(name.length);
            for (const ch of name) {
                bytes.push(ch.charCodeAt(0));
            }
        }
    }
    return new DataView(Uint8Array.from(bytes).buffer);
}

test('decodes three name lists with empty slots', () => {
    const view = buildPayload(12, [['Cruise', '', 'Sport'], ['4S', '6S HV', ''], ['Quad', 'Plane']]);

    assert.deepEqual(parseProfileNames(view), {
        maxLength: 12,
        control: ['Cruise', '', 'Sport'],
        battery: ['4S', '6S HV', ''],
        mixer: ['Quad', 'Plane'],
    });
});

test('handles a single mixer profile and all-empty names', () => {
    const view = buildPayload(12, [['', '', ''], ['', '', ''], ['']]);
    const names = parseProfileNames(view);

    assert.equal(names.mixer.length, 1);
    assert.deepEqual(names.control, ['', '', '']);
});

test('rejects truncated, trailing and empty payloads', () => {
    const good = buildPayload(12, [['A'], ['B'], ['C']]);

    assert.equal(parseProfileNames(new DataView(good.buffer.slice(0, good.byteLength - 1))), null);

    const trailing = new Uint8Array(good.byteLength + 1);
    trailing.set(new Uint8Array(good.buffer));
    assert.equal(parseProfileNames(new DataView(trailing.buffer)), null);

    assert.equal(parseProfileNames(new DataView(new ArrayBuffer(0))), null);
    assert.equal(parseProfileNames(null), null);
});

test('option label appends the name only when there is one', () => {
    assert.equal(profileOptionLabel('Control Profile 1', 'Cruise'), 'Control Profile 1: Cruise');
    assert.equal(profileOptionLabel('Control Profile 2', ''), 'Control Profile 2');
    assert.equal(profileOptionLabel('Control Profile 3', undefined), 'Control Profile 3');
});
