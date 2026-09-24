import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { parse } from 'acorn';
import semver from 'semver';
import { resolveMspWrite } from '../js/mspWriteOutcome.js';

// Execute the production functions, with transport and FC state supplied here.
const source = readFileSync(new URL('../tabs/osd.js', import.meta.url), 'utf8');
const ast = parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
function setup() {
    const OSD = { data: { selected_layout: 0, items: { 1: { isVisible: true } } }, constants: {} };
    const names = ['is_item_supported', 'is_item_displayed', 'is_item_available', 'get_unreachable_items', 'saveItem'];
    const context = vm.createContext({ OSD, semver, resolveMspWrite,
        FC: { CONFIG: { flightControllerVersion: '10.0.0' }, getOsdDisabledFields: () => [] },
        MSPCodes: { MSP2_INAV_OSD_SET_LAYOUT_ITEM: 1 }, MSP: {} });
    for (const node of ast.body) {
        const left = node.expression?.left;
        if (left?.object?.name === 'OSD' && names.includes(left.property.name)) {
            vm.runInContext(source.slice(node.start, node.end), context);
        }
    }
    return { OSD, context };
}

test('an enabled gated element remains toggleable, but Save still identifies it for disabling', () => {
    const { OSD } = setup();
    const item = { id: 1, name: 'ESC_RPM' };
    const group = { enabled: () => false, items: [item] };
    OSD.constants.ALL_DISPLAY_GROUPS = [group];
    assert.equal(OSD.is_item_displayed(item, group), true);
    assert.equal(OSD.is_item_available(item, group), false);
    assert.deepEqual(Array.from(OSD.get_unreachable_items(), x => x.id), [1]);
    OSD.data.items[1].isVisible = false;
    assert.equal(OSD.is_item_displayed(item, group), false);
    assert.equal(OSD.get_unreachable_items().length, 0);
});

test('a second available group prevents disabling a shared element', () => {
    const { OSD } = setup();
    const item = { id: 1, name: 'ESC_RPM' };
    OSD.constants.ALL_DISPLAY_GROUPS = [{ enabled: () => false, items: [item] }, { items: [item] }];
    assert.equal(OSD.get_unreachable_items().length, 0);
});

test('saving another layout keeps its captured position and reports a dropped write', async () => {
    const { OSD, context } = setup();
    const captured = { isVisible: false, position: 17 };
    let encoded;
    OSD.msp = { encodeLayoutItem(...args) { encoded = args; return [1]; } };
    context.MSP.promise = () => Promise.resolve(false);
    let called = false;
    const item = { id: 1 };
    assert.equal(await OSD.saveItem(item, () => { called = true; }, 2, captured), false);
    assert.equal(encoded[0], 2);
    assert.equal(encoded[2], captured);
    assert.equal(called, false);
});
