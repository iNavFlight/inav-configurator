#!/usr/bin/env node
/**
 * MSP.read_until_idle() hands the CLI tab only what follows an MSP response that
 * was cut by the tab switch (js/serial_backend.js read_serial). The real js/msp.js
 * is loaded with its extensionless imports rewritten to absolute file URLs; no
 * statement of the decoder is changed.
 */

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tmpDir = mkdtempSync(join(tmpdir(), 'msp-read-until-idle-'));
process.on('exit', () => rmSync(tmpDir, { recursive: true, force: true }));

const realUrl = (relPath) => pathToFileURL(join(repoRoot, relPath)).href;

function rewrite(relPath, rules, outName) {
    let source = readFileSync(join(repoRoot, relPath), 'utf8');
    for (const [regex, replacement] of rules) {
        if (!regex.test(source)) {
            throw new Error(`msp-read-until-idle.test.mjs: ${regex} no longer matches ${relPath}; update the rewrite rules`);
        }
        source = source.replace(regex, replacement);
    }
    const outPath = join(tmpDir, outName + '.mjs');
    writeFileSync(outPath, source, 'utf8');
    return pathToFileURL(outPath).href;
}

// The intervals are unref'd only so node --test can exit; they run as before.
const eventFrequencyAnalyzerUrl = rewrite('js/eventFrequencyAnalyzer.js', [
    [/privateScope\.intervalHandler = setInterval\(publicScope\.analyze, bufferPeriod\);/g, 'privateScope.intervalHandler = setInterval(publicScope.analyze, bufferPeriod).unref();'],
], 'eventFrequencyAnalyzer');
const serialQueueUrl = rewrite('js/serial_queue.js', [
    [/^import CONFIGURATOR from '\.\/data_storage';$/m, `import CONFIGURATOR from '${realUrl('js/data_storage.js')}';`],
    [/^import MSPCodes from '\.\/msp\/MSPCodes';$/m, `import MSPCodes from '${realUrl('js/msp/MSPCodes.js')}';`],
    [/^import SimpleSmoothFilter from '\.\/simple_smooth_filter';$/m, `import SimpleSmoothFilter from '${realUrl('js/simple_smooth_filter.js')}';`],
    [/^import eventFrequencyAnalyzer from '\.\/eventFrequencyAnalyzer';$/m, `import eventFrequencyAnalyzer from '${eventFrequencyAnalyzerUrl}';`],
    [/^import mspDeduplicationQueue from '\.\/msp\/mspDeduplicationQueue';$/m, `import mspDeduplicationQueue from '${realUrl('js/msp/mspDeduplicationQueue.js')}';`],
    [/setInterval\(publicScope\.executor, Math\.round\(1000 \/ privateScope\.handlerFrequency\)\);/, 'setInterval(publicScope.executor, Math.round(1000 / privateScope.handlerFrequency)).unref();'],
    [/setInterval\(publicScope\.balancer, Math\.round\(1000 \/ privateScope\.balancerFrequency\)\);/, 'setInterval(publicScope.balancer, Math.round(1000 / privateScope.balancerFrequency)).unref();'],
], 'serial_queue');
const mspUrl = rewrite('js/msp.js', [
    [/^import MSPCodes from '\.\/msp\/MSPCodes';$/m, `import MSPCodes from '${realUrl('js/msp/MSPCodes.js')}';`],
    [/^import mspQueue from '\.\/serial_queue';$/m, `import mspQueue from '${serialQueueUrl}';`],
    [/^import eventFrequencyAnalyzer from '\.\/eventFrequencyAnalyzer';$/m, `import eventFrequencyAnalyzer from '${eventFrequencyAnalyzerUrl}';`],
    [/^import timeout from '\.\/timeouts';$/m, `import timeout from '${realUrl('js/timeouts.js')}';`],
    [/^import CONFIGURATOR from '\.\/data_storage';$/m, `import CONFIGURATOR from '${realUrl('js/data_storage.js')}';`],
], 'msp');

const MSP = (await import(mspUrl)).default;

function crc8DvbS2(bytes) {
    let crc = 0;
    for (const byte of bytes) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) {
            crc = (crc & 0x80) ? ((crc << 1) ^ 0xD5) & 0xFF : (crc << 1) & 0xFF;
        }
    }
    return crc;
}

// An MSPv2 response as the FC sends it: $ X > flag code(le16) length(le16) payload crc
function responseV2(code, payload) {
    const body = [0, code & 0xFF, code >> 8, payload.length & 0xFF, payload.length >> 8, ...payload];
    return Uint8Array.from([0x24, 0x58, 0x3E, ...body, crc8DvbS2(body)]);
}

const ascii = (text) => Uint8Array.from(text, (ch) => ch.charCodeAt(0));
const concat = (...parts) => Uint8Array.from(parts.flatMap((part) => [...part]));

const MSP_ATTITUDE = 108;
const attitude = responseV2(MSP_ATTITUDE, [1, 2, 3, 4, 5, 6]);
const banner = ascii('\r\nEntering CLI Mode, type \'exit\' to return, or \'help\'\r\n\r\n# ');

let dispatched;
beforeEach(() => {
    MSP.disconnect_cleanup();
    dispatched = [];
    MSP.setProcessData((decoder) => dispatched.push({ code: decoder.code, payload: [...decoder.message_buffer_uint8_view] }));
});

test('an idle decoder takes nothing, so CLI output starting with $ reaches the CLI in full', () => {
    assert.equal(MSP.read_until_idle({ data: concat(attitude, banner).buffer }), 0);
    assert.equal(MSP.read_until_idle({ data: ascii('$ text') }), 0);
    assert.equal(MSP.state, MSP.decoder_states.IDLE);
    assert.deepEqual(dispatched, []);
});

test('the tail of a response cut by the switch completes that response and nothing more', () => {
    // WebSerial delivers an ArrayBuffer; Electron IPC (TCP, serial, UDP) and BLE a Uint8Array
    for (const asBuffer of [true, false]) {
        for (const cut of [1, 3, 8, attitude.length - 1]) {
            MSP.disconnect_cleanup();
            dispatched = [];
            MSP.read({ data: attitude.slice(0, cut).buffer });

            const chunk = concat(attitude.slice(cut), banner);
            assert.equal(MSP.read_until_idle({ data: asBuffer ? chunk.buffer : chunk }), attitude.length - cut, `cut after ${cut} bytes`);
            assert.equal(MSP.state, MSP.decoder_states.IDLE);
            assert.deepEqual(dispatched, [{ code: MSP_ATTITUDE, payload: [1, 2, 3, 4, 5, 6] }]);
        }
    }
});

test('a tail spread over several reads is taken read by read', () => {
    MSP.read({ data: attitude.slice(0, 5).buffer });

    assert.equal(MSP.read_until_idle({ data: attitude.slice(5, 9).buffer }), 4);
    assert.deepEqual(dispatched, []);
    assert.equal(MSP.read_until_idle({ data: concat(attitude.slice(9), banner).buffer }), attitude.length - 9);
    assert.equal(dispatched.length, 1);
});

test('a frame whose tail never came does not swallow the CLI banner and is dropped', () => {
    MSP.read({ data: attitude.slice(0, 10).buffer });
    MSP.last_received_timestamp = Date.now() - 1000;

    assert.equal(MSP.read_until_idle({ data: banner.buffer }), 0);
    assert.deepEqual(dispatched, []);
    assert.equal(MSP.state, MSP.decoder_states.IDLE);

    // the next frame decodes from its own first byte, not as the rest of the dropped one
    MSP.read({ data: attitude.buffer });
    assert.deepEqual(dispatched, [{ code: MSP_ATTITUDE, payload: [1, 2, 3, 4, 5, 6] }]);
});
