/**
 * Test: OR Condition Handling
 *
 * Verifies that OR conditions use explicit OR operations (not chained activators).
 *
 * Run with: node js/transpiler/tests/or_condition_test.js
 */

import { Transpiler } from '../index.js';

// Test case: Code with OR conditions
const testCode = `const { flight, gvar } = inav;

if (flight.isArmed === 1 || flight.groundSpeed > 100) {
  gvar[0] = 1;
}`;

function runTest() {
  console.log('=== OR Condition Test ===\n');

  const transpiler = new Transpiler();
  const result = transpiler.transpile(testCode);

  console.log('Test: Transpile if statements with OR conditions');
  console.log('Expected: Should use explicit OR operation\n');

  let passed = true;

  // Test 1: Transpilation should succeed
  if (!result.success) {
    console.log('FAIL: Transpilation failed with error:', result.error);
    passed = false;
  } else {
    console.log('PASS: Transpilation succeeded');
  }

  // Test 2: Should produce output commands
  if (result.commands.length === 0) {
    console.log('FAIL: No commands generated');
    passed = false;
  } else {
    console.log(`PASS: Generated ${result.commands.length} logic commands`);
  }

  // Test 3: Should contain an OR operation (operation 8)
  const hasOrOp = result.commands.some(cmd => {
    const parts = cmd.split(' ');
    return parts[4] === '8'; // Operation 8 is OR
  });

  if (!hasOrOp) {
    console.log('FAIL: No OR operation found in output');
    passed = false;
  } else {
    console.log('PASS: OR operation found in output');
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
