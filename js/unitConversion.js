'use strict';

/*
 * Unit presentation helpers shared by the settings framework and by tabs
 * that show firmware values outside of the data-setting mechanism.
 *
 * Everything in here works on firmware units: a value is converted only for
 * display, and converted straight back before it is stored or sent.
 */

import { globalSettings, UnitType } from './globalSettings.js';

/**
 * Round to the nearest 10, 100, etc. but only while the integer value is
 * within 1 of a boundary (e.g. 999->1000, 1001->1000) and rounding changes
 * the value by less than 1%. Absolute values are used for the boundary
 * detection so negatives behave the same. Returns the roundest match as a
 * string, or fallback when no magnitude fits.
 */
function roundToMagnitude(value, fallback) {
    let best = fallback;
    let intVal = Math.round(Math.abs(value));
    for (let mag = 1; mag <= 3; mag++) {
        let factor = Math.pow(10, mag);
        let remainder = intVal % factor;
        if (remainder <= 1 || remainder >= factor - 1) {
            let rounded = Math.sign(value) * Math.round(Math.abs(value) / factor) * factor;
            if (Math.abs(rounded - value) / Math.abs(value) < 0.01) {
                best = rounded.toFixed(0);
            } else {
                break;
            }
        } else {
            break;
        }
    }
    return best;
}

/**
 * Round a converted value to fewer decimal places when doing so
 * changes the value by less than 1%. For example, 328.08 ft (from 100m)
 * becomes "328" and 9842.52 ft becomes "9843". Also rounds to the
 * nearest 10/100/etc when within 1 of a boundary (e.g. 999 → "1000").
 * Returns a string like toFixed().
 */
function smartRound(value, decimalPlaces) {
    if (decimalPlaces < 2 || value === 0) {
        return value.toFixed(decimalPlaces);
    }
    // Try removing decimal places (most aggressive first)
    let best = null;
    for (let dp = 0; dp <= decimalPlaces - 2; dp++) {
        let rounded = Number.parseFloat(value.toFixed(dp));
        if (Math.abs(rounded - value) / Math.abs(value) < 0.01) {
            best = rounded.toFixed(dp);
            break;
        }
    }
    if (best !== null) {
        best = roundToMagnitude(value, best);
    }
    return best !== null ? best : value.toFixed(decimalPlaces);
}

// Display names for the units
const unitDisplayNames = {
    // Misc
    'cw' : 'cW',
    'percent'   : '%',
    'cmss'      : 'cm/s/s',
    // Time
    'us'        : "uS",
    'msec'      : 'ms',
    'msec-nc'   : 'ms', // Milliseconds, but not converted.
    'dsec'      : 'ds',
    'sec'       : 's',
    'mins'      : 'm',
    'hours'     : 'h',
    'tzmins'    : 'm',
    'tzhours'   : 'hh:mm',
    // Angles
    'centideg'      : 'centi&deg;',
    'centideg-deg'  : 'centi&deg;', // Centidegrees, but always converted to degrees by default
    'decideg'       : 'deci&deg;',
    'decideg-lrg'   : 'deci&deg;', // Decidegrees, but always converted to degrees by default
    'deg'           : '&deg;',
    'decadeg'       : 'deca&deg;',
    // Rotational speed
    'degps'     : '&deg; per second',
    'decadegps' : 'deca&deg; per second',
    // Temperature
    'decidegc'  : 'deci&deg;C',
    'degc'      : '&deg;C',
    'degf'      : '&deg;F',
    // Speed
    'cms'       : 'cm/s',
    'v-cms'     : 'cm/s',
    'ms'        : 'm/s',
    'kmh'       : 'Km/h',
    'mph'       : 'mph',
    'hftmin'    : 'x100 ft/min',
    'fts'       : 'ft/s',
    'kt'        : 'Kt',
    // Distance
    'cm'    : 'cm',
    'm'     : 'm',
    'km'    : 'Km',
    'm-lrg' : 'm', // Metres, but converted to larger units
    'ft'    : 'ft',
    'mi'    : 'mi',
    'nm'    : 'NM'
}

// Hover full descriptions for the units
const unitExpandedNames = {
    // Misc
    'cw'        : 'CentiWatts',
    'percent'   : 'Percent',
    'cmss'      : 'Centimetres per second, per second',
    // Time
    'us'        : "Microseconds",
    'msec'      : 'Milliseconds',
    'msec-nc'   : 'Milliseconds',
    'dsec'      : 'Deciseconds',
    'sec'       : 'Seconds',
    'mins'      : 'Minutes',
    'hours'     : 'Hours',
    'tzmins'    : 'Minutes',
    'tzhours'   : 'Hours:Minutes',
    // Angles
    'centideg'      : 'CentiDegrees',
    'centideg-deg'  : 'CentiDegrees',
    'decideg'       : 'DeciDegrees',
    'decideg-lrg'   : 'DeciDegrees',
    'deg'           : 'Degrees',
    'decadeg'       : 'DecaDegrees',
    // Rotational speed
    'degps'     : 'Degrees per second',
    'decadegps' : 'DecaDegrees per second',
    // Temperature
    'decidegc'  : 'DeciDegrees Celsius',
    'degc'      : 'Degrees Celsius',
    'degf'      : 'Degrees Fahrenheit',
    // Speed
    'cms'       : 'Centimetres per second',
    'v-cms'     : 'Centimetres per second',
    'ms'        : 'Metres per second',
    'kmh'       : 'Kilometres per hour',
    'mph'       : 'Miles per hour',
    'hftmin'    : 'Hundred feet per minute',
    'fts'       : 'Feet per second',
    'kt'        : 'Knots',
    // Distance
    'cm'    : 'Centimetres',
    'm'     : 'Metres',
    'km'    : 'Kilometres',
    'm-lrg' : 'Metres',
    'ft'    : 'Feet',
    'mi'    : 'Miles',
    'nm'    : 'Nautical Miles'
}

// this is used to get the factor in which we multiply
// to get the correct conversion, the first index is the from
// unit and the second is the too unit
// unitConversionTable[toUnit][fromUnit] -> factor
const unitRatioTable = {
    'cm' : {
        'm' : 100.0, 
        'ft' : 30.48
    },
    'm' : {
        'm' : 1.0,
        'ft' : 0.3048
    },
    'm-lrg' : {
        'km' : 1000.0,
        'mi' : 1609.344,
        'nm' : 1852.0
    },
    'cms' : { // Horizontal speed
        'kmh' : 27.77777777777778, 
        'kt': 51.44444444444457, 
        'mph' : 44.704,
        'ms' : 100.0
    },
    'v-cms' : { // Vertical speed
        'ms' : 100.0,
        'hftmin' : 50.8,
        'fts' : 30.48
    },
    'msec-nc' : {
        'msec-nc' : 1.0
    },
    'msec' : {
        'sec' : 1000.0
    },
    'dsec' : {
        'sec' : 10.0
    },
    'mins' : {
        'hours' : 60.0
    },
    'tzmins' : {
        'tzhours' : 'TZHOURS'
    },
    'centideg' : {
        'deg' : 100
    },
    'centideg-deg' : {
        'deg' : 100
    },
    'decideg' : {
        'deg' : 10.0
    },
    'decideg-lrg' : {
        'deg' : 10.0
    },
    'decadeg' : {
        'deg' : 0.1
    },
    'decadegps' : {
        'degps' : 0.1
    },
    'decidegc' : {
        'degc' : 10.0,
        'degf' : 'FAHREN'
    },
};

// this holds which units get converted in which unit systems
const conversionTable = {
    0: { //imperial
        'cm' : 'ft',
        'm' : 'ft',
        'm-lrg' : 'mi',
        'cms' : 'mph',
        'v-cms' : 'fts',
        'msec' : 'sec',
        'dsec' : 'sec',
        'mins' : 'hours',
        'tzmins' : 'tzhours',
        'decadegps' : 'degps',
        'centideg' : 'deg',
        'centideg-deg' : 'deg',
        'decideg' : 'deg',
        'decideg-lrg' : 'deg',
        'decadeg' : 'deg',
        'decidegc' : 'degf',
    },
    1: { //metric
        'cm': 'm',
        'm' : 'm',
        'm-lrg' : 'km',
        'cms' : 'kmh',
        'v-cms' : 'ms',
        'msec' : 'sec',
        'dsec' : 'sec',
        'mins' : 'hours',
        'tzmins' : 'tzhours',
        'decadegps' : 'degps',
        'centideg' : 'deg',
        'centideg-deg' : 'deg',
        'decideg' : 'deg',
        'decideg-lrg' : 'deg',
        'decadeg' : 'deg',
        'decidegc' : 'degc',
    },
    2: { //metric with MPH
        'cm': 'm',
        'm' : 'm',
        'm-lrg' : 'km',
        'cms' : 'mph',
        'v-cms' : 'ms',
        'decadegps' : 'degps',
        'centideg' : 'deg',
        'centideg-deg' : 'deg',
        'decideg' : 'deg',
        'decideg-lrg' : 'deg',
        'decadeg' : 'deg',
        'msec' : 'sec',
        'dsec' : 'sec',
        'mins' : 'hours',
        'tzmins' : 'tzhours',
        'decidegc' : 'degc',
    },
    3:{ //UK
        'cm' : 'ft',
        'm' : 'ft',
        'm-lrg' : 'mi',
        'cms' : 'mph',
        'v-cms' : 'fts',
        'decadegps' : 'degps',
        'centideg' : 'deg',
        'centideg-deg' : 'deg',
        'decideg' : 'deg',
        'decideg-lrg' : 'deg',
        'decadeg' : 'deg',
        'msec' : 'sec',
        'dsec' : 'sec',
        'mins' : 'hours',
        'tzmins' : 'tzhours',
        'decidegc' : 'degc',
    },
    4: { //General aviation
        'cm' : 'ft',
        'm' : 'ft',
        'm-lrg' : 'nm',
        'cms': 'kt',
        'v-cms' : 'hftmin',
        'decadegps' : 'degps',
        'centideg' : 'deg',
        'centideg-deg' : 'deg',
        'decideg' : 'deg',
        'decideg-lrg' : 'deg',
        'decadeg' : 'deg',
        'msec' : 'sec',
        'dsec' : 'sec',
        'mins' : 'hours',
        'tzmins' : 'tzhours',
        'decidegc' : 'degc',
    },
    default: { //show base units
        'decadegps' : 'degps',
        'decideg-lrg' : 'deg',
        'centideg' : 'deg',
        'centideg-deg' : 'deg',
        'decadeg' : 'deg',
        'tzmins' : 'tzhours',
    }
};

/**
 * The unit system currently selected in the Configurator options, expressed
 * with the OSD unit numbering (0 imperial, 1 metric, 2 metric/MPH, 3 UK,
 * 4 general aviation). -1 means "leave the firmware units alone".
 */
function getUnitSystem() {
    switch (globalSettings.unitType) {
        case UnitType.imperial:
            return 0;
        case UnitType.metric:
            return 1;
        case UnitType.OSD: // Match the OSD value on the UI
            return globalSettings.osdUnits;
        case UnitType.none:
        default:
            return -1;
    }
}

/**
 * Returns the factor a firmware value has to be divided by to reach the
 * display unit, together with the name of that display unit. A multiplier of
 * 1 means the firmware unit is shown unchanged.
 */
function getUnitMultiplier(inputUnit) {
    const uiUnitValue = getUnitSystem();
    const uiUnits = (uiUnitValue != -1) ? uiUnitValue : 'default';

    if (conversionTable[uiUnits]) {
        const fromUnits = conversionTable[uiUnits];
        if (fromUnits[inputUnit]) {
            const multiplier = unitRatioTable[inputUnit][fromUnits[inputUnit]];
            return {'multiplier': multiplier, 'unitName': fromUnits[inputUnit]};
        }
    }
    return {multiplier: 1, unitName: inputUnit};
}

/** Short symbol of a display unit, e.g. "ft". */
function getUnitDisplayName(unitName) {
    return unitDisplayNames[unitName];
}

/** Long description of a display unit, used for hover titles. */
function getUnitExpandedName(unitName) {
    return unitExpandedNames[unitName];
}

/**
 * Number of decimal places a converted value is shown with. Mirrors what
 * Settings.convertToUnitSetting() derives for the input step.
 */
function getUnitDecimals(multiplier) {
    if (typeof multiplier !== 'number' || multiplier === 1) {
        return 0;
    }

    let decimalPlaces = Math.min(Math.ceil(multiplier / 100), 3);
    // Add extra decimal place for non-integer conversions.
    if (multiplier % 1 != 0 && decimalPlaces < 3) {
        decimalPlaces++;
    }
    return decimalPlaces;
}

/**
 * Converts a firmware value for display.
 *
 * The returned object carries the numeric value, the same value already
 * formatted for an input field, and the unit it is expressed in. Units with
 * a non numeric conversion (temperature, time zones) are passed through
 * untouched, they never appear outside of the settings framework.
 */
function toDisplayUnits(value, inputUnit) {
    const converted = getUnitMultiplier(inputUnit);
    const multiplier = converted.multiplier;
    const numeric = Number(value);

    if (typeof multiplier !== 'number' || !Number.isFinite(numeric)) {
        return {
            value: numeric,
            text: String(value),
            unitName: inputUnit,
            displayName: getUnitDisplayName(inputUnit),
            multiplier: 1,
            decimals: 0
        };
    }

    const decimals = getUnitDecimals(multiplier);
    const displayValue = numeric / multiplier;

    return {
        value: displayValue,
        text: smartRound(displayValue, decimals),
        unitName: converted.unitName,
        displayName: getUnitDisplayName(converted.unitName),
        multiplier: multiplier,
        decimals: decimals
    };
}

/**
 * Converts a value the user typed in the display unit back to firmware
 * units. precision is the number of decimals the firmware unit itself
 * supports and defaults to 0, which is what whole cm/cm per s fields need.
 */
function fromDisplayUnits(value, inputUnit, precision = 0) {
    const converted = getUnitMultiplier(inputUnit);
    const multiplier = converted.multiplier;
    const numeric = Number(value);

    if (typeof multiplier !== 'number' || !Number.isFinite(numeric)) {
        return numeric;
    }

    const raw = numeric * multiplier;
    if (precision <= 0) {
        return Math.round(raw);
    }

    const factor = Math.pow(10, precision);
    return Math.round(raw * factor) / factor;
}

export {
    fromDisplayUnits,
    getUnitDecimals,
    getUnitDisplayName,
    getUnitExpandedName,
    getUnitMultiplier,
    smartRound,
    toDisplayUnits
};

