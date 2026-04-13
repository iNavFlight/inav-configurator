#!/usr/bin/env node
/**
 * Runner for flight axis override tests
 */
'use strict';

const { runner } = require('./simple_test_runner.cjs');

async function main() {
  require('./flight_axis_override.test.cjs');
  await runner.run();
}

main().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
