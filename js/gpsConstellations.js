'use strict';

/*
 * The UBX-MON-GNSS constellation masks, which INAV polls from the receiver and
 * passes through at the end of MSP_GPSSTATISTICS. The bit order is u-blox's own.
 */
const GNSS_CONSTELLATIONS = [
    { key: 'gps',     bit: 0x01, name: 'GPS',     short: 'GPS' },
    { key: 'galileo', bit: 0x08, name: 'Galileo', short: 'GAL', box: '#gps_use_galileo' },
    { key: 'beidou',  bit: 0x04, name: 'BeiDou',  short: 'BDS', box: '#gps_use_beidou' },
    { key: 'glonass', bit: 0x02, name: 'GLONASS', short: 'GLO', box: '#gps_use_glonass' }
];

/*
 * An empty mask is what the firmware reports when it could not read the
 * capabilities: an older build, a receiver that is not u-blox, or one that never
 * answered. That is not the same as a receiver with no constellations, so
 * nothing is known and nothing gets hidden.
 */
function gnssMasksKnown(mask) {
    return (mask & 0xFF) !== 0;
}

/* The short forms are the ones the receiver itself uses in the MON-VER extensions,
 * where the list reads GPS;GAL;BDS. */
function gnssNames(mask, short) {
    return GNSS_CONSTELLATIONS.filter(c => (mask & c.bit) !== 0).map(c => short ? c.short : c.name);
}

function gnssIsOffered(supported, constellation) {
    return !gnssMasksKnown(supported) || (supported & constellation.bit) !== 0;
}

export { GNSS_CONSTELLATIONS, gnssMasksKnown, gnssNames, gnssIsOffered };
