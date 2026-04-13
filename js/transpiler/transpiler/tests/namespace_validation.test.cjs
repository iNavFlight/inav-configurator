'use strict';

/**
 * Namespace Validation Tests
 *
 * Tests for consistent namespace-based routing and validation
 */

require('./simple_test_runner.cjs');
const { Transpiler } = require('../index.js');

describe('Namespace Validation', () => {
  test('should accept inav.helpers.mapInput()', () => {
    const code = `
      const normalized = inav.helpers.mapInput(inav.rc[3].value, 2000);
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);
    expect(result.success).toBe(true);
  });

  test('should accept mapInput() for backward compatibility', () => {
    const code = `
      const normalized = mapInput(inav.rc[3].value, 2000);
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);
    expect(result.success).toBe(true);
  });

  test('should reject inav.pid[0].mapInput() with unknown function error', () => {
    const code = `
      inav.gvar[0] = inav.pid[0].mapInput(100, 200);
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown function call');
  });

  test('should reject inav.flight.mapInput() with unknown function error', () => {
    const code = `
      inav.gvar[0] = inav.flight.mapInput(100, 200);
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown function call');
  });

  test('should accept inav.helpers.xor() for logical operations', () => {
    const code = `
      if (inav.helpers.xor(inav.flight.isArmed, inav.flight.altitude > 100)) {
        inav.gvar[0] = 1;
      }
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);
    expect(result.success).toBe(true);
  });

  test('should accept xor() for backward compatibility', () => {
    const code = `
      if (xor(inav.flight.isArmed, inav.flight.altitude > 100)) {
        inav.gvar[0] = 1;
      }
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);
    expect(result.success).toBe(true);
  });

  test('should validate inav.flight.* property access', () => {
    const code = `
      if (inav.flight.altitude > 100) {
        inav.gvar[0] = 1;
      }
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);
    expect(result.success).toBe(true);
  });

  test('should validate inav.override.* property access', () => {
    const code = `
      inav.override.throttleScale = 50;
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);
    expect(result.success).toBe(true);
  });

  test('should validate inav.gvar[] access with valid index', () => {
    const code = `
      inav.gvar[0] = inav.flight.altitude;
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);
    expect(result.success).toBe(true);
  });

  test('should reject inav.gvar[] with invalid index', () => {
    const code = `
      inav.gvar[99] = 100;
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/gvar.*index|gvar\[99\]/);
  });

  test('should validate inav.rc[] access with valid channel', () => {
    const code = `
      if (inav.rc[1].low) {
        inav.gvar[0] = 1;
      }
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);
    expect(result.success).toBe(true);
  });

  test('should reject inav.rc[] with invalid channel', () => {
    const code = `
      if (inav.rc[99].low) {
        inav.gvar[0] = 1;
      }
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/RC channel|rc\[99\]/);
  });

  test('should validate inav.pid[] access', () => {
    const code = `
      const pidOut = inav.pid[0].output;
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);
    expect(result.success).toBe(true);
  });

  test('should reject invalid namespace', () => {
    const code = `
      if (inav.invalid.property > 100) {
        inav.gvar[0] = 1;
      }
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/invalid|Unknown API category/);
  });

  test('should handle all helper functions with inav.helpers prefix', () => {
    const code = `
      if (inav.helpers.nand(inav.flight.isArmed, inav.flight.altitude > 100)) {
        inav.gvar[0] = 1;
      }
      if (inav.helpers.nor(inav.flight.isArmed, inav.flight.altitude < 50)) {
        inav.gvar[1] = 1;
      }
      if (inav.helpers.approxEqual(inav.flight.altitude, 1000, 50)) {
        inav.gvar[2] = 1;
      }
      const mapped = inav.helpers.mapOutput(inav.helpers.mapInput(inav.flight.altitude, 5000), 100);
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);
    expect(result.success).toBe(true);
  });
});
