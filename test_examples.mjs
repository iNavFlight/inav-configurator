#!/usr/bin/env node

/**
 * Test script to validate all examples compile without errors
 * This catches regressions in transpiler validation changes
 */

import examples from './js/transpiler/examples/index.js';
import { Transpiler } from './js/transpiler/transpiler/index.js';

console.log('Testing all examples for regressions...\n');

let passCount = 0;
let failCount = 0;
const failures = [];

for (const [name, example] of Object.entries(examples)) {
  try {
    const transpiler = new Transpiler();
    const result = transpiler.transpile(example.code);

    // Check warnings.errors for semantic/validation errors
    const errors = result.warnings?.errors ?? [];
    if (errors.length > 0) {
      failCount++;
      failures.push({
        name,
        errors: errors
      });
      console.log(`❌ ${name}: ${errors.length} error(s)`);
      errors.forEach(err => {
        console.log(`   Line ${err.line}: ${err.message}`);
      });
    } else {
      passCount++;
      console.log(`✅ ${name}`);
    }
  } catch (error) {
    failCount++;
    failures.push({
      name,
      errors: [{ message: error.message, stack: error.stack }]
    });
    console.log(`❌ ${name}: Exception thrown`);
    console.log(`   ${error.message}`);
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Results: ${passCount} passed, ${failCount} failed`);

if (failCount > 0) {
  console.log(`\nFailed examples:`);
  failures.forEach(f => {
    console.log(`  - ${f.name}`);
  });
  process.exit(1);
} else {
  console.log(`\n✅ All examples compile successfully!`);
  process.exit(0);
}
