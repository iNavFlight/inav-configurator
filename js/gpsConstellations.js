'use strict';

/*
 * What a u-blox receiver says about itself. INAV asks it before configuring it
 * and passes the answer through at the end of MSP_GPSSTATISTICS.
 *
 * The two masks come from two different places. UBX-MON-GNSS carries the four
 * major constellations; the augmentation and regional systems are not in it at
 * all, so those are read from the MON-VER version strings instead.
 */

/* Listed in the order the tab shows them, which is not the bit order */
const GNSS_CONSTELLATIONS = [
    { key: 'gps',     bit: 0x01, name: 'GPS',     short: 'GPS', row: '#gps_have_gps' },
    { key: 'galileo', bit: 0x08, name: 'Galileo', short: 'GAL', box: '#gps_use_galileo' },
    { key: 'beidou',  bit: 0x04, name: 'BeiDou',  short: 'BDS', box: '#gps_use_beidou' },
    { key: 'glonass', bit: 0x02, name: 'GLONASS', short: 'GLO', box: '#gps_use_glonass' }
];

const GNSS_EXTENDED = [
    // SBAS is a choice rather than a switch, because the receiver has to be told
    // which service to listen to, so its control is the one the tab already has
    { key: 'sbas',  bit: 0x01, name: 'SBAS',  row: '#gps_ubx_sbas' },
    { key: 'qzss',  bit: 0x02, name: 'QZSS',  row: '#gps_have_qzss' },
    // A real switch, but it is only offered once the receiver has named NavIC:
    // hardly any receiver has it, and the firmware sends its keys to no other
    { key: 'navic', bit: 0x04, name: 'NavIC', box: '#gps_use_navic' }
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

/*
 * A setting is withdrawn only when the receiver is known not to have it. Hiding
 * a switch on a guess would leave someone unable to turn on a constellation they
 * do have.
 */
function gnssIsOffered(supported, constellation) {
    return !gnssMasksKnown(supported) || (supported & constellation.bit) !== 0;
}

/*
 * An indicator is the other way round: it is shown only when the receiver is
 * known to have the thing. There is nothing to lose by leaving out a line that
 * only reports, and a NavIC row on a receiver that has never heard of NavIC
 * would be worse than no row at all.
 */
function gnssIsConfirmed(mask, constellation) {
    return (mask & constellation.bit) !== 0;
}

export {
    GNSS_CONSTELLATIONS,
    GNSS_EXTENDED,
    gnssMasksKnown,
    gnssNames,
    gnssIsOffered,
    gnssIsConfirmed
};
