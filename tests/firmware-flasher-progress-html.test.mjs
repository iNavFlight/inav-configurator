#!/usr/bin/env node
/**
 * Regression test for: STM32_protocol.prototype.connect's onTimeout callback
 * writes the `failedToFlash` i18n string into span.progressLabel using
 * jQuery's .text() instead of .html().
 *
 * `failedToFlash` (locale/en/messages.json) is HTML markup:
 *   "<span style=\"color: red\">Failed</span> to flash"
 *
 * GUI.log(...) on the line above correctly renders it because
 * GUI_control.prototype.log (js/gui.js) uses jQuery .append('<p>' + message + '</p>'),
 * which parses HTML. But js/protocols/stm32.js then does:
 *
 *   $('span.progressLabel').text(i18n.getMessage('failedToFlash') + port);
 *
 * jQuery's .text() escapes markup, so instead of a styled red "Failed" the
 * user sees the literal string:
 *   <span style="color: red">Failed</span> to flash COM3
 *
 * Elsewhere (tabs/firmware_flasher.js, firmwareFlasherTab.flashingMessage)
 * the same span.progressLabel element is updated with .html(message) for
 * exactly this reason.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const failedToFlashMessage = JSON.parse(
    readFileSync(resolve(root, 'locale/en/messages.json'), 'utf8')
).failedToFlash.message;

describe('failedToFlash message content', () => {
    test('sanity: failedToFlash message contains raw HTML markup', () => {
        assert.match(failedToFlashMessage, /<span[^>]*>/,
            'failedToFlash message must contain a <span> tag to be a meaningful regression case');
    });
});

// ---------------------------------------------------------------------------
// Source-inspection assertion: the onTimeout callback in js/protocols/stm32.js
// must use $('span.progressLabel').html(...) not .text(...) when displaying
// the failedToFlash message, since the message contains HTML markup.
// ---------------------------------------------------------------------------

describe('STM32_protocol onTimeout uses .html() for span.progressLabel', () => {
    test('onTimeout callback does not call .text() with failedToFlash on span.progressLabel', () => {
        const src = readFileSync(resolve(root, 'js/protocols/stm32.js'), 'utf8');

        const onTimeoutStart = src.indexOf('function onTimeout()');
        assert.notEqual(onTimeoutStart, -1, 'onTimeout callback must exist in stm32.js');

        // Grab a reasonably-sized window covering the whole callback body.
        const onTimeoutBody = src.slice(onTimeoutStart, onTimeoutStart + 500);

        const progressLabelLineMatch = onTimeoutBody.match(
            /\$\(['"]span\.progressLabel['"]\)\.(text|html)\(\s*i18n\.getMessage\(['"]failedToFlash['"]\)/
        );

        assert.notEqual(
            progressLabelLineMatch,
            null,
            'expected to find a span.progressLabel update using i18n.getMessage("failedToFlash") in onTimeout'
        );

        assert.equal(
            progressLabelLineMatch[1],
            'html',
            `span.progressLabel must be updated with .html() (message contains HTML markup), ` +
            `but found .${progressLabelLineMatch[1]}() — this renders the raw <span> tag as literal text to the user`
        );
    });
});
