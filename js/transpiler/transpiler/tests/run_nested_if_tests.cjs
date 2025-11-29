#!/usr/bin/env node
/**
 * Nested If Test Runner
 *
 * Run with: node run_nested_if_tests.cjs
 */

'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  const { loadModules } = require('./nested_if.test.cjs');
  await loadModules();
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
