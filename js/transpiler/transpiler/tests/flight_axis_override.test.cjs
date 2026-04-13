'use strict';

/**
 * Flight Axis Override Tests
 *
 * Tests that flight axis overrides work with both prefixed and unprefixed syntax
 * This addresses Qodo comment #2 from PR #2490
 */

require('./simple_test_runner.cjs');
const { Transpiler } = require('../index.js');

describe('Flight Axis Override', () => {
  test('should handle inav.override.flightAxis.roll.angle', () => {
    const code = `
      if (inav.flight.altitude > 100) {
        inav.override.flightAxis.roll.angle = 45;
      }
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);
    expect(result.success).toBe(true);
  });

  test('should handle override.flightAxis.roll.angle (backward compat)', () => {
    const code = `
      if (inav.flight.altitude > 100) {
        override.flightAxis.roll.angle = 45;
      }
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);

    if (!result.success) {
      console.log('Error:', result.error);
    }

    expect(result.success).toBe(true);
  });

  test('should handle all flight axis combinations', () => {
    const code = `
      if (inav.flight.altitude > 100) {
        inav.override.flightAxis.roll.angle = 10;
        inav.override.flightAxis.pitch.angle = 20;
        inav.override.flightAxis.yaw.angle = 30;
        inav.override.flightAxis.roll.rate = 100;
        inav.override.flightAxis.pitch.rate = 200;
        inav.override.flightAxis.yaw.rate = 300;
      }
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);
    expect(result.success).toBe(true);
  });

  test('should handle backward compat for all flight axis combinations', () => {
    const code = `
      if (inav.flight.altitude > 100) {
        override.flightAxis.roll.angle = 10;
        override.flightAxis.pitch.angle = 20;
        override.flightAxis.yaw.angle = 30;
      }
    `;
    const transpiler = new Transpiler();
    const result = transpiler.transpile(code);

    if (!result.success) {
      console.log('Error:', result.error);
    }

    expect(result.success).toBe(true);
  });
});
