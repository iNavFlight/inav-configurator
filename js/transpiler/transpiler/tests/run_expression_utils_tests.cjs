#!/usr/bin/env node
/**
 * Run expression_utils tests
 */
'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  // Load the ESM modules
  const { loadModules } = require('./expression_utils.test.cjs');
  await loadModules();

  // Now run the tests
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
