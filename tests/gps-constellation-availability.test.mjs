#!/usr/bin/env node
/**
 * The GPS tab used to offer the same three constellation switches to every
 * receiver. A u-blox F10 has no GLONASS at all, so ticking that box asked the
 * firmware for something the receiver cannot do, and nothing in the tab said
 * which constellations the receiver did have.
 *
 * INAV now reports both: the four major constellations from UBX-MON-GNSS, and
 * SBAS, QZSS and NavIC from the MON-VER version strings, which MON-GNSS does
 * not carry. These are the rules the tab applies to the two masks.
 *
 * The two rules pull in opposite directions on purpose. A switch is withdrawn
 * only when the receiver is known not to have that constellation, because
 * hiding one on a guess would leave someone unable to turn on something they
 * have. A row that only reports is shown only once the receiver has confirmed
 * it, because an unfounded row is worse than no row.
 *
 * The case that drives both is the empty mask. An older firmware, a receiver
 * that is not u-blox, and one that never answered all report it, and it means
 * nothing is known, not that there is nothing there.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    GNSS_CONSTELLATIONS,
    GNSS_EXTENDED,
    gnssMasksKnown,
    gnssNames,
    gnssIsOffered,
    gnssIsConfirmed
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
    // GPS has no switch: INAV never offers to turn it off, and never should
    assert.equal(major('gps').box, undefined);
});

test('every entry points at something the tab can show', () => {
    for (const c of GNSS_CONSTELLATIONS.concat(GNSS_EXTENDED)) {
        assert.ok(c.box || c.row, `${c.name} has no control and no row`);
    }
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
