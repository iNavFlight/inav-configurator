#!/usr/bin/env node
/**
 * MSP_GPS_SV_INFO in Betaflight's layout: a count, then per satellite GNSS id, satellite id,
 * quality with "used in the fix" in bit 3, and C/N0. Older INAV firmware answers with a stub.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodeSatellites, gnssName, qualityKey, qualityLevel } from '../js/gpsSatellites.js';

function reply(bytes) {
    return new DataView(Uint8Array.from(bytes).buffer);
}

test('decodes each satellite, with the used bit apart from the quality', () => {
    const sats = decodeSatellites(reply([2,
        0, 7, 0x07 | 0x08, 42,
        2, 11, 0x04, 30]));
    assert.deepEqual(sats, [
        { gnssId: 0, svId: 7, quality: 7, used: true, cno: 42 },
        { gnssId: 2, svId: 11, quality: 4, used: false, cno: 30 }
    ]);
});

test('an older firmware stub gives no satellites', () => {
    // One channel with satellite id 0, the HDOP in the quality and C/N0 bytes
    assert.deepEqual(decodeSatellites(reply([1, 0, 0, 1, 1])), []);
});

test('an empty or truncated reply decodes what is complete', () => {
    assert.deepEqual(decodeSatellites(reply([])), []);
    assert.deepEqual(decodeSatellites(reply([0])), []);
    assert.deepEqual(decodeSatellites(reply([2, 3, 19, 0x0E, 35, 6])), [
        { gnssId: 3, svId: 19, quality: 6, used: true, cno: 35 }
    ]);
});

test('a satellite tracked on two signals is listed once, with the stronger one', () => {
    const sats = decodeSatellites(reply([4,
        0, 7, 0x07, 44,
        3, 19, 0x04 | 0x08, 30,
        0, 7, 0x05 | 0x08, 38,
        3, 19, 0x06, 35]));
    assert.deepEqual(sats, [
        { gnssId: 0, svId: 7, quality: 7, used: true, cno: 44 },
        { gnssId: 3, svId: 19, quality: 6, used: true, cno: 35 }
    ]);
});

test('padding entries are skipped', () => {
    assert.deepEqual(decodeSatellites(reply([3, 2, 11, 0x0F, 40, 255, 0, 0, 0, 255, 0, 0, 0])), [
        { gnssId: 2, svId: 11, quality: 7, used: true, cno: 40 }
    ]);
});

test('names the u-blox GNSS ids', () => {
    assert.equal(gnssName(0), 'GPS');
    assert.equal(gnssName(2), 'Galileo');
    assert.equal(gnssName(3), 'BeiDou');
    assert.equal(gnssName(6), 'GLONASS');
    assert.equal(gnssName(7), 'NavIC');
    assert.equal(gnssName(9), '9');
});

test('quality labels and colour levels follow Betaflight', () => {
    assert.equal(qualityKey(0), 'gnssQualityNoSignal');
    assert.equal(qualityKey(4), 'gnssQualityLocked');
    assert.equal(qualityKey(7), 'gnssQualityFullyLocked');
    assert.equal(qualityLevel(7), 'locked');
    assert.equal(qualityLevel(5), 'locked');
    assert.equal(qualityLevel(4), 'code');
    assert.equal(qualityLevel(3), 'weak');
    assert.equal(qualityLevel(0), 'weak');
});
