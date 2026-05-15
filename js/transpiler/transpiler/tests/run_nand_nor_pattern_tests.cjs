#!/usr/bin/env node
/**
 * NAND/NOR Pattern Recognition Test Runner
 *
 * Run with: node run_nand_nor_pattern_tests.cjs
 */

'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  const { loadTranspiler } = require('./nand_nor_pattern.test.cjs');
  await loadTranspiler();
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
