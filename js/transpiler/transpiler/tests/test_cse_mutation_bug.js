#!/usr/bin/env node
/**
 * Test for CSE Mutation Bug
 *
 * The Common Subexpression Elimination (CSE) incorrectly reuses expressions
 * when the underlying variable has been mutated between uses.
 *
 * Bug: When gvar[1]++ is executed inside an if body, the CSE cache should
 * be invalidated for any expressions referencing gvar[1]. Currently it's not,
 * causing the second `if (gvar[1] < 2)` to reuse the first check instead of
 * generating a new comparison.
 */

'use strict';

import { Transpiler } from '../index.js';

const transpiler = new Transpiler();

console.log('=== CSE Mutation Bug Tests ===\n');

let passed = 0;
let failed = 0;

function test(name, code, validate) {
  console.log(`Test: ${name}`);
  console.log('Code:', code.trim());

  const result = transpiler.transpile(code);

  if (!result.success) {
    console.log('ERROR:', result.error);
    failed++;
    console.log('FAILED\n');
    return;
  }

  console.log('Commands:');
  result.commands.forEach(cmd => console.log('  ' + cmd));

  try {
    validate(result);
    console.log('PASSED\n');
    passed++;
  } catch (err) {
    console.log('FAILED:', err.message, '\n');
    failed++;
  }
}

// Helper to count specific operations in commands
function countOperation(commands, opCode) {
  return commands.filter(cmd => {
    const parts = cmd.split(' ');
    // Format: logic <index> 1 <activator> <operation> ...
    return parts.length >= 5 && parts[4] === String(opCode);
  }).length;
}

// Operation codes from inav_constants.js
const OPERATION = {
  EQUAL: 1,         // ==
  GREATER_THAN: 2,  // >
  LOWER_THAN: 3,    // <
  GVAR_SET: 18,
  GVAR_INC: 19,
  GVAR_DEC: 20,
};

// Test 1: Basic CSE mutation bug - increment inside if body
test('CSE should invalidate cache after gvar mutation (increment)',
`const { gvar } = inav;

if (gvar[1] < 2) {
  gvar[1]++;
}

if (gvar[1] < 2) {
  gvar[1]++;
}`,
(result) => {
  // Should have TWO separate gvar[1] < 2 comparisons (LOWER_THAN operations)
  const ltCount = countOperation(result.commands, OPERATION.LOWER_THAN);

  if (ltCount !== 2) {
    throw new Error(`Expected 2 LOWER_THAN operations for two 'gvar[1] < 2' checks, got ${ltCount}. CSE incorrectly reused the first condition.`);
  }
});


// Test 2: Assignment mutation inside if body
test('CSE should invalidate cache after gvar assignment',
`const { gvar } = inav;

if (gvar[1] < 2) {
  gvar[1] = gvar[1] + 1;
}

if (gvar[1] < 2) {
  gvar[1] = gvar[1] + 1;
}`,
(result) => {
  // Should have TWO separate gvar[1] < 2 comparisons
  const ltCount = countOperation(result.commands, OPERATION.LOWER_THAN);

  if (ltCount !== 2) {
    throw new Error(`Expected 2 LOWER_THAN operations, got ${ltCount}. CSE incorrectly reused the first condition after assignment.`);
  }
});


// Test 3: Pre-increment before if statements
test('CSE should invalidate cache after pre-increment',
`const { gvar } = inav;

gvar[1]++;

if (gvar[1] < 2) {
  gvar[1] = gvar[1] + 1;
}

if (gvar[1] < 2) {
  gvar[1] = gvar[1] + 1;
}`,
(result) => {
  // Should have TWO separate gvar[1] < 2 comparisons
  const ltCount = countOperation(result.commands, OPERATION.LOWER_THAN);

  if (ltCount !== 2) {
    throw new Error(`Expected 2 LOWER_THAN operations, got ${ltCount}. CSE incorrectly reused condition after pre-increment.`);
  }
});


// Test 4: Unrelated mutation should NOT invalidate cache
test('CSE should NOT invalidate cache for unrelated gvar mutation',
`const { gvar } = inav;

gvar[2] = 5;

if (gvar[1] < 2) {
  gvar[2]++;
}

if (gvar[1] < 2) {
  gvar[2]++;
}`,
(result) => {
  // SHOULD reuse the condition since gvar[2] doesn't affect gvar[1]
  // So only ONE LOWER_THAN operation should exist
  const ltCount = countOperation(result.commands, OPERATION.LOWER_THAN);

  if (ltCount !== 1) {
    throw new Error(`Expected 1 LOWER_THAN operation (CSE should reuse since gvar[2] doesn't affect gvar[1]), got ${ltCount}`);
  }
});


// Test 5: Multiple mutations in sequence
test('CSE should track mutations across multiple increments',
`const { gvar } = inav;

if (gvar[1] < 5) {
  gvar[1]++;
}

if (gvar[1] < 5) {
  gvar[1]++;
}

if (gvar[1] < 5) {
  gvar[1]++;
}`,
(result) => {
  // Should have THREE separate gvar[1] < 5 comparisons
  const ltCount = countOperation(result.commands, OPERATION.LOWER_THAN);

  if (ltCount !== 3) {
    throw new Error(`Expected 3 LOWER_THAN operations for three separate checks, got ${ltCount}`);
  }
});


// Test 6: Complex expression with mutation
test('CSE should invalidate complex expressions involving mutated gvar',
`const { gvar, flight } = inav;

if (gvar[1] + flight.altitude > 100) {
  gvar[1]++;
}

if (gvar[1] + flight.altitude > 100) {
  gvar[1]++;
}`,
(result) => {
  // Should have TWO separate comparisons since gvar[1] was mutated
  const gtCount = countOperation(result.commands, OPERATION.GREATER_THAN);

  if (gtCount !== 2) {
    throw new Error(`Expected 2 GREATER_THAN operations, got ${gtCount}. CSE incorrectly reused complex expression.`);
  }
});


// Summary
console.log('=== Results ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  console.log('\nNOTE: Failures indicate the CSE mutation bug exists and needs fixing.');
  process.exit(1);
} else {
  console.log('\nAll tests passed - CSE properly invalidates cache on mutation.');
  process.exit(0);
}
