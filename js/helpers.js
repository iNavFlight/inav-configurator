/*global $*/
'use strict';

function checkChromeRuntimeError() {
    if (chrome.runtime.lastError) {
        console.error(
            `Chrome API Error: ${chrome.runtime.lastError.message}.\n Traced ${
                new Error().stack
            }`
        );
        return true;
    }
    return false;
}

function constrain(input, min, max) {

    if (input < min) {
        return min;
    }

    if (input > max) {
        return max;
    }

    return input;
}

function zeroPad(value, width) {
    value = "" + value;

    while (value.length < width) {
        value = "0" + value;
    }

    return value;
}

function generateFilename(prefix, suffix) {
    var date = new Date();
    var filename = prefix;

    if (CONFIG) {
        if (CONFIG.flightControllerIdentifier) {
            filename = CONFIG.flightControllerIdentifier + '_' + CONFIG.flightControllerVersion + "_" + filename;
        }
         
        if (CONFIG.name && CONFIG.name.trim() !== '') {
            filename = filename + '_' + CONFIG.name.trim().replace(' ', '_');
        }
    }

    filename = filename + '_' + date.getFullYear()
        + zeroPad(date.getMonth() + 1, 2)
        + zeroPad(date.getDate(), 2)
        + '_' + zeroPad(date.getHours(), 2)
        + zeroPad(date.getMinutes(), 2)
        + zeroPad(date.getSeconds(), 2);

    return filename + '.' + suffix;
}

function scaleRangeInt(x, srcMin, srcMax, destMin, destMax) {
    let a = (destMax - destMin) * (x - srcMin);
    let b = srcMax - srcMin;
    return Math.round((a / b) + destMin);
}
