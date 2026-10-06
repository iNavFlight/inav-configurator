'use strict';

// MSP_GPS_SV_INFO in Betaflight's layout: a count, then per satellite the u-blox GNSS id,
// the satellite id, the quality indicator with "used in the fix" in bit 3, and C/N0

const GNSS_NAMES = ['GPS', 'SBAS', 'Galileo', 'BeiDou', 'IMES', 'QZSS', 'GLONASS', 'NavIC'];

// u-blox quality indicator 0-7; 5 to 7 are all code and carrier locked
const QUALITY_KEYS = [
    'gnssQualityNoSignal',
    'gnssQualitySearching',
    'gnssQualityAcquired',
    'gnssQualityUnusable',
    'gnssQualityLocked',
    'gnssQualityFullyLocked',
    'gnssQualityFullyLocked',
    'gnssQualityFullyLocked'
];

// The bar's full scale: u-blox reports C/N0 up to about 55 dB-Hz
const CNO_FULL_SCALE = 55;

function decodeSatellites(data) {
    const satellites = [];
    if (data.byteLength < 1) {
        return satellites;
    }
    const count = data.getUint8(0);
    const byId = new Map();
    for (let i = 0; i < count && 1 + (i + 1) * 4 <= data.byteLength; i++) {
        const offset = 1 + i * 4;
        const svId = data.getUint8(offset + 1);
        // Satellite id 0: the stub older firmware answers with (one channel holding the HDOP), or padding
        if (svId === 0) {
            continue;
        }
        const quality = data.getUint8(offset + 2);
        const satellite = {
            gnssId: data.getUint8(offset),
            svId: svId,
            quality: quality & 0x07,
            used: (quality & 0x08) !== 0,
            cno: data.getUint8(offset + 3)
        };
        // The firmware lists signals: a satellite tracked on two bands shows once, with its stronger one
        const key = satellite.gnssId * 256 + svId;
        const seen = byId.get(key);
        if (!seen) {
            byId.set(key, satellite);
            satellites.push(satellite);
            continue;
        }
        if (satellite.cno > seen.cno) {
            seen.quality = satellite.quality;
            seen.cno = satellite.cno;
        }
        seen.used = seen.used || satellite.used;
    }
    return satellites;
}

function gnssName(gnssId) {
    return GNSS_NAMES[gnssId] ?? String(gnssId);
}

function qualityKey(quality) {
    return QUALITY_KEYS[quality & 0x07];
}

// Colour classes as Betaflight uses them: locked, code only, and the rest
function qualityLevel(quality) {
    if (quality >= 5) {
        return 'locked';
    }
    if (quality === 4) {
        return 'code';
    }
    return 'weak';
}

export { CNO_FULL_SCALE, decodeSatellites, gnssName, qualityKey, qualityLevel };
