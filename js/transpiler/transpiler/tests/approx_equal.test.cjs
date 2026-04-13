/**
 * Test: APPROX_EQUAL decompilation
 *
 * Bug: APPROX_EQUAL operation was decompiled as === instead of approxEqual()
 * This caused round-trip failures and lost the approximate comparison semantics.
 */

'use strict';

require('./simple_test_runner.cjs');

let Decompiler;

async function loadDecompiler() {
  const module = await import('../decompiler.js');
  Decompiler = module.Decompiler;
}

describe('APPROX_EQUAL Decompilation', () => {
  let decompiler;

  beforeEach(() => {
    decompiler = new Decompiler();
  });

  test('should decompile APPROX_EQUAL as approxEqual() function call', () => {
    // LC 0: approxEqual(rc[11], 2000) - uses default 1% tolerance
    const conditions = [
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 51, // APPROX_EQUAL
        operandAType: 1, // RC_CHANNEL
        operandAValue: 11,
        operandBType: 0, // VALUE
        operandBValue: 2000,
        flags: 0
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);
    expect(result.code).toContain('approxEqual(');
    expect(result.code).toContain('rc[11]');
    expect(result.code).toContain('2000');
    // Should NOT contain ===
    expect(result.code).not.toContain('===');
  });

  test('should include custom tolerance when flags is non-zero', () => {
    // LC 0: approxEqual(rc[11], 1500, 5) - 5% tolerance in flags
    const conditions = [
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 51, // APPROX_EQUAL
        operandAType: 1, // RC_CHANNEL
        operandAValue: 11,
        operandBType: 0, // VALUE
        operandBValue: 1500,
        flags: 5
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);
    expect(result.code).toContain('approxEqual(');
    expect(result.code).toContain(', 5)'); // Third argument is the tolerance
  });

  test('should handle APPROX_EQUAL with activator and action', () => {
    // LC 0: approxEqual(rc[11], 2000)
    // LC 1: override rc[15] = 1900, active when LC 0
    // This simulates: if (approxEqual(rc[11], 2000)) { rc[15] = 1900; }
    const conditions = [
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 51, // APPROX_EQUAL
        operandAType: 1, // RC_CHANNEL
        operandAValue: 11,
        operandBType: 0, // VALUE
        operandBValue: 2000,
        flags: 0
      },
      {
        index: 1,
        enabled: 1,
        activatorId: 0,
        operation: 38, // OVERRIDE_RC_CHANNEL
        operandAType: 0, // VALUE (channel)
        operandAValue: 15,
        operandBType: 0, // VALUE
        operandBValue: 1900,
        flags: 0
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);
    // Should have approxEqual as the condition
    expect(result.code).toContain('approxEqual(');
    // Should have the override action
    expect(result.code).toContain('rc[15] = 1900');
  });

  test('should NOT emit warning about tolerance not preserved', () => {
    const conditions = [
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 51, // APPROX_EQUAL
        operandAType: 1, // RC_CHANNEL
        operandAValue: 11,
        operandBType: 0,
        operandBValue: 2000,
        flags: 0
      }
    ];

    const result = decompiler.decompile(conditions);

    expect(result.success).toBe(true);
    // Should not have the old warning about tolerance not preserved
    const toleranceWarning = result.warnings.some(w =>
      w.includes('tolerance not preserved')
    );
    expect(toleranceWarning).toBe(false);
  });
});

module.exports = { loadDecompiler };
