'use strict';

// UAVCAN/DroneCAN node IDs are 1-127 (0 is broadcast/anonymous, 128+ isn't
// addressable). saveConfig() must reject anything else before touching the
// FC — a bad value here previously reached setSetting()/saveToEeprom()/reboot
// with only partial config applied.
export function isValidDronecanNodeId(nodeId) {
    return Number.isInteger(nodeId) && nodeId >= 1 && nodeId <= 127;
}
