#!/usr/bin/env node
/**
 * Standalone Test Runner for VariableHandler
 * No external dependencies required
 *
 * Usage: node run_variable_handler_tests.js
 */

'use strict';

// Load simple test runner
const { runner } = require('./simple_test_runner.cjs');

// Load test file (will register tests using global describe/test)
require('./variable_handler.test.cjs');

// Run all tests
runner.run();
