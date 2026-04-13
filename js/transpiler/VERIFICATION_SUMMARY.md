# Transpiler API Verification - Complete Summary

**Date:** 2025-12-02
**Status:** Verification Complete - Ready for Testing & Fixes
**Verifier:** Developer

---

## Executive Summary

Systematic verification of all transpiler API definitions against INAV firmware source code revealed **6 critical bugs** across multiple API files. All bugs have been documented with firmware cross-references.

**Files Verified:**
- ✅ waypoint.js - **3 CRITICAL BUGS**
- ✅ gvar.js - **2 BUGS**
- ✅ pid.js - **1 MAJOR BUG**
- ✅ override.js - **CORRECT** ✓
- ✅ flight.js - **INCOMPLETE** (missing 4 params)
- ✅ inav_constants.js - **INCOMPLETE** (missing 5 constants)
- ✅ codegen.js - **1 BUG** (already fixed)
- ✅ rc.js - **CORRECT** (codegen handles it) ✓

---

## Bug #1: waypoint.js - CRITICAL - Wrong Type & Fabricated Properties

**Severity:** CRITICAL
**Impact:** Complete functional breakage
**Status:** ✅ FIXED

### Issues:

1. **Wrong Operand Type**
   - Bug: `type: 5` (GVAR)
   - Correct: `type: 7` (WAYPOINTS)
   - Impact: Would read global variables instead of waypoint data

2. **Fabricated Properties** (DO NOT EXIST in firmware)
   - ❌ `latitude` - DOES NOT EXIST
   - ❌ `longitude` - DOES NOT EXIST
   - ❌ `altitude` - DOES NOT EXIST
   - ❌ `bearing` - DOES NOT EXIST
   - ❌ `missionReached` - DOES NOT EXIST
   - ❌ `missionValid` - DOES NOT EXIST

3. **Missing Real Properties**
   - `isWaypointMission` (value: 0)
   - `nextAction` (value: 3)
   - `distanceFromPrevious` (value: 5)
   - 8 user action flags (values: 6-13)

### Firmware Source:
- Header: `inav/src/main/programming/logic_condition.h` (lines 177-192)
- Implementation: `inav/src/main/programming/logic_condition.c` (lines 575-669)

### Fix Applied:
Complete rewrite with correct type and all 14 actual properties.

---

## Bug #2: gvar.js - Wrong Type & Wrong Operation

**Severity:** HIGH
**Impact:** Global variables would not work
**Status:** ⚠️ NEEDS FIX

### Issues:

1. **Wrong Operand Type** (Line 23)
   - Bug: `type: 3` (FLIGHT_MODE)
   - Correct: `type: 5` (GVAR)
   - Impact: Would read flight mode instead of global variable

2. **Wrong Operation** (Line 26)
   - Bug: `inavOperation: 19` (GVAR_INC - increment)
   - Correct: `inavOperation: 18` (GVAR_SET - set value)
   - Impact: Assignments would increment instead of set

### Firmware Source:
- Type: `logic_condition.h` line 98 → `LOGIC_CONDITION_OPERAND_TYPE_GVAR = 5`
- Type constant: `inav_constants.js` line 22 → `GVAR: 5`
- Operation: `logic_condition.h` line 50 → `LOGIC_CONDITION_GVAR_SET = 18`
- Operation constant: `inav_constants.js` line 49 → `GVAR_SET: 18`

### Fix Required:
```javascript
// Line 23: Change
type: 3, // WRONG
// To:
type: OPERAND_TYPE.GVAR, // Which is 5

// Line 26: Change
inavOperation: 19 // WRONG (GVAR_INC)
// To:
inavOperation: OPERATION.GVAR_SET // Which is 18
```

---

## Bug #3: pid.js - MAJOR - Fabricated Properties

**Severity:** MAJOR
**Impact:** Most PID properties don't exist
**Status:** ⚠️ NEEDS FIX

### Issue:

pid.js claims PIDs expose 8 properties per controller (i*10+0 through i*10+7):
- setpoint, measurement, P, I, D, FF gains, output, enabled

**Firmware Reality:** Only **output** (operand 0-3) is exposed!

### Firmware Source:
```c
// inav/src/main/programming/logic_condition.c:1078-1082
case LOGIC_CONDITION_OPERAND_TYPE_PID:
    if (operand >= 0 && operand < MAX_PROGRAMMING_PID_COUNT) {
        retVal = programmingPidGetOutput(operand);  // ONLY OUTPUT!
    }
    break;
```

The firmware ONLY supports:
- Operand 0 → PID 0 output
- Operand 1 → PID 1 output
- Operand 2 → PID 2 output
- Operand 3 → PID 3 output

### Fix Required:
Complete rewrite - remove fabricated `configure()` method and all non-existent properties. Only expose `output` property per PID controller (operands 0-3).

---

## Bug #4: flight.js - INCOMPLETE - Missing Wind Parameters

**Severity:** MEDIUM
**Impact:** Wind-related features unavailable
**Status:** ⚠️ NEEDS FIX

### Missing Parameters:

From `logic_condition.h` lines 151-154:

| Param | Name | Unit | Description |
|-------|------|------|-------------|
| 46 | MIN_GROUND_SPEED | m/s | Minimum ground speed |
| 47 | HORIZONTAL_WIND_SPEED | cm/s | Horizontal wind speed |
| 48 | WIND_DIRECTION | deg | Wind direction (0-359°) |
| 49 | RELATIVE_WIND_OFFSET | deg | Relative wind offset |

### Current State:
flight.js stops at param 45 (crsfRssiDbm)

### Fix Required:
Add 4 new properties to flight.js with FLIGHT_PARAM values 46-49.

---

## Bug #5: inav_constants.js - INCOMPLETE - Missing Constants

**Severity:** MEDIUM
**Impact:** Missing constants cause undefined references
**Status:** ⚠️ NEEDS FIX

### Missing FLIGHT_PARAM (46-49):

```javascript
const FLIGHT_PARAM = {
  // ... existing 0-45 ...
  MIN_GROUND_SPEED: 46,           // MISSING
  HORIZONTAL_WIND_SPEED: 47,      // MISSING
  WIND_DIRECTION: 48,             // MISSING
  RELATIVE_WIND_OFFSET: 49,       // MISSING
};
```

### Missing FLIGHT_PARAM_NAMES (46-49):

```javascript
const FLIGHT_PARAM_NAMES = {
  // ... existing 0-45 ...
  [46]: 'minGroundSpeed',          // MISSING
  [47]: 'horizontalWindSpeed',     // MISSING
  [48]: 'windDirection',           // MISSING
  [49]: 'relativeWindOffset',      // MISSING
};
```

### Missing OPERATION (56):

```javascript
const OPERATION = {
  // ... existing 0-55 ...
  OVERRIDE_MIN_GROUND_SPEED: 56,  // MISSING
};
```

**Note:** override.js line 106 already uses operation 56 (hardcoded), but the constant doesn't exist!

### Fix Required:
Add 5 missing constants (4 FLIGHT_PARAM + 1 OPERATION).

---

## Bug #6: codegen.js - RC Channel Syntax Limited

**Severity:** LOW
**Impact:** Couldn't use `rc[N].value` syntax
**Status:** ✅ FIXED

### Issue:
Regex only matched `rc[N]`, rejected `rc[N].value`

### Fix Applied:
```javascript
// Line 615: Changed from
const match = value.match(/^rc\[(\d+)\]$/);
// To:
const match = value.match(/^rc\[(\d+)\](?:\.value)?$/);
```

---

## Files That Are CORRECT ✅

### override.js - ALL OPERATIONS CORRECT
Verified all 10 operations match firmware exactly:
- throttleScale: 23 ✓
- throttle: 29 ✓
- vtx.power: 25 ✓
- vtx.band: 30 ✓
- vtx.channel: 31 ✓
- armSafety: 22 ✓
- osdLayout: 32 ✓
- rcChannel: 38 ✓
- loiterRadius: 41 ✓
- minGroundSpeed: 56 ✓

### rc.js - OPERAND HANDLING CORRECT
- rc.js definitions use type: 4 (which looks wrong)
- But codegen.js handles RC channels directly (line 625)
- Returns correct `OPERAND_TYPE.RC_CHANNEL` (type 1)
- Test confirms RC operations use correct types
- **No fix needed**

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Files Verified** | 8 |
| **Bugs Found** | 6 |
| **Bugs Fixed** | 2 |
| **Bugs Pending** | 4 |
| **Files Correct** | 2 |
| **Total Issues** | 6 bugs + 2 incomplete files = 8 issues |

---

## Severity Breakdown

- **CRITICAL:** 1 (waypoint.js - fabricated properties)
- **HIGH:** 1 (gvar.js - wrong types)
- **MAJOR:** 1 (pid.js - fabricated properties)
- **MEDIUM:** 2 (flight.js, inav_constants.js - incomplete)
- **LOW:** 1 (codegen.js - syntax limitation) ✅ Fixed

---

## Next Steps

### 1. Write Tests (Before Fixing)
- [ ] test_gvar.js - Test global variable read/write with correct types
- [ ] test_pid.js - Test PID output reading (only)
- [ ] test_flight.js - Test all flight params including wind (when added)
- [ ] test_waypoint.js - Test actual waypoint properties (not fabricated ones)

### 2. Fix All Issues
- [ ] gvar.js - Change type 3→5, operation 19→18
- [ ] pid.js - Complete rewrite, remove fabricated properties
- [ ] flight.js - Add wind parameters 46-49
- [ ] inav_constants.js - Add FLIGHT_PARAM 46-49 and OPERATION 56

### 3. Validation
- [ ] Run all tests
- [ ] Verify transpiler output matches firmware expectations
- [ ] Update generate-constants.js if needed
- [ ] Document breaking changes for users

---

## Files Modified So Far

1. ✅ `js/transpiler/api/definitions/waypoint.js` - Complete rewrite (124 lines)
2. ✅ `js/transpiler/transpiler/codegen.js` - RC syntax fix (1 line)
3. ✅ `js/transpiler/transpiler/tests/test_rc_channels.js` - New test (201 lines)

## Files Pending Changes

4. ⚠️ `js/transpiler/api/definitions/gvar.js` - 2 line changes
5. ⚠️ `js/transpiler/api/definitions/pid.js` - Major rewrite needed
6. ⚠️ `js/transpiler/api/definitions/flight.js` - Add 4 properties (~40 lines)
7. ⚠️ `js/transpiler/transpiler/inav_constants.js` - Add 5 constants (~10 lines)

---

## Documentation Created

1. ✅ `/js/transpiler/API_BUGS_FOUND.md` - Initial bug report
2. ✅ `/js/transpiler/VERIFICATION_SUMMARY.md` - This file (complete findings)

---

**Verification Status:** ✅ COMPLETE
**Testing Status:** ⏳ PENDING
**Fix Status:** 🔨 2/6 FIXED, 4 PENDING
