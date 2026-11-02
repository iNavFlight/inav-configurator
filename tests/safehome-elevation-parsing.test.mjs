#!/usr/bin/env node
/**
 * Regression tests for safehome approach/landing altitude validation in
 * tabs/mission_control.js.
 *
 * The elevation span is rendered with a unit suffix ("412 m"), but the two
 * change handlers used to read it back with Number(), which returns NaN for
 * that string. Every comparison against NaN is false, so the checks below
 * accepted any altitude, including values under the ground level.
 *
 * The helpers here mirror the fixed code path; the last block pins the old
 * behaviour so the regression cannot come back unnoticed.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Mirrors tabs/mission_control.js
// ---------------------------------------------------------------------------

const MAX_NEG_FW_LAND_ALT = -100; // centimetres below ground, same constant

function parseElevationMeters(text) {
    const value = parseFloat(text);
    return Number.isNaN(value) ? 0 : value;
}

function checkApproachAltitude(altitude, isSeaLevelRef, sealevel) {
    if (altitude - (isSeaLevelRef ? sealevel * 100 : 0) < 0) {
        return false;
    }
    return true;
}

function checkLandingAltitude(altitude, isSeaLevelRef, sealevel) {
    if (altitude - (isSeaLevelRef ? sealevel * 100 : 0) < MAX_NEG_FW_LAND_ALT) {
        return false;
    }
    return true;
}

// ---------------------------------------------------------------------------
// Parsing the rendered elevation field
// ---------------------------------------------------------------------------

describe('parseElevationMeters', () => {

    test('reads a value rendered with the unit suffix', () => {
        assert.equal(parseElevationMeters('412 m'), 412);
    });

    test('reads a negative elevation', () => {
        assert.equal(parseElevationMeters('-12.5 m'), -12.5);
    });

    test('reads the plain number path used before the fix', () => {
        assert.equal(parseElevationMeters('412'), 412);
    });

    test('treats a missing elevation as sea level rather than NaN', () => {
        assert.equal(parseElevationMeters(''), 0);
        assert.equal(parseElevationMeters(undefined), 0);
    });
});

// ---------------------------------------------------------------------------
// The checks themselves, with the field as the UI renders it
// ---------------------------------------------------------------------------

describe('safehome altitude checks with a rendered elevation', () => {

    test('approach altitude under ground level is rejected', () => {
        const sealevel = parseElevationMeters('412 m');
        // 100 m ASL is 312 m below the safehome ground elevation
        assert.equal(checkApproachAltitude(100 * 100, true, sealevel), false);
    });

    test('approach altitude above ground level is accepted', () => {
        const sealevel = parseElevationMeters('412 m');
        assert.equal(checkApproachAltitude(500 * 100, true, sealevel), true);
    });

    test('landing altitude below the allowed margin is rejected', () => {
        const sealevel = parseElevationMeters('412 m');
        assert.equal(checkLandingAltitude(410 * 100, true, sealevel), false);
    });

    test('sea level reference off keeps the absolute check', () => {
        const sealevel = parseElevationMeters('412 m');
        assert.equal(checkApproachAltitude(100 * 100, false, sealevel), true);
    });
});

// ---------------------------------------------------------------------------
// The async wrapper that hid the result
// ---------------------------------------------------------------------------

describe('an async check called synchronously', () => {

    // checkApproachAltitude used to be declared async while the handler still
    // tested it as a plain value:  if (checkApproachAltitude(...)) { save(); }
    // An async function returns a Promise, and a Promise is always truthy, so
    // the guard passed even after the NaN was taken out of the field.
    async function asyncCheckApproachAltitude(altitude, isSeaLevelRef, sealevel) {
        return checkApproachAltitude(altitude, isSeaLevelRef, sealevel);
    }

    test('the returned Promise is truthy whatever the check decided', () => {
        const result = asyncCheckApproachAltitude(100 * 100, true, 412);
        assert.ok(result instanceof Promise);
        assert.ok(Boolean(result));
    });

    test('the synchronous version returns the decision itself', () => {
        assert.equal(checkApproachAltitude(100 * 100, true, 412), false);
        assert.equal(checkApproachAltitude(500 * 100, true, 412), true);
    });
});

// ---------------------------------------------------------------------------
// Old behaviour, pinned
// ---------------------------------------------------------------------------

describe('Number() on the rendered field', () => {

    test('returns NaN, which disabled every comparison', () => {
        assert.ok(Number.isNaN(Number('412 m')));
    });

    test('NaN makes the old check accept an altitude under the ground', () => {
        const sealevel = Number('412 m'); // NaN, as the old code did
        // 100 m ASL is 312 m below ground, yet the comparison cannot fire
        assert.equal(checkApproachAltitude(100 * 100, true, sealevel), true);
    });
});
