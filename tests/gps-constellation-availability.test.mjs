#!/usr/bin/env node
/**
 * The GPS tab offers three constellation checkboxes, Galileo, BeiDou and
 * GLONASS, to every receiver. A u-blox F10 has no GLONASS at all, so ticking
 * that box asks the firmware for something the receiver cannot do.
 *
 * INAV polls UBX-MON-GNSS before it configures the receiver, and now passes the
 * supported and enabled masks through at the end of MSP_GPSSTATISTICS. These are
 * the rules the tab applies to them.
 *
 * The important case is the empty mask. It is what an older firmware, a receiver
 * that is not u-blox, and one that never answered all report, and it must not be
 * read as "this receiver has no constellations": nothing is known, so nothing is
 * hidden.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    GNSS_CONSTELLATIONS,
    gnssMasksKnown,
    gnssNames,
    gnssIsOffered
} from '../js/gpsConstellations.js';

// The masks a real receiver reports, measured against an emulated u-blox in SITL
const M10 = 0x0F;       // GPS, GLONASS, BeiDou, Galileo
const F10 = 0x0D;       // GPS, BeiDou, Galileo, and no GLONASS
const UNKNOWN = 0x00;

function boxFor(key) {
    return GNSS_CONSTELLATIONS.find(c => c.key === key);
}

test('an empty mask means unknown, so every constellation stays on offer', () => {
    for (const c of GNSS_CONSTELLATIONS) {
        assert.equal(gnssIsOffered(UNKNOWN, c), true, `${c.name} should still be offered`);
    }
    assert.equal(gnssMasksKnown(UNKNOWN), false);
});

test('an F10 keeps Galileo and BeiDou and loses GLONASS', () => {
    assert.equal(gnssIsOffered(F10, boxFor('galileo')), true);
    assert.equal(gnssIsOffered(F10, boxFor('beidou')), true);
    assert.equal(gnssIsOffered(F10, boxFor('glonass')), false);
    assert.equal(gnssMasksKnown(F10), true);
});

test('an M10 keeps all three', () => {
    assert.equal(gnssIsOffered(M10, boxFor('galileo')), true);
    assert.equal(gnssIsOffered(M10, boxFor('beidou')), true);
    assert.equal(gnssIsOffered(M10, boxFor('glonass')), true);
});

test('the names come out in the order the tab lists them', () => {
    assert.deepEqual(gnssNames(M10), ['GPS', 'Galileo', 'BeiDou', 'GLONASS']);
    assert.deepEqual(gnssNames(F10), ['GPS', 'Galileo', 'BeiDou']);
    assert.deepEqual(gnssNames(UNKNOWN), []);
});

test('what is enabled can be less than what is supported', () => {
    // A receiver that has four and is running three, which is what INAV asks
    // for by default: Galileo and BeiDou on, GLONASS off
    assert.deepEqual(gnssNames(0x0D), ['GPS', 'Galileo', 'BeiDou']);
    assert.deepEqual(gnssNames(M10), ['GPS', 'Galileo', 'BeiDou', 'GLONASS']);
});

test('only the three constellations with a checkbox can be hidden', () => {
    const withBox = GNSS_CONSTELLATIONS.filter(c => c.box).map(c => c.key);
    assert.deepEqual(withBox, ['galileo', 'beidou', 'glonass']);
    // GPS has no checkbox: INAV never offers to turn it off, and never should
    assert.equal(boxFor('gps').box, undefined);
});

test('the bits match the UBX-MON-GNSS field, not the order of the list', () => {
    assert.equal(boxFor('gps').bit, 0x01);
    assert.equal(boxFor('glonass').bit, 0x02);
    assert.equal(boxFor('beidou').bit, 0x04);
    assert.equal(boxFor('galileo').bit, 0x08);
});
