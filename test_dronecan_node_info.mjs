#!/usr/bin/env node
/**
 * Test: MSP2_INAV_DRONECAN_NODE_INFO 71-byte decoder (Phase 6)
 *
 * Mirrors the parsing logic in MSPHelper.js case MSP2_INAV_DRONECAN_NODE_INFO.
 * Run before implementing Phase 6 to confirm the test fails (only 46 bytes
 * parsed), then run again after to confirm all 71 bytes decode correctly.
 *
 * Wire format (must match fc_msp.c Phase 5 output):
 *   [0]     nodeID              uint8
 *   [1]     health              uint8
 *   [2]     mode                uint8
 *   [3..6]  uptime_sec          uint32 LE
 *   [7..8]  vendor_status_code  uint16 LE
 *   [9..12] elapsed_ms          uint32 LE
 *   [13]    name_len            uint8
 *   [14..45] name               32 bytes (only name_len are significant)
 *   [46]    sw_major            uint8
 *   [47]    sw_minor            uint8
 *   [48]    sw_optional_field_flags uint8
 *   [49..52] sw_vcs_commit      uint32 LE
 *   [53]    hw_major            uint8
 *   [54]    hw_minor            uint8
 *   [55..70] hw_unique_id       16 bytes
 *   Total: 71 bytes
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
    if (actual === expected) {
        console.log(`  ✓ ${message}`);
        passed++;
    } else {
        console.log(`  ✗ ${message} — expected ${expected}, got ${actual}`);
        failed++;
    }
}

/* -------------------------------------------------------------------------
 * Build a known 71-byte payload matching the fc_msp.c Phase 5 wire format
 * ------------------------------------------------------------------------- */
const buf = new ArrayBuffer(71);
const raw = new Uint8Array(buf);
const view = new DataView(buf);

// Basic fields (bytes 0-12)
view.setUint8(0,  42);          // nodeID
view.setUint8(1,  0);           // health: OK
view.setUint8(2,  0);           // mode: OPERATIONAL
view.setUint32(3,  12345, true); // uptime_sec
view.setUint16(7,  0xABCD, true);// vendor_status_code
view.setUint32(9,  500, true);   // elapsed_ms

// Name (bytes 13-45)
const name = 'com.example.gps';
view.setUint8(13, name.length);
for (let i = 0; i < name.length; i++) {
    view.setUint8(14 + i, name.charCodeAt(i));
}

// SW version (bytes 46-52)
view.setUint8(46,  1);           // sw_major
view.setUint8(47,  7);           // sw_minor
view.setUint8(48,  1);           // sw_optional_field_flags (vcs_commit valid)
view.setUint32(49, 0xDEADBEEF, true); // sw_vcs_commit

// HW version (bytes 53-70)
view.setUint8(53,  2);           // hw_major
view.setUint8(54,  0);           // hw_minor
for (let i = 0; i < 16; i++) {
    view.setUint8(55 + i, 0xA0 + i); // hw_unique_id
}

/* -------------------------------------------------------------------------
 * Parser — mirrors MSPHelper.js case MSP2_INAV_DRONECAN_NODE_INFO.
 * Phase 6 will extend the real parser; update this to match.
 * ------------------------------------------------------------------------- */
/* Phase 6 will extend this to parse bytes 46-70.
 * Currently mirrors the existing MSPHelper.js decoder (46 bytes only). */
function parseNodeInfo(data) {
    if (data.byteLength < 46) return null;

    return {
        nodeID:             data.getUint8(0),
        health:             data.getUint8(1),
        mode:               data.getUint8(2),
        uptime_sec:         data.getUint32(3, true),
        vendor_status_code: data.getUint16(7, true),
        last_seen_ms:       data.getUint32(9, true),
        name:               String.fromCharCode(
                                ...new Uint8Array(data.buffer, data.byteOffset + 14, data.getUint8(13))),
    };
}

/* -------------------------------------------------------------------------
 * Tests
 * ------------------------------------------------------------------------- */
console.log('\nTest: 46-byte payload — base fields only');
{
    const short = new DataView(buf, 0, 46);
    const info = parseNodeInfo(short);
    assert(info !== null,           'parses without error');
    assertEqual(info.nodeID,   42,  'nodeID');
    assertEqual(info.uptime_sec, 12345, 'uptime_sec');
    assertEqual(info.vendor_status_code, 0xABCD, 'vendor_status_code');
    assertEqual(info.name,   name,  'name');
    assertEqual(info.sw_major, undefined, 'sw_major absent for 46-byte payload');
}

console.log('\nTest: 71-byte payload — all fields including version data');
{
    const full = new DataView(buf);
    const info = parseNodeInfo(full);
    assert(info !== null,            'parses without error');
    assertEqual(info.nodeID,    42,  'nodeID');
    assertEqual(info.health,    0,   'health');
    assertEqual(info.mode,      0,   'mode');
    assertEqual(info.uptime_sec, 12345, 'uptime_sec');
    assertEqual(info.vendor_status_code, 0xABCD, 'vendor_status_code');
    assertEqual(info.name,      name, 'name');
    assertEqual(info.sw_major,  1,   'sw_major');
    assertEqual(info.sw_minor,  7,   'sw_minor');
    assertEqual(info.sw_optional_field_flags, 1, 'sw_optional_field_flags');
    assertEqual(info.sw_vcs_commit, 0xDEADBEEF, 'sw_vcs_commit');
    assertEqual(info.hw_major,  2,   'hw_major');
    assertEqual(info.hw_minor,  0,   'hw_minor');
    const hasUniqueId = info.hw_unique_id instanceof Uint8Array;
    assert(hasUniqueId, 'hw_unique_id is Uint8Array');
    assertEqual(hasUniqueId ? info.hw_unique_id.length : -1, 16, 'hw_unique_id length');
    for (let i = 0; i < 16; i++) {
        assertEqual(hasUniqueId ? info.hw_unique_id[i] : -1, 0xA0 + i, `hw_unique_id[${i}]`);
    }
}

console.log('\nTest: payload between 46 and 70 bytes — version fields absent');
{
    const mid = new DataView(buf, 0, 60);
    const info = parseNodeInfo(mid);
    assert(info !== null,           'parses without error');
    assertEqual(info.sw_major, undefined, 'sw_major absent for sub-71 payload');
}

/* -------------------------------------------------------------------------
 * Summary
 * ------------------------------------------------------------------------- */
console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
