#!/usr/bin/env node
/**
 * Comparison Operators Test Runner
 *
 * Run with: node run_comparison_operators_tests.cjs
 */

'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  const { loadModules } = require('./comparison_operators.test.cjs');
  await loadModules();
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
