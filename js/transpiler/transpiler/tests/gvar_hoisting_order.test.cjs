/**
 * GVAR Dependency Hoisting Test
 *
 * Tests that the decompiler respects execution order when hoisting variables.
 * Hoisted variables that use GVARs should not be declared before the GVAR assignments.
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

describe('GVAR Hoisting Order', () => {
  let decompiler;

  beforeEach(() => {
    decompiler = new Decompiler();
  });

  test('should not hoist gvar usage before gvar assignment', () => {
    /**
     * This tests the bug where:
     * - LC 0-2: Check RC channels
     * - LC 3-5: Set gvar[7] based on RC channel (with activators)
     * - LC 6-7: Calculate using gvar[7]
     * - LC 8: Store result in gvar[6]
     *
     * The bug: LC 6-7's complex expression gets hoisted to the top,
     * before LC 3-5 set gvar[7].
     */
    const conditions = [
      // RC channel checks
      { index: 0, enabled: 1, activatorId: -1, operation: 4, operandAType: 1, operandAValue: 8, operandBType: 0, operandBValue: 0, flags: 0 },  // RC 4 HIGH
      { index: 1, enabled: 1, activatorId: -1, operation: 5, operandAType: 1, operandAValue: 8, operandBType: 0, operandBValue: 0, flags: 0 },  // RC 5 HIGH
      { index: 2, enabled: 1, activatorId: -1, operation: 6, operandAType: 1, operandAValue: 8, operandBType: 0, operandBValue: 0, flags: 0 },  // RC 6 HIGH

      // Set gvar[7] based on RC channel
      { index: 3, enabled: 1, activatorId: 0, operation: 18, operandAType: 0, operandAValue: 7, operandBType: 0, operandBValue: 8, flags: 0 },   // gvar[7] = 8
      { index: 4, enabled: 1, activatorId: 1, operation: 18, operandAType: 0, operandAValue: 7, operandBType: 0, operandBValue: 10, flags: 0 },  // gvar[7] = 10
      { index: 5, enabled: 1, activatorId: 2, operation: 18, operandAType: 0, operandAValue: 7, operandBType: 0, operandBValue: 17, flags: 0 },  // gvar[7] = 17

      // Complex calculation using gvar[7]: min(1000, gvar[7] * 1000 / 45)
      { index: 6, enabled: 1, activatorId: -1, operation: 36, operandAType: 5, operandAValue: 7, operandBType: 0, operandBValue: 45, flags: 0 }, // gvar[7] * 1000 / 45

      // max(0, LC6) - 500
      { index: 7, enabled: 1, activatorId: -1, operation: 15, operandAType: 4, operandAValue: 6, operandBType: 0, operandBValue: 500, flags: 0 },

      // Store result in gvar[6]
      { index: 8, enabled: 1, activatorId: -1, operation: 18, operandAType: 0, operandAValue: 6, operandBType: 4, operandBValue: 7, flags: 0 }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);

    const code = result.code;
    const lines = code.split('\n').filter(line => line.trim());

    // Find critical line indices
    let hoistedVarLineIndex = -1;
    let firstGvar7AssignmentIndex = -1;
    let gvar6AssignmentIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Hoisted variable that uses gvar[7]
      if (line.includes('const cond') && line.includes('gvar[7]')) {
        hoistedVarLineIndex = i;
      }

      // First assignment to gvar[7]
      if (firstGvar7AssignmentIndex === -1 && line.includes('gvar[7] =')) {
        firstGvar7AssignmentIndex = i;
      }

      // Assignment to gvar[6]
      if (line.includes('gvar[6] =')) {
        gvar6AssignmentIndex = i;
      }
    }

    // CRITICAL TEST: If a hoisted variable uses gvar[7], it MUST come after gvar[7] assignments
    // This is the main bug we're testing for
    if (hoistedVarLineIndex !== -1 && firstGvar7AssignmentIndex !== -1) {
      // This assertion will FAIL with the current bug
      // The hoisted variable is declared BEFORE gvar[7] is assigned
      if (hoistedVarLineIndex < firstGvar7AssignmentIndex) {
        throw new Error(
          `Hoisting bug detected: hoisted variable using gvar[7] at line ${hoistedVarLineIndex} ` +
          `appears BEFORE first gvar[7] assignment at line ${firstGvar7AssignmentIndex}. ` +
          `This causes the hoisted var to use OLD gvar[7] value instead of NEW one.`
        );
      }
    }

    // Verify gvar[6] assignment happens (and uses the calculated value)
    if (gvar6AssignmentIndex === -1) {
      throw new Error('gvar[6] assignment not found in decompiled code');
    }

    // Verify the code contains the expected operations
    if (!code.includes('gvar[7]')) {
      throw new Error('gvar[7] not found in decompiled code');
    }
    if (!code.includes('gvar[6]')) {
      throw new Error('gvar[6] not found in decompiled code');
    }
  });

  test('should preserve execution order in simple gvar usage', () => {
    /**
     * Simpler test: Set gvar, then use it
     * Expected: gvar[0] = 100; gvar[1] = gvar[0] + 50;
     */
    const conditions = [
      // Set gvar[0] = 100
      { index: 0, enabled: 1, activatorId: -1, operation: 18, operandAType: 0, operandAValue: 0, operandBType: 0, operandBValue: 100, flags: 0 },

      // Calculate gvar[0] + 50
      { index: 1, enabled: 1, activatorId: -1, operation: 14, operandAType: 5, operandAValue: 0, operandBType: 0, operandBValue: 50, flags: 0 },

      // Set gvar[1] = LC1
      { index: 2, enabled: 1, activatorId: -1, operation: 18, operandAType: 0, operandAValue: 1, operandBType: 4, operandBValue: 1, flags: 0 }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);

    const code = result.code;
    const lines = code.split('\n').filter(line => line.trim());

    let gvar0Index = -1;
    let gvar1Index = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('gvar[0] =')) gvar0Index = i;
      if (line.includes('gvar[1] =')) gvar1Index = i;
    }

    // gvar[0] must be set before gvar[1] (which depends on it)
    if (gvar0Index === -1) {
      throw new Error('gvar[0] assignment not found');
    }
    if (gvar1Index === -1) {
      throw new Error('gvar[1] assignment not found');
    }
    if (gvar1Index <= gvar0Index) {
      throw new Error(
        `Execution order bug: gvar[1] assignment at line ${gvar1Index} ` +
        `should come AFTER gvar[0] assignment at line ${gvar0Index}`
      );
    }
  });

  test('should handle multiple gvar dependencies without hoisting', () => {
    /**
     * Test chain: gvar[0] = 10; gvar[1] = gvar[0] * 2; gvar[2] = gvar[1] + 5;
     */
    const conditions = [
      // gvar[0] = 10
      { index: 0, enabled: 1, activatorId: -1, operation: 18, operandAType: 0, operandAValue: 0, operandBType: 0, operandBValue: 10, flags: 0 },

      // gvar[0] * 2
      { index: 1, enabled: 1, activatorId: -1, operation: 16, operandAType: 5, operandAValue: 0, operandBType: 0, operandBValue: 2, flags: 0 },

      // gvar[1] = LC1
      { index: 2, enabled: 1, activatorId: -1, operation: 18, operandAType: 0, operandAValue: 1, operandBType: 4, operandBValue: 1, flags: 0 },

      // gvar[1] + 5
      { index: 3, enabled: 1, activatorId: -1, operation: 14, operandAType: 5, operandAValue: 1, operandBType: 0, operandBValue: 5, flags: 0 },

      // gvar[2] = LC3
      { index: 4, enabled: 1, activatorId: -1, operation: 18, operandAType: 0, operandAValue: 2, operandBType: 4, operandBValue: 3, flags: 0 }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);

    const code = result.code;
    const lines = code.split('\n').filter(line => line.trim());

    let gvar0Index = -1;
    let gvar1Index = -1;
    let gvar2Index = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('gvar[0] =')) gvar0Index = i;
      if (line.includes('gvar[1] =')) gvar1Index = i;
      if (line.includes('gvar[2] =')) gvar2Index = i;
    }

    // Verify execution order: gvar[0] < gvar[1] < gvar[2]
    if (gvar0Index === -1 || gvar1Index === -1 || gvar2Index === -1) {
      throw new Error('Not all gvar assignments found in decompiled code');
    }
    if (gvar1Index <= gvar0Index) {
      throw new Error(
        `Execution order bug: gvar[1] at line ${gvar1Index} should come after gvar[0] at line ${gvar0Index}`
      );
    }
    if (gvar2Index <= gvar1Index) {
      throw new Error(
        `Execution order bug: gvar[2] at line ${gvar2Index} should come after gvar[1] at line ${gvar1Index}`
      );
    }
  });
});

module.exports = { loadDecompiler };
