/**
 * Test: NAND/NOR Pattern Recognition in Compiler
 *
 * Tests that the compiler recognizes:
 *   !(a && b) → NAND operation
 *   !(a || b) → NOR operation
 *
 * This allows the decompiler to output readable code like "!(a && b)"
 * which round-trips correctly back through the compiler.
 */

'use strict';

require('./simple_test_runner.cjs');

const { OPERATION } = require('../inav_constants.js');

let Transpiler;

async function loadTranspiler() {
  const module = await import('../index.js');
  Transpiler = module.Transpiler;
}

describe('NAND/NOR Pattern Recognition', () => {
  let transpiler;

  beforeEach(() => {
    transpiler = new Transpiler();
  });

  test('!(a && b) should compile to NAND operation', () => {
    const code = `
      if (!(inav.flight.altitude > 100 && inav.flight.groundSpeed > 50)) {
        inav.gvar[0] = 1;
      }
    `;

    const result = transpiler.transpile(code);

    expect(result.success).toBe(true);

    // Find the NAND operation (operation code 10)
    const nandLc = result.commands.find(cmd => {
      const parts = cmd.split(/\s+/);
      return parseInt(parts[4]) === OPERATION.NAND;
    });

    expect(nandLc).toBeTruthy();
  });

  test('!(a || b) should compile to NOR operation', () => {
    const code = `
      if (!(inav.flight.altitude > 100 || inav.flight.groundSpeed > 50)) {
        inav.gvar[0] = 1;
      }
    `;

    const result = transpiler.transpile(code);

    expect(result.success).toBe(true);

    // Find the NOR operation (operation code 11)
    const norLc = result.commands.find(cmd => {
      const parts = cmd.split(/\s+/);
      return parseInt(parts[4]) === OPERATION.NOR;
    });

    expect(norLc).toBeTruthy();
  });

  test('NAND should use fewer LCs than NOT(AND)', () => {
    // With pattern recognition: altitude > 100, groundSpeed > 50, NAND = 3 LCs
    // Without: altitude > 100, groundSpeed > 50, AND, NOT = 4 LCs
    const code = `
      if (!(inav.flight.altitude > 100 && inav.flight.groundSpeed > 50)) {
        inav.gvar[0] = 1;
      }
    `;

    const result = transpiler.transpile(code);

    expect(result.success).toBe(true);

    // Count condition LCs (not including the gvar assignment)
    const conditionLcs = result.commands.filter(cmd => {
      const parts = cmd.split(/\s+/);
      const operation = parseInt(parts[4]);
      return operation !== 18; // GVAR_SET
    });

    // Should be 3: GT, GT, NAND (not 4: GT, GT, AND, NOT)
    expect(conditionLcs.length).toBe(3);
  });

  test('NOR should use fewer LCs than NOT(OR)', () => {
    // With pattern recognition: altitude > 100, groundSpeed > 50, NOR = 3 LCs
    // Without: altitude > 100, groundSpeed > 50, OR, NOT = 4 LCs
    const code = `
      if (!(inav.flight.altitude > 100 || inav.flight.groundSpeed > 50)) {
        inav.gvar[0] = 1;
      }
    `;

    const result = transpiler.transpile(code);

    expect(result.success).toBe(true);

    // Count condition LCs (not including the gvar assignment)
    const conditionLcs = result.commands.filter(cmd => {
      const parts = cmd.split(/\s+/);
      const operation = parseInt(parts[4]);
      return operation !== 18; // GVAR_SET
    });

    // Should be 3: GT, GT, NOR (not 4: GT, GT, OR, NOT)
    expect(conditionLcs.length).toBe(3);
  });

  test('simple NOT should still work', () => {
    // Plain NOT without AND/OR should still use NOT operation
    const code = `
      if (!inav.flight.gpsValid) {
        inav.gvar[0] = 1;
      }
    `;

    const result = transpiler.transpile(code);

    expect(result.success).toBe(true);

    // Find the NOT operation (operation code 12)
    const notLc = result.commands.find(cmd => {
      const parts = cmd.split(/\s+/);
      return parseInt(parts[4]) === OPERATION.NOT;
    });

    expect(notLc).toBeTruthy();
  });

  test('nand() function should still work', () => {
    // Explicit nand() call should still work
    const code = `
      if (nand(inav.flight.altitude > 100, inav.flight.groundSpeed > 50)) {
        inav.gvar[0] = 1;
      }
    `;

    const result = transpiler.transpile(code);

    expect(result.success).toBe(true);

    // Find the NAND operation
    const nandLc = result.commands.find(cmd => {
      const parts = cmd.split(/\s+/);
      return parseInt(parts[4]) === OPERATION.NAND;
    });

    expect(nandLc).toBeTruthy();
  });

  test('nor() function should still work', () => {
    // Explicit nor() call should still work
    const code = `
      if (nor(inav.flight.altitude > 100, inav.flight.groundSpeed > 50)) {
        inav.gvar[0] = 1;
      }
    `;

    const result = transpiler.transpile(code);

    expect(result.success).toBe(true);

    // Find the NOR operation
    const norLc = result.commands.find(cmd => {
      const parts = cmd.split(/\s+/);
      return parseInt(parts[4]) === OPERATION.NOR;
    });

    expect(norLc).toBeTruthy();
  });
});

module.exports = { loadTranspiler };
