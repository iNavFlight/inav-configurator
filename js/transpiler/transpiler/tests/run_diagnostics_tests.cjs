#!/usr/bin/env node
/**
 * Diagnostics Test Runner
 *
 * Run with: node run_diagnostics_tests.cjs
 */

'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  const { loadModules } = require('./diagnostics.test.cjs');
  await loadModules();
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
