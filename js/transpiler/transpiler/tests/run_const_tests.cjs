#!/usr/bin/env node
/**
 * Run const support tests
 */

'use strict';

// Load test runner first (sets up globals)
require('./simple_test_runner.cjs');

// Then load the tests
require('./const_support.test.cjs');
