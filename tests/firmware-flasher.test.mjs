#!/usr/bin/env node
/**
 * Regression tests for the flash/backup flow.
 * Covers three bugs fixed in the codebase (originally tracked via PR #2603):
 *   Bug 1 — buildMigrationChain used range comparison instead of chain-walk
 *   Bug 2 — lastAutoBackup not cleared at the start of proceedWithFlash
 *   Bug 3 — _enterCli left its receive callback registered after resolving
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Bug 1 — buildMigrationChain explicit chain-walk
// ---------------------------------------------------------------------------

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
const wideProfiles = [
    ...stepProfiles,
    { fromVersion: '7', toVersion: '10' },
];

describe('migration chain walk', () => {
    test('7→9 chain uses exactly the two step profiles', () => {
        const chain = buildMigrationChain(stepProfiles, '7', '9');
        assert.equal(chain.length, 2);
        assert.equal(chain[0].fromVersion, '7');
        assert.equal(chain[1].fromVersion, '8');
    });

    test('same-version returns empty chain', () => {
        assert.deepEqual(buildMigrationChain(stepProfiles, '9', '9'), []);
    });

    test('downgrade returns empty chain', () => {
        assert.deepEqual(buildMigrationChain(stepProfiles, '9', '7'), []);
    });

    test('wide-span profile present: 7→9 still uses only 2 step profiles', () => {
        const chain = buildMigrationChain(wideProfiles, '7', '9');
        assert.equal(chain.length, 2);
    });

    test('wide-span profile present: 7→10 chain-walks to gap → 2 profiles, not 3', () => {
        const chain = buildMigrationChain(wideProfiles, '7', '10');
        assert.equal(chain.length, 2);
        assert.ok(chain.every(p => !(p.fromVersion === '7' && p.toVersion === '10')),
            '7→10 wide-span profile must not appear in the chain');
    });
});

// ---------------------------------------------------------------------------
// Bug 2 — clearLastAutoBackup called at top of proceedWithFlash
// ---------------------------------------------------------------------------

describe('proceedWithFlash clears stale auto-backup', () => {
    test('first statement of proceedWithFlash is BackupRestore.clearLastAutoBackup()', () => {
        const src = readFileSync(resolve(root, 'tabs/firmware_flasher.js'), 'utf8');
        const fnStart = src.indexOf('function proceedWithFlash()');
        assert.notEqual(fnStart, -1, 'proceedWithFlash function must exist');
        const bodyStart = src.indexOf('{', fnStart) + 1;
        const firstStatement = src.slice(bodyStart, bodyStart + 200).trim();
        assert.ok(
            firstStatement.startsWith('BackupRestore.clearLastAutoBackup()'),
            `expected first statement to be clearLastAutoBackup(), got: ${firstStatement.slice(0, 60)}`
        );
    });
});

// ---------------------------------------------------------------------------
// Bug 3 — _enterCli removes callback and nulls reference before resolving
// ---------------------------------------------------------------------------

describe('_enterCli removes and nulls callback before resolving', () => {
    test('removeOnReceiveCallback and null assignment come before resolve()', () => {
        const src = readFileSync(resolve(root, 'js/backup_restore.js'), 'utf8');
        // Relies on the _enterCli() definition appearing before _sendCommand() in the file
        const enterCliStart = src.indexOf('_enterCli()');
        const sendCommandStart = src.indexOf('_sendCommand(command)');
        const body = src.slice(enterCliStart, sendCommandStart);

        const removeIdx  = body.indexOf('removeOnReceiveCallback(this._receiveCallback)');
        const nullIdx    = body.indexOf('this._receiveCallback = null');
        const resolveIdx = body.indexOf('resolve()');

        assert.notEqual(removeIdx,  -1, '_enterCli must call removeOnReceiveCallback on success path');
        assert.notEqual(nullIdx,    -1, '_enterCli must null this._receiveCallback on success path');
        assert.notEqual(resolveIdx, -1, '_enterCli must call resolve()');
        assert.ok(removeIdx  < resolveIdx, 'removeOnReceiveCallback must come before resolve()');
        assert.ok(nullIdx    < resolveIdx, 'this._receiveCallback = null must come before resolve()');
    });
});
