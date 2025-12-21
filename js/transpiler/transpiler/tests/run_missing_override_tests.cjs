#!/usr/bin/env node
/**
 * Runner for missing override activator tests
 */
'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  const { loadDecompiler } = require('./missing_override_activator.test.cjs');
  await loadDecompiler();
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
