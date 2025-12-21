#!/usr/bin/env node

/**
 * Comprehensive tests for override architecture
 * Tests both the centralized API mapping and compile/decompile round-trip
 */

import { Transpiler } from '../index.js';
import { Decompiler } from '../decompiler.js';
import { buildForwardMapping } from '../api_mapping_utility.js';
import apiDefinitions from '../../api/definitions/index.js';
import { OPERATION } from '../inav_constants.js';

// Test utilities
function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

function assertDefined(value, message) {
  if (value === undefined || value === null) {
    throw new Error(`${message}\n  Value is undefined/null`);
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

let passed = 0;
let failed = 0;

// ============================================================
// PART 1: buildForwardMapping() tests
// ============================================================

console.log('\n📦 Part 1: buildForwardMapping() Architecture Tests\n');

const mapping = buildForwardMapping(apiDefinitions);

// Test: Top-level operations are extracted
passed += runTest('extracts top-level inavOperation (override.throttle)', () => {
  assertDefined(mapping['override.throttle'], 'override.throttle should be in mapping');
  assertDefined(mapping['override.throttle'].operation, 'should have .operation');
  assertEquals(mapping['override.throttle'].operation, OPERATION.OVERRIDE_THROTTLE, 'operation should be OVERRIDE_THROTTLE');
});

passed += runTest('extracts top-level inavOperation (override.throttleScale)', () => {
  assertDefined(mapping['override.throttleScale']?.operation, 'should have .operation');
  assertEquals(mapping['override.throttleScale'].operation, OPERATION.OVERRIDE_THROTTLE_SCALE, 'operation code');
});

// Test: 2-level nested operations are extracted (override.vtx.power)
passed += runTest('extracts 2-level nested inavOperation (override.vtx.power)', () => {
  assertDefined(mapping['override.vtx.power'], 'override.vtx.power should be in mapping');
  assertDefined(mapping['override.vtx.power'].operation, 'should have .operation');
  assertEquals(mapping['override.vtx.power'].operation, OPERATION.SET_VTX_POWER_LEVEL, 'operation code');
});

passed += runTest('extracts 2-level nested inavOperation (override.vtx.band)', () => {
  assertDefined(mapping['override.vtx.band']?.operation, 'should have .operation');
  assertEquals(mapping['override.vtx.band'].operation, OPERATION.SET_VTX_BAND, 'operation code');
});

passed += runTest('extracts 2-level nested inavOperation (override.vtx.channel)', () => {
  assertDefined(mapping['override.vtx.channel']?.operation, 'should have .operation');
  assertEquals(mapping['override.vtx.channel'].operation, OPERATION.SET_VTX_CHANNEL, 'operation code');
});

// Test: 3-level nested operations are extracted (override.flightAxis.roll.angle)
passed += runTest('extracts 3-level nested inavOperation (override.flightAxis.roll.angle)', () => {
  assertDefined(mapping['override.flightAxis.roll.angle'], 'override.flightAxis.roll.angle should be in mapping');
  assertDefined(mapping['override.flightAxis.roll.angle'].operation, 'should have .operation');
  assertEquals(mapping['override.flightAxis.roll.angle'].operation, OPERATION.FLIGHT_AXIS_ANGLE_OVERRIDE, 'operation code');
});

passed += runTest('extracts 3-level nested inavOperation (override.flightAxis.pitch.rate)', () => {
  assertDefined(mapping['override.flightAxis.pitch.rate']?.operation, 'should have .operation');
  assertEquals(mapping['override.flightAxis.pitch.rate'].operation, OPERATION.FLIGHT_AXIS_RATE_OVERRIDE, 'operation code');
});

passed += runTest('extracts 3-level nested inavOperation (override.flightAxis.yaw.angle)', () => {
  assertDefined(mapping['override.flightAxis.yaw.angle']?.operation, 'should have .operation');
  assertEquals(mapping['override.flightAxis.yaw.angle'].operation, OPERATION.FLIGHT_AXIS_ANGLE_OVERRIDE, 'operation code');
});

// ============================================================
// PART 2: All override operations compile correctly
// ============================================================

console.log('\n📦 Part 2: Override Compilation Tests\n');

const compileTests = [
  // Existing operations
  { name: 'override.throttle', code: 'override.throttle = 1500;', op: OPERATION.OVERRIDE_THROTTLE },
  { name: 'override.throttleScale', code: 'override.throttleScale = 75;', op: OPERATION.OVERRIDE_THROTTLE_SCALE },
  { name: 'override.vtx.power', code: 'override.vtx.power = 3;', op: OPERATION.SET_VTX_POWER_LEVEL },
  { name: 'override.vtx.band', code: 'override.vtx.band = 2;', op: OPERATION.SET_VTX_BAND },
  { name: 'override.vtx.channel', code: 'override.vtx.channel = 5;', op: OPERATION.SET_VTX_CHANNEL },
  { name: 'override.armSafety', code: 'override.armSafety = true;', op: OPERATION.OVERRIDE_ARMING_SAFETY },
  { name: 'override.osdLayout', code: 'override.osdLayout = 2;', op: OPERATION.SET_OSD_LAYOUT },
  { name: 'override.loiterRadius', code: 'override.loiterRadius = 5000;', op: OPERATION.LOITER_OVERRIDE },
  { name: 'override.minGroundSpeed', code: 'override.minGroundSpeed = 10;', op: OPERATION.OVERRIDE_MIN_GROUND_SPEED },
  { name: 'override.flightAxis.roll.angle', code: 'override.flightAxis.roll.angle = 30;', op: OPERATION.FLIGHT_AXIS_ANGLE_OVERRIDE },
  { name: 'override.flightAxis.pitch.rate', code: 'override.flightAxis.pitch.rate = 100;', op: OPERATION.FLIGHT_AXIS_RATE_OVERRIDE },

  // Previously missing operations (from parity check)
  { name: 'override.swapRollYaw', code: 'override.swapRollYaw = true;', op: OPERATION.SWAP_ROLL_YAW },
  { name: 'override.invertRoll', code: 'override.invertRoll = true;', op: OPERATION.INVERT_ROLL },
  { name: 'override.invertPitch', code: 'override.invertPitch = true;', op: OPERATION.INVERT_PITCH },
  { name: 'override.invertYaw', code: 'override.invertYaw = true;', op: OPERATION.INVERT_YAW },
  { name: 'override.headingTarget', code: 'override.headingTarget = 180;', op: OPERATION.SET_HEADING_TARGET },
  { name: 'override.profile', code: 'override.profile = 2;', op: OPERATION.SET_PROFILE },
  { name: 'override.gimbalSensitivity', code: 'override.gimbalSensitivity = 50;', op: OPERATION.SET_GIMBAL_SENSITIVITY },
  { name: 'override.disableGpsFix', code: 'override.disableGpsFix = true;', op: OPERATION.DISABLE_GPS_FIX },
  { name: 'override.resetMagCalibration', code: 'override.resetMagCalibration = true;', op: OPERATION.RESET_MAG_CALIBRATION },
];

for (const test of compileTests) {
  const testResult = runTest(`compile ${test.name}`, () => {
    const fullCode = `const { override } = inav;\n${test.code}`;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(fullCode);

    if (!result.success) {
      throw new Error(`Compilation failed: ${result.error || JSON.stringify(result.errors)}`);
    }

    // Verify correct operation code is generated
    const commandStr = result.commands.join(' ');
    assertContains(commandStr, String(test.op), `Should contain operation ${test.op}`);
  });

  if (testResult) passed++; else failed++;
}

// ============================================================
// PART 3: Round-trip (compile then decompile) tests
// ============================================================

console.log('\n📦 Part 3: Round-Trip Tests (Compile → Decompile)\n');

/**
 * Parse CLI command string into LC object
 * Format: "logic INDEX ENABLED ACTIVATOR OP OPA_TYPE OPA_VAL OPB_TYPE OPB_VAL FLAGS"
 */
function parseLogicCommand(cmd) {
  const parts = cmd.split(' ');
  if (parts[0] !== 'logic') return null;
  return {
    index: parseInt(parts[1]),
    enabled: parseInt(parts[2]),
    activatorId: parseInt(parts[3]),
    operation: parseInt(parts[4]),
    operandAType: parseInt(parts[5]),
    operandAValue: parseInt(parts[6]),
    operandBType: parseInt(parts[7]),
    operandBValue: parseInt(parts[8]),
    flags: parseInt(parts[9]) || 0
  };
}

const roundTripTests = [
  { name: 'override.throttle', code: 'override.throttle = 1500;', expect: 'override.throttle' },
  { name: 'override.vtx.power', code: 'override.vtx.power = 3;', expect: 'override.vtx.power' },
  { name: 'override.flightAxis.roll.angle', code: 'override.flightAxis.roll.angle = 30;', expect: 'override.flightAxis.roll.angle' },
  { name: 'override.swapRollYaw', code: 'override.swapRollYaw = true;', expect: 'override.swapRollYaw' },
  { name: 'override.headingTarget', code: 'override.headingTarget = 180;', expect: 'override.headingTarget' },
];

for (const test of roundTripTests) {
  const testResult = runTest(`round-trip ${test.name}`, () => {
    const fullCode = `const { override } = inav;\n${test.code}`;
    const transpiler = new Transpiler();
    const compileResult = transpiler.transpile(fullCode);

    if (!compileResult.success) {
      throw new Error(`Compilation failed: ${compileResult.error || JSON.stringify(compileResult.errors)}`);
    }

    // Parse CLI commands back to LC objects
    const logicConditions = compileResult.commands
      .map(parseLogicCommand)
      .filter(lc => lc !== null);

    if (logicConditions.length === 0) {
      throw new Error('No logic conditions generated');
    }

    // Decompile the result using Decompiler class directly
    const decompiler = new Decompiler();
    const decompiled = decompiler.decompile(logicConditions);

    if (!decompiled.success) {
      throw new Error(`Decompilation failed: ${decompiled.error || JSON.stringify(decompiled.errors)}`);
    }

    // Verify decompiled code contains the expected property
    assertContains(decompiled.code, test.expect, `Decompiled should contain ${test.expect}`);
  });

  if (testResult) passed++; else failed++;
}

// ============================================================
// Summary
// ============================================================

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
