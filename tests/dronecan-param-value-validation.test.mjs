#!/usr/bin/env node
/**
 * Tests for isValidIntParamValue()/isValidFloatParamValue() (PR #2671 Qodo
 * review Finding 4).
 *
 * validateNumericParam() previously only checked NaN (float) or a failed
 * BigInt conversion (int) — not magnitude or finiteness — so an
 * out-of-int64-range value or Infinity could pass validation and then get
 * silently truncated/wrapped by encodeParamValueBytes().
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidIntParamValue, isValidFloatParamValue } from '../js/dronecanParamValidation.js';

test('accepts int64 values within range', () => {
    assert.equal(isValidIntParamValue(0n), true);
    assert.equal(isValidIntParamValue(-1n), true);
    assert.equal(isValidIntParamValue(2n ** 63n - 1n), true);   // int64 max
    assert.equal(isValidIntParamValue(-(2n ** 63n)), true);     // int64 min
});

test('rejects int64 values outside range', () => {
    assert.equal(isValidIntParamValue(2n ** 63n), false);       // one past max
    assert.equal(isValidIntParamValue(-(2n ** 63n) - 1n), false); // one past min
    assert.equal(isValidIntParamValue(99999999999999999999999999n), false);
});

test('rejects a failed BigInt conversion (convertParamValue() returns Number.NaN, not a bigint)', () => {
    assert.equal(isValidIntParamValue(Number.NaN), false);
    assert.equal(isValidIntParamValue(5), false); // a plain number, not bigint, is also invalid here
});

test('accepts finite float values', () => {
    assert.equal(isValidFloatParamValue(0), true);
    assert.equal(isValidFloatParamValue(-3.5), true);
    assert.equal(isValidFloatParamValue(1e30), true);
});

test('rejects non-finite float values, including the "Infinity" string parse case', () => {
    assert.equal(isValidFloatParamValue(Number.parseFloat('Infinity')), false);
    assert.equal(isValidFloatParamValue(Infinity), false);
    assert.equal(isValidFloatParamValue(-Infinity), false);
    assert.equal(isValidFloatParamValue(Number.NaN), false);
});
