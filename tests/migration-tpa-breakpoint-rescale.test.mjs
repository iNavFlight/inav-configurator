import test from 'node:test';
import assert from 'node:assert/strict';
import { rescaleTpaBreakpoint, computeRescale, tpaFactor } from '../js/migration/tpa_breakpoint_rescale.js';

const CFG = { fromBreakpoint: 1200, toBreakpoint: 1500 };
const IDLE = 1000 + 850 * 0.08; // defaults: min_command 1000, throttle_idle 8

const run = (text) => rescaleTpaBreakpoint(text.split('\n'), CFG);
const get = (lines, name) => {
    const m = lines.map((l) => l.match(new RegExp(`^set ${name} = (-?\\d+)$`))).find(Boolean);
    return m ? parseInt(m[1], 10) : null;
};

test('exact formula reproduces the old gain at every throttle', () => {
    for (const rate of [10, 20, 50, 80, 150]) {
        const { rate: r2, scale } = computeRescale(rate, 1200, 1500, IDLE);
        for (let T = 1300; T <= 1800; T += 50) {
            const oldG = tpaFactor(T, 1200, rate, IDLE);
            const newG = scale * tpaFactor(T, 1500, r2, IDLE);
            assert.ok(Math.abs(newG / oldG - 1) < 1e-9, `rate ${rate} T ${T}`);
        }
    }
});

test('same breakpoint is the identity', () => {
    const { rate, scale } = computeRescale(50, 1500, 1500, IDLE);
    assert.ok(Math.abs(rate - 50) < 1e-9);
    assert.ok(Math.abs(scale - 1) < 1e-9);
});

test('rescales rate and explicit gains for an explicit 1200 breakpoint', () => {
    const { lines, changes } = run([
        'control_profile 1', 'set tpa_rate = 20', 'set tpa_breakpoint = 1200',
        'set fw_p_pitch = 30', 'set fw_ff_pitch = 60',
    ].join('\n'));
    assert.equal(get(lines, 'tpa_breakpoint'), 1500);
    assert.equal(get(lines, 'tpa_rate'), 7);
    assert.equal(get(lines, 'fw_p_pitch'), 28);
    assert.equal(get(lines, 'fw_ff_pitch'), 56);
    assert.equal(changes.length, 1);
});

test('gains absent from a diff backup are written when the scale changes them', () => {
    const { lines } = run(['control_profile 1', 'set tpa_rate = 80', 'set tpa_breakpoint = 1200'].join('\n'));
    assert.equal(get(lines, 'tpa_rate'), 34);
    assert.equal(get(lines, 'fw_p_pitch'), 4);   // default 5 × 0.722
    assert.equal(get(lines, 'fw_ff_roll'), 36);  // default 50 × 0.722
});

test('other breakpoint values are left alone', () => {
    const text = ['control_profile 1', 'set tpa_rate = 40', 'set tpa_breakpoint = 1400', 'set fw_p_pitch = 30'].join('\n');
    const { lines, changes } = run(text);
    assert.equal(lines.join('\n'), text);
    assert.equal(changes.length, 0);
});

test('tpa_rate 0 only changes the breakpoint', () => {
    const { lines } = run(['control_profile 1', 'set tpa_breakpoint = 1200', 'set fw_p_pitch = 30'].join('\n'));
    assert.equal(get(lines, 'tpa_breakpoint'), 1500);
    assert.equal(get(lines, 'fw_p_pitch'), 30);
});

test('breakpoint at or below throttle idle is skipped with a warning', () => {
    const text = ['set min_command = 1000', 'set throttle_idle = 30', 'control_profile 1',
        'set tpa_rate = 20', 'set tpa_breakpoint = 1200'].join('\n'); // idle = 1255
    const { lines, warnings } = run(text);
    assert.equal(get(lines, 'tpa_breakpoint'), 1200);
    assert.equal(warnings.length, 1);
});

test('each control_profile section is migrated on its own', () => {
    const { lines } = run([
        'control_profile 1', 'set tpa_rate = 20', 'set tpa_breakpoint = 1200', 'set fw_p_pitch = 30',
        'control_profile 2', 'set tpa_rate = 20', 'set tpa_breakpoint = 1450', 'set fw_p_pitch = 30',
        'battery_profile 1', 'set tpa_breakpoint = 1200',
    ].join('\n'));
    const text = lines.join('\n');
    assert.equal((text.match(/set fw_p_pitch = 28/g) || []).length, 1);
    assert.equal((text.match(/set fw_p_pitch = 30/g) || []).length, 1);
    assert.match(text, /set tpa_breakpoint = 1450/);
    assert.match(text, /battery_profile 1\nset tpa_breakpoint = 1200/); // not a control_profile section
});

test('wing preset (tpa_rate 80) stays within a few percent after rounding', () => {
    const { lines } = run(['control_profile 1', 'set tpa_rate = 80', 'set tpa_breakpoint = 1200',
        'set fw_p_pitch = 25', 'set fw_ff_pitch = 70'].join('\n'));
    const rate = get(lines, 'tpa_rate');
    for (const [name, base] of [['fw_p_pitch', 25], ['fw_ff_pitch', 70]]) {
        for (let T = 1300; T <= 1800; T += 50) {
            const oldG = base * tpaFactor(T, 1200, 80, IDLE);
            const newG = get(lines, name) * tpaFactor(T, 1500, rate, IDLE);
            assert.ok(Math.abs(newG / oldG - 1) < 0.05, `${name} T ${T}`);
        }
    }
});
