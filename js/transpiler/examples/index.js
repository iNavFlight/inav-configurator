/**
 * INAV JavaScript Programming Examples
 * 
 * Location: tabs/transpiler/examples/index.js
 * 
 */

'use strict';

const examples = {

  'arm-init': {
    name: 'Arm Initialization',
    description: 'Initialize variables once when arming (executes once)',
    category: 'Basic',
    code: `// Initialize variables on arm (executes only once)
const { flight, gvar, edge } = inav;

edge(() => flight.armTimer > 1000, { duration: 0 }, () => {
  gvar[0] = flight.yaw;    // Save initial heading
  gvar[1] = 0;             // Reset counter
});`
  },
  
  'vtx-distance': {
    name: 'VTX Power by Distance',
    description: 'Increase VTX power automatically when far from home',
    category: 'VTX',
    code: `// Auto VTX power based on distance
const { flight, override, rc, gvar, waypoint, pid, helpers, events } = inav;

if (flight.homeDistance > 100) {
  override.vtx.power = 3; // High power
}

if (flight.homeDistance > 500) {
  override.vtx.power = 4; // Max power
}`
  },

  'battery-protection': {
    name: 'Battery Protection',
    description: 'Reduce throttle when battery voltage is low',
    category: 'Safety',
    code: `// Battery protection - reduce throttle on low voltage
const { flight, override, rc, gvar, waypoint, pid, helpers, events } = inav;

if (flight.cellVoltage < 350) {
  override.throttleScale = 50; // 50% throttle limit
}

if (flight.cellVoltage < 330) {
  override.throttleScale = 25; // 25% throttle limit - RTH!
}`
  },

  'rssi-vtx': {
    name: 'RSSI-based VTX Power',
    description: 'Boost VTX power when RSSI drops',
    category: 'VTX',
    code: `// Boost VTX power when signal weakens
const { flight, override, rc, gvar, waypoint, pid, helpers, events } = inav;

if (flight.rssi < 50) {
  override.vtx.power = 3;
}

if (flight.rssi < 30) {
  override.vtx.power = 4; // Max power
}`
  },



  'altitude-stages': {
    name: 'Altitude-based Stages',
    description: 'Different settings at different altitudes',
    category: 'Navigation',
    code: `// Different VTX settings by altitude
const { flight, override } = inav;

if (flight.altitude > 50) {
  override.vtx.power = 3;
}

if (flight.altitude > 100) {
  override.vtx.power = 4;
}

if (flight.altitude < 10) {
  override.vtx.power = 1; // Low power near ground
}`
  },

  'heading-tracking': {
    name: 'Track Heading Changes',
    description: 'Initialize heading on arm, then monitor changes',
    category: 'Navigation',
    code: `// Track heading changes
const { flight, gvar, edge } = inav;

// Save initial heading once on arm
edge(() => flight.armTimer > 1000, { duration: 0 }, () => {
  gvar[0] = flight.yaw;
});

// If heading changed more than 90 degrees
if (Math.abs(flight.yaw - gvar[0]) > 90) {
  gvar[1] = 1; // Set flag
}`
  },

  'gps-check': {
    name: 'GPS Fix Check',
    description: 'Monitor GPS fix status',
    category: 'Safety',
    code: `// Check GPS fix before allowing certain operations
const { flight, gvar } = inav;

if (flight.gpsSats < 6) {
  gvar[0] = 0; // No GPS - flag it
}

if (flight.gpsSats >= 6) {
  gvar[0] = 1; // Good GPS
}`
  },

  'multi-condition': {
    name: 'Multiple Conditions',
    description: 'Combine multiple flight parameters',
    category: 'Advanced',
    code: `// Multiple conditions example
const { flight, override } = inav;

// Only boost VTX if far AND high
if (flight.homeDistance > 200 && flight.altitude > 50) {
  override.vtx.power = 4;
}

// Reduce throttle if battery low OR RSSI weak
if (flight.cellVoltage < 350 || flight.rssi < 40) {
  override.throttleScale = 60;
}`
  },

  'simple-counter': {
    name: 'Simple Counter',
    description: 'Count events using global variables',
    category: 'Basic',
    code: `// Simple event counter
const { flight, gvar, edge } = inav;

// Initialize counter once on arm
edge(() => flight.armTimer > 1000, { duration: 0 }, () => {
  gvar[0] = 0;
});

// This runs continuously - increments every time altitude > 100
if (flight.altitude > 100) {
  gvar[0] = gvar[0] + 1;
}`
  },

  'edge-detection': {
    name: 'Edge Detection',
    description: 'Detect rising edge of a condition (executes once)',
    category: 'Advanced',
    code: `// Detect when RSSI drops below threshold (once)
const { flight, gvar, edge } = inav;

edge(() => flight.rssi < 30, { duration: 100 }, () => {
  gvar[0] = 1; // Set warning flag
  override.vtx.power = 4; // Boost power
});`
  },

  'waypoint-arrival': {
    name: 'Waypoint Arrival Detection',
    description: 'Detect when arriving at waypoint',
    category: 'Navigation',
    code: `// Detect waypoint arrival
const { waypoint, gvar } = inav;

if (waypoint.distance < 10) {
  gvar[0] = 1; // Arrived at waypoint
}

if (waypoint.distance > 20) {
  gvar[0] = 0; // Not at waypoint
}`
  },

  'rc-controlled': {
    name: 'RC Switch Control',
    description: 'Use RC switch to control features',
    category: 'RC Control',
    code: `// Use RC switch to control VTX power
const { rc, override } = inav;

if (rc[5].high) {
  override.vtx.power = 4; // Switch high = max power
}

if (rc[5].mid) {
  override.vtx.power = 2; // Switch mid = medium power
}

if (rc[5].low) {
  override.vtx.power = 1; // Switch low = min power
}`
  },


  'override-rc': {
    name: 'Override RC channel from speed',
    description: 'Override RC channel based on ground speed',
    category: 'RC Control',
    code: `// 
const { flight, override, rc } = inav;

if (flight.groundSpeed > 1000) {  // >10 m/s
  rc[9] = 1700;
} else {
  rc[9] = 1500;   // Center
}`
  },


  'debounce-edge': {
    name: 'Debounced Edge Detection',
    description: 'Detect condition change with debounce time',
    category: 'Advanced',
    code: `// Detect RSSI drop with 500ms debounce
const { flight, gvar, edge } = inav;

// Only triggers once when RSSI < 40, ignores bouncing
edge(() => flight.rssi < 40, { duration: 500 }, () => {
  gvar[0] = gvar[0] + 1; // Count RSSI drop events
});`
  },

  'sticky-condition': {
    name: 'Sticky/Latching Condition',
    description: 'Condition that latches ON and needs reset',
    category: 'Advanced',
    code: `// Sticky condition - latches ON until reset
const { flight, gvar, sticky, override } = inav;

// Create a latch: ON when RSSI < 30, OFF when RSSI > 70
var rssiWarning = sticky({
  on: () => flight.rssi < 30,
  off: () => flight.rssi > 70
});

// Use the latch to control actions
if (rssiWarning) {
  override.vtx.power = 4; // Max power while latched
}`
  },

  'sticky-variable': {
    name: 'Sticky with Variable',
    description: 'Assign sticky state to a variable for reuse',
    category: 'Advanced',
    code: `// Sticky condition stored in a variable
const { flight, gvar, sticky, override } = inav;

// Create a latch variable that can be referenced multiple times
var lowBatteryLatch = sticky({
  on: () => flight.cellVoltage < 330,
  off: () => flight.cellVoltage > 350
});

// Use the latch variable to control multiple actions
if (lowBatteryLatch) {
  override.throttleScale = 50;
  gvar[0] = 1;  // Warning flag
}`
  },

  'pid-output': {
    name: 'PID Controller Output',
    description: 'Read PID controller output values',
    category: 'PID',
    code: `// Read programming PID controller outputs
const { pid, gvar, override } = inav;

// PID controllers are configured in the Programming PID tab
// Here we read the output and use it for control

// Use PID 0 output to adjust throttle
if (pid[0].output > 500) {
  override.throttle = 1600;
}

// Store PID output in a gvar for OSD display
gvar[0] = pid[0].output;

// Combine multiple PID outputs
gvar[1] = pid[0].output + pid[1].output;`
  },

  'flight-modes': {
    name: 'Flight Mode Detection',
    description: 'Check active flight modes and respond',
    category: 'Flight Modes',
    code: `// Check active flight modes
const { flight, gvar, override } = inav;

// Check if position hold is active
if (flight.mode.poshold === 1) {
  gvar[0] = 1;  // Flag: in poshold
}

// Check if RTH is active
if (flight.mode.rth === 1) {
  override.vtx.power = 4;  // Max power during RTH
}

// Check altitude hold
if (flight.mode.althold === 1) {
  gvar[1] = flight.altitude;  // Store altitude
}

// Check for failsafe
if (flight.mode.failsafe === 1) {
  gvar[7] = 1;  // Emergency flag
}`
  },

  'pid-throttle-control': {
    name: 'PID-based Throttle Control',
    description: 'Use PID output to control throttle',
    category: 'PID',
    code: `// Use PID controller for custom throttle control
const { pid, override } = inav;

// PID 3 is configured to maintain altitude (set up in PID tab)
// Map the output to throttle range

// Clamp PID output to throttle range
let throttleBase = 1500;
let pidContribution = Math.min(300, Math.max(-300, pid[3].output));
override.throttle = throttleBase + pidContribution;`
  },

  'mode-based-vtx': {
    name: 'Mode-based VTX Control',
    description: 'Adjust VTX power based on flight mode',
    category: 'Flight Modes',
    code: `// VTX power control based on flight mode
const { flight, override } = inav;

// Low power in manual/acro modes (close range)
if (flight.mode.manual === 1) {
  override.vtx.power = 1;
}

// Medium power in angle/horizon modes
if (flight.mode.angle === 1 || flight.mode.horizon === 1) {
  override.vtx.power = 2;
}

// High power during autonomous modes (may be far away)
if (flight.mode.rth === 1 || flight.mode.poshold === 1) {
  override.vtx.power = 4;
}

// Max power during waypoint mission
if (flight.mode.waypointMission === 1) {
  override.vtx.power = 4;
}`
  }
};

export default examples;
