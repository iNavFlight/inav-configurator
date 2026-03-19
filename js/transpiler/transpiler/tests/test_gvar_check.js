#!/usr/bin/env node
/**
 * Quick test to check if gvar operations work correctly
 * Tests both reading and writing gvar values
 */

'use strict';

import { transpile } from '../transpiler.js';

console.log('Testing GVAR operations...\n');

// Test 1: Simple gvar assignment
const test1 = `
const { gvar } = inav;
gvar[0] = 100;
`;

console.log('Test 1: gvar[0] = 100');
try {
  const result1 = transpile(test1, 'test1');
  console.log('Generated logic conditions:');
  result1.conditions.forEach((cond, i) => {
    console.log(`  LC${i}: operandA={type:${cond.operandA.type}, value:${cond.operandA.value}}, ` +
                `operandB={type:${cond.operandB.type}, value:${cond.operandB.value}}, ` +
                `operation=${cond.operation}`);
  });

  // Check if it's using correct types
  if (result1.conditions.length > 0) {
    const cond = result1.conditions[0];
    console.log('\nAnalysis:');
    console.log(`  operandA.type = ${cond.operandA.type} (expected 5 for GVAR, currently using ${cond.operandA.type})`);
    console.log(`  operation = ${cond.operation} (expected 18 for GVAR_SET, currently using ${cond.operation})`);

    if (cond.operandA.type === 3) {
      console.log('  ⚠️  WARNING: Using type 3 (FLIGHT_MODE) instead of 5 (GVAR)');
    }
    if (cond.operation === 19) {
      console.log('  ⚠️  WARNING: Using operation 19 (GVAR_INC) instead of 18 (GVAR_SET)');
    }
  }
} catch (err) {
  console.log('ERROR:', err.message);
}

// Test 2: Reading gvar value
console.log('\n---\n');
const test2 = `
const { gvar, override } = inav;
override.throttle(gvar[0]);
`;

console.log('Test 2: override.throttle(gvar[0])');
try {
  const result2 = transpile(test2, 'test2');
  console.log('Generated logic conditions:');
  result2.conditions.forEach((cond, i) => {
    console.log(`  LC${i}: operandA={type:${cond.operandA.type}, value:${cond.operandA.value}}, ` +
                `operandB={type:${cond.operandB.type}, value:${cond.operandB.value}}, ` +
                `operation=${cond.operation}`);
  });

  if (result2.conditions.length > 0) {
    const cond = result2.conditions[0];
    console.log('\nAnalysis:');
    console.log(`  operandA.type = ${cond.operandA.type} (expected 5 for GVAR when reading gvar[0])`);

    if (cond.operandA.type === 3) {
      console.log('  ⚠️  WARNING: Using type 3 (FLIGHT_MODE) instead of 5 (GVAR)');
      console.log('  This means it will try to read FLIGHT_MODE value 0 instead of GVAR 0!');
    }
  }
} catch (err) {
  console.log('ERROR:', err.message);
}

console.log('\n===\nConclusion:');
console.log('If warnings appear above, gvar.js has incorrect operand type/operation values.');
console.log('Firmware expects: type=5 (GVAR), operation=18 (GVAR_SET)');
console.log('Current gvar.js uses: type=3, operation=19');
