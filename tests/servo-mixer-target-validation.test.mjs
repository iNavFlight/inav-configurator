#!/usr/bin/env node
/**
 * Tests for the servo-mixer target validation warning (Mixer tab).
 *
 * A servo mixer rule's "target" is the servo's 1-based index. A target can't
 * be higher than the number of servo mixer rules that exist: with N rules
 * (rate != 0, i.e. isUsed()), only servos #1..#N can be validly targeted.
 * Entering anything higher means some servo number in 1..N would be skipped.
 *
 * getServoTargetWarning() is the exact function used by tabs/mixer.js's
 * .mix-rule-servo change handler.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import ServoMixRule from '../js/servoMixRule.js';
import { getServoTargetWarning } from '../js/servoMixerTargetWarning.js';

describe('editing one of 2 existing rules (targets #1 and #2)', () => {
    const makeRules = () => [ServoMixRule(1, 0, 100, 0), ServoMixRule(2, 0, 100, 0)];

    test('entered 1 → no warning', () => {
        assert.equal(getServoTargetWarning(makeRules(), 1), null);
    });

    test('entered 2 (no change) → no warning', () => {
        assert.equal(getServoTargetWarning(makeRules(), 2), null);
    });

    test('entered 3 → warning with ruleCount=2 (only 2 rules exist, can\'t have a 3rd servo)', () => {
        const warning = getServoTargetWarning(makeRules(), 3);
        assert.deepEqual(warning, { ruleCount: 2, enteredTarget: 3 });
    });

    test('entered 4 → warning with ruleCount=2', () => {
        const warning = getServoTargetWarning(makeRules(), 4);
        assert.deepEqual(warning, { ruleCount: 2, enteredTarget: 4 });
    });
});

describe('"Add new mixer rule" row (rate=100, auto-target via getNextUnusedIndex)', () => {
    // 2 rules (#1, #2) already exist; "Add new mixer rule" adds a 3rd rule
    // (target=3, rate=100, used). Now 3 rules exist, so servos #1..#3 are valid.
    const makeRules = () => [
        ServoMixRule(1, 0, 100, 0),
        ServoMixRule(2, 0, 100, 0),
        ServoMixRule(3, 0, 100, 0),
    ];

    test('entered 1..3 → no warning', () => {
        for (const entered of [1, 2, 3]) {
            assert.equal(getServoTargetWarning(makeRules(), entered), null, `entered=${entered}`);
        }
    });

    test('entered 4 → warning with ruleCount=3', () => {
        const warning = getServoTargetWarning(makeRules(), 4);
        assert.deepEqual(warning, { ruleCount: 3, enteredTarget: 4 });
    });
});

describe('a single rule', () => {
    test('entered 1 → no warning', () => {
        assert.equal(getServoTargetWarning([ServoMixRule(1, 0, 100, 0)], 1), null);
    });

    test('entered 2 → warning with ruleCount=1 (only 1 rule exists)', () => {
        const warning = getServoTargetWarning([ServoMixRule(1, 0, 100, 0)], 2);
        assert.deepEqual(warning, { ruleCount: 1, enteredTarget: 2 });
    });
});

describe('unused (rate=0) rules do not count toward the rule count', () => {
    test('1 used + 1 unused rule: ruleCount=1, entering 2 warns', () => {
        const rules = [ServoMixRule(1, 0, 100, 0), ServoMixRule(2, 0, 0, 0)];
        const warning = getServoTargetWarning(rules, 2);
        assert.deepEqual(warning, { ruleCount: 1, enteredTarget: 2 });
    });

    test('counts duplicate-target rules separately (e.g. elevon roll+pitch both targeting servo #1)', () => {
        const rules = [ServoMixRule(1, 0, 100, 0), ServoMixRule(1, 0, 100, 0)];
        assert.equal(getServoTargetWarning(rules, 2), null);
    });
});

describe('entered = 0', () => {
    test('never warns, regardless of rule count (0 means "no output")', () => {
        assert.equal(getServoTargetWarning([], 0), null);
        assert.equal(getServoTargetWarning([ServoMixRule(1, 0, 100, 0)], 0), null);
    });
});
