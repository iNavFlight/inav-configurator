#!/usr/bin/env node
/**
 * Regression tests for an MSP error reply ('!') being treated as a landed write.
 *
 * The firmware answers a command it refuses with the direction byte '!'
 * instead of '>' (MSP_RESULT_ERROR, inav src/main/msp/msp_serial.c:325). For
 * MSP2_COMMON_SET_SETTING that happens e.g. when an unsigned value is above
 * the setting's maximum (inav src/main/fc/fc_msp.c:4212-4306, :4839) - the
 * value is NOT stored.
 *
 * Bug: js/msp.js records the '!' in MSP.unsupported, but the request completes
 * like any other: the callback gets { command, data, length } with nothing
 * that marks the refusal, so resolveMspWrite()/guardMspCallback() report the
 * write as landed. mspHelper.setSetting() then runs its continuation and the
 * save chain carries on to the EEPROM write and the reboot, and the user is
 * told nothing.
 *
 * Fix under test:
 *   - the completion object carries `unsupported` (an extra field - existing
 *     readers of command/data/length see no change)
 *   - resolveMspWrite()/guardMspCallback() treat an '!' reply as not landed
 *   - a refused write is reported in the GUI log and the console, both at
 *     most once per command every 3 s
 *   - a refused calibration (MSP_ACC/MAG_CALIBRATION, MSP2_INAV_OPFLOW_CALIBRATION,
 *     refused while armed, inav src/main/fc/fc_msp.c:3120-3140) is told apart
 *     from a started one
 *   - read paths that evaluate '!' on purpose (MSP2_INAV_ESC_SRXL2_STATUS,
 *     MSP2_INAV_LOGIC_CONDITIONS_CONFIGURED) keep working
 *
 * The frames go through the REAL decoder (MSP.read), the REAL queue executor,
 * the REAL MSPHelper response path and the REAL mspWriteOutcome module, loaded
 * by tests/helpers/realMspStack.mjs: only import specifiers are rewritten so
 * Node can load the Vite-style extensionless imports; no statement of the code
 * under test is touched.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { loadRealMspStack } from './helpers/realMspStack.mjs';

// FC state the read-path cases below touch; nothing else is reached.
const fcState = {
    SRXL2_STATUS: { supported: true, phase: 0, connected: false, lastResult: 0, ports: 0, motors: 0 },
    LOGIC_CONDITIONS_CONFIGURED_MASK: null,
};
const { repoRoot, FC, mspHelper, MSPCodes, MSP, mspQueue, mspDeduplicationQueue, CONFIGURATOR, GUI, i18n, mspWriteOutcome } =
    await loadRealMspStack(import.meta.url, 'msp-error-response.test.mjs', 'msp-error-response-', fcState);
const { resolveMspWrite, guardMspCallback, refusedByFc } = mspWriteOutcome;

// Same wiring configurator_main.js / serial_backend.js do at startup.
MSP.init();
mspHelper.init();

const REJECTED_KEY = 'mspWriteRejectedByFc';

/** CRC8 DVB-S2 as specified for MSPv2 - written out here, not taken from msp.js. */
function crc8DvbS2(crc, byte) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
        crc = (crc & 0x80) ? ((crc << 1) & 0xFF) ^ 0xD5 : (crc << 1) & 0xFF;
    }
    return crc;
}

/** An MSPv2 frame as the FC sends it; direction '>' for ack, '!' for MSP_RESULT_ERROR. */
function v2Reply(direction, code, payload = []) {
    const body = [0, code & 0xFF, (code >> 8) & 0xFF, payload.length & 0xFF, (payload.length >> 8) & 0xFF, ...payload];
    const crc = body.reduce(crc8DvbS2, 0);
    return Uint8Array.from([0x24, 0x58, direction.charCodeAt(0), ...body, crc]);
}

/**
 * A connection that answers every frame the real queue executor sends with the
 * given reply, fed back through the real decoder - the same path a serial or
 * TCP connection takes. Restores the disconnected state afterwards.
 */
async function withFc(replyFor, body) {
    CONFIGURATOR.cliActive = false;
    mspQueue.flush();
    mspDeduplicationQueue.flush();
    mspQueue.freeHardLock();
    mspQueue.freeSoftLock();
    mspQueue.unlock();
    MSP.parseFailures.clear();
    GUI.logged.length = 0;
    i18n.calls.length = 0;

    const sent = [];
    CONFIGURATOR.connection = {
        getTimeout() { return 1000; },
        send(buffer, onSent) {
            const frame = new Uint8Array(buffer);
            const code = frame[4] | (frame[5] << 8);
            sent.push(code);
            onSent({ bytesSent: buffer.byteLength });
            setTimeout(() => MSP.read({ data: replyFor(code).buffer }), 1);
        },
    };
    try {
        return await body(sent);
    } finally {
        CONFIGURATOR.connection = false;
        await new Promise((r) => setTimeout(r, 20)); // let the 10ms hard-lock release run
        mspQueue.flush();
        mspDeduplicationQueue.flush();
    }
}

/** Fails instead of hanging if a promise never settles. */
function within(ms, promise, what) {
    let timer;
    return Promise.race([
        promise,
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(what + ' did not settle within ' + ms + 'ms')), ms); }),
    ]).finally(() => clearTimeout(timer));
}

// A plausible MSP2_COMMON_SET_SETTING payload: "nav_rth_altitude\0" + u32.
// The firmware refuses it; its content does not matter to the configurator.
const SET_SETTING_PAYLOAD = [...Buffer.from('nav_rth_altitude\0'), 0xFF, 0xFF, 0xFF, 0xFF];

test("an '!' reply to MSPV2_SET_SETTING is not a landed write", async () => {
    await withFc((code) => v2Reply('!', code), async (sent) => {
        let continued = false;
        // The exact expression mspHelper.setSetting() uses (js/msp/MSPHelper.js, setSetting).
        const landed = await within(2000,
            resolveMspWrite(MSP.promise(MSPCodes.MSPV2_SET_SETTING, SET_SETTING_PAYLOAD), () => { continued = true; }),
            'the refused write');

        assert.deepEqual(sent, [MSPCodes.MSPV2_SET_SETTING], 'sanity: the write went out through the real queue');
        assert.equal(landed, false, 'a write the FC refused must not be reported as landed');
        assert.equal(continued, false, 'the save chain (EEPROM write, reboot) must not continue after a refused write');

        // The notice is rate-limited per command, so this is checked on the first refusal.
        assert.ok(GUI.logged.includes(REJECTED_KEY), 'the GUI log must say the FC refused the write');
        const call = i18n.calls.find((c) => c.key === REJECTED_KEY);
        assert.deepEqual(call.subs, ['MSPV2_SET_SETTING'], 'the message must name the refused command');
    });
});

test("an '!' reply stops a guardMspCallback chain", async () => {
    await withFc((code) => v2Reply('!', code), async () => {
        let advanced = false;
        let completed;
        const done = new Promise((resolve) => { completed = resolve; });
        // As in mspHelper.sendLedStripColors(): guardMspCallback() wraps the next step.
        const guarded = guardMspCallback(() => { advanced = true; });
        MSP.send_message(MSPCodes.MSP_SET_LED_COLORS, [0, 0, 0, 0], false, (resp) => { guarded(resp); completed(resp); });
        const resp = await within(2000, done, 'the LED colour write');

        assert.notEqual(resp, false, 'sanity: the request completed with a response, it was not dropped');
        assert.equal(advanced, false, 'a refused write must not advance a chained send');
        assert.ok(GUI.logged.includes(REJECTED_KEY), 'the GUI log must say the FC refused the write');
    });
});

test("positive control: a '>' ack still lands and logs no refusal", async () => {
    await withFc((code) => v2Reply('>', code), async () => {
        let continued = false;
        const landed = await within(2000,
            resolveMspWrite(MSP.promise(MSPCodes.MSPV2_SET_SETTING, SET_SETTING_PAYLOAD), () => { continued = true; }),
            'the acknowledged write');

        assert.equal(landed, true);
        assert.equal(continued, true);
        assert.equal(GUI.logged.includes(REJECTED_KEY), false, 'an ack must not be reported as a refusal');
    });
});

test("the completion object keeps command/data/length for an '!' reply", async () => {
    // Every caller that reads resp.data / resp.command today must keep getting them.
    await withFc((code) => v2Reply('!', code), async () => {
        const resp = await within(2000, MSP.promise(MSPCodes.MSPV2_SET_SETTING, SET_SETTING_PAYLOAD), 'the refused write');

        assert.equal(resp.command, MSPCodes.MSPV2_SET_SETTING);
        assert.equal(resp.length, 0);
        assert.equal(resp.data.byteLength, 0);
    });
});

test("read path kept: MSP2_INAV_ESC_SRXL2_STATUS '!' still marks the driver as missing", async () => {
    FC.SRXL2_STATUS.supported = true;
    await withFc((code) => v2Reply('!', code), async () => {
        const resp = await within(2000, MSP.promise(MSPCodes.MSP2_INAV_ESC_SRXL2_STATUS), 'the SRXL2 status read');

        assert.equal(FC.SRXL2_STATUS.supported, false, 'an FC without the Smart ESC driver must still read as unsupported');
        assert.notEqual(resp, false, 'the read must still complete with a response object');
        assert.equal(GUI.logged.includes(REJECTED_KEY), false, 'an unsupported read is not a refused write');
        assert.equal(MSP.parseFailures.size, 0, 'the expected refusal must not count as an unreadable response');
    });
});

test("read path kept: MSP2_INAV_LOGIC_CONDITIONS_CONFIGURED '!' leaves the mask unset", async () => {
    FC.LOGIC_CONDITIONS_CONFIGURED_MASK = null;
    await withFc((code) => v2Reply('!', code), async () => {
        await within(2000, MSP.promise(MSPCodes.MSP2_INAV_LOGIC_CONDITIONS_CONFIGURED), 'the LC mask read');

        assert.equal(FC.LOGIC_CONDITIONS_CONFIGURED_MASK, null, 'older firmware answering "!" must keep the mask null');
        assert.equal(GUI.logged.includes(REJECTED_KEY), false);
    });
});

test("a periodic write refused again and again is reported once, in the log and in the console", async () => {
    // The motor wizard (tabs/mixer.js) repeats MSP_SET_MOTOR every 10 ms.
    const consoleErrors = [];
    const realConsoleError = console.error;
    console.error = (...args) => { consoleErrors.push(args.join(' ')); };
    try {
        await withFc((code) => v2Reply('!', code), async () => {
            for (let i = 0; i < 5; i++) {
                await within(2000, MSP.promise(MSPCodes.MSP_SET_MOTOR, new Array(16).fill(0)), 'motor write ' + i);
            }
        });
    } finally {
        console.error = realConsoleError;
    }
    const refusals = consoleErrors.filter((line) => line.includes('MSP_SET_MOTOR'));
    assert.equal(refusals.length, 1, 'the console must not get one line per refused repeat');
    assert.equal(i18n.calls.filter((c) => c.key === REJECTED_KEY).length, 1, 'nor the GUI log');
});

const CALIBRATION_STARTS = [
    ['MSP_ACC_CALIBRATION', 'initialSetupAccelCalibStarted'],
    ['MSP_MAG_CALIBRATION', 'initialSetupMagCalibStarted'],
    ['MSP2_INAV_OPFLOW_CALIBRATION', 'initialSetupOpflowCalibStarted'],
];

test("an '!' reply to a calibration reads as refused, a '>' ack as started", async () => {
    for (const [name] of CALIBRATION_STARTS) {
        await withFc((code) => v2Reply('!', code), async () => {
            const resp = await within(2000, MSP.promise(MSPCodes[name]), name + ' refused');
            assert.equal(refusedByFc(resp), true, name + ": an '!' reply means the calibration did not start");
            assert.equal(GUI.logged.includes(REJECTED_KEY), false, name + ' stores nothing, so no "Not saved" notice');
        });
        await withFc((code) => v2Reply('>', code), async () => {
            const resp = await within(2000, MSP.promise(MSPCodes[name]), name + ' acknowledged');
            assert.equal(refusedByFc(resp), false, name + ': an ack means the calibration started');
        });
    }
    assert.equal(refusedByFc(false), false, 'a dropped request is not a refusal by the FC');
});

test('the calibration tab logs each start through the refusal check', () => {
    // tabs/calibration.js needs jQuery, jBox and the DOM, so its wiring is checked in the source.
    const source = readFileSync(join(repoRoot, 'tabs/calibration.js'), 'utf8');
    assert.match(source, /refusedByFc\(response\) \? 'calibrationRefusedByFc' : startedKey/);
    for (const [name, startedKey] of CALIBRATION_STARTS) {
        assert.ok(source.includes(`MSP.send_message(MSPCodes.${name}, false, false, logCalibrationStart('${startedKey}'));`),
            `${name} must log through logCalibrationStart()`);
    }
});

test('the refusal messages exist in the English locale', () => {
    const messages = JSON.parse(readFileSync(join(repoRoot, 'locale/en/messages.json'), 'utf8'));
    assert.ok(messages[REJECTED_KEY] && messages[REJECTED_KEY].message.includes('$1'),
        `${REJECTED_KEY} must exist in locale/en/messages.json and name the command via $1`);
    assert.ok(messages.calibrationRefusedByFc, 'calibrationRefusedByFc must exist in locale/en/messages.json');
});
