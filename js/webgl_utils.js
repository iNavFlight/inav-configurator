'use strict';

const FALLBACK_HTML = '<div class="webgl-fallback" style="display: flex; align-items: center; justify-content: center; height: 100%; color: #888; text-align: center; padding: 20px;">' +
    '<div>' +
    '<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">3D view unavailable</p>' +
    '<p style="margin: 0 0 10px 0; font-size: 12px;">WebGL could not be initialized. This may be due to:</p>' +
    '<ul style="text-align: left; margin: 10px 0; padding-left: 20px; font-size: 12px;">' +
    '<li>Graphics drivers need updating</li>' +
    '<li>Hardware acceleration issues</li>' +
    '<li>Browser or system limitations</li>' +
    '</ul>' +
    '<p style="margin: 10px 0 0 0; font-size: 12px; font-style: italic;">Try: Options → Disable 3D Hardware Acceleration, then restart</p>' +
    '</div>' +
    '</div>';

// Robust WebGL capability detection with fallback
function tryCreateWebGLContext(logPrefix) {
    if (!window.WebGLRenderingContext) {
        return null;
    }

    const detector_canvas = document.createElement('canvas');
    let gl = null;
    let renderMethod = null;

    // Try 1: Hardware-accelerated WebGL (best performance)
    try {
        gl = detector_canvas.getContext('webgl') || detector_canvas.getContext('experimental-webgl');
        if (gl) {
            renderMethod = 'hardware';
            console.log(logPrefix + ' Using hardware-accelerated WebGL');
        }
    } catch (e) {
        console.warn(logPrefix + ' Hardware WebGL failed:', e);
    }

    // Try 2: Software-rendered WebGL (slower but more compatible)
    if (!gl) {
        try {
            gl = detector_canvas.getContext('webgl', { failIfMajorPerformanceCaveat: false }) ||
                 detector_canvas.getContext('experimental-webgl', { failIfMajorPerformanceCaveat: false });
            if (gl) {
                renderMethod = 'software';
                console.log(logPrefix + ' Using software-rendered WebGL (slower performance)');
            }
        } catch (e) {
            console.warn(logPrefix + ' Software WebGL failed:', e);
        }
    }

    return gl ? { context: gl, method: renderMethod } : null;
}

/**
 * Create a THREE.WebGLRenderer for `canvas`, falling back to an in-wrapper
 * "3D view unavailable" message when WebGL can't be initialized at all.
 *
 * @param {THREE} THREE - the THREE module (tabs import their own build of it)
 * @param {jQuery} canvas - the <canvas> element to render into
 * @param {jQuery} wrapper - the wrapper element to receive the fallback message
 * @param {string} logPrefix - tag prepended to console messages, e.g. '[3D]'
 * @param {function(string): void} [onSoftwareFallback] - called with a
 *   user-facing warning message when only software rendering is available
 * @returns {{renderer: THREE.WebGLRenderer|null, useWebGlRenderer: boolean}}
 */
export function initializeWebGLRenderer(THREE, canvas, wrapper, logPrefix, onSoftwareFallback) {
    const webglResult = tryCreateWebGLContext(logPrefix);
    let renderer = null;
    let useWebGlRenderer = false;

    if (webglResult) {
        try {
            renderer = new THREE.WebGLRenderer({ canvas: canvas.get(0), alpha: true, antialias: true });
            useWebGlRenderer = true;

            if (webglResult.method === 'software' && onSoftwareFallback) {
                onSoftwareFallback('<span style="color: orange;">3D view using software rendering (slower). Consider updating graphics drivers or disabling hardware acceleration in Options.</span>');
            }
        } catch (e) {
            console.error(logPrefix + ' Failed to create THREE.WebGLRenderer:', e);
            renderer = null;
            useWebGlRenderer = false;
        }
    }

    if (!renderer) {
        wrapper.html(FALLBACK_HTML);
    }

    return { renderer, useWebGlRenderer };
}
