#!/usr/bin/env node
/**
 * MAVLink telemetry -> FC state. The frames were packed with the firmware's own MAVLink library
 * using the formulas of mavlink_streams.c (maintenance-10.x); every expected value is what
 * fc_msp.c would send for the equivalent MSP request, as MSPHelper stores it.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MavlinkParser } from '../js/mavlink/mavlinkParser.js';
import { MAVLINK_MSG_ID } from '../js/mavlink/mavlinkProtocol.js';
import { MavlinkTelemetry, cellCountFromVoltages, MIN_FRESH_WINDOW_MS } from '../js/mavlink/mavlinkTelemetry.js';

const GOLDEN = {
    attitude_a: 'fd1000000001011e0000e8030000e5d35bbe25be4bbfe8f1c7bfdfd4',
    attitude_b: 'fd1000000101011e0000e8030000db0f4940db0fc93f00d0e4ba2025',
    attitude_c: 'fd1000000201011e0000e80300000000000000000000db0f4940492a',
    attitude_d: 'fd0c00000301011e0000e8030000db0f49c035fa0ebc8113',
    sys_status_mixed: 'fd1f00000401010100002b0001012f01010123000101e600aa41d20400000000000000000000000057042f',
    sys_status_healthy: 'fd1f00000501010100001f0001011f0001011f0001014600d430ddff0000000000000000000000003757e5',
    sys_status_no_current: 'fd1f0000060101010000420001014300010102000101e8030000ffff000000000000000000000000644c57',
    gps_3d: 'fd32000007010118000015cd5b07000000004c52401c44f4170534740700b4009600d2040e6a030e00000000ffffffffffffffffffffffffffffffffd263',
    gps_nofix_negalt: 'fd32000008010118000015cd5b0700000000bfc9e9ebfeb5e0a5cccfffff0f27960000000000010300000000ffffffffffffffffffffffffffffffff1155',
    hud_a: 'fd1300000901014a0000c0ca7341a470454178e9f642ea2611bf7b002ad056',
    hud_b: 'fd1300000a01014a000085eb4541a4704541894120c08fc2f53c7b002a5fbb',
    hud_c: 'fd1300000b01014a000000000000a470454100000000000000007b002a1140',
    rc_16: 'fd2a00000c010141000088130000eb031d044f048104b304e504170549057b05ad05df05110643067506a706d9060000000010b1e252',
    rc_8_full: 'fd2a00000d010141000088130000eb031d044f048104b304e50417054905000000000000000000000000000000000000000008fe54a3',
    rc_24: 'fd2900000e010141000088130000eb031d044f048104b304e504170549057b05ad05df05110643067506a706d9060b073d0718e4d9',
    battery_4s: 'fd2400000f010193000037020000b4e30400ff7f6810681068106810ffffffffffffffffffffffffd204000000570893',
    battery_12s: 'fd2d0000100101930000b004000040771b00ff7f6810681068106810681068106810681068106810d00700000040000000000068106810204f',
    battery_absent: 'fd1e00001101019300000000000000000000ff7ff401ffffffffffffffffffffffffffffffffffff3809',
    battery_no_vbat_no_current: 'fd240000120101930000ffffffffffffffffff7f0000ffffffffffffffffffffffffffffffffffffffff000000ff0706',
    ack_accepted: 'fd0a00000901014d0000ff01000000000000fd1991a7',
    sys_status_16s: 'fd1f000007010101000003000101030001010300010178008006d0070000000000000000000000005a376a',
    battery_16s_as_12: 'fd2d000012010193000020030000a0f10400ff7fe015e015e015e015e015e015e015e015e015e015d0070000005a0000000000e015e015224e',
};

function frameOf(name) {
    const bytes = Uint8Array.from(GOLDEN[name].match(/../g).map(hex => parseInt(hex, 16)));
    const frames = new MavlinkParser().ingest(bytes);
    assert.equal(frames.length, 1, name + ' must parse as one frame');
    return frames[0];
}

function makeFc() {
    return {
        CONFIG: { cpuload: 17 },
        SENSOR_DATA: { kinematics: [0, 0, 0], altitude: 0, barometer: 7.5, air_speed: 321 },
        SENSOR_STATUS: {},
        GPS_DATA: { fix: 0, numSat: 0, lat: 0, lon: 0, alt: 0, speed: 0, ground_course: 0, hdop: 123, eph: 0 },
        ANALOG: { voltage: 11.1, amperage: 0, power: 0, mAhdrawn: 0, mWhdrawn: 4321, rssi: 0, cell_count: 0,
            battery_percentage: 0, battery_state: 2, battery_remaining_capacity: 1500, use_capacity_thresholds: true,
            battery_full_when_plugged_in: true },
        RC: { active_channels: 0, channels: new Array(32).fill(0) },
    };
}

function makeTelemetry(extra = {}) {
    const fc = makeFc();
    const msp = { analog_last_received_timestamp: null };
    let now = 1000;
    const telemetry = new MavlinkTelemetry(Object.assign({ fc, msp, now: () => now }, extra));
    return { fc, msp, telemetry, setNow: value => { now = value; } };
}

test('ATTITUDE: roll/pitch in MSP decidegree steps, pitch sign restored, yaw wrapped to 0..359', () => {
    const { fc, telemetry } = makeTelemetry();
    const cases = [
        ['attitude_a', [-12.3, 45.6, 270]],
        ['attitude_b', [180, -90, 359]],
        ['attitude_c', [0, 0, 180]],
        ['attitude_d', [-180, 0.5, 0]],
    ];
    for (const [name, expected] of cases) {
        telemetry.handleFrame(frameOf(name));
        assert.deepEqual(fc.SENSOR_DATA.kinematics, expected, name);
    }
    assert.ok(!Object.is(fc.SENSOR_DATA.kinematics[1], -0), 'no negative zero');
});

test('SYS_STATUS: sensor tri-state, hardware health, voltage/current/power; cpu load left to MSP2_INAV_STATUS', () => {
    const icons = [];
    const { fc, telemetry } = makeTelemetry({ onSensorStatus: status => icons.push(Object.assign({}, status)) });
    telemetry.handleFrame(frameOf('battery_4s'));
    const fields = ['isHardwareHealthy', 'gyroHwStatus', 'accHwStatus', 'magHwStatus', 'baroHwStatus', 'gpsHwStatus',
        'rangeHwStatus', 'speedHwStatus', 'flowHwStatus'];
    const cases = [
        ['sys_status_mixed', [0, 1, 1, 2, 3, 1, 2, 0, 0], { voltage: 16.81, amperage: 12.34, power: 207.43 }],
        ['sys_status_healthy', [1, 1, 1, 1, 1, 0, 0, 1, 0], { voltage: 12.5, amperage: -0.35, power: -4.37 }],
        ['sys_status_no_current', [0, 2, 1, 0, 0, 0, 0, 0, 3], { voltage: 0, amperage: 0, power: 0 }],
    ];
    for (const [name, sensors, analog] of cases) {
        telemetry.handleFrame(frameOf(name));
        assert.deepEqual(fields.map(field => fc.SENSOR_STATUS[field]), sensors, name + ' sensors');
        assert.equal(fc.ANALOG.voltage, analog.voltage, name + ' voltage');
        assert.equal(fc.ANALOG.amperage, analog.amperage, name + ' amperage');
        assert.equal(fc.ANALOG.power, analog.power, name + ' power');
    }
    assert.equal(fc.CONFIG.cpuload, 17, 'SYS_STATUS clamps load at 100 %; STATUS stays the only writer');
    assert.equal(icons.length, 3, 'sensor icons refreshed per SYS_STATUS, like the MSP_SENSOR_STATUS handler');
});

test('SYS_STATUS voltage: kept at the MSP value until BATTERY_STATUS arrived, uint16 wrap undone for a 16S pack', () => {
    const { fc, telemetry } = makeTelemetry();
    telemetry.handleFrame(frameOf('sys_status_16s'));
    assert.equal(fc.ANALOG.voltage, 11.1, 'no BATTERY_STATUS yet');
    assert.equal(fc.ANALOG.amperage, 20);

    // bat_cells stops at 12, so the FC reports a 16S pack (67.20 V) as 12 cells of 5.60 V.
    telemetry.handleFrame(frameOf('battery_16s_as_12'));
    assert.equal(fc.ANALOG.cell_count, 12);
    telemetry.handleFrame(frameOf('sys_status_16s'));
    assert.equal(fc.ANALOG.voltage, 67.2, 'voltage_battery is 1664 mV on the wire');
    assert.equal(fc.ANALOG.power, 1344);
});

test('GPS_RAW_INT: MSP_RAW_GPS fields, fix enum shifted, altitude truncated to metres, hdop untouched', () => {
    const { fc, telemetry } = makeTelemetry();
    telemetry.handleFrame(frameOf('gps_3d'));
    assert.deepEqual(fc.GPS_DATA, { fix: 2, numSat: 14, lat: 473977420, lon: 85455940, alt: 488, speed: 1234,
        ground_course: 2715, hdop: 123, eph: 180 });
    telemetry.handleFrame(frameOf('gps_nofix_negalt'));
    assert.deepEqual(fc.GPS_DATA, { fix: 0, numSat: 3, lat: -337000001, lon: -1512000002, alt: -12, speed: 0,
        ground_course: 0, hdop: 123, eph: 9999 });
});

test('VFR_HUD: altitude like MSP_ALTITUDE; barometer and air speed stay with MSP', () => {
    const { fc, telemetry } = makeTelemetry();
    const cases = [['hud_a', 123.46], ['hud_b', -2.5], ['hud_c', 0]];
    for (const [name, altitude] of cases) {
        telemetry.handleFrame(frameOf(name));
        assert.equal(fc.SENSOR_DATA.altitude, altitude, name + ' altitude');
    }
    assert.equal(fc.SENSOR_DATA.barometer, 7.5);
    assert.equal(fc.SENSOR_DATA.air_speed, 321);
});

test('RC_CHANNELS: channels and count like MSP_RC, rssi rescaled 0..254 -> 0..1023', () => {
    const { fc, telemetry } = makeTelemetry();
    telemetry.handleFrame(frameOf('rc_16'));
    assert.equal(fc.RC.active_channels, 16);
    assert.equal(fc.RC.channels[0], 1003);
    assert.equal(fc.RC.channels[15], 1753);
    assert.equal(fc.RC.channels[16], 0);
    // scaleRange() floors to 177 of 254; the way back lands within 4 of the FC's 716.
    assert.equal(fc.ANALOG.rssi, 713);

    telemetry.handleFrame(frameOf('rc_8_full'));
    assert.equal(fc.RC.active_channels, 8);
    assert.equal(fc.RC.channels[7], 1353);
    assert.equal(fc.ANALOG.rssi, 1023);
    assert.equal(telemetry.rcChannelsTruncated, false);
});

test('RC_CHANNELS: more than 18 channels leaves MSP_RC state alone', () => {
    const { fc, telemetry } = makeTelemetry();
    telemetry.handleFrame(frameOf('rc_8_full'));
    telemetry.handleFrame(frameOf('rc_24'));
    assert.equal(telemetry.rcChannelsTruncated, true);
    assert.equal(fc.RC.active_channels, 8);
    assert.equal(fc.RC.channels[8], 0);
    assert.equal(fc.ANALOG.rssi, 0);
});

test('BATTERY_STATUS: cell count from cell voltages, mAh, percentage, analog timestamp; mWh stays with MSP', () => {
    const { fc, msp, telemetry, setNow } = makeTelemetry();
    const cases = [
        ['battery_4s', { cell_count: 4, mAhdrawn: 567, battery_percentage: 87 }],
        ['battery_12s', { cell_count: 12, mAhdrawn: 1200, battery_percentage: 64 }],
        ['battery_absent', { cell_count: 0, mAhdrawn: 0, battery_percentage: 0 }],
        ['battery_no_vbat_no_current', { cell_count: 0, mAhdrawn: 0, battery_percentage: 0 }],
    ];
    setNow(5000);
    telemetry.handleFrame(frameOf('sys_status_healthy'));
    for (const [name, expected] of cases) {
        setNow(5000);
        telemetry.handleFrame(frameOf(name));
        for (const [field, value] of Object.entries(expected)) {
            assert.equal(fc.ANALOG[field], value, name + ' ' + field);
        }
        assert.equal(msp.analog_last_received_timestamp, 5000);
        msp.analog_last_received_timestamp = null;
    }
    // Not on MAVLink (or, for energy_consumed, not in a trustworthy unit): kept at the last MSP value.
    assert.equal(fc.ANALOG.mWhdrawn, 4321);
    assert.equal(fc.ANALOG.battery_state, 2);
    assert.equal(fc.ANALOG.battery_remaining_capacity, 1500);
    assert.equal(fc.ANALOG.use_capacity_thresholds, true);
    assert.equal(fc.ANALOG.battery_full_when_plugged_in, true);
});

test('analog timestamp: BATTERY_STATUS refreshes it only while SYS_STATUS streams too', () => {
    const { msp, telemetry, setNow } = makeTelemetry();
    setNow(1000);
    telemetry.handleFrame(frameOf('battery_4s'));
    assert.equal(msp.analog_last_received_timestamp, null, 'no SYS_STATUS yet');

    telemetry.handleFrame(frameOf('sys_status_healthy'));
    telemetry.handleFrame(frameOf('battery_4s'));
    assert.equal(msp.analog_last_received_timestamp, 1000);

    // SYS_STATUS stops, BATTERY_STATUS keeps streaming at 1 Hz.
    setNow(1000 + MIN_FRESH_WINDOW_MS);
    telemetry.handleFrame(frameOf('battery_4s'));
    assert.equal(msp.analog_last_received_timestamp, 1000 + MIN_FRESH_WINDOW_MS, 'still inside the window');
    for (let now = 2000 + MIN_FRESH_WINDOW_MS; now <= 10000; now += 1000) {
        setNow(now);
        telemetry.handleFrame(frameOf('battery_4s'));
    }
    assert.equal(msp.analog_last_received_timestamp, 1000 + MIN_FRESH_WINDOW_MS, 'stale SYS_STATUS: voltage and current are stale');

    setNow(10500);
    telemetry.handleFrame(frameOf('sys_status_healthy'));
    setNow(11000);
    telemetry.handleFrame(frameOf('battery_4s'));
    assert.equal(msp.analog_last_received_timestamp, 11000);
});

test('cell count: one entry above the battery-present threshold reads as one cell', () => {
    const unused = new Array(9).fill(0xFFFF);
    assert.equal(cellCountFromVoltages([2200, ...unused], [0, 0, 0, 0]), 0);
    assert.equal(cellCountFromVoltages([3700, ...unused], [0, 0, 0, 0]), 1);
});

test('lastSeen per message; record-only messages and COMMAND_ACK', () => {
    const acks = [];
    const { telemetry, setNow } = makeTelemetry({ onCommandAck: ack => acks.push(ack) });
    setNow(2000);
    telemetry.handleFrame(frameOf('ack_accepted'));
    assert.deepEqual(acks, [{ command: 511, result: 0, targetSystem: 253, targetComponent: 25 }]);
    assert.equal(telemetry.lastSeen.get(MAVLINK_MSG_ID.COMMAND_ACK), 2000);

    telemetry.handleFrame(frameOf('attitude_a'));
    assert.equal(telemetry.seenWithin(MAVLINK_MSG_ID.ATTITUDE, 3000), true);
    setNow(5001);
    assert.equal(telemetry.seenWithin(MAVLINK_MSG_ID.ATTITUDE, 3000), false);
    assert.equal(telemetry.seenWithin(MAVLINK_MSG_ID.VFR_HUD, 3000), false);

    assert.equal(telemetry.handleFrame({ msgid: MAVLINK_MSG_ID.TUNNEL, payload: new Uint8Array(133) }), false);
});
