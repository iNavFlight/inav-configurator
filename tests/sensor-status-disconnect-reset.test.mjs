#!/usr/bin/env node
/**
 * Regression tests for the sensor status row reset on disconnect.
 *
 * finishDisconnect() in js/serial_backend.js resets the header status bar by
 * calling privateScope.sensor_status(0) under the comment "reset active sensor
 * indicators". That handler used to read a bare global SENSOR_STATUS, which
 * stopped existing when the app moved to modules and became FC.SENSOR_STATUS.
 * Its own `typeof ... === 'undefined'` guard then matched on every call, so the
 * reset silently did nothing: the icons kept the previous connection's picture
 * and sensor_status_ex's memoised hash kept the previous connection's value for
 * the lifetime of the process. Reconnecting to a board whose sensors had
 * changed - after a firmware flash, say - could therefore keep showing the old
 * board's sensors, and only restarting the Configurator cleared it.
 *
 * js/serial_backend.js pulls in the whole app (Electron, jBox, three.js, the
 * tabs), so it cannot be imported here. Instead the sensor status handlers are
 * lifted verbatim out of the real source text and evaluated against the real
 * BitHelper and the real FC.SENSOR_STATUS shape, so these tests fail if that
 * production code regresses.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const tmpDir = mkdtempSync(join(tmpdir(), 'sensor-status-disconnect-reset-'));
process.on('exit', () => rmSync(tmpDir, { recursive: true, force: true }));

const SENSOR_ROWS = [
    { li: '.gyro', icon: '.gyroicon', field: 'gyroHwStatus' },
    { li: '.accel', icon: '.accicon', field: 'accHwStatus' },
    { li: '.mag', icon: '.magicon', field: 'magHwStatus' },
    { li: '.baro', icon: '.baroicon', field: 'baroHwStatus' },
    { li: '.gps', icon: '.gpsicon', field: 'gpsHwStatus' },
    { li: '.sonar', icon: '.sonaricon', field: 'rangeHwStatus' },
    { li: '.airspeed', icon: '.airspeedicon', field: 'speedHwStatus' },
    { li: '.opflow', icon: '.opflowicon', field: 'flowHwStatus' },
];

/**
 * Cut a region out of a real source file between two literal anchors, failing
 * loudly if the source moved on, rather than silently testing nothing.
 */
function sliceSource(relPath, startAnchor, endAnchor, endOffset) {
    const source = readFileSync(join(repoRoot, relPath), 'utf8');

    const start = source.indexOf(startAnchor);
    assert.notEqual(start, -1,
        'sensor-status-disconnect-reset.test.mjs: could not find "' + startAnchor +
        '" in ' + relPath + '. Update the test anchors.');

    const end = source.indexOf(endAnchor, start);
    assert.notEqual(end, -1,
        'sensor-status-disconnect-reset.test.mjs: could not find "' + endAnchor +
        '" after "' + startAnchor + '" in ' + relPath + '. Update the test anchors.');

    return source.slice(start, end + (endOffset || 0));
}

// The SENSOR_STATUS object literal FC.resetState() installs on every connect,
// taken from the real js/fc.js so the tests use the production shape.
const fcSensorStatusLiteral = sliceSource('js/fc.js', 'this.SENSOR_STATUS = {', '};', 2);

// The four sensor status handlers plus have_sensor, verbatim from the real
// js/serial_backend.js. sensor_status() is the one finishDisconnect() calls.
const sensorStatusHandlers = sliceSource(
    'js/serial_backend.js',
    'privateScope.sensor_status_ex = function (hw_status)',
    '    return publicScope;');

const realBitHelperUrl = pathToFileURL(join(repoRoot, 'js/bitHelper.js')).href;

let generatedCount = 0;

function writeModule(prefix, source) {
    generatedCount += 1;
    const outPath = join(tmpDir, prefix + '-' + generatedCount + '.mjs');
    writeFileSync(outPath, source, 'utf8');
    return pathToFileURL(outPath).href;
}

/**
 * A jQuery stand-in for the two call shapes sensor_status_update_icon() uses:
 * $('#sensor-status') for the row, and $(selector, row) for one icon inside it.
 * It records the classes each selector ends up with.
 */
function installSensorRowDomStub() {
    const classes = new Map();

    function classesFor(selector) {
        if (!classes.has(selector)) {
            classes.set(selector, new Set());
        }
        return classes.get(selector);
    }

    function element(selector) {
        const own = classesFor(selector);
        return {
            addClass(name) { own.add(name); return this; },
            removeClass(name) { own.delete(name); return this; },
        };
    }

    const row = { sensorStatusRow: true };

    global.$ = function jQueryStub(selector, context) {
        if (selector === '#sensor-status') {
            return row;
        }
        assert.ok(context === row,
            'the sensor row handlers should only look up icons inside #sensor-status, got ' +
            String(selector) + ' with an unexpected context');
        return element(selector);
    };

    return {
        has(selector, name) { return classes.has(selector) && classes.get(selector).has(name); },
        classesOf(selector) { return classes.has(selector) ? [...classes.get(selector)].sort() : []; },
    };
}

/**
 * Load a fresh copy of the production sensor status handlers, so each test
 * starts with an empty sensor_status_ex.previousHash memo and its own FC state.
 */
async function loadSensorStatusHandlers() {
    const fcUrl = writeModule('fc-stub', [
        'const FC = {',
        '    SENSOR_STATUS: null,',
        '    resetState: function () {',
        '        ' + fcSensorStatusLiteral,
        '    }',
        '};',
        '',
        'export default FC;',
        '',
    ].join('\n'));

    const moduleUrl = writeModule('sensor-status', [
        'import FC from ' + JSON.stringify(fcUrl) + ';',
        'import BitHelper from ' + JSON.stringify(realBitHelperUrl) + ';',
        '',
        'var publicScope = {},',
        '    privateScope = {};',
        '',
        sensorStatusHandlers,
        'export { FC, publicScope, privateScope };',
        '',
    ].join('\n'));

    const loaded = await import(moduleUrl);
    loaded.FC.resetState();
    return loaded;
}

/** A board with gyro, accelerometer, compass, barometer and GPS present. */
function connectedBoardStatus() {
    return {
        isHardwareHealthy: 1,
        gyroHwStatus: 1,
        accHwStatus: 1,
        magHwStatus: 1,
        baroHwStatus: 1,
        gpsHwStatus: 1,
        rangeHwStatus: 0,
        speedHwStatus: 0,
        flowHwStatus: 0,
    };
}

test('sensor_status_ex lights the icons a connected board reports (positive control)', async () => {
    const dom = installSensorRowDomStub();
    const { privateScope } = await loadSensorStatusHandlers();

    privateScope.sensor_status_ex(connectedBoardStatus());

    for (const row of ['.gyroicon', '.accicon', '.magicon', '.baroicon', '.gpsicon']) {
        assert.ok(dom.has(row, 'active'),
            row + ' should be active for a board that reports the sensor present');
    }
    for (const row of ['.sonaricon', '.airspeedicon', '.opflowicon']) {
        assert.deepEqual(dom.classesOf(row), [],
            row + ' should stay off for a board that reports no such sensor');
    }
});

test('the disconnect reset clears every sensor icon the previous connection lit', async () => {
    const dom = installSensorRowDomStub();
    const { privateScope } = await loadSensorStatusHandlers();

    privateScope.sensor_status_ex(connectedBoardStatus());

    // Exactly what finishDisconnect() in js/serial_backend.js calls.
    privateScope.sensor_status(0);

    for (const row of SENSOR_ROWS) {
        assert.deepEqual(dom.classesOf(row.li), [],
            row.li + ' should carry no state after disconnect, or the row keeps advertising ' +
            'the disconnected board');
        assert.deepEqual(dom.classesOf(row.icon), [],
            row.icon + ' should carry no state after disconnect, or the row keeps advertising ' +
            'the disconnected board');
    }
});

test('the disconnect reset writes through FC.SENSOR_STATUS, not a bare global', async () => {
    installSensorRowDomStub();
    const { FC, privateScope } = await loadSensorStatusHandlers();

    FC.SENSOR_STATUS.gyroHwStatus = 1;
    FC.SENSOR_STATUS.magHwStatus = 2;
    FC.SENSOR_STATUS.gpsHwStatus = 1;

    privateScope.sensor_status(0);

    for (const row of SENSOR_ROWS) {
        assert.equal(FC.SENSOR_STATUS[row.field], 0,
            'FC.SENSOR_STATUS.' + row.field + ' should be cleared by the disconnect reset');
    }
});

test('the disconnect reset drops the memoised hash so the next connection redraws', async () => {
    const dom = installSensorRowDomStub();
    const { privateScope } = await loadSensorStatusHandlers();

    privateScope.sensor_status_ex(connectedBoardStatus());
    const hashWhileConnected = privateScope.sensor_status_ex.previousHash;

    privateScope.sensor_status(0);

    assert.notEqual(privateScope.sensor_status_ex.previousHash, hashWhileConnected,
        'the memoised hash should not survive a disconnect, or the first report of the next ' +
        'connection is skipped as a duplicate');

    // Same hardware reported again on the next connection: the row must be
    // redrawn rather than suppressed by a hash left over from last time.
    privateScope.sensor_status_ex(connectedBoardStatus());

    assert.ok(dom.has('.gpsicon', 'active'),
        'the GPS icon should light up again on the next connection');
    assert.ok(dom.has('.gps', 'on'),
        'the GPS row should light up again on the next connection');
});

test('the disconnect reset stays a no-op before FC state exists', async () => {
    installSensorRowDomStub();
    const { FC, privateScope } = await loadSensorStatusHandlers();

    // FC.SENSOR_STATUS is null until the first FC.resetState(); a disconnect
    // before any connection completed must not throw.
    FC.SENSOR_STATUS = null;

    privateScope.sensor_status(0);
});
