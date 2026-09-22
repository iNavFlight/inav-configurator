import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import * as direction from '../js/escDirection.js';
import MSPCodes from '../js/msp/MSPCodes.js';

// Run the real controller with deterministic MSP responses and a minimal DOM
// adapter. No controller statements are changed; only module bindings differ.
const source = readFileSync(new URL('../js/escDirectionPanel.js', import.meta.url), 'utf8')
    .replace(/^import .*;$/gm, '').replace('export function mountEscDirection', 'function mountEscDirection');
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };
function harness({ multirotor = true, inverted = false } = {}) {
    const nodes = new Map(), timers = new Map(), calls = [];
    const node = id => {
        if (!nodes.has(id)) nodes.set(id, { props: {}, attrs: {}, events: {}, children: [] });
        return nodes.get(id);
    };
    const dialog = node('#esc-direction-dialog');
    dialog.showModal = () => { dialog.open = true; };
    dialog.close = () => { dialog.open = false; };
    function $(selector) {
        const elements = typeof selector !== 'string' ? [selector] : selector.startsWith('<') ?
            [{ props: {}, attrs: {}, events: {}, children: [] }] :
            selector.split(',').flatMap(s => s.trim() === '#esc-wizard-motors button' ? node('#esc-wizard-motors').children : [node(s.trim())]);
        const api = {
            prop(key, value) { if (arguments.length === 1) return elements[0]?.props[key]; elements.forEach(e => e.props[key] = value); return api; },
            attr(key, value) { if (arguments.length === 1) return elements[0]?.attrs[key]; elements.forEach(e => e.attrs[key] = value); return api; },
            data(key, value) { return arguments.length === 1 ? api.attr(key) : api.attr(key, value); },
            text(value) { if (!arguments.length) return elements[0]?.text; elements.forEach(e => e.text = value); return api; },
            empty() { elements.forEach(e => { e.text = ''; e.children = []; }); return api; },
            append(child) { elements[0].children.push(...child.elements); return api; },
            on(names, handler) { names.split(' ').forEach(name => elements.forEach(e => e.events[name.split('.')[0]] = handler)); return api; },
            off() { elements.forEach(e => e.events = {}); return api; },
            each(fn) { elements.forEach(e => fn.call(e)); return api; },
            toggleClass() { return api; }, css() { return api; }, elements,
        };
        return api;
    }
    const FC = { isMultirotor: () => multirotor, MIXER_CONFIG: { appliedMixerPreset: 3 },
        MOTOR_RULES: { get: () => Array.from({length: 4}, () => ({ getRoll: () => -1, getPitch: () => 1 })) } };
    const status = { supportsTest: true, count: 4, phase: 0, token: 0, testToken: 0, testActive: false, simulated: true };
    const mount = vm.runInNewContext(source + '\nmountEscDirection', { ...direction, $, document: { ...node('document'), getElementById: () => dialog }, window: node('window'),
        mixer: { getById: () => ({ image: 'quad_x' }) }, quadImage: 'quad_x.svg', quadReverseImage: 'quad_x_reverse.svg' });
    const dispose = mount({ MSPCodes, FC, isArmed: () => false, isMotorDirectionInverted: () => inverted,
        i18n: { getMessage: key => key }, interval: { add: (name, fn) => timers.set(name, fn), remove: name => timers.delete(name) },
        MSP: { promise: (code, payload) => new Promise(resolve => calls.push({code, payload, resolve})) } });
    async function answer(call, result = {length: call.code === MSPCodes.MSP2_INAV_ESC_DIRECTION ? 10 : 0}, next = status) {
        if (call.code === MSPCodes.MSP2_INAV_ESC_DIRECTION) FC.ESC_DIRECTION = next;
        else FC[call.code === MSPCodes.MSP2_INAV_SET_ESC_DIRECTION ? 'ESC_DIRECTION_WRITE_ACK' : 'ESC_DIRECTION_TEST_ACK'] = result !== false;
        call.resolve(result); await flush();
    }
    const fire = (id, event = 'click') => node(id).events[event]?.({button: 0, preventDefault() {}});
    async function open() { await answer(calls[0]); fire('#esc-direction-open'); await answer(calls.at(-1)); node('#esc-direction-ack').props.checked = true; fire('#esc-mode-individual'); }
    return { nodes, node, dialog, timers, calls, status, answer, fire, open, dispose, FC };
}

test('probe once; poll only for an open dialog and stop on close or unsupported firmware', async () => {
    const h = harness();
    assert.equal(h.calls.length, 1);
    await h.answer(h.calls[0]);
    assert.equal(h.timers.size, 0);
    await h.open(); assert.equal(h.timers.size, 1);
    h.fire('#esc-direction-close'); assert.equal(h.timers.size, 0);
    h.dispose();
    const old = harness(); await old.answer(old.calls[0], {length: 0}, null);
    assert.equal(old.timers.size, 0); assert.equal(old.node('#esc-direction-open').props.disabled, true);
    old.dispose();
    assert.equal(harness({multirotor: false}).calls.length, 0);
});
test('a dropped direction write reports uncertainty and releases pending state', async () => {
    const h = harness(); await h.open(); h.fire('#esc-direction-reverse');
    await h.answer(h.calls.at(-1), false);
    assert.equal(h.node('#esc-direction-status').text, 'escDirectionUncertain');
    assert.equal(h.node('#esc-direction-test').props.disabled, true);
    h.fire('#esc-direction-close'); assert.equal(h.timers.size, 0); h.dispose();
});
test('a dropped start sends a compensating stop; failed stop is retried', async () => {
    const h = harness(); await h.open(); h.fire('#esc-direction-test', 'pointerdown');
    await h.answer(h.calls.at(-1), false);
    const firstStop = h.calls.at(-1); assert.deepEqual(Array.from(firstStop.payload), [255,0,0]);
    await h.answer(firstStop, false);
    assert.notEqual(h.calls.at(-1), firstStop);
    assert.deepEqual(Array.from(h.calls.at(-1).payload), [255,0,0]);
    await h.answer(h.calls.at(-1)); await h.answer(h.calls.at(-1));
    assert.equal(h.node('#esc-direction-test').props.disabled, false); h.dispose();
});
test('release before a queued start ACK sends a fresh stop after that ACK', async () => {
    const h = harness(); await h.open(); h.fire('#esc-direction-test', 'pointerdown');
    const start = h.calls.at(-1); h.fire('#esc-direction-test', 'pointerup');
    const stop = h.calls.at(-1); await h.answer(stop); await h.answer(start);
    assert.deepEqual(Array.from(h.calls.at(-1).payload), [255,0,0]);
    assert.notEqual(h.calls.at(-1), stop); await h.answer(h.calls.at(-1)); h.dispose();
});
test('cleanup retains the compensating stop after delayed start acknowledgement', async () => {
    const h = harness(); await h.open(); h.fire('#esc-direction-test', 'pointerdown');
    const start = h.calls.at(-1); h.dispose(); const stop = h.calls.at(-1);
    await h.answer(stop); await h.answer(start);
    assert.deepEqual(Array.from(h.calls.at(-1).payload), [255,0,0]);
    assert.equal(h.timers.size, 0); await h.answer(h.calls.at(-1));
});
test('quad diagram is independent of the asynchronous Outputs preview, including reverse', async () => {
    for (const inverted of [false, true]) {
        const h = harness({inverted}); h.node('#motor-mixer-preview-img').attrs.src = 'custom.svg';
        await h.open();
        assert.equal(h.node('#esc-wizard-image').attrs.src, inverted ? 'quad_x_reverse.svg' : 'quad_x.svg');
        h.dispose();
    }
});
