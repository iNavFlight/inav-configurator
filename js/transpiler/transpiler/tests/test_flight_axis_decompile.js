#!/usr/bin/env node

/**
 * Test flight axis override decompilation (without warnings)
 */

import { Decompiler } from '../decompiler.js';

console.log('Testing Flight Axis Decompilation (No Warnings Expected)...\n');

// Test 1: Roll angle override
const decompiler1 = new Decompiler();
const result1 = decompiler1.decompile([
  {
    enabled: 1,
    activatorId: -1,
    operation: 45, // FLIGHT_AXIS_ANGLE_OVERRIDE
    operandAType: 0,
    operandAValue: 0, // roll
    operandBType: 0,
    operandBValue: 45,
    flags: 0
  }
]);

console.log('Test 1: Roll Angle Override');
console.log('Success:', result1.success);
console.log('Code:', result1.code);
console.log('Warnings:', result1.warnings);
console.log('');

// Test 2: Pitch rate override
const decompiler2 = new Decompiler();
const result2 = decompiler2.decompile([
  {
    enabled: 1,
    activatorId: -1,
    operation: 46, // FLIGHT_AXIS_RATE_OVERRIDE
    operandAType: 0,
    operandAValue: 1, // pitch
    operandBType: 0,
    operandBValue: 100,
    flags: 0
  }
]);

console.log('Test 2: Pitch Rate Override');
console.log('Success:', result2.success);
console.log('Code:', result2.code);
console.log('Warnings:', result2.warnings);
console.log('');

// Test 3: Yaw angle override
const decompiler3 = new Decompiler();
const result3 = decompiler3.decompile([
  {
    enabled: 1,
    activatorId: -1,
    operation: 45, // FLIGHT_AXIS_ANGLE_OVERRIDE
    operandAType: 0,
    operandAValue: 2, // yaw
    operandBType: 0,
    operandBValue: 180,
    flags: 0
  }
]);

console.log('Test 3: Yaw Angle Override');
console.log('Success:', result3.success);
console.log('Code:', result3.code);
console.log('Warnings:', result3.warnings);
console.log('');

// Verify no warnings
const allWarnings = [...result1.warnings, ...result2.warnings, ...result3.warnings];
const flightAxisWarnings = allWarnings.filter(w => w.includes('FLIGHT_AXIS'));

if (flightAxisWarnings.length === 0) {
  console.log('✅ SUCCESS: No flight axis warnings generated');
  process.exit(0);
} else {
  console.log('❌ FAILURE: Flight axis warnings still present:');
  flightAxisWarnings.forEach(w => console.log('  -', w));
  process.exit(1);
}
