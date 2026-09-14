#!/usr/bin/env node
/**
 * Regression test for the stale fixed wing approach length in Mission Control
 * (inav-configurator issue #2313).
 *
 * Mission Control keeps two kinds of values in the same `settings` object:
 *   - the mission planner defaults the user edits in the settings panel
 *     (alt, speed, safeRadiusSH, fwApproachAlt, fwLandAlt), persisted with
 *     `store.set('missionPlannerSettings', settings)`
 *   - values read from the FC on every tab entry (fwApproachLength from
 *     nav_fw_land_approach_length, maxDistSH from safehome_max_distance,
 *     fwLoiterRadius from nav_fw_loiter_radius)
 *
 * The FC values are re-read by the load chainer of every `initialize()`, but
 * `loadSettings()` used to replace the whole object with the persisted copy
 * (`settings = missionPlannerSettings`) right after writing the fresh values
 * to the store. So the map was always painted with the values of the previous
 * tab visit: after changing nav_fw_land_approach_length in Advanced Tuning and
 * rebooting, the approach lines kept their old length until the tab was left
 * and entered a second time.
 *
 * The test runs the real `loadSettings()` and `saveSettings()` source out of
 * tabs/mission_control.js inside a stand-in for the tab closure, so a future
 * change that reintroduces the overwrite fails here.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const missionControlPath = path.join(testDir, '..', 'tabs', 'mission_control.js');
const missionControlSource = readFileSync(missionControlPath, 'utf8');

function extractFunction(source, header) {
    const start = source.indexOf(header);
    assert.notEqual(start, -1, header + ' not found in tabs/mission_control.js');
    let depth = 0;
    for (let i = start + header.length - 1; i < source.length; i++) {
        if (source[i] === '{') {
            depth++;
        } else if (source[i] === '}') {
            depth--;
            if (depth === 0) {
                return source.slice(start, i + 1);
            }
        }
    }
    throw new Error('unbalanced braces while extracting ' + header);
}

const loadSettingsSource = extractFunction(missionControlSource, 'function loadSettings() {');
const saveSettingsSource = extractFunction(missionControlSource, 'function saveSettings() {');

// Values the FC returns for a stock autoland setup, in the units the tab uses.
const APPROACH_LENGTH_OLD = 35000;
const APPROACH_LENGTH_NEW = 10000;

function fcSettings(overrides) {
    return Object.assign({
        speed: 0,
        alt: 5000,
        safeRadiusSH: 50,
        fwApproachAlt: 60,
        fwLandAlt: 5,
        maxDistSH: 50,
        fwApproachLength: APPROACH_LENGTH_NEW,
        fwLoiterRadius: 5000,
    }, overrides);
}

function storedSettings(overrides) {
    return Object.assign({
        speed: 500,
        alt: 3000,
        safeRadiusSH: 70,
        fwApproachAlt: 80,
        fwLandAlt: 10,
        maxDistSH: 20,
        fwApproachLength: APPROACH_LENGTH_OLD,
        fwLoiterRadius: 2000,
    }, overrides);
}

/**
 * Stand-in for the tab closure: `settings` is a closure variable exactly as in
 * missionControlTab.initialize(), so a `settings = ...` assignment inside
 * loadSettings() is visible to the caller the same way it is in the tab.
 */
function runLoadSettings(initialSettings, stored, isOffline = false) {
    const storeData = {};
    if (stored) {
        storeData.missionPlannerSettings = stored;
    }
    const store = {
        get(key, fallback) {
            return Object.prototype.hasOwnProperty.call(storeData, key) ? storeData[key] : fallback;
        },
        set(key, value) {
            storeData[key] = JSON.parse(JSON.stringify(value));
        },
    };

    const factory = new Function('store', 'initialSettings', 'isOffline', `
        let settings = initialSettings;
        function refreshSettings() { }
        ${saveSettingsSource}
        ${loadSettingsSource}
        loadSettings();
        return settings;
    `);

    return {
        settings: factory(store, initialSettings, isOffline),
        stored: storeData.missionPlannerSettings,
    };
}

describe('Mission Control settings: FC values versus the stored copy', () => {
    test('the approach length just read from the FC survives loadSettings()', () => {
        const result = runLoadSettings(fcSettings(), storedSettings());
        assert.equal(result.settings.fwApproachLength, APPROACH_LENGTH_NEW);
    });

    test('the other FC provided values survive as well', () => {
        const result = runLoadSettings(fcSettings(), storedSettings());
        assert.equal(result.settings.maxDistSH, 50);
        assert.equal(result.settings.fwLoiterRadius, 5000);
    });

    test('the stored mission planner defaults still win over the built in ones', () => {
        const result = runLoadSettings(fcSettings(), storedSettings());
        assert.equal(result.settings.alt, 3000);
        assert.equal(result.settings.speed, 500);
        assert.equal(result.settings.safeRadiusSH, 70);
        assert.equal(result.settings.fwApproachAlt, 80);
        assert.equal(result.settings.fwLandAlt, 10);
    });

    test('the fresh FC values are written back to the store', () => {
        const result = runLoadSettings(fcSettings(), storedSettings());
        assert.equal(result.stored.fwApproachLength, APPROACH_LENGTH_NEW);
        assert.equal(result.stored.maxDistSH, 50);
        assert.equal(result.stored.fwLoiterRadius, 5000);
    });

    test('without a stored copy the FC values are kept unchanged', () => {
        const result = runLoadSettings(fcSettings(), null);
        assert.equal(result.settings.fwApproachLength, APPROACH_LENGTH_NEW);
        assert.equal(result.settings.alt, 5000);
    });

    test('offline (no FC read, values still 0) the stored copy is the fallback', () => {
        const offline = fcSettings({ fwApproachLength: 0, maxDistSH: 0, fwLoiterRadius: 0 });
        const result = runLoadSettings(offline, storedSettings(), true);
        assert.equal(result.settings.fwApproachLength, APPROACH_LENGTH_OLD);
        assert.equal(result.settings.maxDistSH, 20);
        assert.equal(result.settings.fwLoiterRadius, 2000);
    });

    test('connected, a value the FC really reports as 0 is not replaced by the stored one', () => {
        // safehome_max_distance and nav_fw_loiter_radius may legitimately be 0.
        const zeroed = fcSettings({ maxDistSH: 0, fwLoiterRadius: 0 });
        const result = runLoadSettings(zeroed, storedSettings());
        assert.equal(result.settings.maxDistSH, 0);
        assert.equal(result.settings.fwLoiterRadius, 0);
    });

    test('a stored copy from an older version keeps every value it does not know', () => {
        const old = storedSettings();
        delete old.fwApproachLength;
        delete old.fwLoiterRadius;
        const result = runLoadSettings(fcSettings(), old);
        assert.equal(result.settings.fwApproachLength, APPROACH_LENGTH_NEW);
        assert.equal(result.settings.fwLoiterRadius, 5000);
        assert.equal(result.settings.alt, 3000);
    });

    test('entering the tab twice with the same FC value changes nothing', () => {
        const first = runLoadSettings(fcSettings(), storedSettings());
        const second = runLoadSettings(fcSettings(), first.stored);
        assert.deepEqual(second.settings, first.settings);
    });
});
