#!/usr/bin/env node
'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  const { loadDecompiler } = require('./sticky_scope_test.cjs');
  await loadDecompiler();
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
