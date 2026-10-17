'use strict';

/**
 * Backup migration: change tpa_breakpoint from an old default to a new one
 * without changing the fixed-wing gain curve.
 *
 * Fixed-wing throttle TPA (pid.c calculateFixedWingTPAFactor), r = tpa_rate/100:
 *   f(T) = 1 + (0.5 + 0.5*(B-I)/(T-I) - 1) * r      (clamped to 0.3..2.0)
 * and kP, kI, kD, kFF are all multiplied by f(T). Changing B and rescaling the
 * gains reproduces the old curve at every throttle when
 *   r2 = r(B-I) / [(B2-I)(1 - r/2) + (r/2)(B-I)]
 *   s  = (1 - r/2) / (1 - r2/2)
 * with tpa_rate -> 100*r2 and every fw_p/i/d/ff gain multiplied by s.
 * I is throttle idle: min_command + (MAX_THROTTLE - min_command) * throttle_idle / 100.
 *
 * tpa_rate and the fw_* gains are in the same "control_profile N" section of a
 * dump/diff, so each section is migrated on its own.
 */

const MAX_THROTTLE = 1850;
const DEFAULT_MIN_COMMAND = 1000;
const DEFAULT_THROTTLE_IDLE_PCT = 8;
const GAIN_MAX = 255;
const TPA_RATE_MAX = 200;
const WARN_ERROR = 0.05;

const GAIN_DEFAULTS = {
    fw_p_roll: 5, fw_p_pitch: 5, fw_p_yaw: 6,
    fw_i_roll: 7, fw_i_pitch: 7, fw_i_yaw: 10,
    fw_d_roll: 0, fw_d_pitch: 0, fw_d_yaw: 0,
    fw_ff_roll: 50, fw_ff_pitch: 50, fw_ff_yaw: 60,
};

const SECTION_START = /^(control_profile|battery_profile|mixer_profile)\s+\d+\s*$/i;
const SET_LINE = /^set\s+(\w+)\s*=\s*(-?\d+)\s*$/i;

function tpaFactor(T, B, rate, idle) {
    const r = rate / 100;
    const f = 1 + (0.5 + 0.5 * (B - idle) / (T - idle) - 1) * r;
    return Math.min(2.0, Math.max(0.3, f));
}

/** Exact (unrounded) migration values, or null if the migration does not apply. */
function computeRescale(rate, oldB, newB, idle) {
    if (rate <= 0 || oldB <= idle || newB <= idle) return null;
    const r = rate / 100;
    const r2 = r * (oldB - idle) / ((newB - idle) * (1 - r / 2) + (r / 2) * (oldB - idle));
    return { rate: 100 * r2, scale: (1 - r / 2) / (1 - r2 / 2) };
}

function firstSetValue(lines, name) {
    for (const line of lines) {
        const m = line.trim().match(SET_LINE);
        if (m && m[1].toLowerCase() === name) return parseInt(m[2], 10);
    }
    return null;
}

/**
 * @param {string[]} lines - backup lines
 * @param {{fromBreakpoint:number, toBreakpoint:number}} cfg
 * @returns {{lines: string[], changes: string[], warnings: string[]}}
 */
function rescaleTpaBreakpoint(lines, cfg) {
    const changes = [];
    const warnings = [];

    const minCommand = firstSetValue(lines, 'min_command') ?? DEFAULT_MIN_COMMAND;
    const idlePct = firstSetValue(lines, 'throttle_idle') ?? DEFAULT_THROTTLE_IDLE_PCT;
    const idle = minCommand + (MAX_THROTTLE - minCommand) * idlePct / 100;

    const out = lines.slice();
    const starts = [];
    out.forEach((line, i) => { if (SECTION_START.test(line.trim())) starts.push(i); });

    // Work from the last section backwards so inserted lines don't shift later indexes.
    for (let s = starts.length - 1; s >= 0; s--) {
        const begin = starts[s];
        const trimmedStart = out[begin].trim();
        if (!/^control_profile/i.test(trimmedStart)) continue;
        const end = s + 1 < starts.length ? starts[s + 1] : out.length;
        const profileName = trimmedStart.replace(/\s+/g, ' ');

        const idx = {};
        const vals = {};
        for (let i = begin + 1; i < end; i++) {
            const m = out[i].trim().match(SET_LINE);
            if (m) {
                const name = m[1].toLowerCase();
                idx[name] = i;
                vals[name] = parseInt(m[2], 10);
            }
        }
        if (vals.tpa_breakpoint !== cfg.fromBreakpoint) continue;

        const rate = vals.tpa_rate ?? 0;
        const bpIdx = idx.tpa_breakpoint;
        const inserts = [];
        const setOrAdd = (name, value) => {
            if (idx[name] !== undefined) {
                out[idx[name]] = `set ${name} = ${value}`;
            } else {
                inserts.push(`set ${name} = ${value}`);
            }
        };

        if (rate === 0) {
            // TPA is off: the breakpoint is inert, just adopt the new value.
            out[bpIdx] = `set tpa_breakpoint = ${cfg.toBreakpoint}`;
            changes.push(`${profileName}: tpa_breakpoint ${cfg.fromBreakpoint} → ${cfg.toBreakpoint} (tpa_rate 0, no gain change)`);
            continue;
        }

        const exact = computeRescale(rate, cfg.fromBreakpoint, cfg.toBreakpoint, idle);
        if (!exact) {
            warnings.push(`${profileName}: tpa_breakpoint ${cfg.fromBreakpoint} left unchanged (at or below throttle idle ${Math.round(idle)}, TPA inactive)`);
            continue;
        }

        const newRate = Math.min(TPA_RATE_MAX, Math.max(0, Math.round(exact.rate)));
        const newGains = {};
        for (const name of Object.keys(GAIN_DEFAULTS)) {
            const cur = vals[name] ?? GAIN_DEFAULTS[name];
            newGains[name] = Math.min(GAIN_MAX, Math.max(0, Math.round(cur * exact.scale)));
        }

        // Worst gain error after rounding, over a plausible flying range.
        let worst = 0;
        for (let T = 1300; T <= 1800; T += 25) {
            const oldF = tpaFactor(T, cfg.fromBreakpoint, rate, idle);
            const newF = tpaFactor(T, cfg.toBreakpoint, newRate, idle);
            for (const name of Object.keys(GAIN_DEFAULTS)) {
                const cur = vals[name] ?? GAIN_DEFAULTS[name];
                if (cur > 0) {
                    worst = Math.max(worst, Math.abs((newGains[name] * newF) / (cur * oldF) - 1));
                }
            }
        }

        out[bpIdx] = `set tpa_breakpoint = ${cfg.toBreakpoint}`;
        setOrAdd('tpa_rate', newRate);
        for (const name of Object.keys(GAIN_DEFAULTS)) {
            const cur = vals[name] ?? GAIN_DEFAULTS[name];
            if (idx[name] !== undefined || newGains[name] !== cur) {
                setOrAdd(name, newGains[name]);
            }
        }
        if (inserts.length > 0) out.splice(bpIdx + 1, 0, ...inserts);

        changes.push(`${profileName}: tpa_breakpoint ${cfg.fromBreakpoint} → ${cfg.toBreakpoint}, ` +
            `tpa_rate ${rate} → ${newRate}, fw_p/i/d/ff gains × ${exact.scale.toFixed(3)} (gain error ≤ ${(worst * 100).toFixed(1)}%)`);
        if (worst > WARN_ERROR) {
            warnings.push(`${profileName}: rounding leaves up to ${(worst * 100).toFixed(1)}% difference from the original TPA gains; review the tune`);
        }
    }

    return { lines: out, changes, warnings };
}

export { rescaleTpaBreakpoint, computeRescale, tpaFactor };
