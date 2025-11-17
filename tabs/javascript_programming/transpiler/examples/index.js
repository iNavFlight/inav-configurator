/**
 * INAV Example Scripts
 * 
 * Location: tabs/programming/transpiler/examples/index.js
 * 
 * Collection of example scripts demonstrating INAV JavaScript API
 */

export const examples = {
  'vtx-distance': {
    name: 'VTX Power by Distance',
    description: 'Increase VTX power automatically when far from home',
    category: 'VTX',
    code: `// Auto VTX power based on distance
const { flight, override, when } = inav;

when(() => flight.homeDistance > 100, () => {
  override.vtx.power = 3; // High power
});

when(() => flight.homeDistance > 500, () => {
  override.vtx.power = 4; // Max power
});`
  },
  
  'battery-protection': {
    name: 'Battery Protection',
    description: 'Limit throttle on low battery to preserve cells',
    category: 'Safety',
    code: `// Throttle limit on low battery
const { flight, override, when } = inav;

when(() => flight.cellVoltage < 350, () => {
  override.throttleScale = 50; // 50% throttle limit
});

when(() => flight.cellVoltage < 330, () => {
  override.throttleScale = 25; // Emergency - 25% only
});`
  },
  
  'auto-rth': {
    name: 'Auto RTH on Signal Loss',
    description: 'Trigger RTH when RSSI or link quality drops',
    category: 'Safety',
    code: `// Emergency RTH on signal loss
const { flight, override, when } = inav;

when(() => flight.rssi < 20, () => {
  override.rcChannel[8] = 2000; // Trigger RTH switch
});

when(() => flight.linkQualityUplink < 30, () => {
  override.rcChannel[8] = 2000; // Trigger RTH switch
});`
  },
  
  'heading-storage': {
    name: 'Store Heading on Arm',
    description: 'Save initial heading to use later in flight',
    category: 'Navigation',
    code: `// Store heading 1 second after arming
const { flight, gvar, on } = inav;

on.arm({ delay: 1 }, () => {
  let heading = flight.mixerProfile + 180;
  heading = heading % 360;
  gvar[0] = heading;
});`
  },
  
  'emergency-level': {
    name: 'Emergency Stabilization',
    description: 'Force level flight on failsafe or switch',
    category: 'Safety',
    code: `// Emergency stabilization
const { flight, rc, override, gvar, when, on } = inav;

// Store initial heading
on.arm({ delay: 1 }, () => {
  gvar[0] = flight.yaw;
});

// Activate on failsafe OR switch
when(() => flight.mode.failsafe || rc[5].high, () => {
  override.yaw.angle = gvar[0];  // Hold heading
  override.pitch.angle = 2;       // Slight nose up
  override.roll.angle = 0;        // Level wings
});`
  },
  
  'waypoint-actions': {
    name: 'Waypoint Triggered Actions',
    description: 'Execute actions at specific waypoints',
    category: 'Waypoint',
    code: `// Waypoint-triggered actions
const { waypoint, override, when } = inav;

// Max VTX power at survey points (User Action 1)
when(() => waypoint.userAction[0], () => {
  override.vtx.power = 4;
});

// Slow down near waypoint
when(() => waypoint.distanceToNext < 50, () => {
  override.minGroundSpeed = 3; // 3 m/s minimum
});`
  },
  
  'dynamic-loiter': {
    name: 'Dynamic Loiter Radius',
    description: 'Adjust loiter radius based on wind or speed',
    category: 'Navigation',
    code: `// Dynamic loiter radius
const { flight, override, when } = inav;

// Large radius at high speed
when(() => flight.groundSpeed > 1500, () => {
  override.loiterRadius = 10000; // 100m radius
});

// Small radius at low speed
when(() => flight.groundSpeed < 500, () => {
  override.loiterRadius = 3000; // 30m radius
});`
  },
  
  'smart-rth': {
    name: 'Smart RTH Switch',
    description: 'Context-aware RTH behavior',
    category: 'Navigation',
    code: `// Smart RTH - only activate if conditions are safe
const { flight, override, rc, when } = inav;

when(() => rc[8].high && flight.gpsValid && flight.gpsSats > 8, () => {
  // RTH switch is high AND GPS is good
  override.rcChannel[8] = 2000; // Allow RTH
});`
  }
};

/**
 * Get example by ID
 */
export function getExample(id) {
  return examples[id];
}

/**
 * Get all examples in a category
 */
export function getExamplesByCategory(category) {
  return Object.entries(examples)
    .filter(([_, ex]) => ex.category === category)
    .map(([id, ex]) => ({ id, ...ex }));
}

/**
 * Get all categories
 */
export function getCategories() {
  const categories = new Set();
  Object.values(examples).forEach(ex => categories.add(ex.category));
  return Array.from(categories).sort();
}