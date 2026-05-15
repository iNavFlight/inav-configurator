#!/usr/bin/env node

/**
 * Test for missing override operations identified in parity check
 * These operations are handled by decompiler but NOT by compiler
 */

import { Transpiler } from '../index.js';

const missingOperations = [
  { name: 'swapRollYaw', code: 'override.swapRollYaw = true;' },
  { name: 'invertRoll', code: 'override.invertRoll = true;' },
  { name: 'invertPitch', code: 'override.invertPitch = true;' },
  { name: 'invertYaw', code: 'override.invertYaw = true;' },
  { name: 'headingTarget', code: 'override.headingTarget = 180;' },
  { name: 'profile', code: 'override.profile = 2;' },
  { name: 'gimbalSensitivity', code: 'override.gimbalSensitivity = 50;' },
  { name: 'disableGpsFix', code: 'override.disableGpsFix = true;' },
  { name: 'resetMagCalibration', code: 'override.resetMagCalibration = true;' },
];

console.log('Testing override operations (should all pass)...\n');

let passedCount = 0;
let failedCount = 0;

for (const op of missingOperations) {
  const code = `const { override } = inav;\n${op.code}`;
  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);

  if (result.success) {
    console.log(`  ✅ ${op.name}`);
    passedCount++;
  } else {
    console.log(`  ❌ ${op.name} - FAILED: ${result.error || JSON.stringify(result.errors)}`);
    failedCount++;
  }
}

console.log('\n==================================================');
console.log(`Passed: ${passedCount}`);
console.log(`Failed: ${failedCount}`);

if (failedCount > 0) {
  console.log('\n❌ Some override operations failed!');
  process.exit(1);
} else {
  console.log('\n✅ All override operations work!');
  process.exit(0);
}
