#!/usr/bin/env node
/**
 * Runner for edge with no children tests
 */
'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  const { loadDecompiler } = require('./edge_no_children.test.cjs');
  await loadDecompiler();
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
