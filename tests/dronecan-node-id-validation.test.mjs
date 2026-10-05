#!/usr/bin/env node
/**
 * Tests for isValidDronecanNodeId() (PR #2671 Qodo review Finding 3).
 *
 * dronecanTab.saveConfig() previously parsed the node ID field with no
 * bounds/NaN check, so an invalid value could reach setSetting()/
 * saveToEeprom()/reboot with only partial config applied.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidDronecanNodeId } from '../js/dronecanNodeIdValidation.js';

test('accepts the valid UAVCAN node ID range (1-127)', () => {
    assert.equal(isValidDronecanNodeId(1), true);
    assert.equal(isValidDronecanNodeId(64), true);
    assert.equal(isValidDronecanNodeId(127), true);
});

test('rejects out-of-range values', () => {
    assert.equal(isValidDronecanNodeId(0), false);
    assert.equal(isValidDronecanNodeId(-1), false);
    assert.equal(isValidDronecanNodeId(128), false);
    assert.equal(isValidDronecanNodeId(999), false);
});

test('rejects non-integers and NaN (e.g. an empty/cleared input field)', () => {
    assert.equal(isValidDronecanNodeId(Number.NaN), false); // Number.parseInt('') or ('abc')
    assert.equal(isValidDronecanNodeId(1.5), false);
    assert.equal(isValidDronecanNodeId(Infinity), false);
});
