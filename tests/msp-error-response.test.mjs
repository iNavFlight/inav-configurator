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
 *   - a refused write is reported in the GUI log
 *   - read paths that evaluate '!' on purpose (MSP2_INAV_ESC_SRXL2_STATUS,
 *     MSP2_INAV_LOGIC_CONDITIONS_CONFIGURED) keep working
 *
 * The frames go through the REAL decoder (MSP.read), the REAL queue executor,
 * the REAL MSPHelper response path and the REAL mspWriteOutcome module. As in
 * tests/msp-parse-failure-recovery.test.mjs only import specifiers are
 * rewritten so Node can load the Vite-style extensionless imports; no
 * statement of the code under test is touched.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { dataModule } from './helpers/dataModule.mjs';
import { makeHarness } from './helpers/harness.mjs';

const { repoRoot, rewriteAndWrite } = makeHarness(import.meta.url, 'msp-error-response.test.mjs', 'msp-error-response-');

function realModuleUrl(relPath) {
    return pathToFileURL(join(repoRoot, relPath)).href;
}

const realMspCodesUrl = realModuleUrl('js/msp/MSPCodes.js');
const realTimeoutsUrl = realModuleUrl('js/timeouts.js');
const realConfiguratorUrl = realModuleUrl('js/data_storage.js');
const realDedupUrl = realModuleUrl('js/msp/mspDeduplicationQueue.js');
const realStatisticsUrl = realModuleUrl('js/msp/mspStatistics.js');
const realSmoothFilterUrl = realModuleUrl('js/simple_smooth_filter.js');
const realInjectedMethodsUrl = realModuleUrl('js/injected_methods.js');
const realMspWriteOutcomeUrl = realModuleUrl('js/mspWriteOutcome.js');
const realBitHelperUrl = realModuleUrl('js/bitHelper.js');

// The queue's intervals are un-refed only so `node --test` can exit; how and
// when they run is unchanged.
const realEventFrequencyAnalyzerUrl = rewriteAndWrite('js/eventFrequencyAnalyzer.js', [
    [/privateScope\.intervalHandler = setInterval\(publicScope\.analyze, bufferPeriod\);/g, 'privateScope.intervalHandler = setInterval(publicScope.analyze, bufferPeriod).unref();', "analyze setInterval"],
], 'eventFrequencyAnalyzer-generated');

const realMspQueueUrl = rewriteAndWrite('js/serial_queue.js', [
    [/^import CONFIGURATOR from '\.\/data_storage';$/m, `import CONFIGURATOR from '${realConfiguratorUrl}';`, "import CONFIGURATOR"],
    [/^import MSPCodes from '\.\/msp\/MSPCodes';$/m, `import MSPCodes from '${realMspCodesUrl}';`, "import MSPCodes"],
    [/^import SimpleSmoothFilter from '\.\/simple_smooth_filter';$/m, `import SimpleSmoothFilter from '${realSmoothFilterUrl}';`, "import SimpleSmoothFilter"],
    [/^import eventFrequencyAnalyzer from '\.\/eventFrequencyAnalyzer';$/m, `import eventFrequencyAnalyzer from '${realEventFrequencyAnalyzerUrl}';`, "import eventFrequencyAnalyzer"],
    [/^import mspDeduplicationQueue from '\.\/msp\/mspDeduplicationQueue';$/m, `import mspDeduplicationQueue from '${realDedupUrl}';`, "import mspDeduplicationQueue"],
    [/setInterval\(publicScope\.executor, Math\.round\(1000 \/ privateScope\.handlerFrequency\)\);/, 'setInterval(publicScope.executor, Math.round(1000 / privateScope.handlerFrequency)).unref();', "executor setInterval"],
    [/setInterval\(publicScope\.balancer, Math\.round\(1000 \/ privateScope\.balancerFrequency\)\);/, 'setInterval(publicScope.balancer, Math.round(1000 / privateScope.balancerFrequency)).unref();', "balancer setInterval"],
], 'serial_queue-generated');

const realMspUrl = rewriteAndWrite('js/msp.js', [
    [/^import MSPCodes from '\.\/msp\/MSPCodes';$/m, `import MSPCodes from '${realMspCodesUrl}';`, "import MSPCodes"],
    [/^import mspQueue from '\.\/serial_queue';$/m, `import mspQueue from '${realMspQueueUrl}';`, "import mspQueue"],
    [/^import eventFrequencyAnalyzer from '\.\/eventFrequencyAnalyzer';$/m, `import eventFrequencyAnalyzer from '${realEventFrequencyAnalyzerUrl}';`, "import eventFrequencyAnalyzer"],
    [/^import timeout from '\.\/timeouts';$/m, `import timeout from '${realTimeoutsUrl}';`, "import timeout"],
    [/^import CONFIGURATOR from '\.\/data_storage';$/m, `import CONFIGURATOR from '${realConfiguratorUrl}';`, "import CONFIGURATOR"],
], 'msp-generated');

// FC state the read-path cases below touch; nothing else is reached.
const FC_STATE_ID = '__mspErrorResponseFcState';
globalThis[FC_STATE_ID] = {
    SRXL2_STATUS: { supported: true, phase: 0, connected: false, lastResult: 0, ports: 0, motors: 0 },
    LOGIC_CONDITIONS_CONFIGURED_MASK: null,
};
const fcStubUrl = dataModule(`
    const FC = globalThis['${FC_STATE_ID}'];
    export default FC;
`);
const inertDefaultUrl = dataModule('export default {};');
const guiStubUrl = dataModule(`
    const GUI = { logged: [], log(message) { GUI.logged.push(message); } };
    export default GUI;
`);
// Records the substitutions too, so the test can check what the user is told.
const i18nStubUrl = dataModule(`
    const i18n = { calls: [], getMessage(key, subs) { i18n.calls.push({ key, subs }); return key; } };
    export default i18n;
`);
const inertFwApproachUrl = dataModule('export const FwApproach = class {};');
const inertDronecanAsyncRequestParseUrl = dataModule('export const parseDronecanAsyncRequestResponse = () => null;');
const inertGeozoneUrl = dataModule(`
    export const Geozone = class {};
    export const GeozoneVertex = class {};
    export const GeozoneShapes = {};
`);

const realMspHelperUrl = rewriteAndWrite('js/msp/MSPHelper.js', [
    [/^import semver from 'semver';$/m, `import semver from '${inertDefaultUrl}';`, "import semver"],
    [/^import '\.\/\.\.\/injected_methods';$/m, `import '${realInjectedMethodsUrl}';`, "import injected_methods"],
    [/^import GUI from '\.\/\.\.\/gui';$/m, `import GUI from '${guiStubUrl}';`, "import GUI"],
    [/^import i18n from '\.\/\.\.\/localization';$/m, `import i18n from '${i18nStubUrl}';`, "import i18n"],
    [/^import MSP from '\.\/\.\.\/msp';$/m, `import MSP from '${realMspUrl}';`, "import MSP"],
    [/^import MSPCodes from '\.\/MSPCodes';$/m, `import MSPCodes from '${realMspCodesUrl}';`, "import MSPCodes"],
    [/^import FC from '\.\/\.\.\/fc';$/m, `import FC from '${fcStubUrl}';`, "import FC"],
    [/^import VTX from '\.\/\.\.\/vtx';$/m, `import VTX from '${inertDefaultUrl}';`, "import VTX"],
    [/^import mspQueue from '\.\/\.\.\/serial_queue';$/m, `import mspQueue from '${realMspQueueUrl}';`, "import mspQueue"],
    [/^import ServoMixRule from '\.\/\.\.\/servoMixRule';$/m, `import ServoMixRule from '${inertDefaultUrl}';`, "import ServoMixRule"],
    [/^import MotorMixRule from '\.\/\.\.\/motorMixRule';$/m, `import MotorMixRule from '${inertDefaultUrl}';`, "import MotorMixRule"],
    [/^import LogicCondition from '\.\/\.\.\/logicCondition';$/m, `import LogicCondition from '${inertDefaultUrl}';`, "import LogicCondition"],
    [/^import BitHelper from '\.\.\/bitHelper';$/m, `import BitHelper from '${realBitHelperUrl}';`, "import BitHelper"],
    [/^import serialPortHelper from '\.\/\.\.\/serialPortHelper';$/m, `import serialPortHelper from '${inertDefaultUrl}';`, "import serialPortHelper"],
    [/^import ProgrammingPid from '\.\/\.\.\/programmingPid';$/m, `import ProgrammingPid from '${inertDefaultUrl}';`, "import ProgrammingPid"],
    [/^import Safehome from '\.\/\.\.\/safehome';$/m, `import Safehome from '${inertDefaultUrl}';`, "import Safehome"],
    [/^import \{ FwApproach \} from '\.\/\.\.\/fwApproach';$/m, `import { FwApproach } from '${inertFwApproachUrl}';`, "import FwApproach"],
    [/^import \{ parseDronecanAsyncRequestResponse \} from '\.\/\.\.\/dronecanAsyncRequestParse';$/m, `import { parseDronecanAsyncRequestResponse } from '${inertDronecanAsyncRequestParseUrl}';`, "import parseDronecanAsyncRequestResponse"],
    [/^import Waypoint from '\.\/\.\.\/waypoint';$/m, `import Waypoint from '${inertDefaultUrl}';`, "import Waypoint"],
    [/^import mspDeduplicationQueue from '\.\/mspDeduplicationQueue';$/m, `import mspDeduplicationQueue from '${realDedupUrl}';`, "import mspDeduplicationQueue"],
    [/^import mspStatistics from '\.\/mspStatistics';$/m, `import mspStatistics from '${realStatisticsUrl}';`, "import mspStatistics"],
    [/^import \{ resolveMspWrite, guardMspCallback \} from '\.\/\.\.\/mspWriteOutcome';$/m, `import { resolveMspWrite, guardMspCallback } from '${realMspWriteOutcomeUrl}';`, "import resolveMspWrite, guardMspCallback"],
    [/^import settingsCache from '\.\/\.\.\/settingsCache';$/m, `import settingsCache from '${inertDefaultUrl}';`, "import settingsCache"],
    [/^import \{Geozone, GeozoneVertex, GeozoneShapes \} from '\.\/\.\.\/geozone';$/m, `import { Geozone, GeozoneVertex, GeozoneShapes } from '${inertGeozoneUrl}';`, "import Geozone"],
], 'MSPHelper-generated');

const { default: mspHelper } = await import(realMspHelperUrl);
const { default: MSPCodes } = await import(realMspCodesUrl);
const { default: MSP } = await import(realMspUrl);
const { default: mspQueue } = await import(realMspQueueUrl);
const { default: mspDeduplicationQueue } = await import(realDedupUrl);
const { default: CONFIGURATOR } = await import(realConfiguratorUrl);
const { default: GUI } = await import(guiStubUrl);
const { default: i18n } = await import(i18nStubUrl);
const { resolveMspWrite, guardMspCallback } = await import(realMspWriteOutcomeUrl);

const FC = globalThis[FC_STATE_ID];

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

test('the refusal message exists in the English locale', () => {
    const messages = JSON.parse(readFileSync(join(repoRoot, 'locale/en/messages.json'), 'utf8'));
    assert.ok(messages[REJECTED_KEY] && messages[REJECTED_KEY].message.includes('$1'),
        `${REJECTED_KEY} must exist in locale/en/messages.json and name the command via $1`);
});
