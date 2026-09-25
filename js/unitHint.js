'use strict';

/*
 * Display-only conversion of a value that is shown in a raw firmware unit
 * (cm, cm/s, ms, decidegrees, ...) into a unit that is easier to read.
 *
 * The configurator keeps sending the raw value to the flight controller;
 * the hint only exists so that a misplaced zero is obvious at a glance:
 * "5000 cm" is easy to overlook, "= 50 m" next to it is not.
 */

const KILOMETRES = { factor: 100000, unit: 'km', decimals: 3, name: 'Kilometres' };

// Keys are the data-unit values used by the settings inputs. `factor` is
// how many raw units make one hint unit. `larger` is an optional unit to
// switch to once the converted value reaches `from`.
const UNIT_HINTS = {
    'cm':       { factor: 100,       unit: 'm',    decimals: 2, name: 'Metres',
                  larger: { from: 1000, ...KILOMETRES } },
    'm-lrg':    { factor: 1000,      unit: 'km',   decimals: 3, name: 'Kilometres' },
    'cms':      { factor: 1000 / 36, unit: 'km/h', decimals: 1, name: 'Kilometres per hour' },
    'v-cms':    { factor: 100,       unit: 'm/s',  decimals: 2, name: 'Metres per second' },
    'msec':     { factor: 1000,      unit: 's',    decimals: 3, name: 'Seconds' },
    'dsec':     { factor: 10,        unit: 's',    decimals: 1, name: 'Seconds' },
    'mins':     { factor: 60,        unit: 'h',    decimals: 2, name: 'Hours' },
    'decideg':  { factor: 10,        unit: '°',  decimals: 1, name: 'Degrees' },
    'decidegc': { factor: 10,        unit: '°C', decimals: 1, name: 'Degrees Celsius' },
    'cw':       { factor: 100,       unit: 'W',    decimals: 2, name: 'Watts' },
};

function formatNumber(value, decimals) {
    let text = value.toFixed(decimals);
    if (text.includes('.')) {
        // Drop trailing zeros and a then-dangling decimal point: "5.50" -> "5.5", "5.00" -> "5"
        let end = text.length;
        while (text[end - 1] === '0') {
            end--;
        }
        if (text[end - 1] === '.') {
            end--;
        }
        text = text.slice(0, end);
    }
    // toFixed() keeps the sign of tiny negatives ("-0"); drop it.
    return text === '-0' ? '0' : text;
}

export function hasUnitHint(unit) {
    return Object.hasOwn(UNIT_HINTS, unit);
}

/**
 * @param {string} unit  data-unit of the input (the raw firmware unit)
 * @param {number|string} rawValue  value as shown in the input
 * @returns {{text: string, title: string}|null}  null when there is nothing to show
 */
export function getUnitHint(unit, rawValue) {
    if (!hasUnitHint(unit)) {
        return null;
    }

    const raw = typeof rawValue === 'string' ? Number.parseFloat(rawValue) : rawValue;
    if (!Number.isFinite(raw)) {
        return null;
    }

    let hint = UNIT_HINTS[unit];
    let converted = raw / hint.factor;
    if (hint.larger && Math.abs(converted) >= hint.larger.from) {
        hint = hint.larger;
        converted = raw / hint.factor;
    }

    const text = formatNumber(converted, hint.decimals);
    const exact = Math.abs(Number.parseFloat(text) - converted) <= Math.abs(converted) * 1e-9;
    // "= 5 m" when the conversion is exact, "≈ 44.4 km/h" when it was rounded.
    const relation = exact ? '= ' : '≈ ';
    // "2.5°" but "60 °C", "5 m".
    const separator = hint.unit === '°' ? '' : ' ';

    return {
        text: relation + text + separator + hint.unit,
        title: hint.name,
    };
}
