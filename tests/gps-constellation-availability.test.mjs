#!/usr/bin/env node
/**
 * Rules the GPS tab applies to the receiver's two masks: the four majors from UBX-MON-GNSS,
 * SBAS, QZSS and NavIC from MON-VER. A switch is withdrawn only when the receiver is known
 * not to have it; a reporting row is shown only once confirmed. An empty mask means unknown.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    GNSS_CONSTELLATIONS,
    GNSS_EXTENDED,
    gnssMasksKnown,
    gnssNames,
    gnssIsOffered,
    gnssIsConfirmed,
    gnssLeftOut
} from '../js/gpsConstellations.js';

// The masks a real receiver reports, measured against an emulated u-blox in SITL
const M10 = 0x0F;       // GPS, GLONASS, BeiDou, Galileo
const F10 = 0x0D;       // GPS, BeiDou, Galileo, and no GLONASS
const UNKNOWN = 0x00;

// The same, for the mask INAV builds from the MON-VER extension lines
const EXT_M10 = 0x03;   // SBAS;QZSS
const EXT_F10 = 0x07;   // SBAS;QZSS and NAVIC

function major(key) {
    return GNSS_CONSTELLATIONS.find(c => c.key === key);
}

function extra(key) {
    return GNSS_EXTENDED.find(e => e.key === key);
}

test('an empty mask means unknown, so every switch stays on offer', () => {
    for (const c of GNSS_CONSTELLATIONS) {
        assert.equal(gnssIsOffered(UNKNOWN, c), true, `${c.name} should still be offered`);
    }
    assert.equal(gnssIsOffered(UNKNOWN, extra('sbas')), true);
    assert.equal(gnssMasksKnown(UNKNOWN), false);
});

test('an empty mask shows no row that only reports', () => {
    assert.equal(gnssIsConfirmed(UNKNOWN, major('gps')), false);
    assert.equal(gnssIsConfirmed(UNKNOWN, extra('qzss')), false);
    assert.equal(gnssIsConfirmed(UNKNOWN, extra('navic')), false);
});

test('an F10 keeps Galileo and BeiDou and loses GLONASS', () => {
    assert.equal(gnssIsOffered(F10, major('galileo')), true);
    assert.equal(gnssIsOffered(F10, major('beidou')), true);
    assert.equal(gnssIsOffered(F10, major('glonass')), false);
    assert.equal(gnssMasksKnown(F10), true);
});

test('an M10 keeps all three', () => {
    assert.equal(gnssIsOffered(M10, major('galileo')), true);
    assert.equal(gnssIsOffered(M10, major('beidou')), true);
    assert.equal(gnssIsOffered(M10, major('glonass')), true);
});

test('NavIC is shown on the receiver that has it and nowhere else', () => {
    assert.equal(gnssIsConfirmed(EXT_F10, extra('navic')), true);
    assert.equal(gnssIsConfirmed(EXT_M10, extra('navic')), false);
});

test('NavIC is a switch, but one that waits for the receiver to name it', () => {
    // The firmware only sends NavIC keys to receivers that list it
    assert.equal(extra('navic').box, '#gps_use_navic');
    assert.equal(gnssIsConfirmed(UNKNOWN, extra('navic')), false);
    assert.equal(gnssIsConfirmed(EXT_M10, extra('navic')), false);
    assert.equal(gnssIsConfirmed(EXT_F10, extra('navic')), true);
});

test('QZSS and SBAS are on both receivers', () => {
    for (const mask of [EXT_M10, EXT_F10]) {
        assert.equal(gnssIsConfirmed(mask, extra('qzss')), true);
        assert.equal(gnssIsOffered(mask, extra('sbas')), true);
    }
});

test('a receiver without SBAS is not asked which SBAS service to use', () => {
    // Nothing u-blox ships looks like this, but the mask is the receiver's word
    const noSbas = 0x02;    // QZSS only
    assert.equal(gnssIsOffered(noSbas, extra('sbas')), false);
});

test('the names come out in the order the tab lists them', () => {
    assert.deepEqual(gnssNames(M10), ['GPS', 'Galileo', 'BeiDou', 'GLONASS']);
    assert.deepEqual(gnssNames(F10), ['GPS', 'Galileo', 'BeiDou']);
    assert.deepEqual(gnssNames(UNKNOWN), []);
});

test('only the three constellations with a switch can be hidden', () => {
    const withBox = GNSS_CONSTELLATIONS.filter(c => c.box).map(c => c.key);
    assert.deepEqual(withBox, ['galileo', 'beidou', 'glonass']);
    // GPS has no switch: INAV never turns it off
    assert.equal(major('gps').box, undefined);
});

test('every entry points at something the tab can show', () => {
    for (const c of GNSS_CONSTELLATIONS.concat(GNSS_EXTENDED)) {
        assert.ok(c.box || c.row, `${c.name} has no control and no row`);
    }
});

// The cases the firmware was run through in SITL, with the same outcome
const ALL = 0x0F;
const leftOut = (selected, supported, max) => gnssLeftOut(selected, supported, max).map(c => c.key);

test('a receiver that tracks three loses GLONASS first', () => {
    assert.deepEqual(leftOut(ALL, M10, 3), ['glonass']);
    assert.deepEqual(leftOut(ALL, M10, 2), ['glonass', 'beidou']);
});

test('nothing is left out when the selection fits', () => {
    assert.deepEqual(leftOut(ALL, M10, 4), []);
    assert.deepEqual(leftOut(0x0D, M10, 3), []);
});

test('a constellation the receiver lacks does not take a slot', () => {
    // An F10 with GLONASS ticked: it has no GLONASS, so three are left and they fit
    assert.deepEqual(leftOut(ALL, F10, 3), []);
});

test('nothing is left out while the receiver has not answered', () => {
    assert.deepEqual(leftOut(ALL, UNKNOWN, 3), []);
    assert.deepEqual(leftOut(ALL, M10, 0), []);
});

test('GPS always counts, ticked or not', () => {
    assert.deepEqual(leftOut(0x0E, M10, 3), ['glonass']);
});

test('the bits match the UBX-MON-GNSS field, not the order of the list', () => {
    assert.equal(major('gps').bit, 0x01);
    assert.equal(major('glonass').bit, 0x02);
    assert.equal(major('beidou').bit, 0x04);
    assert.equal(major('galileo').bit, 0x08);
});

test('the extension bits match the order the firmware packs them in', () => {
    assert.equal(extra('sbas').bit, 0x01);
    assert.equal(extra('qzss').bit, 0x02);
    assert.equal(extra('navic').bit, 0x04);
});
