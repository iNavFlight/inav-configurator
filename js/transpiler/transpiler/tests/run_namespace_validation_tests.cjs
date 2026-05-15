#!/usr/bin/env node
/**
 * Runner for namespace validation tests
 */
'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  require('./namespace_validation.test.cjs');
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
