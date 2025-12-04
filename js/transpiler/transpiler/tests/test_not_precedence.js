#!/usr/bin/env node

/**
 * Test: Duplicate condition detection for >= synthesis
 *
 * When user writes:
 *   if (x < 6) { ... }
 *   if (x >= 6) { ... }
 *
 * The >= is synthesized as NOT(x < 6).
 * Duplicate detection should catch that "x < 6" already exists as condition 0,
 * and reuse it instead of creating a duplicate at condition 2.
 */

import { Transpiler } from '../index.js';

console.log('=== Test: Duplicate Detection for >= Synthesis ===\n');

const code = `
const { flight, gvar } = inav;

if (flight.gpsSats < 6) {
  gvar[0] = 0; // No GPS - flag it
}

if (flight.gpsSats >= 6) {
  gvar[0] = 1; // Good GPS
}
`;

const transpiler = new Transpiler();
const result = transpiler.transpile(code);

console.log('Input code:');
console.log(code);
console.log('\n--- Transpiler Result ---');

if (!result.success) {
  console.log('ERROR:', result.error);
  console.log('Errors:', result.errors);
  process.exit(1);
}

console.log('Commands generated:');
result.commands.forEach((cmd, i) => {
  console.log(`  ${i}: ${cmd}`);
});

// Parse commands - separate check conditions from actions
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

// Operation 18 = SET_GVAR (action), everything else is a check condition
const conditions = allCommands.filter(cmd => cmd.operation !== '18');
const actions = allCommands.filter(cmd => cmd.operation === '18');

console.log('\n--- Analysis ---');
console.log('Condition 0:', JSON.stringify(conditions[0], null, 2));
if (conditions.length > 1) {
  console.log('Condition 1:', JSON.stringify(conditions[1], null, 2));
}

// Check for duplicate bug:
// Expected behavior:
//   Condition 0: gpsSats < 6 (LC slot 0)
//   Condition 1: NOT(LC 0) - reuses condition 0 (LC slot 1)
//   Result: Only 2 logic conditions total
//
// Buggy behavior:
//   Condition 0: gpsSats < 6 (LC slot 0)
//   Condition 2: gpsSats < 6 (LC slot 2) - DUPLICATE!
//   Condition 3: NOT(LC 2) (LC slot 3)
//   Result: 4 logic conditions, with duplicate at slot 2

console.log('\n--- Duplicate Detection Check ---');
console.log(`Total check conditions: ${conditions.length}`);
console.log(`Total actions: ${actions.length}`);

// Find duplicates by checking if any two conditions have identical operation and operands
const duplicates = [];
for (let i = 0; i < conditions.length; i++) {
  for (let j = i + 1; j < conditions.length; j++) {
    if (conditions[i].operation === conditions[j].operation &&
        conditions[i].operandAType === conditions[j].operandAType &&
        conditions[i].operandAValue === conditions[j].operandAValue &&
        conditions[i].operandBValue === conditions[j].operandBValue) {
      duplicates.push({ first: i, second: j, condition: conditions[i] });
    }
  }
}

if (duplicates.length > 0) {
  console.log('\n❌ BUG DETECTED: Duplicate check conditions found!');
  duplicates.forEach(dup => {
    console.log(`  Condition ${dup.first} and ${dup.second} are identical:`);
    console.log(`    operation=${dup.condition.operation}, operandA=${dup.condition.operandAType}:${dup.condition.operandAValue}, operandB=${dup.condition.operandBValue}`);
  });
  console.log('\nExpected: Condition cache should have detected the duplicate and reused condition 0.');
  console.log(`Actual: Generated ${conditions.length} check conditions with duplicates.`);
  process.exit(1);
} else {
  if (conditions.length === 2) {
    // Verify that condition 1 is NOT(condition 0)
    const cond1 = conditions[1];
    if (cond1.operation === '12' && cond1.operandAType === '4' && cond1.operandAValue === conditions[0].slot) {
      console.log('\n✅ PASS: No duplicates detected. Condition 0 was correctly reused.');
      console.log('  Condition 0 (slot ' + conditions[0].slot + '): gpsSats < 6');
      console.log('  Condition 1 (slot ' + conditions[1].slot + '): NOT(LC ' + conditions[0].slot + ')');
      process.exit(0);
    } else {
      console.log('\n⚠️  UNEXPECTED: Condition 1 is not NOT(Condition 0)');
      console.log('  Condition 1:', JSON.stringify(cond1, null, 2));
      process.exit(1);
    }
  } else {
    console.log(`\n⚠️  UNEXPECTED: Expected 2 check conditions, got ${conditions.length}`);
    conditions.forEach((c, i) => {
      console.log(`  Condition ${i} (slot ${c.slot}): op=${c.operation}, A=${c.operandAType}:${c.operandAValue}, B=${c.operandBValue}`);
    });
    process.exit(1);
  }
}
