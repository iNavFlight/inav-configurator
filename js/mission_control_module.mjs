'use strict';

// MultiWii NAV Protocol
exports.MWNP = MWNP || {};

// WayPoint type
MWNP.WPTYPE = {
    WAYPOINT:     1,
    PH_UNLIM:     2,
    PH_TIME:      3,
    RTH:          4,
    SET_POI:      5,
    JUMP:         6,
    SET_HEAD:     7,
    LAND:         8
};

// Reverse WayPoint type dictionary
function swap(dict) {
    let rev_dict = {};
    for (let key in dict) {
        rev_dict[dict[key]] = key;
    }
    return rev_dict;
}

MWNP.WPTYPE.REV = swap(MWNP.WPTYPE);

// Dictionary of Parameter1,2,3 definition depending on type of action selected (refer to MWNP.WPTYPE)
exports.dictOfLabelParameterPoint = {
    1:    {parameter1: 'Speed (cm/s)', parameter2: '', parameter3: ''},
    2:    {parameter1: '', parameter2: '', parameter3: ''},
    3:    {parameter1: 'Wait time (s)', parameter2: 'Speed (cm/s)', parameter3: ''},
    4:    {parameter1: 'Force land (non zero)', parameter2: '', parameter3: ''},
    5:    {parameter1: '', parameter2: '', parameter3: ''},
    6:    {parameter1: 'Target WP number', parameter2: 'Number of repeat (-1: infinite)', parameter3: ''},
    7:    {parameter1: 'Heading (deg)', parameter2: '', parameter3: ''},
    8:    {parameter1: '', parameter2: '', parameter3: ''}
};

