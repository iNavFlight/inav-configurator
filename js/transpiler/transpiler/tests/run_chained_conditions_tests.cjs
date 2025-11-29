#!/usr/bin/env node
/**
 * Chained Conditions Test Runner
 *
 * Run with: node run_chained_conditions_tests.cjs
 */

'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  const { loadDecompiler } = require('./chained_conditions.test.cjs');
  await loadDecompiler();
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
