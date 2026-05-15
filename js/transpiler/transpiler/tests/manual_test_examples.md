# Manual Test Examples for JavaScript Variables

This file contains test cases for manual testing in the INAV Configurator UI.

## Test 1: Basic Let Variable (Constant Substitution)

```javascript
const { flight } = inav;

let maxAltitude = 500;

if (flight.altitude > maxAltitude) {
  gvar[0] = 1;
}
```

**Expected behavior:**
- Transpiles successfully
- Generates logic condition with `flight.altitude > 500`
- No gvar slots used for `maxAltitude`

## Test 2: Multiple Let Variables

```javascript
const { flight } = inav;

let minAlt = 100;
let maxAlt = 500;
let midpoint = 300;

if (flight.altitude < minAlt) {
  gvar[0] = 1;
} else if (flight.altitude > maxAlt) {
  gvar[0] = 3;
} else {
  gvar[0] = 2;
}
```

**Expected behavior:**
- All let variables substituted inline
- No gvar slots used for variables
- Logic conditions use literal values

## Test 3: Basic Var Variable (Gvar Allocation)

```javascript
const { flight } = inav;

var altitude_threshold = 500;

on.arm(() => {
  altitude_threshold = flight.altitude;
});

if (flight.altitude > altitude_threshold) {
  gvar[0] = 1;
}
```

**Expected behavior:**
- `altitude_threshold` allocated to gvar[7] (highest available)
- Initialization: `gvar[7] = 500`
- Assignment: `gvar[7] = flight.altitude`
- Condition: `flight.altitude > gvar[7]`

## Test 4: Mixed Let and Var

```javascript
const { flight } = inav;

let dangerAltitude = 1000;
var currentMode = 0;

on.arm(() => {
  currentMode = 1;
});

if (flight.altitude > dangerAltitude) {
  currentMode = 2;
}

gvar[0] = currentMode;
```

**Expected behavior:**
- `dangerAltitude` substituted as 1000
- `currentMode` allocated to gvar[7]
- Logic conditions use gvar[7] for currentMode

## Test 5: Let with Expressions

```javascript
const { flight } = inav;

let baseAlt = 100;
let offset = 50;
let threshold = baseAlt + offset;

if (flight.altitude > threshold) {
  gvar[0] = 1;
}
```

**Expected behavior:**
- All values computed at compile time
- Condition uses literal 150

## Test 6: Var with Runtime Expressions

```javascript
const { flight } = inav;

var adjustedAlt = 0;

on.always(() => {
  adjustedAlt = flight.altitude - 100;
});

if (adjustedAlt > 500) {
  gvar[0] = 1;
}
```

**Expected behavior:**
- `adjustedAlt` allocated to gvar[7]
- Assignment generates arithmetic operation
- Condition uses gvar[7]

## Test 7: Multiple Vars (Gvar Slot Usage)

```javascript
const { flight } = inav;

var var1 = 1;
var var2 = 2;
var var3 = 3;

gvar[0] = var1 + var2 + var3;
```

**Expected behavior:**
- Allocates gvar[7], gvar[6], gvar[5]
- Shows "3 of 8 gvar slots used" (future enhancement)

## Test 8: Error - Let Reassignment

```javascript
let altitude = 100;
altitude = 200;  // Should error
```

**Expected error:**
- `Cannot reassign 'let' variable 'altitude'. Use 'var' for mutable variables.`

## Test 9: Error - Variable Redeclaration

```javascript
let altitude = 100;
let altitude = 200;  // Should error
```

**Expected error:**
- `Variable 'altitude' is already declared`

## Test 10: Error - Gvar Slot Exhaustion

```javascript
var v1 = 1;
var v2 = 2;
var v3 = 3;
var v4 = 4;
var v5 = 5;
var v6 = 6;
var v7 = 7;
var v8 = 8;
var v9 = 9;  // Should error - only 8 slots
```

**Expected error:**
- `No available gvar slots for variable 'v9'. All 8 gvar slots are in use.`

## Test 11: Explicit Gvar Usage with Vars

```javascript
const { flight } = inav;

gvar[0] = 100;  // Explicit usage
gvar[1] = 200;  // Explicit usage

var myVar = 42;  // Should allocate to gvar[7] (not 0 or 1)

gvar[2] = myVar;
```

**Expected behavior:**
- `myVar` allocated to gvar[7]
- Avoids gvar[0] and gvar[1]

## Test 12: Multiple Transpile Calls (State Reset)

Run this test twice in a row:

```javascript
let time = flight.armTimer;
if (time > 1000) {
  gvar[1] = time;
}
```

**Expected behavior:**
- First transpile: Success
- Second transpile: Success (no "already declared" error)
- Both generate identical output

## Test 13: Complex Real-World Example

```javascript
const { flight, rc, override } = inav;

// Configuration
let minSafeAltitude = 50;
let maxSafeAltitude = 500;
let emergencyThrottle = 1500;

// State tracking
var isEmergency = 0;
var throttleOverride = 1000;

on.arm(() => {
  isEmergency = 0;
  throttleOverride = rc.throttle;
});

on.always(() => {
  if (flight.altitude < minSafeAltitude || flight.altitude > maxSafeAltitude) {
    isEmergency = 1;
    throttleOverride = emergencyThrottle;
  } else {
    isEmergency = 0;
  }
});

if (isEmergency) {
  override.throttle = throttleOverride;
}

gvar[0] = isEmergency;
```

**Expected behavior:**
- Let variables substituted inline
- Var variables allocated to gvar[7] and gvar[6]
- All logic conditions generated correctly
- Output is valid INAV CLI commands

---

## How to Run Manual Tests

1. Open INAV Configurator
2. Navigate to Programming tab
3. Paste each test case into the JavaScript editor
4. Click "Transpile to INAV"
5. Verify expected behavior
6. For save tests, click "Save to FC" (if connected to FC) or verify second transpile attempt
