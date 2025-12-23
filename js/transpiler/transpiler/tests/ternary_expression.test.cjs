/**
 * Test: Ternary Expression Support
 *
 * Tests that the compiler handles ternary expressions:
 *   (a) ? !(b) : (b) → XOR(a, b)
 *   cond ? val : 0   → val with cond as activator
 */

'use strict';

require('./simple_test_runner.cjs');

const { OPERATION } = require('../inav_constants.js');

let Transpiler;

async function loadTranspiler() {
  const module = await import('../index.js');
  Transpiler = module.Transpiler;
}

describe('Ternary Expression Support', () => {
  let transpiler;

  beforeEach(() => {
    transpiler = new Transpiler();
  });

  test('XOR pattern (a) ? !(b) : (b) should compile to XOR', () => {
    const code = `
      if ((inav.flight.altitude > 100) ? !(inav.flight.groundSpeed > 50) : (inav.flight.groundSpeed > 50)) {
        inav.gvar[0] = 1;
      }
    `;

    const result = transpiler.transpile(code);

    expect(result.success).toBe(true);

    // Find the XOR operation (operation code 9)
    const xorLc = result.commands.find(cmd => {
      const parts = cmd.split(/\s+/);
      return parseInt(parts[4]) === OPERATION.XOR;
    });

    expect(xorLc).toBeTruthy();
  });

  test('cond ? val : 0 pattern should work in conditions', () => {
    const code = `
      if ((inav.flight.gpsValid === 1 ? inav.flight.altitude : 0) > 100) {
        inav.gvar[0] = 1;
      }
    `;

    const result = transpiler.transpile(code);

    expect(result.success).toBe(true);
    // Should compile without errors
    expect(result.commands.length).toBeGreaterThan(0);
  });

  test('simple XOR pattern with identifiers', () => {
    const code = `
      if ((inav.flight.isArmed) ? !(inav.flight.gpsValid) : (inav.flight.gpsValid)) {
        inav.gvar[0] = 1;
      }
    `;

    const result = transpiler.transpile(code);

    expect(result.success).toBe(true);

    // Find the XOR operation
    const xorLc = result.commands.find(cmd => {
      const parts = cmd.split(/\s+/);
      return parseInt(parts[4]) === OPERATION.XOR;
    });

    expect(xorLc).toBeTruthy();
  });

  test('general ternary a ? b : c should compile', () => {
    // General ternary where alternate is not 0
    const code = `
      if ((inav.flight.altitude > 100) ? (inav.flight.groundSpeed > 50) : (inav.flight.homeDistance > 200)) {
        inav.gvar[0] = 1;
      }
    `;

    const result = transpiler.transpile(code);

    expect(result.success).toBe(true);

    // Should have OR operation to combine the two branches
    const orLc = result.commands.find(cmd => {
      const parts = cmd.split(/\s+/);
      return parseInt(parts[4]) === OPERATION.OR;
    });

    expect(orLc).toBeTruthy();
  });

  test('general ternary should produce correct LC structure', () => {
    const code = `
      if ((inav.flight.isArmed) ? (inav.flight.altitude > 100) : (inav.flight.groundSpeed > 50)) {
        inav.gvar[0] = 1;
      }
    `;

    const result = transpiler.transpile(code);

    expect(result.success).toBe(true);

    // Should have:
    // - condition check (isArmed comparison)
    // - consequent (altitude > 100) with activator
    // - NOT of condition
    // - alternate (groundSpeed > 50) with NOT activator
    // - OR to combine
    // - GVAR_SET

    // Find NOT operation
    const notLc = result.commands.find(cmd => {
      const parts = cmd.split(/\s+/);
      return parseInt(parts[4]) === OPERATION.NOT;
    });
    expect(notLc).toBeTruthy();

    // Find OR operation
    const orLc = result.commands.find(cmd => {
      const parts = cmd.split(/\s+/);
      return parseInt(parts[4]) === OPERATION.OR;
    });
    expect(orLc).toBeTruthy();
  });

  test('value ternary a ? b : c should compile', () => {
    // Ternary used as value in assignment
    const code = `
      inav.gvar[0] = inav.flight.isArmed ? 100 : 50;
    `;

    const result = transpiler.transpile(code);

    expect(result.success).toBe(true);

    // Should have ADD operation to combine the values
    const addLc = result.commands.find(cmd => {
      const parts = cmd.split(/\s+/);
      return parseInt(parts[4]) === OPERATION.ADD;
    });

    expect(addLc).toBeTruthy();
  });
});

module.exports = { loadTranspiler };
