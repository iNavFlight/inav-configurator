#!/usr/bin/env node
/**
 * The Calibration tab's line about in-flight compass learning, from MSP2_INAV_MAG_LEARN.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { MAG_LEARN_FLAG, magLearnStatusText, magLearnedZero, magLearnedYawTrim } from '../js/magLearnStatus.js';

const seen = [];

// Echoes the key and its parameters, so the tests see what would be translated
function getMessage(key, params) {
    seen.push(params);
    if (params === undefined) {
        return key;
    }
    const values = Array.isArray(params) ? params : Object.keys(params).filter(k => /^\d+$/.test(k)).map(k => params[k]);
    return key + '(' + values.join(',') + ')';
}

function learn(flags, extra = {}) {
    return { flags, sectors: 0, headings: 0, spread: 0, delta: [0, 0, 0], ...extra };
}

function text(state) {
    return magLearnStatusText(state, true, getMessage);
}

describe('magLearnStatusText', () => {
    test('nothing learned since the last arming', () => {
        assert.equal(text(learn(0)), 'magLearnNoFlight');
    });

    test('an uncalibrated compass is never refined, whatever the state says', () => {
        assert.equal(magLearnStatusText(learn(MAG_LEARN_FLAG.SAVED), false, getMessage), 'magLearnNeedsCalibration');
    });

    test('armed shows the coverage so far, whatever the checks say', () => {
        const state = learn(MAG_LEARN_FLAG.COLLECTING | MAG_LEARN_FLAG.FEW_HEADINGS, { sectors: 7, headings: 4 });
        assert.equal(text(state), 'magLearnArmed(7,4)');
        state.flags = MAG_LEARN_FLAG.PAUSED;
        assert.equal(text(state), 'magLearnArmed(7,4)');
    });

    test('a save reports the change written', () => {
        const state = learn(MAG_LEARN_FLAG.SAVE_DUE | MAG_LEARN_FLAG.SAVED, { delta: [-58, 41, -77] });
        assert.equal(text(state), 'magLearnSaved(-58,41,-77)');
    });

    test('within the rearm window after the disarm the save is still pending', () => {
        assert.equal(text(learn(MAG_LEARN_FLAG.SAVE_DUE, { sectors: 30, headings: 12 })), 'magLearnPending');
    });

    test('a disarm in the air saves nothing and says so', () => {
        assert.equal(text(learn(MAG_LEARN_FLAG.DISARMED_FLYING, { sectors: 30, headings: 12 })), 'magLearnDisarmedFlying');
    });

    test('every failed check is listed', () => {
        const state = learn(MAG_LEARN_FLAG.FEW_HEADINGS | MAG_LEARN_FLAG.FEW_SECTORS, { sectors: 5, headings: 3 });
        assert.equal(text(state), 'magLearnNotSaved(magLearnFewHeadings(3); magLearnFewSectors(5))');
    });

    test('the joined reasons are not escaped twice', () => {
        text(learn(MAG_LEARN_FLAG.OFF_SCALE));
        assert.deepEqual(seen.at(-1).interpolation, { escapeValue: false });
    });

    test('spread is shown in percent', () => {
        const state = learn(MAG_LEARN_FLAG.NOT_SPHERE | MAG_LEARN_FLAG.OFF_SCALE, { spread: 65 });
        assert.equal(text(state), 'magLearnNotSaved(magLearnNotSphere(6.5); magLearnOffScale)');
    });

    test('a refused step names the change', () => {
        assert.equal(text(learn(MAG_LEARN_FLAG.STEP_TOO_BIG, { delta: [400, 0, -12] })), 'magLearnNotSaved(magLearnStepTooBig(400,0,-12))');
    });

    test('armed with the attitude fit shows the offsets it found', () => {
        const state = learn(MAG_LEARN_FLAG.COLLECTING | MAG_LEARN_FLAG.ATTITUDE_FIT, { delta: [-480, 410, -77] });
        assert.equal(text(state), 'magLearnArmedAttitude(-480,410,-77)');
    });

    test('a misfit against the attitude is said after the status', () => {
        const state = learn(MAG_LEARN_FLAG.SAVED | MAG_LEARN_FLAG.MISFIT, { delta: [-58, 41, -77] });
        assert.equal(text(state), 'magLearnSaved(-58,41,-77) magLearnMisfit');
    });

    test('a turned compass is said with the direction the field pointed', () => {
        // The field is north, west, up: 30 degrees east of north is a negative west component
        const state = learn(MAG_LEARN_FLAG.DECLINATION_OFF | MAG_LEARN_FLAG.FEW_HEADINGS, { headings: 3, field: [900, -520, -1500] });
        assert.equal(text(state), 'magLearnNotSaved(magLearnFewHeadings(3)) magLearnDeclinationOff(30)');
    });

    test('a confirmed calibration says so', () => {
        assert.equal(text(learn(MAG_LEARN_FLAG.CONFIRMED | MAG_LEARN_FLAG.ATTITUDE_FIT)), 'magLearnConfirmed');
    });

    test('disagreeing fits are a reason', () => {
        assert.equal(text(learn(MAG_LEARN_FLAG.FITS_DISAGREE)), 'magLearnNotSaved(magLearnFitsDisagree)');
    });

    test('the bits match magLearnFlags_e', () => {
        assert.deepEqual(
            [MAG_LEARN_FLAG.COLLECTING, MAG_LEARN_FLAG.PAUSED, MAG_LEARN_FLAG.ATTITUDE_FIT, MAG_LEARN_FLAG.MISFIT,
                MAG_LEARN_FLAG.SAVE_DUE, MAG_LEARN_FLAG.FEW_SECTORS,
                MAG_LEARN_FLAG.FEW_HEADINGS, MAG_LEARN_FLAG.NOT_SPHERE, MAG_LEARN_FLAG.OFF_SCALE,
                MAG_LEARN_FLAG.STEP_TOO_BIG, MAG_LEARN_FLAG.SAVED, MAG_LEARN_FLAG.DISARMED_FLYING, MAG_LEARN_FLAG.DECLINATION_OFF,
                MAG_LEARN_FLAG.FITS_DISAGREE, MAG_LEARN_FLAG.CONFIRMED],
            [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384]);
    });
});

describe('magLearnedZero', () => {
    const stored = { X: -46, Y: -98, Z: 122 };

    function state(flags, delta = [0, 0, 0]) {
        return { supported: true, flags, sectors: 0, headings: 0, spread: 0, delta, field: [0, 0, 0] };
    }

    test('nothing without a fit', () => {
        assert.equal(magLearnedZero(state(0), stored), null);
        assert.equal(magLearnedZero(state(MAG_LEARN_FLAG.COLLECTING | MAG_LEARN_FLAG.FEW_SECTORS), stored), null);
    });

    test('nothing on firmware without mag_learn', () => {
        assert.equal(magLearnedZero({ ...state(MAG_LEARN_FLAG.SAVE_DUE, [5, 5, 5]), supported: false }, stored), null);
    });

    test('a fit not yet written adds its change to the stored offsets', () => {
        assert.deepEqual(magLearnedZero(state(MAG_LEARN_FLAG.SAVE_DUE, [12, -9, 30]), stored), { X: -34, Y: -107, Z: 152 });
        assert.deepEqual(magLearnedZero(state(MAG_LEARN_FLAG.STEP_TOO_BIG, [400, 0, 0]), stored), { X: 354, Y: -98, Z: 122 });
    });

    test('after a save the stored offsets already hold the change', () => {
        assert.deepEqual(magLearnedZero(state(MAG_LEARN_FLAG.SAVE_DUE | MAG_LEARN_FLAG.SAVED, [12, -9, 30]), stored), stored);
    });
});

describe('magLearnedYawTrim', () => {
    function state(flags, yawTrimDelta) {
        return { supported: true, flags, sectors: 0, headings: 0, spread: 0, delta: [0, 0, 0], field: [0, 0, 0], yawTrimDelta };
    }

    test('nothing without the attitude fit or before the setting loaded', () => {
        assert.equal(magLearnedYawTrim(state(MAG_LEARN_FLAG.SAVE_DUE, 30), -20), null);
        assert.equal(magLearnedYawTrim(state(MAG_LEARN_FLAG.ATTITUDE_FIT, 30), NaN), null);
    });

    test('a pending trim adds to the stored one, a saved one is the stored one', () => {
        assert.equal(magLearnedYawTrim(state(MAG_LEARN_FLAG.ATTITUDE_FIT | MAG_LEARN_FLAG.SAVE_DUE, 30), -20), 10);
        assert.equal(magLearnedYawTrim(state(MAG_LEARN_FLAG.ATTITUDE_FIT | MAG_LEARN_FLAG.SAVED, 30), 10), 10);
    });

    test('the status says how far the trim moves', () => {
        const s = state(MAG_LEARN_FLAG.SAVE_DUE | MAG_LEARN_FLAG.SAVED | MAG_LEARN_FLAG.ATTITUDE_FIT, -45);
        s.delta = [1, 2, 3];
        assert.equal(magLearnStatusText(s, true, (k, p) => k + (p ? '(' + p.join(',') + ')' : '')),
            'magLearnSaved(1,2,3) magLearnYawTrim(-4.5)');
    });
});
