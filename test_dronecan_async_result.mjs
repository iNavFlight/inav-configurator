#!/usr/bin/env node
/**
 * Test: MSP2_INAV_DRONECAN_ASYNC_RESULT decoder
 *
 * Mirrors the parsing logic in MSPHelper.js case MSP2_INAV_DRONECAN_ASYNC_RESULT.
 * Run with: node test_dronecan_async_result.mjs
 *
 * Wire format (state, seq, service_id, node_id always present):
 *   [0]     state       uint8  (0=IDLE, 1=PENDING, 2=READY, 3=ERROR)
 *   [1]     seq         uint8
 *   [2..3]  service_id  uint16 LE
 *   [4]     node_id     uint8
 *
 * When state == READY (2), followed by:
 *   [5]     name_len    uint8
 *   [6..]   name        name_len bytes
 *
 * Then for service_id == 1 (GETNODEINFO):
 *   sw_major(1) sw_minor(1) sw_optional_field_flags(1) sw_vcs_commit(4 LE)
 *   hw_major(1) hw_minor(1) hw_unique_id(16)
 *
 * Then for service_id == 11 (PARAM_GETSET):
 *   value_type(1) followed by:
 *     type 1 (INT):    lo(4 LE) hi(4 LE)
 *     type 2 (FLOAT):  float32(4 LE)
 *     type 3 (BOOL):   uint8(1)
 *     type 4 (STRING): slen(1) str[slen]
 */

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✓ ${message}`);
        passed++;
    } else {
        console.log(`  ✗ ${message}`);
        failed++;
    }
}

function assertEqual(actual, expected, message) {
    const ok = actual === expected ||
               (typeof actual === 'bigint' && actual === BigInt(expected)) ||
               (typeof expected === 'bigint' && BigInt(actual) === expected);
    if (ok) {
        console.log(`  ✓ ${message}`);
        passed++;
    } else {
        console.log(`  ✗ ${message} — expected ${expected}, got ${actual}`);
        failed++;
    }
}

// ---------------------------------------------------------------------------
// Parser — mirrors MSPHelper.js case MSP2_INAV_DRONECAN_ASYNC_RESULT exactly
// ---------------------------------------------------------------------------
function parseAsyncResult(data) {
    if (data.byteLength < 5) return null;

    const state      = data.getUint8(0);
    const seq        = data.getUint8(1);
    const service_id = data.getUint16(2, true);
    const node_id    = data.getUint8(4);
    const result     = { state, seq, service_id, node_id };

    if (state === 2) { // READY
        let offset = 5;
        const name_len = data.getUint8(offset++);
        result.name = String.fromCharCode(
            ...new Uint8Array(data.buffer, data.byteOffset + offset, name_len));
        offset += name_len;

        if (service_id === 1) { // GETNODEINFO
            result.sw_major                = data.getUint8(offset++);
            result.sw_minor                = data.getUint8(offset++);
            result.sw_optional_field_flags = data.getUint8(offset++);
            result.sw_vcs_commit           = data.getUint32(offset, true); offset += 4;
            result.hw_major                = data.getUint8(offset++);
            result.hw_minor                = data.getUint8(offset++);
            result.hw_unique_id            = new Uint8Array(data.buffer, data.byteOffset + offset, 16);
        } else if (service_id === 11) { // PARAM_GETSET
            result.value_type = data.getUint8(offset++);
            switch (result.value_type) {
                case 1: { // INT
                    const lo  = data.getUint32(offset, true);
                    const hi  = data.getUint32(offset + 4, true);
                    const big = BigInt(hi) * BigInt(0x100000000) + BigInt(lo);
                    result.value = (big >= BigInt(Number.MIN_SAFE_INTEGER) &&
                                    big <= BigInt(Number.MAX_SAFE_INTEGER))
                                   ? Number(big) : big;
                    break;
                }
                case 2: // FLOAT
                    result.value = data.getFloat32(offset, true);
                    break;
                case 3: // BOOL
                    result.value = data.getUint8(offset) !== 0;
                    break;
                case 4: { // STRING
                    const slen = data.getUint8(offset++);
                    result.value = String.fromCharCode(
                        ...new Uint8Array(data.buffer, data.byteOffset + offset, slen));
                    break;
                }
                default:
                    result.value = null;
            }
        }
    }

    return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makePrefix(state, seq, service_id, node_id) {
    const buf  = new ArrayBuffer(5);
    const view = new DataView(buf);
    view.setUint8(0,  state);
    view.setUint8(1,  seq);
    view.setUint16(2, service_id, true);
    view.setUint8(4,  node_id);
    return new Uint8Array(buf);
}

function appendName(arr, name) {
    const enc = new TextEncoder().encode(name);
    return new Uint8Array([...arr, enc.length, ...enc]);
}

function concat(...arrays) {
    const total = arrays.reduce((n, a) => n + a.length, 0);
    const out   = new Uint8Array(total);
    let offset  = 0;
    for (const a of arrays) { out.set(a, offset); offset += a.length; }
    return out;
}

function u8(...bytes)       { return new Uint8Array(bytes); }
function u32le(v)           { const b = new ArrayBuffer(4); new DataView(b).setUint32(0, v, true); return new Uint8Array(b); }
function f32le(v)           { const b = new ArrayBuffer(4); new DataView(b).setFloat32(0, v, true); return new Uint8Array(b); }
function i64le(lo, hi)      { return new Uint8Array([...u32le(lo), ...u32le(hi)]); }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

console.log('\nTest: payload too short (< 5 bytes) → null');
{
    const r = parseAsyncResult(new DataView(new ArrayBuffer(4)));
    assert(r === null, 'returns null for < 5 bytes');
}

console.log('\nTest: PENDING state — prefix only, no name or value');
{
    const raw = makePrefix(1 /*PENDING*/, 7, 1, 42);
    const r   = parseAsyncResult(new DataView(raw.buffer));
    assert(r !== null,          'parses without error');
    assertEqual(r.state,      1, 'state = PENDING');
    assertEqual(r.seq,        7, 'seq');
    assertEqual(r.service_id, 1, 'service_id');
    assertEqual(r.node_id,   42, 'node_id');
    assert(r.name === undefined, 'name absent for non-READY state');
}

console.log('\nTest: ERROR state — prefix only');
{
    const raw = makePrefix(3 /*ERROR*/, 2, 11, 10);
    const r   = parseAsyncResult(new DataView(raw.buffer));
    assert(r !== null,           'parses without error');
    assertEqual(r.state,      3, 'state = ERROR');
    assertEqual(r.service_id, 11, 'service_id');
    assert(r.name === undefined,  'name absent for ERROR state');
}

console.log('\nTest: READY GetNodeInfo — name and version fields');
{
    const name = 'com.example.gps';
    const uid  = new Uint8Array(Array.from({ length: 16 }, (_, i) => 0xA0 + i));
    const raw  = concat(
        makePrefix(2 /*READY*/, 3, 1 /*GETNODEINFO*/, 74),
        appendName(new Uint8Array(0), name),
        u8(1, 7, 1),            // sw_major, sw_minor, sw_optional_field_flags
        u32le(0xDEADBEEF),      // sw_vcs_commit
        u8(2, 0),               // hw_major, hw_minor
        uid,
    );
    const r = parseAsyncResult(new DataView(raw.buffer));
    assert(r !== null,                       'parses without error');
    assertEqual(r.state,                  2, 'state = READY');
    assertEqual(r.name,            name,     'name');
    assertEqual(r.sw_major,           1,     'sw_major');
    assertEqual(r.sw_minor,           7,     'sw_minor');
    assertEqual(r.sw_optional_field_flags, 1, 'sw_optional_field_flags');
    assertEqual(r.sw_vcs_commit, 0xDEADBEEF, 'sw_vcs_commit');
    assertEqual(r.hw_major,           2,     'hw_major');
    assertEqual(r.hw_minor,           0,     'hw_minor');
    assert(r.hw_unique_id instanceof Uint8Array, 'hw_unique_id is Uint8Array');
    assertEqual(r.hw_unique_id.length,    16, 'hw_unique_id length');
    for (let i = 0; i < 16; i++) {
        assertEqual(r.hw_unique_id[i], 0xA0 + i, `hw_unique_id[${i}]`);
    }
}

console.log('\nTest: READY GetNodeInfo — empty name');
{
    const raw = concat(
        makePrefix(2, 1, 1, 5),
        u8(0),                  // name_len = 0
        u8(1, 0, 0),            // sw version
        u32le(0),
        u8(1, 0),               // hw version
        new Uint8Array(16),
    );
    const r = parseAsyncResult(new DataView(raw.buffer));
    assert(r !== null,         'parses without error');
    assertEqual(r.name,    '', 'empty name');
    assertEqual(r.sw_major, 1, 'sw_major still present');
}

console.log('\nTest: READY Param GetSet — INT (small, fits Number)');
{
    const raw = concat(
        makePrefix(2, 5, 11 /*PARAM_GETSET*/, 10),
        appendName(new Uint8Array(0), 'BATT_N_CELLS'),
        u8(1),                  // value_type = INT
        i64le(6, 0),            // value = 6
    );
    const r = parseAsyncResult(new DataView(raw.buffer));
    assert(r !== null,               'parses without error');
    assertEqual(r.name, 'BATT_N_CELLS', 'name');
    assertEqual(r.value_type,     1,   'value_type = INT');
    assertEqual(r.value,          6,   'value = 6');
    assert(typeof r.value === 'number', 'value is Number (fits safe integer range)');
}

console.log('\nTest: READY Param GetSet — INT (large, returned as BigInt)');
{
    // 2^53 + 1 exceeds Number.MAX_SAFE_INTEGER
    const big = BigInt(Number.MAX_SAFE_INTEGER) + 1n;
    const lo  = Number(big & 0xFFFFFFFFn);
    const hi  = Number((big >> 32n) & 0xFFFFFFFFn);
    const raw = concat(
        makePrefix(2, 6, 11, 10),
        appendName(new Uint8Array(0), 'LARGE'),
        u8(1),
        i64le(lo, hi),
    );
    const r = parseAsyncResult(new DataView(raw.buffer));
    assert(r !== null,                    'parses without error');
    assert(typeof r.value === 'bigint',   'value is BigInt for large integers');
    assertEqual(r.value, big,             'value matches expected BigInt');
}

console.log('\nTest: READY Param GetSet — FLOAT');
{
    const raw = concat(
        makePrefix(2, 7, 11, 10),
        appendName(new Uint8Array(0), 'NAV_FW_CRUISE_THR'),
        u8(2),                  // value_type = FLOAT
        f32le(1450.0),
    );
    const r = parseAsyncResult(new DataView(raw.buffer));
    assert(r !== null,                          'parses without error');
    assertEqual(r.value_type,             2,    'value_type = FLOAT');
    assert(Math.abs(r.value - 1450.0) < 0.1,   'value ≈ 1450.0');
}

console.log('\nTest: READY Param GetSet — BOOL true');
{
    const raw = concat(
        makePrefix(2, 8, 11, 10),
        appendName(new Uint8Array(0), 'GPS_ENABLED'),
        u8(3, 1),               // value_type = BOOL, value = 1
    );
    const r = parseAsyncResult(new DataView(raw.buffer));
    assert(r !== null,              'parses without error');
    assertEqual(r.value_type,  3,   'value_type = BOOL');
    assertEqual(r.value,    true,   'value = true');
    assert(typeof r.value === 'boolean', 'value is boolean type');
}

console.log('\nTest: READY Param GetSet — BOOL false');
{
    const raw = concat(
        makePrefix(2, 9, 11, 10),
        appendName(new Uint8Array(0), 'GPS_ENABLED'),
        u8(3, 0),               // value_type = BOOL, value = 0
    );
    const r = parseAsyncResult(new DataView(raw.buffer));
    assert(r !== null,             'parses without error');
    assertEqual(r.value,   false,  'value = false');
}

console.log('\nTest: READY Param GetSet — STRING');
{
    const str = 'FIXED_WING';
    const enc = new TextEncoder().encode(str);
    const raw = concat(
        makePrefix(2, 10, 11, 10),
        appendName(new Uint8Array(0), 'CRAFT_NAME'),
        u8(4),                  // value_type = STRING
        u8(enc.length),
        enc,
    );
    const r = parseAsyncResult(new DataView(raw.buffer));
    assert(r !== null,                'parses without error');
    assertEqual(r.value_type,    4,   'value_type = STRING');
    assertEqual(r.value,        str,  'value string');
}

console.log('\nTest: READY Param GetSet — EMPTY type (unknown)');
{
    const raw = concat(
        makePrefix(2, 11, 11, 10),
        appendName(new Uint8Array(0), 'UNKNOWN'),
        u8(0),                  // value_type = EMPTY
    );
    const r = parseAsyncResult(new DataView(raw.buffer));
    assert(r !== null,              'parses without error');
    assertEqual(r.value_type,  0,   'value_type = EMPTY');
    assert(r.value === null,        'value is null for EMPTY type');
}

console.log('\nTest: seq field preserved correctly across states');
{
    for (const [state, seq] of [[0, 0], [1, 128], [2, 255], [3, 1]]) {
        const prefix = makePrefix(state, seq, 1, 5);
        const raw    = state === 2
            ? concat(prefix, u8(0), u8(0, 0, 0), u32le(0), u8(0, 0), new Uint8Array(16))
            : prefix;
        const r = parseAsyncResult(new DataView(raw.buffer));
        assertEqual(r && r.seq, seq, `seq=${seq} preserved for state=${state}`);
    }
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
