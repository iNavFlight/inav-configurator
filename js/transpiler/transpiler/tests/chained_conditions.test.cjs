/**
 * Chained Conditions Test
 *
 * Tests for decompiler handling of chained conditions (activator chains)
 * where conditions form an AND chain without any actions.
 */

'use strict';

require('./simple_test_runner.cjs');

let Decompiler;

async function loadDecompiler() {
  const module = await import('../decompiler.js');
  Decompiler = module.Decompiler;
}

describe('Chained Conditions', () => {
  let decompiler;

  beforeEach(() => {
    decompiler = new Decompiler();
  });

  test('should combine chained conditions with AND', () => {
    // Chained conditions case:
    // logic 0 1 -1 1 2 39 0 1 0   # LC0: flight.param39 == 1 (root)
    // logic 1 1 0 1 2 17 0 1 0    # LC1: flight.isArmed == 1, activator=0
    // logic 2 1 1 2 2 9 0 1111 0  # LC2: flight.groundSpeed > 1111, activator=1
    const conditions = [
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 1, // EQUAL
        operandAType: 2, // FLIGHT
        operandAValue: 39, // mixerTransitionActive
        operandBType: 0, // VALUE
        operandBValue: 1
      },
      {
        index: 1,
        enabled: 1,
        activatorId: 0,
        operation: 1, // EQUAL
        operandAType: 2, // FLIGHT
        operandAValue: 17, // isArmed
        operandBType: 0, // VALUE
        operandBValue: 1
      },
      {
        index: 2,
        enabled: 1,
        activatorId: 1,
        operation: 2, // GREATER_THAN
        operandAType: 2, // FLIGHT
        operandAValue: 9, // groundSpeed
        operandBType: 0, // VALUE
        operandBValue: 1111
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);
    expect(result.warnings).toHaveLength(0);
    // Should contain all three conditions combined with &&
    expect(result.code).toContain('&&');
    expect(result.code).toContain('flight.mixerTransitionActive === 1');
    expect(result.code).toContain('flight.isArmed === 1');
    expect(result.code).toContain('flight.groundSpeed > 1111');
  });

  test('should handle long chain of 4 conditions', () => {
    // logic 19 1 -1 1 2 38 0 1 0   # LC19: param38 == 1 (root)
    // logic 20 1 19 1 2 17 0 1 0   # LC20: isArmed == 1, activator=19
    // logic 21 1 20 1 2 18 0 0 0   # LC21: isAutoLaunch == 0, activator=20
    // logic 22 1 21 3 2 11 0 1111 0 # LC22: airSpeed < 1111, activator=21
    const conditions = [
      {
        index: 19,
        enabled: 1,
        activatorId: -1,
        operation: 1, // EQUAL
        operandAType: 2, // FLIGHT
        operandAValue: 38, // activeMixerProfile
        operandBType: 0,
        operandBValue: 1
      },
      {
        index: 20,
        enabled: 1,
        activatorId: 19,
        operation: 1, // EQUAL
        operandAType: 2, // FLIGHT
        operandAValue: 17, // isArmed
        operandBType: 0,
        operandBValue: 1
      },
      {
        index: 21,
        enabled: 1,
        activatorId: 20,
        operation: 1, // EQUAL
        operandAType: 2, // FLIGHT
        operandAValue: 18, // isAutoLaunch
        operandBType: 0,
        operandBValue: 0
      },
      {
        index: 22,
        enabled: 1,
        activatorId: 21,
        operation: 3, // LOWER_THAN
        operandAType: 2, // FLIGHT
        operandAValue: 11, // airSpeed
        operandBType: 0,
        operandBValue: 1111
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);
    expect(result.warnings).toHaveLength(0);
    // Should contain all four conditions
    expect(result.code).toContain('flight.activeMixerProfile === 1');
    expect(result.code).toContain('flight.isArmed === 1');
    expect(result.code).toContain('flight.isAutoLaunch === 0');
    expect(result.code).toContain('flight.airSpeed < 1111');
  });

  test('should output conditions without actions (readable externally)', () => {
    // A single condition with no actions should still be output
    const conditions = [
      {
        index: 5,
        enabled: 1,
        activatorId: -1,
        operation: 2, // GREATER_THAN
        operandAType: 2, // FLIGHT
        operandAValue: 1, // homeDistance
        operandBType: 0,
        operandBValue: 500
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);
    // Should contain the condition
    expect(result.code).toContain('flight.homeDistance > 500');
    // Should indicate it can be read externally
    expect(result.code).toContain('logicCondition[5]');
  });

  test('should not produce warnings for comparison with activator', () => {
    // This was the original bug: "Unknown operation 3 (Lower Than) in action"
    const conditions = [
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 2, // GREATER_THAN
        operandAType: 1, // RC_CHANNEL
        operandAValue: 8,
        operandBType: 0,
        operandBValue: 1500
      },
      {
        index: 1,
        enabled: 1,
        activatorId: 0,
        operation: 3, // LOWER_THAN - this should NOT produce "Unknown operation" warning
        operandAType: 2, // FLIGHT
        operandAValue: 12, // altitude
        operandBType: 0,
        operandBValue: 1000
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);
    // Should NOT have warning about "Unknown operation 3 (Lower Than)"
    const hasLowerThanWarning = result.warnings.some(w =>
      w.includes('Unknown operation') && w.includes('Lower Than')
    );
    expect(hasLowerThanWarning).toBe(false);
  });
});

module.exports = { loadDecompiler };
