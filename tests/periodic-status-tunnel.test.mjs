#!/usr/bin/env node
/**
 * Status polling: a plain MSP link keeps its four requests per run; a MAVLink tunnel with the
 * telemetry feed polls MSP_SENSOR_STATUS every 500 ms (the FC's isMspConfigActive() window is
 * 1000 ms) and the other three every second run; with the feed off (A/B) the tunnel keeps
 * phase 1's single 1 Hz run. Runs the real js/periodicStatusUpdater.js with stubbed imports.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { makeHarness } from './helpers/harness.mjs';
import { dataModule } from './helpers/dataModule.mjs';

const { rewriteAndWrite } = makeHarness(import.meta.url, 'periodic-status-tunnel.test.mjs', 'periodic-status-tunnel-');

globalThis.__statusStubs = {
    sent: [],
    configurator: { connectionValid: true, cliActive: false, mavlinkTunnelActive: false, mavlinkTelemetryFeed: false, connection: { bitrate: 115200 } },
};
const stub = expression => dataModule(`export default ${expression};`);
const MSP_CODES = { MSP_SENSOR_STATUS: 151, MSPV2_INAV_STATUS: 0x2000, MSP_ACTIVEBOXES: 113, MSPV2_INAV_ANALOG: 0x2002 };

const updaterUrl = rewriteAndWrite('js/periodicStatusUpdater.js', [
    [/^import GUI from '\.\/gui';$/m, `import GUI from '${stub('{}')}';`, 'import GUI'],
    [/^import FC from '\.\/fc';$/m, `import FC from '${stub('{ isModeEnabled: () => false, ANALOG: undefined }')}';`, 'import FC'],
    [/^import CONFIGURATOR from '\.\/data_storage';$/m, `import CONFIGURATOR from '${stub('globalThis.__statusStubs.configurator')}';`, 'import CONFIGURATOR'],
    [/^import MSP from '\.\/msp';$/m, `import MSP from '${stub('{ analog_last_received_timestamp: 0, send_message: code => globalThis.__statusStubs.sent.push(code) }')}';`, 'import MSP'],
    [/^import MSPCodes from '\.\/msp\/MSPCodes';$/m, `import MSPCodes from '${stub(JSON.stringify(MSP_CODES))}';`, 'import MSPCodes'],
], 'periodicStatusUpdater-generated');

globalThis.$ = () => ({ css() {}, show() {}, removeClass() {}, addClass() {}, text() {} });
const periodicStatusUpdater = (await import(updaterUrl)).default;
const { sent, configurator } = globalThis.__statusStubs;

const ALL = [MSP_CODES.MSP_SENSOR_STATUS, MSP_CODES.MSPV2_INAV_STATUS, MSP_CODES.MSP_ACTIVEBOXES, MSP_CODES.MSPV2_INAV_ANALOG];

test('plain MSP: every run sends all four requests at the baud-rate interval', () => {
    configurator.mavlinkTunnelActive = false;
    sent.length = 0;
    periodicStatusUpdater.run();
    periodicStatusUpdater.run();
    assert.deepEqual(sent, [...ALL, ...ALL]);
    assert.equal(periodicStatusUpdater.getUpdateInterval(115200), 300);
});

test('tunnel with the telemetry feed: MSP_SENSOR_STATUS at 2 Hz, the other three at 1 Hz', () => {
    configurator.mavlinkTunnelActive = true;
    configurator.mavlinkTelemetryFeed = true;
    periodicStatusUpdater.resetTunnelCycle();
    sent.length = 0;
    assert.equal(periodicStatusUpdater.getUpdateInterval(115200), 500);
    for (let i = 0; i < 4; i++) {
        periodicStatusUpdater.run();
    }
    assert.deepEqual(sent, [...ALL, MSP_CODES.MSP_SENSOR_STATUS, ...ALL, MSP_CODES.MSP_SENSOR_STATUS]);

    // A session that ended after a full run starts the next one with a full run again.
    periodicStatusUpdater.run();
    periodicStatusUpdater.resetTunnelCycle();
    sent.length = 0;
    periodicStatusUpdater.run();
    assert.deepEqual(sent, ALL);
    configurator.mavlinkTunnelActive = false;
    configurator.mavlinkTelemetryFeed = false;
});

test('tunnel with the feed off (A/B): phase 1 behaviour, all four every 1000 ms', () => {
    configurator.mavlinkTunnelActive = true;
    configurator.mavlinkTelemetryFeed = false;
    periodicStatusUpdater.resetTunnelCycle();
    sent.length = 0;
    assert.equal(periodicStatusUpdater.getUpdateInterval(115200), 1000);
    for (let i = 0; i < 3; i++) {
        periodicStatusUpdater.run();
    }
    assert.deepEqual(sent, [...ALL, ...ALL, ...ALL]);
    configurator.mavlinkTunnelActive = false;
});
