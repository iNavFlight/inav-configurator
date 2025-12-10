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
        // Condition: flight.armTimer > 1000
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
        // Action: gvar[0] = 100
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
      expect(result.code).toContain('if (flight.armTimer > 1000)');
      expect(result.code).toContain('gvar[0] = 100');
    });
  });

  describe('if statement Handler', () => {
    test('should decompile simple if condition', () => {
      const conditions = [
        // Condition: flight.homeDistance > 100
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
        // Action: override.vtx.power = 3
        {
          index: 1,
          enabled: 1,
          activatorId: 0,
          operation: 25, // SET_VTX_POWER_LEVEL
          operandAType: 0,
          operandAValue: 0,
          operandBType: 0,
          operandBValue: 3
        }
      ];

      const result = decompiler.decompile(conditions);

      expect(result.success).toBe(true);
      expect(result.code).toContain('if (flight.homeDistance > 100)');
      expect(result.code).toContain('override.vtx.power = 3');
    });

    test('should decompile if with multiple actions', () => {
      const conditions = [
        // Condition: flight.cellVoltage < 350
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
        // Action 1: override.throttleScale = 50
        {
          index: 1,
          enabled: 1,
          activatorId: 0,
          operation: 23, // OVERRIDE_THROTTLE_SCALE
          operandAType: 0,
          operandAValue: 0,
          operandBType: 0,
          operandBValue: 50
        },
        // Action 2: gvar[0] = 1
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
      expect(result.code).toContain('if (flight.cellVoltage < 350)');
      expect(result.code).toContain('override.throttleScale = 50');
      expect(result.code).toContain('gvar[0] = 1');
    });
  });

  describe('Operand Decompilation', () => {
    test('should decompile flight parameters', () => {
      const param = decompiler.decompileOperand(2, 1); // FLIGHT, homeDistance
      expect(param).toBe('flight.homeDistance');
    });

    test('should decompile gvar references', () => {
      const param = decompiler.decompileOperand(5, 0); // GVAR[0] (type 5)
      expect(param).toBe('gvar[0]');
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
      expect(action).toBe('gvar[0] = 100;');
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
      expect(action).toContain('gvar[0] = gvar[0] + 1');
    });

    test('should decompile override operations', () => {
      const vtxPower = {
        operation: 25, // SET_VTX_POWER_LEVEL
        operandAType: 0,
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 3
      };

      const action = decompiler.decompileAction(vtxPower);
      expect(action).toBe('override.vtx.power = 3;');
    });

    test('should decompile throttle scale override', () => {
      const throttleScale = {
        operation: 23, // OVERRIDE_THROTTLE_SCALE
        operandAType: 0,
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 50
      };

      const action = decompiler.decompileAction(throttleScale);
      expect(action).toBe('override.throttleScale = 50;');
    });
  });

  describe('Complex Scenarios', () => {
    test('should decompile multiple independent if statements', () => {
      const conditions = [
        // First if: homeDistance > 100
        { index: 0, enabled: 1, activatorId: -1, operation: 2,
          operandAType: 2, operandAValue: 1, operandBType: 0, operandBValue: 100 },
        { index: 1, enabled: 1, activatorId: 0, operation: 25,
          operandAType: 0, operandAValue: 0, operandBType: 0, operandBValue: 3 },

        // Second if: cellVoltage < 350
        { index: 2, enabled: 1, activatorId: -1, operation: 3,
          operandAType: 2, operandAValue: 5, operandBType: 0, operandBValue: 350 },
        { index: 3, enabled: 1, activatorId: 2, operation: 23,
          operandAType: 0, operandAValue: 0, operandBType: 0, operandBValue: 50 }
      ];

      const result = decompiler.decompile(conditions);

      expect(result.success).toBe(true);
      expect(result.stats.groups).toBe(2);
      expect(result.code).toContain('flight.homeDistance > 100');
      expect(result.code).toContain('flight.cellVoltage < 350');
    });
  });

  describe('Condition with activator (nested condition)', () => {
    test('should handle comparison operation with activator without warning', () => {
      // This tests the fix for "Unknown operation 3 (Lower Than) in action"
      // When a comparison operation (like LOWER_THAN) has an activator,
      // it should be treated as an intermediate condition, not an action
      const conditions = [
        // LC 0: A condition (rc[8] > 1500)
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
        // This is: when LC0 is true, compute flight.altitude < 1000
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
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 3
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);
    expect(result.code).toContain('if (');
    expect(result.code).toContain('flight.homeDistance > 100');
    expect(result.code).toContain('override.vtx.power = 3');
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
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 50
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);
    expect(result.code).toContain('if (flight.cellVoltage < 350)');
    expect(result.code).toContain('override.throttleScale = 50');
  });
});

// Export the load function for the runner
module.exports = { loadDecompiler };
