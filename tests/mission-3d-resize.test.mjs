import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

// Exercise the real viewer lifecycle without loading the Electron tab or WebGL.
const source = readFileSync(new URL('../tabs/mission_control.js', import.meta.url), 'utf8');
const factory = source.slice(source.indexOf('    function createMission3DViewer(container)'),
    source.indexOf('    function updateMission3D()'));

function setup() {
    const frames = new Map();
    const calls = {resize: 0, render: 0, destroy: 0, disconnect: 0};
    const container = {clientWidth: 800, clientHeight: 600};
    let nextFrame = 0;
    let notify;
    let observed;
    const viewer = {
        scene: {globe: {}, screenSpaceCameraController: {}, requestRender: () => calls.render++},
        resize: () => calls.resize++,
        destroy: () => calls.destroy++,
        isDestroyed: () => calls.destroy > 0
    };
    const provider = {fromUrl: () => new Promise(() => {})};
    const context = vm.createContext({
        Viewer: function () { return viewer; },
        EllipsoidTerrainProvider: class {},
        ScreenSpaceEventHandler: class { setInputAction() {} destroy() {} },
        CameraEventType: {}, KeyboardEventModifier: {}, ScreenSpaceEventType: {},
        buildModuleUrl: {setBaseUrl() {}},
        ArcGisMapServerImageryProvider: provider,
        ArcGISTiledElevationTerrainProvider: provider,
        ResizeObserver: class {
            constructor(callback) { notify = callback; }
            observe(target) { observed = target; }
            disconnect() { calls.disconnect++; }
        },
        requestAnimationFrame(callback) { frames.set(nextFrame, callback); return nextFrame++; },
        cancelAnimationFrame(id) { frames.delete(id); },
        container
    });
    const api = vm.runInContext(`${factory}\ncreateMission3DViewer(container)`, context);
    function flush() {
        const pending = [...frames.values()];
        frames.clear();
        pending.forEach(callback => callback());
    }
    return {api, viewer, calls, frames, container, observed, notify, flush};
}

test('3D container resizes are coalesced and follow later layout changes', () => {
    const s = setup();
    assert.equal(s.observed, s.container);
    s.api.setVisible(true);
    s.notify();
    s.notify();
    assert.equal(s.frames.size, 1);
    s.flush();
    assert.equal(s.calls.resize, 1);
    assert.equal(s.calls.render, 1);
    s.container.clientHeight = 720;
    s.notify();
    s.flush();
    assert.equal(s.calls.resize, 2);
    assert.equal(s.calls.render, 2);
});

test('2D cancels pending work and stays idle; reopening 3D schedules a resize', () => {
    const s = setup();
    s.api.setVisible(true);
    s.api.setVisible(false);
    assert.equal(s.viewer.useDefaultRenderLoop, false);
    assert.equal(s.frames.size, 0);
    s.notify();
    s.flush();
    assert.equal(s.calls.resize, 0);
    assert.equal(s.calls.render, 0);
    s.api.setVisible(true);
    assert.equal(s.viewer.useDefaultRenderLoop, true);
    s.flush();
    assert.equal(s.calls.resize, 1);
});

test('zero-sized containers wait for a usable layout', () => {
    const s = setup();
    s.api.setVisible(true);
    s.container.clientHeight = 0;
    s.flush();
    assert.equal(s.calls.resize, 0);
    assert.equal(s.calls.render, 0);
    s.container.clientHeight = 600;
    s.notify();
    s.flush();
    assert.equal(s.calls.resize, 1);
});

test('destroy disconnects and cancels work; late callbacks cannot access the viewer', () => {
    const s = setup();
    s.api.setVisible(true);
    const lateFrame = [...s.frames.values()][0];
    s.api.destroy();
    assert.equal(s.frames.size, 0);
    s.notify();
    lateFrame();
    s.api.setVisible(true);
    s.api.destroy();
    assert.equal(s.frames.size, 0);
    assert.deepEqual(s.calls, {resize: 0, render: 0, destroy: 1, disconnect: 1});
});
