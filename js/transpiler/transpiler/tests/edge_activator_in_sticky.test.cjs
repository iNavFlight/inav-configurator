/**
 * Test: Edge with activator used as sticky operand (Issue #6)
 *
 * Bug: LC 26 (Edge with activator = profile check) is referenced as sticky operand.
 * When sticky outputs its on condition, the edge's activator should be respected.
 *
 * LC 5: rc[12].high (always)
 * LC 17: flight.mixerProfile === 1 (always)
 * LC 26: Edge(LC5, 100), active when LC 17 (profile check)
 * LC 27: approxEqual(rc[11], 1500) (always)
 * LC 29: Sticky(LC26, LC28), active when LC 27
 *
 * Expected: The edge should only fire when profile=1, even though the sticky
 * is inside the rc[11]=1500 block.
 */

'use strict';

require('./simple_test_runner.cjs');

let Decompiler;

async function loadDecompiler() {
  const module = await import('../decompiler.js');
  Decompiler = module.Decompiler;
}

describe('Edge with activator used as sticky operand', () => {
  let decompiler;

  beforeEach(() => {
    decompiler = new Decompiler();
  });

  test('edge activator should be preserved when edge is sticky operand', () => {
    // Simplified scenario:
    // LC 0: rc[12].high (the condition to edge on)
    // LC 1: flight.mixerProfile === 1 (the activator for the edge)
    // LC 2: Edge(LC0, 100), active when LC 1 - edge only fires when profile=1
    // LC 3: rc[11] ~ 1500 (activator for sticky)
    // LC 4: a dummy "off" condition for sticky
    // LC 5: Sticky(LC2, LC4), active when LC 3
    // LC 6: Action triggered by sticky

    const conditions = [
      // LC 0: rc[12].high
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
      // LC 1: flight.mixerProfile === 1
      {
        index: 1,
        enabled: 1,
        activatorId: -1,
        operation: 1, // EQUAL
        operandAType: 2, // FLIGHT
        operandAValue: 38, // ACTIVE_MIXER_PROFILE (logic_condition.h:143)
        operandBType: 0, // VALUE
        operandBValue: 1,
        flags: 0
      },
      // LC 2: Edge(LC0, 100), active when LC 1 (profile check)
      // This edge should only fire when profile === 1
      {
        index: 2,
        enabled: 1,
        activatorId: 1, // LC 1 (profile check) - THIS IS THE KEY
        operation: 47, // EDGE (logicConditionOperators.js:294, logic_condition.h:79)
        operandAType: 4, // LC
        operandAValue: 0, // LC 0 (rc[12].high)
        operandBType: 0, // VALUE
        operandBValue: 100, // 100ms
        flags: 0
      },
      // LC 3: approxEqual(rc[11], 1500) - activator for sticky
      {
        index: 3,
        enabled: 1,
        activatorId: -1,
        operation: 51, // APPROX_EQUAL (logicConditionOperators.js:318, logic_condition.h:83)
        operandAType: 1, // RC_CHANNEL
        operandAValue: 11,
        operandBType: 0, // VALUE
        operandBValue: 1500,
        flags: 0
      },
      // LC 4: dummy off condition (flight.isArmed === 0)
      {
        index: 4,
        enabled: 1,
        activatorId: -1,
        operation: 1, // EQUAL
        operandAType: 2, // FLIGHT
        operandAValue: 17, // isArmed
        operandBType: 0,
        operandBValue: 0,
        flags: 0
      },
      // LC 5: Sticky(LC2, LC4), active when LC 3
      // The ON condition (LC 2) has activator LC 1 (profile check)
      {
        index: 5,
        enabled: 1,
        activatorId: 3, // LC 3 (rc[11] ~ 1500)
        operation: 13, // STICKY
        operandAType: 4, // LC
        operandAValue: 2, // LC 2 (the EDGE with activator)
        operandBType: 4, // LC
        operandBValue: 4, // LC 4 (off condition)
        flags: 0
      },
      // LC 6: Action when sticky is true
      {
        index: 6,
        enabled: 1,
        activatorId: 5, // LC 5 (sticky)
        operation: 18, // GVAR_SET
        operandAType: 0,
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 1,
        flags: 0
      }
    ];

    const result = decompiler.decompile(conditions);
    console.log('Generated code:');
    console.log(result.code);
    console.log('Warnings:', result.warnings);

    expect(result.success).toBe(true);

    // The key assertion: the edge's activator (profile check) should be preserved
    // Either by hoisting the edge to a variable with the activator guard,
    // or by some other mechanism that preserves the relationship.

    // If hoisting works correctly, we should see something like:
    // const cond1 = <profile check> ? edge(rc[12].high, 100) : 0;
    // ...
    // sticky({ on: () => cond1, ... })

    // The profile check (flight.something === 1) should appear in the hoisted var,
    // NOT just inside an if block

    // Check that the edge respects its activator
    const code = result.code;

    // The edge should either:
    // 1. Be hoisted with a ternary that includes the profile check
    // 2. Or be wrapped in a profile check somehow

    // It should NOT appear as raw edge(rc[12].high, 100) inside the rc[11] ~ 1500 block
    // without the profile check

    // Look for hoisted variable with activator (pattern 1)
    const hasHoistedWithActivator = /const cond\d+ = .* \? .*edge\(.*\) : 0/.test(code);

    // Look for inline edge with activator in sticky callback (pattern 2)
    // The edge should be wrapped in a ternary inside the sticky on: callback
    const hasInlineEdgeWithActivator = /on:\s*\(\)\s*=>\s*\(.*\?\s*edge\(.*\)\s*:\s*0\)/.test(code);

    if (!hasHoistedWithActivator && !hasInlineEdgeWithActivator) {
      console.log('Edge was not hoisted with activator and not inline with activator');
      console.log('Code:', code);
    }

    // Either pattern is acceptable - both preserve the activator relationship
    expect(hasHoistedWithActivator || hasInlineEdgeWithActivator).toBe(true);
  });
});

module.exports = { loadDecompiler };
