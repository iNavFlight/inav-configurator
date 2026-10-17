import MSP from './msp';
import MSPCodes from './msp/MSPCodes';
import CONFIGURATOR from './data_storage';
import { globalSettings, UnitType } from './globalSettings';

// Resolve controller units before a tab converts its fields. A lost response
// must not block opening the tab forever; unsupported firmware keeps raw units.
export function loadOsdUnits() {
    if (globalSettings.unitType !== UnitType.OSD || !CONFIGURATOR.connectionValid) {
        return Promise.resolve();
    }
    return new Promise(function(resolve) {
        let finished = false;
        const timer = setTimeout(() => finish(false), 5000);
        function finish(response) {
            if (finished) return;
            finished = true;
            clearTimeout(timer);
            const data = response && !response.unsupported && response.data;
            globalSettings.osdUnits = data && data.byteLength >= 8 ? data.getUint8(7) : null;
            resolve();
        }
        if (MSP.send_message(MSPCodes.MSP2_INAV_OSD_PREFERENCES, false, false, finish) === false) {
            finish(false);
        }
    });
}
