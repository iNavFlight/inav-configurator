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

inav.events.edge(() => inav.flight.armTimer > 1000, { duration: 0 }, () => {
  inav.gvar[0] = inav.flight.yaw;    // Save initial heading
  inav.gvar[1] = 0;                  // Reset counter
});`
  },
  
  'vtx-distance': {
    name: 'VTX Power by Distance',
    description: 'Increase VTX power automatically when far from home',
    category: 'VTX',
    code: `// Auto VTX power based on distance

if (inav.flight.homeDistance > 100) {
  inav.override.vtx.power = 3; // High power
}

if (inav.flight.homeDistance > 500) {
  inav.override.vtx.power = 4; // Max power
}`
  },

  'battery-protection': {
    name: 'Battery Protection',
    description: 'Reduce throttle when battery voltage is low',
    category: 'Safety',
    code: `// Battery protection - reduce throttle on low voltage

if (inav.flight.cellVoltage < 350) {
  inav.override.throttleScale = 50; // 50% throttle limit
}

if (inav.flight.cellVoltage < 330) {
  inav.override.throttleScale = 25; // 25% throttle limit - RTH!
}`
  },

  'rssi-vtx': {
    name: 'RSSI-based VTX Power',
    description: 'Boost VTX power when RSSI drops',
    category: 'VTX',
    code: `// Boost VTX power when signal weakens

if (inav.flight.rssi < 50) {
  inav.override.vtx.power = 3;
}

if (inav.flight.rssi < 30) {
  inav.override.vtx.power = 4; // Max power
}`
  },



  'altitude-stages': {
    name: 'Altitude-based Stages',
    description: 'Different settings at different altitudes',
    category: 'Navigation',
    code: `// Different VTX settings by altitude

if (inav.flight.altitude > 50) {
  inav.override.vtx.power = 3;
}

if (inav.flight.altitude > 100) {
  inav.override.vtx.power = 4;
}

if (inav.flight.altitude < 10) {
  inav.override.vtx.power = 1; // Low power near ground
}`
  },

  'heading-tracking': {
    name: 'Track Heading Changes',
    description: 'Initialize heading on arm, then monitor changes',
    category: 'Navigation',
    code: `// Track heading changes

// Save initial heading once on arm
inav.events.edge(() => inav.flight.armTimer > 1000, { duration: 0 }, () => {
  inav.gvar[0] = inav.flight.yaw;
});

// If heading changed more than 90 degrees
if (Math.abs(inav.flight.yaw - inav.gvar[0]) > 90) {
  inav.gvar[1] = 1; // Set flag
}`
  },

  'gps-check': {
    name: 'GPS Fix Check',
    description: 'Monitor GPS fix status',
    category: 'Safety',
    code: `// Check GPS fix before allowing certain operations

if (inav.flight.gpsSats < 6) {
  inav.gvar[0] = 0; // No GPS - flag it
}

if (inav.flight.gpsSats >= 6) {
  inav.gvar[0] = 1; // Good GPS
}`
  },

  'multi-condition': {
    name: 'Multiple Conditions',
    description: 'Combine multiple flight parameters',
    category: 'Advanced',
    code: `// Multiple conditions example

// Only boost VTX if far AND high
if (inav.flight.homeDistance > 200 && inav.flight.altitude > 50) {
  inav.override.vtx.power = 4;
}

// Reduce throttle if battery low OR RSSI weak
if (inav.flight.cellVoltage < 350 || inav.flight.rssi < 40) {
  inav.override.throttleScale = 60;
}`
  },

  'simple-counter': {
    name: 'Simple Counter',
    description: 'Count events using global variables',
    category: 'Basic',
    code: `// Simple event counter

// Initialize counter once on arm
inav.events.edge(() => inav.flight.armTimer > 1000, { duration: 0 }, () => {
  inav.gvar[0] = 0;
});

// This runs continuously - increments every time altitude > 100
if (inav.flight.altitude > 100) {
  inav.gvar[0] = inav.gvar[0] + 1;
}`
  },

  'edge-detection': {
    name: 'Edge Detection',
    description: 'Detect rising edge of a condition (executes once)',
    category: 'Advanced',
    code: `// Detect when RSSI drops below threshold (once)

inav.events.edge(() => inav.flight.rssi < 30, { duration: 100 }, () => {
  inav.gvar[0] = 1; // Set warning flag
  inav.override.vtx.power = 4; // Boost power
});`
  },

  'waypoint-arrival': {
    name: 'Waypoint Arrival Detection',
    description: 'Detect when arriving at waypoint',
    category: 'Navigation',
    code: `// Detect waypoint arrival

if (inav.waypoint.distance < 10) {
  inav.gvar[0] = 1; // Arrived at waypoint
}

if (inav.waypoint.distance > 20) {
  inav.gvar[0] = 0; // Not at waypoint
}`
  },

  'rc-controlled': {
    name: 'RC Switch Control',
    description: 'Use RC switch to control features',
    category: 'RC Control',
    code: `// Use RC switch to control VTX power

if (inav.rc[5].high) {
  inav.override.vtx.power = 4; // Switch high = max power
}

if (inav.rc[5].mid) {
  inav.override.vtx.power = 2; // Switch mid = medium power
}

if (inav.rc[5].low) {
  inav.override.vtx.power = 1; // Switch low = min power
}`
  },


  'override-rc': {
    name: 'Override RC channel from speed',
    description: 'Override RC channel based on ground speed',
    category: 'RC Control',
    code: `// Override RC channel based on ground speed

if (inav.flight.groundSpeed > 1000) {  // >10 m/s
  inav.rc[9] = 1700;
} else {
  inav.rc[9] = 1500;   // Center
}`
  },


  'debounce-edge': {
    name: 'Debounced Edge Detection',
    description: 'Detect condition change with debounce time',
    category: 'Advanced',
    code: `// Detect RSSI drop with 500ms debounce

// Only triggers once when RSSI < 40, ignores bouncing
inav.events.edge(() => inav.flight.rssi < 40, { duration: 500 }, () => {
  inav.gvar[0] = inav.gvar[0] + 1; // Count RSSI drop events
});`
  },

  'sticky-condition': {
    name: 'Sticky/Latching Condition',
    description: 'Condition that latches ON and needs reset',
    category: 'Advanced',
    code: `// Sticky condition - latches ON until reset

// Create a latch: ON when RSSI < 30, OFF when RSSI > 70
var rssiWarning = inav.events.sticky({
  on: () => inav.flight.rssi < 30,
  off: () => inav.flight.rssi > 70
});

// Use the latch to control actions
if (rssiWarning) {
  inav.override.vtx.power = 4; // Max power while latched
}`
  },

  'sticky-variable': {
    name: 'Sticky with Variable',
    description: 'Assign sticky state to a variable for reuse',
    category: 'Advanced',
    code: `// Sticky condition stored in a variable

// Create a latch variable that can be referenced multiple times
var lowBatteryLatch = inav.events.sticky({
  on: () => inav.flight.cellVoltage < 330,
  off: () => inav.flight.cellVoltage > 350
});

// Use the latch variable to control multiple actions
if (lowBatteryLatch) {
  inav.override.throttleScale = 50;
  inav.gvar[0] = 1;  // Warning flag
}`
  },

  'let-variables': {
    name: 'Let/Const Variables',
    description: 'Use named variables for cleaner code',
    category: 'Advanced',
    code: `// Named variables make code more readable

// Define thresholds as named constants
let lowVoltage = 330;
let criticalVoltage = 310;
let farDistance = 500;
let veryFarDistance = 1000;

// Use in conditions
if (inav.flight.cellVoltage < lowVoltage) {
  inav.override.throttleScale = 50;
}

if (inav.flight.cellVoltage < criticalVoltage) {
  inav.override.throttleScale = 25;
}

// Combine conditions with named variables
let isFarAway = inav.flight.homeDistance > farDistance;
let isVeryFarAway = inav.flight.homeDistance > veryFarDistance;

if (isVeryFarAway) {
  inav.override.vtx.power = 4;
} else if (isFarAway) {
  inav.override.vtx.power = 3;
}`
  },

  'ternary-operator': {
    name: 'Ternary Operator',
    description: 'Conditional value assignment',
    category: 'Advanced',
    code: `// Use ternary operator for conditional values

// Choose throttle limit based on voltage
let throttleLimit = inav.flight.cellVoltage < 330 ? 25 : 50;

if (inav.flight.cellVoltage < 350) {
  inav.override.throttleScale = throttleLimit;
}

// Nested ternary for multiple conditions
let powerLevel = inav.flight.rssi < 30 ? 4 :
                 inav.flight.rssi < 50 ? 3 :
                 inav.flight.rssi < 70 ? 2 : 1;

inav.override.vtx.power = powerLevel;`
  },

  'pid-output': {
    name: 'PID Controller Output',
    description: 'Read PID controller output values',
    category: 'PID',
    code: `// Read programming PID controller outputs

// PID controllers are configured in the Programming PID tab
// Here we read the output and use it for control

// Use PID 0 output to adjust throttle
if (inav.pid[0].output > 500) {
  inav.override.throttle = 1600;
}

// Store PID output in a gvar for OSD display
inav.gvar[0] = inav.pid[0].output;

// Combine multiple PID outputs
inav.gvar[1] = inav.pid[0].output + inav.pid[1].output;`
  },

  'flight-modes': {
    name: 'Flight Mode Detection',
    description: 'Check active flight modes and respond',
    category: 'Flight Modes',
    code: `// Check active flight modes

// Check if position hold is active
if (inav.flight.mode.poshold === 1) {
  inav.gvar[0] = 1;  // Flag: in poshold
}

// Check if RTH is active
if (inav.flight.mode.rth === 1) {
  inav.override.vtx.power = 4;  // Max power during RTH
}

// Check altitude hold
if (inav.flight.mode.althold === 1) {
  inav.gvar[1] = inav.flight.altitude;  // Store altitude
}

// Check for failsafe
if (inav.flight.mode.failsafe === 1) {
  inav.gvar[7] = 1;  // Emergency flag
}`
  },

  'pid-throttle-control': {
    name: 'PID-based Throttle Control',
    description: 'Use PID output to control throttle',
    category: 'PID',
    code: `// Use PID controller for custom throttle control

// PID 3 is configured to maintain altitude (set up in PID tab)
// Map the output to throttle range

// Clamp PID output to throttle range
let throttleBase = 1500;
let pidContribution = Math.min(300, Math.max(-300, inav.pid[3].output));
inav.override.throttle = throttleBase + pidContribution;`
  },

  'mode-based-vtx': {
    name: 'Mode-based VTX Control',
    description: 'Adjust VTX power based on flight mode',
    category: 'Flight Modes',
    code: `// VTX power control based on flight mode

// Low power in manual/acro modes (close range)
if (inav.flight.mode.manual === 1) {
  inav.override.vtx.power = 1;
}

// Medium power in angle/horizon modes
if (inav.flight.mode.angle === 1 || inav.flight.mode.horizon === 1) {
  inav.override.vtx.power = 2;
}

// High power during autonomous modes (may be far away)
if (inav.flight.mode.rth === 1 || inav.flight.mode.poshold === 1) {
  inav.override.vtx.power = 4;
}

// Max power during waypoint mission
if (inav.flight.mode.waypointMission === 1) {
  inav.override.vtx.power = 4;
}`
  }
};

export default examples;
