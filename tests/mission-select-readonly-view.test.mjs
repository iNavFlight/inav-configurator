import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parse} from 'acorn';

// The all-missions view locks editing (disableMarkerEdit). Selecting a waypoint there by
// click, list or keyboard goes through selectWaypointMarkerByNumber and must leave the
// missions as they are: no approach defaults, no altitude lift after the terrain lookup.
const source = readFileSync(process.env.MISSION_CONTROL_SOURCE || new URL('../tabs/mission_control.js', import.meta.url), 'utf8');
const wanted = new Set(['selectWaypointMarkerByNumber', 'checkAltElevSanity', 'refreshGroundClearanceDisplay']);
const extracted = {};
function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration' && wanted.has(node.id.name) && !extracted[node.id.name]) {
        extracted[node.id.name] = source.slice(node.start, node.end);
    }
    for (const value of Object.values(node)) {
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === 'object') visit(value);
    }
}
visit(parse(source, {ecmaVersion: 'latest', sourceType: 'module'}));

function jqueryStub(fields) {
    return selector => {
        const chain = new Proxy({}, {
            get(_target, prop) {
                if (prop === 'val' || prop === 'text') {
                    return value => {
                        if (value !== undefined) fields[selector] = value;
                        return value === undefined ? fields[selector] : chain;
                    };
                }
                return () => chain;
            },
        });
        return chain;
    };
}

function makeWaypoint({alt, p3}) {
    let altitude = alt;
    return {
        getAlt: () => altitude,
        setAlt: value => { altitude = value; },
        getP3: () => p3,
        getP1: () => 0,
        getP2: () => 0,
        getAction: () => 1,
        getLayerNumber: () => 0,
        getNumber: () => 0,
        getMultiMissionIdx: () => 1,
        getElevation: async () => 300,
    };
}

function makeApproach() {
    const state = {approach: 0, land: 0, seaLevelRef: 0};
    return {
        state,
        getLandHeading1: () => 0,
        getLandHeading2: () => 0,
        getApproachDirection: () => 0,
        getApproachAltAsl: () => state.approach,
        getLandAltAsl: () => state.land,
        setApproachAltAsl: value => { state.approach = value; },
        setLandAltAsl: value => { state.land = value; },
        setIsSeaLevelRef: value => { state.seaLevelRef = value; },
    };
}

async function selectIn({readOnly}) {
    // absolute altitude 250 m over 300 m ground: below the terrain, so an editable view lifts it
    const wp = makeWaypoint({alt: 25000, p3: 1});
    const approach = makeApproach();
    const fields = {};
    const remembered = [];
    const ctx = vm.createContext({
        console,
        $: jqueryStub(fields),
        document: {getElementById: () => ({style: {}})},
        dialog: {alert: () => {}},
        i18n: {getMessage: key => key},
        disableMarkerEdit: readOnly,
        selectedMarker: null,
        selectedFeature: null,
        selectedFwApproachWp: null,
        mission: {getWaypoint: () => wp},
        markers: [{getSource: () => ({getFeatures: () => [{getGeometry: () => ({getCoordinates: () => [0, 0]}), setStyle: () => {}}]})}],
        FC: {
            FW_APPROACH: {get: () => [null, approach]},
            SAFEHOMES: {getMaxSafehomeCount: () => 0},
        },
        settings: {alt: 5000, fwApproachAlt: 60, fwLandAlt: 5},
        globalSettings: {},
        homeMarkers: [],
        HOME: {getAlt: () => 'N/A'},
        MWNP: {P3: {ALT_TYPE: 0, USER_ACTION_1: 1, USER_ACTION_2: 2, USER_ACTION_3: 3, USER_ACTION_4: 4}, WPTYPE: {LAND: 8}},
        missionControlTab: {isBitSet: (value, bit) => ((value >> bit) & 1) === 1},
        dictOfLabelParameterPoint: {},
        toLonLat: coord => coord,
        getWaypointIcon: () => null,
        changeSwitch: () => {},
        altitudeToDisplay: cm => cm / 100,
        altitudeReadout: cm => `${cm / 100} m`,
        parameterToDisplay: (_action, _name, value) => value,
        parameterLabel: () => '',
        rememberTerrain: (point, elevation) => { remembered.push([point, elevation]); },
        renderWaypointOptionsTable: marker => marker,
        plotElevation: () => {},
        redrawLayer: () => {},
    });
    for (const name of wanted) vm.runInContext(extracted[name], ctx);
    ctx.selectWaypointMarkerByNumber(0, null);
    await new Promise(resolve => setImmediate(resolve));
    return {wp, approach, ctx, fields, remembered};
}

test('selecting in the all-missions view leaves waypoint and approach unchanged', async () => {
    const {wp, approach, ctx, fields} = await selectIn({readOnly: true});
    assert.equal(ctx.selectedMarker, wp, 'the waypoint is still selected');
    assert.equal(wp.getAlt(), 25000);
    assert.deepEqual(approach.state, {approach: 0, land: 0, seaLevelRef: 0});
    // the terrain and the clearance are still reported, against the stored altitude
    assert.equal(fields['#elevationValueAtWP'], 300);
    assert.equal(fields['#groundClearanceValueAtWP'], -50);
    assert.equal(fields['#pointAlt'], 250);
});

test('selecting in the single-mission view still applies approach defaults and lifts the altitude', async () => {
    const {wp, approach, fields, remembered} = await selectIn({readOnly: false});
    assert.equal(wp.getAlt(), 5000 + 300 * 100);
    assert.deepEqual(approach.state, {approach: 6000, land: 500, seaLevelRef: 1});
    assert.equal(fields['#elevationValueAtWP'], 300);
    assert.equal(remembered.length, 1);
});
