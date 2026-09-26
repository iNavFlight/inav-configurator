#!/usr/bin/env node
/**
 * MSP2_INAV_STATUS carries the same boxBitmask_t as MSP_ACTIVEBOXES (fc_msp.c:579-598 vs
 * :547-552): u16 cycle time, u16 i2c errors, u16 sensor status, u16 cpu load, u8 profiles,
 * u32 arming flags, the bitmask as u32 words, u8 mixer profile. Parsing it into FC.CONFIG.mode
 * lets a tunnel session drop the ACTIVEBOXES poll. Runs the real js/msp/MSPHelper.js.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { dataModule } from './helpers/dataModule.mjs';
import { loadMspHelper } from './helpers/mspCore.mjs';

globalThis.__boxModesFc = {};
const { mspHelper, MSPCodes } = await loadMspHelper(import.meta.url, 'msp-status-box-modes.test.mjs', 'msp-status-box-modes-', {
    fc: dataModule('export default globalThis.__boxModesFc;'),
    gui: dataModule('export default { PROFILES_CHANGED: { CONTROL: 1, BATTERY: 2, MIXER: 4 }, updateStatusBar() {}, updateProfileChange() {}, log() {} };'),
    i18n: dataModule('export default { getMessage: key => key };'),
});
const FC = globalThis.__boxModesFc;

function resetFc() {
    FC.CONFIG = { profile: -1, battery_profile: -1, mixer_profile: -1, mode: [] };
}

function handle(code, bytes) {
    const buffer = Uint8Array.from(bytes).buffer;
    mspHelper.processData({ code, message_buffer: buffer, message_length_expected: bytes.length, unsupported: 0, callbacks: [] });
}

function u32(value) {
    return [value & 0xFF, (value >>> 8) & 0xFF, (value >>> 16) & 0xFF, value >>> 24];
}

function statusPayload(words, { armingFlags = 0x00040010, mixerProfile = 1 } = {}) {
    return [
        0xD0, 0x07, 0x00, 0x00, 0x2F, 0x00, 0x0C, 0x00,
        0x21,
        ...u32(armingFlags),
        ...words.flatMap(u32),
        mixerProfile,
    ];
}

const CASES = [
    // CHECKBOX_ITEM_COUNT is 64 on maintenance-10.x (rc_modes.h): two words.
    ['current firmware, 2 words', [0x80002001, 0x00000041]],
    ['a firmware with more boxes, 3 words', [0x00000001, 0xFFFFFFFF, 0x00000002]],
    ['all modes off', [0, 0]],
];

for (const [label, words] of CASES) {
    test(`MSP2_INAV_STATUS fills FC.CONFIG.mode like MSP_ACTIVEBOXES: ${label}`, () => {
        resetFc();
        handle(MSPCodes.MSP_ACTIVEBOXES, words.flatMap(u32));
        const fromActiveBoxes = FC.CONFIG.mode;

        resetFc();
        handle(MSPCodes.MSPV2_INAV_STATUS, statusPayload(words));
        assert.deepEqual(FC.CONFIG.mode, fromActiveBoxes);
        assert.deepEqual(FC.CONFIG.mode, words);
    });
}

test('the fields around the bitmask are still read from their places', () => {
    resetFc();
    handle(MSPCodes.MSPV2_INAV_STATUS, statusPayload([0x00000005, 0x00000000], { armingFlags: 0x12345678, mixerProfile: 2 }));
    assert.equal(FC.CONFIG.cycleTime, 2000);
    assert.equal(FC.CONFIG.cpuload, 12);
    assert.equal(FC.CONFIG.profile, 1);
    assert.equal(FC.CONFIG.battery_profile, 2);
    assert.equal(FC.CONFIG.armingFlags, 0x12345678);
    assert.equal(FC.CONFIG.mixer_profile, 2);
});

test('a STATUS reply without room for a bitmask leaves FC.CONFIG.mode alone', () => {
    resetFc();
    FC.CONFIG.mode = [7, 0];
    handle(MSPCodes.MSPV2_INAV_STATUS, statusPayload([]));
    assert.deepEqual(FC.CONFIG.mode, [7, 0]);
});
