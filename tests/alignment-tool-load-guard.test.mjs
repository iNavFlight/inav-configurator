#!/usr/bin/env node
/**
 * Regression tests for the Alignment Tool (magnetometer tab) load guard.
 *
 * The tab's MSP load chain has no error path: a request that is never answered
 * used to leave the tab on the loading spinner forever, and GUI.content_ready()
 * was never reached. These tests mirror the guard added to tabs/magnetometer.js
 * and check that the real file keeps it wired up.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const tabSource = readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tabs', 'magnetometer.js'),
    'utf8'
);

// Mirrors the load_html() / load_timed_out() pair in tabs/magnetometer.js
function createLoadGuard(isHidden) {
    const state = { loadFinished: false, loaded: 0, failed: 0, timers: 0 };

    function armTimer() {
        state.timers++;
    }

    return {
        state,
        chainFinished() {
            if (state.loadFinished) {
                return;
            }
            state.loadFinished = true;
            state.loaded++;
        },
        timedOut() {
            if (state.loadFinished) {
                return;
            }
            if (isHidden()) {
                armTimer();
                return;
            }
            state.loadFinished = true;
            state.failed++;
        }
    };
}

// Mirrors the model selection in magnetometerTab.initialize3D()
function selectModel(appliedMixerPreset, knownPresets) {
    if (appliedMixerPreset === -1) {
        return 'fallback';
    }
    const appliedMixer = knownPresets[appliedMixerPreset];
    return appliedMixer ? appliedMixer.model : 'fallback';
}

describe('Alignment Tool load guard', () => {

    test('a completed chain loads the tab once and a late timeout does nothing', () => {
        const guard = createLoadGuard(() => false);
        guard.chainFinished();
        guard.timedOut();
        guard.chainFinished();
        assert.equal(guard.state.loaded, 1);
        assert.equal(guard.state.failed, 0);
    });

    test('a stalled chain gives up once and does not load the tab afterwards', () => {
        const guard = createLoadGuard(() => false);
        guard.timedOut();
        guard.chainFinished();
        guard.timedOut();
        assert.equal(guard.state.failed, 1);
        assert.equal(guard.state.loaded, 0);
    });

    test('a hidden window re-arms the timer instead of giving up', () => {
        let hidden = true;
        const guard = createLoadGuard(() => hidden);
        guard.timedOut();
        guard.timedOut();
        assert.equal(guard.state.failed, 0);
        assert.equal(guard.state.timers, 2);

        // Once the window is back on screen the chain is still allowed to finish.
        hidden = false;
        guard.chainFinished();
        assert.equal(guard.state.loaded, 1);
        assert.equal(guard.state.failed, 0);
    });

    test('an unknown mixer preset falls back to the generic model', () => {
        const knownPresets = { 3: { model: 'quad_x' } };
        assert.equal(selectModel(3, knownPresets), 'quad_x');
        assert.equal(selectModel(-1, knownPresets), 'fallback');
        assert.equal(selectModel(99, knownPresets), 'fallback');
    });

    test('the tab arms the load timeout and drops it again', () => {
        assert.match(tabSource, /timeout\.add\('magnetometer_load'/);
        assert.match(tabSource, /timeout\.remove\('magnetometer_load'\)/);
        // cleanup() has to drop the timer, otherwise it fires into the next tab
        const cleanup = tabSource.slice(tabSource.indexOf('magnetometerTab.cleanup'));
        assert.match(cleanup, /timeout\.remove\('magnetometer_load'\)/);
    });
});
