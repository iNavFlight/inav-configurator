#!/usr/bin/env node
/**
 * Regression tests for the Alignment Tool (magnetometer tab) load guard.
 *
 * The tab's MSP load chain has no error path: a request the MSP queue drops after
 * its retries used to leave the tab on the loading spinner forever, and
 * GUI.content_ready() was never reached. These tests mirror the guard added to
 * tabs/magnetometer.js and check that the real file keeps it wired up.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const tabSource = readFileSync(
    path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tabs', 'magnetometer.js'),
    'utf8'
);

// Mirrors the load_html() / load_timed_out() pair in tabs/magnetometer.js
function createLoadGuard(isHidden) {
    const state = { loadFinished: false, loaded: 0, failed: 0, timers: 0 };

    function armTimer() {
        state.timers++;
    }

    return {
        state,
        chainFinished() {
            if (state.loadFinished) {
                return;
            }
            state.loadFinished = true;
            state.loaded++;
        },
        timedOut() {
            if (state.loadFinished) {
                return;
            }
            if (isHidden()) {
                armTimer();
                return;
            }
            state.loadFinished = true;
            state.failed++;
        }
    };
}

describe('Alignment Tool load guard', () => {

    test('a completed chain loads the tab once and a late timeout does nothing', () => {
        const guard = createLoadGuard(() => false);
        guard.chainFinished();
        guard.timedOut();
        guard.chainFinished();
        assert.equal(guard.state.loaded, 1);
        assert.equal(guard.state.failed, 0);
    });

    test('a stalled chain gives up once and does not load the tab afterwards', () => {
        const guard = createLoadGuard(() => false);
        guard.timedOut();
        guard.chainFinished();
        guard.timedOut();
        assert.equal(guard.state.failed, 1);
        assert.equal(guard.state.loaded, 0);
    });

    test('a hidden window re-arms the timer instead of giving up', () => {
        let hidden = true;
        const guard = createLoadGuard(() => hidden);
        guard.timedOut();
        guard.timedOut();
        assert.equal(guard.state.failed, 0);
        assert.equal(guard.state.timers, 2);

        // Once the window is back on screen the chain is still allowed to finish.
        hidden = false;
        guard.chainFinished();
        assert.equal(guard.state.loaded, 1);
        assert.equal(guard.state.failed, 0);
    });

    test('the tab arms the load timeout and drops it again', () => {
        const sliceFunction = (name) => {
            const rest = tabSource.slice(tabSource.indexOf('function ' + name + '('));
            const end = rest.search(/\r?\n {4}\}\r?\n/);
            assert.ok(rest.startsWith('function ') && end > 0, name + ' not found');
            return rest.slice(0, end);
        };
        assert.match(tabSource, /timeout\.add\('magnetometer_load', load_timed_out, loadTimeout\)/);
        assert.match(sliceFunction('load_html'), /timeout\.remove\('magnetometer_load'\)/);
        assert.match(sliceFunction('load_timed_out'), /GUI\.content_ready\(callback\)/);
        // the give-up time follows the MSP queue's per-try timeout of the link
        assert.match(tabSource, /LOAD_TIMEOUT \* CONFIGURATOR\.connection\.getTimeout\(\) \/ 3000/);
        // cleanup() has to drop the timer, otherwise it fires into the next tab
        const cleanup = tabSource.slice(tabSource.indexOf('magnetometerTab.cleanup'));
        assert.match(cleanup, /timeout\.remove\('magnetometer_load'\)/);
        // a failed first load leaves resize3D unset, and off() without a handler drops every resize listener
        assert.match(cleanup, /if \(this\.resize3D\)/);
    });
});
