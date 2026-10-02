#!/usr/bin/env node
/**
 * Regression test for GitHub issue #11721: Mission Control > Geozones >
 * "Save to eeprom and reboot" does not persist new geozones.
 *
 * Root cause: the click handler for #saveEepromGeozoneButton in
 * tabs/mission_control.js calls `mspHelper.saveGeozones(callback)`, and
 * inside that callback calls `mspHelper.saveToEeprom()` WITHOUT a callback,
 * then immediately calls `reboot()` in the same synchronous tick:
 *
 *     mspHelper.saveGeozones(() => {
 *         mspHelper.saveToEeprom();
 *         GUI.log('End of sending Geozones');
 *         reboot();
 *     });
 *
 * `mspHelper.saveToEeprom(callback)` (js/msp/MSPHelper.js) is
 * `MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, callback)` -
 * callback only fires once the FC acknowledges the write. Every other
 * save-then-reboot flow in this codebase (e.g. tabs/pid_tuning.js) passes a
 * callback and gates the next step on it. Here, no callback is passed, so
 * `reboot()` - which synchronously calls GUI.tab_switch_cleanup(), whose
 * FIRST action is `mspQueue.flush()` (js/serial_queue.js) - runs in the same
 * tick as the still-in-flight (or not yet even dequeued) MSP_EEPROM_WRITE
 * request. This was confirmed against a real, connected flight controller:
 * after adding a geozone and clicking "Save Eeprom Geozones and reboot", the
 * FC reported 63/63 available geozones (i.e. zero saved) once reconnected
 * post-reboot - the geozone was never actually persisted.
 *
 * Fix under test: gate reboot() on saveToEeprom()'s completion callback,
 * e.g. `mspHelper.saveToEeprom(() => { GUI.log(...); reboot(); });`.
 *
 * --- Why this test executes the REAL production click-handler source -----
 *
 * tabs/mission_control.js cannot be imported as a whole module in plain
 * Node: it pulls in openlayers (`ol/*`), chart.js, xml2js and fflate, many
 * of which touch DOM/canvas APIs at import time and are irrelevant to the
 * race being tested. Rather than hand-write a "mirrored reimplementation" of
 * the click handler (which would NOT catch a future regression if someone
 * edits the real handler), this test reads the REAL source of
 * tabs/mission_control.js fresh off disk at run time and extracts, via an
 * anchored regex, the exact literal body of the
 * `$('#saveEepromGeozoneButton').on('click', async event => { ... });`
 * handler - byte-for-byte, no reformatting or logic changes. That extracted
 * body is compiled with `new AsyncFunction(...)` and executed with mocked
 * closure dependencies (dialog, mspHelper, GUI, reboot, invalidGeoZones, $).
 * If the real handler's source shape changes (renamed selector, different
 * arrow-function signature, etc.), the extraction step throws loudly,
 * forcing this test to be updated rather than silently passing vacuously.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

/**
 * Extract the literal body of the real
 * `$('#saveEepromGeozoneButton').on('click', async event => { ... });`
 * handler from the real tabs/mission_control.js source. Throws loudly if the
 * anchor pattern no longer matches, rather than silently extracting nothing.
 */
function extractRealSaveEepromGeozoneHandlerBody() {
    const source = readFileSync(join(repoRoot, 'tabs/mission_control.js'), 'utf8');
    const anchor = /\$\('#saveEepromGeozoneButton'\)\.on\('click', async event => \{([\s\S]*?)\n {8}\}\);/;
    const match = source.match(anchor);
    if (!match) {
        throw new Error(
            "geozone-save-eeprom-reboot-race.test.mjs: expected to find and extract the " +
            "$('#saveEepromGeozoneButton').on('click', async event => { ... }); handler body " +
            "in tabs/mission_control.js, but the anchor pattern did not match. The real handler's " +
            "source shape has changed - update this test's extraction pattern to match, and " +
            "re-verify it still captures the full handler body."
        );
    }
    return match[1];
}

/**
 * Compile the extracted real handler body into a callable async function.
 * Only the closure variables the real handler actually references are
 * exposed as parameters: `event`, `invalidGeoZones`, `dialog`, `i18n`,
 * `mspHelper`, `GUI`, `reboot`, and the jQuery global `$`.
 */
function compileRealHandler(body) {
    return new AsyncFunction('event', 'invalidGeoZones', 'dialog', 'i18n', 'mspHelper', 'GUI', 'reboot', '$', body);
}

/** Chainable no-op jQuery stand-in; the handler only calls $(...).addClass(). */
function makeJQueryStub() {
    const chain = { addClass: () => chain };
    return () => chain;
}

/**
 * A mspHelper.saveToEeprom mock that behaves like the real MSP transaction:
 * the FC's acknowledgement of MSP_EEPROM_WRITE arrives asynchronously (a
 * real serial round trip, never synchronously in the same tick). Records
 * whether a completion callback was supplied at all (the literal bug
 * condition) and, if so, when the "FC ack" actually lands.
 */
function makeSaveToEepromMock(state, ackDelayMs) {
    return function saveToEeprom(callback) {
        state.saveToEepromCalled = true;
        state.saveToEepromCallbackProvided = typeof callback === 'function';
        setTimeout(() => {
            state.eepromWriteAcked = true;
            if (typeof callback === 'function') callback();
        }, ackDelayMs);
    };
}

function makeMspHelperMock(state, ackDelayMs) {
    return {
        // saveGeozones' own per-geozone MSP round trips are irrelevant to
        // this race; invoke its callback once, synchronously, exactly as it
        // would once all real geozone-save transactions have completed.
        saveGeozones: (callback) => { callback(); },
        saveToEeprom: makeSaveToEepromMock(state, ackDelayMs),
    };
}

function makeDialogMock() {
    // The user clicked "Yes" on the "save + reboot?" confirmation.
    return { confirm: async () => true, alert: () => {} };
}

function makeI18nMock() {
    return { getMessage: (key) => key };
}

function makeGuiMock() {
    return { log: () => {} };
}

/**
 * Compile and run a save-eeprom-geozone handler body (real or hand-written)
 * against the same mocked FC round trip, and collect what it did. Shared by
 * both tests below so the repro test and its positive control exercise
 * identical mechanics and only differ in which handler body they compile.
 */
async function runHandlerAndCollect(handlerBody) {
    const handler = compileRealHandler(handlerBody);
    const state = { saveToEepromCalled: false, saveToEepromCallbackProvided: false, eepromWriteAcked: false };
    const mspHelper = makeMspHelperMock(state, 20 /* ms, simulated FC round trip */);

    let rebootCalled = false;
    let eepromWriteAckedWhenRebootFired = null;
    const reboot = () => {
        rebootCalled = true;
        eepromWriteAckedWhenRebootFired = state.eepromWriteAcked;
    };

    await handler(
        { currentTarget: {} },
        false, // invalidGeoZones
        makeDialogMock(),
        makeI18nMock(),
        mspHelper,
        makeGuiMock(),
        reboot,
        makeJQueryStub(),
    );

    // Give the simulated FC ack (20ms) time to land, so we can also confirm
    // it does eventually arrive (sanity: the mock itself isn't broken).
    await new Promise((r) => setTimeout(r, 60));

    return { state, rebootCalled, eepromWriteAckedWhenRebootFired };
}

test('BUG #11721 repro: reboot() must not fire before the FC acknowledges MSP_EEPROM_WRITE', async () => {
    const { state, rebootCalled, eepromWriteAckedWhenRebootFired } =
        await runHandlerAndCollect(extractRealSaveEepromGeozoneHandlerBody());

    assert.equal(state.saveToEepromCalled, true, 'sanity: mspHelper.saveToEeprom() must have been called');
    assert.equal(rebootCalled, true, 'sanity: reboot() must have been called');
    assert.equal(state.eepromWriteAcked, true, 'sanity: the simulated FC ack must eventually land');

    // The actual regression assertions. Both fail against the current,
    // unfixed handler:
    assert.equal(
        state.saveToEepromCallbackProvided,
        true,
        'mspHelper.saveToEeprom() was called without a completion callback - reboot() cannot ' +
        'possibly wait for the EEPROM write to be acknowledged by the FC. This is the exact ' +
        'condition behind GitHub issue #11721 (new geozones not persisted).'
    );
    assert.equal(
        eepromWriteAckedWhenRebootFired,
        true,
        `reboot() fired before the FC acknowledged MSP_EEPROM_WRITE (eepromWriteAcked was ` +
        `${eepromWriteAckedWhenRebootFired} at the moment reboot() ran). This races the EEPROM ` +
        `flash write against MSP_SET_REBOOT, matching the observed real-hardware symptom: after ` +
        `adding a geozone and clicking "Save Eeprom Geozones and reboot", the FC reported 0 saved ` +
        `geozones once reconnected.`
    );
});

test('positive control: a fixed handler that gates reboot() on saveToEeprom()\'s callback passes the same assertions', async () => {
    // Not the real handler - a hand-written stand-in for what the fix would
    // look like, run through the exact same mocks/harness as the repro
    // test above. This exists purely to prove the assertions above are
    // capable of passing at all (i.e. they aren't vacuously always-failing),
    // so a failure in the repro test above can be trusted to mean the real
    // production code is unfixed, not that the test itself is broken.
    const fixedHandlerBody = `
        if (invalidGeoZones) {
            dialog.alert(i18n.getMessage("geozoneUnableToSave"));
            return;
        }
        if (await dialog.confirm(i18n.getMessage("missionGeozoneReboot"))) {
            $(event.currentTarget).addClass('disabled');
            GUI.log('Start of sending Geozones');
            mspHelper.saveGeozones(() => {
                mspHelper.saveToEeprom(() => {
                    GUI.log('End of sending Geozones');
                    reboot();
                });
            });
        }
    `;
    const { state, rebootCalled, eepromWriteAckedWhenRebootFired } = await runHandlerAndCollect(fixedHandlerBody);

    assert.equal(rebootCalled, true, 'sanity: reboot() must still eventually be called by the fixed handler');
    assert.equal(state.saveToEepromCallbackProvided, true, 'the fixed handler must pass a completion callback to saveToEeprom()');
    assert.equal(eepromWriteAckedWhenRebootFired, true, 'the fixed handler must not call reboot() until the FC has acknowledged the EEPROM write');
});
