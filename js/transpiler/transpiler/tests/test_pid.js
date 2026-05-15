#!/usr/bin/env node
/**
 * Programming PID Test
 *
 * Tests PID controller operand access.
 *
 * FIRMWARE DESIGN:
 * The firmware intentionally exposes only PID output values via logic conditions,
 * not the internal setpoint, measurement, or gain parameters. This is by design
 * to keep the logic condition interface simple and focused on reading results.
 *
 * Available PID operands:
 * - Operand 0 = PID 0 output
 * - Operand 1 = PID 1 output
 * - Operand 2 = PID 2 output
 * - Operand 3 = PID 3 output
 *
 * Source: logic_condition.c:1078-1082
 *   case LOGIC_CONDITION_OPERAND_TYPE_PID:
 *     if (operand >= 0 && operand < MAX_PROGRAMMING_PID_COUNT) {
 *       retVal = programmingPidGetOutput(operand);  // Only output exposed
 *     }
 *
 * Run with: node test_pid.js
 */

import { Transpiler } from '../index.js';
import { Decompiler } from '../decompiler.js';
import { OPERAND_TYPE, OPERATION } from '../inav_constants.js';

console.log('=== Programming PID Test ===\n');

const testCode = `
const { flight, gvar, pid } = inav;

// Test 1: Reading PID outputs (THESE SHOULD WORK)
// According to firmware, these map to operands 0-3
let pid0_out = pid[0].output;
let pid1_out = pid[1].output;
var pid2_out = pid[2].output;
var pid3_out = pid[3].output;

// Test 2: Using PID output in conditions
if (pid[0].output > 100) {
  gvar[0] = 1;
}

// Test 3: Using PID output in expressions
gvar[1] = pid[1].output + 50;
gvar[2] = (pid[2].output + pid[3].output) / 2;

// Test 4: Comparing PID outputs
if (pid[0].output > pid[1].output) {
  gvar[3] = pid[0].output;
}
`;

console.log('=== Original JavaScript ===\n');
console.log(testCode);

console.log('\n⚠️  NOTE: This test only uses pid[N].output');
console.log('   pid.js also defines setpoint, measurement, P/I/D/FF gains, and enabled');
console.log('   BUT THESE DO NOT EXIST IN FIRMWARE!');
console.log('   The firmware ONLY exposes output via operands 0-3.\n');

// Transpile
const transpiler = new Transpiler();
const result = transpiler.transpile(testCode);

if (!result.success) {
  console.error('❌ Transpilation failed:', result.error);
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

// Verify operations
console.log('\n=== Verification ===\n');

let passed = true;

// Check 1: PID reads should use operand type 6 (PID)
console.log('Check 1: PID reads (should use operand type 6 = PID)');
const pidReads = logicConditions.filter(lc =>
  lc.operandAType === OPERAND_TYPE.PID ||
  lc.operandBType === OPERAND_TYPE.PID
);

if (pidReads.length > 0) {
  console.log(`✅ Found ${pidReads.length} PID reads using correct operand type (${OPERAND_TYPE.PID})`);
  pidReads.forEach(lc => {
    const pidOpA = (lc.operandAType === OPERAND_TYPE.PID) ? lc.operandAValue : null;
    const pidOpB = (lc.operandBType === OPERAND_TYPE.PID) ? lc.operandBValue : null;
    console.log(`  LC${lc.index}: op=${lc.operation} opA(type=${lc.operandAType}, val=${lc.operandAValue}) opB(type=${lc.operandBType}, val=${lc.operandBValue})`);

    if (pidOpA !== null) {
      console.log(`    → Reads PID ${pidOpA} output`);
    }
    if (pidOpB !== null) {
      console.log(`    → Reads PID ${pidOpB} output`);
    }
  });
} else {
  console.log('❌ No PID reads found with correct operand type');
  passed = false;
}

// Check 2: PID operands should be 0-3 (NOT i*10+0 through i*10+7)
console.log('\nCheck 2: PID operand values (firmware only supports 0-3)');
const invalidPidOperands = pidReads.filter(lc => {
  const valA = (lc.operandAType === OPERAND_TYPE.PID) ? lc.operandAValue : null;
  const valB = (lc.operandBType === OPERAND_TYPE.PID) ? lc.operandBValue : null;

  return (valA !== null && valA > 3) || (valB !== null && valB > 3);
});

if (invalidPidOperands.length === 0) {
  console.log('✅ All PID operands are 0-3 (correct - matches firmware)');
  console.log('   Operand 0 = PID 0 output');
  console.log('   Operand 1 = PID 1 output');
  console.log('   Operand 2 = PID 2 output');
  console.log('   Operand 3 = PID 3 output');
} else {
  console.log(`❌ Found ${invalidPidOperands.length} PID operations with invalid operands > 3!`);
  console.log('   This would indicate pid.js is exposing non-existent properties');
  invalidPidOperands.forEach(lc => {
    console.log(`  LC${lc.index}: opA(type=${lc.operandAType}, val=${lc.operandAValue}) opB(type=${lc.operandBType}, val=${lc.operandBValue})`);
  });
  passed = false;
}

// Check 3: Document what pid.js claims to expose
console.log('\nCheck 3: pid.js claims vs firmware reality');
console.log('  pid.js defines (per controller):');
console.log('    - configure.setpoint → operand i*10+0  ❌ DOES NOT EXIST IN FIRMWARE');
console.log('    - configure.measurement → operand i*10+1  ❌ DOES NOT EXIST IN FIRMWARE');
console.log('    - configure.p → operand i*10+2  ❌ DOES NOT EXIST IN FIRMWARE');
console.log('    - configure.i → operand i*10+3  ❌ DOES NOT EXIST IN FIRMWARE');
console.log('    - configure.d → operand i*10+4  ❌ DOES NOT EXIST IN FIRMWARE');
console.log('    - configure.ff → operand i*10+5  ❌ DOES NOT EXIST IN FIRMWARE');
console.log('    - output → operand i*10+6  ❌ WRONG OPERAND NUMBER');
console.log('    - enabled → operand i*10+7  ❌ DOES NOT EXIST IN FIRMWARE');
console.log('');
console.log('  Firmware reality (logic_condition.c:1078-1082):');
console.log('    - PID 0 output → operand 0  ✅ EXISTS');
console.log('    - PID 1 output → operand 1  ✅ EXISTS');
console.log('    - PID 2 output → operand 2  ✅ EXISTS');
console.log('    - PID 3 output → operand 3  ✅ EXISTS');
console.log('    - NOTHING ELSE IS EXPOSED!');

// Decompile
console.log('\n=== Decompiled JavaScript ===\n');
const decompiler = new Decompiler();
const decompileResult = decompiler.decompile(logicConditions, result.variableMap);

console.log(decompileResult.code);

// Summary
console.log('\n=== Test Summary ===\n');
console.log(`Total logic conditions: ${logicConditions.length}`);
console.log(`PID reads (type ${OPERAND_TYPE.PID}): ${pidReads.length}`);
console.log(`PID operands used: ${[...new Set(pidReads.flatMap(lc => {
  const ops = [];
  if (lc.operandAType === OPERAND_TYPE.PID) ops.push(lc.operandAValue);
  if (lc.operandBType === OPERAND_TYPE.PID) ops.push(lc.operandBValue);
  return ops;
}))].sort().join(', ')}`);

console.log('\n⚠️  MAJOR BUG IN pid.js:');
console.log('   pid.js exposes 8 properties per PID controller (operands i*10+0 through i*10+7)');
console.log('   BUT firmware only exposes 1 property: output (operands 0-3)');
console.log('');
console.log('   Fix: Rewrite pid.js to only expose:');
console.log('     pid[0] through pid[3] with single property:');
console.log('       .output → operand 0-3');
console.log('');
console.log('   Remove fabricated properties: setpoint, measurement, P/I/D/FF gains, enabled');

console.log('\n=== Final Result ===\n');
if (passed && decompileResult.success) {
  console.log('✅ All PID tests passed!');
  console.log('   (But remember: pid.js still has fabricated properties that need removal)');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}
