/**
 * Test: Missing Override with Simple Condition Activator
 *
 * Bug: LC 35 (Override rc[16]=1750 when rc[12].high) is missing from output.
 * The activator (LC 5 = rc[12].high) is also used as operand in a sticky,
 * which may cause the decompiler to skip the override action.
 */

'use strict';

require('./simple_test_runner.cjs');

let Decompiler;

async function loadDecompiler() {
  const module = await import('../decompiler.js');
  Decompiler = module.Decompiler;
}

describe('Override with Simple Condition Activator', () => {
  let decompiler;

  beforeEach(() => {
    decompiler = new Decompiler();
  });

  test('should decompile override action when activator is a simple HIGH condition', () => {
    // Simplified version of the VTOL bug:
    // LC 5: rc[12].high
    // LC 35: Override rc[16]=1750, active when LC 5
    //
    // Expected output should include:
    //   if (rc[12].high) { rc[16] = 1750; }

    const conditions = [
      // LC 0: rc[12].high (simple condition)
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 6, // HIGH
        operandAType: 1, // RC_CHANNEL
        operandAValue: 12,
        operandBType: 0,
        operandBValue: 0
      },
      // LC 1: Override rc[16]=1750, active when LC 0
      {
        index: 1,
        enabled: 1,
        activatorId: 0,
        operation: 38, // OVERRIDE_RC_CHANNEL
        operandAType: 0, // VALUE (channel number)
        operandAValue: 16,
        operandBType: 0, // VALUE
        operandBValue: 1750
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);
    // Should have the override in output
    expect(result.code).toContain('inav.rc[16] = 1750');
    // Should be inside a condition block for rc[12].high
    expect(result.code).toContain('inav.rc[12].high');
  });

  test('should decompile override even when activator is also used in sticky operand', () => {
    // Full reproduction of the VTOL bug:
    // LC 5: rc[12].high (used as activator for LC 35, AND as operand for LC 11)
    // LC 10: ground condition
    // LC 11: STICKY(LC 5, LC 10) - uses LC 5 as operand
    // LC 35: Override rc[16]=1750, active when LC 5
    //
    // The bug: LC 5 is in referencedBySpecialOps (because STICKY uses it),
    // so it gets skipped as a root, and LC 35 never gets processed.

    const conditions = [
      // LC 0: rc[12].low
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
      // LC 1: rc[12].high - THIS IS THE KEY LC
      // It's used as operand by STICKY (LC 3) AND as activator for override (LC 5)
      {
        index: 1,
        enabled: 1,
        activatorId: -1,
        operation: 6, // HIGH
        operandAType: 1, // RC_CHANNEL
        operandAValue: 12,
        operandBType: 0,
        operandBValue: 0
      },
      // LC 2: ground condition (flight.isArmed === 0)
      {
        index: 2,
        enabled: 1,
        activatorId: -1,
        operation: 1, // EQUAL
        operandAType: 2, // FLIGHT
        operandAValue: 17, // isArmed
        operandBType: 0,
        operandBValue: 0
      },
      // LC 3: STICKY(LC 1, LC 2) - uses rc[12].high (LC 1) as ON condition
      // This causes LC 1 to be in referencedBySpecialOps
      {
        index: 3,
        enabled: 1,
        activatorId: -1,
        operation: 13, // STICKY
        operandAType: 4, // LC
        operandAValue: 1, // LC 1 (rc[12].high)
        operandBType: 4, // LC
        operandBValue: 2  // LC 2 (ground)
      },
      // LC 4: Action using sticky
      {
        index: 4,
        enabled: 1,
        activatorId: 3,
        operation: 18, // GVAR_SET
        operandAType: 0,
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 1
      },
      // LC 5: Override rc[16]=1750, active when LC 1 (rc[12].high)
      // BUG: This action goes MISSING because LC 1 is skipped as root
      // (it's in referencedBySpecialOps due to STICKY)
      {
        index: 5,
        enabled: 1,
        activatorId: 1, // LC 1 (rc[12].high) - but LC 1 won't be processed as root!
        operation: 38, // OVERRIDE_RC_CHANNEL
        operandAType: 0, // VALUE (channel number)
        operandAValue: 16,
        operandBType: 0, // VALUE
        operandBValue: 1750
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);

    // Should have BOTH:
    // 1. The sticky definition
    expect(result.code).toContain('sticky(');

    // 2. The override should be present
    expect(result.code).toContain('inav.rc[16] = 1750');

    // The override should NOT be orphaned - it should be in a proper if block
    expect(result.code).not.toContain('Orphaned');
    expect(result.code).not.toContain('unprocessed activator');

    // The override should be nested inside if (inav.rc[12].high) { ... }
    // Check that inav.rc[12].high appears as a condition (not just in sticky)
    const hasHighCondition = /if\s*\(\s*inav\.rc\[12\]\.high\s*\)/.test(result.code);
    expect(hasHighCondition).toBe(true);
  });

  test('should handle multiple actions with same activator', () => {
    // Multiple actions depending on the same condition
    const conditions = [
      // LC 0: rc[12].high
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 6, // HIGH
        operandAType: 1, // RC_CHANNEL
        operandAValue: 12,
        operandBType: 0,
        operandBValue: 0
      },
      // LC 1: gvar[0] = 1, active when LC 0
      {
        index: 1,
        enabled: 1,
        activatorId: 0,
        operation: 18, // GVAR_SET
        operandAType: 0,
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 1
      },
      // LC 2: rc[16] = 1750, active when LC 0
      {
        index: 2,
        enabled: 1,
        activatorId: 0,
        operation: 38, // OVERRIDE_RC_CHANNEL
        operandAType: 0,
        operandAValue: 16,
        operandBType: 0,
        operandBValue: 1750
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);
    expect(result.code).toContain('inav.gvar[0] = 1');
    expect(result.code).toContain('inav.rc[16] = 1750');
  });
});

module.exports = { loadDecompiler };
