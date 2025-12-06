# Flight Axis Override Implementation

## Overview

Implemented full compiler support for INAV flight axis angle and rate overrides in the JavaScript Programming tab.

## Syntax

```javascript
const { flight, override } = inav;

// Angle overrides (in degrees)
override.flightAxis.roll.angle = 45;
override.flightAxis.pitch.angle = -15;
override.flightAxis.yaw.angle = 180;

// Rate overrides (in degrees per second)
override.flightAxis.roll.rate = 200;
override.flightAxis.pitch.rate = 100;
override.flightAxis.yaw.rate = 50;
```

## INAV Operations Mapping

- **FLIGHT_AXIS_ANGLE_OVERRIDE** (45): Set angle target for roll/pitch/yaw
  - `operandA`: Axis index (0=roll, 1=pitch, 2=yaw)
  - `operandB`: Angle in degrees

- **FLIGHT_AXIS_RATE_OVERRIDE** (46): Set rate target for roll/pitch/yaw
  - `operandA`: Axis index (0=roll, 1=pitch, 2=yaw)
  - `operandB`: Rate in degrees per second (-2000 to 2000)

## Implementation Details

### 1. API Definitions (`js/transpiler/api/definitions/override.js`)

Added `flightAxis` object with nested structure:
```javascript
flightAxis: {
  roll: { angle, rate },
  pitch: { angle, rate },
  yaw: { angle, rate }
}
```

### 2. TypeScript Type Generation (`js/transpiler/api/types.js`)

Updated `generateInterfaceFromDefinition()` to be recursive, supporting multi-level nested objects for IntelliSense.

### 3. Operation Mapping (`js/transpiler/transpiler/codegen.js`)

Modified `getOverrideOperation()` to detect flight axis patterns:
```javascript
const flightAxisMatch = target.match(/^override\.flightAxis\.(roll|pitch|yaw)\.(angle|rate)$/);
```

### 4. Code Generation (`js/transpiler/transpiler/action_generator.js`)

Modified `generateOverride()` to encode axis index in operandA:
```javascript
const axisMap = { 'roll': 0, 'pitch': 1, 'yaw': 2 };
const axisIndex = axisMap[flightAxisMatch[1]];

this.pushLogicCommand(operation,
  { type: 0, value: axisIndex },  // operandA = axis
  valueOperand,                    // operandB = angle/rate
  activatorId
);
```

### 5. Decompilation (`js/transpiler/transpiler/action_decompiler.js`)

Already implemented - generates the same syntax:
```javascript
override.flightAxis.${axisName}.angle = ${value};
override.flightAxis.${axisName}.rate = ${value};
```

## Testing

Test file: `js/transpiler/transpiler/tests/test_flight_axis_override.js`

### Test Results

✅ Roll angle override compiles correctly
✅ Pitch rate override compiles correctly
✅ Yaw angle override compiles correctly

Example generated logic condition:
```
logic 1 1 0 45 0 0 0 45 0
```
- Operation 45 (FLIGHT_AXIS_ANGLE_OVERRIDE)
- OperandA type 0, value 0 (roll axis)
- OperandB type 0, value 45 (45 degrees)

## IntelliSense Support

TypeScript definitions provide full autocomplete and documentation:

- `override.flightAxis` - Shows roll, pitch, yaw
- `override.flightAxis.roll` - Shows angle, rate
- Hover shows descriptions and units (°, °/s)
- Type checking ensures numeric values

## Constraints

Based on INAV firmware (`src/main/programming/logic_condition.c`):

- **Angle overrides**: Constrained to ±max_angle_inclination from PID profile
- **Rate overrides**: Constrained to ±2000 degrees/second
- **Axis values**: Must be 0 (roll), 1 (pitch), or 2 (yaw)

## Example Usage

```javascript
const { flight, override } = inav;

// Auto-level at high speeds
if (flight.speed > 20) {
  override.flightAxis.roll.angle = 0;   // Level roll
  override.flightAxis.pitch.angle = 5;  // Slight nose up
}

// Coordinated turn
if (rc.roll > 1500) {
  override.flightAxis.yaw.rate = 30;    // Add yaw rate
}
```

## Files Modified

1. `js/transpiler/api/definitions/override.js` - Added flightAxis definitions
2. `js/transpiler/api/types.js` - Made recursive for nested objects
3. `js/transpiler/transpiler/codegen.js` - Added flightAxis pattern matching
4. `js/transpiler/transpiler/action_generator.js` - Encode axis in operandA
5. `js/transpiler/transpiler/tests/test_flight_axis_override.js` - Test file (new)

## Compatibility

- **Decompiler**: Already supported (tested)
- **Compiler**: Now fully supported (new)
- **INAV Firmware**: Operations 45/46 supported since early versions
- **IntelliSense**: Full autocomplete and type checking
