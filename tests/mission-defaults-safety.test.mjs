import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parse} from 'acorn';

// Execute the production functions unchanged. The tab normally needs Electron, Vite
// and an OpenLayers map; only those surrounding services are replaced here.
const source = readFileSync(process.env.MISSION_CONTROL_SOURCE || new URL('../tabs/mission_control.js', import.meta.url), 'utf8');
const names = new Set(['resolveHomeElevationCm', 'homePositionKey', 'invalidateHomeElevation',
    'applyMissionDefaultsLocked', 'missionWasReplaced', 'collectionChangedSince',
    'settleDraggedWaypoint', 'waypointPositionKey', 'settleLandingApproach',
    'convertLandingApproach', 'writeDefaultsToWaypoint', 'writeSpeedToWaypoint',
    'applySpeedToWaypoints', 'resolveGroundsForDefaults']);
const functions = [];
function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration' && names.has(node.id.name)) functions.push(source.slice(node.start, node.end));
    for (const value of Object.values(node)) {
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === 'object') visit(value);
    }
}
visit(parse(source, {ecmaVersion: 'latest', sourceType: 'module'}));
function deferred() {
    let resolve, reject;
    const promise = new Promise((yes, no) => {resolve = yes; reject = no;});
    return {promise, resolve, reject};
}
function waypoint(number, action = 1) {
    const data = {Number: number, Action: action, LatMap: 47, LonMap: 8, Alt: 5000, P1: 0, P2: 0, P3: 0, MultiMissionIdx: 0};
    const wp = {getElevation: async () => 250};
    for (const key of Object.keys(data)) {
        wp['get' + key] = () => data[key];
        wp['set' + key] = value => {data[key] = value;};
    }
    return wp;
}
function harness() {
    const wp = waypoint(0);
    const approach = {};
    const values = {ApproachAltAsl: 6000, LandAltAsl: 500, Elevation: 0, IsSeaLevelRef: 0};
    for (const key of Object.keys(values)) {
        approach['get' + key] = () => values[key];
        approach['set' + key] = value => {values[key] = value;};
    }
    const elements = new Map();
    const $ = selector => {
        if (!elements.has(selector)) elements.set(selector, {value: 0, checked: false,
            val(value) {if (value === undefined) return this.value; this.value = value; return this;},
            prop() {return this.checked;}, text() {return this;}, show() {}, hide() {}});
        return elements.get(selector);
    };
    const state = {items: [wp], writes: 0};
    const HOME = waypoint(0);
    HOME.setAlt(200);
    const ctx = vm.createContext({$, HOME, homeMarkers: [{}], homeElevationPosition: null,
        homeElevationRequest: null, pendingWaypointDrags: new WeakMap(),
        locationLifecycleId: 1, missionControlLocationLifecycleId: 1,
        globalSettings: {}, settings: {alt: 8000, speed: 300}, seaLevelSwitchOnOpen: false,
        groundBeforeDragCm: Promise.resolve(20000),
        mission: {get: () => state.items, updateWaypoint: wp => {state.writes++; state.items[wp.getNumber()] = wp;}, update() {}},
        wpListSelectableWaypoints: () => state.items.slice(),
        MWNP: {WPTYPE: {WAYPOINT: 1, POSHOLD_TIME: 3, SET_POI: 5, LAND: 8}, P3: {ALT_TYPE: 0}},
        missionControlTab: {isBitSet: (value, bit) => !!(value & (1 << bit)), setBit: (value, bit, on) => on ? value | (1 << bit) : value & ~(1 << bit)},
        FC: {FW_APPROACH: {get: () => [approach]}, SAFEHOMES: {getMaxSafehomeCount: () => 0}},
        GUI: {log() {}}, i18n: {getMessage: key => key}, console: {warn() {}},
        saveSettings() {}, changeSwitch() {}, refreshSeaLevelSwitch() {},
        singleMissionActive() {return true;}, syncEditPanelWithSelection() {}, redrawLayer() {},
        plotElevation() {}, reportDefaultsApplied() {}, rememberTerrain() {}, endsBelowGround() {return false;},
        renderWaypointSelect() {}, selectedMarker: null, checkAltElevSanity: (_, alt) => alt,
        fetchWaypointElevations: async () => [250],
    });
    vm.runInContext(functions.join('\n'), ctx);
    return {ctx, wp, HOME, state, approach, $};
}

for (const gotGrounds of [true, false]) {
    test(`save abandons captured waypoints after failed fetch (grounds result ${gotGrounds})`, async () => {
        const {ctx, state} = harness();
        const wait = deferred();
        ctx.resolveGroundsForDefaults = () => wait.promise;
        const saving = ctx.applyMissionDefaultsLocked(5000, 100);
        const replacement = [waypoint(0), waypoint(1), waypoint(2)];
        state.items = replacement;
        wait.resolve(gotGrounds);
        await saving;
        assert.equal(state.writes, 0);
        assert.deepEqual(state.items, replacement);
    });
}

test('save abandons home or waypoint movement during elevation wait', async () => {
    for (const moveHome of [true, false]) {
        const {ctx, HOME, wp, state} = harness();
        const wait = deferred();
        ctx.resolveGroundsForDefaults = () => wait.promise;
        const saving = ctx.applyMissionDefaultsLocked(5000, 100);
        (moveHome ? HOME : wp).setLatMap(48);
        wait.resolve(true);
        await saving;
        assert.equal(state.writes, 0);
    }
});

test('unchanged mission still receives defaults after terrain failure for relative altitude', async () => {
    const {ctx, wp, state} = harness();
    ctx.fetchWaypointElevations = async () => null;
    await ctx.applyMissionDefaultsLocked(5000, 100);
    assert.equal(state.writes, 1);
    assert.equal(wp.getAlt(), 8000);
    assert.equal(wp.getP1(), 300);
});

test('failed home lookup rejects a stale numeric altitude and permits retry', async () => {
    const {ctx, HOME} = harness();
    HOME.getElevation = async () => {throw new Error('offline');};
    assert.equal(await ctx.resolveHomeElevationCm(), null);
    assert.equal(HOME.getAlt(), 'N/A');
    HOME.getElevation = async () => 400;
    assert.equal(await ctx.resolveHomeElevationCm(), 40000);
});

test('late home response cannot overwrite the elevation of a newer position', async () => {
    const {ctx, HOME} = harness();
    const old = deferred();
    HOME.setAlt('N/A');
    HOME.getElevation = () => old.promise;
    const first = ctx.resolveHomeElevationCm();
    HOME.setLatMap(48);
    HOME.getElevation = async () => 400;
    assert.equal(await ctx.resolveHomeElevationCm(), 40000);
    old.resolve(200);
    assert.equal(await first, null);
    assert.equal(HOME.getAlt(), 400);
});

test('home lookup accepts genuine zero elevation and shares an in-flight request', async () => {
    const {ctx, HOME} = harness();
    const wait = deferred();
    let calls = 0;
    HOME.setAlt('N/A');
    HOME.getElevation = () => {calls++; return wait.promise;};
    const first = ctx.resolveHomeElevationCm();
    const second = ctx.resolveHomeElevationCm();
    wait.resolve(0);
    assert.equal(await first, 0);
    assert.equal(await second, 0);
    assert.equal(calls, 1);
});

for (const phase of ['before ground', 'after ground']) {
    test(`deleted waypoint stays deleted ${phase}`, async () => {
        const {ctx, wp, state} = harness();
        const wait = deferred();
        if (phase === 'before ground') ctx.groundBeforeDragCm = wait.promise;
        else wp.getElevation = () => wait.promise;
        const settling = ctx.settleDraggedWaypoint(wp, false);
        await Promise.resolve();
        const replacement = waypoint(0);
        state.items = [replacement];
        wait.resolve(250);
        await settling;
        assert.equal(state.writes, 0);
        assert.equal(state.items[0], replacement);
    });
}

test('a second drag supersedes an outstanding terrain response', async () => {
    const {ctx, wp, state} = harness();
    const wait = deferred();
    wp.setP3(1); wp.setAlt(26000);
    wp.getElevation = () => wait.promise;
    const first = ctx.settleDraggedWaypoint(wp, false);
    await Promise.resolve();
    wp.setLatMap(48);
    wp.getElevation = async () => 300;
    await ctx.settleDraggedWaypoint(wp, false);
    assert.equal(wp.getAlt(), 36000);
    wait.resolve(250);
    await first;
    assert.equal(wp.getAlt(), 36000);
    assert.equal(state.writes, 1);
});

test('LAND approach converts through landing terrain and does not jump on an unchanged-ground drag', () => {
    const {ctx, wp, approach} = harness();
    wp.setAction(8);
    const plan = {switchMoved: true, toAbsolute: true, homeCm: 20000, terrainCm: [25000], applyAlt: false};
    ctx.writeDefaultsToWaypoint(wp, 0, plan);
    assert.equal(wp.getAlt(), 25000);
    assert.equal(approach.getApproachAltAsl(), 31000);
    assert.equal(approach.getLandAltAsl(), 25500);
    assert.equal(approach.getElevation(), 25000);
    ctx.settleLandingApproach(wp, 250);
    assert.equal(approach.getApproachAltAsl(), 31000);
    ctx.writeDefaultsToWaypoint(wp, 0, {...plan, toAbsolute: false});
    assert.equal(wp.getAlt(), 5000);
    assert.equal(approach.getApproachAltAsl(), 6000);
    assert.equal(approach.getLandAltAsl(), 500);
});

test('reference conversion refuses missing home and missing LAND terrain', async () => {
    const {ctx, wp} = harness();
    const plan = () => ({switchMoved: true, toAbsolute: true, applyAlt: false, homeCm: null, terrainCm: null});
    ctx.resolveHomeElevationCm = async () => null;
    assert.equal(await ctx.resolveGroundsForDefaults([wp], plan(), () => {}), false);
    ctx.resolveHomeElevationCm = async () => 20000;
    ctx.fetchWaypointElevations = async () => null;
    wp.setAction(8);
    assert.equal(await ctx.resolveGroundsForDefaults([wp], plan(), () => {}), false);
    wp.setAction(1);
    assert.equal(await ctx.resolveGroundsForDefaults([wp], plan(), () => {}), true);
});

test('invalid home elevations never become a conversion datum', async () => {
    for (const value of [null, '', 'N/A', NaN, Infinity]) {
        const {ctx, HOME} = harness();
        HOME.getElevation = async () => value;
        assert.equal(await ctx.resolveHomeElevationCm(), null);
        assert.equal(HOME.getAlt(), 'N/A');
    }
});

test('home removal and tab cleanup discard pending home responses', async () => {
    for (const cleanup of [false, true]) {
        const {ctx, HOME} = harness();
        const wait = deferred();
        HOME.getElevation = () => wait.promise;
        const request = ctx.resolveHomeElevationCm();
        if (cleanup) ctx.missionControlLocationLifecycleId++;
        else ctx.homeMarkers = [];
        wait.resolve(300);
        assert.equal(await request, null);
        assert.equal(HOME.getAlt(), 'N/A');
    }
});

test('failed LAND terrain lookup preserves both references and heights while applying speed', async () => {
    const {ctx, wp, approach, $, state} = harness();
    const cruise = waypoint(1);
    state.items.push(cruise);
    wp.setAction(8);
    $('#MPapplySlrValue').checked = true;
    ctx.resolveHomeElevationCm = async () => 20000;
    ctx.fetchWaypointElevations = async () => null;
    await ctx.applyMissionDefaultsLocked(5000, 100);
    assert.equal(wp.getP3(), 0);
    assert.equal(wp.getAlt(), 5000);
    assert.equal(approach.getIsSeaLevelRef(), 0);
    assert.equal(approach.getApproachAltAsl(), 6000);
    assert.equal(approach.getLandAltAsl(), 500);
    assert.equal(cruise.getP1(), 300);
});
