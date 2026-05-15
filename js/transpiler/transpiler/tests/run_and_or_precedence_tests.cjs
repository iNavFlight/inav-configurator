#!/usr/bin/env node
/**
 * Runner for AND/OR precedence tests
 */
'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  const { loadDecompiler } = require('./and_or_precedence.test.cjs');
  await loadDecompiler();
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
