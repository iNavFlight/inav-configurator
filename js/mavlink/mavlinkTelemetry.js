'use strict';

import { MAVLINK_MSG_ID, decodeCommandAck } from './mavlinkProtocol.js';

// hardwareSensorStatus_e (sensors/diagnostics.h): MSP_SENSOR_STATUS carries these, SYS_STATUS only bits.
const HW_SENSOR_NONE = 0;
const HW_SENSOR_OK = 1;
const HW_SENSOR_UNAVAILABLE = 2;
const HW_SENSOR_UNHEALTHY = 3;

// MAV_SYS_STATUS_SENSOR bit per FC.SENSOR_STATUS field, as mavlinkSendSystemStatus() sets them.
const SENSOR_STATUS_BITS = [
    ['gyroHwStatus', 0x01],
    ['accHwStatus', 0x02],
    ['magHwStatus', 0x04],
    ['baroHwStatus', 0x08],
    ['gpsHwStatus', 0x20],
    ['rangeHwStatus', 0x100],
    ['speedHwStatus', 0x10],
    ['flowHwStatus', 0x40],
];

export const RC_CHANNELS_MAX = 18;
const RSSI_UNKNOWN = 255;
const RSSI_MAVLINK_MAX = 254;
const RSSI_MSP_MAX = 1023;
const CELL_VOLTAGE_UNUSED = 0xFFFF;
const BATTERY_VOLTAGES_LENGTH = 10;
const BATTERY_VOLTAGES_EXT_LENGTH = 4;
// VBATT_PRESENT_THRESHOLD (battery.c, 0.01 V) in mV: below it the FC reports zero cells.
const BATTERY_PRESENT_THRESHOLD_MV = 2200;
const NOT_MEASURED = -1;
const UINT16_RANGE = 65536;
// Older than this, a message no longer counts as streaming; the feed's freshness rule never goes below it.
export const MIN_FRESH_WINDOW_MS = 3000;

function payloadView(payload) {
    return new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
}

function radiansToDecidegrees(radians) {
    return Math.round(radians * 1800 / Math.PI);
}

function withoutNegativeZero(value) {
    return value + 0;
}

function toInt16(value) {
    return (value << 16) >> 16;
}

export function decodeAttitude(payload) {
    const view = payloadView(payload);
    return { roll: view.getFloat32(4, true), pitch: view.getFloat32(8, true), yaw: view.getFloat32(12, true) };
}

export function decodeSysStatus(payload) {
    const view = payloadView(payload);
    return {
        present: view.getUint32(0, true),
        enabled: view.getUint32(4, true),
        health: view.getUint32(8, true),
        load: view.getUint16(12, true),
        voltageMv: view.getUint16(14, true),
        currentCa: view.getInt16(16, true),
        batteryRemaining: view.getInt8(30),
    };
}

export function decodeGpsRawInt(payload) {
    const view = payloadView(payload);
    return {
        lat: view.getInt32(8, true),
        lon: view.getInt32(12, true),
        altMm: view.getInt32(16, true),
        eph: view.getUint16(20, true),
        vel: view.getUint16(24, true),
        cog: view.getUint16(26, true),
        fixType: payload[28],
        satellites: payload[29],
    };
}

export function decodeVfrHud(payload) {
    const view = payloadView(payload);
    return { alt: view.getFloat32(8, true) };
}

export function decodeRcChannels(payload) {
    const view = payloadView(payload);
    const channels = [];
    for (let i = 0; i < RC_CHANNELS_MAX; i++) {
        channels.push(view.getUint16(4 + i * 2, true));
    }
    return { channels, chancount: payload[40], rssi: payload[41] };
}

export function decodeBatteryStatus(payload) {
    const view = payloadView(payload);
    const voltages = [];
    for (let i = 0; i < BATTERY_VOLTAGES_LENGTH; i++) {
        voltages.push(view.getUint16(10 + i * 2, true));
    }
    const voltagesExt = [];
    for (let i = 0; i < BATTERY_VOLTAGES_EXT_LENGTH; i++) {
        voltagesExt.push(view.getUint16(41 + i * 2, true));
    }
    return {
        currentConsumed: view.getInt32(0, true),
        voltages,
        voltagesExt,
        batteryRemaining: view.getInt8(35),
    };
}

export function sensorStatusFromBits(present, enabled, health, bit) {
    if (health & bit) {
        return HW_SENSOR_OK;
    }
    if (present & bit) {
        return HW_SENSOR_UNHEALTHY;
    }
    return (enabled & bit) ? HW_SENSOR_UNAVAILABLE : HW_SENSOR_NONE;
}

// One entry is one cell or, with zero cells detected, the pack voltage; zero cells only below the present threshold.
export function cellCountFromVoltages(voltages, voltagesExt) {
    const cells = voltages.filter(value => value !== CELL_VOLTAGE_UNUSED).length +
        voltagesExt.filter(value => value !== 0).length;
    if (cells === 1 && voltages[0] <= BATTERY_PRESENT_THRESHOLD_MV) {
        return 0;
    }
    return cells;
}

export function packVoltageFromCells(voltages, voltagesExt) {
    return voltages.filter(value => value !== CELL_VOLTAGE_UNUSED).reduce((sum, value) => sum + value, 0) +
        voltagesExt.reduce((sum, value) => sum + value, 0);
}

// SYS_STATUS carries the pack voltage as uint16 mV, which wraps above 65.535 V; the cell sum says how often.
export function unwrapVoltageMv(voltageMv, packEstimateMv) {
    const wraps = Math.max(0, Math.round((packEstimateMv - voltageMv) / UINT16_RANGE));
    return voltageMv + wraps * UINT16_RANGE;
}

function measured(value) {
    return value === NOT_MEASURED ? 0 : value;
}

// Same FC fields and units as MSPHelper's handlers, so tabs cannot tell telemetry from an MSP reply.
export class MavlinkTelemetry {

    constructor(options) {
        this._fc = options.fc;
        this._msp = options.msp || null;
        this._onSensorStatus = options.onSensorStatus || null;
        this._onCommandAck = options.onCommandAck || null;
        this._now = options.now || (() => Date.now());
        this.lastSeen = new Map();
        this.rcChannelsTruncated = false;
        this._packEstimateMv = null;
        this._handlers = new Map([
            [MAVLINK_MSG_ID.ATTITUDE, payload => this._applyAttitude(decodeAttitude(payload))],
            [MAVLINK_MSG_ID.SYS_STATUS, payload => this._applySysStatus(decodeSysStatus(payload))],
            [MAVLINK_MSG_ID.GPS_RAW_INT, payload => this._applyGpsRawInt(decodeGpsRawInt(payload))],
            [MAVLINK_MSG_ID.VFR_HUD, payload => this._applyVfrHud(decodeVfrHud(payload))],
            [MAVLINK_MSG_ID.RC_CHANNELS, payload => this._applyRcChannels(decodeRcChannels(payload))],
            [MAVLINK_MSG_ID.BATTERY_STATUS, payload => this._applyBatteryStatus(decodeBatteryStatus(payload))],
            [MAVLINK_MSG_ID.HEARTBEAT, null],
            [MAVLINK_MSG_ID.EXTENDED_SYS_STATE, null],
            [MAVLINK_MSG_ID.STATUSTEXT, null],
            [MAVLINK_MSG_ID.COMMAND_ACK, payload => this._handleCommandAck(decodeCommandAck(payload))],
        ]);
    }

    // Trusts the caller to pass only frames from the locked FC.
    handleFrame(frame) {
        if (!this._handlers.has(frame.msgid)) {
            return false;
        }
        this.lastSeen.set(frame.msgid, this._now());
        const handler = this._handlers.get(frame.msgid);
        if (handler) {
            handler(frame.payload);
        }
        return true;
    }

    seenWithin(msgid, windowMs) {
        const seenAt = this.lastSeen.get(msgid);
        return seenAt !== undefined && this._now() - seenAt <= windowMs;
    }

    _applyAttitude(attitude) {
        const kinematics = this._fc.SENSOR_DATA.kinematics;
        kinematics[0] = withoutNegativeZero(radiansToDecidegrees(attitude.roll) / 10);
        // The firmware sends -pitch; MSP carries the FC's own sign.
        kinematics[1] = withoutNegativeZero(-radiansToDecidegrees(attitude.pitch) / 10);
        // MSP sends yaw as whole degrees 0..359, MAVLink as radians wrapped to -pi..pi.
        const yawDecidegrees = (radiansToDecidegrees(attitude.yaw) + 3600) % 3600;
        kinematics[2] = Math.floor(yawDecidegrees / 10);
    }

    _applySysStatus(status) {
        const sensorStatus = this._fc.SENSOR_STATUS;
        let healthy = 1;
        for (const [field, bit] of SENSOR_STATUS_BITS) {
            const value = sensorStatusFromBits(status.present, status.enabled, status.health, bit);
            sensorStatus[field] = value;
            if (value === HW_SENSOR_UNAVAILABLE || value === HW_SENSOR_UNHEALTHY) {
                healthy = 0;
            }
        }
        sensorStatus.isHardwareHealthy = healthy;
        if (this._onSensorStatus) {
            this._onSensorStatus(sensorStatus);
        }

        const analog = this._fc.ANALOG;
        const amperageCa = measured(status.currentCa);
        analog.amperage = amperageCa / 100;
        // Until BATTERY_STATUS tells whether the uint16 voltage wrapped, voltage and power keep their MSP value.
        if (this._packEstimateMv === null) {
            return;
        }
        const voltageMv = unwrapVoltageMv(status.voltageMv, this._packEstimateMv);
        analog.voltage = voltageMv / 1000;
        // power is not on MAVLink; battery.c computes it from the same two values in cW.
        analog.power = Math.trunc(amperageCa * (voltageMv / 10) / 100) / 100;
    }

    _applyGpsRawInt(gps) {
        const gpsData = this._fc.GPS_DATA;
        // MAVLink GPS_FIX_TYPE is gpsFixType_e + 1.
        gpsData.fix = Math.max(0, gps.fixType - 1);
        gpsData.numSat = gps.satellites;
        gpsData.lat = gps.lat;
        gpsData.lon = gps.lon;
        gpsData.alt = toInt16(Math.trunc(gps.altMm / 10 / 100));
        gpsData.speed = gps.vel;
        gpsData.ground_course = Math.round(gps.cog / 10);
        gpsData.eph = gps.eph;
    }

    _applyVfrHud(hud) {
        const sensorData = this._fc.SENSOR_DATA;
        sensorData.altitude = Number.parseFloat((Math.round(hud.alt * 100) / 100.0).toFixed(2));
    }

    _applyRcChannels(rc) {
        // MSP_RC carries every channel; with more than MAVLink's 18 the wire reply stays authoritative.
        this.rcChannelsTruncated = rc.chancount > RC_CHANNELS_MAX;
        if (!this.rcChannelsTruncated) {
            this._fc.RC.active_channels = rc.chancount;
            for (let i = 0; i < rc.chancount; i++) {
                this._fc.RC.channels[i] = rc.channels[i];
            }
        }
        if (rc.rssi !== RSSI_UNKNOWN) {
            this._fc.ANALOG.rssi = Math.round(rc.rssi * RSSI_MSP_MAX / RSSI_MAVLINK_MAX);
        }
    }

    _applyBatteryStatus(battery) {
        const analog = this._fc.ANALOG;
        analog.cell_count = cellCountFromVoltages(battery.voltages, battery.voltagesExt);
        this._packEstimateMv = packVoltageFromCells(battery.voltages, battery.voltagesExt);
        analog.mAhdrawn = measured(battery.currentConsumed);
        analog.battery_percentage = Math.max(0, battery.batteryRemaining);
        // Voltage, current and power come from SYS_STATUS: BATTERY_STATUS alone must not mark them fresh.
        if (this._msp && this.seenWithin(MAVLINK_MSG_ID.SYS_STATUS, MIN_FRESH_WINDOW_MS)) {
            this._msp.analog_last_received_timestamp = this._now();
        }
    }

    _handleCommandAck(ack) {
        if (this._onCommandAck) {
            this._onCommandAck(ack);
        }
    }
}

export default MavlinkTelemetry;
