#!/usr/bin/env node
/**
 * Regression tests for iNavFlight/inav#10615: a baud rate set over the CLI is
 * silently reset when anything else is changed in the Ports tab.
 *
 * Two things combined to lose the rate:
 *
 *   1. MSPHelper's BAUD_RATES_post1_6_3 table stopped at 921600, while the
 *      firmware's baudRate_e / baudRates[] (src/main/io/serial.c) runs to
 *      index 16 (2470000). The index is what MSP2_COMMON_SERIAL_CONFIG carries
 *      on the wire, so an FC reporting BAUD_2000000 (index 15) decoded to
 *      `undefined` - the Ports tab never even learned what the rate was.
 *
 *   2. Each column's drop-down only offers a subset of the rates the firmware
 *      supports (serialPortHelper's `bauds` groups: MSP stops at 230400,
 *      PERIPHERAL at 250000, and so on). The tab set the reported rate with
 *      jQuery's `.val()`, and when no option carries that value jQuery's
 *      select valHook forces `selectedIndex = -1`. Reading it back on save
 *      then yields `null`, `BAUD_RATES.indexOf(null)` yields -1, and
 *      send_message() stores that into a Uint8Array as 255 - so saving any
 *      unrelated change in the tab overwrote the rate on that UART.
 *
 * Fix under test:
 *   - the wire table now lists every rate the firmware knows, so the reported
 *     rate decodes;
 *   - serialPortHelper.getBaudsIncluding() appends a reported rate the group
 *     does not offer, and tabs/ports.js builds each row's drop-down from it,
 *     so the rate has a matching option, stays selected and is written back
 *     unchanged.
 *
 * These tests execute the REAL js/msp/MSPHelper.js (its MSP2_CF_SERIAL_CONFIG
 * parse and its MSP2_SET_CF_SERIAL_CONFIG crunch) and the REAL
 * js/serialPortHelper.js. As in tests/msp-parse-failure-recovery.test.mjs and
 * tests/fc-generate-aux-config.test.mjs, plain Node's ESM resolver refuses
 * this codebase's Vite-style extensionless relative imports, so both sources
 * are read fresh off disk and only their *import statements* are rewritten -
 * FC becomes controllable, the modules the executed paths never touch become
 * inert, and BitHelper/serialPortHelper stay wired to the real files. No
 * statement, expression or ordering in the code under test is changed.
 *
 * The one thing not executed for real is the DOM: this repo has no jsdom (see
 * tests/magnetometer-slider.test.mjs), so `SelectElement` below models the
 * handful of <select> and jQuery `val()` behaviours the bug turns on, quoting
 * jquery.js for each of them.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const tmpDir = mkdtempSync(join(tmpdir(), 'ports-baudrate-'));
process.on('exit', () => rmSync(tmpDir, { recursive: true, force: true }));

function realModuleUrl(relPath) {
    return pathToFileURL(join(repoRoot, relPath)).href;
}

/** Writes a stub module into the temp dir and returns its URL. */
function stubModule(name, code) {
    const outPath = join(tmpDir, name);
    writeFileSync(outPath, code, 'utf8');
    return pathToFileURL(outPath).href;
}

/**
 * Copies a real source file into the temp dir with the listed import
 * statements swapped for the given specifiers. Throws loudly if a statement
 * stops matching, so a future reshuffle of the imports fails the test instead
 * of passing vacuously.
 */
function rewriteImports(relSrcPath, rules, outName) {
    let source = readFileSync(join(repoRoot, relSrcPath), 'utf8');

    for (const [statement, replacement] of rules) {
        if (!source.includes(statement)) {
            throw new Error(
                'ports-tab-preserve-reported-baudrate.test.mjs: expected to find "' + statement +
                '" in ' + relSrcPath + ' but it is not there any more. Update the test rewrite rules.'
            );
        }
        source = source.replace(statement, () => replacement);
    }

    const outPath = join(tmpDir, outName);
    writeFileSync(outPath, source, 'utf8');
    return pathToFileURL(outPath).href;
}

// --- real, import-free leaf modules, loadable straight by absolute URL ------
const realMspCodesUrl = realModuleUrl('js/msp/MSPCodes.js');
const realBitHelperUrl = realModuleUrl('js/bitHelper.js');
const realInjectedMethodsUrl = realModuleUrl('js/injected_methods.js');

// FC has to be controllable: the MSP2_CF_SERIAL_CONFIG parse fills
// FC.SERIAL_CONFIG.ports and the crunch reads them back out.
const FC_STATE_ID = '__portsBaudrateFcState';
globalThis[FC_STATE_ID] = { SERIAL_CONFIG: { ports: [] } };

const fcStubUrl = stubModule('fc-stub.mjs',
    "const FC = globalThis['" + FC_STATE_ID + "'];\nexport default FC;\n");

const inertDefaultUrl = stubModule('inert-default.mjs', 'export default {};\n');
const i18nStubUrl = stubModule('i18n-stub.mjs',
    'const i18n = { getMessage(key) { return key; } };\nexport default i18n;\n');
const guiStubUrl = stubModule('gui-stub.mjs',
    'const GUI = { log() {} };\nexport default GUI;\n');
const inertFwApproachUrl = stubModule('fw-approach-stub.mjs', 'export const FwApproach = class {};\n');
const inertGeozoneUrl = stubModule('geozone-stub.mjs',
    'export const Geozone = class {};\nexport const GeozoneVertex = class {};\nexport const GeozoneShapes = {};\n');
const inertDronecanParseUrl = stubModule('dronecan-parse-stub.mjs',
    'export const parseDronecanAsyncRequestResponse = () => null;\n');

// The real serialPortHelper: getBauds/getBaudsIncluding are what the fix lives
// in, and maskToFunctions/functionsToMask are exercised by the parse/crunch
// round trip below. Only its three imports are redirected.
const realSerialPortHelperUrl = rewriteImports('js/serialPortHelper.js', [
    ["import FC from './fc';", "import FC from '" + fcStubUrl + "';"],
    ["import BitHelper from './bitHelper';", "import BitHelper from '" + realBitHelperUrl + "';"],
    ["import i18n from './localization';", "import i18n from '" + i18nStubUrl + "';"],
], 'serialPortHelper-generated.mjs');

// MSPHelper: the parse and crunch cases under test only reach MSPCodes, FC,
// BitHelper and serialPortHelper, so everything else just has to resolve.
// MSP and mspQueue are only touched from self.init() and the send helpers,
// which these tests never call.
const realMspHelperUrl = rewriteImports('js/msp/MSPHelper.js', [
    ["import semver from 'semver';", "import semver from '" + inertDefaultUrl + "';"],
    ["import './../injected_methods';", "import '" + realInjectedMethodsUrl + "';"],
    ["import GUI from './../gui';", "import GUI from '" + guiStubUrl + "';"],
    ["import i18n from './../localization';", "import i18n from '" + i18nStubUrl + "';"],
    ["import MSP from './../msp';", "import MSP from '" + inertDefaultUrl + "';"],
    ["import MSPCodes from './MSPCodes';", "import MSPCodes from '" + realMspCodesUrl + "';"],
    ["import FC from './../fc';", "import FC from '" + fcStubUrl + "';"],
    ["import VTX from './../vtx';", "import VTX from '" + inertDefaultUrl + "';"],
    ["import mspQueue from './../serial_queue';", "import mspQueue from '" + inertDefaultUrl + "';"],
    ["import ServoMixRule from './../servoMixRule';", "import ServoMixRule from '" + inertDefaultUrl + "';"],
    ["import MotorMixRule from './../motorMixRule';", "import MotorMixRule from '" + inertDefaultUrl + "';"],
    ["import LogicCondition from './../logicCondition';", "import LogicCondition from '" + inertDefaultUrl + "';"],
    ["import BitHelper from '../bitHelper';", "import BitHelper from '" + realBitHelperUrl + "';"],
    ["import serialPortHelper from './../serialPortHelper';", "import serialPortHelper from '" + realSerialPortHelperUrl + "';"],
    ["import ProgrammingPid from './../programmingPid';", "import ProgrammingPid from '" + inertDefaultUrl + "';"],
    ["import Safehome from './../safehome';", "import Safehome from '" + inertDefaultUrl + "';"],
    ["import { FwApproach } from './../fwApproach';", "import { FwApproach } from '" + inertFwApproachUrl + "';"],
    ["import Waypoint from './../waypoint';", "import Waypoint from '" + inertDefaultUrl + "';"],
    ["import mspDeduplicationQueue from './mspDeduplicationQueue';", "import mspDeduplicationQueue from '" + inertDefaultUrl + "';"],
    ["import mspStatistics from './mspStatistics';", "import mspStatistics from '" + inertDefaultUrl + "';"],
    ["import settingsCache from './../settingsCache';", "import settingsCache from '" + inertDefaultUrl + "';"],
    ["import {Geozone, GeozoneVertex, GeozoneShapes } from './../geozone';", "import { Geozone, GeozoneVertex, GeozoneShapes } from '" + inertGeozoneUrl + "';"],
    ["import { parseDronecanAsyncRequestResponse } from './../dronecanAsyncRequestParse';", "import { parseDronecanAsyncRequestResponse } from '" + inertDronecanParseUrl + "';"],
], 'MSPHelper-generated.mjs');

const { default: mspHelper } = await import(realMspHelperUrl);
const { default: MSPCodes } = await import(realMspCodesUrl);
const { default: serialPortHelper } = await import(realSerialPortHelperUrl);

const FC = globalThis[FC_STATE_ID];

// ---------------------------------------------------------------------------
// Firmware side of the contract
// ---------------------------------------------------------------------------

/**
 * baudRates[] from the firmware's src/main/io/serial.c, index == baudRate_e.
 * BAUD_AUTO (0) is the firmware's 0 entry, which the configurator calls AUTO.
 * MSP2_COMMON_SET_SERIAL_CONFIG clamps whatever byte it receives with
 * constrain(..., BAUD_MIN, BAUD_MAX), so an out-of-range byte is not ignored -
 * it lands on a real, wrong rate.
 */
const FIRMWARE_BAUD_RATES = [
    'AUTO', '1200', '2400', '4800', '9600', '19200', '38400', '57600',
    '115200', '230400', '250000', '460800', '921600', '1000000', '1500000',
    '2000000', '2470000',
];

const BAUD_2000000 = 15;
const BAUD_921600 = 12;
const BAUD_460800 = 11;
const BAUD_250000 = 10;
const BAUD_115200 = 8;

const FUNCTION_BLACKBOX = 1 << 7;

const BYTES_PER_PORT = 1 + 4 + 4;

/** Builds an MSP2_CF_SERIAL_CONFIG payload, the layout MSPHelper parses. */
function serialConfigPayload(ports) {
    const bytes = [];

    for (const port of ports) {
        bytes.push(port.identifier);
        bytes.push(port.functionMask & 0xFF);
        bytes.push((port.functionMask >> 8) & 0xFF);
        bytes.push((port.functionMask >> 16) & 0xFF);
        bytes.push((port.functionMask >>> 24) & 0xFF);
        bytes.push(port.msp, port.sensors, port.telemetry, port.peripherals);
    }

    return bytes;
}

/** Runs the real MSP2_CF_SERIAL_CONFIG parse over that payload. */
function loadSerialConfig(ports) {
    FC.SERIAL_CONFIG.ports = [];

    mspHelper.processData({
        code: MSPCodes.MSP2_CF_SERIAL_CONFIG,
        unsupported: false,
        message_buffer: new Uint8Array(serialConfigPayload(ports)).buffer,
    });

    return FC.SERIAL_CONFIG.ports;
}

/**
 * Runs the real MSP2_SET_CF_SERIAL_CONFIG crunch over FC.SERIAL_CONFIG and
 * returns the four baud indices per port, as the bytes that reach the FC.
 * crunch() builds a plain array, and send_message() copies it into a
 * Uint8Array - which is where a -1 turns into 255.
 */
function savedBaudIndices() {
    const buffer = mspHelper.crunch(MSPCodes.MSP2_SET_CF_SERIAL_CONFIG);
    const onTheWire = Array.from(new Uint8Array(buffer));
    const perPort = [];

    for (let offset = 0; offset < buffer.length; offset += BYTES_PER_PORT) {
        perPort.push({
            identifier: buffer[offset],
            crunched: buffer.slice(offset + 5, offset + 9),
            wire: onTheWire.slice(offset + 5, offset + 9),
        });
    }

    return perPort;
}

// ---------------------------------------------------------------------------
// The DOM behaviour the bug turns on
// ---------------------------------------------------------------------------

/**
 * The parts of a single-selection <select> and of jQuery's val() that decide
 * this bug. Modelled rather than driven, because there is no jsdom here.
 *
 *  - append(): the first option inserted into a single select becomes the
 *    selected one (HTML "ask for a reset" behaviour).
 *  - setValue(): jQuery valHooks.select.set walks the options for a matching
 *    value and, when none matches, does `elem.selectedIndex = -1` under the
 *    comment "Force browsers to behave consistently when non-matching value
 *    is set" (jquery 3.7.1, dist/jquery.js). Passing undefined or null goes
 *    through val()'s "Treat null/undefined as ''" branch first.
 *  - getValue(): jQuery valHooks.select.get returns `values`, initialised to
 *    null for a select-one, and skips its option loop entirely when
 *    selectedIndex < 0 - so an unmatched select reads back as null, not ''.
 */
class SelectElement {
    constructor() {
        this.options = [];
        this.selectedIndex = -1;
    }

    append(value, label) {
        this.options.push({ value: String(value), label: String(label) });

        if (this.selectedIndex === -1) {
            this.selectedIndex = 0;
        }
    }

    setValue(value) {
        const wanted = (value === undefined || value === null) ? '' : String(value);
        this.selectedIndex = this.options.findIndex((option) => option.value === wanted);
    }

    getValue() {
        return this.selectedIndex < 0 ? null : this.options[this.selectedIndex].value;
    }

    values() {
        return this.options.map((option) => option.value);
    }

    labels() {
        return this.options.map((option) => option.label);
    }
}

/**
 * How tabs/ports.js fills one baud rate drop-down after the fix (its
 * fillBaudrates()): options from the real getBaudsIncluding(), the extra entry
 * labelled as coming from the FC, then the reported rate selected.
 */
function renderBaudSelect(group, reportedBaud) {
    const offered = serialPortHelper.getBauds(group);
    const bauds = serialPortHelper.getBaudsIncluding(group, reportedBaud);
    const select = new SelectElement();

    for (const baud of bauds) {
        const label = (offered.indexOf(baud) === -1) ? baud + ' (from FC)' : baud;
        select.append(baud, label);
    }

    if (reportedBaud !== undefined && reportedBaud !== null && reportedBaud !== '') {
        select.setValue(reportedBaud);
    }

    return select;
}

/** How it was filled before the fix: the fixed group list, then `.val()`. */
function renderBaudSelectBeforeFix(group, reportedBaud) {
    const select = new SelectElement();

    for (const baud of serialPortHelper.getBauds(group)) {
        select.append(baud, baud);
    }

    select.setValue(reportedBaud);

    return select;
}

/**
 * Loads a serial config, renders every port's four baud drop-downs, reads them
 * straight back without touching any of them (the "changed something else in
 * the tab, then saved" case) and rebuilds FC.SERIAL_CONFIG the way
 * on_save_handler does. Returns the baud indices that reach the FC.
 */
function reloadRenderAndSave(ports, render) {
    const loaded = loadSerialConfig(ports);

    const rebuilt = loaded.map((serialPort) => {
        // The tab renders no row for USB VCP and keeps its config untouched.
        if (serialPort.identifier === 20) {
            return serialPort;
        }

        return {
            functions: serialPort.functions,
            msp_baudrate: render('MSP', serialPort.msp_baudrate).getValue(),
            telemetry_baudrate: render('TELEMETRY', serialPort.telemetry_baudrate).getValue(),
            sensors_baudrate: render('SENSOR', serialPort.sensors_baudrate).getValue(),
            peripherals_baudrate: render('PERIPHERAL', serialPort.peripherals_baudrate).getValue(),
            identifier: serialPort.identifier,
        };
    });

    FC.SERIAL_CONFIG.ports = rebuilt;

    return savedBaudIndices();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('the MSP baud rate table covers every rate the firmware can report', () => {
    // The index is the wire value, so a short table cannot decode - or write
    // back - anything above its last entry.
    assert.deepEqual(mspHelper.BAUD_RATES_post1_6_3, FIRMWARE_BAUD_RATES);
    assert.equal(
        mspHelper.BAUD_RATES_post1_6_3[BAUD_2000000],
        '2000000',
        'BAUD_2000000 is index 15 in the firmware enum and must decode to 2000000'
    );
});

test('a CLI-set rate the drop-down does not offer survives a save untouched', () => {
    // UART1 with BLACKBOX at 2000000 - the reporter's setup in inav#10615.
    const uart1 = {
        identifier: 0,
        functionMask: FUNCTION_BLACKBOX,
        msp: BAUD_115200,
        sensors: BAUD_115200,
        telemetry: 0,
        peripherals: BAUD_2000000,
    };

    const loaded = loadSerialConfig([uart1]);
    assert.equal(loaded[0].peripherals_baudrate, '2000000', 'the reported rate has to decode first');
    assert.equal(
        serialPortHelper.getBauds('PERIPHERAL').indexOf('2000000'),
        -1,
        'the peripherals drop-down must NOT offer 2000000 - the maintainer rejected adding it'
    );

    const select = renderBaudSelect('PERIPHERAL', loaded[0].peripherals_baudrate);
    assert.equal(select.getValue(), '2000000', 'the drop-down must show the rate the FC reported');
    assert.equal(
        select.labels()[select.selectedIndex],
        '2000000 (from FC)',
        'the extra entry is marked as coming from the flight controller'
    );

    const saved = reloadRenderAndSave([uart1], renderBaudSelect);
    assert.deepEqual(
        saved[0].crunched,
        [BAUD_115200, BAUD_115200, 0, BAUD_2000000],
        'saving without touching the rate must write the very same four indices back'
    );
});

test('before the fix the same save overwrote that rate (positive control)', () => {
    const uart1 = {
        identifier: 0,
        functionMask: FUNCTION_BLACKBOX,
        msp: BAUD_115200,
        sensors: BAUD_115200,
        telemetry: 0,
        peripherals: BAUD_2000000,
    };

    const select = renderBaudSelectBeforeFix('PERIPHERAL', '2000000');
    assert.equal(select.selectedIndex, -1, 'no option carries that value, so nothing stays selected');
    assert.equal(select.getValue(), null, 'jQuery reads an unmatched select-one back as null');

    const saved = reloadRenderAndSave([uart1], renderBaudSelectBeforeFix);
    assert.equal(saved[0].crunched[3], -1, 'BAUD_RATES.indexOf(null) is -1');
    assert.equal(saved[0].wire[3], 255, 'a -1 becomes 255 once send_message() copies it into a Uint8Array');
    assert.notEqual(saved[0].wire[3], BAUD_2000000, 'which is exactly how the rate was lost');
});

test('every column with its own rate is covered, not just peripherals', () => {
    // One port, all four rates set to something the firmware supports but the
    // matching drop-down group does not list: MSP stops at 230400, SENSOR at
    // 230400, TELEMETRY has no 250000, PERIPHERAL stops at 250000.
    const uart3 = {
        identifier: 2,
        functionMask: FUNCTION_BLACKBOX,
        msp: BAUD_921600,
        sensors: BAUD_460800,
        telemetry: BAUD_250000,
        peripherals: BAUD_2000000,
    };

    const groups = [['MSP', BAUD_921600], ['SENSOR', BAUD_460800], ['TELEMETRY', BAUD_250000], ['PERIPHERAL', BAUD_2000000]];
    for (const [group, index] of groups) {
        assert.equal(
            serialPortHelper.getBauds(group).indexOf(FIRMWARE_BAUD_RATES[index]),
            -1,
            group + ' is expected not to offer ' + FIRMWARE_BAUD_RATES[index] + ' - otherwise this case proves nothing'
        );
    }

    const saved = reloadRenderAndSave([uart3], renderBaudSelect);
    assert.deepEqual(saved[0].crunched, [BAUD_921600, BAUD_460800, BAUD_250000, BAUD_2000000]);

    const before = reloadRenderAndSave([uart3], renderBaudSelectBeforeFix);
    assert.deepEqual(before[0].crunched, [-1, -1, -1, -1], 'all four were lost before the fix');
});

test('rates the drop-down already offers are rendered and saved exactly as before', () => {
    const uart1 = {
        identifier: 0,
        functionMask: FUNCTION_BLACKBOX,
        msp: BAUD_115200,
        sensors: BAUD_115200,
        telemetry: 0,
        peripherals: BAUD_115200,
    };

    for (const group of ['MSP', 'SENSOR', 'TELEMETRY', 'PERIPHERAL']) {
        const offered = serialPortHelper.getBauds(group);
        const select = renderBaudSelect(group, '115200');

        assert.deepEqual(select.values(), offered, group + ': no extra entry may appear for an offered rate');
        assert.deepEqual(select.labels(), offered, group + ': and no entry may be relabelled');
        assert.equal(select.getValue(), '115200');
    }

    const saved = reloadRenderAndSave([uart1], renderBaudSelect);
    const before = reloadRenderAndSave([uart1], renderBaudSelectBeforeFix);
    assert.deepEqual(saved[0].crunched, before[0].crunched, 'the ordinary case must be untouched by the fix');
});

test('the extra entry is per drop-down and never leaks into the offered list', () => {
    const offeredBefore = serialPortHelper.getBauds('PERIPHERAL').slice();

    renderBaudSelect('PERIPHERAL', '2000000');
    renderBaudSelect('PERIPHERAL', '1500000');

    assert.deepEqual(
        serialPortHelper.getBauds('PERIPHERAL'),
        offeredBefore,
        'getBaudsIncluding() must not mutate the shared group list - the next port would inherit the entry'
    );
    assert.deepEqual(
        renderBaudSelect('PERIPHERAL', '115200').values(),
        offeredBefore,
        'a port on an ordinary rate must not be offered another port reported rate'
    );
});

test('tabs/ports.js really fills its baud drop-downs through getBaudsIncluding()', () => {
    // renderBaudSelect() above mirrors fillBaudrates() in tabs/ports.js, which
    // cannot be executed here (jQuery, no jsdom). This anchors the mirror: if
    // the tab stopped going through the helper, every assertion above would
    // still pass while the tab itself had regressed.
    const portsTab = readFileSync(join(repoRoot, 'tabs/ports.js'), 'utf8');

    assert.ok(
        portsTab.includes('serialPortHelper.getBaudsIncluding('),
        'tabs/ports.js must build its baud drop-downs from getBaudsIncluding()'
    );
    assert.ok(
        portsTab.includes("i18n.getMessage('portsBaudrateFromFC'"),
        'the extra entry must be labelled as coming from the flight controller'
    );

    for (const select of ['msp_baudrate', 'telemetry_baudrate', 'sensors_baudrate', 'peripherals_baudrate']) {
        assert.ok(
            portsTab.includes("fillBaudrates(port_configuration_e.find('select." + select + "')"),
            select + ' must be filled through fillBaudrates(), not set straight with .val()'
        );
    }

    const messages = JSON.parse(readFileSync(join(repoRoot, 'locale/en/messages.json'), 'utf8'));
    assert.ok(messages.portsBaudrateFromFC, 'locale/en/messages.json must carry the portsBaudrateFromFC label');
    assert.ok(
        messages.portsBaudrateFromFC.message.includes('$1'),
        'the label has to interpolate the rate itself'
    );
});

test('a USB VCP port keeps its rates even though the tab renders no row for it', () => {
    const usbVcp = {
        identifier: 20,
        functionMask: 1,
        msp: BAUD_115200,
        sensors: BAUD_115200,
        telemetry: 0,
        peripherals: BAUD_2000000,
    };
    const uart1 = {
        identifier: 0,
        functionMask: FUNCTION_BLACKBOX,
        msp: BAUD_115200,
        sensors: BAUD_115200,
        telemetry: 0,
        peripherals: BAUD_2000000,
    };

    const saved = reloadRenderAndSave([usbVcp, uart1], renderBaudSelect);

    assert.equal(saved[0].identifier, 20);
    assert.deepEqual(saved[0].crunched, [BAUD_115200, BAUD_115200, 0, BAUD_2000000]);
    assert.deepEqual(saved[1].crunched, [BAUD_115200, BAUD_115200, 0, BAUD_2000000]);
});
