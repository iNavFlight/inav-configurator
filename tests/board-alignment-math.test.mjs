#!/usr/bin/env node
/**
 * Unit tests for the pure math backing the board/compass auto-align wizard
 * (js/boardAlignmentMath.js, used by tabs/magnetometer.js).
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
    rad2degrees,
    snap45,
    buildRotationMatrix,
    applyRotation,
    calculateRawFromTransformed,
    vecCross,
    vecNormalize,
    vecSquaredDistance,
    findBestBoardAlignment,
    computeCompassYaw,
    BOARD_ALIGNMENT_CANDIDATES,
} from '../js/boardAlignmentMath.js';

function assertVecClose(actual, expected, epsilon = 1e-9, msg) {
    for (let i = 0; i < 3; i++) {
        assert.ok(Math.abs(actual[i] - expected[i]) < epsilon,
            `${msg || ''} axis ${i}: expected ${expected[i]}, got ${actual[i]}`);
    }
}

describe('rad2degrees', () => {
    test('positive angle', () => {
        assert.equal(rad2degrees(Math.PI / 2), 90);
    });

    test('negative angle normalizes into [0, 360)', () => {
        // atan2 regularly returns negative radians; the result must never be negative,
        // since downstream code treats the output as a bearing.
        assert.equal(rad2degrees(-Math.PI / 2), 270);
        assert.equal(rad2degrees(-Math.PI * (170 / 180)), 190);
    });

    test('zero and full-turn wrap to 0', () => {
        assert.equal(rad2degrees(0), 0);
        assert.equal(rad2degrees(2 * Math.PI), 0);
    });
});

describe('snap45', () => {
    test('snaps to nearest 45-degree step', () => {
        assert.equal(snap45(10), 0);
        assert.equal(snap45(30), 45);
        assert.equal(snap45(100), 90);
    });

    test('normalizes negative input into [0, 360)', () => {
        assert.equal(snap45(-11), 0);
        assert.equal(snap45(-169), 180);
    });

    test('wraps at the top of the range', () => {
        assert.equal(snap45(359), 0);
    });
});

describe('buildRotationMatrix / applyRotation round-trip', () => {
    // For every known mount, rotating gravity [0,0,1] by R and then by R's
    // transpose (the inverse of a pure rotation matrix) must return the original
    // vector -- this is the identity calculateRawFromTransformed()/
    // findBestBoardAlignment() both depend on.
    for (const { roll, pitch, yaw } of BOARD_ALIGNMENT_CANDIDATES) {
        test(`round-trips through R then R^T for (roll=${roll}, pitch=${pitch}, yaw=${yaw})`, () => {
            const R = buildRotationMatrix(roll, pitch, yaw);
            const v = [0.3, -0.4, 0.866];
            const rotated = applyRotation(R, v);
            const RT = R.map((_, i) => R.map((row) => row[i])); // transpose
            const back = applyRotation(RT, rotated);
            assertVecClose(back, v, 1e-9, `(${roll},${pitch},${yaw})`);
        });
    }

    test('identity mount (0,0,0) leaves a vector unchanged', () => {
        const R = buildRotationMatrix(0, 0, 0);
        assertVecClose(applyRotation(R, [1, 2, 3]), [1, 2, 3]);
    });

    test('pitch=180 flips x and z, leaves y (matches the "flip" encoding)', () => {
        const R = buildRotationMatrix(0, 180, 0);
        assertVecClose(applyRotation(R, [1, 2, 3]), [-1, 2, -3], 1e-9);
    });
});

describe('calculateRawFromTransformed', () => {
    test('no-op for the identity alignment', () => {
        const raw = [0.1, 0.2, 0.97];
        assertVecClose(calculateRawFromTransformed(raw, 0, 0, 0), raw);
    });

    test('inverts a known non-zero board alignment back to the raw reading', () => {
        // Simulate: true raw sensor reading is level (gravity on Z), board alignment
        // is yaw=90/roll=0/pitch=0 so firmware's own rotation (R^T * raw) is what
        // MSP_RAW_IMU would report; calculateRawFromTransformed must recover the
        // original raw vector from that transformed reading.
        const trueRaw = [0, 0, 1];
        const R = buildRotationMatrix(0, 0, 90);
        const RT = R.map((_, i) => R.map((row) => row[i]));
        const transformed = applyRotation(RT, trueRaw);
        const recovered = calculateRawFromTransformed(transformed, 0, 0, 90);
        assertVecClose(recovered, trueRaw, 1e-9);
    });
});

describe('vecCross / vecNormalize / vecSquaredDistance', () => {
    test('cross product of orthogonal unit vectors has magnitude 1', () => {
        assertVecClose(vecCross([1, 0, 0], [0, 1, 0]), [0, 0, 1]);
    });

    test('cross product of parallel vectors is zero', () => {
        assertVecClose(vecCross([1, 2, 3], [2, 4, 6]), [0, 0, 0]);
    });

    test('vecNormalize produces a unit vector', () => {
        const n = vecNormalize([3, 4, 0]);
        assert.ok(Math.abs(Math.sqrt(n[0] ** 2 + n[1] ** 2 + n[2] ** 2) - 1) < 1e-12);
        assertVecClose(n, [0.6, 0.8, 0]);
    });

    test('vecSquaredDistance of identical vectors is 0', () => {
        assert.equal(vecSquaredDistance([1, 2, 3], [1, 2, 3]), 0);
    });

    test('vecSquaredDistance matches the definition', () => {
        assert.equal(vecSquaredDistance([0, 0, 0], [1, 2, 2]), 1 + 4 + 4);
    });
});

describe('tilt-difference check (accAutoAlignRead45\'s "forgot to tilt" gate)', () => {
    // Mirrors tabs/magnetometer.js's crossMag < 0.3 rejection: cross-product magnitude
    // of two (near-)unit vectors approximates sin(angle between them).
    function crossMag(a, b) {
        const c = vecCross(a, b);
        return Math.sqrt(c[0] ** 2 + c[1] ** 2 + c[2] ** 2);
    }

    test('flat and 45-degree-tilt readings are far enough apart to pass', () => {
        const flat = [0, 0, 1];
        const tilt45 = [Math.SQRT1_2, 0, Math.SQRT1_2];
        assert.ok(crossMag(flat, tilt45) >= 0.3, 'a real 45-degree tilt must clear the gate');
    });

    test('two near-identical readings (forgot to tilt) are rejected', () => {
        const flat = [0, 0, 1];
        const barelyMoved = [0.05, 0, 0.9987]; // ~3 degrees off flat
        assert.ok(crossMag(flat, barelyMoved) < 0.3, 'a few degrees of drift must not pass as a tilt');
    });

    test('gate boundary is close to sin(17 degrees) as documented', () => {
        const flat = [0, 0, 1];
        const angleRad = 17 * Math.PI / 180;
        const justOverThreshold = [Math.sin(angleRad), 0, Math.cos(angleRad)];
        assert.ok(Math.abs(crossMag(flat, justOverThreshold) - 0.3) < 0.01);
    });
});

describe('computeCompassYaw', () => {
    test('hardware-validated flipped case (AEDROXH7, 2026-09-13)', () => {
        // heading_flat=-11, heading_east=-83 -> flipped=true, yaw=180 (both agree).
        // See draft-raw-mag-msp.md Validation step 2 for the full derivation/hardware trace.
        const r = computeCompassYaw(-11, -83);
        assert.equal(r.flipped, true);
        assert.equal(r.yawFromNorth, 180);
        assert.equal(r.yawFromEast, 180);
        assert.ok(r.yawDiff <= 1, `expected agreement, got yawDiff=${r.yawDiff}`);
    });

    test('unflipped mount: heading_flat and (heading_east - 90) agree directly', () => {
        // A right-side-up mount with a 45-degree mounting yaw offset: facing magnetic
        // north reads 45 (heading = mounting offset), facing east reads 135 (45 + 90).
        const r = computeCompassYaw(45, 135);
        assert.equal(r.flipped, false);
        assert.equal(r.yawFromNorth, 45);
        assert.equal(r.yawFromEast, 45);
    });

    test('flipped mount: a real +90 degree turn reads as roughly -90 (i.e. +270)', () => {
        // Upside-down mount, 0-degree mounting offset: facing north reads 0, but because
        // the compass is mirrored, turning 90 degrees clockwise (to face east) reads as if
        // the aircraft turned -90 (i.e. change wraps to 270, past the flip threshold).
        const r = computeCompassYaw(0, -90);
        assert.equal(r.flipped, true);
        assert.equal(r.yawFromNorth, 180);
        assert.equal(r.yawFromEast, 180);
    });

    test('disagreement between north/east estimates is reported via yawDiff', () => {
        // User didn't actually turn a clean ~90 degrees (or didn't face real north):
        // heading_flat implies yaw=0, but heading_east implies yaw=45 for an unflipped mount.
        const r = computeCompassYaw(0, 135);
        assert.equal(r.flipped, false);
        assert.equal(r.yawFromNorth, 0);
        assert.equal(r.yawFromEast, 45);
        assert.ok(r.yawDiff > 1, `expected a disagreement, got yawDiff=${r.yawDiff}`);
    });

    test('change and flipped are consistent with the documented threshold (change > 180)', () => {
        // change exactly at the unflipped/flipped boundary.
        const under = computeCompassYaw(0, 179); // change = 179 -> not flipped
        const over = computeCompassYaw(0, -179);  // change = 181 -> flipped
        assert.equal(under.flipped, false);
        assert.equal(over.flipped, true);
    });
});

describe('findBestBoardAlignment', () => {
    const refFlat = [0, 0, 1];
    const refTilt = [Math.SQRT1_2, 0, Math.SQRT1_2];

    // Known-mount round-trip: for every candidate mount, synthesize the raw vectors
    // a board mounted that way would produce, then confirm the search recovers
    // exactly that mount with ~zero fit error.
    for (const { roll, pitch, yaw } of BOARD_ALIGNMENT_CANDIDATES) {
        test(`recovers known mount (roll=${roll}, pitch=${pitch}, yaw=${yaw})`, () => {
            const R = buildRotationMatrix(roll, pitch, yaw);
            const rawFlat = applyRotation(R, refFlat);
            const rawTilt = applyRotation(R, refTilt);

            const best = findBestBoardAlignment(refFlat, refTilt, rawFlat, rawTilt);

            assert.equal(best.roll, roll);
            assert.equal(best.pitch, pitch);
            assert.equal(best.yaw, yaw);
            assert.ok(best.err < 1e-9, `expected ~zero fit error, got ${best.err}`);
        });
    }

    test('rejects a reading that fits no candidate well (on-edge mount)', () => {
        // A board mounted on its edge (sensor Z axis horizontal) isn't one of the 16
        // flat-or-upside-down candidates -- no rotation of refFlat can reach ~(1,0,0).
        const rawFlat = [1, 0, 0];
        const rawTilt = [0.9, 0, 0.436]; // close to rawFlat, still far from any candidate
        const best = findBestBoardAlignment(refFlat, refTilt, rawFlat, rawTilt);
        assert.ok(best.err > 1.0, `expected a large fit error for an unsupported mount, got ${best.err}`);
    });
});
