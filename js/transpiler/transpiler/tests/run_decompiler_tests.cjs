#!/usr/bin/env node
/**
 * Decompiler Test Runner
 *
 * Run with: node run_decompiler_tests.cjs
 */

'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  // Load the decompiler module (ESM)
  const { loadDecompiler } = require('./decompiler.test.cjs');
  await loadDecompiler();

  // Now run the tests
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
