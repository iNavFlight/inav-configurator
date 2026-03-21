#!/usr/bin/env node

/**
 * Test: Comprehensive duplicate detection for synthesized operators
 *
 * Tests that the condition cache properly detects and reuses conditions
 * when synthesized operators (>=, <=, !=) share the same inverse comparison
 * with direct comparisons (<, >, ==).
 */

import { Transpiler } from '../index.js';

console.log('=== Comprehensive Duplicate Detection Test ===\n');

const tests = [
  {
    name: '>= reuses existing <',
    code: `
const { flight, gvar } = inav;
if (flight.altitude < 100) { gvar[0] = 0; }
if (flight.altitude >= 100) { gvar[1] = 1; }
`,
    expectedConditions: 2,
    description: 'altitude >= 100 should reuse existing "altitude < 100"'
  },
  {
    name: '<= reuses existing >',
    code: `
const { flight, gvar } = inav;
if (flight.altitude > 100) { gvar[0] = 0; }
if (flight.altitude <= 100) { gvar[1] = 1; }
`,
    expectedConditions: 2,
    description: 'altitude <= 100 should reuse existing "altitude > 100"'
  },
  {
    name: '!= reuses existing ==',
    code: `
const { flight, gvar } = inav;
if (flight.gpsSats == 6) { gvar[0] = 0; }
if (flight.gpsSats != 6) { gvar[1] = 1; }
`,
    expectedConditions: 2,
    description: 'gpsSats != 6 should reuse existing "gpsSats == 6"'
  },
  {
    name: 'Multiple reuses',
    code: `
const { flight, gvar } = inav;
if (flight.altitude < 100) { gvar[0] = 0; }
if (flight.altitude >= 100) { gvar[1] = 1; }
if (flight.altitude < 100) { gvar[2] = 2; }
`,
    expectedConditions: 2,
    description: 'Third condition should reuse first'
  }
];

let allPassed = true;

for (const test of tests) {
  console.log(`\n--- Test: ${test.name} ---`);
  console.log(`Description: ${test.description}`);

  const transpiler = new Transpiler();
  const result = transpiler.transpile(test.code);

  if (!result.success) {
    console.log('❌ FAIL: Transpilation failed');
    console.log('  Error:', result.error);
    allPassed = false;
    continue;
  }

  const allCommands = result.commands
    .filter(cmd => cmd.startsWith('logic '))
    .map(cmd => {
      const parts = cmd.split(' ');
      return {
        slot: parts[1],
        operation: parts[4],
        operandAType: parts[5],
        operandAValue: parts[6],
        operandBValue: parts[8]
      };
    });

  // Filter out actions (operation 18 = SET_GVAR)
  const conditions = allCommands.filter(cmd => cmd.operation !== '18');

  // Check for duplicates
  const duplicates = [];
  for (let i = 0; i < conditions.length; i++) {
    for (let j = i + 1; j < conditions.length; j++) {
      if (conditions[i].operation === conditions[j].operation &&
          conditions[i].operandAType === conditions[j].operandAType &&
          conditions[i].operandAValue === conditions[j].operandAValue &&
          conditions[i].operandBValue === conditions[j].operandBValue) {
        duplicates.push({ first: i, second: j });
      }
    }
  }

  if (duplicates.length > 0) {
    console.log(`❌ FAIL: Found ${duplicates.length} duplicate(s)`);
    duplicates.forEach(dup => {
      console.log(`  Condition ${dup.first} and ${dup.second} are identical`);
    });
    allPassed = false;
  } else if (conditions.length !== test.expectedConditions) {
    console.log(`❌ FAIL: Expected ${test.expectedConditions} conditions, got ${conditions.length}`);
    allPassed = false;
  } else {
    console.log(`✅ PASS: ${conditions.length} unique conditions, no duplicates`);
  }
}

console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ ALL TESTS PASSED');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED');
  process.exit(1);
}
