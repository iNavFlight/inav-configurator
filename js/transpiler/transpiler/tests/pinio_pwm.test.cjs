'use strict';

/**
 * PINIO PWM Round-Trip Tests
 *
 * Tests compile (JS -> LC) and decompile (LC -> JS) for pwmOnPin,
 * and verifies the full round-trip.
 *
 * Operand layout (firmware):
 *   operandA = duty cycle (0-100)   <- first argument to pwmOnPin()
 *   operandB = pin (0=LED pin, 1=USER1, 2=USER2, ...)  <- second argument
 *
 * The function name "pwmOnPin(duty, pin)" mirrors both the operand order
 * and the programming tab name "PWM on pin": duty first, then pin.
 *
 * operandB=0 is backward compatible with old LED_PIN_PWM which used only operandA.
 */

require('./simple_test_runner.cjs');
const { Transpiler } = require('../index.js');

// Decompiler must be loaded asynchronously (ESM)
let Decompiler;

async function loadDecompiler() {
  const mod = await import('../decompiler.js');
  Decompiler = mod.Decompiler;
}

module.exports = { loadDecompiler };

const PINIO_PWM_OP = 52;

// Helper: parse a transpiler CLI string into a decompiler-compatible LC object.
// CLI format: logic <idx> <enabled> <activator> <op> <typeA> <valueA> <typeB> <valueB> <flags>
function parseCliLine(line, idx) {
  const p = line.trim().split(/\s+/);
  return {
    index: idx,
    enabled: parseInt(p[2]),
    activatorId: parseInt(p[3]),
    operation: parseInt(p[4]),
    operandAType: parseInt(p[5]),
    operandAValue: parseInt(p[6]),
    operandBType: parseInt(p[7]),
    operandBValue: parseInt(p[8])
  };
}

// ── Compile direction (JS → LC) ───────────────────────────────────────────────

describe('pwmOnPin compile (JS -> LC)', () => {
  test('LED pin (operandB=0): inav.override.pwmOnPin(75, 0)', () => {
    const code = `
      if (inav.flight.isArmed) {
        inav.override.pwmOnPin(75, 0);
      }
    `;
    const result = new Transpiler().transpile(code);
    expect(result.success).toBe(true);

    const lines = result.commands.filter(l => l.includes(` ${PINIO_PWM_OP} `));
    expect(lines.length).toBe(1);

    const lc = parseCliLine(lines[0], 0);
    expect(lc.operandAValue).toBe(75);  // duty = operandA
    expect(lc.operandBValue).toBe(0);   // LED pin = operandB
  });

  test('USER1 pin (operandB=1): inav.override.pwmOnPin(50, 1)', () => {
    const code = `
      if (inav.flight.isArmed) {
        inav.override.pwmOnPin(50, 1);
      }
    `;
    const result = new Transpiler().transpile(code);
    expect(result.success).toBe(true);

    const lines = result.commands.filter(l => l.includes(` ${PINIO_PWM_OP} `));
    expect(lines.length).toBe(1);

    const lc = parseCliLine(lines[0], 0);
    expect(lc.operandAValue).toBe(50);  // duty = operandA
    expect(lc.operandBValue).toBe(1);   // USER1 = operandB
  });

  test('USER2 pin (operandB=2): inav.override.pwmOnPin(100, 2)', () => {
    const code = `
      if (inav.flight.isArmed) {
        inav.override.pwmOnPin(100, 2);
      }
    `;
    const result = new Transpiler().transpile(code);
    expect(result.success).toBe(true);

    const lines = result.commands.filter(l => l.includes(` ${PINIO_PWM_OP} `));
    expect(lines.length).toBe(1);

    const lc = parseCliLine(lines[0], 0);
    expect(lc.operandAValue).toBe(100); // duty = operandA
    expect(lc.operandBValue).toBe(2);   // USER2 = operandB
  });
});

// ── Decompile direction (LC → JS) ────────────────────────────────────────────

describe('pwmOnPin decompile (LC -> JS)', () => {
  test('LED pin (operandB=0) decompiles to pwmOnPin(75, 0)', () => {
    const conditions = [
      {
        index: 0, enabled: 1, activatorId: -1,
        operation: 22,           // OVERRIDE_ARMING_SAFETY as stand-in condition
        operandAType: 2,         // FLIGHT
        operandAValue: 17,       // IS_ARMED
        operandBType: 0, operandBValue: 0
      },
      // pwmOnPin(75, 0) → operandA=75 (duty), operandB=0 (LED pin)
      {
        index: 1, enabled: 1, activatorId: 0,
        operation: PINIO_PWM_OP,
        operandAType: 0, operandAValue: 75,
        operandBType: 0, operandBValue: 0
      }
    ];

    const result = new Decompiler().decompile(conditions);
    expect(result.success).toBe(true);
    expect(result.code).toContain('inav.override.pwmOnPin(75, 0)');
  });

  test('USER1 pin (operandB=1) decompiles to pwmOnPin(50, 1)', () => {
    const conditions = [
      {
        index: 0, enabled: 1, activatorId: -1,
        operation: 22,
        operandAType: 2, operandAValue: 17,
        operandBType: 0, operandBValue: 0
      },
      {
        index: 1, enabled: 1, activatorId: 0,
        operation: PINIO_PWM_OP,
        operandAType: 0, operandAValue: 50,
        operandBType: 0, operandBValue: 1
      }
    ];

    const result = new Decompiler().decompile(conditions);
    expect(result.success).toBe(true);
    expect(result.code).toContain('inav.override.pwmOnPin(50, 1)');
  });
});

// ── Round-trip (JS → LC → JS) ────────────────────────────────────────────────

describe('pwmOnPin round-trip (JS -> LC -> JS)', () => {
  test('LED pin round-trip: pwmOnPin(75, 0)', () => {
    const code = `
      if (inav.flight.isArmed) {
        inav.override.pwmOnPin(75, 0);
      }
    `;
    const compiled = new Transpiler().transpile(code);
    expect(compiled.success).toBe(true);

    const conditions = compiled.commands.map(parseCliLine);

    const decompiled = new Decompiler().decompile(conditions);
    expect(decompiled.success).toBe(true);
    expect(decompiled.code).toContain('inav.override.pwmOnPin(75, 0)');
  });

  test('USER1 pin round-trip: pwmOnPin(50, 1)', () => {
    const code = `
      if (inav.flight.isArmed) {
        inav.override.pwmOnPin(50, 1);
      }
    `;
    const compiled = new Transpiler().transpile(code);
    expect(compiled.success).toBe(true);

    const conditions = compiled.commands.map(parseCliLine);

    const decompiled = new Decompiler().decompile(conditions);
    expect(decompiled.success).toBe(true);
    expect(decompiled.code).toContain('inav.override.pwmOnPin(50, 1)');
  });
});
