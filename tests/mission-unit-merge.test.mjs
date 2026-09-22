import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parse } from 'acorn';
import { globalSettings, UnitType } from '../js/globalSettings.js';
import { fromDisplayUnits, toDisplayUnits } from '../js/unitConversion.js';

const source = readFileSync(new URL('../tabs/mission_control.js', import.meta.url), 'utf8');
const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
const functions = new Map();
function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'FunctionDeclaration') functions.set(node.id.name, source.slice(node.start, node.end));
    for (const value of Object.values(node)) {
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === 'object') visit(value);
    }
}
visit(ast);
function setup() {
    const fields = new Map();
    const context = vm.createContext({ fromDisplayUnits, toDisplayUnits,
        MISSION_UNIT_ALT: 'cm', dictOfUnitParameterPoint: { 1: { parameter1: 'cms' } },
        selectedMarker: { getAlt: () => 15240, getP1: () => 500, getP2: () => 7, getP3: () => 0, getAction: () => 1 },
        MWNP: { WPTYPE: { LAND: 8 }, P3: { ALT_TYPE: 1 } },
        missionControlTab: { isBitSet: () => false }, changeSwitch() {}, refreshGroundClearanceDisplay() {},
        $(selector) { return {
            val(...args) { if (args.length) fields.set(selector, args[0]); return fields.get(selector); },
            text(value) { fields.set(selector + ':text', value); }
        }; }
    });
    for (const name of ['altitudeToDisplay', 'altitudeReadout', 'parameterUnit', 'parameterToDisplay', 'readNumericField', 'syncEditPanelWithSelection', 'wpListLabel']) {
        vm.runInContext(functions.get(name), context);
    }
    return { context, fields };
}

for (const units of [UnitType.none, UnitType.metric, UnitType.imperial]) {
    test(`selected waypoint fields and default input use ${units} units`, () => {
        globalSettings.unitType = units;
        const { context, fields } = setup();
        context.syncEditPanelWithSelection();
        assert.equal(fields.get('#pointAlt'), toDisplayUnits(15240, 'cm').text);
        assert.equal(fields.get('#pointP1'), toDisplayUnits(500, 'cms').text);
        assert.equal(fields.get('#pointP2'), 7);
        fields.set('#default', 'invalid');
        assert.equal(context.readNumericField('#default', 15240, 'cm'), 15240);
        assert.equal(fields.get('#default'), toDisplayUnits(15240, 'cm').text);
        fields.set('#default', '25');
        assert.equal(context.readNumericField('#default', 15240, 'cm'), fromDisplayUnits(25, 'cm'));
    });
}

test('the waypoint selector includes the numeric altitude in imperial units', () => {
    globalSettings.unitType = UnitType.imperial;
    const { context } = setup();
    assert.match(context.wpListLabel({ getLayerNumber: () => 0, getAction: () => 1, getAlt: () => 15240 }), /500\s+ft/);
});
