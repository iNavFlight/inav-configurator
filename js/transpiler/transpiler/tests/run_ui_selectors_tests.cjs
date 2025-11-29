#!/usr/bin/env node
/**
 * UI Selectors Test Runner
 *
 * Run with: node run_ui_selectors_tests.cjs
 */

'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  const { loadModules } = require('./ui_selectors.test.cjs');
  await loadModules();
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
