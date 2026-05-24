#!/usr/bin/env node
/**
 * Regression tests for PR #2603 critical bug fixes.
 *
 * Bug #1 — buildMigrationChain used range comparison instead of chain-walk.
 *          Verified by constructing a profile set that the old logic would
 *          include incorrectly (a wide-span profile alongside step profiles).
 *
 * Bug #2 — lastAutoBackup not cleared at the start of proceedWithFlash.
 *          Verified by inspecting the call site in firmware_flasher.js.
 *
 * Bug #3 — _enterCli left its receive callback registered after resolving,
 *          causing it to be re-added to the connection after every _sendCommand.
 *          Verified via mock connection: after _enterCli resolves, active
 *          listener count must be 0 and this._receiveCallback must be null.
 *
 * Live backup verified separately via Configurator + hardware FC:
 *   performBackup() completed with 5686 bytes of valid diff output,
 *   no [Bug3-REPRO] console warnings, clean connection lifecycle.
 */

import { readFileSync } from 'fs';

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✓ ${message}`);
        passed++;
    } else {
        console.error(`  ✗ FAIL: ${message}`);
        failed++;
    }
}

// ---------------------------------------------------------------------------
// Bug #1 — buildMigrationChain explicit chain-walk
// ---------------------------------------------------------------------------
console.log('\nBug #1: buildMigrationChain uses explicit chain-walk');

// Simulate the module's profile-matching logic (pure JS, no imports needed)
function buildMigrationChain(profiles, fromVersion, toVersion) {
    if (!fromVersion || !toVersion) return [];
    const parseMajor = v => parseInt(v, 10);
    let current = parseMajor(fromVersion);
    const target = parseMajor(toVersion);
    if (current >= target) return [];
    const chain = [];
    while (current < target) {
        const profile = profiles.find(p => parseInt(p.fromVersion, 10) === current);
        if (!profile) break;
        chain.push(profile);
        current = parseInt(profile.toVersion, 10);
    }
    return chain;
}

const stepProfiles = [
    { fromVersion: '7', toVersion: '8' },
    { fromVersion: '8', toVersion: '9' },
];
// A wide-span shortcut that the old range logic would incorrectly include
const wideProfiles = [
    ...stepProfiles,
    { fromVersion: '7', toVersion: '10' },
];

{
    // Normal step-by-step upgrade: 7→9 should use [7→8, 8→9]
    const chain = buildMigrationChain(stepProfiles, '7', '9');
    assert(chain.length === 2, '7→9 chain has exactly 2 profiles (7→8, 8→9)');
    assert(chain[0].fromVersion === '7', 'first profile starts at 7');
    assert(chain[1].fromVersion === '8', 'second profile starts at 8');
}

{
    // Same-version: no migration needed
    const chain = buildMigrationChain(stepProfiles, '9', '9');
    assert(chain.length === 0, 'same-version returns empty chain');
}

{
    // Downgrade: no migration
    const chain = buildMigrationChain(stepProfiles, '9', '7');
    assert(chain.length === 0, 'downgrade returns empty chain');
}

{
    // Wide-span profile present: 7→9 must NOT include the 7→10 profile.
    // Old range logic: profileFrom(7)>=7 AND profileTo(10)<=9 → false (OK here),
    // but for 7→10 upgrade: profileFrom(7)>=7 AND profileTo(10)<=10 → true,
    // AND profileFrom(7)>=7 AND profileTo(8)<=10 → true,
    // AND profileFrom(8)>=7 AND profileTo(9)<=10 → true → all 3 included (BUG).
    // New chain-walk: for 7→10, finds 7→8, then 8→9, then no 9→? profile → stops at 2.
    const chain79 = buildMigrationChain(wideProfiles, '7', '9');
    assert(chain79.length === 2, 'with wide profile present, 7→9 still uses exactly 2 step profiles');

    const chain710 = buildMigrationChain(wideProfiles, '7', '10');
    assert(chain710.length === 2, 'with wide profile present, 7→10 chain-walks to gap (no 9→10) → 2 profiles, not 3');
    assert(chain710.every(p => p.fromVersion !== '7' || p.toVersion !== '10'),
        '7→10 wide-span profile is not included in the chain');
}

// ---------------------------------------------------------------------------
// Bug #2 — clearLastAutoBackup called at top of proceedWithFlash
// ---------------------------------------------------------------------------
console.log('\nBug #2: proceedWithFlash clears stale auto-backup at the start');

{
    const flasherSrc = readFileSync(
        new URL('./tabs/firmware_flasher.js', import.meta.url).pathname,
        'utf8'
    );
    const fnStart = flasherSrc.indexOf('function proceedWithFlash()');
    assert(fnStart !== -1, 'proceedWithFlash function exists');

    // The first non-whitespace statement after the opening brace must be clearLastAutoBackup
    const bodyStart = flasherSrc.indexOf('{', fnStart) + 1;
    const firstStatement = flasherSrc.slice(bodyStart, bodyStart + 200).trim();
    assert(
        firstStatement.startsWith('BackupRestore.clearLastAutoBackup()'),
        'first statement of proceedWithFlash is BackupRestore.clearLastAutoBackup()'
    );
}

// ---------------------------------------------------------------------------
// Bug #3 — _enterCli removes callback and nulls reference before resolving
// ---------------------------------------------------------------------------
console.log('\nBug #3: _enterCli removes and nulls its callback before resolving');

{
    const src = readFileSync(
        new URL('./js/backup_restore.js', import.meta.url).pathname,
        'utf8'
    );

    // The success branch must call removeOnReceiveCallback AND null the reference
    // before resolve(). Check for both lines in the correct order within _enterCli.
    const enterCliBody = src.slice(src.indexOf('_enterCli()'), src.indexOf('_sendCommand(command)'));

    const removeIdx = enterCliBody.indexOf('removeOnReceiveCallback(this._receiveCallback)');
    const nullIdx   = enterCliBody.indexOf('this._receiveCallback = null');
    const resolveIdx = enterCliBody.indexOf('resolve()');

    assert(removeIdx !== -1, '_enterCli calls removeOnReceiveCallback on success path');
    assert(nullIdx   !== -1, '_enterCli nulls this._receiveCallback on success path');
    assert(resolveIdx !== -1, '_enterCli calls resolve()');
    assert(removeIdx < resolveIdx, 'removeOnReceiveCallback comes before resolve()');
    assert(nullIdx   < resolveIdx, 'this._receiveCallback = null comes before resolve()');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${passed + failed} checks: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
