'use strict';

// Per-motor ESC telemetry as reported by MSP2_INAV_ESC_TELEM.
//
// The firmware answers with one byte motor count followed by one raw
// escSensorData_t per motor. The struct is written straight from memory
// (sbufWriteDataSafe), so it carries the compiler's alignment padding:
//
//   offset  0  uint8   dataAge      (255 = never received, see ESC_DATA_INVALID)
//   offset  2  int16   temperature  [°C]
//   offset  4  int16   voltage      [0.01 V]
//   offset  8  int32   current      [0.01 A]
//   offset 12  uint32  rpm
//
// A packed 13-byte layout is accepted as well, in case a future firmware
// drops the padding.

// Mirrors ESC_DATA_MAX_AGE in src/main/sensors/esc_sensor.h: the firmware
// itself (battery, OSD) only trusts a motor whose frames are at most this old.
export const ESC_DATA_MAX_AGE = 10;
export const ESC_DATA_INVALID = 255;

const LAYOUTS = {
    16: { temperature: 2, voltage: 4, current: 8, rpm: 12 },
    13: { temperature: 1, voltage: 3, current: 5, rpm: 9 },
};

/**
 * @param {DataView} data payload of an MSP2_INAV_ESC_TELEM reply
 * @returns {Array<{dataAge: number, valid: boolean, temperature: number, voltage: number, current: number, rpm: number}>|null}
 *          one entry per motor, or null when the payload does not match a known layout
 */
export function parseEscTelemetry(data) {
    if (!data || data.byteLength < 1) {
        return null;
    }

    const motorCount = data.getUint8(0);
    if (motorCount === 0) {
        return [];
    }

    const payloadLength = data.byteLength - 1;
    if (payloadLength % motorCount !== 0) {
        return null;
    }

    const entrySize = payloadLength / motorCount;
    const layout = LAYOUTS[entrySize];
    if (!layout) {
        return null;
    }

    const motors = [];
    for (let i = 0; i < motorCount; i++) {
        const base = 1 + i * entrySize;
        const dataAge = data.getUint8(base);

        motors.push({
            dataAge: dataAge,
            valid: dataAge <= ESC_DATA_MAX_AGE,
            temperature: data.getInt16(base + layout.temperature, true),
            voltage: data.getInt16(base + layout.voltage, true) / 100,
            current: data.getInt32(base + layout.current, true) / 100,
            rpm: data.getUint32(base + layout.rpm, true),
        });
    }

    return motors;
}
