/**
 * Simple Test Runner - No dependencies required
 *
 * Provides basic Jest-like API using plain Node.js
 */

'use strict';

class TestRunner {
  constructor() {
    this.tests = [];
    this.suites = [];
    this.currentSuite = null;
    this.passed = 0;
    this.failed = 0;
    this.errors = [];
  }

  describe(name, fn) {
    const parentSuite = this.currentSuite;
    const suite = {
      name,
      tests: [],
      beforeEach: null,
      parent: parentSuite
    };
    this.suites.push(suite);
    this.currentSuite = suite;
    fn();
    this.currentSuite = parentSuite;
  }

  test(name, fn) {
    if (this.currentSuite) {
      this.currentSuite.tests.push({ name, fn });
    } else {
      this.tests.push({ name, fn, suite: null });
    }
  }

  beforeEach(fn) {
    if (this.currentSuite) {
      this.currentSuite.beforeEach = fn;
    }
  }

  async run() {
    console.log('\n🧪 Running Tests...\n');

    // Run tests in suites
    for (const suite of this.suites) {
      console.log(`\n📦 ${suite.name}`);

      for (const test of suite.tests) {
        try {
          // Run beforeEach hooks from parent suites first, then this suite
          const beforeEachHooks = [];
          let currentSuite = suite;
          while (currentSuite) {
            if (currentSuite.beforeEach) {
              beforeEachHooks.unshift(currentSuite.beforeEach);
            }
            currentSuite = currentSuite.parent;
          }
          for (const hook of beforeEachHooks) {
            hook();
          }

          await test.fn();
          this.passed++;
          console.log(`  ✅ ${test.name}`);
        } catch (error) {
          this.failed++;
          this.errors.push({
            suite: suite.name,
            test: test.name,
            error: error.message,
            stack: error.stack
          });
          console.log(`  ❌ ${test.name}`);
          console.log(`     ${error.message}`);
        }
      }
    }

    // Run standalone tests
    for (const test of this.tests) {
      try {
        await test.fn();
        this.passed++;
        console.log(`  ✅ ${test.name}`);
      } catch (error) {
        this.failed++;
        this.errors.push({
          suite: 'standalone',
          test: test.name,
          error: error.message,
          stack: error.stack
        });
        console.log(`  ❌ ${test.name}`);
        console.log(`     ${error.message}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log(`\n📊 Test Results:`);
    console.log(`   Passed: ${this.passed}`);
    console.log(`   Failed: ${this.failed}`);
    console.log(`   Total:  ${this.passed + this.failed}`);

    if (this.failed > 0) {
      console.log('\n❌ FAILED\n');
      process.exit(1);
    } else {
      console.log('\n✅ ALL TESTS PASSED\n');
      process.exit(0);
    }
  }
}

// Assertion helpers
class Assertions {
  constructor(actual) {
    this.actual = actual;
  }

  toBe(expected) {
    if (this.actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(this.actual)}`);
    }
  }

  toEqual(expected) {
    if (JSON.stringify(this.actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(this.actual)}`);
    }
  }

  toBeNull() {
    if (this.actual !== null) {
      throw new Error(`Expected null, got ${JSON.stringify(this.actual)}`);
    }
  }

  toBeUndefined() {
    if (this.actual !== undefined) {
      throw new Error(`Expected undefined, got ${JSON.stringify(this.actual)}`);
    }
  }

  toBeDefined() {
    if (this.actual === undefined) {
      throw new Error('Expected value to be defined');
    }
  }

  toBeTruthy() {
    if (!this.actual) {
      throw new Error(`Expected truthy value, got ${JSON.stringify(this.actual)}`);
    }
  }

  toBeFalsy() {
    if (this.actual) {
      throw new Error(`Expected falsy value, got ${JSON.stringify(this.actual)}`);
    }
  }

  toHaveProperty(key) {
    if (this.actual === null || this.actual === undefined) {
      throw new Error(`Expected object to have property '${key}', but object is ${this.actual}`);
    }
    if (!(key in this.actual)) {
      throw new Error(`Expected object to have property '${key}', but it doesn't. Keys: ${Object.keys(this.actual).join(', ')}`);
    }
  }

  toBeGreaterThan(expected) {
    if (this.actual <= expected) {
      throw new Error(`Expected ${this.actual} to be greater than ${expected}`);
    }
  }

  toBeGreaterThanOrEqual(expected) {
    if (this.actual < expected) {
      throw new Error(`Expected ${this.actual} to be greater than or equal to ${expected}`);
    }
  }

  toBeLessThan(expected) {
    if (this.actual >= expected) {
      throw new Error(`Expected ${this.actual} to be less than ${expected}`);
    }
  }

  toBeLessThanOrEqual(expected) {
    if (this.actual > expected) {
      throw new Error(`Expected ${this.actual} to be less than or equal to ${expected}`);
    }
  }

  toContain(expected) {
    if (typeof this.actual === 'string') {
      if (!this.actual.includes(expected)) {
        throw new Error(`Expected "${this.actual}" to contain "${expected}"`);
      }
    } else if (Array.isArray(this.actual)) {
      if (!this.actual.includes(expected)) {
        throw new Error(`Expected array to contain ${JSON.stringify(expected)}`);
      }
    } else {
      throw new Error('toContain requires string or array');
    }
  }

  toHaveLength(expected) {
    if (this.actual.length !== expected) {
      throw new Error(`Expected length ${expected}, got ${this.actual.length}`);
    }
  }

  toThrow(expectedMessage) {
    try {
      this.actual();
      throw new Error('Expected function to throw');
    } catch (error) {
      if (expectedMessage) {
        // Handle regex pattern
        if (expectedMessage instanceof RegExp) {
          if (!expectedMessage.test(error.message)) {
            throw new Error(`Expected error message to match ${expectedMessage}, got "${error.message}"`);
          }
        } else if (!error.message.includes(expectedMessage)) {
          throw new Error(`Expected error message to contain "${expectedMessage}", got "${error.message}"`);
        }
      }
    }
  }

  toMatch(pattern) {
    if (typeof this.actual !== 'string') {
      throw new Error('toMatch requires a string');
    }
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    if (!regex.test(this.actual)) {
      throw new Error(`Expected "${this.actual.substring(0, 100)}..." to match ${pattern}`);
    }
  }

  get not() {
    return new NegatedAssertions(this.actual);
  }
}

class NegatedAssertions {
  constructor(actual) {
    this.actual = actual;
  }

  toBe(expected) {
    if (this.actual === expected) {
      throw new Error(`Expected ${JSON.stringify(this.actual)} not to be ${JSON.stringify(expected)}`);
    }
  }

  toBeNull() {
    if (this.actual === null) {
      throw new Error('Expected value not to be null');
    }
  }

  toContain(expected) {
    if (typeof this.actual === 'string') {
      if (this.actual.includes(expected)) {
        throw new Error(`Expected "${this.actual}" not to contain "${expected}"`);
      }
    } else if (Array.isArray(this.actual)) {
      if (this.actual.includes(expected)) {
        throw new Error(`Expected array not to contain ${JSON.stringify(expected)}`);
      }
    }
  }

  toMatch(pattern) {
    if (typeof this.actual !== 'string') {
      throw new Error('toMatch requires a string');
    }
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
    if (regex.test(this.actual)) {
      throw new Error(`Expected "${this.actual.substring(0, 100)}..." not to match ${pattern}`);
    }
  }
}

// Global test runner instance
const runner = new TestRunner();

// Export global test functions
global.describe = runner.describe.bind(runner);
global.test = runner.test.bind(runner);
global.beforeEach = runner.beforeEach.bind(runner);
global.expect = (actual) => new Assertions(actual);

module.exports = { TestRunner, runner };
