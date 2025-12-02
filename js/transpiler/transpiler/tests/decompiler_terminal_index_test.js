/**
 * Test: Decompiler Terminal Condition Index
 *
 * Verifies that the decompiler shows the correct (terminal) condition index
 * in the "// Condition can be read by logicCondition[N]" comment.
 *
 * Run with: node js/transpiler/tests/decompiler_terminal_index_test.js
 */

import { Decompiler } from '../transpiler/decompiler.js';

// Test case: Chained logic conditions (from original INAV config)
// First chain: 0 -> 1 -> 2 (terminal is 2)
// Second chain: 19 -> 20 -> 21 -> 22 (terminal is 22)
const testLogicConditions = [
  // First chain: mixerTransitionActive && isArmed && groundSpeed > 1111
  { index: 0, enabled: 1, activatorId: -1, operation: 1, operandAType: 2, operandAValue: 39, operandBType: 0, operandBValue: 1, flags: 0 },
  { index: 1, enabled: 1, activatorId: 0, operation: 1, operandAType: 2, operandAValue: 17, operandBType: 0, operandBValue: 1, flags: 0 },
  { index: 2, enabled: 1, activatorId: 1, operation: 2, operandAType: 2, operandAValue: 9, operandBType: 0, operandBValue: 1111, flags: 0 },
  // Gap (disabled conditions 3-18)
  ...Array.from({ length: 16 }, (_, i) => ({ index: i + 3, enabled: 0, activatorId: -1, operation: 0, operandAType: 0, operandAValue: 0, operandBType: 0, operandBValue: 0, flags: 0 })),
  // Second chain: activeMixerProfile && isArmed && isAutoLaunch === 0 && airSpeed < 1111
  { index: 19, enabled: 1, activatorId: -1, operation: 1, operandAType: 2, operandAValue: 38, operandBType: 0, operandBValue: 1, flags: 0 },
  { index: 20, enabled: 1, activatorId: 19, operation: 1, operandAType: 2, operandAValue: 17, operandBType: 0, operandBValue: 1, flags: 0 },
  { index: 21, enabled: 1, activatorId: 20, operation: 1, operandAType: 2, operandAValue: 18, operandBType: 0, operandBValue: 0, flags: 0 },
  { index: 22, enabled: 1, activatorId: 21, operation: 3, operandAType: 2, operandAValue: 11, operandBType: 0, operandBValue: 1111, flags: 0 },
];

function runTest() {
  console.log('=== Decompiler Terminal Index Test ===\n');

  const decompiler = new Decompiler();
  const result = decompiler.decompile(testLogicConditions);

  console.log('Test: Decompile chained conditions and verify terminal indices\n');

  let passed = true;

  // Test 1: Decompilation should succeed
  if (!result.success) {
    console.log('FAIL: Decompilation failed:', result.error);
    passed = false;
  } else {
    console.log('PASS: Decompilation succeeded');
  }

  // Test 2: First chain should reference logicCondition[2] (not 0)
  if (!result.code.includes('logicCondition[2]')) {
    console.log('FAIL: First chain should reference logicCondition[2]');
    passed = false;
  } else {
    console.log('PASS: First chain references logicCondition[2]');
  }

  // Test 3: Second chain should reference logicCondition[22] (not 19)
  if (!result.code.includes('logicCondition[22]')) {
    console.log('FAIL: Second chain should reference logicCondition[22]');
    passed = false;
  } else {
    console.log('PASS: Second chain references logicCondition[22]');
  }

  // Test 4: Should NOT reference the first condition indices (0 or 19) for readable conditions
  const wrongRefs = result.code.match(/logicCondition\[(0|19)\]/g);
  if (wrongRefs && wrongRefs.length > 0) {
    console.log('FAIL: Should not reference first condition indices:', wrongRefs);
    passed = false;
  } else {
    console.log('PASS: Does not reference first condition indices incorrectly');
  }

  console.log('\n--- Generated Code ---');
  console.log(result.code);

  console.log('\n=== Test Result: ' + (passed ? 'PASSED' : 'FAILED') + ' ===\n');

  if (!passed) {
    process.exit(1);
  }
}

runTest();
