'use strict';

// MSP2_INAV_ESC_TELEM sends escSensorData_t (src/main/sensors/esc_sensor.h) raw, so the offsets include its alignment padding.

// Mirrors ESC_DATA_MAX_AGE in src/main/sensors/esc_sensor.h: the firmware
// itself (battery, OSD) only trusts a motor whose frames are at most this old.
export const ESC_DATA_MAX_AGE = 10;
export const ESC_DATA_INVALID = 255;

// PWM_TYPE_SRXL2 in src/main/drivers/pwm_mapping.h
const MOTOR_PROTOCOL_SRXL2 = 7;

const ENTRY_SIZE = 16;
const OFFSET = { temperature: 2, voltage: 4, current: 8, rpm: 12 };

/**
 * @param {Array<{functions: string[]}>} serialPorts FC.SERIAL_CONFIG.ports
 * @param {boolean} motorOutputEnabled feature PWM_OUTPUT_ENABLE
 * @param {number|string} motorProtocol FC.ADVANCED_CONFIG.motorPwmProtocol
 * @returns {boolean} true when the firmware has ESC telemetry it could report
 */
export function escTelemetryExpected(serialPorts, motorOutputEnabled, motorProtocol) {
    // Without motor output escSensorInitialize() returns early and leaves every dataAge at 0, so zeros would pass as live values
    if (!motorOutputEnabled || Number.parseInt(motorProtocol, 10) === MOTOR_PROTOCOL_SRXL2) {
        return false;
    }
    return (serialPorts || []).some(port => port.functions.includes('ESC'));
}

/**
 * @param {DataView} data payload of an MSP2_INAV_ESC_TELEM reply
 * @returns {Array<{dataAge: number, valid: boolean, temperature: number, voltage: number, current: number, rpm: number}>|null}
 *          one entry per motor, or null when the payload length does not fit the motor count
 */
export function parseEscTelemetry(data) {
    if (!data || data.byteLength < 1) {
        return null;
    }

    const motorCount = data.getUint8(0);
    if (data.byteLength !== 1 + motorCount * ENTRY_SIZE) {
        return null;
    }

    const motors = [];
    for (let i = 0; i < motorCount; i++) {
        const base = 1 + i * ENTRY_SIZE;
        const dataAge = data.getUint8(base);

        motors.push({
            dataAge: dataAge,
            valid: dataAge <= ESC_DATA_MAX_AGE,
            temperature: data.getInt16(base + OFFSET.temperature, true),
            voltage: data.getInt16(base + OFFSET.voltage, true) / 100,
            current: data.getInt32(base + OFFSET.current, true) / 100,
            rpm: data.getUint32(base + OFFSET.rpm, true),
        });
    }

    return motors;
}
