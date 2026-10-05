#!/usr/bin/env node
/**
 * Regression tests for the "preserve unrecognized mode ranges on save"
 * fix in tabs/auxiliary.js's `a.save` click handler.
 *
 * Background: FC.generateAuxConfig() (see tests/fc-generate-aux-config.test.mjs)
 * already filters LOCAL_AUX_CONFIG/LOCAL_AUX_CONFIG_IDS down to only the
 * permanentIds this configurator build's local FLIGHT_MODES table
 * recognizes. process_html() only renders a UI row per entry in
 * LOCAL_AUX_CONFIG - so any FC.MODE_RANGES slot whose `.id` is NOT
 * recognized locally (e.g. a mode added by newer firmware than this
 * configurator build knows about) gets no row at all.
 *
 * Before this fix, the save handler unconditionally discarded the OLD
 * FC.MODE_RANGES array and rebuilt it purely from whatever rows exist in
 * the DOM, padding the rest with disabled placeholders
 * ({ id: 0, range: 900-900 }). Since unrecognized-id slots never had a
 * row, this silently deleted the user's existing switch assignment to
 * that mode on every save - a safety-relevant data-loss bug (see also
 * PR discussion / Qodo review comment referenced in the task for this
 * branch).
 *
 * Fix under test: before wiping FC.MODE_RANGES, the handler now captures
 * the OLD entries whose `.id` is not in the recognized-id set
 * (`unrecognizedRanges`), and - after rebuilding from the DOM rows as
 * before - pushes them back in (bounded by the FC's fixed slot budget)
 * before padding the remainder with placeholders.
 *
 * This file does NOT drive real jQuery/noUiSlider/DOM (this repo has no
 * jsdom dependency - see tests/magnetometer-slider.test.mjs for the
 * established pattern of testing this kind of jQuery-tab logic by
 * re-deriving it as a pure computation rather than simulating the DOM).
 * Instead, `computeFinalModeRanges()` below is a line-for-line mirror of
 * the new logic added in tabs/auxiliary.js (compare against
 * `git diff tabs/auxiliary.js`, lines ~306-356): same variable names,
 * same loop bounds, same order of operations. The one abstraction is
 * that the real code's jQuery `.each()` walk over rendered DOM rows
 * (which only ever produces entries for recognized ids, by construction
 * of process_html()) is replaced here with a plain array parameter,
 * `domRebuiltRanges`, supplied directly by each test case.
 *
 * If tabs/auxiliary.js's save handler logic changes, this mirror must be
 * updated to match, or this test stops being meaningful.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

/**
 * Mirrors tabs/auxiliary.js `$('a.save').on('click', ...)` array-management
 * logic (the part downstream of reading DOM state into `domRebuiltRanges`).
 *
 * @param {Array<{id:number, auxChannelIndex:number, range:{start:number,end:number}}>} oldModeRanges
 *   FC.MODE_RANGES as it stood BEFORE the save handler wipes it (i.e. as last
 *   loaded from the FC via MSP_MODE_RANGES - always exactly
 *   `requiredModesRangeCount` long, the FC's fixed slot budget).
 * @param {number[]} recognizedIdsList
 *   LOCAL_AUX_CONFIG_IDS at save time (permanentIds this configurator build's
 *   FLIGHT_MODES table recognizes).
 * @param {Array<{id:number, auxChannelIndex:number, range:{start:number,end:number}}>} domRebuiltRanges
 *   Stand-in for what the real code's `$('.tab-auxiliary .modes .mode').each(...)`
 *   walk produces: one entry per rendered range row, in DOM order. By
 *   construction in the real code, every `.id` here is a member of
 *   recognizedIdsList, because process_html() only creates rows for
 *   recognized ids.
 * @returns {Array} the final MODE_RANGES array that would be sent to the FC.
 */
function computeFinalModeRanges(oldModeRanges, recognizedIdsList, domRebuiltRanges) {
    // we must send this many back to the FC - overwrite all of the old ones to be sure.
    var requiredModesRangeCount = oldModeRanges.length;

    // Modes this configurator build doesn't recognize (e.g. added by a newer
    // firmware than this local FLIGHT_MODES table knows about) get no row in
    // the UI at all - preserve their existing assignments as-is instead of
    // letting the rebuild below silently disable them.
    var recognizedIds = new Set(recognizedIdsList);
    var unrecognizedRanges = oldModeRanges.filter(function (modeRange) {
        return !recognizedIds.has(modeRange.id);
    });

    var MODE_RANGES = [];

    // Stand-in for the real code's DOM `.each()` walk - pushes exactly what
    // the caller says the rendered rows would produce, in the same order.
    domRebuiltRanges.forEach(function (modeRange) {
        MODE_RANGES.push(modeRange);
    });

    for (var preservedIndex = 0; preservedIndex < unrecognizedRanges.length && MODE_RANGES.length < requiredModesRangeCount; preservedIndex++) {
        MODE_RANGES.push(unrecognizedRanges[preservedIndex]);
    }

    for (var modeRangeIndex = MODE_RANGES.length; modeRangeIndex < requiredModesRangeCount; modeRangeIndex++) {
        var defaultModeRange = {
            id: 0,
            auxChannelIndex: 0,
            range: {
                start: 900,
                end: 900
            }
        };
        MODE_RANGES.push(defaultModeRange);
    }

    return MODE_RANGES;
}

function placeholder() {
    return { id: 0, auxChannelIndex: 0, range: { start: 900, end: 900 } };
}

test('normal save (all ids recognized): behavior is unchanged from before the fix', () => {
    // ARM (id 0) is always recognized. Old FC.MODE_RANGES: one real ARM
    // assignment on channel 0, plus 3 padding placeholders (a 4-slot budget).
    const oldModeRanges = [
        { id: 0, auxChannelIndex: 0, range: { start: 1700, end: 2100 } },
        placeholder(),
        placeholder(),
        placeholder(),
    ];
    const recognizedIds = [0, 1, 2, 3]; // ARM, ANGLE, HORIZON, NAV ALTHOLD

    // User didn't change anything - DOM rebuild reproduces the same single
    // ARM row unchanged.
    const domRebuiltRanges = [
        { id: 0, auxChannelIndex: 0, range: { start: 1700, end: 2100 } },
    ];

    const result = computeFinalModeRanges(oldModeRanges, recognizedIds, domRebuiltRanges);

    // Byte-identical to what the pre-fix code would have produced: DOM row,
    // then padding placeholders up to the original budget of 4.
    assert.deepEqual(result, [
        { id: 0, auxChannelIndex: 0, range: { start: 1700, end: 2100 } },
        placeholder(),
        placeholder(),
        placeholder(),
    ]);
    assert.equal(result.length, oldModeRanges.length, 'total slots sent to FC must equal the FC-reported budget');
});

test('unrecognized-id assignment survives a save unchanged (the bug this fix addresses)', () => {
    // 4-slot budget. Slot 0: ARM (recognized, rendered, untouched by user).
    // Slot 1: a real switch assignment to permanentId 250, a mode this
    // configurator build's FLIGHT_MODES table does not know about (e.g.
    // newer firmware). Slots 2-3: unused placeholders.
    const unrecognizedAssignment = { id: 250, auxChannelIndex: 2, range: { start: 1300, end: 1700 } };
    const oldModeRanges = [
        { id: 0, auxChannelIndex: 0, range: { start: 1700, end: 2100 } },
        unrecognizedAssignment,
        placeholder(),
        placeholder(),
    ];
    const recognizedIds = [0, 1, 2, 3]; // does NOT include 250

    // process_html() never rendered a row for id 250, so the DOM rebuild can
    // only ever reproduce the ARM row.
    const domRebuiltRanges = [
        { id: 0, auxChannelIndex: 0, range: { start: 1700, end: 2100 } },
    ];

    const result = computeFinalModeRanges(oldModeRanges, recognizedIds, domRebuiltRanges);

    assert.equal(result.length, oldModeRanges.length, 'total slots sent to FC must equal the FC-reported budget');

    // The unrecognized assignment must be present, unmodified, somewhere in
    // the result (order beyond "after the DOM rows" is not a guarantee we
    // need to make - the FC-side effect is what matters).
    assert.deepEqual(
        result.find((r) => r.id === 250),
        unrecognizedAssignment,
        'the id-250 assignment must survive the save byte-for-byte instead of being silently disabled'
    );

    // Exact expected order per the real algorithm: DOM rows first, then
    // preserved unrecognized ranges, then placeholders to fill the budget.
    assert.deepEqual(result, [
        { id: 0, auxChannelIndex: 0, range: { start: 1700, end: 2100 } },
        unrecognizedAssignment,
        placeholder(),
        placeholder(),
    ]);
});

test('preserved entries are bounded by the FC slot budget - never overflow', () => {
    // 2-slot budget (tiny, to make the boundary easy to reason about). Both
    // slots are already consumed by unrecognized assignments (e.g. the user
    // is on a very old configurator build against very new firmware that
    // defines several new modes).
    const unrecognized1 = { id: 250, auxChannelIndex: 2, range: { start: 1300, end: 1700 } };
    const unrecognized2 = { id: 251, auxChannelIndex: 3, range: { start: 1300, end: 1700 } };
    const oldModeRanges = [unrecognized1, unrecognized2];
    const recognizedIds = [0, 1, 2, 3]; // neither 250 nor 251 is recognized

    // Nothing recognized was assigned, so the DOM has no range rows at all -
    // an empty budget-worth of rendered rows.
    const domRebuiltRanges = [];

    const result = computeFinalModeRanges(oldModeRanges, recognizedIds, domRebuiltRanges);

    assert.equal(result.length, oldModeRanges.length, 'result must never exceed the FC slot budget');
    assert.deepEqual(result, [unrecognized1, unrecognized2], 'both unrecognized entries fit within budget and must both survive');
});

test('preserved entries are dropped (not overflowed) once the budget is exhausted by DOM rows', () => {
    // 2-slot budget. Old state: 1 unrecognized assignment (id 250) plus 1
    // placeholder. Between load and save, the user used the UI's "add
    // range" button to add a second real range for a recognized mode,
    // consuming the entire budget with DOM-visible rows before the
    // preserve-loop even runs.
    const unrecognizedAssignment = { id: 250, auxChannelIndex: 2, range: { start: 1300, end: 1700 } };
    const oldModeRanges = [unrecognizedAssignment, placeholder()];
    const recognizedIds = [0, 1, 2, 3];

    const domRow1 = { id: 0, auxChannelIndex: 0, range: { start: 1700, end: 2100 } };
    const domRow2 = { id: 0, auxChannelIndex: 1, range: { start: 1300, end: 1700 } };
    const domRebuiltRanges = [domRow1, domRow2]; // already == requiredModesRangeCount

    const result = computeFinalModeRanges(oldModeRanges, recognizedIds, domRebuiltRanges);

    // Critical invariant: even though there was an unrecognized entry
    // pending preservation, the result must NOT exceed the FC's budget -
    // sendModeRanges() addresses FC slots positionally, so exceeding the
    // budget would write past what the FC allocated.
    assert.equal(result.length, oldModeRanges.length, 'result must never exceed the FC slot budget, even when the budget is already exhausted by DOM rows');
    assert.deepEqual(result, [domRow1, domRow2], 'the unrecognized entry is correctly dropped (not silently duplicated or overflowed) once no budget remains');
});

test('multiple unrecognized entries: only as many as fit are preserved, in original order', () => {
    // 3-slot budget. Old state: 1 recognized ARM assignment + 2 different
    // unrecognized assignments (ids 250 and 251) - already fully consuming
    // the budget, nothing to spare.
    const armAssignment = { id: 0, auxChannelIndex: 0, range: { start: 1700, end: 2100 } };
    const unrecognized1 = { id: 250, auxChannelIndex: 2, range: { start: 1300, end: 1700 } };
    const unrecognized2 = { id: 251, auxChannelIndex: 3, range: { start: 1300, end: 1700 } };
    const oldModeRanges = [armAssignment, unrecognized1, unrecognized2];
    const recognizedIds = [0, 1, 2, 3];

    // ARM row rendered/unchanged; the two unrecognized ones have no rows.
    const domRebuiltRanges = [armAssignment];

    const result = computeFinalModeRanges(oldModeRanges, recognizedIds, domRebuiltRanges);

    assert.equal(result.length, oldModeRanges.length);
    // Both fit (1 DOM row + 2 preserved == 3 == budget), in encounter order.
    assert.deepEqual(result, [armAssignment, unrecognized1, unrecognized2]);
});

test('empty unrecognizedRanges (nothing to preserve) still pads to budget exactly as before the fix', () => {
    const oldModeRanges = [placeholder(), placeholder(), placeholder()];
    const recognizedIds = [0, 1, 2, 3];
    const domRebuiltRanges = [];

    const result = computeFinalModeRanges(oldModeRanges, recognizedIds, domRebuiltRanges);

    assert.deepEqual(result, [placeholder(), placeholder(), placeholder()]);
});
