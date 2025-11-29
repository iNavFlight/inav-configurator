#!/usr/bin/env node
/**
 * Integration Test Runner for Let/Var Support
 * Tests end-to-end transpiler functionality
 *
 * Usage: node run_let_integration_tests.cjs
 */

'use strict';

// Load simple test runner
const { runner } = require('./simple_test_runner.cjs');

// Load integration tests
require('./let_integration.test.cjs');

// Run all tests
runner.run();
