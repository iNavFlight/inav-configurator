#!/usr/bin/env node
/**
 * Regression test for the Outputs/Mixer servo-numbering mismatch.
 *
 * Bug: The Mixer page (tabs/mixer.js) shows the raw servo `target` value
 * directly in its `mix-rule-servo` input (e.g. "1", "2", "3", "4" for
 * smix rules targeting those servos, with target 0 conventionally unused).
 *
 * The Outputs page (tabs/outputs.js) rendered its servo row labels as
 * `servoIndex + 1`, so for the exact same servos it showed "Servo 2",
 * "Servo 3", "Servo 4", "Servo 5" -- a one-off mismatch against the Mixer
 * page's "1", "2", "3", "4" labels for identical physical servos.
 *
 * Fix: tabs/outputs.js now labels each row with the raw `servoIndex`
 * (no +1), matching the Mixer page's target numbering.
 *
 * This test source-inspects tabs/outputs.js to pin down the exact label
 * formula passed to renderServos(), so a future `+ 1` regression is caught.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

describe('Outputs page servo label matches Mixer page numbering', () => {
    const src = readFileSync(resolve(root, 'tabs/outputs.js'), 'utf8');

    test('servo count loop exists', () => {
        assert.ok(
            src.includes('for (let servoIndex = 0; servoIndex < FC.SERVO_RULES.getServoCount(); servoIndex++)'),
            'expected the servo-count render loop to exist in tabs/outputs.js'
        );
    });

    test('renderServos is called with the raw servoIndex, not servoIndex + 1', () => {
        // Isolate the render loop body so we don't accidentally match something
        // elsewhere in the file.
        const loopStart = src.indexOf('for (let servoIndex = 0; servoIndex < FC.SERVO_RULES.getServoCount(); servoIndex++)');
        assert.notEqual(loopStart, -1, 'render loop must exist');
        const loopBody = src.slice(loopStart, loopStart + 300);

        const callMatch = loopBody.match(/renderServos\(\s*'Servo '\s*\+\s*([^,]+?)\s*,/);
        assert.ok(callMatch, `expected to find a renderServos('Servo ' + <expr>, ...) call, got: ${loopBody.slice(0, 150)}`);

        const labelExpr = callMatch[1].trim();

        // Pin down the exact formula: must be the bare variable, never servoIndex + 1
        // (or any other offset). This is the crux of the regression: the Outputs
        // page must show the same number as the Mixer page's raw `target` value.
        assert.equal(
            labelExpr,
            'servoIndex',
            `renderServos() label must use the raw servoIndex value with no offset, got: 'Servo ' + ${labelExpr}`
        );

        // Extra belt-and-suspenders check: explicitly reject the old buggy formula.
        assert.ok(
            !/servoIndex\s*\+\s*1/.test(loopBody),
            'renderServos() must not add 1 to servoIndex (this reintroduces the Outputs/Mixer numbering mismatch)'
        );
    });
});
