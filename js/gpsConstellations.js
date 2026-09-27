'use strict';

// What a u-blox receiver reports about itself, passed on at the end of MSP_GPSSTATISTICS.
// MON-GNSS carries the four major constellations; SBAS, QZSS and NavIC come from MON-VER

// In the tab's order, not the bit order
const GNSS_CONSTELLATIONS = [
    { key: 'gps',     bit: 0x01, name: 'GPS',     short: 'GPS', row: '#gps_have_gps' },
    { key: 'galileo', bit: 0x08, name: 'Galileo', short: 'GAL', box: '#gps_use_galileo' },
    { key: 'beidou',  bit: 0x04, name: 'BeiDou',  short: 'BDS', box: '#gps_use_beidou' },
    { key: 'glonass', bit: 0x02, name: 'GLONASS', short: 'GLO', box: '#gps_use_glonass' }
];

const GNSS_EXTENDED = [
    // A service choice, not a switch: its control is the tab's existing one
    { key: 'sbas',  bit: 0x01, name: 'SBAS',  row: '#gps_ubx_sbas' },
    { key: 'qzss',  bit: 0x02, name: 'QZSS',  row: '#gps_have_qzss' },
    // Offered only once the receiver names NavIC: the firmware sends its keys to no other
    { key: 'navic', bit: 0x04, name: 'NavIC', box: '#gps_use_navic' }
];

// An empty mask means the firmware could not tell (older build, not u-blox, no answer), not
// a receiver without constellations: nothing is hidden then
function gnssMasksKnown(mask) {
    return (mask & 0xFF) !== 0;
}

// The short forms are the receiver's own in MON-VER (GPS;GAL;BDS)
function gnssNames(mask, short) {
    return GNSS_CONSTELLATIONS.filter(c => (mask & c.bit) !== 0).map(c => short ? c.short : c.name);
}

// Withdrawn only when the receiver is known not to have it: a guess could hide one it has
function gnssIsOffered(supported, constellation) {
    return !gnssMasksKnown(supported) || (supported & constellation.bit) !== 0;
}

// What the firmware leaves out when the selection exceeds what the receiver tracks at once:
// GLONASS, then BeiDou, then Galileo, as ubloxGnssToEnable() in gps_ublox.c
const GNSS_LEAVE_OUT_FIRST = ['glonass', 'beidou', 'galileo'];

function gnssLeftOut(selected, supported, maxConcurrent) {
    if (!gnssMasksKnown(supported) || !maxConcurrent) {
        return [];
    }

    const count = mask => GNSS_CONSTELLATIONS.filter(c => (mask & c.bit) !== 0).length;
    let mask = (selected | 0x01) & supported;
    const leftOut = [];

    for (const key of GNSS_LEAVE_OUT_FIRST) {
        if (count(mask) <= maxConcurrent) {
            break;
        }
        const c = GNSS_CONSTELLATIONS.find(c => c.key === key);
        if (mask & c.bit) {
            mask &= ~c.bit;
            leftOut.push(c);
        }
    }

    return leftOut;
}

// The other way round: an indicator is shown only when the receiver is known to have it
function gnssIsConfirmed(mask, constellation) {
    return (mask & constellation.bit) !== 0;
}

export {
    GNSS_CONSTELLATIONS,
    GNSS_EXTENDED,
    gnssMasksKnown,
    gnssNames,
    gnssIsOffered,
    gnssIsConfirmed,
    gnssLeftOut
};
