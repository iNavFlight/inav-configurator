# Flight Axis Override - Complete Implementation

## Summary

Implemented full bidirectional support for INAV flight axis angle and rate overrides in the JavaScript Programming tab.

## What's New

### User-Facing Features

**New JavaScript API:**
```javascript
const { flight, override } = inav;

// Set angle targets (in degrees)
override.flightAxis.roll.angle = 45;
override.flightAxis.pitch.angle = -15;
override.flightAxis.yaw.angle = 180;

// Set rate targets (in degrees per second)
override.flightAxis.roll.rate = 200;
override.flightAxis.pitch.rate = 100;
override.flightAxis.yaw.rate = 50;
```

**IntelliSense Support:**
- Full autocomplete for `override.flightAxis.{roll|pitch|yaw}.{angle|rate}`
- Hover documentation with descriptions and units (°, °/s)
- Type checking ensures numeric values
- Shows valid ranges from INAV firmware constraints

**Decompilation:**
- INAV logic conditions now decompile to clean JavaScript code
- Removed "may need verification" warnings (API is now fully implemented)

## Technical Changes

### Files Modified

1. **js/transpiler/api/definitions/override.js**
   - Added `flightAxis` object with roll/pitch/yaw and angle/rate properties
   - Linked to OPERATION constants (45=angle, 46=rate)

2. **js/transpiler/api/types.js**
   - Made `generateInterfaceFromDefinition()` recursive
   - Now handles multi-level nested objects for TypeScript definitions
   - Supports 3-level nesting (flightAxis → axis → property)

3. **js/transpiler/transpiler/codegen.js**
   - Added pattern matching for `override.flightAxis.*` syntax
   - Also added missing operations: osdLayout, loiterRadius, minGroundSpeed
   - Returns correct OPERATION constants

4. **js/transpiler/transpiler/action_generator.js**
   - Modified `generateOverride()` to encode axis in operandA
   - Maps roll=0, pitch=1, yaw=2 to operandA
   - Value goes in operandB

5. **js/transpiler/transpiler/action_decompiler.js**
   - Removed verification warnings for FLIGHT_AXIS operations
   - API is now fully implemented and tested

### INAV Firmware Mapping

**Operations:**
- `FLIGHT_AXIS_ANGLE_OVERRIDE` (45): Set angle target
  - operandA: axis (0=roll, 1=pitch, 2=yaw)
  - operandB: angle in degrees

- `FLIGHT_AXIS_RATE_OVERRIDE` (46): Set rate target
  - operandA: axis (0=roll, 1=pitch, 2=yaw)
  - operandB: rate in degrees/second (-2000 to 2000)

**Constraints (from firmware):**
- Angle overrides: Constrained to ±max_angle_inclination from PID profile
- Rate overrides: Constrained to ±2000 degrees/second

## Testing

### New Tests Created

1. **test_flight_axis_override.js** - Compiler tests
   - Roll angle override
   - Pitch rate override
   - Yaw angle override
   - Multiple axis overrides
   - Verification of generated logic conditions

2. **test_override_regressions.js** - Regression tests (14 tests)
   - All existing override operations still compile
   - VTX overrides (power, band, channel)
   - Throttle overrides
   - Multiple overrides in single block
   - Flight axis + regular overrides together
   - Error handling for invalid targets
   - Decompilation tests

3. **test_flight_axis_decompile.js** - Decompilation without warnings
   - Verifies no warnings generated
   - Tests all three axes
   - Tests both angle and rate

### Test Results

✅ **All 130+ tests pass** with no regressions:
- 116 existing transpiler tests
- 14 new override regression tests
- Flight axis override tests

### Example Output

**Input JavaScript:**
```javascript
const { flight, override } = inav;

if (flight.altitude > 100) {
  override.flightAxis.roll.angle = 45;
}
```

**Generated Logic Condition:**
```
logic 0 1 -1 2 2 12 0 100 0
logic 1 1 0 45 0 0 0 45 0
```

- LC 0: altitude (12) > 100
- LC 1: Op 45 (FLIGHT_AXIS_ANGLE_OVERRIDE), axis 0 (roll), value 45°

## Compatibility

- **Compiler:** Now fully supports flight axis overrides ✅
- **Decompiler:** Already supported, warnings removed ✅
- **INAV Firmware:** Operations 45/46 supported in all recent versions ✅
- **IntelliSense:** Full autocomplete and type checking ✅

## Documentation

- **FLIGHT_AXIS_OVERRIDE_IMPLEMENTATION.md** - Technical implementation details
- **REGRESSION_TEST_SUMMARY.md** - Complete test results
- **This file** - User-facing changelog

## Migration Notes

**For Users:**
- No migration needed
- New feature is additive
- All existing code continues to work

**For Developers:**
- TypeScript type generation is now recursive
- Override operations use OPERATION constants (no hardcoded numbers)
- Pattern matching in `getOverrideOperation()` handles special cases
