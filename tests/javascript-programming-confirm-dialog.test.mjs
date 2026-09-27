#!/usr/bin/env node
/**
 * Regression tests for iNavFlight/inav-configurator#2801: a native window.confirm()
 * leaves the Windows app without keyboard input (electron/electron#31917), so every
 * prompt must go through js/dialog.js, which is async and non-modal.
 *
 * The real tabs/javascript_programming.js is loaded with its static imports replaced
 * by stubs, because Monaco and the Vite ?worker / ?raw imports do not load in plain Node.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeHarness } from './helpers/harness.mjs';

const { repoRoot, rewriteAndWrite } = makeHarness(
    import.meta.url,
    'javascript-programming-confirm-dialog.test.mjs',
    'js-programming-confirm-'
);

const STATIC_IMPORT = /^import\s+(?:\*\s+as\s+(\w+)|(\{[^}]*\})|(\w+))\s+from\s+'([^']+)';?[ \t]*$/gm;

const dialogStub = { confirm: null };
globalThis.__jsProgrammingStubs = {
    './../js/dialog.js': dialogStub,
    './../js/localization.js': { getMessage: () => false },
};
// The module assigns self.MonacoEnvironment at load time.
globalThis.self = globalThis;

const tabUrl = rewriteAndWrite('tabs/javascript_programming.js', [
    [STATIC_IMPORT, (_m, ns, named, def, spec) =>
        `const ${ns || named || def} = globalThis.__jsProgrammingStubs[${JSON.stringify(spec)}] ?? {};`,
    'static imports'],
], 'javascript_programming');

const rewritten = readFileSync(fileURLToPath(tabUrl), 'utf8');
assert.doesNotMatch(rewritten, /^import\s/m, 'a static import was not stubbed; update STATIC_IMPORT');

const { default: tab } = await import(tabUrl);

function deferred() {
    let resolve;
    let reject;
    const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
}

function setup(isDirty, confirmImpl) {
    tab.isDirty = isDirty;
    tab.discardPrompt = null;
    const calls = [];
    dialogStub.confirm = (message) => {
        calls.push(message);
        return confirmImpl();
    };
    return calls;
}

test('confirmDiscard resolves true without a dialog when nothing is dirty', async () => {
    const calls = setup(false, () => Promise.resolve(false));

    assert.equal(await tab.confirmDiscard(), true);
    assert.equal(calls.length, 0);
});

test('confirmDiscard: dirty + Yes resolves true and clears isDirty', async () => {
    const calls = setup(true, () => Promise.resolve(true));

    assert.equal(await tab.confirmDiscard(), true);
    assert.equal(tab.isDirty, false);
    assert.equal(calls.length, 1);
    assert.equal(tab.discardPrompt, null);
});

test('confirmDiscard: dirty + No resolves false and keeps isDirty', async () => {
    const calls = setup(true, () => Promise.resolve(false));

    assert.equal(await tab.confirmDiscard(), false);
    assert.equal(tab.isDirty, true);
    assert.equal(calls.length, 1);
    assert.equal(tab.discardPrompt, null);
});

test('confirmDiscard: concurrent callers share one pending dialog', async () => {
    const answer = deferred();
    const calls = setup(true, () => answer.promise);

    const first = tab.confirmDiscard();
    const second = tab.confirmDiscard();
    assert.equal(first, second);
    assert.equal(calls.length, 1);

    answer.resolve(true);
    assert.deepEqual(await Promise.all([first, second]), [true, true]);
    assert.equal(tab.isDirty, false);
    assert.equal(tab.discardPrompt, null);
});

test('confirmDiscard: a rejected dialog resolves false and keeps isDirty', async () => {
    const calls = setup(true, () => Promise.reject(new Error('ipc failed')));

    assert.equal(await tab.confirmDiscard(), false);
    assert.equal(tab.isDirty, true);
    assert.equal(calls.length, 1);
    assert.equal(tab.discardPrompt, null);

    // The cleared prompt lets the next attempt open a fresh dialog.
    dialogStub.confirm = () => {
        calls.push('retry');
        return Promise.resolve(true);
    };
    assert.equal(await tab.confirmDiscard(), true);
    assert.equal(calls.length, 2);
});

const SCAN_EXCLUDED_DIRS = new Set(['libraries', 'browser', 'web', 'node_modules']);
const NATIVE_DIALOG_CALL = /(?:^|[^\w$.])(?:window\.)?(?:confirm|alert|prompt)\s*\(/;
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*)/;

function jsFilesUnder(dir, recursive) {
    const files = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (recursive && !SCAN_EXCLUDED_DIRS.has(entry.name)) {
                files.push(...jsFilesUnder(path, recursive));
            }
        } else if (entry.name.endsWith('.js')) {
            files.push(path);
        }
    }
    return files;
}

test('no native confirm/alert/prompt calls in js/ and tabs/', () => {
    const files = [
        ...jsFilesUnder(join(repoRoot, 'js'), true),
        ...jsFilesUnder(join(repoRoot, 'tabs'), false),
    ];
    assert.ok(files.length > 50, `scan found only ${files.length} files; check the scanned paths`);

    const offenders = [];
    for (const file of files) {
        readFileSync(file, 'utf8').split('\n').forEach((line, index) => {
            if (!COMMENT_LINE.test(line) && NATIVE_DIALOG_CALL.test(line)) {
                offenders.push(`${relative(repoRoot, file).replaceAll('\\', '/')}:${index + 1}: ${line.trim()}`);
            }
        });
    }

    assert.deepEqual(offenders, [], 'use dialog.confirm/dialog.alert from js/dialog.js instead:\n' + offenders.join('\n'));
});
