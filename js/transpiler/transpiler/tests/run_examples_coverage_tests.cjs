#!/usr/bin/env node
/**
 * Examples Coverage Test Runner
 *
 * Run with: node run_examples_coverage_tests.cjs
 */

'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  // Load the modules (ESM)
  const { loadModules } = require('./examples_coverage.test.cjs');
  await loadModules();

  // Now run the tests
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
