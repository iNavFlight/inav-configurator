/**
 * Optimizer Tests
 *
 * Tests for dead code detection and optimization.
 */

'use strict';

require('./simple_test_runner.cjs');

let Optimizer;

async function loadModules() {
  const module = await import('../optimizer.js');
  Optimizer = module.Optimizer;
}

describe('Dead Code Detection', () => {
  let optimizer;

  beforeEach(() => {
    optimizer = new Optimizer();
  });

  test('isAlwaysTrue detects 5 > 3', () => {
    const condition = {
      type: 'BinaryExpression',
      operator: '>',
      left: 5,
      right: 3
    };
    expect(optimizer.isAlwaysTrue(condition)).toBe(true);
    expect(optimizer.isAlwaysFalse(condition)).toBe(false);
  });

  test('isAlwaysFalse detects 3 > 5', () => {
    const condition = {
      type: 'BinaryExpression',
      operator: '>',
      left: 3,
      right: 5
    };
    expect(optimizer.isAlwaysTrue(condition)).toBe(false);
    expect(optimizer.isAlwaysFalse(condition)).toBe(true);
  });

  test('isAlwaysTrue detects 5 >= 5', () => {
    const condition = {
      type: 'BinaryExpression',
      operator: '>=',
      left: 5,
      right: 5
    };
    expect(optimizer.isAlwaysTrue(condition)).toBe(true);
    expect(optimizer.isAlwaysFalse(condition)).toBe(false);
  });

  test('isAlwaysFalse detects 4 >= 5', () => {
    const condition = {
      type: 'BinaryExpression',
      operator: '>=',
      left: 4,
      right: 5
    };
    expect(optimizer.isAlwaysTrue(condition)).toBe(false);
    expect(optimizer.isAlwaysFalse(condition)).toBe(true);
  });

  test('isAlwaysTrue detects 5 <= 5', () => {
    const condition = {
      type: 'BinaryExpression',
      operator: '<=',
      left: 5,
      right: 5
    };
    expect(optimizer.isAlwaysTrue(condition)).toBe(true);
    expect(optimizer.isAlwaysFalse(condition)).toBe(false);
  });

  test('isAlwaysFalse detects 6 <= 5', () => {
    const condition = {
      type: 'BinaryExpression',
      operator: '<=',
      left: 6,
      right: 5
    };
    expect(optimizer.isAlwaysTrue(condition)).toBe(false);
    expect(optimizer.isAlwaysFalse(condition)).toBe(true);
  });

  test('isAlwaysTrue detects 5 === 5', () => {
    const condition = {
      type: 'BinaryExpression',
      operator: '===',
      left: 5,
      right: 5
    };
    expect(optimizer.isAlwaysTrue(condition)).toBe(true);
    expect(optimizer.isAlwaysFalse(condition)).toBe(false);
  });

  test('isAlwaysFalse detects 5 === 6', () => {
    const condition = {
      type: 'BinaryExpression',
      operator: '===',
      left: 5,
      right: 6
    };
    expect(optimizer.isAlwaysTrue(condition)).toBe(false);
    expect(optimizer.isAlwaysFalse(condition)).toBe(true);
  });

  test('isAlwaysTrue handles literal true', () => {
    const condition = { value: true };
    expect(optimizer.isAlwaysTrue(condition)).toBe(true);
    expect(optimizer.isAlwaysFalse(condition)).toBe(false);
  });

  test('isAlwaysFalse handles literal false', () => {
    const condition = { value: false };
    expect(optimizer.isAlwaysTrue(condition)).toBe(false);
    expect(optimizer.isAlwaysFalse(condition)).toBe(true);
  });
});

module.exports = { loadModules };
