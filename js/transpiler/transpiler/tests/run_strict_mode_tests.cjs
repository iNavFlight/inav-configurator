#!/usr/bin/env node
/**
 * Strict Mode Test Runner
 *
 * Run with: node run_strict_mode_tests.cjs
 */

'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  const { loadModules } = require('./strict_mode.test.cjs');
  await loadModules();
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
