import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import ltmDecoder from '../js/ltmDecoder.js';

const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));

test('LTM decoder accepts a valid frame and reset clears its connection state', () => {
    ltmDecoder.reset();

    // $TS followed by seven payload bytes and their XOR checksum.
    const frame = Uint8Array.from([0x24, 0x54, 0x53, 1, 2, 3, 4, 5, 6, 7, 0]);
    ltmDecoder.read({ data: frame.buffer });

    assert.equal(ltmDecoder.isReceiving(), true);
    assert.equal(ltmDecoder.get().voltage, 513);

    ltmDecoder.reset();

    assert.equal(ltmDecoder.isReceiving(), false);
    assert.equal(ltmDecoder.wasEverReceiving(), false);
    assert.equal(ltmDecoder.get().voltage, null);
});

test('a detected MSP stream does not route arbitrary payload bytes to LTM', () => {
    const serialBackend = readFileSync(resolve(repoRoot, 'js/serial_backend.js'), 'utf8');

    assert.match(serialBackend, /addOnReceiveListener\(publicScope\.read_ltm\)/);
    assert.match(serialBackend, /publicScope\.read_ltm\s*=\s*function\s*\(info\)\s*\{[\s\S]*?if\s*\(!CONFIGURATOR\.connectionValid\s*&&\s*!MSP\.wasEverReceiving\(\)\)\s*\{[\s\S]*?ltmDecoder\.read\(info\);/);
    assert.match(serialBackend, /else if\s*\(MSP\.wasEverReceiving\(\)\)\s*\{[\s\S]*?ltmDecoder\.reset\(\);/);
    assert.match(serialBackend, /if\s*\(!CONFIGURATOR\.connectionValid\s*&&\s*!MSP\.wasEverReceiving\(\)\s*&&\s*ltmDecoder\.isReceiving\(\)\)/);
});
