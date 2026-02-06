#!/usr/bin/env node

/**
 * Round-trip test: Compile → Decompile should preserve values
 *
 * This test verifies that numeric values in override operations
 * survive the compile→decompile round-trip.
 */

import { Transpiler } from '../index.js';
import { Decompiler } from '../decompiler.js';

/**
 * Parse CLI command string into LC object
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

/**
 * Compile code, then decompile back, return decompiled code
 */
function roundTrip(code) {
  const fullCode = `const { override, flight, rc } = inav;\n${code}`;

  // Compile
  const transpiler = new Transpiler();
  const compileResult = transpiler.transpile(fullCode);

  if (!compileResult.success) {
    return { success: false, error: `Compile failed: ${compileResult.error || JSON.stringify(compileResult.errors)}` };
  }

  // Parse CLI commands to LC objects
  const logicConditions = compileResult.commands
    .map(parseLogicCommand)
    .filter(lc => lc !== null);

  if (logicConditions.length === 0) {
    return { success: false, error: 'No logic conditions generated' };
  }

  // Decompile
  const decompiler = new Decompiler();
  const decompileResult = decompiler.decompile(logicConditions);

  if (!decompileResult.success) {
    return { success: false, error: `Decompile failed: ${decompileResult.error}` };
  }

  return { success: true, code: decompileResult.code };
}

/**
 * Check if decompiled code contains expected value assignment
 */
function assertContainsAssignment(decompiled, property, value, testName) {
  // Match patterns like: override.property = value; or override.property = value
  const pattern = new RegExp(`override\\.${property}\\s*=\\s*${value}\\s*;?`);
  if (!pattern.test(decompiled)) {
    return { pass: false, message: `${testName}: Expected "override.${property} = ${value}" not found in:\n${decompiled}` };
  }
  return { pass: true };
}

// Test cases: [name, code, property, expectedValue]
const testCases = [
  // headingTarget
  ['headingTarget = 0', 'override.headingTarget = 0;', 'headingTarget', 0],
  ['headingTarget = 180', 'override.headingTarget = 180;', 'headingTarget', 180],
  ['headingTarget = 90', 'override.headingTarget = 90;', 'headingTarget', 90],

  // profile
  ['profile = 0', 'override.profile = 0;', 'profile', 0],
  ['profile = 1', 'override.profile = 1;', 'profile', 1],
  ['profile = 2', 'override.profile = 2;', 'profile', 2],

  // gimbalSensitivity
  ['gimbalSensitivity = 0', 'override.gimbalSensitivity = 0;', 'gimbalSensitivity', 0],
  ['gimbalSensitivity = 25', 'override.gimbalSensitivity = 25;', 'gimbalSensitivity', 25],
  ['gimbalSensitivity = 50', 'override.gimbalSensitivity = 50;', 'gimbalSensitivity', 50],
  ['gimbalSensitivity = 100', 'override.gimbalSensitivity = 100;', 'gimbalSensitivity', 100],

  // throttle (existing, should work)
  ['throttle = 1500', 'override.throttle = 1500;', 'throttle', 1500],
  ['throttle = 1000', 'override.throttle = 1000;', 'throttle', 1000],

  // throttleScale (existing, should work)
  ['throttleScale = 50', 'override.throttleScale = 50;', 'throttleScale', 50],
  ['throttleScale = 75', 'override.throttleScale = 75;', 'throttleScale', 75],

  // loiterRadius (existing, should work)
  ['loiterRadius = 5000', 'override.loiterRadius = 5000;', 'loiterRadius', 5000],

  // minGroundSpeed (existing, should work)
  ['minGroundSpeed = 10', 'override.minGroundSpeed = 10;', 'minGroundSpeed', 10],

  // Conditional assignments (value should survive)
  ['conditional headingTarget', 'if (rc[5].high) { override.headingTarget = 270; }', 'headingTarget', 270],
  ['conditional profile', 'if (rc[5].high) { override.profile = 1; }', 'profile', 1],
  ['conditional gimbalSensitivity', 'if (rc[5].high) { override.gimbalSensitivity = 75; }', 'gimbalSensitivity', 75],
];

console.log('Round-Trip Value Preservation Tests\n');
console.log('Testing that numeric values survive compile → decompile\n');

let passed = 0;
let failed = 0;

for (const [name, code, property, expectedValue] of testCases) {
  const result = roundTrip(code);

  if (!result.success) {
    console.log(`  ❌ ${name}`);
    console.log(`     ${result.error}`);
    failed++;
    continue;
  }

  const check = assertContainsAssignment(result.code, property, expectedValue, name);

  if (check.pass) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.log(`  ❌ ${name}`);
    console.log(`     ${check.message}`);
    failed++;
  }
}

console.log('\n==================================================');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  console.log(`\n❌ ${failed} test(s) failed - values not preserved in round-trip`);
  process.exit(1);
} else {
  console.log('\n✅ All values preserved in round-trip');
  process.exit(0);
}
