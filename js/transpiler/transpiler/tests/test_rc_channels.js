#!/usr/bin/env node
/**
 * RC Channel Read and Write Test
 *
 * Tests both reading RC channel values (operand type) and
 * writing/overriding RC channels (operation type).
 *
 * Run with: node test_rc_channels.js
 */

import { Transpiler } from '../index.js';
import { Decompiler } from '../decompiler.js';
import { OPERAND_TYPE, OPERATION } from '../inav_constants.js';

console.log('=== RC Channel Read/Write Test ===\n');

const testCode = `
const { flight, override, rc, gvar } = inav;

// Test 1: Reading RC channel values
// rc[6] is shorthand for rc[6].value
let throttle = rc[3];           // Shorthand
let roll_value = rc[1].value;   // Explicit .value
var pitch_input = rc[2].value;

// Test 2: Reading RC channel states (low/mid/high)
if (rc[5].high) {
  gvar[0] = 1;
}

if (rc[6].low) {
  gvar[1] = 0;
}

// Test 3: Writing/Overriding RC channels
// Use shorthand in expressions
rc[10] = rc[2] + 100;

// Use explicit .value in expressions
rc[11] = rc[3].value - 50;

// Mix of both
rc[12] = rc[4] + rc[5].value;

// Constant assignment
rc[13] = 1500;

// Test 4: Complex expression
rc[14] = (rc[1] + rc[2]) / 2;

// Test 5: Using rc value in condition and action
if (rc[7] > 1600) {
  rc[15] = 2000;
}
`;

console.log('=== Original JavaScript ===\n');
console.log(testCode);

// Transpile
const transpiler = new Transpiler();
const result = transpiler.transpile(testCode);

if (!result.success) {
  console.error('❌ Transpilation failed:', result.error);
  console.error(result.error);
  process.exit(1);
}

console.log('\n=== Generated CLI Commands ===\n');
result.commands.forEach((cmd, idx) => {
  console.log(`${idx}: ${cmd}`);
});

console.log('\n=== Variable Map ===\n');
console.log(JSON.stringify(result.variableMap, null, 2));

// Parse commands to LC format
const logicConditions = result.commands.map((cmd) => {
  const parts = cmd.split(/\s+/);
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
});

// Verify specific operations
console.log('\n=== Verification ===\n');

let passed = true;

// Find RC read operations (should use OPERAND_TYPE.RC_CHANNEL = 1)
console.log('Checking RC channel READS (should use operand type 1):');
const rcReads = logicConditions.filter(lc =>
  lc.operandAType === OPERAND_TYPE.RC_CHANNEL ||
  lc.operandBType === OPERAND_TYPE.RC_CHANNEL
);

if (rcReads.length > 0) {
  console.log(`✅ Found ${rcReads.length} RC channel reads using correct operand type (${OPERAND_TYPE.RC_CHANNEL})`);
  rcReads.slice(0, 3).forEach((lc, i) => {
    console.log(`  LC${lc.index}: opA(type=${lc.operandAType}, val=${lc.operandAValue}) opB(type=${lc.operandBType}, val=${lc.operandBValue})`);
  });
} else {
  console.log('❌ No RC channel reads found with correct operand type');
  passed = false;
}

// Check for WRONG operand type (4 = LC type, which is the bug we're fixing)
const wrongRcReads = logicConditions.filter(lc =>
  lc.operandAType === 4 || lc.operandBType === 4
);

if (wrongRcReads.length > 0) {
  console.log(`❌ Found ${wrongRcReads.length} operations using WRONG type 4 (LC instead of RC_CHANNEL)`);
  wrongRcReads.forEach(lc => {
    console.log(`  LC${lc.index}: This should be type ${OPERAND_TYPE.RC_CHANNEL}, not 4!`);
  });
  passed = false;
}

// Find RC write operations (should use OPERATION.RC_CHANNEL_OVERRIDE = 38)
console.log('\nChecking RC channel WRITES (should use operation 38):');
const rcWrites = logicConditions.filter(lc =>
  lc.operation === OPERATION.RC_CHANNEL_OVERRIDE
);

if (rcWrites.length > 0) {
  console.log(`✅ Found ${rcWrites.length} RC channel overrides using correct operation (${OPERATION.RC_CHANNEL_OVERRIDE})`);
  rcWrites.forEach((lc, i) => {
    console.log(`  LC${lc.index}: op=${lc.operation} opA(type=${lc.operandAType}, val=${lc.operandAValue}) opB(type=${lc.operandBType}, val=${lc.operandBValue})`);
  });
} else {
  console.log('❌ No RC channel writes found');
  passed = false;
}

// Verify specific test cases
console.log('\n=== Test Case Verification ===\n');

// Test 1: Verify rc[3] and rc[1].value use RC_CHANNEL operand
const hasRcOperands = logicConditions.some(lc =>
  (lc.operandAType === OPERAND_TYPE.RC_CHANNEL && lc.operandAValue === 3) ||
  (lc.operandBType === OPERAND_TYPE.RC_CHANNEL && lc.operandBValue === 3) ||
  (lc.operandAType === OPERAND_TYPE.RC_CHANNEL && lc.operandAValue === 1) ||
  (lc.operandBType === OPERAND_TYPE.RC_CHANNEL && lc.operandBValue === 1)
);

if (hasRcOperands) {
  console.log('✅ Test 1: RC channel reads (rc[3], rc[1].value) use correct operand type');
} else {
  console.log('❌ Test 1: RC channel reads not found or using wrong type');
  passed = false;
}

// Test 3: Verify rc[10] = rc[2] + 100 produces RC_CHANNEL_OVERRIDE operation
const hasRcWrite = logicConditions.some(lc =>
  lc.operation === OPERATION.RC_CHANNEL_OVERRIDE &&
  lc.operandAValue === 10
);

if (hasRcWrite) {
  console.log('✅ Test 3: RC channel write (rc[10] = ...) uses RC_CHANNEL_OVERRIDE operation');
} else {
  console.log('❌ Test 3: RC channel write not found or using wrong operation');
  passed = false;
}

// Decompile
console.log('\n=== Decompiled JavaScript ===\n');
const decompiler = new Decompiler();
const decompileResult = decompiler.decompile(logicConditions, result.variableMap);

console.log(decompileResult.code);

// Summary
console.log('\n=== Test Summary ===\n');
console.log(`Total logic conditions generated: ${logicConditions.length}`);
console.log(`RC channel reads (operand type ${OPERAND_TYPE.RC_CHANNEL}): ${rcReads.length}`);
console.log(`RC channel writes (operation ${OPERATION.RC_CHANNEL_OVERRIDE}): ${rcWrites.length}`);

if (wrongRcReads.length > 0) {
  console.log(`\n⚠️  WARNING: Found ${wrongRcReads.length} operations using wrong type 4`);
  console.log('   This indicates rc.js has the bug where type: 4 should be type: 1');
}

console.log('\n=== Final Result ===\n');
if (passed && decompileResult.success) {
  console.log('✅ All RC channel tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}
