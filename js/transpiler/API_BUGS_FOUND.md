# Transpiler API Definition Bugs Found

**Date:** 2025-12-02
**Investigator:** Developer
**Context:** Systematic verification of transpiler API definitions against INAV firmware

---

## Summary

Found **3 critical bugs** in the transpiler API definitions where the configurator did not match the actual firmware implementation.

---

## Bug #1: waypoint.js - CRITICAL - Wrong Type and Fabricated Properties

**File:** `js/transpiler/api/definitions/waypoint.js`

### Issues Found:

1. **Wrong Operand Type**
   - **Bug:** Used `type: 5` (GVAR type)
   - **Correct:** Should be `type: 7` (WAYPOINTS type)
   - **Impact:** Waypoint properties would read global variables instead of waypoint data!

2. **Fabricated Properties - Data Not Exposed by Firmware**
   - The following properties were **completely fabricated** and do NOT exist in the firmware's logic condition operand system:
     - ❌ `latitude` (claimed value: 2) - **DOES NOT EXIST**
     - ❌ `longitude` (claimed value: 3) - **DOES NOT EXIST**
     - ❌ `altitude` (claimed value: 4) - **DOES NOT EXIST**
     - ❌ `bearing` (claimed value: 6) - **DOES NOT EXIST**
     - ❌ `missionReached` (claimed value: 7) - **DOES NOT EXIST**
     - ❌ `missionValid` (claimed value: 8) - **DOES NOT EXIST**

3. **Missing Actual Properties**
   - The file was missing these REAL properties that ARE exposed:
     - Missing: `isWaypointMission` (value: 0)
     - Missing: `nextAction` (value: 3)
     - Missing: `distanceFromPrevious` (value: 5)
     - Missing: ALL user action flags (values: 6-13)

### Root Cause:
- Incorrect source documentation cited: `navigation_pos_estimator.c`
- **Actual source:** `src/main/programming/logic_condition.h` (logicWaypointOperands_e)
- **Actual implementation:** `src/main/programming/logic_condition.c` (lines 575-669)

### Firmware Reality:
Waypoints have lat/lon/alt/bearing **internally**, but these are **NOT exposed** through the logic condition operand system (for security/simplicity).

### Status: ✅ **FIXED**
- Updated waypoint.js with correct type (7) and actual properties (0-13)
- Added proper source documentation
- Added comment explaining why lat/lon/alt/bearing aren't available

---

## Bug #2: codegen.js - RC Channel .value Syntax Not Supported

**File:** `js/transpiler/transpiler/codegen.js` (line 614)

### Issue:
- **Bug:** Regex `/^rc\[(\d+)\]$/` only matched `rc[N]`, not `rc[N].value`
- **Impact:** Users couldn't use `rc[N].value` syntax (explicit form)
- **Note:** rc.js defines `.value` property, but transpiler rejected it

### Status: ✅ **FIXED**
- Updated regex to `/^rc\[(\d+)\](?:\.value)?$/`
- Both `rc[N]` and `rc[N].value` now work as equivalent
- Error message updated to reflect both syntaxes

### Verification:
Created comprehensive test (`test_rc_channels.js`) that confirms:
- ✅ RC reads use operand type 1 (RC_CHANNEL) - Correct!
- ✅ RC writes use operation 38 (RC_CHANNEL_OVERRIDE) - Correct!
- ✅ Both `rc[N]` and `rc[N].value` syntax work

---

## Bug #3: inav_constants.js - Missing Flight Parameters 46-49

**File:** `js/transpiler/transpiler/inav_constants.js`

### Issue:
- **Bug:** FLIGHT_PARAM stops at index 45 (CRSF_RSSI_DBM)
- **Missing:** Firmware has parameters 46-49

### Missing Parameters:
From `inav/src/main/programming/logic_condition.h` (lines 151-154):

```c
LOGIC_CONDITION_OPERAND_FLIGHT_MIN_GROUND_SPEED,        // 46 - m/s
LOGIC_CONDITION_OPERAND_FLIGHT_HORIZONTAL_WIND_SPEED,  // 47 - cm/s
LOGIC_CONDITION_OPERAND_FLIGHT_WIND_DIRECTION,         // 48 - deg
LOGIC_CONDITION_OPERAND_FLIGHT_RELATIVE_WIND_OFFSET,   // 49 - deg
```

### Impact:
- Wind-related flight parameters cannot be accessed in transpiler
- flight.js may also be missing these properties

### Status: ⚠️ **NEEDS FIX**
- Requires updating inav_constants.js FLIGHT_PARAM
- Requires updating flight.js with wind properties
- Requires re-running generate-constants.js script

---

## Additional Findings

###rc.js - Type 4 Bug (FALSE ALARM)

**File:** `js/transpiler/api/definitions/rc.js`

**Initial concern:** Uses `type: 4` instead of `type: 1` (RC_CHANNEL)

**Resolution:** ✅ **NO FIX NEEDED**
- codegen.js handles RC channels **directly** and hardcodes correct type
- Line 625 in codegen.js: `return { type: OPERAND_TYPE.RC_CHANNEL, value: index }`
- rc.js definitions are not actually used for operand type mapping
- Test confirms RC channels use correct type 1

---

## Files Modified

1. ✅ `js/transpiler/api/definitions/waypoint.js` - Complete rewrite
2. ✅ `js/transpiler/transpiler/codegen.js` - Regex fix for rc[N].value
3. ✅ `js/transpiler/transpiler/tests/test_rc_channels.js` - New comprehensive test

## Files Still Need Review

4. ⚠️ `js/transpiler/transpiler/inav_constants.js` - Add FLIGHT_PARAM 46-49
5. ⚠️ `js/transpiler/api/definitions/flight.js` - Add wind parameters
6. ⏳ `js/transpiler/api/definitions/gvar.js` - Verify against firmware
7. ⏳ `js/transpiler/api/definitions/pid.js` - Verify against firmware
8. ⏳ `js/transpiler/api/definitions/override.js` - Verify operations

---

## Testing Performed

### RC Channel Test (`test_rc_channels.js`)
- Tests both reading (`rc[N]`, `rc[N].value`) and writing (`rc[N] = value`)
- Verifies correct operand type (1) for reads
- Verifies correct operation (38) for writes
- Tests `low`, `mid`, `high` boolean properties
- ✅ All tests pass (after fixes)

### Waypoint Verification
- Cross-referenced firmware source (`logic_condition.h`, `logic_condition.c`)
- Confirmed actual exposed operands (0-13)
- Documented why lat/lon/alt/bearing are not available

---

## Recommendations

1. **Immediate:** Fix inav_constants.js and flight.js to add wind parameters 46-49
2. **Process:** Re-run `generate-constants.js` script to ensure sync with firmware
3. **Testing:** Add tests for waypoint operations to prevent regression
4. **Documentation:** Update transpiler docs to clarify RC channel syntax options
5. **Audit:** Complete verification of remaining API definition files (gvar, pid, override)

---

## Impact Assessment

### Critical (Bug #1 - waypoint.js):
- **Severity:** HIGH - Complete functional breakage
- **User Impact:** Any code using waypoint.latitude/longitude/bearing would fail or return wrong data
- **Likelihood:** MEDIUM - Users writing waypoint-based logic would encounter this

### Moderate (Bug #2 - rc syntax):
- **Severity:** MEDIUM - Syntax limitation
- **User Impact:** Users forced to use shorthand, couldn't use explicit .value
- **Likelihood:** LOW - Shorthand works, so users might not notice

### Low (Bug #3 - missing wind params):
- **Severity:** LOW - Missing features
- **User Impact:** Wind-related conditions unavailable
- **Likelihood:** LOW - Advanced feature, specific use case

---

**Total Issues:** 3 bugs found, 2 fixed, 1 pending
**New Tests:** 1 comprehensive RC channel test added
**Lines Changed:** ~150 lines across 3 files
