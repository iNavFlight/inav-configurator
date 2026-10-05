#!/usr/bin/env node
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Transpiler } from '../../js/transpiler/transpiler/index.js';

const cases = [
    { name: 'Invalid function call (intermediate object)', code: 'inav.override.flightAxis(180);', shouldError: true, pattern: /Cannot call.*flightAxis.*as a function/ },
    { name: 'Invalid function call (unknown function)',    code: 'someRandomFunction();',         shouldError: true, pattern: /Cannot call.*someRandomFunction.*as a function/ },
    { name: 'Assign to intermediate object (2-level)',    code: 'inav.override.vtx = 3;',        shouldError: true, pattern: /Cannot (use|assign to).*vtx.*object/i },
    { name: 'Assign to intermediate object (3-level)',    code: 'inav.override.flightAxis.yaw = 180;', shouldError: true, pattern: /Cannot (use|assign to).*yaw.*object/i },
    { name: 'Use intermediate object in expression',      code: 'gvar[0] = inav.flight + 1;',    shouldError: true, pattern: /Cannot use.*flight.*object/i },
    { name: 'Valid yaw angle assignment',   code: 'inav.override.flightAxis.yaw.angle = 180;', shouldError: false },
    { name: 'Valid VTX power assignment',   code: 'inav.override.vtx.power = 3;',              shouldError: false },
    { name: 'Valid helper function call',   code: 'sticky(() => inav.flight.altitude > 100, () => inav.flight.altitude < 50, () => { gvar[0] = 1; });', shouldError: false },
];

describe('transpiler validation', () => {
    for (const tc of cases) {
        test(tc.name, () => {
            const transpiler = new Transpiler();
            const result = transpiler.transpile(tc.code);
            const hasError = !result.success && result.error;

            if (tc.shouldError) {
                assert.ok(hasError, 'expected a validation error but compilation succeeded');
                if (tc.pattern) {
                    const msg = result.error?.message ?? String(result.error);
                    assert.match(msg, tc.pattern);
                }
            } else {
                assert.ok(!hasError, `unexpected error: ${result.error?.message ?? result.error}`);
            }
        });
    }
});
