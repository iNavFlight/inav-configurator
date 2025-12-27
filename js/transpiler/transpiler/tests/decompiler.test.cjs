/**
 * Decompiler Test Cases
 *
 * Tests use correct INAV firmware operation codes and operand types.
 */

'use strict';

// Import test utilities
require('./simple_test_runner.cjs');

// We need to dynamically import the ESM module
let Decompiler;

async function loadDecompiler() {
  const module = await import('../decompiler.js');
  Decompiler = module.Decompiler;
}

describe('Decompiler', () => {
  let decompiler;

  beforeEach(() => {
    decompiler = new Decompiler();
  });

  describe('Basic Decompilation', () => {
    test('should handle empty logic conditions', () => {
      const result = decompiler.decompile([]);

      expect(result.success).toBe(true);
      expect(result.code).toContain('No logic conditions found');
      expect(result.warnings).toHaveLength(1);
    });

    test('should handle null input', () => {
      const result = decompiler.decompile(null);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid logic conditions');
    });

    test('should handle disabled conditions', () => {
      const conditions = [
        { index: 0, enabled: 0, operation: 0, activatorId: -1 }
      ];

      const result = decompiler.decompile(conditions);

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('if statement with armTimer', () => {
    test('should decompile if armTimer > delay as simple if statement', () => {
      const conditions = [
        // Condition: inav.flight.armTimer > 1000
        {
          index: 0,
          enabled: 1,
          activatorId: -1,
          operation: 2, // GREATER_THAN
          operandAType: 2, // FLIGHT
          operandAValue: 0, // armTimer
          operandBType: 0, // VALUE
          operandBValue: 1000
        },
        // Action: inav.gvar[0] = 100
        {
          index: 1,
          enabled: 1,
          activatorId: 0,
          operation: 18, // GVAR_SET
          operandAType: 0, // VALUE - specifies which gvar
          operandAValue: 0, // gvar index
          operandBType: 0, // VALUE
          operandBValue: 100
        }
      ];

      const result = decompiler.decompile(conditions);

      expect(result.success).toBe(true);
      expect(result.code).toContain('if (inav.flight.armTimer > 1000)');
      expect(result.code).toContain('inav.gvar[0] = 100');
    });
  });

  describe('if statement Handler', () => {
    test('should decompile simple if condition', () => {
      const conditions = [
        // Condition: inav.flight.homeDistance > 100
        {
          index: 0,
          enabled: 1,
          activatorId: -1,
          operation: 2, // GREATER_THAN
          operandAType: 2, // FLIGHT
          operandAValue: 1, // homeDistance
          operandBType: 0, // VALUE
          operandBValue: 100
        },
        // Action: inav.override.vtx.power = 3
        {
          index: 1,
          enabled: 1,
          activatorId: 0,
          operation: 25, // SET_VTX_POWER_LEVEL
          operandAType: 0,
          operandAValue: 3,  // Value in operandA per INAV firmware
          operandBType: 0,
          operandBValue: 0
        }
      ];

      const result = decompiler.decompile(conditions);

      expect(result.success).toBe(true);
      expect(result.code).toContain('if (inav.flight.homeDistance > 100)');
      expect(result.code).toContain('inav.override.vtx.power = 3');
    });

    test('should decompile if with multiple actions', () => {
      const conditions = [
        // Condition: inav.flight.cellVoltage < 350
        {
          index: 0,
          enabled: 1,
          activatorId: -1,
          operation: 3, // LOWER_THAN
          operandAType: 2, // FLIGHT
          operandAValue: 5, // cellVoltage
          operandBType: 0, // VALUE
          operandBValue: 350
        },
        // Action 1: inav.override.throttleScale = 50
        {
          index: 1,
          enabled: 1,
          activatorId: 0,
          operation: 23, // OVERRIDE_THROTTLE_SCALE
          operandAType: 0,
          operandAValue: 50,  // Value in operandA per INAV firmware
          operandBType: 0,
          operandBValue: 0
        },
        // Action 2: inav.gvar[0] = 1
        {
          index: 2,
          enabled: 1,
          activatorId: 0,
          operation: 18, // GVAR_SET
          operandAType: 0, // VALUE
          operandAValue: 0,
          operandBType: 0,
          operandBValue: 1
        }
      ];

      const result = decompiler.decompile(conditions);

      expect(result.success).toBe(true);
      expect(result.code).toContain('if (inav.flight.cellVoltage < 350)');
      expect(result.code).toContain('inav.override.throttleScale = 50');
      expect(result.code).toContain('inav.gvar[0] = 1');
    });
  });

  describe('Operand Decompilation', () => {
    test('should decompile flight parameters', () => {
      const param = decompiler.decompileOperand(2, 1); // FLIGHT, homeDistance
      expect(param).toBe('inav.flight.homeDistance');
    });

    test('should decompile gvar references', () => {
      const param = decompiler.decompileOperand(5, 0); // GVAR[0] (type 5)
      expect(param).toBe('inav.gvar[0]');
    });

    test('should decompile literal values', () => {
      const param = decompiler.decompileOperand(0, 100); // VALUE, 100
      expect(param).toBe('100');
    });
  });

  describe('Condition Decompilation', () => {
    test('should decompile comparison operators', () => {
      const conditions = [
        { operation: 1, operandAType: 2, operandAValue: 1, operandBType: 0, operandBValue: 100 }, // EQUAL
        { operation: 2, operandAType: 2, operandAValue: 1, operandBType: 0, operandBValue: 100 }, // GREATER_THAN
        { operation: 3, operandAType: 2, operandAValue: 1, operandBType: 0, operandBValue: 100 }  // LOWER_THAN
      ];

      expect(decompiler.decompileCondition(conditions[0])).toContain('===');
      expect(decompiler.decompileCondition(conditions[1])).toContain('>');
      expect(decompiler.decompileCondition(conditions[2])).toContain('<');
    });

    test('should decompile RC channel states', () => {
      const lc = {
        operation: 6, // HIGH
        operandAType: 1, // RC_CHANNEL
        operandAValue: 5,
        operandBType: 0,
        operandBValue: 0
      };

      const condition = decompiler.decompileCondition(lc);
      expect(condition).toContain('.high');
    });

    test('should decompile logical operators', () => {
      const andLC = {
        operation: 7, // AND
        operandAType: 0,
        operandAValue: 1,
        operandBType: 0,
        operandBValue: 1
      };

      const condition = decompiler.decompileCondition(andLC);
      expect(condition).toContain('&&');
    });
  });

  describe('Action Decompilation', () => {
    test('should decompile gvar operations', () => {
      const setGvar = {
        operation: 18, // GVAR_SET
        operandAType: 0, // VALUE
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 100
      };

      const action = decompiler.decompileAction(setGvar);
      expect(action).toBe('inav.gvar[0] = 100;');
    });

    test('should decompile increment/decrement', () => {
      const incGvar = {
        operation: 19, // GVAR_INC
        operandAType: 0, // VALUE
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 1
      };

      const action = decompiler.decompileAction(incGvar);
      expect(action).toContain('inav.gvar[0] = inav.gvar[0] + 1');
    });

    test('should decompile override operations', () => {
      const vtxPower = {
        operation: 25, // SET_VTX_POWER_LEVEL
        operandAType: 0,
        operandAValue: 3,  // Value in operandA per INAV firmware
        operandBType: 0,
        operandBValue: 0
      };

      const action = decompiler.decompileAction(vtxPower);
      expect(action).toBe('inav.override.vtx.power = 3;');
    });

    test('should decompile throttle scale override', () => {
      const throttleScale = {
        operation: 23, // OVERRIDE_THROTTLE_SCALE
        operandAType: 0,
        operandAValue: 50,  // Value in operandA per INAV firmware
        operandBType: 0,
        operandBValue: 0
      };

      const action = decompiler.decompileAction(throttleScale);
      expect(action).toBe('inav.override.throttleScale = 50;');
    });
  });

  describe('Complex Scenarios', () => {
    test('should decompile multiple independent if statements', () => {
      const conditions = [
        // First if: homeDistance > 100
        { index: 0, enabled: 1, activatorId: -1, operation: 2,
          operandAType: 2, operandAValue: 1, operandBType: 0, operandBValue: 100 },
        { index: 1, enabled: 1, activatorId: 0, operation: 25,
          operandAType: 0, operandAValue: 3, operandBType: 0, operandBValue: 0 },  // Value in operandA

        // Second if: cellVoltage < 350
        { index: 2, enabled: 1, activatorId: -1, operation: 3,
          operandAType: 2, operandAValue: 5, operandBType: 0, operandBValue: 350 },
        { index: 3, enabled: 1, activatorId: 2, operation: 23,
          operandAType: 0, operandAValue: 50, operandBType: 0, operandBValue: 0 }  // Value in operandA
      ];

      const result = decompiler.decompile(conditions);

      expect(result.success).toBe(true);
      expect(result.stats.groups).toBe(2);
      expect(result.code).toContain('inav.flight.homeDistance > 100');
      expect(result.code).toContain('inav.flight.cellVoltage < 350');
    });
  });

  describe('Condition with activator (nested condition)', () => {
    test('should handle comparison operation with activator without warning', () => {
      // This tests the fix for "Unknown operation 3 (Lower Than) in action"
      // When a comparison operation (like LOWER_THAN) has an activator,
      // it should be treated as an intermediate condition, not an action
      const conditions = [
        // LC 0: A condition (inav.rc[8] > 1500)
        {
          index: 0,
          enabled: 1,
          activatorId: -1,
          operation: 2, // GREATER_THAN
          operandAType: 1, // RC_CHANNEL
          operandAValue: 8,
          operandBType: 0, // VALUE
          operandBValue: 1500
        },
        // LC 1: Another condition with activator (comparison, not action)
        // This is: when LC0 is true, compute inav.flight.altitude < 1000
        {
          index: 1,
          enabled: 1,
          activatorId: 0, // Uses LC 0 as activator
          operation: 3, // LOWER_THAN - this is a comparison, not an action!
          operandAType: 2, // FLIGHT
          operandAValue: 12, // altitude
          operandBType: 0, // VALUE
          operandBValue: 1000
        },
        // LC 2: Actual action using LC 1 as activator
        {
          index: 2,
          enabled: 1,
          activatorId: 1,
          operation: 18, // GVAR_SET - this IS an action
          operandAType: 0,
          operandAValue: 0,
          operandBType: 0,
          operandBValue: 1
        }
      ];

      const result = decompiler.decompile(conditions);

      expect(result.success).toBe(true);
      // Should NOT have warning about "Unknown operation 3 (Lower Than) in action"
      const hasLowerThanWarning = result.warnings.some(w =>
        w.includes('Unknown operation') && w.includes('Lower Than')
      );
      expect(hasLowerThanWarning).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('should handle conditions with no actions', () => {
      const conditions = [
        { index: 0, enabled: 1, activatorId: -1, operation: 2,
          operandAType: 2, operandAValue: 1, operandBType: 0, operandBValue: 100 }
      ];

      const result = decompiler.decompile(conditions);

      expect(result.success).toBe(true);
    });
  });

  describe('Warning Generation', () => {
    test('should warn about unsupported features', () => {
      decompiler.warnings = [];

      // Use an unsupported operand type (99 is not a valid type)
      decompiler.decompileOperand(99, 0);

      expect(decompiler.warnings.length).toBeGreaterThan(0);
      expect(decompiler.warnings[0]).toContain('Unknown');
    });

    test('should include warnings in output', () => {
      const conditions = [
        {
          index: 0,
          enabled: 1,
          activatorId: -1,
          operation: 2,
          operandAType: 99, // Invalid operand type (unsupported)
          operandAValue: 0,
          operandBType: 0,
          operandBValue: 100
        }
      ];

      const result = decompiler.decompile(conditions);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.code).toContain('// Decompilation Warnings:');
    });
  });
});

describe('Decompiler Integration', () => {
  let decompiler;

  beforeEach(() => {
    decompiler = new Decompiler();
  });

  test('should handle real-world VTX power example', () => {
    const conditions = [
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 2,
        operandAType: 2,
        operandAValue: 1,
        operandBType: 0,
        operandBValue: 100
      },
      {
        index: 1,
        enabled: 1,
        activatorId: 0,
        operation: 25, // SET_VTX_POWER_LEVEL
        operandAType: 0,
        operandAValue: 3,  // Value in operandA per INAV firmware
        operandBType: 0,
        operandBValue: 0
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);
    expect(result.code).toContain('if (');
    expect(result.code).toContain('inav.flight.homeDistance > 100');
    expect(result.code).toContain('inav.override.vtx.power = 3');
  });

  test('should handle battery protection example', () => {
    const conditions = [
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 3,
        operandAType: 2,
        operandAValue: 5,
        operandBType: 0,
        operandBValue: 350
      },
      {
        index: 1,
        enabled: 1,
        activatorId: 0,
        operation: 23, // OVERRIDE_THROTTLE_SCALE
        operandAType: 0,
        operandAValue: 50,  // Value in operandA per INAV firmware
        operandBType: 0,
        operandBValue: 0
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);
    expect(result.code).toContain('if (inav.flight.cellVoltage < 350)');
    expect(result.code).toContain('inav.override.throttleScale = 50');
  });
});

describe('Duplicate Sticky and Empty Block Prevention', () => {
  let decompiler;

  beforeEach(() => {
    decompiler = new Decompiler();
  });

  test('should not produce duplicate sticky definitions or empty if blocks', () => {
    // This is a simplified version of jetrell-logic that exposed the bug:
    // - latch2 was appearing as a duplicate of latch1
    // - Empty if blocks like: if (latch2) { if (inav.flight.isAutoLaunch === 0) { } }
    const conditions = [
      // LC 0: inav.flight.gpsValid === 1 (outer condition)
      { index: 0, enabled: 1, activatorId: -1, operation: 1, operandAType: 2, operandAValue: 31, operandBType: 0, operandBValue: 1, flags: 0 },
      // LC 1: inav.flight.groundSpeed > 1000 (sticky ON condition)
      { index: 1, enabled: 1, activatorId: 0, operation: 2, operandAType: 2, operandAValue: 9, operandBType: 0, operandBValue: 1000, flags: 0 },
      // LC 2: STICKY(LC1, LC3) - the main sticky
      { index: 2, enabled: 1, activatorId: 0, operation: 13, operandAType: 4, operandAValue: 1, operandBType: 4, operandBValue: 3, flags: 0 },
      // LC 3: inav.flight.isArmed === 0 (sticky OFF condition)
      { index: 3, enabled: 1, activatorId: -1, operation: 1, operandAType: 2, operandAValue: 17, operandBType: 0, operandBValue: 0, flags: 0 },
      // LC 4: inav.flight.isAutoLaunch === 0 (nested condition)
      { index: 4, enabled: 1, activatorId: 2, operation: 1, operandAType: 2, operandAValue: 18, operandBType: 0, operandBValue: 0, flags: 0 },
      // LC 5: inav.gvar[0] = 1 (action inside nested condition)
      { index: 5, enabled: 1, activatorId: 4, operation: 18, operandAType: 0, operandAValue: 0, operandBType: 0, operandBValue: 1, flags: 0 }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);

    // Should only have ONE latch variable declaration (with or without = 0)
    const latchMatches = result.code.match(/var latch\d+/g) || [];
    expect(latchMatches.length).toBe(1);

    // Should only have ONE sticky assignment
    const stickyMatches = result.code.match(/latch\d+ = sticky\(/g) || [];
    expect(stickyMatches.length).toBe(1);

    // Should NOT have empty if blocks (if followed by { with only whitespace/newlines then })
    const emptyIfPattern = /if \([^)]+\) \{\s*\}/;
    const hasEmptyIf = emptyIfPattern.test(result.code);
    expect(hasEmptyIf).toBe(false);

    // Should have the action inside proper nesting
    expect(result.code).toContain('inav.gvar[0] = 1');
  });

  test('should not produce duplicate sticky at end with empty if blocks (jetrell-logic bug)', () => {
    // Full jetrell-logic conditions that exposed the bug:
    // The decompiler was producing a duplicate latch2 at the end with empty if blocks
    const conditions = [
      { index: 0, enabled: 1, activatorId: -1, operation: 1, operandAType: 2, operandAValue: 31, operandBType: 0, operandBValue: 1, flags: 0 },
      { index: 1, enabled: 1, activatorId: 0, operation: 2, operandAType: 2, operandAValue: 9, operandBType: 0, operandBValue: 1000, flags: 0 },
      { index: 2, enabled: 1, activatorId: 0, operation: 13, operandAType: 4, operandAValue: 1, operandBType: 4, operandBValue: 3, flags: 0 },
      { index: 3, enabled: 1, activatorId: -1, operation: 1, operandAType: 2, operandAValue: 17, operandBType: 0, operandBValue: 0, flags: 0 },
      { index: 4, enabled: 1, activatorId: 2, operation: 14, operandAType: 2, operandAValue: 11, operandBType: 0, operandBValue: 0, flags: 0 },
      { index: 5, enabled: 1, activatorId: 2, operation: 14, operandAType: 2, operandAValue: 10, operandBType: 0, operandBValue: 0, flags: 0 },
      { index: 12, enabled: 1, activatorId: -1, operation: 1, operandAType: 2, operandAValue: 31, operandBType: 0, operandBValue: 0, flags: 0 },
      { index: 20, enabled: 1, activatorId: -1, operation: 16, operandAType: 0, operandAValue: 50, operandBType: 0, operandBValue: 28, flags: 0 },
      { index: 21, enabled: 1, activatorId: 33, operation: 2, operandAType: 4, operandAValue: 5, operandBType: 4, operandBValue: 4, flags: 0 },
      { index: 22, enabled: 1, activatorId: 21, operation: 3, operandAType: 4, operandAValue: 4, operandBType: 4, operandBValue: 20, flags: 0 },
      { index: 23, enabled: 1, activatorId: 22, operation: 15, operandAType: 4, operandAValue: 20, operandBType: 4, operandBValue: 4, flags: 0 },
      { index: 24, enabled: 1, activatorId: 23, operation: 19, operandAType: 0, operandAValue: 0, operandBType: 4, operandBValue: 23, flags: 0 },
      { index: 25, enabled: 1, activatorId: 27, operation: 13, operandAType: 4, operandAValue: 24, operandBType: 4, operandBValue: 26, flags: 0 },
      { index: 26, enabled: 1, activatorId: 25, operation: 2, operandAType: 4, operandAValue: 4, operandBType: 4, operandBValue: 20, flags: 0 },
      { index: 27, enabled: 1, activatorId: 53, operation: 2, operandAType: 1, operandAValue: 11, operandBType: 0, operandBValue: 1480, flags: 0 },
      { index: 28, enabled: 1, activatorId: -1, operation: 47, operandAType: 4, operandAValue: 27, operandBType: 0, operandBValue: 100, flags: 0 },
      { index: 29, enabled: 1, activatorId: -1, operation: 50, operandAType: 1, operandAValue: 4, operandBType: 0, operandBValue: 90, flags: 0 },
      { index: 30, enabled: 1, activatorId: -1, operation: 1, operandAType: 2, operandAValue: 23, operandBType: 0, operandBValue: 1, flags: 0 },
      { index: 31, enabled: 1, activatorId: -1, operation: 8, operandAType: 4, operandAValue: 12, operandBType: 4, operandBValue: 29, flags: 0 },
      { index: 32, enabled: 1, activatorId: -1, operation: 8, operandAType: 4, operandAValue: 31, operandBType: 4, operandBValue: 30, flags: 0 },
      { index: 33, enabled: 1, activatorId: 27, operation: 13, operandAType: 4, operandAValue: 28, operandBType: 4, operandBValue: 32, flags: 0 },
      { index: 34, enabled: 1, activatorId: 33, operation: 12, operandAType: 4, operandAValue: 25, operandBType: 0, operandBValue: 0, flags: 0 },
      { index: 35, enabled: 1, activatorId: 34, operation: 15, operandAType: 1, operandAValue: 12, operandBType: 0, operandBValue: 1000, flags: 0 },
      { index: 36, enabled: 1, activatorId: 35, operation: 37, operandAType: 4, operandAValue: 35, operandBType: 0, operandBValue: 110, flags: 0 },
      { index: 37, enabled: 1, activatorId: 36, operation: 16, operandAType: 4, operandAValue: 36, operandBType: 0, operandBValue: 28, flags: 0 },
      { index: 38, enabled: 1, activatorId: 37, operation: 18, operandAType: 0, operandAValue: 0, operandBType: 4, operandBValue: 37, flags: 0 },
      { index: 39, enabled: 1, activatorId: 33, operation: 14, operandAType: 6, operandAValue: 3, operandBType: 0, operandBValue: 3000, flags: 0 },
      { index: 40, enabled: 1, activatorId: 33, operation: 17, operandAType: 4, operandAValue: 39, operandBType: 0, operandBValue: 2, flags: 0 },
      { index: 41, enabled: 1, activatorId: 33, operation: 43, operandAType: 0, operandAValue: 1800, operandBType: 4, operandBValue: 40, flags: 0 },
      { index: 42, enabled: 1, activatorId: 33, operation: 44, operandAType: 0, operandAValue: 1250, operandBType: 4, operandBValue: 41, flags: 0 },
      { index: 43, enabled: 1, activatorId: 33, operation: 44, operandAType: 4, operandAValue: 41, operandBType: 4, operandBValue: 42, flags: 0 },
      { index: 44, enabled: 1, activatorId: 33, operation: 29, operandAType: 4, operandAValue: 43, operandBType: 0, operandBValue: 0, flags: 0 },
      { index: 45, enabled: 1, activatorId: 33, operation: 17, operandAType: 4, operandAValue: 43, operandBType: 0, operandBValue: 10, flags: 0 },
      { index: 46, enabled: 1, activatorId: 33, operation: 15, operandAType: 4, operandAValue: 45, operandBType: 0, operandBValue: 100, flags: 0 },
      { index: 47, enabled: 1, activatorId: -1, operation: 1, operandAType: 3, operandAValue: 3, operandBType: 0, operandBValue: 1, flags: 0 },
      { index: 48, enabled: 1, activatorId: 33, operation: 6, operandAType: 1, operandAValue: 11, operandBType: 0, operandBValue: 0, flags: 0 },
      { index: 49, enabled: 1, activatorId: 33, operation: 8, operandAType: 4, operandAValue: 47, operandBType: 4, operandBValue: 48, flags: 0 },
      { index: 50, enabled: 1, activatorId: 49, operation: 18, operandAType: 0, operandAValue: 1, operandBType: 4, operandBValue: 4, flags: 0 },
      { index: 51, enabled: 1, activatorId: 33, operation: 12, operandAType: 4, operandAValue: 50, operandBType: 0, operandBValue: 0, flags: 0 },
      { index: 52, enabled: 1, activatorId: 51, operation: 18, operandAType: 0, operandAValue: 1, operandBType: 4, operandBValue: 5, flags: 0 },
      { index: 53, enabled: 1, activatorId: 2, operation: 1, operandAType: 2, operandAValue: 18, operandBType: 0, operandBValue: 0, flags: 0 }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);

    // Count latch variable declarations - should NOT have duplicates
    // The bug was producing: latch1, latch2, latch3... latch2 (duplicate at end)
    const latchDeclarations = result.code.match(/var latch\d+/g) || [];
    const uniqueLatches = new Set(latchDeclarations);
    expect(latchDeclarations.length).toBe(uniqueLatches.size); // No duplicates

    // Should NOT have empty if blocks like: if (latch2) { if (inav.flight.isAutoLaunch === 0) { } }
    const emptyIfPattern = /if \([^)]+\) \{\s*\}/;
    const hasEmptyIf = emptyIfPattern.test(result.code);
    expect(hasEmptyIf).toBe(false);
  });

  test('should not produce orphan sticky when referenced by another LC', () => {
    // Sticky that is referenced as an operand by another LC should not
    // produce a separate top-level sticky block
    const conditions = [
      // LC 0: outer condition
      { index: 0, enabled: 1, activatorId: -1, operation: 1, operandAType: 2, operandAValue: 31, operandBType: 0, operandBValue: 1, flags: 0 },
      // LC 1: ON condition for sticky
      { index: 1, enabled: 1, activatorId: -1, operation: 2, operandAType: 2, operandAValue: 9, operandBType: 0, operandBValue: 1000, flags: 0 },
      // LC 2: OFF condition for sticky
      { index: 2, enabled: 1, activatorId: -1, operation: 1, operandAType: 2, operandAValue: 17, operandBType: 0, operandBValue: 0, flags: 0 },
      // LC 3: STICKY(LC1, LC2) - used as activator for LC4 AND referenced by LC5
      { index: 3, enabled: 1, activatorId: 0, operation: 13, operandAType: 4, operandAValue: 1, operandBType: 4, operandBValue: 2, flags: 0 },
      // LC 4: action activated by sticky
      { index: 4, enabled: 1, activatorId: 3, operation: 18, operandAType: 0, operandAValue: 0, operandBType: 0, operandBValue: 1, flags: 0 },
      // LC 5: another sticky references LC3 as operand (tests referencedAsOperand handling)
      { index: 5, enabled: 1, activatorId: 0, operation: 13, operandAType: 4, operandAValue: 3, operandBType: 4, operandBValue: 2, flags: 0 },
      // LC 6: action activated by LC5
      { index: 6, enabled: 1, activatorId: 5, operation: 18, operandAType: 0, operandAValue: 1, operandBType: 0, operandBValue: 2, flags: 0 }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);

    // Count sticky assignments - should have reasonable number (not duplicates)
    const stickyMatches = result.code.match(/sticky\(/g) || [];
    // We expect 2 stickys (LC3 and LC5), not duplicates
    expect(stickyMatches.length).toBeLessThanOrEqual(2);
  });
});

describe('Round-trip Compilation', () => {
  let decompiler;

  beforeEach(() => {
    decompiler = new Decompiler();
  });

  test('should compile var latch = inav.events.sticky() inside if blocks correctly', async () => {
    // This tests the fix for nested sticky compilation
    // The decompiled code includes: if (inav.flight.gpsValid === 1) { var latch1 = inav.events.sticky({...}); if (latch1) {...} }
    const { Transpiler } = await import('../index.js');

    const code = `
const { flight, rc, gvar, sticky } = inav;

if (inav.flight.gpsValid === 1) {
  var latch1 = inav.events.sticky({
    on: () => inav.flight.groundSpeed > 1000,
    off: () => inav.flight.isArmed === 0
  });
  if (latch1) {
    inav.gvar[0] = 1;
  }
}
`;

    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);

    expect(result.success).toBe(true);
    expect(result.commands.length).toBe(5);

    // Verify the sticky has the correct activator (should be 0, not -1)
    // LC 3 should be STICKY with activator 0 (the gpsValid check)
    const stickyCmd = result.commands[3];
    expect(stickyCmd).toContain('logic 3 1 0 13'); // activator 0, operation 13 (STICKY)
  });

  test('should use pre-declaration for sticky with activator (scope fix)', async () => {
    // When a sticky has an activator, it's defined inside an if-block.
    // To avoid scope issues when referenced from outside, we pre-declare at top level.
    // Pattern: "var latch1;" at top, "latch1 = inav.events.sticky({...})" inside if-block
    const logicConditions = [
      { index: 0, enabled: 1, activatorId: -1, operation: 1, operandAType: 2, operandAValue: 31, operandBType: 0, operandBValue: 1, flags: 0 },
      { index: 1, enabled: 1, activatorId: 0, operation: 2, operandAType: 2, operandAValue: 9, operandBType: 0, operandBValue: 1000, flags: 0 },
      { index: 2, enabled: 1, activatorId: -1, operation: 1, operandAType: 2, operandAValue: 17, operandBType: 0, operandBValue: 0, flags: 0 },
      { index: 3, enabled: 1, activatorId: 0, operation: 13, operandAType: 4, operandAValue: 1, operandBType: 4, operandBValue: 2, flags: 0 },
      { index: 4, enabled: 1, activatorId: 3, operation: 18, operandAType: 0, operandAValue: 1, operandBType: 0, operandBValue: 0, flags: 0 },
    ];

    const result = decompiler.decompile(logicConditions);

    // Should have pre-declaration "var latch1;" at top (before if blocks)
    expect(result.code).toMatch(/^var latch1;$/m);
    // Should have assignment "latch1 = inav.events.sticky({" inside if-block (no var keyword)
    expect(result.code).toMatch(/^\s+latch1 = sticky\(\{/m);
  });

  test('should not produce duplicate let declarations from variableMap and hoisting', async () => {
    // When variableMap has a 'clamped' entry AND body generates 'let clamped' via hoisting,
    // we should only have ONE 'let clamped' declaration
    const { Transpiler } = await import('../index.js');

    // Create LCs that will generate hoisted 'let clamped' from Math.min
    const logicConditions = [
      { index: 0, enabled: 1, activatorId: -1, operation: 1, operandAType: 2, operandAValue: 31, operandBType: 0, operandBValue: 1, flags: 0 },
      { index: 1, enabled: 1, activatorId: 0, operation: 43, operandAType: 0, operandAValue: 500, operandBType: 5, operandBValue: 0, flags: 0 },
      { index: 2, enabled: 1, activatorId: 0, operation: 44, operandAType: 4, operandAValue: 1, operandBType: 0, operandBValue: 1000, flags: 0 },
      { index: 3, enabled: 1, activatorId: 0, operation: 43, operandAType: 0, operandAValue: 1800, operandBType: 4, operandBValue: 2, flags: 0 },
      { index: 4, enabled: 1, activatorId: 0, operation: 29, operandAType: 4, operandAValue: 3, operandBType: 0, operandBValue: 0, flags: 0 },
    ];

    // Simulate stale variableMap from Configurator with 'clamped' entry
    const variableMap = {
      let_variables: { clamped: { expression: 'Math.min(1800, something)' } },
      var_variables: {}
    };

    const result = decompiler.decompile(logicConditions, variableMap);

    // Count 'let clamped' - should be exactly 1
    const clampedMatches = result.code.match(/let clamped/g) || [];
    expect(clampedMatches.length).toBeLessThanOrEqual(1);

    // Should compile without "already declared" error
    const transpiler = new Transpiler();
    const compiled = transpiler.transpile(result.code);
    expect(compiled.success).toBe(true);
  });
});

describe('OPERAND_TYPE.LC in handleNot', () => {
  let decompiler;

  beforeEach(() => {
    decompiler = new Decompiler();
  });

  test('should decompile NOT(EQUAL) as !== using LC reference', () => {
    // This tests that OPERAND_TYPE.LC (value 4) is correctly used in handleNot
    // to recognize when operandA references another Logic Condition
    const conditions = [
      // LC 0: flight.vbat === 100
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 1, // EQUAL
        operandAType: 2, // FLIGHT
        operandAValue: 4, // VBAT
        operandBType: 0, // VALUE
        operandBValue: 100
      },
      // LC 1: NOT(LC 0) - should become flight.vbat !== 100
      {
        index: 1,
        enabled: 1,
        activatorId: -1,
        operation: 12, // NOT
        operandAType: 4, // OPERAND_TYPE.LC - this is what we're testing
        operandAValue: 0, // Reference to LC 0
        operandBType: 0,
        operandBValue: 0
      },
      // LC 2: Action activated by the NOT condition
      {
        index: 2,
        enabled: 1,
        activatorId: 1,
        operation: 18, // GVAR_SET
        operandAType: 0,
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 1
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);
    // handleNot should recognize LC reference and optimize NOT(EQUAL) to !==
    expect(result.code).toContain('!==');
    expect(result.code).toContain('flight.vbat');
    expect(result.code).toContain('100');
  });
});

describe('whenChanged (DELTA operation)', () => {
  let decompiler;

  beforeEach(() => {
    decompiler = new Decompiler();
  });

  test('should decompile DELTA operation as whenChanged()', () => {
    // DELTA operation monitors a value and triggers when it changes by threshold
    // whenChanged(flight.vbat, 100, () => { gvar[0] = 1; })
    const conditions = [
      // LC 0: DELTA operation - monitors vbat changes > 100
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 50, // DELTA
        operandAType: 2, // FLIGHT
        operandAValue: 4, // FLIGHT_PARAM.VBAT
        operandBType: 0, // VALUE
        operandBValue: 100 // threshold
      },
      // LC 1: Action - set gvar[0] = 1 when delta triggers
      {
        index: 1,
        enabled: 1,
        activatorId: 0,
        operation: 18, // GVAR_SET
        operandAType: 0, // VALUE
        operandAValue: 0, // gvar index
        operandBType: 0, // VALUE
        operandBValue: 1
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);
    // Should output whenChanged(), not delta()
    expect(result.code).toContain('whenChanged(');
    expect(result.code).not.toContain('delta(');
    expect(result.code).toContain('flight.vbat');
    expect(result.code).toContain('100');
  });
});

// Export the load function for the runner
module.exports = { loadDecompiler };
