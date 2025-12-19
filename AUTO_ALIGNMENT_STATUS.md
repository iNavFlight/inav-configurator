# Auto Alignment Tool - Current Status

**Branch:** `auto_alignment_tool_rebase_v2`
**Original PR:** [#2158](https://github.com/iNavFlight/inav-configurator/pull/2158)
**Last Updated:** 2025-12-18

---

## Summary

The Auto Alignment Tool is a wizard that automatically detects and sets FC board alignment and compass alignment through simple physical movements. The tool has been significantly updated, fixed, and improved from the original PR.

---

## Work Completed ✅

### Session 1: Rebase and Runtime Fixes
- ✅ Rebased PR #2158 onto maintenance-9.x (was 1028 commits behind)
- ✅ Fixed 12+ runtime errors:
  - ES module imports
  - Missing FC. prefix on global variables
  - Undeclared variables (acc_yaw, yaw_correction_needed, etc.)
  - Array wrapping bug (`[arr]` → `[...arr]`)
  - Deprecated THREE.js APIs
  - Typos (madAdjustment, roll_corection_needed)
  - Wrong method calls (premultiply on Euler vs Matrix4)

### Session 2: Mathematical Algorithm Implementation
- ✅ **Replaced incomplete lookup table with atan2 mathematical approach**
  - Old: Hardcoded table with only ~15 orientations
  - New: Mathematical formula handles ANY orientation
- ✅ **Fixed pitch/roll/yaw sign conventions**
  - Verified formulas match INAV coordinate system
  - Tested with hardware on 2 different FC boards
- ✅ **Created hardware test tool** (`tabs/alignment_test.py`)
  - Standalone MSP-based Python tool
  - Allows testing alignment detection without Configurator
- ✅ **Hardware verification completed:**
  - Tested 4 orientations (0°, 90°, 180°, 270°)
  - Tested on 2 different flight controllers
  - All detections accurate ✓

### Session 3: Compass Alignment Fix
- ✅ **Rewrote `accAutoAlignCompass()` with correct formula**
  - Old: Built matrices but ignored them, used simple arithmetic
  - New: Properly compensates for board alignment changes
  - Formula: `new_compass = old_compass - delta_board + correction`
- ✅ **Created comprehensive tests** (`tabs/test_compass_alignment.js`)
  - 25 synthetic test cases covering all scenarios
  - All tests pass ✓

### Session 4: Inverse Transformation Implementation
- ✅ **Discovered MSP_RAW_IMU limitation**
  - MSP_RAW_IMU returns TRANSFORMED data (not truly "raw") when board alignment is set
  - INAV applies rotation matrix R^T to sensor data
  - Wizard was failing when board had existing non-zero alignment
- ✅ **Developed and tested inverse transformation**
  - Created Python test script (`tabs/test_inverse_transform_multi.py`)
  - Tested 8 different orientations (0°, ±90°, 180°, 45°)
  - All tests passed with max error 0.0012g
  - Verified INAV's exact rotation matrix implementation
- ✅ **Implemented in Configurator**
  - Added `buildRotationMatrix()` matching INAV's maths.c
  - Added `applyRotation()` for inverse transformation
  - Added `calculateRawFromTransformed()` high-level function
  - Modified `accAutoAlignReadFlat()` to detect and handle existing alignment
  - Modified `accAutoAlignRead45()` to detect and handle existing alignment
- ✅ **Added gravity magnitude checks**
  - Both wizard steps now validate 0.85-1.15g range
  - Detailed error logging when magnitude out of range
  - Helps detect if board moved during readings
- ✅ **Code builds successfully**
  - All JavaScript compiles without errors
  - No runtime errors in modified code
- ✅ **Hardware tested upside-down detection**
  - Tested with board physically upside down (180° roll)
  - Verified with 4 different initial alignments:
    * No alignment (0,0,0) ✓
    * Yaw 90° ✓
    * Yaw 45° ✓
    * Roll 90° (wrong initial setting) ✓
  - All tests correctly detected upside-down orientation
  - Inverse transformation accurately computed same raw data regardless of initial settings

### Build Verification
- ✅ **Code builds successfully**
  - `npm run package` completes without errors
  - All TypeScript/JavaScript compiles correctly
  - No runtime errors in fixed code

---

## Algorithm Overview

### Step 1: Initialize
- User places aircraft flat, pointing roughly north
- Polls IMU data at 40ms intervals

### Step 2: Read Flat Position
- Reads accelerometer baseline
- Validates calibration (magnitude ~1.0g)
- Records magnetometer heading
- Calculates pitch/roll from accelerometer

### Step 3: Read 45° Nose-Up
- User tilts nose up ~45°
- Compares to flat reading
- **NEW:** Uses atan2 to mathematically calculate yaw from change pattern
- Auto-detects corner mounts (45°) vs standard mounts (90°)
- Sets board alignment values

### Step 4: Compass Alignment (if magnetometer present)
- User points aircraft east
- Compares heading change (should be 90°)
- Detects if compass upside-down (270° change indicates flip)
- **NEW:** Properly compensates for board alignment changes
- Calculates and applies compass corrections

---

## Technical Improvements

### Core Algorithm Changes

**Old `accComputeYaw()` - Lookup Table:**
```javascript
// Hardcoded table with ~15 entries
corrections: {
  'up': { 0: 0, 22: 22, 45: 45, 315: 315, 338: 338, ... }
  'down': { 0: 180, 45: 135, ... }
}
// Returns -1 for unknown orientations
```

**New `accComputeYaw()` - Mathematical:**
```javascript
function accComputeYaw(delta_pitch, delta_roll, upside_down) {
    // Calculate yaw from direction of change when aircraft pitched
    let yaw = Math.atan2(-delta_roll, delta_pitch) * 180 / Math.PI;

    // Auto-detect corner mounts
    let corner_mount = Math.abs(delta_pitch) > 15 && Math.abs(delta_roll) > 15
                    && Math.abs(delta_pitch) < 35 && Math.abs(delta_roll) < 35;

    // Snap to nearest 45° or 90°
    let snap = corner_mount ? 45 : 90;
    yaw = Math.round(yaw / snap) * snap;

    return yaw;
}
```

### Sign Convention Fixes

**Pitch formula** (removed erroneous negative):
```javascript
// OLD: pitch = atan2(-acc[0], sqrt(...))  // WRONG
// NEW: pitch = atan2(acc[0], sqrt(...))   // CORRECT
```

**Roll formula** (added negative for standard convention):
```javascript
// OLD: roll = atan2(acc[1], acc[2])   // WRONG
// NEW: roll = atan2(-acc[1], acc[2])  // CORRECT
```

**Yaw formula** (negated delta_roll):
```javascript
// OLD: yaw = atan2(delta_roll, delta_pitch)   // WRONG
// NEW: yaw = atan2(-delta_roll, delta_pitch)  // CORRECT
```

### Compass Alignment Fix

**Old approach:**
- Built matrices but ignored them
- Used simple addition/subtraction
- Didn't compensate for board alignment changes

**New approach:**
```javascript
// Compass alignment is RELATIVE TO BOARD
// When board alignment changes, compass must compensate
let newCompassPitch = old_compass_pitch - delta_board_pitch;
let newCompassRoll = old_compass_roll - delta_board_roll + compass_roll_correction;
let newCompassYaw = old_compass_yaw - delta_board_yaw + compass_yaw_correction;
```

### Inverse Transformation Functions

**Problem:** MSP_RAW_IMU returns transformed data when board alignment is non-zero.

**Solution:** Reverse the transformation to get true raw sensor readings.

```javascript
// Build INAV's rotation matrix (matches firmware maths.c exactly)
function buildRotationMatrix(roll_deg, pitch_deg, yaw_deg) {
    // Convert to radians and compute trig values
    const roll = roll_deg * Math.PI / 180;
    const pitch = pitch_deg * Math.PI / 180;
    const yaw = yaw_deg * Math.PI / 180;

    // ... (exact INAV matrix implementation)

    return [
        [cosz * cosy,                      -cosy * sinz,                      siny                    ],
        [sinzcosx + (coszsinx * siny),     coszcosx - (sinzsinx * siny),      -sinx * cosy            ],
        [(sinzsinx) - (coszcosx * siny),   (coszsinx) + (sinzcosx * siny),    cosy * cosx             ]
    ];
}

// Apply rotation matrix (INAV uses R^T, so inverse is R)
function applyRotation(R, vec) {
    return [
        R[0][0]*vec[0] + R[0][1]*vec[1] + R[0][2]*vec[2],
        R[1][0]*vec[0] + R[1][1]*vec[1] + R[1][2]*vec[2],
        R[2][0]*vec[0] + R[2][1]*vec[1] + R[2][2]*vec[2]
    ];
}

// High-level function to get raw data
function calculateRawFromTransformed(transformed, board_pitch, board_roll, board_yaw) {
    const R = buildRotationMatrix(board_roll, board_pitch, board_yaw);
    return applyRotation(R, transformed);
}
```

**Usage in wizard:**
```javascript
function accAutoAlignReadFlat() {
    let acc_g_transformed = [...FC.SENSOR_DATA.accelerometer];

    // Check if board has existing alignment
    const hasAlignment = self.boardAlignmentConfig.pitch !== 0 ||
                       self.boardAlignmentConfig.roll !== 0 ||
                       self.boardAlignmentConfig.yaw !== 0;

    let acc_g_flat;
    if (hasAlignment) {
        // Apply inverse transformation
        acc_g_flat = calculateRawFromTransformed(
            acc_g_transformed,
            self.boardAlignmentConfig.pitch,
            self.boardAlignmentConfig.roll,
            self.boardAlignmentConfig.yaw
        );
    } else {
        // No alignment - data is already raw
        acc_g_flat = acc_g_transformed;
    }

    // Check gravity magnitude
    let A = Math.sqrt(acc_g_flat[0]**2 + acc_g_flat[1]**2 + acc_g_flat[2]**2);
    if (A > 1.15 || A < 0.85) {
        // Show error - board may have moved
        return;
    }

    // Calculate pitch/roll from raw data...
}
```

**Benefits:**
- Wizard works correctly regardless of existing board alignment
- No need to manually reset to 0,0,0 before running wizard
- No reboot required before running wizard
- Better UX - one less step for users

---

## Testing Status

| Component | Synthetic Tests | Hardware Tests | Status |
|-----------|----------------|----------------|--------|
| Build/Compile | N/A | N/A | ✅ PASS |
| Board pitch/roll | N/A | ✅ Verified | ✅ READY |
| Board yaw (0°, 90°, 180°, 270°) | N/A | ✅ Verified | ✅ READY |
| Inverse transformation | ✅ 8 orientations | ✅ Verified | ✅ READY |
| Upside-down detection (180° roll) | ✅ 4 alignments | ✅ Verified | ✅ READY |
| Compass alignment math | ✅ 25 tests pass | ⏳ Needs testing | 🟡 NEEDS HW TEST |
| 45° corner mount detection | N/A | ⏳ Needs testing | 🟡 NEEDS HW TEST |
| UI/UX polish | N/A | ⏳ Needs review | 🟡 NEEDS REVIEW |

---

## Remaining Work

### Required for Merge:
1. ⏳ **Hardware test compass alignment** (primary remaining task)
2. ⏳ **Test 45° corner mount** on real hardware
3. ⏳ **Test upside-down mounting** on real hardware
4. ⏳ **UI/UX review and polish**
   - Instructions clarity
   - Error messages
   - User guidance
5. ⏳ **Update PR #2158**
   - Push updated branch
   - Update description with changes made
   - Document testing results
6. ⏳ **Request review from maintainers**
   - Remove "Don't merge" label when ready
   - Address any review feedback

### Nice-to-Have:
- Add video demo of updated tool
- Create user documentation/guide
- ~~Consider adding "reset alignment to 0,0,0" option before wizard~~ **✅ DONE** - Implemented inverse transformation instead (better UX)

---

## Files Modified

**Main implementation:**
- `tabs/magnetometer.js` - Core wizard logic
  - `buildRotationMatrix()` - INAV rotation matrix (Session 4)
  - `applyRotation()` - Matrix multiplication for inverse (Session 4)
  - `calculateRawFromTransformed()` - Inverse transformation (Session 4)
  - `accComputeYaw()` - Mathematical yaw detection
  - `accAutoAlignReadFlat()` - Flat position reading (updated Session 4)
  - `accAutoAlignRead45()` - Tilted position reading (updated Session 4)
  - `accAutoAlignCompass()` - Compass alignment calculation

**UI (unchanged from original PR):**
- `tabs/magnetometer.html` - Wizard modal UI
- `locale/en/messages.json` - i18n strings
- `images/acc-align-60.png` - Nose-up diagram

**Testing tools (new):**
- `tabs/alignment_test.py` - Python MSP-based test tool (Session 2)
- `tabs/test_compass_alignment.js` - Node.js synthetic tests (Session 3)
- `tabs/alignment_hardware_test.js` - Hardware test helpers (Session 2)
- `tabs/test_inverse_transform_multi.py` - Inverse transformation test (Session 4)
- `tabs/test_inverse_transform_auto.py` - Auto-reboot test tool (Session 4)
- `tabs/test_upside_down.py` - Single upside-down test (Session 4)
- `tabs/test_upside_down_multi_alignment.py` - Multi-alignment upside-down test (Session 4)

**Documentation (new):**
- `tabs/AUTO_ALIGNMENT_ANALYSIS.md` - Code analysis (Session 1)
- `tabs/ALIGNMENT_MATH_ANALYSIS.md` - Mathematical derivation (Session 2)
- `tabs/INVERSE_TRANSFORM_FINDINGS.md` - Inverse transformation findings (Session 4)
- `AUTO_ALIGNMENT_STATUS.md` - This file (updated Session 4)

---

## Branch Information

**Current branch:** `auto_alignment_tool_rebase_v2`
**Base:** maintenance-9.x (rebased from original PR)
**Commits:** 10+ fixes and improvements
**Build status:** ✅ Builds successfully

**To update PR:**
```bash
git checkout auto_alignment_tool_rebase_v2
git push origin auto_alignment_tool_rebase_v2:auto_alignment_tool --force
```

---

## Next Steps

### Immediate (Developer):
1. Test compass alignment with FC hardware that has magnetometer
2. Test 45° corner mount detection
3. Test upside-down mount detection
4. Review UI/UX for clarity and polish

### Then (Developer):
5. Update original PR branch with rebased changes
6. Update PR description with all improvements
7. Document testing results in PR

### Finally (Manager):
8. Request review from INAV Configurator maintainers
9. Remove "Don't merge" label
10. Address any review feedback
11. Merge when approved

---

## Technical References

**INAV Coordinate System:**
- X = Forward (nose)
- Y = Right (starboard wing)
- Z = Down

**Euler Angle Convention:**
- ZYX rotation order (yaw → pitch → roll)
- Positive yaw = clockwise (looking down)
- Positive pitch = nose up
- Positive roll = right wing down

**Accelerometer:**
- Measures opposite of gravity (reaction force)
- Flat and level: [0, 0, 1]
- Nose up 45°: [0.707, 0, 0.707]

---

## Known Limitations

1. **Requires calibrated accelerometer** - If accelerometer isn't calibrated, magnitude check will fail
2. **Assumes clean sensor readings** - Heavy vibration or movement during reading may cause errors
3. **45° detection heuristic** - Corner mount detection uses threshold (15-35°); may need tuning
4. **Compass requires known north** - User must roughly point north initially

---

## Contributors

- **Original PR Author:** jsarrett
- **Rebase & Fixes:** Claude Sonnet 4.5 (Sessions Dec 9-12, 2025)
- **Testing:** Hardware verification on 2 FC boards
