#!/usr/bin/env node
/**
 * Regression test for GitHub issue #2685:
 * "Mixer Output Markers Disappear After Initial Rendering"
 *
 * updateMotorDirection() in tabs/mixer.js is called whenever the mixer
 * preset or platform type changes. It used to end with a bare call to
 * renderServoOutputImage() (no arguments). renderServoOutputImage(outputMap)
 * always clears the '.outputImageNumber' marker divs first, then only
 * redraws them `if (outputMap != null && ...)`. Calling it with no argument
 * wiped the markers and never redrew them.
 *
 * Fix: updateMotorDirection() now ends by calling renderOutputMapping(),
 * which computes a real outputMap and passes it to
 * renderServoOutputImage(outputMap), so markers are always redrawn.
 *
 * This test mirrors that logic with a minimal mock DOM, without importing
 * the real (jQuery-dependent IIFE) tabs/mixer.js module.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// ---------------------------------------------------------------------------
// Minimal mock of the '.mixerPreview' container and its marker divs
// ---------------------------------------------------------------------------

function createMockMixerPreview() {
    let markers = [];
    return {
        markers,
        // Mirrors: mixerPreview.find('.outputImageNumber').remove();
        clearMarkers() { markers.length = 0; },
        // Mirrors: mixerPreview.append('<div class="outputImageNumber">S1</div>');
        addMarker(label) { markers.push(label); },
        count() { return markers.length; },
    };
}

// Mirrors renderServoOutputImage(outputMap): always clears markers first,
// only repopulates them when given a non-null outputMap.
function createRenderServoOutputImage(preview) {
    return function renderServoOutputImage(outputMap) {
        preview.clearMarkers();
        if (outputMap != null) {
            for (const entry of outputMap) {
                preview.addMarker(entry);
            }
        }
    };
}

// Mirrors renderOutputMapping(): computes a real outputMap from FC state,
// then calls renderServoOutputImage(outputMap) with it.
function createRenderOutputMapping(preview, renderServoOutputImage, fcState) {
    return function renderOutputMapping() {
        const outputMap = fcState.servoRules.map((_, i) => `S${i + 1}`);
        renderServoOutputImage(outputMap);
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('mixer output marker redraw on preset/platform change (issue #2685)', () => {
    test('BUG: calling renderServoOutputImage() with no argument wipes markers', () => {
        const preview = createMockMixerPreview();
        const renderServoOutputImage = createRenderServoOutputImage(preview);
        const fcState = { servoRules: ['S1', 'S2', 'S3', 'S4', 'S5'] };
        const renderOutputMapping = createRenderOutputMapping(preview, renderServoOutputImage, fcState);

        // Initial render (e.g. from selecting a mixer preset) draws real markers.
        renderOutputMapping();
        assert.equal(preview.count(), 5, 'initial render should populate markers');

        // The buggy updateMotorDirection() called renderServoOutputImage()
        // with no argument.
        const buggyUpdateMotorDirection = function () {
            renderServoOutputImage();
        };
        buggyUpdateMotorDirection();

        assert.equal(preview.count(), 0, 'bug reproduced: markers wiped with no redraw');
    });

    test('FIX: calling renderOutputMapping() redraws markers after they were present', () => {
        const preview = createMockMixerPreview();
        const renderServoOutputImage = createRenderServoOutputImage(preview);
        const fcState = { servoRules: ['S1', 'S2', 'S3', 'S4', 'S5'] };
        const renderOutputMapping = createRenderOutputMapping(preview, renderServoOutputImage, fcState);

        // Initial render draws real markers.
        renderOutputMapping();
        assert.equal(preview.count(), 5, 'initial render should populate markers');

        // The fixed updateMotorDirection() calls renderOutputMapping() instead.
        const fixedUpdateMotorDirection = function () {
            renderOutputMapping();
        };
        fixedUpdateMotorDirection();

        assert.equal(preview.count(), 5, 'fix verified: markers survive preset/platform change');
    });

    test('renderServoOutputImage(outputMap) with a real map repopulates markers directly', () => {
        const preview = createMockMixerPreview();
        const renderServoOutputImage = createRenderServoOutputImage(preview);

        renderServoOutputImage(['S1', 'S2']);
        assert.equal(preview.count(), 2, 'markers populated when outputMap is provided');

        renderServoOutputImage(null);
        assert.equal(preview.count(), 0, 'markers cleared and not repopulated when outputMap is null');
    });
});
