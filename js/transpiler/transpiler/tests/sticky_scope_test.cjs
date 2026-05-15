/**
 * Test: Sticky scope issue (#5, #5a)
 *
 * LC 27: Always, approxEqual(rc[11], 1500)
 * LC 29: Active when LC 27, Sticky(LC 26, LC 28)
 * LC 30: Always, Delay(LC 29, 500)
 * LC 31: Active when LC 30, flight.speed3D < 2222
 * LC 32: Active when LC 31, Override rc[14]=1800
 *
 * Issue: latch2 (LC 29) is defined inside if block, but LC 30 (delay)
 * is a root that references it from outside.
 */

'use strict';

require('./simple_test_runner.cjs');

let Decompiler;

async function loadDecompiler() {
  const module = await import('../decompiler.js');
  Decompiler = module.Decompiler;
}

describe('Sticky scope issue', () => {
  let decompiler;

  beforeEach(() => {
    decompiler = new Decompiler();
  });

  test('sticky referenced by delay outside its scope', () => {
    const conditions = [
      // LC 0: rc[12].high (on condition for sticky)
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 6, // HIGH
        operandAType: 1, // RC_CHANNEL
        operandAValue: 12,
        operandBType: 0,
        operandBValue: 0,
        flags: 0
      },
      // LC 1: XOR(LC 0, LC 7) - complex off condition
      // This tests issue #5a - complex operands being inlined
      {
        index: 1,
        enabled: 1,
        activatorId: -1,
        operation: 9, // XOR
        operandAType: 4, // LC
        operandAValue: 0, // LC 0
        operandBType: 4, // LC
        operandBValue: 7, // LC 7 (will add below)
        flags: 0
      },
      // LC 2: approxEqual(rc[11], 1500) - activator for sticky
      {
        index: 2,
        enabled: 1,
        activatorId: -1,
        operation: 51, // APPROX_EQUAL
        operandAType: 1, // RC_CHANNEL
        operandAValue: 11,
        operandBType: 0,
        operandBValue: 1500,
        flags: 0
      },
      // LC 3: Sticky(LC 0, LC 1), active when LC 2
      // This creates latch1 INSIDE the if (approxEqual...) block
      {
        index: 3,
        enabled: 1,
        activatorId: 2, // LC 2 (approxEqual)
        operation: 13, // STICKY
        operandAType: 4, // LC
        operandAValue: 0, // LC 0 (on)
        operandBType: 4, // LC
        operandBValue: 1, // LC 1 (off)
        flags: 0
      },
      // LC 4: Delay(LC 3, 500), ALWAYS active (root)
      // This references latch1 but is OUTSIDE the if block!
      {
        index: 4,
        enabled: 1,
        activatorId: -1, // Always - this is the problem
        operation: 48, // DELAY
        operandAType: 4, // LC
        operandAValue: 3, // LC 3 (the sticky)
        operandBType: 0,
        operandBValue: 500,
        flags: 0
      },
      // LC 5: flight.speed3D < 2222, active when LC 4
      {
        index: 5,
        enabled: 1,
        activatorId: 4, // LC 4 (delay)
        operation: 3, // LOWER_THAN
        operandAType: 2, // FLIGHT
        operandAValue: 10, // speed3D
        operandBType: 0,
        operandBValue: 2222,
        flags: 0
      },
      // LC 6: Override rc[14]=1800, active when LC 5
      {
        index: 6,
        enabled: 1,
        activatorId: 5, // LC 5
        operation: 38, // OVERRIDE_RC_CHANNEL
        operandAType: 0,
        operandAValue: 14,
        operandBType: 0,
        operandBValue: 1800,
        flags: 0
      },
      // LC 7: flight.throttlePos < 5 (second operand for XOR in LC 1)
      {
        index: 7,
        enabled: 1,
        activatorId: -1,
        operation: 3, // LOWER_THAN
        operandAType: 2, // FLIGHT
        operandAValue: 14, // throttlePos
        operandBType: 0,
        operandBValue: 5,
        flags: 0
      }
    ];

    const result = decompiler.decompile(conditions);
    console.log('Generated code:');
    console.log(result.code);
    console.log('Warnings:', result.warnings);

    expect(result.success).toBe(true);

    // Analyze the output to verify the scope fix
    const code = result.code;

    console.log('\n--- Scope Analysis ---');

    // Verify pre-declaration at top level (not inside if-block)
    // Pattern: `var latch1;` on its own line (pre-declaration)
    const predeclMatch = code.match(/^var (latch\d+);$/m);
    expect(predeclMatch).toBeTruthy();
    if (predeclMatch) {
      console.log('Pre-declaration found:', predeclMatch[0]);
    }

    // Verify assignment (not declaration) inside if-block
    // Pattern: `latch1 = sticky({` without `var`
    const assignMatch = code.match(/^\s+(latch\d+) = sticky\(\{/m);
    expect(assignMatch).toBeTruthy();
    if (assignMatch) {
      console.log('Assignment found:', assignMatch[0].trim());
    }

    // Verify delay references the latch variable
    const delayMatch = code.match(/delay\(\(\) => (latch\d+)/);
    expect(delayMatch).toBeTruthy();
    if (delayMatch) {
      console.log('Delay references:', delayMatch[1]);
    }

    // All three should reference the same variable
    if (predeclMatch && assignMatch && delayMatch) {
      expect(predeclMatch[1]).toBe(assignMatch[1]);
      expect(predeclMatch[1]).toBe(delayMatch[1]);
      console.log('✓ Same variable used throughout:', predeclMatch[1]);
    }
  });
});

module.exports = { loadDecompiler };
