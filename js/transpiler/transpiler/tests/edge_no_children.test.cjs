/**
 * Test: Edge with no children (Issue #10)
 *
 * Bug: Edge LCs with no children are skipped even though they might be
 * externally referenced (by Global Functions for OSD display, etc.)
 *
 * LC 36 = NOT(LC 9), Always - in-flight indicator
 * LC 37 = Edge(LC 33, 3000), Active when LC 36 - "FW SHIFT DONE"
 * LC 38 = Edge(LC 35, 3000), Active when LC 36 - "VTOL SHIFT DONE"
 *
 * LC 33 and LC 35 are Override RC actions. LC 37/38 edge on action execution,
 * which sets their value to 1 for 3000ms. These could be read by Global Functions.
 */

'use strict';

require('./simple_test_runner.cjs');

let Decompiler;

async function loadDecompiler() {
  const module = await import('../decompiler.js');
  Decompiler = module.Decompiler;
}

describe('Edge with no children (externally referenced)', () => {
  let decompiler;

  beforeEach(() => {
    decompiler = new Decompiler();
  });

  test('edge with no children should still be output for external reference', () => {
    // Simplified scenario:
    // LC 0: condition (flight.isArmed)
    // LC 1: Action (Override rc[16]=1100), active when LC 0
    // LC 2: NOT(LC 0) - in-flight check (always active)
    // LC 3: Edge(LC 1, 3000), active when LC 2 - fires for 3s after action
    //
    // LC 3 has no children but could be externally referenced by Global Functions

    const conditions = [
      // LC 0: flight.isArmed === 0 (on ground)
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 1, // EQUAL
        operandAType: 2, // FLIGHT
        operandAValue: 17, // isArmed
        operandBType: 0, // VALUE
        operandBValue: 0,
        flags: 0
      },
      // LC 1: Override rc[16]=1100, active when LC 0
      {
        index: 1,
        enabled: 1,
        activatorId: 0,
        operation: 38, // OVERRIDE_RC_CHANNEL (logicConditionOperators.js:238)
        operandAType: 0, // VALUE (channel number)
        operandAValue: 16,
        operandBType: 0, // VALUE
        operandBValue: 1100,
        flags: 0
      },
      // LC 2: NOT(LC 0) - in-flight check
      {
        index: 2,
        enabled: 1,
        activatorId: -1,
        operation: 12, // NOT (logicConditionOperators.js:76)
        operandAType: 4, // LC
        operandAValue: 0, // LC 0
        operandBType: 0,
        operandBValue: 0,
        flags: 0
      },
      // LC 3: Edge(LC 1, 3000), active when LC 2
      // This edge fires for 3000ms when the override action (LC 1) executes
      // It has NO children, but could be read by Global Functions
      {
        index: 3,
        enabled: 1,
        activatorId: 2, // LC 2 (in-flight check)
        operation: 47, // EDGE (logicConditionOperators.js:294, logic_condition.h:79)
        operandAType: 4, // LC
        operandAValue: 1, // LC 1 (the action)
        operandBType: 0, // VALUE
        operandBValue: 3000, // 3000ms
        flags: 0
      }
    ];

    const result = decompiler.decompile(conditions);
    console.log('Generated code:');
    console.log(result.code);
    console.log('Warnings:', result.warnings);

    expect(result.success).toBe(true);

    // The edge should appear in the output even though it has no children
    // It should be marked as "for external reference"
    const code = result.code;

    // Check that the edge is present
    const hasEdge = code.includes('edge(') || code.includes('Edge');
    const hasExternalRefComment = code.includes('external reference') ||
                                   code.includes('LC 3');

    console.log('Has edge:', hasEdge);
    console.log('Has external ref comment:', hasExternalRefComment);

    // Currently this test FAILS because edges with no children are skipped
    // After the fix, it should PASS
    expect(hasEdge || hasExternalRefComment).toBe(true);
  });
});

module.exports = { loadDecompiler };
