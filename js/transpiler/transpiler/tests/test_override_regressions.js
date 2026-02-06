#!/usr/bin/env node

/**
 * Regression tests for override functionality
 * Tests that existing override operations still work after flight axis changes
 */

import { Transpiler } from '../index.js';
import { Decompiler } from '../decompiler.js';

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

function assertContains(str, substring, message) {
  if (!str.includes(substring)) {
    throw new Error(`${message}\n  String does not contain: ${substring}\n  Actual: ${str}`);
  }
}

function runTest(name, testFn) {
  try {
    testFn();
    console.log(`  ✅ ${name}`);
    return true;
  } catch (error) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${error.message}`);
    return false;
  }
}

console.log('📦 Override Regression Tests\n');

let passed = 0;
let failed = 0;

// Test 1: Basic throttle override still works
if (runTest('throttle override compiles', () => {
  const code = `
const { flight, override } = inav;
if (flight.isArmed) {
  override.throttle = 1500;
}`;
  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);
  if (!result.success) {
    throw new Error(`Compilation failed: ${result.error}`);
  }
  assertEquals(result.success, true, 'Compilation should succeed');
  assertContains(result.commands.join(' '), '29', 'Should contain operation 29 (OVERRIDE_THROTTLE)');
})) {
  passed++;
} else {
  failed++;
}

// Test 2: VTX override with nested object still works
if (runTest('vtx.power override compiles', () => {
  const code = `
const { flight, override } = inav;
if (flight.homeDistance > 100) {
  override.vtx.power = 3;
}`;
  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);
  if (!result.success) {
    throw new Error(`Compilation failed: ${result.error}`);
  }
  assertEquals(result.success, true, 'Compilation should succeed');
  assertContains(result.commands.join(' '), '25', 'Should contain operation 25 (SET_VTX_POWER_LEVEL)');
})) {
  passed++;
} else {
  failed++;
}

// Test 3: VTX band override
if (runTest('vtx.band override compiles', () => {
  const code = `
const { override } = inav;
override.vtx.band = 2;
`;
  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);
  if (!result.success) {
    throw new Error(`Compilation failed: ${result.error}`);
  }
  assertContains(result.commands.join(' '), '30', 'Should contain operation 30 (SET_VTX_BAND)');
})) {
  passed++;
} else {
  failed++;
}

// Test 4: VTX channel override
if (runTest('vtx.channel override compiles', () => {
  const code = `
const { override } = inav;
override.vtx.channel = 5;
`;
  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);
  if (!result.success) {
    throw new Error(`Compilation failed: ${result.error}`);
  }
  assertContains(result.commands.join(' '), '31', 'Should contain operation 31 (SET_VTX_CHANNEL)');
})) {
  passed++;
} else {
  failed++;
}

// Test 5: Throttle scale override
if (runTest('throttleScale override compiles', () => {
  const code = `
const { override } = inav;
override.throttleScale = 75;
`;
  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);
  if (!result.success) {
    throw new Error(`Compilation failed: ${result.error}`);
  }
  assertContains(result.commands.join(' '), '23', 'Should contain operation 23 (OVERRIDE_THROTTLE_SCALE)');
})) {
  passed++;
} else {
  failed++;
}

// Test 6: Arm safety override
if (runTest('armSafety override compiles', () => {
  const code = `
const { override } = inav;
override.armSafety = true;
`;
  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);
  if (!result.success) {
    throw new Error(`Compilation failed: ${result.error}`);
  }
  assertContains(result.commands.join(' '), '22', 'Should contain operation 22 (OVERRIDE_ARMING_SAFETY)');
})) {
  passed++;
} else {
  failed++;
}

// Test 7: OSD layout override
if (runTest('osdLayout override compiles', () => {
  const code = `
const { override } = inav;
override.osdLayout = 2;
`;
  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);
  if (!result.success) {
    throw new Error(`Compilation failed: ${result.error}`);
  }
  assertContains(result.commands.join(' '), '32', 'Should contain operation 32 (SET_OSD_LAYOUT)');
})) {
  passed++;
} else {
  failed++;
}

// Test 8: Loiter radius override
if (runTest('loiterRadius override compiles', () => {
  const code = `
const { override } = inav;
override.loiterRadius = 5000;
`;
  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);
  if (!result.success) {
    throw new Error(`Compilation failed: ${result.error}`);
  }
  assertContains(result.commands.join(' '), '41', 'Should contain operation 41 (LOITER_OVERRIDE)');
})) {
  passed++;
} else {
  failed++;
}

// Test 9: Min ground speed override
if (runTest('minGroundSpeed override compiles', () => {
  const code = `
const { override } = inav;
override.minGroundSpeed = 10;
`;
  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);
  if (!result.success) {
    throw new Error(`Compilation failed: ${result.error}`);
  }
  assertContains(result.commands.join(' '), '56', 'Should contain operation 56 (OVERRIDE_MIN_GROUND_SPEED)');
})) {
  passed++;
} else {
  failed++;
}

// Test 10: Multiple overrides in one block
if (runTest('multiple overrides in same block', () => {
  const code = `
const { flight, override } = inav;
if (flight.isArmed) {
  override.throttle = 1500;
  override.vtx.power = 3;
}`;
  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);
  if (!result.success) {
    throw new Error(`Compilation failed: ${result.error}`);
  }
  assertContains(result.commands.join(' '), '29', 'Should contain OVERRIDE_THROTTLE');
  assertContains(result.commands.join(' '), '25', 'Should contain SET_VTX_POWER_LEVEL');
})) {
  passed++;
} else {
  failed++;
}

// Test 11: Flight axis override doesn't break other overrides
if (runTest('flight axis and regular overrides together', () => {
  const code = `
const { flight, override } = inav;
if (flight.isArmed) {
  override.flightAxis.roll.angle = 30;
  override.throttle = 1500;
  override.vtx.power = 3;
}`;
  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);
  if (!result.success) {
    throw new Error(`Compilation failed: ${result.error}`);
  }
  assertContains(result.commands.join(' '), '45', 'Should contain FLIGHT_AXIS_ANGLE_OVERRIDE');
  assertContains(result.commands.join(' '), '29', 'Should contain OVERRIDE_THROTTLE');
  assertContains(result.commands.join(' '), '25', 'Should contain SET_VTX_POWER_LEVEL');
})) {
  passed++;
} else {
  failed++;
}

// Test 12: Invalid override target should fail gracefully
if (runTest('invalid override target produces error', () => {
  const code = `
const { override } = inav;
override.invalidProperty = 100;
`;
  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);
  assertEquals(result.success, false, 'Compilation should fail');
})) {
  passed++;
} else {
  failed++;
}

// Test 13: Decompile existing overrides
if (runTest('decompile throttle override', () => {
  const decompiler = new Decompiler();
  const lcs = [
    {
      enabled: 1,
      activatorId: -1,
      operation: 29, // OVERRIDE_THROTTLE
      operandAType: 0,
      operandAValue: 1500,
      operandBType: 0,
      operandBValue: 0,
      flags: 0
    }
  ];
  const result = decompiler.decompile(lcs);
  if (!result.success) {
    throw new Error(`Decompilation failed: ${result.error || JSON.stringify(result)}`);
  }
  assertContains(result.code, 'override.throttle', 'Should contain override.throttle');
})) {
  passed++;
} else {
  failed++;
}

// Test 14: Decompile VTX power
if (runTest('decompile vtx.power override', () => {
  const decompiler = new Decompiler();
  const lcs = [
    {
      enabled: 1,
      activatorId: -1,
      operation: 25, // SET_VTX_POWER_LEVEL
      operandAType: 0,
      operandAValue: 3,
      operandBType: 0,
      operandBValue: 0,
      flags: 0
    }
  ];
  const result = decompiler.decompile(lcs);
  if (!result.success) {
    throw new Error(`Decompilation failed: ${result.error || JSON.stringify(result)}`);
  }
  assertContains(result.code, 'override.vtx.power', 'Should contain override.vtx.power');
})) {
  passed++;
} else {
  failed++;
}

console.log('\n==================================================');
console.log(`📊 Test Results:`);
console.log(`   Passed: ${passed}`);
console.log(`   Failed: ${failed}`);
console.log(`   Total:  ${passed + failed}`);

if (failed === 0) {
  console.log('\n✅ ALL TESTS PASSED');
  process.exit(0);
} else {
  console.log(`\n❌ ${failed} TEST(S) FAILED`);
  process.exit(1);
}
