#!/usr/bin/env node

/**
 * Regression test for childless boolean condition with activator
 *
 * Bug: Boolean conditions with no children were being skipped entirely during
 * decompilation, even if they could be externally referenced.
 *
 * Example: Logic condition 23 with activatorId=22, operation=LOWER_THAN,
 * operandA=flight.airSpeed, operandB=1111 - this is a childless boolean condition
 * that should be rendered as an if block with a comment for external reference.
 *
 * Before the fix: condition was completely missing from decompiled output
 * After the fix: correctly renders as an if block with external reference comment
 */

import { Decompiler } from '../decompiler.js';
import { OPERATION, OPERAND_TYPE } from '../inav_constants.js';

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

function assertNotContains(str, substring, message) {
  if (str.includes(substring)) {
    throw new Error(`${message}\n  String should not contain: ${substring}\n  Actual: ${str}`);
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

console.log('📦 Childless Boolean Condition Regression Tests\n');

let passed = 0;
let failed = 0;

// Test 1: Childless boolean condition with no activator (root level)
if (runTest('childless boolean condition at root level', () => {
  const decompiler = new Decompiler();
  const lcs = [
    {
      index: 0,
      enabled: 1,
      activatorId: -1,
      operation: OPERATION.LOWER_THAN,
      operandAType: OPERAND_TYPE.FLIGHT,
      operandAValue: 11, // AIR_SPEED
      operandBType: OPERAND_TYPE.VALUE,
      operandBValue: 1111,
      flags: 0
    }
  ];
  const result = decompiler.decompile(lcs);
  if (!result.success) {
    throw new Error(`Decompilation failed: ${result.error || JSON.stringify(result)}`);
  }
  assertContains(result.code, 'inav.flight.airSpeed < 1111', 'Should contain the condition expression');
  assertContains(result.code, 'LC 0: for external reference', 'Should contain external reference comment');
  assertContains(result.code, 'if (', 'Should be wrapped in an if statement');
})) {
  passed++;
} else {
  failed++;
}

// Test 2: Childless boolean condition with activator (nested level) - the original bug case
if (runTest('childless boolean condition with activator (nested)', () => {
  const decompiler = new Decompiler();
  const lcs = [
    {
      index: 22,
      enabled: 1,
      activatorId: -1,
      operation: 2, // GREATER_THAN
      operandAType: 2, // FLIGHT
      operandAValue: 12, // ALTITUDE
      operandBType: 0, // VALUE
      operandBValue: 100,
      flags: 0
    },
    {
      index: 23,
      enabled: 1,
      activatorId: 22, // Activated by LC 22
      operation: 3, // LOWER_THAN
      operandAType: 2, // FLIGHT
      operandAValue: 11, // AIR_SPEED
      operandBType: 0, // VALUE
      operandBValue: 1111,
      flags: 0
    }
  ];
  const result = decompiler.decompile(lcs);
  if (!result.success) {
    throw new Error(`Decompilation failed: ${result.error || JSON.stringify(result)}`);
  }
  // The outer condition should be rendered
  assertContains(result.code, 'inav.flight.altitude > 100', 'Should contain the outer condition');
  // The inner childless condition should also be rendered with external reference comment
  assertContains(result.code, 'inav.flight.airSpeed < 1111', 'Should contain the inner condition expression');
  assertContains(result.code, 'LC 23: for external reference', 'Should contain external reference comment for LC 23');
})) {
  passed++;
} else {
  failed++;
}

// Test 3: Multiple childless boolean conditions in sequence
if (runTest('multiple childless boolean conditions', () => {
  const decompiler = new Decompiler();
  const lcs = [
    {
      index: 0,
      enabled: 1,
      activatorId: -1,
      operation: 3, // LOWER_THAN
      operandAType: 2, // FLIGHT
      operandAValue: 11, // AIR_SPEED
      operandBType: 0, // VALUE
      operandBValue: 500,
      flags: 0
    },
    {
      index: 1,
      enabled: 1,
      activatorId: -1,
      operation: 2, // GREATER_THAN
      operandAType: 2, // FLIGHT
      operandAValue: 4, // VBAT
      operandBType: 0, // VALUE
      operandBValue: 3700,
      flags: 0
    }
  ];
  const result = decompiler.decompile(lcs);
  if (!result.success) {
    throw new Error(`Decompilation failed: ${result.error || JSON.stringify(result)}`);
  }
  assertContains(result.code, 'inav.flight.airSpeed < 500', 'Should contain first condition');
  assertContains(result.code, 'LC 0: for external reference', 'Should have external reference for LC 0');
  assertContains(result.code, 'inav.flight.vbat > 3700', 'Should contain second condition');
  assertContains(result.code, 'LC 1: for external reference', 'Should have external reference for LC 1');
})) {
  passed++;
} else {
  failed++;
}

// Test 4: Childless boolean condition should NOT be output if it has children
if (runTest('boolean condition with children uses normal if-block', () => {
  const decompiler = new Decompiler();
  const lcs = [
    {
      index: 0,
      enabled: 1,
      activatorId: -1,
      operation: 3, // LOWER_THAN
      operandAType: 2, // FLIGHT
      operandAValue: 11, // AIR_SPEED
      operandBType: 0, // VALUE
      operandBValue: 1111,
      flags: 0
    },
    {
      index: 1,
      enabled: 1,
      activatorId: 0, // Child of LC 0
      operation: 23, // OVERRIDE_THROTTLE_SCALE
      operandAType: 0, // VALUE
      operandAValue: 50,
      operandBType: 0,
      operandBValue: 0,
      flags: 0
    }
  ];
  const result = decompiler.decompile(lcs);
  if (!result.success) {
    throw new Error(`Decompilation failed: ${result.error || JSON.stringify(result)}`);
  }
  assertContains(result.code, 'inav.flight.airSpeed < 1111', 'Should contain the condition');
  assertContains(result.code, 'override.throttleScale', 'Should contain the child action');
  // Should NOT have the external reference comment since it has children
  assertNotContains(result.code, 'LC 0: for external reference', 'Should NOT have external reference comment when it has children');
})) {
  passed++;
} else {
  failed++;
}

// Test 5: Childless action operations should NOT get external reference comment
if (runTest('childless action operations do not get external reference', () => {
  const decompiler = new Decompiler();
  const lcs = [
    {
      index: 0,
      enabled: 1,
      activatorId: -1,
      operation: 23, // OVERRIDE_THROTTLE_SCALE (action, not boolean)
      operandAType: 0, // VALUE
      operandAValue: 75,
      operandBType: 0,
      operandBValue: 0,
      flags: 0
    }
  ];
  const result = decompiler.decompile(lcs);
  if (!result.success) {
    throw new Error(`Decompilation failed: ${result.error || JSON.stringify(result)}`);
  }
  assertContains(result.code, 'override.throttleScale', 'Should contain the action');
  // Actions are not externally referenceable, so no comment needed
  assertNotContains(result.code, 'for external reference', 'Should NOT have external reference comment for actions');
})) {
  passed++;
} else {
  failed++;
}

// Test 6: Comparison operations (all should support external reference)
if (runTest('all comparison operations support external reference', () => {
  const decompiler = new Decompiler();
  const lcs = [
    {
      index: 0,
      enabled: 1,
      activatorId: -1,
      operation: 1, // EQUAL
      operandAType: 2, // FLIGHT
      operandAValue: 17, // IS_ARMED
      operandBType: 0, // VALUE
      operandBValue: 1,
      flags: 0
    },
    {
      index: 1,
      enabled: 1,
      activatorId: -1,
      operation: 2, // GREATER_THAN
      operandAType: 2, // FLIGHT
      operandAValue: 12, // ALTITUDE
      operandBType: 0, // VALUE
      operandBValue: 50,
      flags: 0
    },
    {
      index: 2,
      enabled: 1,
      activatorId: -1,
      operation: 3, // LOWER_THAN
      operandAType: 2, // FLIGHT
      operandAValue: 5, // CELL_VOLTAGE
      operandBType: 0, // VALUE
      operandBValue: 350,
      flags: 0
    }
  ];
  const result = decompiler.decompile(lcs);
  if (!result.success) {
    throw new Error(`Decompilation failed: ${result.error || JSON.stringify(result)}`);
  }
  assertContains(result.code, 'LC 0: for external reference', 'EQUAL should have external reference');
  assertContains(result.code, 'LC 1: for external reference', 'GREATER_THAN should have external reference');
  assertContains(result.code, 'LC 2: for external reference', 'LOWER_THAN should have external reference');
})) {
  passed++;
} else {
  failed++;
}

// Test 7: Logical operations (AND, OR) can also be externally referenced
if (runTest('logical operations support external reference', () => {
  const decompiler = new Decompiler();
  const lcs = [
    {
      index: 0,
      enabled: 1,
      activatorId: -1,
      operation: 2, // GREATER_THAN
      operandAType: 2, // FLIGHT
      operandAValue: 12, // ALTITUDE
      operandBType: 0, // VALUE
      operandBValue: 100,
      flags: 0
    },
    {
      index: 1,
      enabled: 1,
      activatorId: -1,
      operation: 3, // LOWER_THAN
      operandAType: 2, // FLIGHT
      operandAValue: 11, // AIR_SPEED
      operandBType: 0, // VALUE
      operandBValue: 500,
      flags: 0
    },
    {
      index: 2,
      enabled: 1,
      activatorId: -1,
      operation: 7, // AND (childless, should get external reference)
      operandAType: 4, // LC
      operandAValue: 0,
      operandBType: 4, // LC
      operandBValue: 1,
      flags: 0
    }
  ];
  const result = decompiler.decompile(lcs);
  if (!result.success) {
    throw new Error(`Decompilation failed: ${result.error || JSON.stringify(result)}`);
  }
  assertContains(result.code, 'LC 2: for external reference', 'AND operation should have external reference when childless');
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
