#!/usr/bin/env node
/**
 * Variable Map Preservation Test
 *
 * Tests that variable names are preserved through the transpile/decompile cycle.
 * Run with: node test_variable_map.js
 */

import { Transpiler } from '../index.js';
import { Decompiler } from '../decompiler.js';

console.log('=== Variable Map Preservation Test ===\n');

// Test code with let and var variables
const testCode = `
const { flight, gvar } = inav;

let threshold = 100;
let altitude_check = flight.altitude;
var counter = 0;
var state = 1;

if (flight.altitude > threshold) {
  counter = counter + 1;
  gvar[0] = state;
}
`;

console.log('=== Original JavaScript ===\n');
console.log(testCode);

// Transpile
const transpiler = new Transpiler();
const transpileResult = transpiler.transpile(testCode);

if (!transpileResult.success) {
  console.error('❌ Transpilation failed:', transpileResult.error);
  process.exit(1);
}

console.log('\n=== Generated CLI Commands ===\n');
transpileResult.commands.forEach(cmd => console.log(cmd));

console.log('\n=== Variable Map ===\n');
console.log(JSON.stringify(transpileResult.variableMap, null, 2));

// Verify variable map structure
const varMap = transpileResult.variableMap;

console.log('\n=== Variable Map Verification ===\n');

let passed = true;

// Check let variables
if (!varMap.let_variables || Object.keys(varMap.let_variables).length === 0) {
  console.log('❌ No let variables found in map');
  passed = false;
} else {
  console.log('✅ let_variables present');

  if (varMap.let_variables.threshold) {
    console.log(`  ✅ threshold: ${varMap.let_variables.threshold.expression}`);
  } else {
    console.log('  ❌ threshold not found');
    passed = false;
  }

  if (varMap.let_variables.altitude_check) {
    console.log(`  ✅ altitude_check: ${varMap.let_variables.altitude_check.expression}`);
  } else {
    console.log('  ❌ altitude_check not found');
    passed = false;
  }
}

// Check var variables
if (!varMap.var_variables || Object.keys(varMap.var_variables).length === 0) {
  console.log('❌ No var variables found in map');
  passed = false;
} else {
  console.log('✅ var_variables present');

  if (varMap.var_variables.counter !== undefined) {
    console.log(`  ✅ counter: gvar[${varMap.var_variables.counter.gvar}] = ${varMap.var_variables.counter.expression}`);
  } else {
    console.log('  ❌ counter not found');
    passed = false;
  }

  if (varMap.var_variables.state !== undefined) {
    console.log(`  ✅ state: gvar[${varMap.var_variables.state.gvar}] = ${varMap.var_variables.state.expression}`);
  } else {
    console.log('  ❌ state not found');
    passed = false;
  }
}

// Parse commands to LC format for decompiler
const logicConditions = transpileResult.commands.map((cmd) => {
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

// Decompile WITH variable map
console.log('\n=== Decompiled JavaScript (with variable map) ===\n');
const decompiler = new Decompiler();
const decompileResult = decompiler.decompile(logicConditions, transpileResult.variableMap);

console.log(decompileResult.code);

// Verify decompiled code includes variable declarations
console.log('\n=== Decompilation Verification ===\n');

if (decompileResult.code.includes('// Variable declarations')) {
  console.log('✅ Variable declarations section present');
} else {
  console.log('❌ Variable declarations section missing');
  passed = false;
}

if (decompileResult.code.includes('let threshold = 100')) {
  console.log('✅ let threshold declaration preserved');
} else {
  console.log('❌ let threshold declaration missing');
  passed = false;
}

if (decompileResult.code.includes('var counter = 0')) {
  console.log('✅ var counter declaration preserved');
} else {
  console.log('❌ var counter declaration missing');
  passed = false;
}

// Decompile WITHOUT variable map (for comparison)
console.log('\n=== Decompiled JavaScript (without variable map) ===\n');
const decompilerNoMap = new Decompiler();
const decompileResultNoMap = decompilerNoMap.decompile(logicConditions, null);

console.log(decompileResultNoMap.code);

// Final result
console.log('\n=== Test Result ===\n');
if (passed && decompileResult.success) {
  console.log('✅ All variable map tests passed!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}
