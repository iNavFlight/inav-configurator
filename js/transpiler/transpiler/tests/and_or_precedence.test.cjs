/**
 * Test: AND/OR Operator Precedence in Decompiler
 *
 * Tests that when OR is nested inside AND, parentheses are added
 * to preserve correct operator precedence.
 *
 * Bug: LC 9 = OR(LC7, LC8) produces "A || B"
 *      LC 10 = AND(LC3, LC9) produces "C && A || B"
 *      JS precedence makes this "(C && A) || B" - WRONG!
 *
 * Fix: OR should produce "(A || B)" so AND becomes "C && (A || B)"
 */

'use strict';

require('./simple_test_runner.cjs');

let Decompiler;

async function loadDecompiler() {
  const module = await import('../decompiler.js');
  Decompiler = module.Decompiler;
}

describe('AND/OR Operator Precedence', () => {
  let decompiler;

  beforeEach(() => {
    decompiler = new Decompiler();
  });

  test('should wrap OR in parentheses when used as operand to AND', () => {
    // This mirrors the VTOL logic from the screenshots:
    // LC 7: throttle < 2%
    // LC 8: current < 300
    // LC 9: OR(LC7, LC8) - "low throttle OR low current"
    // LC 10: AND(LC3, LC9) - "switch low AND (low throttle OR low current)"
    //
    // Without parens: "rc[12].low && flight.throttlePos < 2 || flight.current < 300"
    // JS parses as: "(rc[12].low && flight.throttlePos < 2) || flight.current < 300"
    // This means current < 300 alone triggers the condition - WRONG!
    //
    // With parens: "rc[12].low && (flight.throttlePos < 2 || flight.current < 300)"
    // Both conditions require rc[12].low to be true - CORRECT!

    const conditions = [
      // LC 0: rc[12].low (switch in low position)
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 4, // LOW
        operandAType: 1, // RC_CHANNEL
        operandAValue: 12,
        operandBType: 0,
        operandBValue: 0
      },
      // LC 1: flight.throttlePos < 2
      {
        index: 1,
        enabled: 1,
        activatorId: -1,
        operation: 3, // LOWER_THAN
        operandAType: 2, // FLIGHT
        operandAValue: 32, // throttlePos
        operandBType: 0, // VALUE
        operandBValue: 2
      },
      // LC 2: flight.current < 300
      {
        index: 2,
        enabled: 1,
        activatorId: -1,
        operation: 3, // LOWER_THAN
        operandAType: 2, // FLIGHT
        operandAValue: 6, // current
        operandBType: 0, // VALUE
        operandBValue: 300
      },
      // LC 3: OR(LC1, LC2) - "low throttle OR low current"
      {
        index: 3,
        enabled: 1,
        activatorId: -1,
        operation: 8, // OR
        operandAType: 4, // LC
        operandAValue: 1,
        operandBType: 4, // LC
        operandBValue: 2
      },
      // LC 4: AND(LC0, LC3) - "switch low AND (throttle OR current)"
      {
        index: 4,
        enabled: 1,
        activatorId: -1,
        operation: 7, // AND
        operandAType: 4, // LC
        operandAValue: 0,
        operandBType: 4, // LC
        operandBValue: 3
      },
      // LC 5: Action when LC 4 is true
      {
        index: 5,
        enabled: 1,
        activatorId: 4,
        operation: 18, // GVAR_SET
        operandAType: 0,
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 1
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);

    // The key test: OR result must be either:
    // 1. Wrapped in parentheses: && (something || something), OR
    // 2. Hoisted to a variable: const cond1 = a || b; ... && cond1
    const hasInlineParens = result.code.includes('&& (') &&
      result.code.includes('||') &&
      result.code.includes(')');
    const hasHoistedOr = result.code.includes('const cond') &&
      result.code.includes('||');

    const hasCorrectPrecedence = hasInlineParens || hasHoistedOr;

    // More specific: should NOT have "&&" followed directly by a comparison without parens/hoisting
    // Bad: "rc[12].low && flight.throttlePos < 2 || flight.current < 300"
    // Good: "rc[12].low && (flight.throttlePos < 2 || flight.current < 300)" or hoisted variable
    const badPattern = /\.low && flight\.\w+ < \d+ \|\|/;
    const hasBadPrecedence = badPattern.test(result.code);

    expect(hasBadPrecedence).toBe(false);
    expect(hasCorrectPrecedence).toBe(true);
  });

  test('should handle nested OR inside AND with rc channel conditions', () => {
    // Simpler test case with direct values
    const conditions = [
      // LC 0: value 1 (true)
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 1, // EQUAL
        operandAType: 0, // VALUE
        operandAValue: 1,
        operandBType: 0,
        operandBValue: 1
      },
      // LC 1: value 2 (true)
      {
        index: 1,
        enabled: 1,
        activatorId: -1,
        operation: 1, // EQUAL
        operandAType: 0, // VALUE
        operandAValue: 2,
        operandBType: 0,
        operandBValue: 2
      },
      // LC 2: OR(LC0, LC1)
      {
        index: 2,
        enabled: 1,
        activatorId: -1,
        operation: 8, // OR
        operandAType: 4, // LC
        operandAValue: 0,
        operandBType: 4, // LC
        operandBValue: 1
      },
      // LC 3: value 3 (true)
      {
        index: 3,
        enabled: 1,
        activatorId: -1,
        operation: 1, // EQUAL
        operandAType: 0, // VALUE
        operandAValue: 3,
        operandBType: 0,
        operandBValue: 3
      },
      // LC 4: AND(LC3, LC2) - tests AND with OR as right operand
      {
        index: 4,
        enabled: 1,
        activatorId: -1,
        operation: 7, // AND
        operandAType: 4, // LC
        operandAValue: 3,
        operandBType: 4, // LC
        operandBValue: 2
      },
      // LC 5: Action
      {
        index: 5,
        enabled: 1,
        activatorId: 4,
        operation: 18, // GVAR_SET
        operandAType: 0,
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 1
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);

    // The OR should be wrapped in parentheses
    // Pattern: something && (something || something)
    const orPattern = /\|\|/;
    const andPattern = /&&/;

    expect(orPattern.test(result.code)).toBe(true);
    expect(andPattern.test(result.code)).toBe(true);

    // Check that we have either:
    // 1. Parentheses around the OR: && (a || b)
    // 2. Hoisted variable: const cond1 = a || b; ... && cond1
    const hasParensAroundOr = /&&\s*\([^)]*\|\|[^)]*\)/.test(result.code);
    const hasHoistedOr = result.code.includes('const cond') && result.code.includes('||');
    expect(hasParensAroundOr || hasHoistedOr).toBe(true);
  });

  test('standalone OR should work without extra parentheses in simple cases', () => {
    // When OR is at top level (not inside AND), parens are still safe but not strictly required
    const conditions = [
      // LC 0: flight.altitude > 100
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 2, // GREATER_THAN
        operandAType: 2, // FLIGHT
        operandAValue: 12, // altitude
        operandBType: 0,
        operandBValue: 100
      },
      // LC 1: flight.homeDistance > 50
      {
        index: 1,
        enabled: 1,
        activatorId: -1,
        operation: 2, // GREATER_THAN
        operandAType: 2, // FLIGHT
        operandAValue: 1, // homeDistance
        operandBType: 0,
        operandBValue: 50
      },
      // LC 2: OR(LC0, LC1)
      {
        index: 2,
        enabled: 1,
        activatorId: -1,
        operation: 8, // OR
        operandAType: 4, // LC
        operandAValue: 0,
        operandBType: 4, // LC
        operandBValue: 1
      },
      // LC 3: Action
      {
        index: 3,
        enabled: 1,
        activatorId: 2,
        operation: 18, // GVAR_SET
        operandAType: 0,
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 1
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);
    // Should contain OR operator
    expect(result.code).toContain('||');
    // Should decompile successfully with readable output
    expect(result.code).toContain('flight.altitude');
    expect(result.code).toContain('flight.homeDistance');
  });
});

module.exports = { loadDecompiler };
