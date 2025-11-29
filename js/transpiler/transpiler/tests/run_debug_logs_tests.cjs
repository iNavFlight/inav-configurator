#!/usr/bin/env node
/**
 * Debug Logs Test Runner
 *
 * Run with: node run_debug_logs_tests.cjs
 */

'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  const { loadModules } = require('./debug_logs.test.cjs');
  await loadModules();
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
