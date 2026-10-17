#!/usr/bin/env node
/**
 * Tests for the INAV 9 → 10 migration profile, run through the real
 * MigrationHandler and the real js/migration/9_to_10.json.
 * Expectations are derived from the profile file itself, so the test
 * cannot drift away from the shipped mapping.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { register } from 'node:module';

register('./helpers/json-import-hook.mjs', import.meta.url);

const { default: MigrationHandler } = await import('../js/migration/migration_handler.js');

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const profile = JSON.parse(readFileSync(resolve(root, 'js/migration/9_to_10.json'), 'utf8'));

function backup(lines, version = '9.1.0') {
    return [`# Version: ${version}`, ...lines].join('\n');
}

function migrate(lines, version = '9.1.0') {
    return MigrationHandler.migrateBackupData(backup(lines, version), '10.0.0');
}

function bodyLines(result) {
    return result.migratedContent.split('\n').slice(1);
}

describe('9 → 10 migration chain', () => {

    test('a 9.x backup needs exactly the 9 → 10 profile', () => {
        const chain = MigrationHandler.buildMigrationChain('9.1.0', '10.0.0');
        assert.equal(chain.length, 1);
        assert.equal(chain[0].fromVersion, '9');
        assert.equal(chain[0].toVersion, '10');
    });

    test('a 7.x backup chains through all three profiles in order', () => {
        const chain = MigrationHandler.buildMigrationChain('7.1.0', '10.0.0');
        assert.deepEqual(chain.map(p => `${p.fromVersion}->${p.toVersion}`), ['7->8', '8->9', '9->10']);
    });

    test('no profile is missing for 9.1.0 → 10.0.0', () => {
        assert.equal(MigrationHandler.hasMissingProfiles(backup(['save']), '10.0.0'), false);
    });

    test('a patch-level jump needs no migration', () => {
        assert.equal(MigrationHandler.isMigrationNeeded(backup(['save'], '10.0.0'), '10.0.1'), false);
    });
});

describe('9 → 10 setting renames', () => {

    test('every rename in the profile is applied with the value untouched', () => {
        const entries = Object.entries(profile.settingRenames);
        assert.equal(entries.length, 9);

        for (const [oldName, newName] of entries) {
            const result = migrate([`set ${oldName} = 7`]);
            assert.deepEqual(bodyLines(result), [`set ${newName} = 7`], `rename of ${oldName}`);
        }
    });

    test('settings that only share a prefix with a renamed one are untouched', () => {
        const lines = ['set mavlink_sysid = 1', 'set mavlink_version = 2'];
        const result = migrate(lines);
        assert.deepEqual(bodyLines(result), lines);
        assert.equal(result.summary.totalChanges, 0);
    });
});

describe('9 → 10 turn mode conversion', () => {

    for (const [oldValue, newValue] of Object.entries(profile.valueReplacements.nav_fw_wp_turn_smoothing)) {
        test(`nav_fw_wp_turn_smoothing ${oldValue} becomes nav_fw_wp_turn_mode ${newValue}`, () => {
            const result = migrate([`set nav_fw_wp_turn_smoothing = ${oldValue}`]);
            assert.deepEqual(bodyLines(result), [`set nav_fw_wp_turn_mode = ${newValue}`]);
        });
    }
});

describe('9 → 10 removals and pass-through', () => {

    test('removed settings are dropped, everything else survives verbatim', () => {
        const result = migrate([
            '# custom notes',
            'set led_pin_pwm_mode = LOW',
            'set frsky_use_legacy_gps_mode_sensor_ids = ON',
            'set servo_autotrim_iterm_rate_limit = 20',
            'set motor_pwm_protocol = DSHOT300',
            'feature GPS',
            'mode_color 6 0 1',
            'save',
        ]);

        assert.deepEqual(bodyLines(result), [
            '# custom notes',
            'set motor_pwm_protocol = DSHOT300',
            'feature GPS',
            'mode_color 6 0 1',
            'save',
        ]);
        assert.equal(result.summary.removedSettings.length, profile.removed.length);
    });
});

describe('9 → 10 migration summary', () => {

    test('counts every change class and reports all profile warnings', () => {
        const result = migrate([
            'set mavlink_pos_rate = 5',
            'set nav_fw_wp_turn_smoothing = ON',
            'set led_pin_pwm_mode = LOW',
            'set mavlink_sysid = 1',
            'feature GPS',
            'save',
        ]);

        assert.deepEqual(bodyLines(result), [
            'set mavlink_port1_pos_rate = 5',
            'set nav_fw_wp_turn_mode = COORD_FLYBY',
            'set mavlink_sysid = 1',
            'feature GPS',
            'save',
        ]);

        assert.equal(result.summary.fromVersion, '9.1.0');
        assert.equal(result.summary.renamedSettings.length, 2);
        assert.equal(result.summary.valueReplacements.length, 1);
        assert.equal(result.summary.removedSettings.length, 1);
        assert.equal(result.summary.renamedCommands.length, 0);
        assert.equal(result.summary.settingRemappings.length, 0);
        assert.equal(result.summary.totalChanges, 4);
        assert.deepEqual(result.summary.warnings, profile.warnings);
    });
});
