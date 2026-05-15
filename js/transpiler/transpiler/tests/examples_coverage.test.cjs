/**
 * Examples Coverage Test Suite
 *
 * Tests to ensure all examples from examples/index.js will compile correctly.
 * Each test group covers features used by one or more examples.
 */

'use strict';

require('./simple_test_runner.cjs');

let Transpiler;
let Decompiler;

async function loadModules() {
  const transpilerModule = await import('../index.js');
  Transpiler = transpilerModule.Transpiler;

  const decompilerModule = await import('../decompiler.js');
  Decompiler = decompilerModule.Decompiler;
}

function transpile(code) {
  const transpiler = new Transpiler();
  return transpiler.transpile(code);
}

function parseCommands(commands) {
  return commands.map(cmd => {
    const parts = cmd.split(' ');
    return {
      id: parseInt(parts[1]),
      enabled: parseInt(parts[2]),
      activator: parseInt(parts[3]),
      operation: parseInt(parts[4]),
      operandAType: parseInt(parts[5]),
      operandAValue: parseInt(parts[6]),
      operandBType: parseInt(parts[7]),
      operandBValue: parseInt(parts[8]),
      flags: parseInt(parts[9]) || 0
    };
  });
}

/**
 * Tests for inav.events.edge() function (used by: arm-init, heading-tracking, simple-counter, edge-detection, debounce-edge)
 *
 * Note: inav.events.edge() compiles to operation 47 (EDGE), not 11
 */
describe('inav.events.edge() Function - Examples Coverage', () => {

  test('should compile basic inav.events.edge() with action (arm-init example)', () => {
    const code = `
      const { flight, gvar, edge } = inav;

      inav.events.edge(() => inav.flight.armTimer > 1000, { duration: 0 }, () => {
        inav.gvar[0] = inav.flight.yaw;
      });
    `;

    const result = transpile(code);

    expect(result.success).toBe(true);
    expect(result.commands.length).toBeGreaterThan(0);
    // Edge generates operation 47 (EDGE) referencing the condition LC
    const commands = parseCommands(result.commands);
    const hasEdge = commands.some(c => c.operation === 47);
    expect(hasEdge).toBe(true);
  });

  test('should compile inav.events.edge() with duration (debounce-edge example)', () => {
    const code = `
      const { flight, gvar, edge } = inav;

      inav.events.edge(() => inav.flight.rssi < 40, { duration: 500 }, () => {
        inav.gvar[0] = inav.gvar[0] + 1;
      });
    `;

    const result = transpile(code);

    expect(result.success).toBe(true);
    // Should have EDGE operation (47) with duration value 500
    const commands = parseCommands(result.commands);
    const edgeCmd = commands.find(c => c.operation === 47);
    expect(edgeCmd).toBeDefined();
    // Duration is in operandB
    expect(edgeCmd.operandBValue).toBe(500);
  });

  test('should compile inav.events.edge() with multiple gvar assignments (simple-counter example)', () => {
    const code = `
      const { flight, gvar, edge } = inav;

      inav.events.edge(() => inav.flight.armTimer > 1000, { duration: 0 }, () => {
        inav.gvar[0] = 0;
      });

      if (inav.flight.altitude > 100) {
        inav.gvar[0] = inav.gvar[0] + 1;
      }
    `;

    const result = transpile(code);

    expect(result.success).toBe(true);
    // Should have both edge and regular if
    const commands = parseCommands(result.commands);
    const hasEdge = commands.some(c => c.operation === 47);
    const hasGvarSet = commands.some(c => c.operation === 18);
    const hasGvarInc = commands.some(c => c.operation === 19);
    expect(hasEdge).toBe(true);
    expect(hasGvarSet || hasGvarInc).toBe(true);
  });
});

/**
 * Tests for inav.rc[n].high/mid/low (used by: rc-controlled)
 */
describe('RC Channel States - Examples Coverage', () => {

  test('should compile inav.rc[n].high condition (rc-controlled example)', () => {
    const code = `
      const { rc, override } = inav;

      if (inav.rc[5].high) {
        inav.override.vtx.power = 4;
      }
    `;

    const result = transpile(code);

    expect(result.success).toBe(true);
    // HIGH is operation 6
    const commands = parseCommands(result.commands);
    const highCmd = commands.find(c => c.operation === 6);
    expect(highCmd).toBeDefined();
    expect(highCmd.operandAType).toBe(1); // RC_CHANNEL
    expect(highCmd.operandAValue).toBe(5);
  });

  test('should compile inav.rc[n].mid condition (rc-controlled example)', () => {
    const code = `
      const { rc, override } = inav;

      if (inav.rc[5].mid) {
        inav.override.vtx.power = 2;
      }
    `;

    const result = transpile(code);

    expect(result.success).toBe(true);
    // MID is operation 5
    const commands = parseCommands(result.commands);
    const midCmd = commands.find(c => c.operation === 5);
    expect(midCmd).toBeDefined();
    expect(midCmd.operandAType).toBe(1); // RC_CHANNEL
    expect(midCmd.operandAValue).toBe(5);
  });

  test('should compile inav.rc[n].low condition (rc-controlled example)', () => {
    const code = `
      const { rc, override } = inav;

      if (inav.rc[5].low) {
        inav.override.vtx.power = 1;
      }
    `;

    const result = transpile(code);

    expect(result.success).toBe(true);
    // LOW is operation 4
    const commands = parseCommands(result.commands);
    const lowCmd = commands.find(c => c.operation === 4);
    expect(lowCmd).toBeDefined();
    expect(lowCmd.operandAType).toBe(1); // RC_CHANNEL
    expect(lowCmd.operandAValue).toBe(5);
  });

  test('should compile all three rc states together (full rc-controlled example)', () => {
    const code = `
      const { rc, override } = inav;

      if (inav.rc[5].high) {
        inav.override.vtx.power = 4;
      }

      if (inav.rc[5].mid) {
        inav.override.vtx.power = 2;
      }

      if (inav.rc[5].low) {
        inav.override.vtx.power = 1;
      }
    `;

    const result = transpile(code);

    expect(result.success).toBe(true);
    const commands = parseCommands(result.commands);
    // Should have all three operations
    expect(commands.some(c => c.operation === 6)).toBe(true); // HIGH
    expect(commands.some(c => c.operation === 5)).toBe(true); // MID
    expect(commands.some(c => c.operation === 4)).toBe(true); // LOW
  });
});

/**
 * Tests for inav.rc[n] = value (used by: override-rc)
 */
describe('RC Channel Override - Examples Coverage', () => {

  test('should compile inav.rc[n] = value assignment (override-rc example)', () => {
    const code = `
      const { flight, rc } = inav;

      if (inav.flight.groundSpeed > 1000) {
        inav.rc[9] = 1700;
      }
    `;

    const result = transpile(code);

    expect(result.success).toBe(true);
    // RC_CHANNEL_OVERRIDE is operation 38
    const commands = parseCommands(result.commands);
    const rcOverride = commands.find(c => c.operation === 38);
    expect(rcOverride).toBeDefined();
    expect(rcOverride.operandAValue).toBe(9); // Channel 9
  });

  test('should compile if/else with rc override (override-rc example)', () => {
    const code = `
      const { flight, rc } = inav;

      if (inav.flight.groundSpeed > 1000) {
        inav.rc[9] = 1700;
      } else {
        inav.rc[9] = 1500;
      }
    `;

    const result = transpile(code);

    expect(result.success).toBe(true);
    // Should have two RC_CHANNEL_OVERRIDE operations
    const commands = parseCommands(result.commands);
    const rcOverrides = commands.filter(c => c.operation === 38);
    expect(rcOverrides.length).toBe(2);
    // Both should be for channel 9
    expect(rcOverrides[0].operandAValue).toBe(9);
    expect(rcOverrides[1].operandAValue).toBe(9);
    // Different values
    const values = rcOverrides.map(c => c.operandBValue).sort();
    expect(values).toContain(1500);
    expect(values).toContain(1700);
  });
});

/**
 * Tests for Math.abs() (used by: heading-tracking)
 *
 * Note: INAV Logic Conditions has no native ABS operation.
 *       Math.abs(x) is synthesized as max(x, 0-x) using SUB (15) and MAX (44)
 *       This is implemented in expression_generator.js:170-193
 */
describe('Math.abs() - Examples Coverage', () => {

  test('should compile Math.abs() using max(x, 0-x) synthesis (heading-tracking example)', () => {
    const code = `
      const { flight, gvar } = inav;

      if (Math.abs(inav.flight.yaw - inav.gvar[0]) > 90) {
        inav.gvar[1] = 1;
      }
    `;

    const result = transpile(code);

    expect(result.success).toBe(true);
    // Math.abs(x) synthesized as max(x, 0-x) since INAV has no native ABS
    const commands = parseCommands(result.commands);
    // Should have SUB (computing 0 - x for the negation)
    const hasSub = commands.some(c => c.operation === 15);
    // Should have MAX to get absolute value: max(x, -x)
    const hasMax = commands.some(c => c.operation === 44);
    expect(hasSub).toBe(true);
    expect(hasMax).toBe(true);
    // Should have the final comparison
    const hasComparison = commands.some(c => c.operation === 2); // GREATER_THAN
    expect(hasComparison).toBe(true);
  });
});

/**
 * Tests for inav.events.sticky() function (used by: sticky-condition)
 */
describe('inav.events.sticky() Function - Examples Coverage', () => {

  test('should compile inav.events.sticky() with on/off conditions (sticky-condition example)', () => {
    const code = `
      const { flight, gvar, sticky, override } = inav;

      inav.events.sticky(
        () => inav.flight.rssi < 30,
        () => inav.flight.rssi > 70,
        () => {
          inav.override.vtx.power = 4;
        }
      );
    `;

    const result = transpile(code);

    expect(result.success).toBe(true);
    // STICKY is operation 13
    const commands = parseCommands(result.commands);
    const stickyCmd = commands.find(c => c.operation === 13);
    expect(stickyCmd).toBeDefined();
  });

  test('should compile inav.events.sticky() with object syntax', () => {
    const code = `
      const { flight, gvar, sticky, override } = inav;

      var latch = inav.events.sticky({
        on: () => inav.flight.rssi < 30,
        off: () => inav.flight.rssi > 70
      });

      if (latch) {
        inav.override.vtx.power = 4;
      }
    `;

    const result = transpile(code);

    expect(result.success).toBe(true);
    const commands = parseCommands(result.commands);
    const stickyCmd = commands.find(c => c.operation === 13);
    expect(stickyCmd).toBeDefined();
  });
});

/**
 * Tests for waypoint operations (used by: waypoint-arrival)
 */
describe('Waypoint Operations - Examples Coverage', () => {

  test('should compile inav.waypoint.distance comparison (waypoint-arrival example)', () => {
    const code = `
      

      if (inav.waypoint.distance < 10) {
        inav.gvar[0] = 1;
      }

      if (inav.waypoint.distance > 20) {
        inav.gvar[0] = 0;
      }
    `;

    const result = transpile(code);

    expect(result.success).toBe(true);
    // waypoint is operand type 7
    const commands = parseCommands(result.commands);
    const waypointReads = commands.filter(c => c.operandAType === 7);
    expect(waypointReads.length).toBeGreaterThan(0);
    // distance is operand value 4
    expect(waypointReads.some(c => c.operandAValue === 4)).toBe(true);
  });
});

/**
 * Tests for multiple independent if statements (used by: vtx-distance, battery-protection, altitude-stages)
 */
describe('Multiple Independent If Statements - Examples Coverage', () => {

  test('should compile multiple independent if statements (vtx-distance example)', () => {
    const code = `
      

      if (inav.flight.homeDistance > 100) {
        inav.override.vtx.power = 3;
      }

      if (inav.flight.homeDistance > 500) {
        inav.override.vtx.power = 4;
      }
    `;

    const result = transpile(code);

    expect(result.success).toBe(true);
    // Should have at least 2 root conditions (activator -1) or properly nested
    const commands = parseCommands(result.commands);
    expect(commands.length).toBeGreaterThanOrEqual(4);
    // Check VTX power operations (operation 25)
    const vtxOps = commands.filter(c => c.operation === 25);
    expect(vtxOps.length).toBe(2);
  });

  test('should compile three independent if statements (altitude-stages example)', () => {
    const code = `
      

      if (inav.flight.altitude > 50) {
        inav.override.vtx.power = 3;
      }

      if (inav.flight.altitude > 100) {
        inav.override.vtx.power = 4;
      }

      if (inav.flight.altitude < 10) {
        inav.override.vtx.power = 1;
      }
    `;

    const result = transpile(code);

    expect(result.success).toBe(true);
    const commands = parseCommands(result.commands);
    const vtxOps = commands.filter(c => c.operation === 25);
    expect(vtxOps.length).toBe(3);
  });
});

/**
 * Tests for combined conditions (used by: multi-condition)
 *
 * Note: && uses chained activators (efficient - saves LC slots, provides short-circuit evaluation)
 *       This is intentional per condition_generator.js:306-313
 * Note: || uses operation 8 (OR)
 */
describe('Combined Conditions (AND/OR) - Examples Coverage', () => {

  test('should compile && condition using chained activators (multi-condition example)', () => {
    const code = `
      

      if (inav.flight.homeDistance > 200 && inav.flight.altitude > 50) {
        inav.override.vtx.power = 4;
      }
    `;

    const result = transpile(code);

    expect(result.success).toBe(true);
    // AND uses chained activators for efficiency (see condition_generator.js):
    // LC0: homeDistance > 200 (activator -1)
    // LC1: altitude > 50 (activator 0) - only evaluates when LC0 is true
    // LC2: VTX power (activator 1) - only runs when LC0 && LC1 are true
    const commands = parseCommands(result.commands);
    // Should have 3 LCs: condition1, condition2, action
    expect(commands.length).toBeGreaterThanOrEqual(3);
    // Second condition should have first condition as activator
    expect(commands[1].activator).toBe(0);
    // Action should have second condition as activator
    expect(commands[2].activator).toBe(1);
  });

  test('should compile || condition (multi-condition example)', () => {
    const code = `
      

      if (inav.flight.cellVoltage < 350 || inav.flight.rssi < 40) {
        inav.override.throttleScale = 60;
      }
    `;

    const result = transpile(code);

    expect(result.success).toBe(true);
    // OR is operation 8
    const commands = parseCommands(result.commands);
    const orCmd = commands.find(c => c.operation === 8);
    expect(orCmd).toBeDefined();
  });
});

/**
 * Integration test: Compile actual examples
 */
describe('Actual Examples Compilation', () => {

  test('should compile arm-init example', () => {
    const code = `
      const { flight, gvar, edge } = inav;

      inav.events.edge(() => inav.flight.armTimer > 1000, { duration: 0 }, () => {
        inav.gvar[0] = inav.flight.yaw;
        inav.gvar[1] = 0;
      });
    `;

    const result = transpile(code);
    expect(result.success).toBe(true);
  });

  test('should compile vtx-distance example', () => {
    const code = `
      

      if (inav.flight.homeDistance > 100) {
        inav.override.vtx.power = 3;
      }

      if (inav.flight.homeDistance > 500) {
        inav.override.vtx.power = 4;
      }
    `;

    const result = transpile(code);
    expect(result.success).toBe(true);
  });

  test('should compile battery-protection example', () => {
    const code = `
      

      if (inav.flight.cellVoltage < 350) {
        inav.override.throttleScale = 50;
      }

      if (inav.flight.cellVoltage < 330) {
        inav.override.throttleScale = 25;
      }
    `;

    const result = transpile(code);
    expect(result.success).toBe(true);
  });

  test('should compile rc-controlled example', () => {
    const code = `
      const { rc, override } = inav;

      if (inav.rc[5].high) {
        inav.override.vtx.power = 4;
      }

      if (inav.rc[5].mid) {
        inav.override.vtx.power = 2;
      }

      if (inav.rc[5].low) {
        inav.override.vtx.power = 1;
      }
    `;

    const result = transpile(code);
    expect(result.success).toBe(true);
  });

  test('should compile override-rc example', () => {
    const code = `
      const { flight, rc } = inav;

      if (inav.flight.groundSpeed > 1000) {
        inav.rc[9] = 1700;
      } else {
        inav.rc[9] = 1500;
      }
    `;

    const result = transpile(code);
    expect(result.success).toBe(true);
  });

  test('should compile sticky-condition example', () => {
    const code = `
      const { flight, sticky, override } = inav;

      inav.events.sticky(
        () => inav.flight.rssi < 30,
        () => inav.flight.rssi > 70,
        () => {
          inav.override.vtx.power = 4;
        }
      );
    `;

    const result = transpile(code);
    expect(result.success).toBe(true);
  });

  test('should compile waypoint-arrival example', () => {
    const code = `
      

      if (inav.waypoint.distance < 10) {
        inav.gvar[0] = 1;
      }

      if (inav.waypoint.distance > 20) {
        inav.gvar[0] = 0;
      }
    `;

    const result = transpile(code);
    expect(result.success).toBe(true);
  });
});

module.exports = { loadModules };
