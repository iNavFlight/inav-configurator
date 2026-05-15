/**
 * Tests for extractValue() function
 *
 * These tests must pass BEFORE we refactor extractValue() into a shared module.
 * They document the expected behavior for:
 * - NumericLiteral, StringLiteral
 * - UnaryExpression (negation)
 * - BinaryExpression (constant folding)
 * - Identifier, MemberExpression
 * - ParenthesizedExpression
 * - CallExpression
 */

'use strict';

// Import test utilities - sets up global describe, test, beforeEach, expect
require('./simple_test_runner.cjs');

let JavaScriptParser;
let ArrowFunctionHelper;
let sharedExtractValue, sharedExtractIdentifier, sharedCreateExtractionHelpers;

// Load ESM modules before tests run
async function loadModules() {
  const parserMod = await import('../parser.js');
  JavaScriptParser = parserMod.JavaScriptParser;

  const helperMod = await import('../arrow_function_helper.js');
  ArrowFunctionHelper = helperMod.ArrowFunctionHelper;

  const utilsMod = await import('../expression_utils.js');
  sharedExtractValue = utilsMod.extractValue;
  sharedExtractIdentifier = utilsMod.extractIdentifier;
  sharedCreateExtractionHelpers = utilsMod.createExtractionHelpers;
}

describe('extractValue() - Parser implementation', () => {
  describe('Literal values', () => {
    test('should extract numeric literal', () => {
      const parser = new JavaScriptParser();
      const result = parser.extractValue({ type: 'Literal', value: 42 });
      expect(result).toBe(42);
    });

    test('should extract negative numeric literal via UnaryExpression', () => {
      const parser = new JavaScriptParser();
      const result = parser.extractValue({
        type: 'UnaryExpression',
        operator: '-',
        argument: { type: 'Literal', value: 10 }
      });
      expect(result).toBe(-10);
    });

    test('should extract string literal', () => {
      const parser = new JavaScriptParser();
      const result = parser.extractValue({ type: 'Literal', value: 'hello' });
      expect(result).toBe('hello');
    });

    test('should return null for null input', () => {
      const parser = new JavaScriptParser();
      const result = parser.extractValue(null);
      expect(result).toBe(null);
    });

    test('should return null for undefined input', () => {
      const parser = new JavaScriptParser();
      const result = parser.extractValue(undefined);
      expect(result).toBe(null);
    });
  });

  describe('Identifier', () => {
    test('should extract identifier name', () => {
      const parser = new JavaScriptParser();
      const result = parser.extractValue({ type: 'Identifier', name: 'foo' });
      expect(result).toBe('foo');
    });
  });

  describe('BinaryExpression - constant folding', () => {
    test('should compute addition of constants', () => {
      const parser = new JavaScriptParser();
      const result = parser.extractValue({
        type: 'BinaryExpression',
        operator: '+',
        left: { type: 'Literal', value: 10 },
        right: { type: 'Literal', value: 5 }
      });
      expect(result).toBe(15);
    });

    test('should compute subtraction of constants', () => {
      const parser = new JavaScriptParser();
      const result = parser.extractValue({
        type: 'BinaryExpression',
        operator: '-',
        left: { type: 'Literal', value: 10 },
        right: { type: 'Literal', value: 3 }
      });
      expect(result).toBe(7);
    });

    test('should compute multiplication of constants (50 * 28)', () => {
      const parser = new JavaScriptParser();
      const result = parser.extractValue({
        type: 'BinaryExpression',
        operator: '*',
        left: { type: 'Literal', value: 50 },
        right: { type: 'Literal', value: 28 }
      });
      expect(result).toBe(1400);
    });

    test('should compute division with floor (integer division)', () => {
      const parser = new JavaScriptParser();
      const result = parser.extractValue({
        type: 'BinaryExpression',
        operator: '/',
        left: { type: 'Literal', value: 10 },
        right: { type: 'Literal', value: 3 }
      });
      expect(result).toBe(3); // Math.floor(10/3) = 3
    });

    test('should compute modulus of constants', () => {
      const parser = new JavaScriptParser();
      const result = parser.extractValue({
        type: 'BinaryExpression',
        operator: '%',
        left: { type: 'Literal', value: 10 },
        right: { type: 'Literal', value: 3 }
      });
      expect(result).toBe(1);
    });

    test('should return BinaryExpression node for non-constant operands', () => {
      const parser = new JavaScriptParser();
      const result = parser.extractValue({
        type: 'BinaryExpression',
        operator: '+',
        left: { type: 'Identifier', name: 'x' },
        right: { type: 'Literal', value: 5 }
      });
      expect(result).not.toBe(null);
      expect(result.type).toBe('BinaryExpression');
      expect(result.operator).toBe('+');
      expect(result.left).toBe('x');
      expect(result.right).toBe(5);
    });

    test('should handle nested constant expressions ((50 * 28) + 100)', () => {
      const parser = new JavaScriptParser();
      const result = parser.extractValue({
        type: 'BinaryExpression',
        operator: '+',
        left: {
          type: 'BinaryExpression',
          operator: '*',
          left: { type: 'Literal', value: 50 },
          right: { type: 'Literal', value: 28 }
        },
        right: { type: 'Literal', value: 100 }
      });
      expect(result).toBe(1500);
    });
  });

  describe('UnaryExpression', () => {
    test('should negate numeric literal', () => {
      const parser = new JavaScriptParser();
      const result = parser.extractValue({
        type: 'UnaryExpression',
        operator: '-',
        argument: { type: 'Literal', value: 42 }
      });
      expect(result).toBe(-42);
    });

    test('should negate result of constant BinaryExpression', () => {
      const parser = new JavaScriptParser();
      const result = parser.extractValue({
        type: 'UnaryExpression',
        operator: '-',
        argument: {
          type: 'BinaryExpression',
          operator: '+',
          left: { type: 'Literal', value: 10 },
          right: { type: 'Literal', value: 5 }
        }
      });
      expect(result).toBe(-15);
    });

    test('should pass through non-numeric values unchanged', () => {
      const parser = new JavaScriptParser();
      const result = parser.extractValue({
        type: 'UnaryExpression',
        operator: '-',
        argument: { type: 'Identifier', name: 'x' }
      });
      // When argument is not a number, returns the value as-is
      expect(result).toBe('x');
    });
  });
});

describe('extractValue() - ArrowFunctionHelper implementation', () => {
  describe('Literal values', () => {
    test('should extract numeric literal', () => {
      const helper = new ArrowFunctionHelper({});
      const result = helper.extractValue({ type: 'Literal', value: 42 });
      expect(result).toBe(42);
    });

    test('should extract negative numeric literal via UnaryExpression', () => {
      const helper = new ArrowFunctionHelper({});
      const result = helper.extractValue({
        type: 'UnaryExpression',
        operator: '-',
        argument: { type: 'Literal', value: 10 }
      });
      expect(result).toBe(-10);
    });
  });

  describe('BinaryExpression - constant folding', () => {
    test('should compute multiplication of constants (50 * 28)', () => {
      const helper = new ArrowFunctionHelper({});
      const result = helper.extractValue({
        type: 'BinaryExpression',
        operator: '*',
        left: { type: 'Literal', value: 50 },
        right: { type: 'Literal', value: 28 }
      });
      expect(result).toBe(1400);
    });

    test('should compute division with floor (integer division)', () => {
      const helper = new ArrowFunctionHelper({});
      const result = helper.extractValue({
        type: 'BinaryExpression',
        operator: '/',
        left: { type: 'Literal', value: 10 },
        right: { type: 'Literal', value: 3 }
      });
      expect(result).toBe(3);
    });
  });

  describe('ParenthesizedExpression', () => {
    test('should unwrap ParenthesizedExpression', () => {
      const helper = new ArrowFunctionHelper({});
      const result = helper.extractValue({
        type: 'ParenthesizedExpression',
        expression: { type: 'Literal', value: 42 }
      });
      expect(result).toBe(42);
    });

    test('should handle extra.parenthesized flag', () => {
      const helper = new ArrowFunctionHelper({});
      const result = helper.extractValue({
        type: 'Literal',
        value: 42,
        extra: { parenthesized: true }
      });
      // With parenthesized flag, value is extracted from expression field
      // But if no expression field, falls through to Literal handling
      expect(result).toBe(42);
    });
  });
});

describe('extractValue() - Consistency between implementations', () => {
  test('both should handle (50 * 28) identically', () => {
    const expr = {
      type: 'BinaryExpression',
      operator: '*',
      left: { type: 'Literal', value: 50 },
      right: { type: 'Literal', value: 28 }
    };

    const parser = new JavaScriptParser();
    const helper = new ArrowFunctionHelper({});

    const parserResult = parser.extractValue(expr);
    const helperResult = helper.extractValue(expr);

    expect(parserResult).toBe(1400);
    expect(helperResult).toBe(1400);
    expect(parserResult).toBe(helperResult);
  });

  test('both should handle nested expressions identically', () => {
    const expr = {
      type: 'BinaryExpression',
      operator: '-',
      left: {
        type: 'BinaryExpression',
        operator: '*',
        left: { type: 'Literal', value: 10 },
        right: { type: 'Literal', value: 5 }
      },
      right: { type: 'Literal', value: 25 }
    };

    const parser = new JavaScriptParser();
    const helper = new ArrowFunctionHelper({});

    const parserResult = parser.extractValue(expr);
    const helperResult = helper.extractValue(expr);

    expect(parserResult).toBe(25); // (10 * 5) - 25 = 25
    expect(helperResult).toBe(25);
  });

  test('both should return null for unknown expression types', () => {
    const expr = { type: 'UnknownType', foo: 'bar' };

    const parser = new JavaScriptParser();
    const helper = new ArrowFunctionHelper({});

    expect(parser.extractValue(expr)).toBe(null);
    expect(helper.extractValue(expr)).toBe(null);
  });
});

describe('extractValue() - Shared expression_utils module', () => {
  describe('extractValue standalone', () => {
    test('should extract numeric literal', () => {
      const result = sharedExtractValue({ type: 'Literal', value: 42 });
      expect(result).toBe(42);
    });

    test('should compute (50 * 28)', () => {
      const result = sharedExtractValue({
        type: 'BinaryExpression',
        operator: '*',
        left: { type: 'Literal', value: 50 },
        right: { type: 'Literal', value: 28 }
      });
      expect(result).toBe(1400);
    });

    test('should handle ParenthesizedExpression', () => {
      const result = sharedExtractValue({
        type: 'ParenthesizedExpression',
        expression: { type: 'Literal', value: 42 }
      });
      expect(result).toBe(42);
    });

    test('should handle negative numbers', () => {
      const result = sharedExtractValue({
        type: 'UnaryExpression',
        operator: '-',
        argument: { type: 'Literal', value: 10 }
      });
      expect(result).toBe(-10);
    });
  });

  describe('extractIdentifier standalone', () => {
    test('should extract simple identifier', () => {
      const extractValueFn = (e) => sharedExtractValue(e);
      const result = sharedExtractIdentifier({ type: 'Identifier', name: 'foo' }, extractValueFn);
      expect(result).toBe('foo');
    });

    test('should extract dot access path', () => {
      const extractValueFn = (e) => sharedExtractValue(e);
      const result = sharedExtractIdentifier({
        type: 'MemberExpression',
        computed: false,
        object: { type: 'Identifier', name: 'flight' },
        property: { type: 'Identifier', name: 'altitude' }
      }, extractValueFn);
      expect(result).toBe('flight.altitude');
    });

    test('should extract computed access', () => {
      const extractValueFn = (e) => sharedExtractValue(e);
      const result = sharedExtractIdentifier({
        type: 'MemberExpression',
        computed: true,
        object: { type: 'Identifier', name: 'gvar' },
        property: { type: 'Literal', value: 0 }
      }, extractValueFn);
      expect(result).toBe('gvar[0]');
    });
  });

  describe('createExtractionHelpers', () => {
    test('should create bound helper functions', () => {
      const helpers = sharedCreateExtractionHelpers();
      const result = helpers.extractValue({ type: 'Literal', value: 42 });
      expect(result).toBe(42);
    });

    test('should support CallExpression callback', () => {
      const helpers = sharedCreateExtractionHelpers({
        onCallExpression: (expr) => ({ type: 'call', callee: expr.callee })
      });
      const result = helpers.extractValue({
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'test' }
      });
      expect(result.type).toBe('call');
    });
  });
});

// Export loadModules for the test runner
module.exports = { loadModules };
