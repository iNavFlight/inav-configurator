'use strict'

// MultiWii NAV Protocol
const MWNP = {};

MWNP.WPTYPE = {
    WAYPOINT:           1,
    POSHOLD_UNLIM:      2,
    POSHOLD_TIME:       3,
    RTH:                4,
    SET_POI:            5,
    JUMP:               6,
    SET_HEAD:           7,
    LAND:               8
};

MWNP.P3 = {
    ALT_TYPE:       0,  // Altitude (alt) : Relative (to home altitude) (0) or Absolute (AMSL) (1).
    USER_ACTION_1:  1,  // WP Action 1
    USER_ACTION_2:  2,  // WP Action 2
    USER_ACTION_3:  3,  // WP Action 3
    USER_ACTION_4:  4,  // WP Action 4
}

MWNP.WPTYPE.REV = swap(MWNP.WPTYPE);

// Reverse WayPoint type dictionary
function swap(dict) {
    let rev_dict = {};
    for (let key in dict) {
        rev_dict[dict[key]] = key;
    }
    return rev_dict;
}

module.exports = MWNP;