#!/usr/bin/env node
/**
 * The constellation table addresses the tab by selector, and the tab addresses
 * the translations by key. Neither link is checked by anything that runs: a
 * renamed id leaves a switch that never appears, and a missing key leaves an
 * empty label. Both have happened here, and both look like the tab simply
 * deciding not to show something.
 *
 * So: every selector in the table has to name something in the markup, every
 * key in the markup has to name something in the messages, and the rows that
 * only report have to sit in the row geometry the rest of the section uses.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { GNSS_CONSTELLATIONS, GNSS_EXTENDED } from '../js/gpsConstellations.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'tabs/gps.html'), 'utf8');
const script = readFileSync(join(root, 'tabs/gps.js'), 'utf8');
const messages = JSON.parse(readFileSync(join(root, 'locale/en/messages.json'), 'utf8'));

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));

/* The last two rules live inside the tab's own closure, so they are read from the
 * source rather than called: what matters is that the pass is still written the way
 * the receiver's answers need it to be. */
function around(anchor, length) {
    const at = script.indexOf(anchor);
    assert.notEqual(at, -1, `${anchor} is no longer in tabs/gps.js`);
    return script.slice(at, at + length);
}

test('every selector in the constellation table names something in the tab', () => {
    for (const c of GNSS_CONSTELLATIONS.concat(GNSS_EXTENDED)) {
        for (const selector of [c.box, c.row].filter(Boolean)) {
            assert.match(selector, /^#/, `${c.name}: only id selectors are checked here`);
            assert.ok(ids.has(selector.slice(1)), `${c.name}: ${selector} is not in tabs/gps.html`);
        }
    }
});

test('every translation key in the tab exists in the English messages', () => {
    const keys = [...html.matchAll(/\bdata-i18n(?:_title)?="([^"]+)"/g)].map(m => m[1]);
    assert.ok(keys.length > 20, 'the tab should be carrying its labels through i18n');
    for (const key of keys) {
        assert.ok(messages[key], `${key} has no message in locale/en`);
    }
});

test('every message the tab script asks for exists', () => {
    const script = readFileSync(join(root, 'tabs/gps.js'), 'utf8');
    const keys = [...script.matchAll(/i18n\.getMessage\('([^']+)'/g)].map(m => m[1]);
    assert.ok(keys.includes('gpsConstellationsLeftOut'), 'the left out warning should be looked up');
    for (const key of keys) {
        assert.ok(messages[key], `${key} has no message in locale/en`);
    }
});

test('the rows that only report carry the section row geometry', () => {
    // .checkbox is what gives a row its column, its separator and its spacing.
    // Without it the row lands hard against the one above it
    for (const id of ['gps_have_gps', 'gps_have_qzss']) {
        const row = new RegExp(`<div class="checkbox gnss-fixed[^"]*"[^>]*>[^]{0,600}?id="${id}"`);
        assert.match(html, row, `${id} is not inside a .checkbox .gnss-fixed row`);
    }
});

test('the rows that only report cannot be changed from the tab', () => {
    for (const id of ['gps_have_gps', 'gps_have_qzss']) {
        const input = html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`));
        assert.ok(input, `${id} is not an input`);
        assert.match(input[0], /\bdisabled\b/, `${id} must not be editable`);
        // A settings binding would make the tab try to save a reading
        assert.doesNotMatch(input[0], /data-setting/, `${id} must not be bound to a setting`);
    }
});

test('the real switches are bound to their settings', () => {
    const bindings = {
        gps_use_galileo: 'gps_ublox_use_galileo',
        gps_use_beidou: 'gps_ublox_use_beidou',
        gps_use_glonass: 'gps_ublox_use_glonass',
        gps_use_navic: 'gps_ublox_use_navic'
    };
    for (const [id, setting] of Object.entries(bindings)) {
        const input = html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`));
        assert.ok(input, `${id} is not in the tab`);
        assert.ok(input[0].includes(`data-setting="${setting}"`), `${id} lost its setting`);
    }
});

test('the NavIC switch starts hidden and is left alone by the presets', () => {
    // The tab shows it once the receiver names NavIC. Before that it must not be
    // on screen, whatever the setting says
    assert.match(html, /<div class="checkbox is-hidden" id="gps_use_navic_row">/);
    const input = html.match(/<input[^>]*id="gps_use_navic"[^>]*>/)[0];
    assert.doesNotMatch(input, /preset-controlled/, 'no preset knows about NavIC');
    assert.doesNotMatch(input, /disabled/, 'NavIC is a setting now, not a reading');
});

test('the read-only summary the switches replaced is gone', () => {
    assert.ok(!ids.has('gps_constellations'), 'the summary row is still in the tab');
    assert.equal(messages.gpsConstellationsInUse, undefined);
    assert.equal(messages.gpsConstellationsAllInUse, undefined);
});

test('a switch the receiver cannot use is cleared, not just hidden', () => {
    // Settings are serialized whether their row is on screen or not, so hiding a
    // constellation the receiver does not have would keep saving it with nobody
    // able to turn it off
    const block = around('const offered = gnssIsOffered', 700);
    assert.match(block, /prop\('checked', false\)/, 'the withdrawn switch stays checked');
});

test('the title names the receiver, whether or not it names itself', () => {
    // The module name is the good one, and the hardware version is what is left when
    // the receiver does not report one, as an M8 does not
    const block = around('function updateReceiverName', 500);
    assert.match(block, /moduleName \|\| UBLOX_GENERATION/, 'the title has lost its fallback');
    assert.ok(ids.has('gps_title_model'), 'the title has nowhere to put the name');

    const table = around('const UBLOX_GENERATION', 220);
    for (const version of ['0x48', '0x49', '0x4A']) {
        assert.match(table, new RegExp(`${version}: 'u-blox M`), `${version} has no name`);
    }
});

test('the green detected-hardware line is gone from the tab', () => {
    // The title says which receiver it is, and the preset menu already offers the
    // auto-detect that its link duplicated
    assert.ok(!ids.has('gps_hardware_status'), 'the detection line is still in the markup');
    assert.ok(!ids.has('gps_apply_optimal'), 'the optimal-settings link is still in the markup');
    assert.doesNotMatch(script, /gps_hardware_status|gps_apply_optimal/, 'the tab still reaches for it');
    assert.match(html, /<option value="auto">/, 'the preset menu lost its auto-detect');
});
