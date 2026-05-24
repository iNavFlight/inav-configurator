#!/usr/bin/env node
/**
 * test_output_mapping.mjs
 *
 * Tests for pwmBuildTimerOutputList() two-pass priority algorithm.
 *
 * The firmware C code (inav2/src/main/drivers/pwm_mapping.c) and the
 * Configurator JS code (js/outputMapping.js) must produce identical output
 * assignment for any given set of timerOverrides.
 *
 * Both implement the same two-pass algorithm:
 *   Pass 0 (dedicated): Timers explicitly set to OUTPUT_MODE_MOTORS or
 *                       OUTPUT_MODE_SERVOS get assigned first, regardless
 *                       of array position.
 *   Pass 1 (auto):      Remaining AUTO timers fill remaining slots in
 *                       array order.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * NOTE on SITL firmware testing:
 *   The firmware's pwmBuildTimerOutputList() is behind #if !defined(SITL_BUILD)
 *   and timerHardwareCount = 0 in SITL, so the C two-pass algorithm cannot be
 *   exercised via SITL. MSP2_INAV_TIMER_OUTPUT_MODE is also guarded by
 *   #ifndef SITL_BUILD. Therefore all meaningful timer-priority testing must
 *   be done at the JS layer, which is what this test does.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 * FIXES APPLIED (reflected in this test file):
 *
 *   Bug 1 (motor numbering): getOutputTable() now numbers motors in assignment
 *   order — dedicated (MOTORS override) first, then auto — matching the
 *   firmware's timMotors[] build order. Previously it numbered by physical
 *   array index, showing wrong motor numbers when dedicated motors were not at
 *   the start of the output list.
 *
 *   Bug 2 (B-type overflow): getTimerMap() now has a 'continue' guard in
 *   Pass 1 that skips any output with a dedicated override (MOTORS or SERVOS
 *   mode). Previously, a B-type output with MOTORS override whose motor quota
 *   was exhausted in Pass 0 could still be picked up in Pass 1 as a servo,
 *   contradicting the firmware behavior.
 * ═══════════════════════════════════════════════════════════════════════════
 */

'use strict';

// ── Inline BitHelper (from js/bitHelper.js) ──────────────────────────────────
const BitHelper = {
    bit_check: (num, bit) => ((1 << bit) & num) !== 0,
    bit_set:   (num, bit) => num | (1 << bit),
    bit_clear: (num, bit) => num & ~(1 << bit),
};

// ── Constants (from outputMapping.js) ────────────────────────────────────────
const TIM_USE_MOTOR = 2;
const TIM_USE_SERVO = 3;
const TIM_USE_LED   = 24;

const OUTPUT_TYPE_MOTOR = 0;
const OUTPUT_TYPE_SERVO = 1;
const OUTPUT_TYPE_LED   = 2;

const TIMER_OUTPUT_MODE_AUTO    = 0;
const TIMER_OUTPUT_MODE_MOTORS  = 1;
const TIMER_OUTPUT_MODE_SERVOS  = 2;
const TIMER_OUTPUT_MODE_LED     = 3;

// ── Inline getTimerMap() from outputMapping.js ────────────────────────────────
// This is the EXACT two-pass algorithm from js/outputMapping.js getTimerMap().
// Any changes to outputMapping.js must be reflected here.
//
// Bug 2 fix: Pass 1 now skips outputs with dedicated overrides (MOTORS or SERVOS).
function getTimerMap(data, timerOverrides, motors, servos) {
    let timerMap = new Array(data.length).fill(null);
    let motorsToGo = motors;
    let servosToGo = servos;

    for (let priority = 0; priority < 2; priority++) {
        const isDedicated = (priority === 0);

        for (let i = 0; i < data.length; i++) {
            if (timerMap[i] !== null) continue;

            const flags   = data[i].usageFlags;
            const timerId = data[i].timerId;
            const mode    = timerOverrides[timerId] !== undefined
                                ? timerOverrides[timerId]
                                : TIMER_OUTPUT_MODE_AUTO;

            // Bug 2 fix: Pass 1 skips dedicated overrides — they were handled
            // (or intentionally skipped due to quota exhaustion) in Pass 0.
            if (!isDedicated && (mode === TIMER_OUTPUT_MODE_MOTORS || mode === TIMER_OUTPUT_MODE_SERVOS)) {
                continue;
            }

            if (motorsToGo > 0
                    && BitHelper.bit_check(flags, TIM_USE_MOTOR)
                    && (isDedicated ? mode === TIMER_OUTPUT_MODE_MOTORS
                                    : mode !== TIMER_OUTPUT_MODE_MOTORS)) {
                timerMap[i] = OUTPUT_TYPE_MOTOR;
                motorsToGo--;
            } else if (servosToGo > 0
                    && BitHelper.bit_check(flags, TIM_USE_SERVO)
                    && (isDedicated ? mode === TIMER_OUTPUT_MODE_SERVOS
                                    : mode !== TIMER_OUTPUT_MODE_SERVOS)) {
                timerMap[i] = OUTPUT_TYPE_SERVO;
                servosToGo--;
            } else if (!isDedicated && BitHelper.bit_check(flags, TIM_USE_LED)) {
                timerMap[i] = OUTPUT_TYPE_LED;
            }
        }
    }

    return timerMap;
}

// ── buildOutputLabels: mirrors getOutputTable() numbering ────────────────────
// Bug 1 fix: motors are numbered in assignment order — dedicated first, then
// auto — matching firmware timMotors[] build order.
// Requires data and timerOverrides to identify which outputs are dedicated.
function buildOutputLabels(timerMap, data, timerOverrides) {
    timerOverrides = timerOverrides || {};

    // Two-pass motor pre-numbering: dedicated (MOTORS override) first, then auto.
    const motorNumbers = {};
    let motorNum = 1;
    // Pass A: dedicated motors
    for (let i = 0; i < timerMap.length; i++) {
        if (timerMap[i] !== OUTPUT_TYPE_MOTOR) continue;
        const timerId = data[i].timerId;
        const mode = timerOverrides[timerId] !== undefined ? timerOverrides[timerId] : TIMER_OUTPUT_MODE_AUTO;
        if (mode === TIMER_OUTPUT_MODE_MOTORS) motorNumbers[i] = motorNum++;
    }
    // Pass B: auto motors
    for (let i = 0; i < timerMap.length; i++) {
        if (timerMap[i] === OUTPUT_TYPE_MOTOR && motorNumbers[i] === undefined) motorNumbers[i] = motorNum++;
    }

    let servoIdx = 1;
    return timerMap.map((t, i) => {
        if (t === OUTPUT_TYPE_MOTOR)  return `Motor ${motorNumbers[i]}`;
        if (t === OUTPUT_TYPE_SERVO)  return `Servo ${servoIdx++}`;
        if (t === OUTPUT_TYPE_LED)    return 'LED';
        return '-';
    });
}

// ── buildFirmwareLabels: mirrors firmware timMotors[] assignment order ────────
// Firmware Motor 1 = timMotors[0] = first output added in Pass 0, then Pass 1.
// This is what a correctly-implemented preview SHOULD show.
function buildFirmwareLabels(data, timerOverrides, motors, servos) {
    // Re-run the two-pass algorithm, recording assignment ORDER
    const assignmentOrder = [];
    let motorsToGo = motors;
    let servosToGo = servos;
    const motorAssigned = new Array(data.length).fill(false);
    const servoAssigned = new Array(data.length).fill(false);

    for (let priority = 0; priority < 2; priority++) {
        const isDedicated = (priority === 0);
        for (let i = 0; i < data.length; i++) {
            if (motorAssigned[i] || servoAssigned[i]) continue;
            const flags   = data[i].usageFlags;
            const timerId = data[i].timerId;
            const mode    = timerOverrides[timerId] !== undefined
                                ? timerOverrides[timerId]
                                : TIMER_OUTPUT_MODE_AUTO;
            if (motorsToGo > 0
                    && BitHelper.bit_check(flags, TIM_USE_MOTOR)
                    && (isDedicated ? mode === TIMER_OUTPUT_MODE_MOTORS
                                    : mode !== TIMER_OUTPUT_MODE_MOTORS)) {
                motorAssigned[i] = true;
                assignmentOrder.push({ idx: i, type: OUTPUT_TYPE_MOTOR });
                motorsToGo--;
            } else if (servosToGo > 0
                    && BitHelper.bit_check(flags, TIM_USE_SERVO)
                    && (isDedicated ? mode === TIMER_OUTPUT_MODE_SERVOS
                                    : mode !== TIMER_OUTPUT_MODE_SERVOS)) {
                servoAssigned[i] = true;
                assignmentOrder.push({ idx: i, type: OUTPUT_TYPE_SERVO });
                servosToGo--;
            }
        }
    }

    // Build index→label map using assignment order (firmware's timMotors[]/timServos[] order)
    const labels = new Array(data.length).fill('-');
    let motorNum = 1, servoNum = 1;
    for (const a of assignmentOrder) {
        if (a.type === OUTPUT_TYPE_MOTOR) labels[a.idx] = `Motor ${motorNum++}`;
        if (a.type === OUTPUT_TYPE_SERVO) labels[a.idx] = `Servo ${servoNum++}`;
    }
    return labels;
}

// ── Test helpers ─────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

function runTest(name, fn) {
    try {
        fn();
        console.log(`  PASS  ${name}`);
        passed++;
    } catch (err) {
        console.log(`  FAIL  ${name}`);
        console.log(`        ${err.message}`);
        failed++;
        failures.push({ name, error: err.message });
    }
}

// ── Helper: build a simple output list ───────────────────────────────────────
function makeOutputs(spec) {
    return spec.map((s, i) => {
        let flags = 0;
        const t = s.type || s;
        if (t === 'M' || t === 'B') flags = BitHelper.bit_set(flags, TIM_USE_MOTOR);
        if (t === 'S' || t === 'B') flags = BitHelper.bit_set(flags, TIM_USE_SERVO);
        if (t === 'L') flags = BitHelper.bit_set(flags, TIM_USE_LED);
        return {
            usageFlags: flags,
            timerId:    s.timerId !== undefined ? s.timerId : i,
        };
    });
}

// ═══════════════════════════════════════════════════════════════════════════════
// Test Cases
// ═══════════════════════════════════════════════════════════════════════════════

console.log('\nPWM Timer Output Priority Logic Tests');
console.log('======================================\n');

// ─────────────────────────────────────────────────────────────────────────────
// TC-1: All AUTO — no overrides. No dedicated outputs, so Pass 0 assigns
// nothing. Pass 1 fills in order. Array order = assignment order → no mismatch.
// ─────────────────────────────────────────────────────────────────────────────
console.log('TC-1: All AUTO — no overrides (no mismatch expected)');

runTest('Quad with 6 motor-capable outputs, no overrides: motors fill S1-S4', () => {
    const outputs = makeOutputs(['M','M','M','M','M','M']);
    const map = getTimerMap(outputs, {}, 4, 0);
    const labels = buildOutputLabels(map, outputs, {});
    assert(labels[0] === 'Motor 1', `S1 expected Motor 1, got ${labels[0]}`);
    assert(labels[1] === 'Motor 2', `S2 expected Motor 2, got ${labels[1]}`);
    assert(labels[2] === 'Motor 3', `S3 expected Motor 3, got ${labels[2]}`);
    assert(labels[3] === 'Motor 4', `S4 expected Motor 4, got ${labels[3]}`);
    assert(labels[4] === '-',       `S5 expected -, got ${labels[4]}`);
    assert(labels[5] === '-',       `S6 expected -, got ${labels[5]}`);
});

runTest('Firmware agrees with JS for all-AUTO (no dedicated overrides)', () => {
    const outputs = makeOutputs(['M','M','M','M','M','M']);
    const jsLabels  = buildOutputLabels(getTimerMap(outputs, {}, 4, 0), outputs, {});
    const fwLabels  = buildFirmwareLabels(outputs, {}, 4, 0);
    assert(JSON.stringify(jsLabels) === JSON.stringify(fwLabels),
        `JS: [${jsLabels}] != FW: [${fwLabels}]`);
});

runTest('Single motor output, auto: S1=Motor1', () => {
    const outputs = makeOutputs(['M']);
    const map = getTimerMap(outputs, {}, 1, 0);
    const labels = buildOutputLabels(map, outputs, {});
    assert(labels[0] === 'Motor 1', `Expected Motor 1, got ${labels[0]}`);
});

runTest('Mixed M+S outputs, auto, 2 motors 2 servos: motors before servos in array', () => {
    const outputs = makeOutputs(['M','M','S','S']);
    const map = getTimerMap(outputs, {}, 2, 2);
    const labels = buildOutputLabels(map, outputs, {});
    assert(labels[0] === 'Motor 1', `S1 expected Motor 1, got ${labels[0]}`);
    assert(labels[1] === 'Motor 2', `S2 expected Motor 2, got ${labels[1]}`);
    assert(labels[2] === 'Servo 1', `S3 expected Servo 1, got ${labels[2]}`);
    assert(labels[3] === 'Servo 2', `S4 expected Servo 2, got ${labels[3]}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-2: Dedicated MOTORS only
// Dedicated at S3+S4 (indices 2+3), auto at S1+S2+S5+S6, 4-motor config.
//
// Firmware (correct): Motor1=S3, Motor2=S4, Motor3=S1, Motor4=S2
// Fixed JS now matches firmware.
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nTC-2: Dedicated MOTORS only (S3+S4 forced MOTORS)');

runTest('Dedicated motors at S3+S4 → S3=Motor1, S4=Motor2 (firmware order)', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 }, { type: 'M', timerId: 1 },
        { type: 'M', timerId: 2 }, { type: 'M', timerId: 3 },
        { type: 'M', timerId: 4 }, { type: 'M', timerId: 5 },
    ]);
    const overrides = { 2: TIMER_OUTPUT_MODE_MOTORS, 3: TIMER_OUTPUT_MODE_MOTORS };
    const fwLabels = buildFirmwareLabels(outputs, overrides, 4, 0);
    assert(fwLabels[2] === 'Motor 1', `FW: S3 expected Motor 1, got ${fwLabels[2]}`);
    assert(fwLabels[3] === 'Motor 2', `FW: S4 expected Motor 2, got ${fwLabels[3]}`);
    assert(fwLabels[0] === 'Motor 3', `FW: S1 expected Motor 3, got ${fwLabels[0]}`);
    assert(fwLabels[1] === 'Motor 4', `FW: S2 expected Motor 4, got ${fwLabels[1]}`);
});

runTest('JS and firmware agree on motor numbering with dedicated motors at S3+S4', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 }, { type: 'M', timerId: 1 },
        { type: 'M', timerId: 2 }, { type: 'M', timerId: 3 },
        { type: 'M', timerId: 4 }, { type: 'M', timerId: 5 },
    ]);
    const overrides = { 2: TIMER_OUTPUT_MODE_MOTORS, 3: TIMER_OUTPUT_MODE_MOTORS };
    const jsLabels = buildOutputLabels(getTimerMap(outputs, overrides, 4, 0), outputs, overrides);
    const fwLabels = buildFirmwareLabels(outputs, overrides, 4, 0);
    assert(JSON.stringify(jsLabels) === JSON.stringify(fwLabels),
        `JS: [${jsLabels}] != FW: [${fwLabels}]`);
});

// Verify the correct physical pins ARE assigned as motors
runTest('All 4 motor outputs are motor-capable outputs (correct pins)', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 }, { type: 'M', timerId: 1 },
        { type: 'M', timerId: 2 }, { type: 'M', timerId: 3 },
        { type: 'M', timerId: 4 }, { type: 'M', timerId: 5 },
    ]);
    const overrides = { 2: TIMER_OUTPUT_MODE_MOTORS, 3: TIMER_OUTPUT_MODE_MOTORS };
    const map = getTimerMap(outputs, overrides, 4, 0);
    const labels = buildOutputLabels(map, outputs, overrides);
    const motorLabels = labels.filter(l => l.startsWith('Motor'));
    assert(motorLabels.length === 4, `Expected 4 motor assignments, got ${motorLabels.length}`);
    // All 4 assigned outputs should be motor-capable (indices 0-3)
    assert(labels[0].startsWith('Motor'), `S1 should be motor, got ${labels[0]}`);
    assert(labels[1].startsWith('Motor'), `S2 should be motor, got ${labels[1]}`);
    assert(labels[2].startsWith('Motor'), `S3 should be motor, got ${labels[2]}`);
    assert(labels[3].startsWith('Motor'), `S4 should be motor, got ${labels[3]}`);
    assert(labels[4] === '-', `S5 should be -, got ${labels[4]}`);
    assert(labels[5] === '-', `S6 should be -, got ${labels[5]}`);
});

runTest('Dedicated motor override IS honored in Pass 0 (not Pass 1)', () => {
    // The key fix: dedicated timer at S5 should get assigned in Pass 0
    // Verify by checking that the Pass 0 mechanism assigns it
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 }, { type: 'M', timerId: 1 },
        { type: 'M', timerId: 2 }, { type: 'M', timerId: 3 },
        { type: 'M', timerId: 4 },  // S5: dedicated MOTOR
    ]);
    const overrides = { 4: TIMER_OUTPUT_MODE_MOTORS };
    const map = getTimerMap(outputs, overrides, 2, 0);
    const labels = buildOutputLabels(map, outputs, overrides);
    // S5 must be assigned as a motor (dedicated)
    assert(labels[4].startsWith('Motor'), `S5 expected Motor (dedicated), got ${labels[4]}`);
    // S1 must also be assigned as a motor (auto fill)
    assert(labels[0].startsWith('Motor'), `S1 expected Motor (auto fill), got ${labels[0]}`);
    // Only 2 motors total
    const motorCount = labels.filter(l => l.startsWith('Motor')).length;
    assert(motorCount === 2, `Expected 2 motors, got ${motorCount}`);
});

runTest('Dedicated motor at S5 → S5=Motor1, S1=Motor2 (firmware ordering)', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 }, { type: 'M', timerId: 1 },
        { type: 'M', timerId: 2 }, { type: 'M', timerId: 3 },
        { type: 'M', timerId: 4 },  // S5: dedicated MOTOR
    ]);
    const overrides = { 4: TIMER_OUTPUT_MODE_MOTORS };
    const fwLabels = buildFirmwareLabels(outputs, overrides, 2, 0);
    assert(fwLabels[4] === 'Motor 1', `FW: S5 expected Motor 1 (dedicated), got ${fwLabels[4]}`);
    assert(fwLabels[0] === 'Motor 2', `FW: S1 expected Motor 2 (auto fill), got ${fwLabels[0]}`);
});

runTest('JS and firmware agree: dedicated motor at S5 → S5=Motor1, S1=Motor2', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 }, { type: 'M', timerId: 1 },
        { type: 'M', timerId: 2 }, { type: 'M', timerId: 3 },
        { type: 'M', timerId: 4 },  // S5: dedicated MOTOR
    ]);
    const overrides = { 4: TIMER_OUTPUT_MODE_MOTORS };
    const jsLabels = buildOutputLabels(getTimerMap(outputs, overrides, 2, 0), outputs, overrides);
    const fwLabels = buildFirmwareLabels(outputs, overrides, 2, 0);
    assert(JSON.stringify(jsLabels) === JSON.stringify(fwLabels),
        `JS: [${jsLabels}] != FW: [${fwLabels}]`);
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-3: Dedicated SERVOS only — S3+S4 forced SERVOS, motors at S1+S2+S5+S6
// No motor numbering mismatch since there are no dedicated MOTORS overrides.
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nTC-3: Dedicated SERVOS only (S3+S4 forced SERVOS) — no mismatch');

runTest('Dedicated servos at S3+S4: S3=Servo1, S4=Servo2, motors fill rest', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 }, { type: 'M', timerId: 1 },
        { type: 'S', timerId: 2 }, { type: 'S', timerId: 3 },  // dedicated servos
        { type: 'M', timerId: 4 }, { type: 'M', timerId: 5 },
    ]);
    const overrides = { 2: TIMER_OUTPUT_MODE_SERVOS, 3: TIMER_OUTPUT_MODE_SERVOS };
    const map = getTimerMap(outputs, overrides, 4, 2);
    const labels = buildOutputLabels(map, outputs, overrides);
    assert(labels[2] === 'Servo 1', `S3 expected Servo 1 (dedicated), got ${labels[2]}`);
    assert(labels[3] === 'Servo 2', `S4 expected Servo 2 (dedicated), got ${labels[3]}`);
    assert(labels[0] === 'Motor 1', `S1 expected Motor 1, got ${labels[0]}`);
    assert(labels[1] === 'Motor 2', `S2 expected Motor 2, got ${labels[1]}`);
    assert(labels[4] === 'Motor 3', `S5 expected Motor 3, got ${labels[4]}`);
    assert(labels[5] === 'Motor 4', `S6 expected Motor 4, got ${labels[5]}`);
});

runTest('Firmware agrees with JS for dedicated servos (servo-only pins)', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 }, { type: 'M', timerId: 1 },
        { type: 'S', timerId: 2 }, { type: 'S', timerId: 3 },
        { type: 'M', timerId: 4 }, { type: 'M', timerId: 5 },
    ]);
    const overrides = { 2: TIMER_OUTPUT_MODE_SERVOS, 3: TIMER_OUTPUT_MODE_SERVOS };
    const jsLabels = buildOutputLabels(getTimerMap(outputs, overrides, 4, 2), outputs, overrides);
    const fwLabels = buildFirmwareLabels(outputs, overrides, 4, 2);
    assert(JSON.stringify(jsLabels) === JSON.stringify(fwLabels),
        `JS: [${jsLabels}] != FW: [${fwLabels}]`);
});

runTest('Single dedicated servo on both-capable pin: servo wins over motor', () => {
    const outputs = makeOutputs([
        { type: 'B', timerId: 0 },  // dedicated SERVO on both-capable pin
        { type: 'M', timerId: 1 },
        { type: 'M', timerId: 2 },
    ]);
    const overrides = { 0: TIMER_OUTPUT_MODE_SERVOS };
    const map = getTimerMap(outputs, overrides, 2, 1);
    const labels = buildOutputLabels(map, outputs, overrides);
    assert(labels[0] === 'Servo 1', `S1 expected Servo 1 (dedicated SERVO), got ${labels[0]}`);
    assert(labels[1] === 'Motor 1', `S2 expected Motor 1, got ${labels[1]}`);
    assert(labels[2] === 'Motor 2', `S3 expected Motor 2, got ${labels[2]}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-4: Mixed dedicated motors + dedicated servos
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nTC-4: Mixed dedicated motors + dedicated servos');

runTest('Dedicated motor at S2, dedicated servo at S3: S2=Motor1, S3=Servo1', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 },  // S1: auto motor
        { type: 'M', timerId: 1 },  // S2: dedicated MOTOR
        { type: 'S', timerId: 2 },  // S3: dedicated SERVO
        { type: 'S', timerId: 3 },  // S4: auto servo
    ]);
    const overrides = { 1: TIMER_OUTPUT_MODE_MOTORS, 2: TIMER_OUTPUT_MODE_SERVOS };
    const jsLabels = buildOutputLabels(getTimerMap(outputs, overrides, 2, 2), outputs, overrides);
    const fwLabels = buildFirmwareLabels(outputs, overrides, 2, 2);
    assert(fwLabels[1] === 'Motor 1', `FW: S2 expected Motor 1 (dedicated), got ${fwLabels[1]}`);
    assert(fwLabels[2] === 'Servo 1', `FW: S3 expected Servo 1 (dedicated), got ${fwLabels[2]}`);
    assert(fwLabels[0] === 'Motor 2', `FW: S1 expected Motor 2 (auto fill), got ${fwLabels[0]}`);
    assert(fwLabels[3] === 'Servo 2', `FW: S4 expected Servo 2 (auto fill), got ${fwLabels[3]}`);
    assert(JSON.stringify(jsLabels) === JSON.stringify(fwLabels),
        `JS: [${jsLabels}] != FW: [${fwLabels}]`);
});

runTest('Mixed dedicated: correct outputs marked motor/servo, count correct', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 },
        { type: 'M', timerId: 1 },  // dedicated MOTOR
        { type: 'S', timerId: 2 },  // dedicated SERVO
        { type: 'S', timerId: 3 },
    ]);
    const overrides = { 1: TIMER_OUTPUT_MODE_MOTORS, 2: TIMER_OUTPUT_MODE_SERVOS };
    const map = getTimerMap(outputs, overrides, 2, 2);
    const labels = buildOutputLabels(map, outputs, overrides);
    const motorLabels = labels.filter(l => l.startsWith('Motor'));
    const servoLabels = labels.filter(l => l.startsWith('Servo'));
    assert(motorLabels.length === 2, `Expected 2 motors, got ${motorLabels.length}`);
    assert(servoLabels.length === 2, `Expected 2 servos, got ${servoLabels.length}`);
    // S2 must be motor, S3 must be servo
    assert(labels[1].startsWith('Motor'), `S2 expected Motor, got ${labels[1]}`);
    assert(labels[2].startsWith('Servo'), `S3 expected Servo, got ${labels[2]}`);
});

runTest('8 outputs, 3 dedicated motors, 2 dedicated servos: correct pin counts', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 },  // auto motor
        { type: 'S', timerId: 1 },  // auto servo
        { type: 'M', timerId: 2 },  // dedicated motor
        { type: 'M', timerId: 3 },  // dedicated motor
        { type: 'S', timerId: 4 },  // dedicated servo
        { type: 'S', timerId: 5 },  // dedicated servo
        { type: 'M', timerId: 6 },  // dedicated motor
        { type: 'M', timerId: 7 },  // auto motor
    ]);
    const overrides = {
        2: TIMER_OUTPUT_MODE_MOTORS, 3: TIMER_OUTPUT_MODE_MOTORS,
        4: TIMER_OUTPUT_MODE_SERVOS, 5: TIMER_OUTPUT_MODE_SERVOS,
        6: TIMER_OUTPUT_MODE_MOTORS,
    };
    const map = getTimerMap(outputs, overrides, 5, 3);
    const labels = buildOutputLabels(map, outputs, overrides);
    const motorLabels = labels.filter(l => l.startsWith('Motor'));
    const servoLabels = labels.filter(l => l.startsWith('Servo'));
    assert(motorLabels.length === 5, `Expected 5 motors, got ${motorLabels.length}: [${labels}]`);
    assert(servoLabels.length === 3, `Expected 3 servos, got ${servoLabels.length}: [${labels}]`);
    // Dedicated pins must be assigned to their overridden type
    assert(labels[2].startsWith('Motor'), `S3 (dedicated MOTOR) expected Motor, got ${labels[2]}`);
    assert(labels[3].startsWith('Motor'), `S4 (dedicated MOTOR) expected Motor, got ${labels[3]}`);
    assert(labels[4].startsWith('Servo'), `S5 (dedicated SERVO) expected Servo, got ${labels[4]}`);
    assert(labels[5].startsWith('Servo'), `S6 (dedicated SERVO) expected Servo, got ${labels[5]}`);
    assert(labels[6].startsWith('Motor'), `S7 (dedicated MOTOR) expected Motor, got ${labels[6]}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-5: Dedicated output count exceeds motor count (overflow)
// Bug 2 fix: B-type outputs with MOTORS override must NOT be picked up in
// Pass 1 as servos, even though they have the servo capability flag.
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nTC-5: Dedicated output count exceeds motor count');

runTest('4 outputs forced MOTORS but only 2 motors: first 2 dedicated get motors, extras unassigned', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 }, { type: 'M', timerId: 1 },
        { type: 'M', timerId: 2 }, { type: 'M', timerId: 3 },  // overflow
        { type: 'S', timerId: 4 }, { type: 'S', timerId: 5 },
    ]);
    const overrides = {
        0: TIMER_OUTPUT_MODE_MOTORS, 1: TIMER_OUTPUT_MODE_MOTORS,
        2: TIMER_OUTPUT_MODE_MOTORS, 3: TIMER_OUTPUT_MODE_MOTORS,
    };
    const map = getTimerMap(outputs, overrides, 2, 2);
    const labels = buildOutputLabels(map, outputs, overrides);
    // Only 2 motors → first 2 dedicated (S1, S2) get motor assignments
    assert(labels[0].startsWith('Motor'), `S1 expected Motor, got ${labels[0]}`);
    assert(labels[1].startsWith('Motor'), `S2 expected Motor, got ${labels[1]}`);
    // S3/S4 are dedicated MOTOR but motor quota exhausted
    assert(labels[2] === '-', `S3 expected - (motor quota exhausted), got ${labels[2]}`);
    assert(labels[3] === '-', `S4 expected - (motor quota exhausted), got ${labels[3]}`);
    // Servos still assigned from auto outputs
    assert(labels[4].startsWith('Servo'), `S5 expected Servo, got ${labels[4]}`);
    assert(labels[5].startsWith('Servo'), `S6 expected Servo, got ${labels[5]}`);
});

runTest('Overflow dedicated motors do NOT steal servo slots (motor-only flag)', () => {
    // Motors are motor-only (M type), so overflow dedicated motors can't be servos
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 }, { type: 'M', timerId: 1 },  // dedicated motor (overflow)
        { type: 'M', timerId: 2 },                              // dedicated motor (overflow)
        { type: 'S', timerId: 3 },                              // auto servo
    ]);
    const overrides = {
        0: TIMER_OUTPUT_MODE_MOTORS, 1: TIMER_OUTPUT_MODE_MOTORS,
        2: TIMER_OUTPUT_MODE_MOTORS,
    };
    const map = getTimerMap(outputs, overrides, 1, 1);
    const labels = buildOutputLabels(map, outputs, overrides);
    assert(labels[0].startsWith('Motor'), `S1 expected Motor, got ${labels[0]}`);
    // S2/S3 are dedicated MOTOR, no servo flag → can't be servo even if overflow
    assert(labels[1] === '-', `S2 expected - (overflow, no servo flag), got ${labels[1]}`);
    assert(labels[2] === '-', `S3 expected - (overflow, no servo flag), got ${labels[2]}`);
    assert(labels[3] === 'Servo 1', `S4 expected Servo 1 (auto), got ${labels[3]}`);
});

runTest('Overflow dedicated (B-type) motors do NOT become servos (Bug 2 fix)', () => {
    // Both-capable output (B type) forced to MOTORS, 1 motor configured.
    // Overflow outputs should stay unassigned even though they have servo flag.
    // Bug 2 fix: Pass 1 now skips these via the continue guard.
    const outputs = makeOutputs([
        { type: 'B', timerId: 0 }, { type: 'B', timerId: 1 },  // dedicated MOTORS (1 overflow)
        { type: 'B', timerId: 2 },
        { type: 'S', timerId: 3 },
    ]);
    const overrides = {
        0: TIMER_OUTPUT_MODE_MOTORS, 1: TIMER_OUTPUT_MODE_MOTORS,
        2: TIMER_OUTPUT_MODE_MOTORS,
    };
    const map = getTimerMap(outputs, overrides, 1, 1);
    const labels = buildOutputLabels(map, outputs, overrides);
    assert(labels[0].startsWith('Motor'), `S1 expected Motor, got ${labels[0]}`);
    // S2 is B-type with MOTORS override, motor quota exhausted
    // Pass 1 continue guard: mode === MOTORS → skip entirely
    // Result: S2 should be '-'
    assert(labels[1] === '-', `S2 expected - (overflow MOTOR dedicated, NOT servo), got ${labels[1]}`);
    assert(labels[2] === '-', `S3 expected - (overflow MOTOR dedicated, NOT servo), got ${labels[2]}`);
    assert(labels[3] === 'Servo 1', `S4 expected Servo 1 (auto), got ${labels[3]}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-6: Interleaved dedicated + AUTO
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nTC-6: Interleaved dedicated + AUTO');

runTest('Dedicated motor at S4, auto at S1-S3: S4 IS assigned as motor', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 }, { type: 'M', timerId: 1 },
        { type: 'M', timerId: 2 },
        { type: 'M', timerId: 3 },  // S4: dedicated MOTOR
    ]);
    const overrides = { 3: TIMER_OUTPUT_MODE_MOTORS };
    const map = getTimerMap(outputs, overrides, 2, 0);
    const labels = buildOutputLabels(map, outputs, overrides);
    // S4 must be a motor (dedicated)
    assert(labels[3].startsWith('Motor'), `S4 expected Motor (dedicated), got ${labels[3]}`);
    // S1 must also be a motor (auto fill, only 2 motors total)
    assert(labels[0].startsWith('Motor'), `S1 expected Motor (auto fill), got ${labels[0]}`);
    assert(labels[1] === '-', `S2 expected - (only 2 motors), got ${labels[1]}`);
    assert(labels[2] === '-', `S3 expected - (only 2 motors), got ${labels[2]}`);
});

runTest('Dedicated motor at S4 → S4=Motor1 (firmware: dedicated is first)', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 }, { type: 'M', timerId: 1 },
        { type: 'M', timerId: 2 },
        { type: 'M', timerId: 3 },  // S4: dedicated MOTOR
    ]);
    const overrides = { 3: TIMER_OUTPUT_MODE_MOTORS };
    const jsLabels = buildOutputLabels(getTimerMap(outputs, overrides, 2, 0), outputs, overrides);
    const fwLabels = buildFirmwareLabels(outputs, overrides, 2, 0);
    assert(fwLabels[3] === 'Motor 1', `FW: S4 expected Motor 1, got ${fwLabels[3]}`);
    assert(fwLabels[0] === 'Motor 2', `FW: S1 expected Motor 2, got ${fwLabels[0]}`);
    assert(JSON.stringify(jsLabels) === JSON.stringify(fwLabels),
        `JS: [${jsLabels}] != FW: [${fwLabels}]`);
});

runTest('Dedicated motor at last position is always assigned', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 }, { type: 'M', timerId: 1 },
        { type: 'M', timerId: 2 }, { type: 'M', timerId: 3 },
        { type: 'M', timerId: 4 }, { type: 'M', timerId: 5 },
    ]);
    const overrides = { 5: TIMER_OUTPUT_MODE_MOTORS };
    const map = getTimerMap(outputs, overrides, 3, 0);
    const labels = buildOutputLabels(map, outputs, overrides);
    assert(labels[5].startsWith('Motor'), `S6 (dedicated MOTOR, last) expected Motor, got ${labels[5]}`);
    assert(labels[0].startsWith('Motor'), `S1 expected Motor (auto fill), got ${labels[0]}`);
    assert(labels[1].startsWith('Motor'), `S2 expected Motor (auto fill), got ${labels[1]}`);
    const motorCount = labels.filter(l => l.startsWith('Motor')).length;
    assert(motorCount === 3, `Expected 3 motors total, got ${motorCount}`);
});

runTest('Dedicated servo at end of list: servo takes correct slot', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 }, { type: 'M', timerId: 1 },
        { type: 'M', timerId: 2 },
        { type: 'S', timerId: 3 },  // dedicated SERVO at end
    ]);
    const overrides = { 3: TIMER_OUTPUT_MODE_SERVOS };
    const map = getTimerMap(outputs, overrides, 2, 1);
    const labels = buildOutputLabels(map, outputs, overrides);
    assert(labels[3] === 'Servo 1', `S4 expected Servo 1 (dedicated), got ${labels[3]}`);
    assert(labels[0] === 'Motor 1', `S1 expected Motor 1, got ${labels[0]}`);
    assert(labels[1] === 'Motor 2', `S2 expected Motor 2, got ${labels[1]}`);
    assert(labels[2] === '-',       `S3 expected -, got ${labels[2]}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-7: NEGATIVE tests — wrong flags should not allow incorrect assignment
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nTC-7: Negative tests');

runTest('Motor-only output with SERVOS override: NOT assigned as servo (no servo flag)', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 },  // motor-only, SERVOS override
        { type: 'S', timerId: 1 },
    ]);
    const overrides = { 0: TIMER_OUTPUT_MODE_SERVOS };
    const map = getTimerMap(outputs, overrides, 1, 1);
    const labels = buildOutputLabels(map, outputs, overrides);
    assert(labels[0] !== 'Servo 1', `S1 should NOT be Servo (no servo flag), got ${labels[0]}`);
    assert(labels[1] === 'Servo 1', `S2 expected Servo 1 (auto), got ${labels[1]}`);
});

runTest('Servo-only output with MOTORS override: NOT assigned as motor (no motor flag)', () => {
    const outputs = makeOutputs([
        { type: 'S', timerId: 0 },  // servo-only, MOTORS override
        { type: 'M', timerId: 1 },
    ]);
    const overrides = { 0: TIMER_OUTPUT_MODE_MOTORS };
    const map = getTimerMap(outputs, overrides, 1, 1);
    const labels = buildOutputLabels(map, outputs, overrides);
    assert(labels[0] !== 'Motor 1', `S1 should NOT be Motor (no motor flag), got ${labels[0]}`);
    assert(labels[1] === 'Motor 1', `S2 expected Motor 1 (auto), got ${labels[1]}`);
});

runTest('AUTO outputs are all assigned in Pass 1 only (Pass 0 assigns nothing)', () => {
    const outputs = makeOutputs(['M','M']);
    const map = getTimerMap(outputs, {}, 2, 0);
    const labels = buildOutputLabels(map, outputs, {});
    assert(labels[0] === 'Motor 1', `S1 expected Motor 1, got ${labels[0]}`);
    assert(labels[1] === 'Motor 2', `S2 expected Motor 2, got ${labels[1]}`);
});

runTest('Zero motors configured: no outputs assigned as motors', () => {
    const outputs = makeOutputs(['M','M','M']);
    const map = getTimerMap(outputs, {}, 0, 0);
    const labels = buildOutputLabels(map, outputs, {});
    labels.forEach((l, i) => {
        assert(l === '-', `S${i+1} expected - (0 motors), got ${l}`);
    });
});

runTest('Dedicated motor output when 0 motors needed: not assigned', () => {
    const outputs = makeOutputs([{ type: 'M', timerId: 0 }]);
    const overrides = { 0: TIMER_OUTPUT_MODE_MOTORS };
    const map = getTimerMap(outputs, overrides, 0, 0);
    const labels = buildOutputLabels(map, outputs, overrides);
    assert(labels[0] === '-', `S1 expected - (0 motors needed), got ${labels[0]}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-8: LED outputs
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nTC-8: LED outputs');

runTest('LED output assigned in Pass 1 (auto pass only)', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 },
        { type: 'L', timerId: 1 },
    ]);
    const map = getTimerMap(outputs, {}, 1, 0);
    const labels = buildOutputLabels(map, outputs, {});
    assert(labels[0] === 'Motor 1', `S1 expected Motor 1, got ${labels[0]}`);
    assert(labels[1] === 'LED',     `S2 expected LED, got ${labels[1]}`);
});

runTest('LED output appears correctly with mixed motor/servo', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 },
        { type: 'S', timerId: 1 },
        { type: 'L', timerId: 2 },
    ]);
    const map = getTimerMap(outputs, {}, 1, 1);
    const labels = buildOutputLabels(map, outputs, {});
    assert(labels[0] === 'Motor 1', `S1 expected Motor 1, got ${labels[0]}`);
    assert(labels[1] === 'Servo 1', `S2 expected Servo 1, got ${labels[1]}`);
    assert(labels[2] === 'LED',     `S3 expected LED, got ${labels[2]}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// TC-9: Dedicated outputs at the START of the list (no numbering mismatch)
// When dedicated outputs are at the beginning, array order = assignment order
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nTC-9: Dedicated outputs at start (JS and firmware agree)');

runTest('Dedicated motors at S1+S2, auto at S3+S4: both agree Motor1=S1, Motor2=S2', () => {
    const outputs = makeOutputs([
        { type: 'M', timerId: 0 }, { type: 'M', timerId: 1 },  // dedicated
        { type: 'M', timerId: 2 }, { type: 'M', timerId: 3 },  // auto
    ]);
    const overrides = { 0: TIMER_OUTPUT_MODE_MOTORS, 1: TIMER_OUTPUT_MODE_MOTORS };
    const jsLabels = buildOutputLabels(getTimerMap(outputs, overrides, 2, 0), outputs, overrides);
    const fwLabels = buildFirmwareLabels(outputs, overrides, 2, 0);
    assert(JSON.stringify(jsLabels) === JSON.stringify(fwLabels),
        `JS: [${jsLabels}] != FW: [${fwLabels}]`);
    assert(jsLabels[0] === 'Motor 1', `S1 expected Motor 1, got ${jsLabels[0]}`);
    assert(jsLabels[1] === 'Motor 2', `S2 expected Motor 2, got ${jsLabels[1]}`);
});

// ═══════════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n' + '='.repeat(60));
console.log(`Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
    console.log('\nAll tests PASSED.');
} else {
    console.log('\nFAILED tests:');
    failures.forEach(f => {
        console.log(`  - ${f.name}`);
        console.log(`    ${f.error}`);
    });
    process.exit(1);
}
