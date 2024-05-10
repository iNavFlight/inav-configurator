'use strict';

const FC = require('./fc');

// return true if user has choose a special peripheral
function isPeripheralSelected(peripheralName) {
    for (var portIndex = 0; portIndex < FC.SERIAL_CONFIG.ports.length; portIndex++) {
        var serialPort = FC.SERIAL_CONFIG.ports[portIndex];
        if (serialPort.functions.indexOf(peripheralName) >= 0) {
            return true;
        }
    }

    return false;
}

// Adjust the real name for a modeId. Useful if it belongs to a peripheral
function adjustBoxNameIfPeripheralWithModeID(modeId, defaultName) {
    if (isPeripheralSelected("RUNCAM_DEVICE_CONTROL")) {
        switch (modeId) {
            case 39: // BOXCAMERA1
                return "CAMERA WI-FI";
            case 40: // BOXCAMERA2
                return "CAMERA POWER";
            case 41: // BOXCAMERA3
                return "CAMERA CHANGE MODE";
            default:
                break;
        }
    }
    
    if (modeId === 11) {
        if (FC.isAirplane()) {
            return "NAV LOITER";
        }
    }

    return defaultName;  
}

module.exports = adjustBoxNameIfPeripheralWithModeID ;