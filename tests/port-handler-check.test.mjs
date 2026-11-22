#!/usr/bin/env node
/**
 * Port detection (js/port_handler.js) and the port the Connect button opens.
 *
 * PortHandler.check() polls the serial ports and schedules itself again every
 * 250 ms. That rescheduling sat at the end of the getDevices() .then(), so a
 * throw anywhere in it (as updateManualPortVisibility() did with no port
 * option selected) or a rejected getDevices() stopped port detection for the
 * rest of the session, with an unhandled rejection. Now the retry runs from
 * .finally() and the failure is logged once per streak.
 *
 * PortHandler.selected_port_name() replaces the inline read in reConnect()
 * (js/serial_backend.js) and getTarget() (tabs/firmware_flasher.js), which
 * turned "no option selected" into a port named "null" via String().
 *
 * Runs the real port_handler.js with only its imports rewritten. The port
 * <select> is modelled with what jQuery returns for it (no jsdom in the repo):
 * .data() of an empty match is undefined, .val() of a select with nothing
 * selected is null.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { dataModule } from './helpers/dataModule.mjs';
import { makeHarness } from './helpers/harness.mjs';

const { repoRoot, rewriteAndWrite } = makeHarness(import.meta.url, 'port-handler-check.test.mjs', 'port-handler-check-');

const STUBS_ID = '__portHandlerCheckStubs';
const stubs = globalThis[STUBS_ID] = {
    GUI: { connected_to: false, updateManualPortVisibility() {} },
    // Each getDevices() call takes the next entry; when they run out the call
    // never settles, which ends the 250 ms polling loop.
    devices: [],
    getDevicesCalls: 0,
};

const portHandlerUrl = rewriteAndWrite('js/port_handler.js', [
    [/^import GUI from '\.\/\.\.\/js\/gui';$/m, `import GUI from '${dataModule(`export default globalThis['${STUBS_ID}'].GUI;`)}';`, "import GUI"],
    [/^import ConnectionSerial from '\.\/connection\/connectionSerialTransport';$/m, `import ConnectionSerial from '${dataModule(`
        const stubs = globalThis['${STUBS_ID}'];
        export default {
            getDevices() {
                stubs.getDevicesCalls++;
                const next = stubs.devices.shift();
                return next ? next() : new Promise(() => {});
            },
        };
    `)}';`, "import ConnectionSerial"],
    [/^import store from '\.\/store';$/m, `import store from '${dataModule('export default { get(key, fallback) { return fallback; } };')}';`, "import store"],
    [/^import i18n from '\.\/\.\.\/js\/localization';$/m, `import i18n from '${dataModule('export default { getMessage(key) { return key; } };')}';`, "import i18n"],
], 'port_handler-generated');

const { PortHandler } = await import(portHandlerUrl);

// No ports, none added or removed: check() reaches its end without touching the DOM.
PortHandler.initial_ports = [];
PortHandler.check_usb_devices = () => {};

const noPorts = () => Promise.resolve([]);
const failingGetDevices = () => Promise.reject(new Error('serial backend gone'));

/** Runs check() until the scripted getDevices() replies are used up; returns the console errors. */
async function runChecks(replies) {
    stubs.devices = [...replies];
    stubs.getDevicesCalls = 0;
    const errors = [];
    const realConsoleError = console.error;
    console.error = (...args) => { errors.push(args); };
    try {
        PortHandler.check();
        const deadline = Date.now() + 250 * replies.length + 2000;
        while (stubs.getDevicesCalls <= replies.length && Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 25));
        }
    } finally {
        console.error = realConsoleError;
    }
    return errors;
}

test('a rejected getDevices() does not stop port detection, and is logged once per streak', async () => {
    const errors = await runChecks([failingGetDevices, failingGetDevices, failingGetDevices, noPorts, failingGetDevices, noPorts]);

    assert.equal(stubs.getDevicesCalls, 7, 'check() must keep polling after each failure');
    assert.equal(errors.length, 2, 'one line for the streak of three, one for the next failure after the recovery');
    assert.match(String(errors[0][0]), /PortHandler - port check failed/);
});

test('a throw while handling the port list does not stop port detection', async () => {
    let throwOnce = true;
    stubs.GUI.updateManualPortVisibility = () => {
        if (throwOnce) {
            throwOnce = false;
            throw new TypeError("Cannot read properties of undefined (reading 'isManual')");
        }
    };
    try {
        const errors = await runChecks([noPorts, noPorts]);
        assert.equal(stubs.getDevicesCalls, 3, 'check() must run again after the throw');
        assert.equal(errors.length, 1);
    } finally {
        stubs.GUI.updateManualPortVisibility = () => {};
    }
});

/** The two jQuery objects selected_port_name() reads, as jQuery answers for them. */
function portPicker(selectedOptionData, selectValue, overrideValue = '/dev/rfcomm0') {
    return [
        { find: (selector) => ({ data: () => (selector === 'option:selected' ? selectedOptionData : undefined) }), val: () => selectValue },
        { val: () => overrideValue },
    ];
}

test('selected_port_name: no option selected is null, not the port "null"', () => {
    assert.equal(PortHandler.selected_port_name(...portPicker(undefined, null)), null);
});

test('selected_port_name: Manual Selection uses the override, a listed port its value', () => {
    assert.equal(PortHandler.selected_port_name(...portPicker({ isManual: true }, 'manual')), '/dev/rfcomm0');
    assert.equal(PortHandler.selected_port_name(...portPicker({ isManual: false }, '/dev/ttyACM0')), '/dev/ttyACM0');
    assert.equal(PortHandler.selected_port_name(...portPicker({ isTcp: true }, 'tcp')), 'tcp');
});

test('reConnect() and getTarget() read the port through selected_port_name()', () => {
    // Both live in DOM-bound modules (jQuery, jBox, Electron IPC), so their wiring is checked in the source.
    const backend = readFileSync(join(repoRoot, 'js/serial_backend.js'), 'utf8');
    assert.ok(backend.includes('var selected_port = PortHandler.selected_port_name(privateScope.$port, publicScope.$portOverride);'));
    assert.match(backend, /else if \(isIdle && selected_port === null\) \{/, 'reConnect() must stay idle with no port selected');
    const flasher = readFileSync(join(repoRoot, 'tabs/firmware_flasher.js'), 'utf8');
    assert.ok(flasher.includes("var selected_port = PortHandler.selected_port_name($('#port'), $('#port-override'));"));
    assert.match(flasher, /if \(!selected_port \|\| selected_port == '0'\) \{\s*GUI\.log\(i18n\.getMessage\('targetPrefetchFailNoPort'\)\);/,
        "getTarget()'s no-port branch must catch null");
});
