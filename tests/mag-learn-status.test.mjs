#!/usr/bin/env node
/**
 * The Calibration tab's line about in-flight compass learning, from MSP2_INAV_MAG_LEARN.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { MAG_LEARN_FLAG, magLearnStatusText } from '../js/magLearnStatus.js';

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

    test('the bits match magLearnFlags_e', () => {
        assert.deepEqual(
            [MAG_LEARN_FLAG.COLLECTING, MAG_LEARN_FLAG.PAUSED, MAG_LEARN_FLAG.SAVE_DUE, MAG_LEARN_FLAG.FEW_SECTORS,
                MAG_LEARN_FLAG.FEW_HEADINGS, MAG_LEARN_FLAG.NOT_SPHERE, MAG_LEARN_FLAG.OFF_SCALE,
                MAG_LEARN_FLAG.STEP_TOO_BIG, MAG_LEARN_FLAG.SAVED, MAG_LEARN_FLAG.DISARMED_FLYING],
            [1, 2, 16, 32, 64, 128, 256, 512, 1024, 2048]);
    });
});
