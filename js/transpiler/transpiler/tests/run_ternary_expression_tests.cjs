#!/usr/bin/env node
/**
 * Ternary Expression Test Runner
 *
 * Run with: node run_ternary_expression_tests.cjs
 */

'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  const { loadTranspiler } = require('./ternary_expression.test.cjs');
  await loadTranspiler();
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
