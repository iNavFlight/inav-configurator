/**
 * Test: Readable Logic Conditions (Empty Body If Statements)
 *
 * This tests the fix for the transpiler empty output bug where if statements
 * with only comments in the body (readable conditions) were being discarded.
 *
 * Run with: node js/transpiler/tests/readable_condition_test.js
 */

import { Transpiler } from '../index.js';

// Test case: Decompiled code with readable conditions
const testCode = `const { flight, override, rc, gvar } = inav;

if (flight.mixerTransitionActive === 1 && flight.isArmed === 1 && flight.groundSpeed > 1111) {
  // Condition can be read by logicCondition[0]
}

if (flight.activeMixerProfile === 1 && flight.isArmed === 1 && flight.isAutoLaunch === 0 && flight.airSpeed < 1111) {
  // Condition can be read by logicCondition[19]
}`;

function runTest() {
  console.log('=== Readable Condition Test ===\n');

  const transpiler = new Transpiler();
  const result = transpiler.transpile(testCode);

  console.log('Test: Transpile if statements with only comments in body');
  console.log('Expected: Should produce logic conditions (not empty)\n');

  let passed = true;

  // Test 1: Transpilation should succeed
  if (!result.success) {
    console.log('FAIL: Transpilation failed with error:', result.error);
    passed = false;
  } else {
    console.log('PASS: Transpilation succeeded');
  }

  // Test 2: Should produce some output commands
  if (result.commands.length === 0) {
    console.log('FAIL: No commands generated (empty output)');
    passed = false;
  } else {
    console.log(`PASS: Generated ${result.commands.length} logic commands`);
  }

  // Test 3: Should have the expected number of conditions using chained activators
  // First condition: 3 comparisons chained = 3 logic conditions
  // Second condition: 4 comparisons chained = 4 logic conditions
  // Total: 7 logic conditions (matches original INAV output)
  const expectedCommands = 7;
  if (result.commands.length !== expectedCommands) {
    console.log(`FAIL: Expected exactly ${expectedCommands} commands (chained activators), got ${result.commands.length}`);
    passed = false;
  } else {
    console.log(`PASS: Generated optimal ${result.commands.length} commands (chained activators)`);
  }

  // Test 4: No errors in warnings
  if (result.warnings?.errors?.length > 0) {
    console.log('FAIL: Errors in warnings:', result.warnings.errors);
    passed = false;
  } else {
    console.log('PASS: No errors in warnings');
  }

  console.log('\n--- Generated Commands ---');
  result.commands.forEach((cmd, i) => console.log(`  ${i}: ${cmd}`));

  console.log('\n=== Test Result: ' + (passed ? 'PASSED' : 'FAILED') + ' ===\n');

  if (!passed) {
    process.exit(1);
  }
}

runTest();
