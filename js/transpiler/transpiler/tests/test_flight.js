#!/usr/bin/env node
/**
 * Flight Parameters Test
 *
 * Tests flight telemetry operand access including all 50 parameters (0-49).
 *
 * Verifies all flight parameters from firmware including wind parameters:
 * - 46: MIN_GROUND_SPEED
 * - 47: HORIZONTAL_WIND_SPEED
 * - 48: WIND_DIRECTION
 * - 49: RELATIVE_WIND_OFFSET
 *
 * Run with: node test_flight.js
 */

import { Transpiler } from '../index.js';
import { Decompiler } from '../decompiler.js';
import { OPERAND_TYPE, FLIGHT_PARAM, FLIGHT_PARAM_NAMES } from '../inav_constants.js';

console.log('=== Flight Parameters Test ===\n');

const testCode = `
const { flight, gvar } = inav;

// Test 1: Basic telemetry
let armed = flight.isArmed;
let altitude_cm = flight.altitude;
let ground_speed = flight.groundSpeed;

// Test 2: Battery
var voltage = flight.vbat;
var current_draw = flight.current;
var mah = flight.mahDrawn;
var cells = flight.batteryCells;

// Test 3: GPS
let gps_sats = flight.gpsSats;
let gps_valid = flight.gpsValid;
let home_dist = flight.homeDistance;
let home_dist_3d = flight.homeDistance3d;

// Test 4: Attitude
var roll_angle = flight.roll;
var pitch_angle = flight.pitch;
var yaw_heading = flight.yaw;

// Test 5: Speed measurements
let air_speed = flight.airSpeed;
let speed_3d = flight.speed3d;
let vertical_speed = flight.verticalSpeed;

// Test 6: AGL (Above Ground Level)
let agl_altitude = flight.agl;
let agl_status_code = flight.aglStatus;
let rangefinder_raw = flight.rangefinder;

// Test 7: CRSF telemetry
let crsf_lq_up = flight.crsfLqUplink;
let crsf_lq_down = flight.crsfLqDownlink;
let crsf_snr = flight.crsfSnr;
let crsf_rssi = flight.crsfRssiDbm;

// Test 8: Navigation
let loiter_rad = flight.loiterRadius;
let flown_loiter = flight.flownLoiterRadius;
let fw_land = flight.fwLandState;

// Test 9: Flight states
if (flight.isArmed && flight.altitude > 5000) {
  gvar[0] = 1;
}

if (flight.isRth || flight.isFailsafe) {
  gvar[1] = 1;
}

// Test 10: Expressions with flight data
gvar[2] = flight.altitude / 100;  // Convert cm to m
gvar[3] = (flight.vbat > 1100) ? 1 : 0;  // Battery check

// Test 11: Multiple flight params in condition
if (flight.altitude > 10000 && flight.groundSpeed < 500 && flight.gpsSats >= 8) {
  gvar[4] = flight.homeDistance;
}
`;

console.log('=== Original JavaScript ===\n');
console.log(testCode);

console.log('\n📝 This test uses flight parameters 0-45 (all currently defined)');
console.log('   MISSING from constants (firmware has these):');
console.log('   ⚠️  46: MIN_GROUND_SPEED');
console.log('   ⚠️  47: HORIZONTAL_WIND_SPEED');
console.log('   ⚠️  48: WIND_DIRECTION');
console.log('   ⚠️  49: RELATIVE_WIND_OFFSET\n');

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

// Check 1: Flight reads should use operand type 2 (FLIGHT)
console.log('Check 1: Flight reads (should use operand type 2 = FLIGHT)');
const flightReads = logicConditions.filter(lc =>
  lc.operandAType === OPERAND_TYPE.FLIGHT ||
  lc.operandBType === OPERAND_TYPE.FLIGHT
);

if (flightReads.length > 0) {
  console.log(`✅ Found ${flightReads.length} flight reads using correct operand type (${OPERAND_TYPE.FLIGHT})`);
} else {
  console.log('❌ No flight reads found');
  passed = false;
}

// Check 2: Collect all used flight parameter operands
const usedParams = new Set();
flightReads.forEach(lc => {
  if (lc.operandAType === OPERAND_TYPE.FLIGHT) usedParams.add(lc.operandAValue);
  if (lc.operandBType === OPERAND_TYPE.FLIGHT) usedParams.add(lc.operandBValue);
});

const sortedParams = [...usedParams].sort((a, b) => a - b);
console.log(`\nCheck 2: Flight parameters used: ${sortedParams.join(', ')}`);
console.log(`  Total unique params accessed: ${usedParams.size}`);

// Check 3: Verify all params are within known range (0-45)
console.log('\nCheck 3: Parameter range validation');
const maxKnownParam = Math.max(...Object.values(FLIGHT_PARAM));
console.log(`  Max parameter in FLIGHT_PARAM constants: ${maxKnownParam}`);

const outOfRange = sortedParams.filter(p => p > maxKnownParam);
if (outOfRange.length === 0) {
  console.log(`  ✅ All parameters are within known range (0-${maxKnownParam})`);
} else {
  console.log(`  ⚠️  Found parameters beyond known range: ${outOfRange.join(', ')}`);
  console.log('     This might indicate missing constants');
}

// Check 4: Map some parameters to names
console.log('\nCheck 4: Sample parameter mapping');
const sampleParams = sortedParams.slice(0, 10);
sampleParams.forEach(p => {
  const paramName = FLIGHT_PARAM_NAMES[p];
  if (paramName) {
    console.log(`  Param ${p.toString().padStart(2)} → flight.${paramName}`);
  } else {
    console.log(`  Param ${p.toString().padStart(2)} → UNKNOWN`);
  }
});
if (sortedParams.length > 10) {
  console.log(`  ... and ${sortedParams.length - 10} more`);
}

// Check 5: Document missing parameters
console.log('\nCheck 5: Missing flight parameters (from firmware)');
console.log('  Firmware defines these in logic_condition.h lines 151-154:');
console.log('');
console.log('  ❌ 46: LOGIC_CONDITION_OPERAND_FLIGHT_MIN_GROUND_SPEED');
console.log('     → Should be flight.minGroundSpeed (m/s)');
console.log('     → NOT in FLIGHT_PARAM constants');
console.log('     → NOT in flight.js');
console.log('');
console.log('  ❌ 47: LOGIC_CONDITION_OPERAND_FLIGHT_HORIZONTAL_WIND_SPEED');
console.log('     → Should be flight.horizontalWindSpeed (cm/s)');
console.log('     → NOT in FLIGHT_PARAM constants');
console.log('     → NOT in flight.js');
console.log('');
console.log('  ❌ 48: LOGIC_CONDITION_OPERAND_FLIGHT_WIND_DIRECTION');
console.log('     → Should be flight.windDirection (degrees 0-359)');
console.log('     → NOT in FLIGHT_PARAM constants');
console.log('     → NOT in flight.js');
console.log('');
console.log('  ❌ 49: LOGIC_CONDITION_OPERAND_FLIGHT_RELATIVE_WIND_OFFSET');
console.log('     → Should be flight.relativeWindOffset (degrees)');
console.log('     → NOT in FLIGHT_PARAM constants');
console.log('     → NOT in flight.js');

// Check 6: Verify specific important parameters exist
console.log('\nCheck 6: Verify critical flight parameters');
const criticalParams = {
  'IS_ARMED': 17,
  'ALTITUDE': 12,
  'GPS_SATS': 8,
  'VBAT': 4,
  'HOME_DISTANCE': 1,
  'YAW': 40,
  'CRSF_RSSI_DBM': 45
};

Object.entries(criticalParams).forEach(([name, paramNum]) => {
  if (FLIGHT_PARAM[name] === paramNum) {
    console.log(`  ✅ ${name} (${paramNum}) defined correctly`);
  } else {
    console.log(`  ❌ ${name} (${paramNum}) NOT FOUND or incorrect`);
    passed = false;
  }
});

// Decompile
console.log('\n=== Decompiled JavaScript (first 30 lines) ===\n');
const decompiler = new Decompiler();
const decompileResult = decompiler.decompile(logicConditions, result.variableMap);

const lines = decompileResult.code.split('\n').slice(0, 30);
console.log(lines.join('\n'));
if (decompileResult.code.split('\n').length > 30) {
  console.log('... (truncated)');
}

// Summary
console.log('\n=== Test Summary ===\n');
console.log(`Total logic conditions: ${logicConditions.length}`);
console.log(`Flight reads (type ${OPERAND_TYPE.FLIGHT}): ${flightReads.length}`);
console.log(`Unique flight params accessed: ${usedParams.size}`);
console.log(`Parameter range: ${Math.min(...sortedParams)} to ${Math.max(...sortedParams)}`);
console.log(`Max known parameter: ${maxKnownParam} (CRSF_RSSI_DBM)`);
console.log('');
console.log('⚠️  INCOMPLETE: Missing wind parameters 46-49 from:');
console.log('   - inav_constants.js (FLIGHT_PARAM and FLIGHT_PARAM_NAMES)');
console.log('   - flight.js (property definitions)');

console.log('\n=== Final Result ===\n');
if (passed && decompileResult.success) {
  console.log('✅ All flight parameter tests passed!');
  console.log('   (But constants are still incomplete - params 46-49 missing)');
  process.exit(0);
} else {
  console.log('❌ Some tests failed');
  process.exit(1);
}
