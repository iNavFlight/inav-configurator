#!/usr/bin/env node
/**
 * Runner for edge activator in sticky tests
 */
'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  const { loadDecompiler } = require('./edge_activator_in_sticky.test.cjs');
  await loadDecompiler();
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
