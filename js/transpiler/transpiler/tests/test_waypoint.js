#!/usr/bin/env node
/**
 * Waypoint Navigation Test
 *
 * Tests waypoint operand access.
 *
 * BUGS THAT WERE FIXED:
 * 1. waypoint.js used type: 5 (GVAR) instead of type: 7 (WAYPOINTS)
 * 2. waypoint.js exposed fabricated properties (lat/lon/alt/bearing) that don't exist
 * 3. waypoint.js was missing actual properties (isWaypointMission, user actions, etc.)
 *
 * This test verifies the fix is correct.
 *
 * Run with: node test_waypoint.js
 */

import { Transpiler } from '../index.js';
import { Decompiler } from '../decompiler.js';
import { OPERAND_TYPE, WAYPOINT_PARAM } from '../inav_constants.js';

console.log('=== Waypoint Navigation Test ===\n');

const testCode = `
const { flight, gvar, waypoint } = inav;

// Test 1: Waypoint mission state
if (waypoint.isWaypointMission) {
  gvar[0] = 1;
}

// Test 2: Current waypoint info
let wp_num = waypoint.number;
let wp_action = waypoint.action;
let next_action = waypoint.nextAction;

// Test 3: Distance measurements
var distance_to_wp = waypoint.distance;
var distance_from_prev = waypoint.distanceFromPrevious;

// Test 4: User action flags (previous waypoint)
if (waypoint.user1Action) {
  gvar[1] = 100;
}

if (waypoint.user2Action || waypoint.user3Action) {
  gvar[2] = 200;
}

// Test 5: User action flags (next waypoint)
if (waypoint.user1ActionNext) {
  gvar[3] = 300;
}

// Test 6: Using waypoint data in expressions
if (waypoint.distance < 50) {
  gvar[4] = waypoint.number;
}

// Test 7: Multiple waypoint properties in condition
if (waypoint.distance > 100 && waypoint.action === 1) {
  gvar[5] = waypoint.distanceFromPrevious;
}
`;

console.log('=== Original JavaScript ===\n');
console.log(testCode);

console.log('\n📝 NOTE: This test uses ACTUAL waypoint properties from firmware:');
console.log('   - isWaypointMission (0), number (1), action (2), nextAction (3)');
console.log('   - distance (4), distanceFromPrevious (5)');
console.log('   - user1-4Action (6-9), user1-4ActionNext (10-13)');
console.log('');
console.log('   DOES NOT use fabricated properties:');
console.log('   ❌ latitude, longitude, altitude, bearing (DO NOT EXIST in firmware)');
console.log('   ❌ missionReached, missionValid (DO NOT EXIST in firmware)\n');

// Transpile
const transpiler = new Transpiler();
const result = transpiler.transpile(testCode);

if (!result.success) {
  console.error('❌ Transpilation failed:', result.error);
  process.exit(1);
}

console.log('\n=== Generated CLI Commands ===\n');
result.commands.forEach((cmd, idx) => {
  console.log(`${idx}: ${cmd}`);
});

console.log('\n=== Variable Map ===\n');
console.log(JSON.stringify(result.variableMap, null, 2));

// Parse commands to LC format
const logicConditions = result.commands.map((cmd) => {
  const parts = cmd.split(/\s+/);
  return {
    index: parseInt(parts[1]),
    enabled: parseInt(parts[2]),
    activatorId: parseInt(parts[3]),
    operation: parseInt(parts[4]),
    operandAType: parseInt(parts[5]),
    operandAValue: parseInt(parts[6]),
    operandBType: parseInt(parts[7]),
    operandBValue: parseInt(parts[8]),
    flags: parseInt(parts[9]) || 0
  };
});

// Verify operations
console.log('\n=== Verification ===\n');

let passed = true;

// Check 1: Waypoint reads should use operand type 7 (WAYPOINTS)
console.log('Check 1: Waypoint reads (should use operand type 7 = WAYPOINTS)');
const waypointReads = logicConditions.filter(lc =>
  lc.operandAType === OPERAND_TYPE.WAYPOINTS ||
  lc.operandBType === OPERAND_TYPE.WAYPOINTS
);

if (waypointReads.length > 0) {
  console.log(`✅ Found ${waypointReads.length} waypoint reads using correct operand type (${OPERAND_TYPE.WAYPOINTS})`);
  waypointReads.slice(0, 5).forEach(lc => {
    const wpOpA = (lc.operandAType === OPERAND_TYPE.WAYPOINTS) ? lc.operandAValue : null;
    const wpOpB = (lc.operandBType === OPERAND_TYPE.WAYPOINTS) ? lc.operandBValue : null;
    console.log(`  LC${lc.index}: op=${lc.operation} opA(type=${lc.operandAType}, val=${lc.operandAValue}) opB(type=${lc.operandBType}, val=${lc.operandBValue})`);

    if (wpOpA !== null) {
      const paramName = Object.keys(WAYPOINT_PARAM).find(key => WAYPOINT_PARAM[key] === wpOpA);
      console.log(`    → Reads waypoint.${paramName} (operand ${wpOpA})`);
    }
    if (wpOpB !== null) {
      const paramName = Object.keys(WAYPOINT_PARAM).find(key => WAYPOINT_PARAM[key] === wpOpB);
      console.log(`    → Reads waypoint.${paramName} (operand ${wpOpB})`);
    }
  });
} else {
  console.log('❌ No waypoint reads found with correct operand type');
  passed = false;
}

// Check for WRONG operand type (5 = GVAR, the old bug)
const wrongWaypointReads = logicConditions.filter(lc =>
  (lc.operandAType === 5 || lc.operandBType === 5) &&
  ((lc.operandAValue >= 0 && lc.operandAValue <= 13) ||
   (lc.operandBValue >= 0 && lc.operandBValue <= 13))
);

if (wrongWaypointReads.length > 0) {
  console.log(`\n❌ BUG DETECTED: Found ${wrongWaypointReads.length} operations using WRONG type 5 (GVAR)!`);
  console.log('   This indicates waypoint.js still has the bug where type: 5 should be type: 7');
  wrongWaypointReads.forEach(lc => {
    console.log(`  LC${lc.index}: opA(type=${lc.operandAType}, val=${lc.operandAValue}) opB(type=${lc.operandBType}, val=${lc.operandBValue})`);
  });
  passed = false;
}

// Check 2: Waypoint operands should be 0-13 (valid range)
console.log('\nCheck 2: Waypoint operand values (should be 0-13)');
const usedOperands = new Set();
waypointReads.forEach(lc => {
  if (lc.operandAType === OPERAND_TYPE.WAYPOINTS) usedOperands.add(lc.operandAValue);
  if (lc.operandBType === OPERAND_TYPE.WAYPOINTS) usedOperands.add(lc.operandBValue);
});

const sortedOperands = [...usedOperands].sort((a, b) => a - b);
console.log(`  Waypoint operands used: ${sortedOperands.join(', ')}`);

const invalidOperands = sortedOperands.filter(op => op < 0 || op > 13);
if (invalidOperands.length === 0) {
  console.log('  ✅ All operands are within valid range (0-13)');
} else {
  console.log(`  ❌ Found invalid operands: ${invalidOperands.join(', ')}`);
  passed = false;
}

// Check 3: Map operands to property names
console.log('\nCheck 3: Operand mapping verification');
sortedOperands.forEach(op => {
  const paramName = Object.keys(WAYPOINT_PARAM).find(key => WAYPOINT_PARAM[key] === op);
  if (paramName) {
    console.log(`  Operand ${op} → waypoint.${paramName.toLowerCase()} ✅`);
  } else {
    console.log(`  Operand ${op} → UNKNOWN ❌`);
    passed = false;
  }
});

// Check 4: Document what firmware exposes
console.log('\nCheck 4: Firmware-exposed waypoint operands (0-13)');
console.log('  ✅ 0  = IS_WP (isWaypointMission)');
console.log('  ✅ 1  = WAYPOINT_INDEX (number)');
console.log('  ✅ 2  = WAYPOINT_ACTION (action)');
console.log('  ✅ 3  = NEXT_WAYPOINT_ACTION (nextAction)');
console.log('  ✅ 4  = WAYPOINT_DISTANCE (distance)');
console.log('  ✅ 5  = DISTANCE_FROM_WAYPOINT (distanceFromPrevious)');
console.log('  ✅ 6  = USER1_ACTION (user1Action)');
console.log('  ✅ 7  = USER2_ACTION (user2Action)');
console.log('  ✅ 8  = USER3_ACTION (user3Action)');
console.log('  ✅ 9  = USER4_ACTION (user4Action)');
console.log('  ✅ 10 = USER1_ACTION_NEXT_WP (user1ActionNext)');
console.log('  ✅ 11 = USER2_ACTION_NEXT_WP (user2ActionNext)');
console.log('  ✅ 12 = USER3_ACTION_NEXT_WP (user3ActionNext)');
console.log('  ✅ 13 = USER4_ACTION_NEXT_WP (user4ActionNext)');
console.log('');
console.log('  ❌ lat/lon/alt/bearing are NOT exposed (internal only)');

// Decompile
console.log('\n=== Decompiled JavaScript ===\n');
const decompiler = new Decompiler();
const decompileResult = decompiler.decompile(logicConditions, result.variableMap);

console.log(decompileResult.code);

// Summary
console.log('\n=== Test Summary ===\n');
console.log(`Total logic conditions: ${logicConditions.length}`);
console.log(`Waypoint reads (type ${OPERAND_TYPE.WAYPOINTS}): ${waypointReads.length}`);
console.log(`Waypoint operands used: ${sortedOperands.join(', ')}`);
console.log(`Unique properties accessed: ${usedOperands.size}`);

if (wrongWaypointReads.length > 0) {
  console.log(`\n❌ BUG STILL EXISTS: waypoint.js using wrong type 5 instead of 7`);
}

console.log('\n=== Final Result ===\n');
if (passed && decompileResult.success) {
  console.log('✅ All waypoint tests passed!');
  console.log('   waypoint.js fix is working correctly.');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}
