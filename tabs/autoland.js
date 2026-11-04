'use strict';

import MSPChainerClass from './../js/msp/MSPchainer';
import mspHelper from './../js/msp/MSPHelper';
import GUI from './../js/gui';
import FC from './../js/fc';
import Settings from './../js/settings';
import i18n from './../js/localization';
import store from './../js/store';
import { LoiterDirection, Phase, planAutoland } from './../js/autoland_geometry';
import { globalSettings } from './../js/globalSettings';

const DEFAULT_SPEED_MS = 15;
// Sequential blue, from the lightest step that still reads on the light surface to the darkest
const ALTITUDE_RAMP = ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#104281', '#0d366b'];
const PLAN_MAX_HEIGHT_PX = 560;
const PROFILE_HEIGHT_PX = 220;
const PROFILE_MIN_HEIGHT_PX = 150;
const PLAN_MIN_FITTED_PX = 150;
const LABEL_MARGIN_EM = 8.5;   // room on each side of the circuit for the leg labels, in label heights
const OPTIONAL = 'optional';    // a check that is not met but not needed either
const NARROW_LAYOUT_PX = 980;  // narrower, the layout takes one column: the stylesheet's container query
const SVG_NS = 'http://www.w3.org/2000/svg';
const RUNWAY_DEFAULT_M = { length: 100, width: 15 };
const RUNWAY_STORE_KEY = 'autoland_runways';
const SATELLITE_STORE_KEY = 'autoland_satellite';
// Esri's imagery, as the Configurator's esri map provider; none with the map proxy, which is there to work offline
const SATELLITE_TILES = 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile';
const EARTH_RADIUS_M = 6378137;
const SATELLITE_MAX_ZOOM = 19;
const HOVER_RADIUS_PX = 24;

const autolandTab = {};

let siteIndex = 0;
let directionIndex = 0;
let lastPlan = null;
let navSettings = {};

function settingValue(name) {
    const input = $(`[data-setting="${name}"]`);
    if (input.length === 0) {
        return null;    // not in this firmware
    }
    const pair = Settings.processInput(input);
    return pair && Number.isFinite(pair.value) ? pair.value : null;
}

function cm(name, fallback = 0) {
    const value = settingValue(name);
    return value === null ? fallback : value / 100;
}

function approach() {
    return FC.FW_APPROACH.get()[siteIndex];
}

function rampColor(t) {
    const x = Math.min(Math.max(t, 0), 1) * (ALTITUDE_RAMP.length - 1);
    const i = Math.min(Math.floor(x), ALTITUDE_RAMP.length - 2);
    const k = x - i;
    const a = ALTITUDE_RAMP[i].match(/\w\w/g).map((h) => Number.parseInt(h, 16));
    const b = ALTITUDE_RAMP[i + 1].match(/\w\w/g).map((h) => Number.parseInt(h, 16));
    return '#' + a.map((v, j) => Math.round(v + (b[j] - v) * k).toString(16).padStart(2, '0')).join('');
}

function fmt(value, decimals = 0) {
    return Number(value).toFixed(decimals);
}

function phaseName(phase) {
    return i18n.getMessage('autolandPhase_' + phase);
}

/* The short name a narrow profile puts over a leg; the long name where it has none */
const PHASE_SHORT = { turnFinal: 'autolandPhaseShort_turnFinal' };

function phaseShortName(phase) {
    return PHASE_SHORT[phase] ? i18n.getMessage(PHASE_SHORT[phase]) : phaseName(phase);
}

/* Inputs -> the geometry's parameters, in metres, degrees and m/s */
function readParams() {
    const a = approach();
    const heading = (value, exclusive) => {
        if (!value) {
            return 0;
        }
        return exclusive ? -value : value;
    };
    return {
        approach: {
            side: Number.parseInt($('#autolandSide').val(), 10),
            heading1: heading(Number.parseInt($('#autolandHeading1').val(), 10) || 0, $('#autolandHeading1Exclusive').prop('checked')),
            heading2: heading(Number.parseInt($('#autolandHeading2').val(), 10) || 0, $('#autolandHeading2Exclusive').prop('checked')),
            runwayStarts: a ? [0, 1, 2, 3].map((i) => a.getRunwayStart(i)) : [0, 0, 0, 0],
            runwayHeights: a ? [0, 1, 2, 3].map((i) => a.getRunwayStartHeight(i) / 10) : [0, 0, 0, 0]
        },
        runwayLength: Number.parseFloat($('#autolandRunwayLength').val()) || 0,
        approachAlt: a ? (a.getApproachAltAsl() - a.getLandAltAsl()) / 100 : 0,
        finalAlt: cm('nav_fw_land_final_alt'),
        approachLength: cm('nav_fw_land_approach_length', 350),
        downwindOffset: cm('nav_fw_land_downwind_offset'),
        landLoiterRadius: cm('nav_fw_land_loiter_radius'),
        loiterRadius: navSettings.loiterRadius,
        aimOffset: cm('nav_fw_land_aim_offset'),
        glideAlt: cm('nav_fw_land_glide_alt', 2),
        flareAlt: cm('nav_fw_land_flare_alt', 2),
        flareSink: cm('nav_fw_land_flare_sink'),
        flareTime: (settingValue('nav_fw_land_flare_time') || 0) / 10,
        speed: cm('nav_fw_land_approach_speed') || Number.parseFloat($('#autolandSpeed').val()) || DEFAULT_SPEED_MS,
        bankDeg: navSettings.bankDeg,
        rollRateDps: navSettings.rollRateDps,
        controlSmoothness: navSettings.controlSmoothness,
        wpTurnControlEaseMs: navSettings.wpTurnControlEaseMs,
        loiterDirection: navSettings.loiterDirection
    };
}

/* The selected site's approach into the inputs */
function fillApproach() {
    const a = approach();
    if (!a) {
        return;
    }
    $('#autolandApproachAlt').val(fmt(a.getApproachAltAsl() / 100, 2));
    $('#autolandLandAlt').val(fmt(a.getLandAltAsl() / 100, 2));
    $('#autolandSeaLevel').prop('checked', a.getIsSeaLevelRef() > 0);
    $('#autolandSide').val(a.getApproachDirection());
    $('#autolandHeading1').val(Math.abs(a.getLandHeading1()));
    $('#autolandHeading1Exclusive').prop('checked', a.getLandHeading1() < 0);
    $('#autolandHeading2').val(Math.abs(a.getLandHeading2()));
    $('#autolandHeading2Exclusive').prop('checked', a.getLandHeading2() < 0);
}

/* The runway drawn around the selected site, kept per safehome in the Configurator only */
function fillRunway() {
    const runway = store.get(RUNWAY_STORE_KEY, {})[siteIndex] || RUNWAY_DEFAULT_M;
    $('#autolandRunwayLength').val(runway.length);
    $('#autolandRunwayWidth').val(runway.width);
}

/* The inputs back into the selected site's approach, saved with the rest */
function storeApproach() {
    const a = approach();
    if (!a) {
        return;
    }
    const signed = (id) => {
        const value = Number.parseInt($(`#${id}`).val(), 10) || 0;
        return $(`#${id}Exclusive`).prop('checked') ? -value : value;
    };
    a.setApproachAltAsl(Math.round(Number.parseFloat($('#autolandApproachAlt').val() || 0) * 100));
    a.setLandAltAsl(Math.round(Number.parseFloat($('#autolandLandAlt').val() || 0) * 100));
    a.setIsSeaLevelRef($('#autolandSeaLevel').prop('checked') ? 1 : 0);
    a.setApproachDirection(Number.parseInt($('#autolandSide').val(), 10));
    a.setLandHeading1(signed('autolandHeading1'));
    a.setLandHeading2(signed('autolandHeading2'));
}

/* Runway-aligned frame: along approach heading 1 to the right, its right side down, as seen from above */
function frame(params) {
    const axis = Math.abs(params.approach.heading1 || params.approach.heading2 || 0) * Math.PI / 180;
    return (p) => ({
        x: p.n * Math.cos(axis) + p.e * Math.sin(axis),
        y: -p.n * Math.sin(axis) + p.e * Math.cos(axis)
    });
}

function niceStep(span) {
    const raw = span / 6;
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / magnitude;
    let factor = 10;
    if (n < 2) {
        factor = 2;
    } else if (n < 5) {
        factor = 5;
    }
    return factor * magnitude;
}

function text(x, y, content, attrs = '') {
    return `<text x="${fmt(x, 1)}" y="${fmt(y, 1)}" ${attrs}>${content}</text>`;
}

/*
 * The labels' fonts as the stylesheet sets them, measured on a canvas, so a label's box fits its text at any font size
 * or display scale
 */
function labelMetrics(svgElement) {
    const probe = (cls) => {
        const t = document.createElementNS(SVG_NS, 'text');
        t.setAttribute('class', cls);
        svgElement.appendChild(t);
        const cs = getComputedStyle(t);
        const font = { font: `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, size: Number.parseFloat(cs.fontSize) || 12 };
        t.remove();
        return font;
    };
    const name = probe('autolandLabel');
    const value = probe('autolandLabel autolandLabelValue');
    const axis = probe('autolandAxisText');
    const ctx = document.createElement('canvas').getContext('2d');
    const measure = (str, f) => {
        ctx.font = f.font;
        return ctx.measureText(str).width;
    };
    return {
        size: name.size,
        line: Math.round(name.size * 1.3),
        axisSize: axis.size,
        // the first line is the name, the others its values
        width: (lines) => Math.max(...lines.map((l, i) => measure(l, i === 0 ? name : value))),
        axisWidth: (str) => measure(str, axis)
    };
}

/* A label's box around its text: y is the first line's baseline */
function textBox(m, x, y, w, size, lines) {
    let x0 = x.at - w / 2;
    if (x.anchor === 'start') {
        x0 = x.at;
    } else if (x.anchor === 'end') {
        x0 = x.at - w;
    }
    const padX = Math.round(size * 0.4);
    const padY = Math.round(size * 0.2);
    return { x0: x0 - padX, x1: x0 + w + padX, y0: y - size * 0.95 - padY, y1: y + (lines - 1) * m.line + size * 0.3 + padY };
}

function backing(b, cls) {
    return `<rect x="${fmt(b.x0, 1)}" y="${fmt(b.y0, 1)}" width="${fmt(b.x1 - b.x0, 1)}" height="${fmt(b.y1 - b.y0, 1)}" rx="3" class="${cls}"/>`;
}

function labelBox(m, x, y, lines, anchor, labelClass, b) {
    const out = lines.map((line, i) => text(x, y + i * m.line, line,
        `text-anchor="${anchor}" class="${labelClass}${i === 0 ? '' : ' autolandLabelValue'}"`)).join('');
    return `<g class="autolandLabelGroup">${backing(b, 'autolandLabelBack')}${out}</g>`;
}

/* An axis note on its own backing, so it reads over the satellite image as well */
function axisNote(m, x, y, str, anchor) {
    const b = textBox(m, { at: x, anchor }, y, m.axisWidth(str), m.axisSize, 1);
    const attrs = 'text-anchor="' + anchor + '" class="autolandAxisText"';
    return { b, svg: `<g class="autolandAxisGroup">${backing(b, 'autolandAxisBack')}${text(x, y, str, attrs)}</g>` };
}

/*
 * Labels that cover neither the track, the marks nor each other: each label tries its spots in order and takes the
 * first free one, or the least covered when none is (a tight final or tangled turns)
 */
function labelPlacer(width, height, obstacles, m) {
    const boxes = [];
    const spotScale = m.size / 12; // the spots were laid out for 12 px labels
    const boxOf = (x, y, lines, anchor) => textBox(m, { at: x, anchor }, y, m.width(lines), m.size, lines.length);
    const cost = (b) => {
        if (b.x0 < 0 || b.x1 > width || b.y0 < 0 || b.y1 > height) {
            return 1e6;
        }
        let c = 0;
        for (const o of boxes) {
            if (b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0) {
                c += 1000;
            }
        }
        for (const p of obstacles) {
            if (p.x > b.x0 && p.x < b.x1 && p.y > b.y0 && p.y < b.y1) {
                c += 1;
            }
        }
        return c;
    };
    // spots around a point, nearest first, starting from the preferred direction
    const around = (p, ux, uy, lines) => {
        const spots = [];
        for (const d of [16, 28, 44, 64].map((v) => v * spotScale)) {
            for (const turn of [0, 45, -45, 90, -90, 135, -135, 180]) {
                const a = turn * Math.PI / 180;
                const dx = ux * Math.cos(a) - uy * Math.sin(a);
                const dy = ux * Math.sin(a) + uy * Math.cos(a);
                let anchor = 'middle';
                if (dx > 0.35) {
                    anchor = 'start';
                } else if (dx < -0.35) {
                    anchor = 'end';
                }
                const block = (lines.length - 1) * m.line;
                let shift = m.size * 0.35 - block / 2;
                if (dy < -0.35) {
                    shift = -block;
                } else if (dy > 0.35) {
                    shift = m.size;
                }
                const y = p.y + dy * d + shift;
                spots.push({ x: p.x + dx * d, y, anchor });
            }
        }
        return spots;
    };
    return {
        mark(p, r) {
            boxes.push({ x0: p.x - r, x1: p.x + r, y0: p.y - r, y1: p.y + r });
        },
        // a box already drawn: an axis note
        markBox(b) {
            boxes.push(b);
        },
        // optional: left out rather than over another label (the profile or the drawing itself says it too)
        place(lines, anchors, ux, uy, labelClass, optional = false) {
            let best = null;
            for (const p of anchors) {
                for (const s of around(p, ux, uy, lines)) {
                    const b = boxOf(s.x, s.y, lines, s.anchor);
                    const k = cost(b);
                    if (!best || k < best.k) {
                        best = { ...s, b, k };
                    }
                    if (k === 0) {
                        break;
                    }
                }
                if (best.k === 0) {
                    break;
                }
            }
            if (optional && best.k >= 1000) {
                return '';
            }
            boxes.push(best.b);
            return labelBox(m, best.x, best.y, lines, best.anchor, labelClass || 'autolandLabel', best.b);
        }
    };
}

/* The marks along the final: the throttle cut and flare, or with the sink-rate flare where the power starts to come off
   and the touchdown, unlabelled */
function flareEvents(dir) {
    return dir.sinkFlare
        ? [[dir.glide, 'autolandFlareFrom', -0.6], [dir.touchdown, null, 0.6]]
        : [[dir.glide, 'autolandThrottleCut', -0.6], [dir.flare, 'autolandFlarePoint', 0.6]];
}

/* The track cut into its legs; the glide and flare belong to the final */
function legsOf(track) {
    const legs = [];
    for (const pt of track) {
        const name = pt.phase === Phase.GLIDE || pt.phase === Phase.FLARE ? Phase.FINAL : pt.phase;
        if (!legs.length || legs.at(-1).phase !== name) {
            legs.push({ phase: name, points: [] });
        }
        legs.at(-1).points.push(pt);
    }
    return legs;
}

/*
 * Satellite tiles under the drawing, turned with the runway: a zoom whose tiles match the drawing's scale, only the
 * tiles around the view, placed in metres from the site (Web Mercator is conformal, flat enough over a field)
 */
function satelliteLayer(params, site, scale, width, height) {
    const safehome = FC.SAFEHOMES.get()[siteIndex];
    if (!$('#autolandSatellite').prop('checked') || !safehome?.getEnabled() || globalSettings.mapProviderType === 'mapproxy') {
        return '';
    }
    const lat = safehome.getLatMap() * Math.PI / 180;
    const lon = safehome.getLonMap();
    // a display at 150 % shows a tile pixel on 1.5 screen pixels: one zoom more keeps the image sharp
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const zoom = Math.min(SATELLITE_MAX_ZOOM, Math.max(1,
        Math.round(Math.log2(2 * Math.PI * EARTH_RADIUS_M * Math.cos(lat) * scale * dpr / 256))));
    const tiles = Math.pow(2, zoom);
    const tileM = 2 * Math.PI * EARTH_RADIUS_M * Math.cos(lat) / tiles;
    const xs = (lon + 180) / 360 * tiles;
    const ys = (1 - Math.log(Math.tan(lat) + 1 / Math.cos(lat)) / Math.PI) / 2 * tiles;

    // view centre in metres east and south of the site, and a radius that covers the whole view
    const axis = Math.abs(params.approach.heading1 || params.approach.heading2 || 0);
    const turn = (90 - axis) * Math.PI / 180;
    const fx = (width / 2 - site.x) / scale;
    const fy = (height / 2 - site.y) / scale;
    const ec = fx * Math.cos(turn) + fy * Math.sin(turn);
    const sc = -fx * Math.sin(turn) + fy * Math.cos(turn);
    const reach = Math.hypot(width, height) / 2 / scale;

    let images = '';
    for (let tx = Math.floor(xs + (ec - reach) / tileM); tx <= Math.floor(xs + (ec + reach) / tileM); tx++) {
        for (let ty = Math.floor(ys + (sc - reach) / tileM); ty <= Math.floor(ys + (sc + reach) / tileM); ty++) {
            images += `<image href="${SATELLITE_TILES}/${zoom}/${ty}/${tx}" x="${fmt((tx - xs) * tileM, 2)}" y="${fmt((ty - ys) * tileM, 2)}" ` +
                `width="${fmt(tileM + 0.05, 2)}" height="${fmt(tileM + 0.05, 2)}" preserveAspectRatio="none"/>`;
        }
    }
    return `<g transform="translate(${fmt(site.x, 1)} ${fmt(site.y, 1)}) rotate(${fmt(90 - axis, 2)}) scale(${scale})" class="autolandSatelliteTiles">${images}</g>` +
        `<rect x="0" y="0" width="${fmt(width)}" height="${fmt(height)}" class="autolandSatelliteVeil"/>`;
}

/* The drawing's frame: everything drawn fits, with room on the sides for the leg labels pushed out of the circuit */
function planFrame(params, dir, runway, box, m) {
    const toFrame = frame(params);
    const points = [{ x: -runway.length / 2, y: -runway.width / 2 }, { x: runway.length / 2, y: runway.width / 2 }];
    const add = (p) => points.push(toFrame(p));
    add({ n: 0, e: 0 });
    if (dir) {
        dir.track.forEach(add);
        const c = toFrame(dir.circle.center);
        points.push({ x: c.x - dir.circle.radius, y: c.y - dir.circle.radius }, { x: c.x + dir.circle.radius, y: c.y + dir.circle.radius });
        // the land waypoint lies past the site on the final's line and is not drawn: it would only shrink the drawing
        Object.entries(dir.waypoints).filter(([name, wp]) => wp && name !== 'land').forEach(([, wp]) => add(wp));
    }
    const minX = Math.min(...points.map((p) => p.x));
    const maxX = Math.max(...points.map((p) => p.x));
    const minY = Math.min(...points.map((p) => p.y));
    const maxY = Math.max(...points.map((p) => p.y));
    const pad = Math.max(maxX - minX, maxY - minY) * 0.08 + 15;
    const margin = Math.min(LABEL_MARGIN_EM * m.size, box.width / 6);
    const scale = Math.min((box.width - 2 * margin) / (maxX - minX + 2 * pad), box.maxHeight / (maxY - minY + 2 * pad));
    const height = box.fitted ? box.maxHeight : (maxY - minY + 2 * pad) * scale;
    const ox = (box.width - (maxX - minX) * scale) / 2 - minX * scale;
    const oy = (height - (maxY - minY) * scale) / 2 - minY * scale;
    const pxFrame = (f) => ({ x: ox + f.x * scale, y: oy + f.y * scale });
    return { scale, width: box.width, height, ox, oy, pxFrame, px: (p) => pxFrame(toFrame(p)) };
}

/* Grid in metres around the landing site */
function planGrid(f) {
    const step = niceStep(f.width / f.scale);
    let out = '';
    for (let gx = Math.floor(-f.ox / f.scale / step) * step; gx <= (f.width - f.ox) / f.scale; gx += step) {
        const x = fmt(f.ox + gx * f.scale, 1);
        out += `<line x1="${x}" y1="0" x2="${x}" y2="${fmt(f.height, 1)}" class="autolandGrid"/>`;
    }
    for (let gy = Math.floor(-f.oy / f.scale / step) * step; gy <= (f.height - f.oy) / f.scale; gy += step) {
        const y = fmt(f.oy + gy * f.scale, 1);
        out += `<line x1="0" y1="${y}" x2="${fmt(f.width, 1)}" y2="${y}" class="autolandGrid"/>`;
    }
    return { out, step };
}

/* The runway axis through the site, along approach heading 1, the runway as entered for the drawing, the site */
function planRunway(f, site, runway) {
    let out = `<line x1="0" y1="${fmt(site.y, 1)}" x2="${fmt(f.width, 1)}" y2="${fmt(site.y, 1)}" class="autolandAxis"/>`;
    if (runway.length > 0 && runway.width > 0) {
        const a = f.pxFrame({ x: -runway.length / 2, y: -runway.width / 2 });
        const b = f.pxFrame({ x: runway.length / 2, y: runway.width / 2 });
        out += `<rect x="${fmt(a.x, 1)}" y="${fmt(a.y, 1)}" width="${fmt(b.x - a.x, 1)}" height="${fmt(Math.max(b.y - a.y, 2), 1)}" class="autolandRunwayStrip"/>`;
        out += `<line x1="${fmt(a.x + 4, 1)}" y1="${fmt(site.y, 1)}" x2="${fmt(b.x - 4, 1)}" y2="${fmt(site.y, 1)}" class="autolandRunwayCentre"/>`;
    }
    return out + `<rect x="${fmt(site.x - 5, 1)}" y="${fmt(site.y - 5, 1)}" width="10" height="10" class="autolandSite"/>`;
}

/* The track coloured by the altitude asked for, on a light casing that keeps it apart from the satellite image */
function planTrack(params, dir, screen) {
    const maxAlt = Math.max(params.approachAlt, 1);
    const points = screen.map((p) => fmt(p.x, 1) + ',' + fmt(p.y, 1)).join(' ');
    let out = `<polyline points="${points}" class="autolandTrackCasing"/>`;
    for (let i = 1; i < screen.length; i++) {
        const color = rampColor((dir.track[i - 1].alt + dir.track[i].alt) / 2 / maxAlt);
        out += `<line x1="${fmt(screen[i - 1].x, 1)}" y1="${fmt(screen[i - 1].y, 1)}" x2="${fmt(screen[i].x, 1)}" y2="${fmt(screen[i].y, 1)}" stroke="${color}" class="autolandTrack"/>`;
    }
    return out;
}

/* The marks the labels keep clear of: where each leg starts, the aim point, the throttle cut and flare */
function planMarks(dir, f, placer, site) {
    let out = '';
    const legs = legsOf(dir.track);
    for (const leg of legs) {
        const start = f.px(leg.points[0]);
        out += `<circle cx="${fmt(start.x, 1)}" cy="${fmt(start.y, 1)}" r="5" class="autolandLegStart"/>`;
        placer.mark(start, 7);
    }
    const aim = f.px(dir.waypoints.aim);
    const cross = `M${fmt(aim.x - 6, 1)} ${fmt(aim.y - 6, 1)} l12 12 m0 -12 l-12 12`;
    out += `<path d="${cross}" class="autolandAimCasing"/><path d="${cross}" class="autolandAim"/>`;
    placer.mark(aim, 7);
    placer.mark(site, 7);
    // the touchdown of the sink-rate flare is the aim point's cross
    const events = flareEvents(dir).filter(([point, key]) => point && key);
    for (const [point] of events) {
        const p = f.px(point);
        out += `<circle cx="${fmt(p.x, 1)}" cy="${fmt(p.y, 1)}" r="5" class="autolandEvent"/>`;
        placer.mark(p, 7);
    }
    return { out, legs, aim, events };
}

/* A leg's label: its name and altitudes, or only its name where the drawing has no room for both */
function legLabel(placer, f, leg, outward) {
    const first = leg.points[0];
    const endAlt = leg.phase === Phase.FINAL ? 0 : leg.points.at(-1).alt;
    const lines = [phaseName(leg.phase), i18n.getMessage('autolandAltitudeRange', { from: fmt(first.alt, 1), to: fmt(endAlt, 1) })];
    const spots = leg.phase === Phase.FINAL ? [0.25, 0.1, 0.4] : [0.5, 0.35, 0.65, 0.2, 0.8];
    const along = spots.map((k) => f.px(leg.points[Math.floor((leg.points.length - 1) * k)]));
    const [ux, uy] = outward(along[0]);
    return placer.place(lines, along, ux, uy, undefined, true) || placer.place(lines.slice(0, 1), along, ux, uy);
}

/* The labels, out from the circuit's centre: the site and aim point, the legs from the runway outwards, then what the
   drawing can do without (the flare's marks, which the profile names too, and the wind circle) */
function planLabels(dir, f, site, marks, screen, placer) {
    const cx = screen.reduce((sum, p) => sum + p.x, 0) / screen.length;
    const cy = screen.reduce((sum, p) => sum + p.y, 0) / screen.length;
    const outward = (p) => {
        const len = Math.hypot(p.x - cx, p.y - cy) || 1;
        return [(p.x - cx) / len, (p.y - cy) / len];
    };
    const [sx, sy] = outward(site);
    let out = placer.place([i18n.getMessage('autolandLandingSite')], [site], sx, sy);
    if (!dir.sinkFlare) {
        out += placer.place([i18n.getMessage('autolandAimPoint')], [marks.aim], -sx, -sy);
    }
    for (const leg of marks.legs.slice().reverse()) {
        out += legLabel(placer, f, leg, outward);
    }
    marks.events.forEach(([point, key], i) => {
        out += placer.place([i18n.getMessage(key, { alt: fmt(point.alt, 1) })], [f.px(point)], i === 0 ? -0.5 : 0.5, -0.9, undefined, true);
    });
    const circleLines = [i18n.getMessage('autolandWindCircle'), i18n.getMessage('autolandRadiusValue', { radius: fmt(dir.circle.radius) })];
    return out + placer.place(circleLines, [f.px(dir.circle.center)], 0, -1, undefined, true);
}

/* The circle, the track, its marks and the labels around them */
function planCircuit(params, dir, f, site, notes, m) {
    const c = f.px(dir.circle.center);
    let out = `<circle cx="${fmt(c.x, 1)}" cy="${fmt(c.y, 1)}" r="${fmt(dir.circle.radius * f.scale, 1)}" class="autolandCircle"/>`;
    const screen = dir.track.map(f.px);
    out += planTrack(params, dir, screen);
    const placer = labelPlacer(f.width, f.height, screen, m);
    notes.forEach((note) => placer.markBox(note.b));
    const marks = planMarks(dir, f, placer, site);
    return out + marks.out + planLabels(dir, f, site, marks, screen, placer);
}

function drawPlan(params, plan) {
    const svg = $('.autolandPlan');
    const wrap = $('.autolandPlanWrap');
    const fitted = $('.autolandLayout').hasClass('fitted');
    // measured without the old drawing, which would hold the box at its own size
    svg.attr('height', 0);
    const m = labelMetrics(svg[0]);
    const box = { width: Math.max(wrap.width() || 600, 320), maxHeight: fitted ? wrap.height() : PLAN_MAX_HEIGHT_PX, fitted };
    const dir = plan.directions[directionIndex];
    const runway = {
        length: Number.parseFloat($('#autolandRunwayLength').val()) || 0,
        width: Number.parseFloat($('#autolandRunwayWidth').val()) || 0
    };
    const f = planFrame(params, dir, runway, box, m);
    const { width, height } = f;
    const site = f.px({ n: 0, e: 0 });
    const grid = planGrid(f);
    const heading = fmt(Math.abs(params.approach.heading1 || params.approach.heading2 || 0));
    const notes = [
        axisNote(m, width - 10, height - 10, i18n.getMessage('autolandGridStep', { step: fmt(grid.step) }), 'end'),
        axisNote(m, width - 10, site.y + m.axisSize * 1.6, i18n.getMessage('autolandRunwayAxis', { heading }), 'end')
    ];
    let out = satelliteLayer(params, site, f.scale, width, height) + grid.out + planRunway(f, site, runway);
    if (dir) {
        out += planCircuit(params, dir, f, site, notes, m);
    } else {
        out += text(width / 2, height / 2 - 30, i18n.getMessage('autolandNoApproach'), 'text-anchor="middle" class="autolandLabel"');
        out += text(site.x + 9, site.y + 18, i18n.getMessage('autolandLandingSite'), 'class="autolandLabel"');
    }
    // the axis notes over the drawing, the leg labels kept clear of them
    out += notes.map((note) => note.svg).join('');
    out += '<circle class="autolandHover" r="7" style="display: none"/>';

    svg.attr({ width, height: fmt(height), viewBox: `0 0 ${fmt(width)} ${fmt(height)}` }).html(out)
        .toggleClass('withSatellite', out.includes('autolandSatelliteVeil'));
    svg.attr('aria-label', i18n.getMessage('autolandTopView'));
    $('.autolandRampMax').text(i18n.getMessage('autolandAltitudeMax', { alt: fmt(params.approachAlt) }));
    return { px: f.px, dir };
}

function drawProfile(params, dir) {
    const svg = $('.autolandProfileView');
    const width = Math.max(svg.parent().width() || 600, 320);
    const layout = $('.autolandLayout');
    const height = layout.hasClass('fitted')
        ? Math.round(Math.min(Math.max(layout.height() * 0.26, PROFILE_MIN_HEIGHT_PX), PROFILE_HEIGHT_PX))
        : PROFILE_HEIGHT_PX;
    const bottom = 40;
    if (!dir) {
        svg.attr({ width, height }).html('');
        return null;
    }
    const m = labelMetrics(svg[0]);
    const unit = i18n.getMessage('autolandUnitM');
    const total = dir.track[dir.track.length - 1].flown;
    const maxAlt = Math.max(params.approachAlt, dir.finalAlt, 1) * 1.05;
    const yStep = niceStep(maxAlt);
    // room on the left for the altitude labels at their real width
    const left = Math.max(44, Math.ceil(m.axisWidth(fmt(Math.floor(maxAlt / yStep) * yStep)) + 14));
    const sx = (d) => left + d / total * (width - left - 12);
    const legs = legsOf(dir.track);
    // the legs' names over their bands, measured: one that would touch its neighbour takes its short name, and is
    // left out when that does not fit either (the top view and the tooltip name the leg too)
    const gap = m.axisSize * 0.8;
    const placed = [{ x0: 0, x1: 4 + m.axisWidth(unit) + gap }]; // the unit's label is on the same line
    const names = legs.map((leg) => {
        const mid = (sx(leg.points[0].flown) + sx(leg.points.at(-1).flown)) / 2;
        for (const name of [phaseName(leg.phase), phaseShortName(leg.phase)]) {
            const w = m.axisWidth(name);
            const cx = Math.min(Math.max(mid, left + w / 2), width - 12 - w / 2);
            const box = { x0: cx - w / 2 - gap / 2, x1: cx + w / 2 + gap / 2 };
            if (placed.every((b) => box.x1 <= b.x0 || box.x0 >= b.x1)) {
                placed.push(box);
                return { name, cx };
            }
        }
        return null;
    }).filter(Boolean);
    const top = 26;
    const sy = (h) => height - bottom - h / maxAlt * (height - bottom - top);
    let out = '';
    const axisBoxes = [];
    const axisText = (x, y, str, anchor) => {
        axisBoxes.push(textBox(m, { at: x, anchor }, y, m.axisWidth(str), m.axisSize, 1));
        return text(x, y, str, `text-anchor="${anchor}" class="autolandAxisText"`);
    };
    legs.forEach((leg, i) => {
        const x0 = sx(leg.points[0].flown);
        const x1 = sx(leg.points.at(-1).flown);
        if (i % 2 === 1) {
            out += `<rect x="${fmt(x0, 1)}" y="${top}" width="${fmt(x1 - x0, 1)}" height="${fmt(sy(0) - top, 1)}" class="autolandBand"/>`;
        }
    });
    for (const n of names) {
        axisBoxes.push(textBox(m, { at: n.cx, anchor: 'middle' }, top - 8, m.axisWidth(n.name), m.axisSize, 1));
        out += text(n.cx, top - 8, n.name, 'text-anchor="middle" class="autolandAxisText autolandBandName"');
    }
    const xStep = niceStep(total);
    for (let d = 0; d <= total; d += xStep) {
        out += `<line x1="${fmt(sx(d), 1)}" y1="${fmt(sy(0), 1)}" x2="${fmt(sx(d), 1)}" y2="${top}" class="autolandGrid"/>`;
        out += axisText(sx(d), height - 24, fmt(d), 'middle');
    }
    for (let h = 0; h <= maxAlt; h += yStep) {
        out += `<line x1="${left}" y1="${fmt(sy(h), 1)}" x2="${fmt(width - 12, 1)}" y2="${fmt(sy(h), 1)}" class="autolandGrid"/>`;
        out += axisText(left - 6, sy(h) + 4, fmt(h), 'end');
    }
    out += text(width - 12, height - 6, i18n.getMessage('autolandProfileAxis'), 'text-anchor="end" class="autolandAxisText"');
    out += `<line x1="${left}" y1="${fmt(sy(dir.finalAlt), 1)}" x2="${fmt(width - 12, 1)}" y2="${fmt(sy(dir.finalAlt), 1)}" class="autolandFinalAlt"/>`;
    out += text(left + 6, sy(dir.finalAlt) - 5, i18n.getMessage('autolandFinalAltLine', { alt: fmt(dir.finalAlt, 1) }), 'class="autolandAxisText"');

    for (let i = 1; i < dir.track.length; i++) {
        const a = dir.track[i - 1];
        const b = dir.track[i];
        out += `<line x1="${fmt(sx(a.flown), 1)}" y1="${fmt(sy(a.alt), 1)}" x2="${fmt(sx(b.flown), 1)}" y2="${fmt(sy(b.alt), 1)}" stroke="${rampColor((a.alt + b.alt) / 2 / Math.max(params.approachAlt, 1))}" class="autolandTrack"/>`;
    }
    const placer = labelPlacer(width, height, dir.track.map((p) => ({ x: sx(p.flown), y: sy(p.alt) })), m);
    axisBoxes.forEach((b) => placer.markBox(b));
    placer.markBox(textBox(m, { at: 4, anchor: 'start' }, top - 8, m.axisWidth(unit), m.axisSize, 1));
    // the final altitude's own label, top left of its line, and the axis title
    placer.markBox(textBox(m, { at: left + 6, anchor: 'start' }, sy(dir.finalAlt) - 5,
        m.axisWidth(i18n.getMessage('autolandFinalAltLine', { alt: fmt(dir.finalAlt, 1) })), m.axisSize, 1));
    placer.markBox(textBox(m, { at: width - 12, anchor: 'end' }, height - 6, m.axisWidth(i18n.getMessage('autolandProfileAxis')), m.axisSize, 1));
    flareEvents(dir).forEach(([point, key, ux]) => {
        if (point) {
            const p = { x: sx(point.flown), y: sy(point.alt) };
            out += `<circle cx="${fmt(p.x, 1)}" cy="${fmt(p.y, 1)}" r="5" class="autolandEvent"/>`;
            placer.mark(p, 7);
            if (key) {
                out += placer.place([i18n.getMessage(key, { alt: fmt(point.alt, 1) })], [p], ux, -0.8);
            }
        }
    });
    out += text(4, top - 8, unit, 'class="autolandAxisText"');
    out += `<line class="autolandProfileHover" y1="${top}" y2="${fmt(sy(0), 1)}" style="display: none"/>`;
    svg.attr({ width, height, viewBox: `0 0 ${fmt(width)} ${fmt(height)}` }).html(out);
    svg.attr('aria-label', i18n.getMessage('autolandProfile'));
    return { sx };
}

function warningText(w) {
    const values = {};
    for (const [key, v] of Object.entries(w)) {
        if (typeof v === 'number') {
            values[key] = fmt(v, key === 'value' ? 1 : 0);
        }
    }
    return i18n.getMessage('autolandWarning_' + w.id, values);
}

function updateChecks(params, plan) {
    // as the Setup tab's pre-arming checks: one row per condition, its note only when it says something
    const rows = [];
    const range = FC.SENSOR_STATUS ? FC.SENSOR_STATUS.rangeHwStatus : 0;
    // optional: without it the glide goes on to the ground, no flare
    rows.push({ label: 'autolandCheckRangefinder', ok: range === 1 ? true : OPTIONAL, note: null });
    const safehome = FC.SAFEHOMES.get()[siteIndex];
    const located = !!safehome?.getEnabled();
    rows.push({ label: 'autolandCheckSafehome', ok: located, note: located ? null : 'autolandCheckSafehomeNote' },
        { label: 'autolandCheckHeading', ok: plan.directions.length > 0, note: plan.directions.length > 0 ? null : 'autolandCheckHeadingNote' });
    // nav_rth_allow_landing's table: NEVER, ALWAYS, FS_ONLY (the option texts can be translated)
    const rth = Number.parseInt($('#autolandRthAllowLanding').val(), 10);
    let rthNote = null;
    if (rth === 0) {
        rthNote = 'autolandCheckRthNote';
    } else if (rth === 2) {
        rthNote = 'autolandCheckRthFailsafe';
    }
    rows.push({ label: 'autolandCheckRth', ok: !Number.isNaN(rth) && rth !== 0, note: rthNote });
    const circuitAvailable = $('[data-setting="nav_fw_land_downwind_offset"]').length > 0;
    let circuitNote = null;
    if (!circuitAvailable) {
        circuitNote = 'autolandCheckCircuitMissing';
    } else if (params.downwindOffset <= 0) {
        circuitNote = 'autolandCheckCircuitClassic';
    }
    rows.push({ label: 'autolandCheckCircuit', ok: circuitAvailable && params.downwindOffset > 0 ? true : null, note: circuitNote });
    const mark = (ok) => {
        if (ok === null) {
            return '';
        }
        if (ok === OPTIONAL) {
            return '<div class="autolandOptional"></div>';
        }
        return i18n.getMessage(ok ? 'armingCheckPass' : 'armingCheckFail');
    };
    $('.autolandCheckTable tbody').html(rows.map((r, i) =>
        `<tr${i === rows.length - 1 ? ' class="noboarder"' : ''}><td>${i18n.getMessage(r.label)}` +
        (r.note ? `<div class="autolandCheckNote">${i18n.getMessage(r.note)}</div>` : '') +
        `</td><td>${mark(r.ok)}</td></tr>`).join(''));

    const warnings = plan.warnings.concat(plan.directions[directionIndex] ? plan.directions[directionIndex].warnings : []);
    $('.autolandWarnings').html(warnings.map((w) => `<li>${warningText(w)}</li>`).join(''));
}

function drawDirections(plan) {
    const box = $('.autolandDirections');
    if (directionIndex >= plan.directions.length) {
        directionIndex = 0;
    }
    // the selected direction's runway start and height over it; empty start: the common touchdown point
    const dir = plan.directions[directionIndex];
    const a = approach();
    const start = dir && a ? a.getRunwayStart(dir.aimIndex) : 0;
    // the fields exist from the firmware that sends them; an older one would ignore what they set
    $('#autolandRunwayStart').closest('.autolandField').toggle(!!a?.getRunwayKnown());
    const startField = $('#autolandRunwayStart').prop('disabled', !dir);
    const heightField = $('#autolandRunwayStartHeight').prop('disabled', !dir || !start);
    // the field being typed in keeps what it holds
    if (!startField.is(':focus')) {
        startField.val(start > 0 ? start : '');
    }
    if (!heightField.is(':focus')) {
        heightField.val(start > 0 ? a.getRunwayStartHeight(dir.aimIndex) / 10 : '');
    }
    box.html(plan.directions.map((d, i) =>
        `<button type="button" role="radio" aria-checked="${i === directionIndex}" data-index="${i}" class="${i === directionIndex ? 'active' : ''}">` +
        i18n.getMessage('autolandLandTowards', { heading: fmt(d.landing) }) + '</button>').join(''));
    box.find('button').on('click', function () {
        directionIndex = Number.parseInt($(this).data('index'), 10);
        redraw();
    });
}

function bindHover(planView, profileView) {
    const svg = $('.autolandPlan');
    const tooltip = $('.autolandTooltip');
    svg.off('mousemove mouseleave');
    if (!planView.dir) {
        return;
    }
    const pts = planView.dir.track.map((p) => ({ p, s: planView.px(p) }));
    const atAim = planView.dir.track.reduce((a, b) => (Math.abs(b.toGo) < Math.abs(a.toGo) ? b : a)).flown;
    svg.on('mousemove', (e) => {
        const box = svg[0].getBoundingClientRect();
        const x = e.clientX - box.left;
        const y = e.clientY - box.top;
        let best = null;
        let bestD = HOVER_RADIUS_PX;
        for (const q of pts) {
            const d = Math.hypot(q.s.x - x, q.s.y - y);
            if (d < bestD) {
                best = q;
                bestD = d;
            }
        }
        const hover = svg.find('.autolandHover');
        const line = $('.autolandProfileView .autolandProfileHover');
        if (!best) {
            hover.hide();
            tooltip.hide();
            line.hide();
            return;
        }
        hover.attr({ cx: best.s.x, cy: best.s.y }).show();
        if (profileView) {
            line.attr({ x1: profileView.sx(best.p.flown), x2: profileView.sx(best.p.flown) }).show();
        }
        tooltip.html(`<strong>${phaseName(best.p.phase)}</strong><br>` +
            i18n.getMessage('autolandTooltip', { alt: fmt(best.p.alt, 1), distance: fmt(Math.max(atAim - best.p.flown, 0)) }))
            .css({ left: best.s.x + 14, top: best.s.y + 10 }).show();
    });
    svg.on('mouseleave', () => {
        svg.find('.autolandHover').hide();
        tooltip.hide();
        $('.autolandProfileView .autolandProfileHover').hide();
    });
}

/* Wide windows: the layout takes the height left under the title, the settings scroll and the drawings fill the rest */
function fitLayout() {
    const layout = $('.autolandLayout');
    if (layout.closest('.content_wrapper').width() <= NARROW_LAYOUT_PX) {
        layout.removeClass('fitted').css('height', '');
        return;
    }
    const top = layout[0].getBoundingClientRect().top;
    // down to the save bar, which sits at the bottom of the content area over the status bar, not of the window
    const toolbar = $('.tab-autoland .content_toolbar:visible')[0];
    let bottom = (toolbar || $('#content')[0] || document.body).getBoundingClientRect()[toolbar ? 'top' : 'bottom'];
    // and no lower than the content wrapper's inner edge: past it the wrapper scrolls, and its scroll bar would narrow
    // the drawings already sized
    const wrapper = layout.closest('.content_wrapper')[0];
    if (wrapper) {
        const cs = getComputedStyle(wrapper);
        bottom = Math.min(bottom, wrapper.getBoundingClientRect().bottom - Number.parseFloat(cs.paddingBottom) - Number.parseFloat(cs.borderBottomWidth));
    }
    layout.addClass('fitted').css('height', Math.max(bottom - top - 4, 420) + 'px');
    // a window too short for the top view next to the settings: the page scrolls instead
    $('.autolandPlan').attr('height', 0);
    if ($('.autolandPlanWrap').height() < PLAN_MIN_FITTED_PX) {
        layout.removeClass('fitted').css('height', '');
    }
}

/* A set approach speed is the one flown: the drawing uses it and the estimate field only shows it */
function syncSpeed() {
    const held = cm('nav_fw_land_approach_speed');
    $('#autolandSpeed').prop('disabled', held > 0);
    if (held > 0) {
        $('#autolandSpeed').val(fmt(held, 1));
    }
}

function redraw() {
    if (!approach()) {
        return;
    }
    fitLayout();
    syncSpeed();
    // the satellite image needs the safehome's position
    const safehome = FC.SAFEHOMES.get()[siteIndex];
    const located = !!safehome?.getEnabled();
    const offline = globalSettings.mapProviderType === 'mapproxy';
    $('#autolandSatellite').prop('disabled', !located || offline);
    let why = '';
    if (offline) {
        why = i18n.getMessage('autolandSatelliteOffline');
    } else if (!located) {
        why = i18n.getMessage('autolandSatelliteNoSite');
    }
    $('.autolandSatelliteField').toggleClass('unavailable', !located || offline).attr('title', why);
    const params = readParams();
    const plan = planAutoland(params);
    lastPlan = plan;
    drawDirections(plan);
    updateChecks(params, plan);
    // the profile first: its height sets what is left for the plan
    const profileView = drawProfile(params, plan.directions[directionIndex]);
    const planView = drawPlan(params, plan);
    bindHover(planView, profileView);
}

function loadNavSettings() {
    const names = ['nav_fw_bank_angle', 'roll_rate', 'nav_fw_control_smoothness', 'nav_fw_wp_turn_control_ease',
        'fw_loiter_direction', 'nav_fw_loiter_radius', 'nav_fw_cruise_speed'];
    return Promise.all(names.map((n) => mspHelper.getSetting(n).catch(() => null))).then((s) => {
        const value = (i, fallback) => (s[i] ? s[i].value : fallback);
        const loiter = s[4]?.setting.table ? s[4].setting.table.values[s[4].value] : 'RIGHT';
        navSettings = {
            bankDeg: value(0, 35),
            rollRateDps: value(1, 18) * 10,
            controlSmoothness: value(2, 2),
            wpTurnControlEaseMs: value(3, 0),
            loiterDirection: loiter === 'LEFT' ? LoiterDirection.LEFT : LoiterDirection.RIGHT,
            loiterRadius: value(5, 7500) / 100,
            cruiseSpeed: value(6, 0) / 100
        };
    });
}

/* The settings, then the approaches, then the EEPROM */
function save() {
    Settings.saveInputs(() => mspHelper.saveFwApproach(saveToEeprom));
}

function saveToEeprom() {
    mspHelper.saveToEeprom(() => GUI.log(i18n.getMessage('autolandSaved')));
}

autolandTab.initialize = function (callback) {
    if (GUI.active_tab !== this) {
        GUI.active_tab = this;
    }

    const loadChainer = new MSPChainerClass();
    loadChainer.setChain([
        mspHelper.loadMixerConfig,
        mspHelper.loadSensorStatus,
        mspHelper.loadSafehomes,
        mspHelper.loadFwApproach
    ]);
    loadChainer.setExitPoint(loadHtml);
    loadChainer.execute();

    function loadHtml() {
        import('./autoland.html?raw').then(({ default: html }) => GUI.load(html, Settings.processHtml(processHtml)))
        .catch((e) => console.error('autoland: the tab did not load', e));
    }

    function processHtml(settingsPromise) {
        i18n.localize();

        if (!FC.isAirplane()) {
            $('.autolandNotAirplane').show();
            $('.autolandLayout, .tab-autoland .content_toolbar').hide();
            GUI.content_ready(callback);
            return;
        }

        const select = $('#autolandSiteSelect');
        for (let i = 0; i < FC.SAFEHOMES.getMaxSafehomeCount(); i++) {
            const safehome = FC.SAFEHOMES.get()[i];
            const key = safehome?.getEnabled() ? 'autolandSafehomeN' : 'autolandSafehomeUnset';
            select.append($('<option/>').val(i).text(i18n.getMessage(key, { number: String(i + 1) })));
        }
        select.val(siteIndex).on('change', () => {
            siteIndex = Number.parseInt(select.val(), 10);
            directionIndex = 0;
            fillApproach();
            fillRunway();
            redraw();
        });
        fillApproach();
        fillRunway();

        $('.autolandApproach').on('change', () => {
            storeApproach();
            redraw();
        });
        $('#autolandSpeed').on('input change', redraw);
        // each field stores only itself: the height is kept while the start is empty, and a half typed value waits
        const clamp = (value) => Math.min(Math.max(Math.round(value || 0), 0), 255);
        $('#autolandRunwayStart').on('input change', function () {
            const a = approach();
            const dir = lastPlan?.directions[directionIndex];
            if (a && dir) {
                a.setRunwayStart(dir.aimIndex, clamp(Number.parseFloat($(this).val())));
                redraw();
            }
        });
        $('#autolandRunwayStartHeight').on('input change', function () {
            const a = approach();
            const dir = lastPlan?.directions[directionIndex];
            const value = Number.parseFloat($(this).val());
            if (a && dir && !Number.isNaN(value)) {
                a.setRunwayStartHeight(dir.aimIndex, clamp(value * 10));
                redraw();
            }
        });
        // the runway is only drawn: INAV knows the landing site, not the strip around it
        $('#autolandRunwayLength, #autolandRunwayWidth').on('input change', () => {
            const runways = store.get(RUNWAY_STORE_KEY, {});
            runways[siteIndex] = {
                length: Number.parseFloat($('#autolandRunwayLength').val()) || 0,
                width: Number.parseFloat($('#autolandRunwayWidth').val()) || 0
            };
            store.set(RUNWAY_STORE_KEY, runways);
            redraw();
        });
        // on by default with the esri map provider, the source of the image
        $('#autolandSatellite').prop('checked', store.get(SATELLITE_STORE_KEY, globalSettings.mapProviderType === 'esri')).on('change', () => {
            store.set(SATELLITE_STORE_KEY, $('#autolandSatellite').prop('checked'));
            redraw();
        });
        $('#content').scrollTop(0);
        $('.autolandRedraw').on('input change', redraw);
        $(window).on('resize.autoland', () => {
            if (lastPlan) {
                redraw();
            }
        });

        // the approach fields are stored on change: storing them again here would round what Mission Control set
        $('a.save').on('click', save);

        // the tab is ready even if the first drawing fails, or no other tab could be opened
        Promise.all([settingsPromise, loadNavSettings()]).then(() => {
            $('#autolandSpeed').val(fmt(navSettings.cruiseSpeed > 0 ? navSettings.cruiseSpeed : DEFAULT_SPEED_MS, 1));
            redraw();
        }).catch((e) => console.error('autoland:', e)).finally(() => GUI.content_ready(callback));
    }
};

autolandTab.cleanup = function (callback) {
    $(window).off('resize.autoland');
    lastPlan = null;
    if (callback) {
        callback();
    }
};

export default autolandTab;
