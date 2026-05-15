#!/usr/bin/env node
/**
 * Test All Examples Runner
 *
 * Compiles all 22 examples from examples/index.js to ensure they work
 * with the current transpiler.
 *
 * Usage: node run_all_examples.mjs
 */

import { Transpiler } from '../index.js';
import examples from '../../examples/index.js';

let passed = 0;
let failed = 0;
const failures = [];

console.log('=== Testing All Examples ===\n');

for (const [key, example] of Object.entries(examples)) {
  const transpiler = new Transpiler();
  const result = transpiler.transpile(example.code);

  if (result.success) {
    passed++;
    console.log(`✅ ${example.name}`);
  } else {
    failed++;
    failures.push({name: example.name, key, error: result.error});
    console.log(`❌ ${example.name}`);
  }
}

const total = passed + failed;
console.log(`\n=== Results ===`);
console.log(`Total:  ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failures.length > 0) {
  console.log('\n=== Failure Details ===');
  failures.forEach(f => {
    console.log(`\n❌ ${f.name} (${f.key}):`);
    console.log(f.error);
  });
  console.log('\n❌ FAILED');
  process.exit(1);
} else {
  console.log('\n✅ ALL TESTS PASSED');
  process.exit(0);
}
