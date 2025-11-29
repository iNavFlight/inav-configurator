#!/usr/bin/env node
/**
 * Test Runner for Auto-Import Feature Tests
 * Usage: node run_auto_import_tests.cjs
 */

'use strict';

// Load simple test runner
const { runner } = require('./simple_test_runner.cjs');

// Load auto-import tests
require('./auto_import.test.cjs');

// Run all tests
runner.run();
