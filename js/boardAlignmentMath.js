'use strict';

// Pure math helpers backing the magnetometer tab's board/compass auto-align wizard
// (tabs/magnetometer.js). No self/DOM/FC/THREE dependencies -- kept import-free and
// side-effect-free so this is unit-testable in plain Node (see tests/board-alignment-math.test.mjs).

export function rad2degrees(radians) {
    return ((Math.round(radians * (180 / Math.PI)) % 360) + 360) % 360;
}

// Snap to the nearest 45-degree mount candidate, normalized to [0, 360).
export function snap45(deg) {
    return ((Math.round(deg / 45) * 45) % 360 + 360) % 360;
}

/**
 * Compass-mount yaw/flip solver for the wizard's "north" + "east" heading readings.
 * heading_flat/heading_east are unaligned compass headings (see getMagHeading() in
 * tabs/magnetometer.js) captured with the aircraft facing real north, then real east.
 *
 * Flip (right-side-up vs upside-down) comes from the DIRECTION of the heading change on
 * a known ~90 degree turn: flipping the compass mirrors the sense of rotation in the
 * horizontal plane, so a real +90 degree turn reads as roughly +90 if right-side-up, or
 * roughly -90 (i.e. +270) if upside-down. A north/east DELTA can only ever reveal this
 * sign -- it cannot reveal the mounting YAW offset itself, because rotating the aircraft
 * rotates the sensor and the field it senses together, so any fixed mounting offset
 * cancels out of a delta identically.
 *
 * The mounting yaw offset IS observable from heading_flat alone, but only because the
 * wizard instructs the user to face real (magnetic) north at that step -- an actual known
 * absolute bearing, not an arbitrary self-chosen reference. heading_east gives a second,
 * independent estimate of the same value (projected back through the known ~90 degree
 * turn), which should agree; if it doesn't, the user likely didn't actually face north, or
 * didn't turn a clean ~90 degrees (see the returned yawDiff).
 *
 * Derived directly from inav2's rotationMatrixFromAngles/rotationMatrixRotateVector
 * (common/maths.c, common/vector.h) and validated on hardware 2026-09-13/14:
 * - applying align_mag_yaw=Y rotates the horizontal heading by -Y (subtracts, does not
 *   add) -- so for an unflipped mount, matching heading_flat/heading_east requires
 *   yaw = +heading_flat = +(heading_east - 90), not their negation.
 * - applying pitch=180 (the flip encoding) maps atan2(y,x) -> 180 - atan2(y,x), an extra
 *   180-degree term that couples into the required yaw: flipped mounts need
 *   yaw = 180 - heading_flat = 90 - heading_east, not heading_flat/heading_east directly.
 *
 * @param {number} heading_flat - unaligned heading facing north
 * @param {number} heading_east - unaligned heading facing east
 * @returns {{change: number, flipped: boolean, yawFromNorth: number, yawFromEast: number, yawDiff: number}}
 */
export function computeCompassYaw(heading_flat, heading_east) {
    const change = ((heading_east - heading_flat) % 360 + 360) % 360;
    const flipped = change > 180;

    const yawFromNorth = snap45(flipped ? (180 - heading_flat) : heading_flat);
    const yawFromEast = snap45(flipped ? (90 - heading_east) : (heading_east - 90));

    let yawDiff = Math.abs(yawFromNorth - yawFromEast);
    yawDiff = Math.min(yawDiff, 360 - yawDiff);

    return { change, flipped, yawFromNorth, yawFromEast, yawDiff };
}

/**
 * Build rotation matrix matching INAV's rotationMatrixFromAngles()
 * Source: inav/src/main/common/maths.c
 *
 * INAV uses ZYX rotation order (yaw -> pitch -> roll)
 * This matrix is used to transform sensor data based on board alignment
 *
 * @param {number} roll_deg - Roll angle in degrees
 * @param {number} pitch_deg - Pitch angle in degrees
 * @param {number} yaw_deg - Yaw angle in degrees
 * @returns {Array<Array<number>>} 3x3 rotation matrix
 */
export function buildRotationMatrix(roll_deg, pitch_deg, yaw_deg) {
    const roll = roll_deg * Math.PI / 180;
    const pitch = pitch_deg * Math.PI / 180;
    const yaw = yaw_deg * Math.PI / 180;

    const cosx = Math.cos(roll);
    const sinx = Math.sin(roll);
    const cosy = Math.cos(pitch);
    const siny = Math.sin(pitch);
    const cosz = Math.cos(yaw);
    const sinz = Math.sin(yaw);

    const coszcosx = cosz * cosx;
    const sinzcosx = sinz * cosx;
    const coszsinx = sinx * cosz;
    const sinzsinx = sinx * sinz;

    // INAV's rotation matrix (matches firmware exactly)
    // This is the matrix R used in the transformation: transformed = R^T * raw
    return [
        [cosz * cosy,                      -cosy * sinz,                      siny                    ],
        [sinzcosx + (coszsinx * siny),     coszcosx - (sinzsinx * siny),      -sinx * cosy            ],
        [(sinzsinx) - (coszcosx * siny),   (coszsinx) + (sinzcosx * siny),    cosy * cosx             ]
    ];
}

/**
 * Apply rotation matrix to a vector using standard matrix multiplication
 *
 * IMPORTANT: INAV's rotationMatrixRotateVector uses R^T (columns): transformed = R^T * raw
 * To invert this transformation: raw = R * transformed (apply R, NOT R^T)
 *
 * @param {Array<Array<number>>} R - 3x3 rotation matrix
 * @param {Array<number>} vec - 3D vector [x, y, z]
 * @returns {Array<number>} Rotated vector [x', y', z']
 */
export function applyRotation(R, vec) {
    return [
        R[0][0]*vec[0] + R[0][1]*vec[1] + R[0][2]*vec[2],  // Standard: use rows
        R[1][0]*vec[0] + R[1][1]*vec[1] + R[1][2]*vec[2],
        R[2][0]*vec[0] + R[2][1]*vec[1] + R[2][2]*vec[2]
    ];
}

/**
 * Calculate raw sensor data from MSP_RAW_IMU reading
 *
 * MSP_RAW_IMU is misnamed - it returns TRANSFORMED data (after board alignment)
 * when board alignment is non-zero. This function reverses the transformation
 * to get the actual raw sensor readings.
 *
 * @param {Array<number>} transformed - Accelerometer data from MSP_RAW_IMU [x, y, z] in g's
 * @param {number} board_pitch - Current board alignment pitch in degrees
 * @param {number} board_roll - Current board alignment roll in degrees
 * @param {number} board_yaw - Current board alignment yaw in degrees
 * @returns {Array<number>} Raw sensor data [x, y, z] in g's
 */
export function calculateRawFromTransformed(transformed, board_pitch, board_roll, board_yaw) {
    // Build the rotation matrix used by INAV
    const R = buildRotationMatrix(board_roll, board_pitch, board_yaw);

    // INAV applies R^T to get transformed data: transformed = R^T * raw
    // To invert: raw = R * transformed (apply R without transpose)
    return applyRotation(R, transformed);
}

export function vecCross(a, b) {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}

export function vecNormalize(v) {
    const mag = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / mag, v[1] / mag, v[2] / mag];
}

export function vecSquaredDistance(a, b) {
    return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

// The 16 mounts BOARD_ALIGNMENT's wizard supports: 8 right-side-up and
// 8 upside-down (roll 0 or 180, pitch always 0), yaw in 45-degree steps.
// Matches the firmware's own candidate table in compass_orientation.c.
export const BOARD_ALIGNMENT_CANDIDATES = [0, 180].flatMap((roll) =>
    [0, 45, 90, 135, 180, 225, 270, 315].map((yaw) => ({ roll, pitch: 0, yaw }))
);

/**
 * Find the BOARD_ALIGNMENT (roll, pitch, yaw) that best explains two
 * measured raw-sensor-frame vectors (rawFlat, rawTilt), given the known
 * aircraft-frame vectors they correspond to (refFlat, refTilt).
 *
 * This can't be done from a single vector (the flat reading alone):
 * a pure roll-180 mount and a pure pitch-180 mount both read as ~(0,0,-1)
 * when level, since gravity doesn't constrain rotation about itself. The
 * second, tilted reading breaks that symmetry.
 *
 * Rather than extract Euler angles from a rotation matrix (which is
 * ambiguous right where this wizard needs precision: asin(sin(180°)) and
 * asin(sin(0°)) are both 0, so a naive extraction silently confuses
 * pitch=180 with pitch=0+180 of roll/yaw), this does a direct search over
 * BOARD_ALIGNMENT_CANDIDATES and picks whichever one best predicts both
 * measured vectors. Verified by round-tripping known mounts through
 * buildRotationMatrix with zero error.
 */
export function findBestBoardAlignment(refFlat, refTilt, rawFlat, rawTilt) {
    const nFlat = vecNormalize(rawFlat);
    const nTilt = vecNormalize(rawTilt);

    let best = null;
    for (const { roll, pitch, yaw } of BOARD_ALIGNMENT_CANDIDATES) {
        const R = buildRotationMatrix(roll, pitch, yaw);
        const predFlat = applyRotation(R, refFlat);
        const predTilt = applyRotation(R, refTilt);
        const err = vecSquaredDistance(predFlat, nFlat) + vecSquaredDistance(predTilt, nTilt);
        if (!best || err < best.err) {
            best = { roll, pitch, yaw, err };
        }
    }
    return best;
}
