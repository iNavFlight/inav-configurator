'use strict';

const semver = require('semver');

require('./../injected_methods');
const { GUI } = require('./../gui');
const MSP = require('./../msp');
const MSPCodes = require('./MSPCodes');
const FC = require('./../fc');
const VTX = require('./../vtx');
const mspQueue = require('./../serial_queue');
const ServoMixRule = require('./../servoMixRule');
const MotorMixRule = require('./../motorMixRule');
const LogicCondition = require('./../logicCondition');
const BitHelper = require('../bitHelper');
const serialPortHelper = require('./../serialPortHelper');
const ProgrammingPid = require('./../programmingPid');
const Safehome = require('./../safehome');
const { FwApproach } = require('./../fwApproach');
const Waypoint = require('./../waypoint');
const mspDeduplicationQueue = require('./mspDeduplicationQueue');
const mspStatistics = require('./mspStatistics');
const settingsCache = require('./../settingsCache');
const {Geozone, GeozoneVertex, GeozoneShapes } = require('./../geozone');

var mspHelper = (function () {
    var self = {};

    self.sensorStatusEx = null;

    self.setSensorStatusEx = function (cb)  {
        self.sensorStatusEx = cb;
    }

    self.BAUD_RATES_post1_6_3 = [
        'AUTO',
        '1200',
        '2400',
        '4800',
        '9600',
        '19200',
        '38400',
        '57600',
        '115200',
        '230400',
        '250000',
        '460800',
        '921600'
    ];

    // Required for MSP_DEBUGMSG because console.log() doesn't allow omitting
    // the newline at the end, so we keep the pending message here until we find a
    // '\0', then print it. Messages sent by MSP_DEBUGMSG are guaranteed to
    // always finish with a '\0'.
    var debugMsgBuffer = '';

    self.init = function() {
        MSP.setProcessData(this.processData);
    }

    /**
     *
     * @param {MSP} dataHandler
     */
    self.processData = function (dataHandler) {
        var data = new DataView(dataHandler.message_buffer, 0), // DataView (allowing us to view arrayBuffer as struct/union)
            offset = 0,
            needle = 0,
            i = 0,
            buff = [],
            identifier = '',
            flags,
            colorCount,
            color;
        if (!dataHandler.unsupported || dataHandler.unsupported) switch (dataHandler.code) {
            case MSPCodes.MSPV2_INAV_STATUS:
                let profile_changed = 0;
                FC.CONFIG.cycleTime = data.getUint16(offset, true);
                offset += 2;
                FC.CONFIG.i2cError = data.getUint16(offset, true);
                offset += 2;
                FC.CONFIG.activeSensors = data.getUint16(offset, true);
                offset += 2;
                FC.CONFIG.cpuload = data.getUint16(offset, true);
                offset += 2;

                let profile_byte = data.getUint8(offset++)
                let profile = profile_byte & 0x0F;
                if (profile !== FC.CONFIG.profile) {
                    profile_changed |= GUI.PROFILES_CHANGED.CONTROL;
                }
                FC.CONFIG.profile = profile;

                let battery_profile = (profile_byte & 0xF0) >> 4;
                if (battery_profile !== FC.CONFIG.battery_profile) {
                    profile_changed |= GUI.PROFILES_CHANGED.BATTERY;
                }
                FC.CONFIG.battery_profile = battery_profile;

                FC.CONFIG.armingFlags = data.getUint32(offset, true);
                offset += 4;

                //As there are 8 bytes for mspBoxModeFlags (number of bytes is actually variable)
                //read mixer profile as the last byte in the the message
                profile_byte = data.getUint8(dataHandler.message_length_expected - 1);
                let mixer_profile = profile_byte & 0x0F;
                if (mixer_profile !== FC.CONFIG.mixer_profile) {
                    profile_changed |= GUI.PROFILES_CHANGED.MIXER;
                }
                FC.CONFIG.mixer_profile = mixer_profile;
                GUI.updateStatusBar();
                if (profile_changed > 0) {
                    GUI.updateProfileChange(profile_changed);
                }
                break;

            case MSPCodes.MSP_ACTIVEBOXES:
                var words = dataHandler.message_length_expected / 4;

                FC.CONFIG.mode = [];
                for (let i = 0; i < words; ++i)
                    FC.CONFIG.mode.push(data.getUint32(i * 4, true));
                break;

            case MSPCodes.MSP_SENSOR_STATUS:
                FC.SENSOR_STATUS.isHardwareHealthy = data.getUint8(0);
                FC.SENSOR_STATUS.gyroHwStatus = data.getUint8(1);
                FC.SENSOR_STATUS.accHwStatus = data.getUint8(2);
                FC.SENSOR_STATUS.magHwStatus = data.getUint8(3);
                FC.SENSOR_STATUS.baroHwStatus = data.getUint8(4);
                FC.SENSOR_STATUS.gpsHwStatus = data.getUint8(5);
                FC.SENSOR_STATUS.rangeHwStatus = data.getUint8(6);
                FC.SENSOR_STATUS.speedHwStatus = data.getUint8(7);
                FC.SENSOR_STATUS.flowHwStatus = data.getUint8(8);
                self.sensorStatusEx(FC.SENSOR_STATUS);
                break;

            case MSPCodes.MSP_RAW_IMU:
                // 512 for mpu6050, 256 for mma
                // currently we are unable to differentiate between the sensor types, so we are goign with 512
                FC.SENSOR_DATA.accelerometer[0] = data.getInt16(0, true) / 512;
                FC.SENSOR_DATA.accelerometer[1] = data.getInt16(2, true) / 512;
                FC.SENSOR_DATA.accelerometer[2] = data.getInt16(4, true) / 512;

                // properly scaled
                FC.SENSOR_DATA.gyroscope[0] = data.getInt16(6, true) * (4 / 16.4);
                FC.SENSOR_DATA.gyroscope[1] = data.getInt16(8, true) * (4 / 16.4);
                FC.SENSOR_DATA.gyroscope[2] = data.getInt16(10, true) * (4 / 16.4);

                // no clue about scaling factor
                FC.SENSOR_DATA.magnetometer[0] = data.getInt16(12, true) / 1090;
                FC.SENSOR_DATA.magnetometer[1] = data.getInt16(14, true) / 1090;
                FC.SENSOR_DATA.magnetometer[2] = data.getInt16(16, true) / 1090;
                break;
            case MSPCodes.MSP_SERVO:
                var servoCount = dataHandler.message_length_expected / 2;
                for (let i = 0; i < servoCount; i++) {
                    FC.SERVO_DATA[i] = data.getUint16(needle, true);

                    needle += 2;
                }
                break;
            case MSPCodes.MSP_MOTOR:
                var motorCount = dataHandler.message_length_expected / 2;
                for (let i = 0; i < motorCount; i++) {
                    FC.MOTOR_DATA[i] = data.getUint16(needle, true);

                    needle += 2;
                }
                break;
            case MSPCodes.MSP_RC:
                FC.RC.active_channels = dataHandler.message_length_expected / 2;

                for (let i = 0; i < FC.RC.active_channels; i++) {
                    FC.RC.channels[i] = data.getUint16((i * 2), true);
                }
                break;
            case MSPCodes.MSP_RAW_GPS:
                FC.GPS_DATA.fix = data.getUint8(0);
                FC.GPS_DATA.numSat = data.getUint8(1);
                FC.GPS_DATA.lat = data.getInt32(2, true);
                FC.GPS_DATA.lon = data.getInt32(6, true);
                FC.GPS_DATA.alt = data.getInt16(10, true);
                FC.GPS_DATA.speed = data.getUint16(12, true);
                FC.GPS_DATA.ground_course = data.getUint16(14, true);
                FC.GPS_DATA.hdop = data.getUint16(16, true);
                break;
            case MSPCodes.MSP_COMP_GPS:
                FC.GPS_DATA.distanceToHome = data.getUint16(0, 1);
                FC.GPS_DATA.directionToHome = data.getUint16(2, 1);
                FC.GPS_DATA.update = data.getUint8(4);
                break;
            case MSPCodes.MSP_GPSSTATISTICS:
                FC.GPS_DATA.messageDt = data.getUint16(0, true);
                FC.GPS_DATA.errors = data.getUint32(2, true);
                FC.GPS_DATA.timeouts = data.getUint32(6, true);
                FC.GPS_DATA.packetCount = data.getUint32(10, true);
                FC.GPS_DATA.hdop = data.getUint16(14, true);
                FC.GPS_DATA.eph = data.getUint16(16, true);
                FC.GPS_DATA.epv = data.getUint16(18, true);
                break;
            case MSPCodes.MSP2_ADSB_VEHICLE_LIST:
                var byteOffsetCounter = 0;
                FC.ADSB_VEHICLES.vehicles = [];
                FC.ADSB_VEHICLES.vehiclesCount = data.getUint8(byteOffsetCounter++);
                FC.ADSB_VEHICLES.callsignLength = data.getUint8(byteOffsetCounter++);
                FC.ADSB_VEHICLES.vehiclePacketCount = data.getUint32(byteOffsetCounter, true); byteOffsetCounter += 4;
                FC.ADSB_VEHICLES.heartbeatPacketCount = data.getUint32(byteOffsetCounter, true); byteOffsetCounter += 4;

                for(i = 0; i < FC.ADSB_VEHICLES.vehiclesCount; i++){

                    var vehicle = {callSignByteArray: [], callsign: "", icao: 0, lat: 0, lon: 0, alt: 0, heading: 0, ttl: 0, tslc: 0, emitterType: 0};

                    for(ii = 0; ii < FC.ADSB_VEHICLES.callsignLength; ii++){
                        vehicle.callSignByteArray.push(data.getUint8(byteOffsetCounter++));
                    }

                    vehicle.callsign = (String.fromCharCode(...vehicle.callSignByteArray)).replace(/[^\x20-\x7E]/g, '');
                    vehicle.icao = data.getUint32(byteOffsetCounter, true); byteOffsetCounter += 4;
                    vehicle.lat = data.getInt32(byteOffsetCounter, true); byteOffsetCounter += 4;
                    vehicle.lon = data.getInt32(byteOffsetCounter, true); byteOffsetCounter += 4;
                    vehicle.altCM = data.getInt32(byteOffsetCounter, true); byteOffsetCounter += 4;
                    vehicle.headingDegrees = data.getUint16(byteOffsetCounter, true); byteOffsetCounter += 2;
                    vehicle.tslc = data.getUint8(byteOffsetCounter++);
                    vehicle.emitterType = data.getUint8(byteOffsetCounter++);
                    vehicle.ttl = data.getUint8(byteOffsetCounter++);

                    FC.ADSB_VEHICLES.vehicles.push(vehicle);
                }
                break;
                
            case MSPCodes.MSP_ATTITUDE:
                FC.SENSOR_DATA.kinematics[0] = data.getInt16(0, true) / 10.0; // x
                FC.SENSOR_DATA.kinematics[1] = data.getInt16(2, true) / 10.0; // y
                FC.SENSOR_DATA.kinematics[2] = data.getInt16(4, true); // z
                break;
            case MSPCodes.MSP_ALTITUDE:
                FC.SENSOR_DATA.altitude = parseFloat((data.getInt32(0, true) / 100.0).toFixed(2)); // correct scale factor
                FC.SENSOR_DATA.barometer = parseFloat((data.getInt32(6, true) / 100.0).toFixed(2)); // correct scale factor
                break;
            case MSPCodes.MSP_SONAR:
                FC.SENSOR_DATA.sonar = data.getInt32(0, true);
                break;
            case MSPCodes.MSPV2_INAV_AIR_SPEED:
                FC.SENSOR_DATA.air_speed = data.getInt32(0, true);
                break;
            case MSPCodes.MSPV2_INAV_ANALOG:
                let tmp = data.getUint8(offset++);
                FC.ANALOG.battery_full_when_plugged_in = (tmp & 1 ? true : false);
                FC.ANALOG.use_capacity_thresholds = ((tmp & 2) >> 1 ? true : false);
                FC.ANALOG.battery_state = (tmp & 12) >> 2;
                FC.ANALOG.cell_count = (tmp & 0xF0) >> 4;
                FC.ANALOG.voltage = data.getUint16(offset, true) / 100.0;
                offset += 2;
                FC.ANALOG.amperage = data.getInt16(offset, true) / 100; // A
                offset += 2;
                FC.ANALOG.power = data.getInt32(offset, true) / 100.0;
                offset += 4;
                FC.ANALOG.mAhdrawn = data.getInt32(offset, true);
                offset += 4;
                FC.ANALOG.mWhdrawn = data.getInt32(offset, true);
                offset += 4;
                FC.ANALOG.battery_remaining_capacity = data.getUint32(offset, true);
                offset += 4;
                FC.ANALOG.battery_percentage = data.getUint8(offset++);
                FC.ANALOG.rssi = data.getUint16(offset, true); // 0-1023
                offset += 2;
                //noinspection JSValidateTypes
                dataHandler.analog_last_received_timestamp = Date.now();
                break;
            case MSPCodes.MSP_RC_TUNING:
                FC.RC_tuning.RC_RATE = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                FC.RC_tuning.RC_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                FC.RC_tuning.roll_pitch_rate = 0;
                FC.RC_tuning.roll_rate = parseFloat((data.getUint8(offset++) * 10));
                FC.RC_tuning.pitch_rate = parseFloat((data.getUint8(offset++) * 10));
                FC.RC_tuning.yaw_rate = parseFloat((data.getUint8(offset++) * 10));

                FC.RC_tuning.dynamic_THR_PID = parseInt(data.getUint8(offset++));
                FC.RC_tuning.throttle_MID = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                FC.RC_tuning.throttle_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                FC.RC_tuning.dynamic_THR_breakpoint = data.getUint16(offset, true);
                offset += 2;
                FC.RC_tuning.RC_YAW_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                break;
            case MSPCodes.MSPV2_INAV_RATE_PROFILE:
                // compat
                FC.RC_tuning.RC_RATE = 100;
                FC.RC_tuning.roll_pitch_rate = 0;

                // throttle
                FC.RC_tuning.throttle_MID = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                FC.RC_tuning.throttle_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                FC.RC_tuning.dynamic_THR_PID = parseInt(data.getUint8(offset++));
                FC.RC_tuning.dynamic_THR_breakpoint = data.getUint16(offset, true);
                offset += 2;

                // stabilized
                FC.RC_tuning.RC_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                FC.RC_tuning.RC_YAW_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                FC.RC_tuning.roll_rate = data.getUint8(offset++) * 10;
                FC.RC_tuning.pitch_rate = data.getUint8(offset++) * 10;
                FC.RC_tuning.yaw_rate = data.getUint8(offset++) * 10;

                // manual
                FC.RC_tuning.manual_RC_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                FC.RC_tuning.manual_RC_YAW_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                FC.RC_tuning.manual_roll_rate = data.getUint8(offset++);
                FC.RC_tuning.manual_pitch_rate = data.getUint8(offset++);
                FC.RC_tuning.manual_yaw_rate = data.getUint8(offset++);
                break;
            case MSPCodes.MSP2_PID:
                // PID data arrived, we need to scale it and save to appropriate bank / array
                for (let i = 0, needle = 0; i < (dataHandler.message_length_expected / 4); i++, needle += 4) {
                    FC.PIDs[i][0] = data.getUint8(needle);
                    FC.PIDs[i][1] = data.getUint8(needle + 1);
                    FC.PIDs[i][2] = data.getUint8(needle + 2);
                    FC.PIDs[i][3] = data.getUint8(needle + 3);
                }
                break;
            case MSPCodes.MSP_LOOP_TIME:
                FC.FC_CONFIG.loopTime = data.getInt16(0, true);
                break;
            
            case MSPCodes.MSPV2_INAV_MISC:
                FC.MISC.midrc = data.getInt16(offset, true);
                offset += 2;
                FC.MISC.minthrottle = data.getUint16(offset, true); // 0-2000
                offset += 2;
                FC.MISC.maxthrottle = data.getUint16(offset, true); // 0-2000
                offset += 2;
                FC.MISC.mincommand = data.getUint16(offset, true); // 0-2000
                offset += 2;
                FC.MISC.failsafe_throttle = data.getUint16(offset, true); // 1000-2000
                offset += 2;
                FC.MISC.gps_type = data.getUint8(offset++);
                FC.MISC.sensors_baudrate = data.getUint8(offset++);
                FC.MISC.gps_ubx_sbas = data.getInt8(offset++);
                FC.MISC.rssi_channel = data.getUint8(offset++);
                FC.MISC.mag_declination = data.getInt16(offset, 1) / 10; // -18000-18000
                offset += 2;
                FC.MISC.vbatscale = data.getUint16(offset, true);
                offset += 2;
                FC.MISC.voltage_source = data.getUint8(offset++);
                FC.MISC.battery_cells = data.getUint8(offset++);
                FC.MISC.vbatdetectcellvoltage = data.getUint16(offset, true) / 100;
                offset += 2;
                FC.MISC.vbatmincellvoltage = data.getUint16(offset, true) / 100;
                offset += 2;
                FC.MISC.vbatmaxcellvoltage = data.getUint16(offset, true) / 100;
                offset += 2;
                FC.MISC.vbatwarningcellvoltage = data.getUint16(offset, true) / 100;
                offset += 2;
                FC.MISC.battery_capacity = data.getUint32(offset, true);
                offset += 4;
                FC.MISC.battery_capacity_warning = data.getUint32(offset, true);
                offset += 4;
                FC.MISC.battery_capacity_critical = data.getUint32(offset, true);
                offset += 4;
                FC.MISC.battery_capacity_unit = (data.getUint8(offset++) ? 'mWh' : 'mAh');
                break;
            case MSPCodes.MSPV2_INAV_SET_MISC:
                console.log('MISC INAV Configuration saved');
                break;
            case MSPCodes.MSPV2_INAV_BATTERY_CONFIG:
                FC.BATTERY_CONFIG.vbatscale = data.getUint16(offset, true);
                offset += 2;
                FC.BATTERY_CONFIG.voltage_source = data.getUint8(offset++);
                FC.BATTERY_CONFIG.battery_cells = data.getUint8(offset++);
                FC.BATTERY_CONFIG.vbatdetectcellvoltage = data.getUint16(offset, true) / 100;
                offset += 2;
                FC.BATTERY_CONFIG.vbatmincellvoltage = data.getUint16(offset, true) / 100;
                offset += 2;
                FC.BATTERY_CONFIG.vbatmaxcellvoltage = data.getUint16(offset, true) / 100;
                offset += 2;
                FC.BATTERY_CONFIG.vbatwarningcellvoltage = data.getUint16(offset, true) / 100;
                offset += 2;
                FC.BATTERY_CONFIG.current_offset = data.getUint16(offset, true);
                offset += 2;
                FC.BATTERY_CONFIG.current_scale = data.getUint16(offset, true);
                offset += 2;
                FC.BATTERY_CONFIG.capacity = data.getUint32(offset, true);
                offset += 4;
                FC.BATTERY_CONFIG.capacity_warning = data.getUint32(offset, true);
                offset += 4;
                FC.BATTERY_CONFIG.capacity_critical = data.getUint32(offset, true);
                offset += 4;
                FC.BATTERY_CONFIG.battery_capacity_unit = (data.getUint8(offset++) ? 'mWh' : 'mAh');
                break;
            case MSPCodes.MSP_3D:
                FC.REVERSIBLE_MOTORS.deadband_low = data.getUint16(offset, true);
                offset += 2;
                FC.REVERSIBLE_MOTORS.deadband_high = data.getUint16(offset, true);
                offset += 2;
                FC.REVERSIBLE_MOTORS.neutral = data.getUint16(offset, true);
                break;
            case MSPCodes.MSP_MOTOR_PINS:
                console.log(data);
                break;
            case MSPCodes.MSP_PIDNAMES:
                //noinspection JSUndeclaredVariable
                FC.PID_names = []; // empty the array as new data is coming in

                buff = [];
                for (let i = 0; i < data.byteLength; i++) {
                    if (data.getUint8(i) == 0x3B) { // ; (delimiter char)
                        FC.PID_names.push(String.fromCharCode.apply(null, buff)); // convert bytes into ASCII and save as strings

                        // empty buffer
                        buff = [];
                    } else {
                        buff.push(data.getUint8(i));
                    }
                }
                break;
            case MSPCodes.MSP_WP:
                FC.MISSION_PLANNER.put(new Waypoint(
                    data.getUint8(0),
                    data.getUint8(1),
                    data.getInt32(2, true),
                    data.getInt32(6, true),
                    data.getInt32(10, true),
                    data.getInt16(14, true),
                    data.getInt16(16, true),
                    data.getInt16(18, true),
                    data.getUint8(20)
                ));
                break;
            case MSPCodes.MSP_BOXIDS:
                //noinspection JSUndeclaredVariable
                FC.AUX_CONFIG_IDS = []; // empty the array as new data is coming in

                for (let i = 0; i < data.byteLength; i++) {
                    FC.AUX_CONFIG_IDS.push(data.getUint8(i));
                }
                break;
            case MSPCodes.MSP2_INAV_SERVO_MIXER:
                FC.SERVO_RULES.flush();
                if (data.byteLength % 6 === 0) {
                    for (let i = 0; i < data.byteLength; i += 6) {
                        FC.SERVO_RULES.put(new ServoMixRule(
                            data.getInt8(i),
                            data.getInt8(i + 1),
                            data.getInt16(i + 2, true),
                            data.getInt8(i + 4),
                            data.getInt8(i + 5)
                        ));
                    }
                }
                FC.SERVO_RULES.cleanup();
                break;

            case MSPCodes.MSP2_INAV_SET_SERVO_MIXER:
                console.log("Servo mix saved");
                break;
            case MSPCodes.MSP2_INAV_LOGIC_CONDITIONS:
                FC.LOGIC_CONDITIONS.flush();
                if (data.byteLength % 14 === 0) {
                    for (let i = 0; i < data.byteLength; i += 14) {
                        FC.LOGIC_CONDITIONS.put(new LogicCondition(
                            data.getInt8(i),
                            data.getInt8(i + 1),
                            data.getUint8(i + 2),
                            data.getUint8(i + 3),
                            data.getInt32(i + 4, true),
                            data.getUint8(i + 8),
                            data.getInt32(i + 9, true),
                            data.getInt8(i + 13)
                        ));
                    }
                }
                break;

            case MSPCodes.MSP2_INAV_LOGIC_CONDITIONS_SINGLE:
                FC.LOGIC_CONDITIONS.put(new LogicCondition(
                    data.getInt8(0),
                    data.getInt8(1),
                    data.getUint8(2),
                    data.getUint8(3),
                    data.getInt32(4, true),
                    data.getUint8(8),
                    data.getInt32(9, true),
                    data.getInt8(13)
                ));
                break;

            case MSPCodes.MSP2_INAV_LOGIC_CONDITIONS_STATUS:
                if (data.byteLength % 4 === 0) {
                    let index = 0;
                    for (let i = 0; i < data.byteLength; i += 4) {
                        FC.LOGIC_CONDITIONS_STATUS.set(index, data.getInt32(i, true));
                        index++;
                    }
                }
                break;

            case MSPCodes.MSP2_INAV_GVAR_STATUS:
                if (data.byteLength % 4 === 0) {
                    let index = 0;
                    for (let i = 0; i < data.byteLength; i += 4) {
                        FC.GLOBAL_VARIABLES_STATUS.set(index, data.getInt32(i, true));
                        index++;
                    }
                }
                break;

            case MSPCodes.MSP2_INAV_SET_LOGIC_CONDITIONS:
                console.log("Logic conditions saved");
                break;

            case MSPCodes.MSP2_INAV_PROGRAMMING_PID:
                FC.PROGRAMMING_PID.flush();
                if (data.byteLength % 19 === 0) {
                    for (let i = 0; i < data.byteLength; i += 19) {
                        FC.PROGRAMMING_PID.put(new ProgrammingPid(
                            data.getInt8(i),                // enabled
                            data.getInt8(i + 1),            // setpointType
                            data.getInt32(i + 2, true),     // setpointValue
                            data.getInt8(i + 6),            // measurementType
                            data.getInt32(i + 7, true),     // measurementValue
                            data.getInt16(i + 11, true),    // gainP
                            data.getInt16(i + 13, true),    // gainI
                            data.getInt16(i + 15, true),    // gainD
                            data.getInt16(i + 17, true)     // gainFF
                        ));
                    }
                }
                break;

            case MSPCodes.MSP2_INAV_PROGRAMMING_PID_STATUS:
                if (data.byteLength % 4 === 0) {
                    let index = 0;
                    for (let i = 0; i < data.byteLength; i += 4) {
                        FC.PROGRAMMING_PID_STATUS.set(index, data.getInt32(i, true));
                        index++;
                    }
                }
                break;

            case MSPCodes.MSP2_INAV_SET_PROGRAMMING_PID:
                console.log("Programming PID saved");
                break;

            case MSPCodes.MSP2_COMMON_MOTOR_MIXER:
                FC.MOTOR_RULES.flush();

                if (data.byteLength % 8 === 0) {
                    for (let i = 0; i < data.byteLength; i += 8) {
                        var rule = new MotorMixRule(0, 0, 0, 0);

                        rule.fromMsp(
                            data.getUint16(i, true),
                            data.getUint16(i + 2, true),
                            data.getUint16(i + 4, true),
                            data.getUint16(i + 6, true)
                        );

                        FC.MOTOR_RULES.put(rule);
                    }
                }
                FC.MOTOR_RULES.cleanup();

                break;

            case MSPCodes.MSP2_COMMON_SET_MOTOR_MIXER:
                console.log("motor mixer saved");
                break;

            case MSPCodes.MSP2_INAV_SERVO_CONFIG:
                //noinspection JSUndeclaredVariable
                FC.SERVO_CONFIG = []; // empty the array as new data is coming in

                if (data.byteLength % 7 == 0) {
                    for (i = 0; i < data.byteLength; i += 7) {
                        var arr = {
                            'min': data.getInt16(i + 0, true),
                            'max': data.getInt16(i + 2, true),
                            'middle': data.getInt16(i + 4, true),
                            'rate': data.getInt8(i + 6),
                        };
                        FC.SERVO_CONFIG.push(arr);
                    }
                }
                break;
            case MSPCodes.MSP_RC_DEADBAND:
                FC.RC_deadband.deadband = data.getUint8(offset++);
                FC.RC_deadband.yaw_deadband = data.getUint8(offset++);
                FC.RC_deadband.alt_hold_deadband = data.getUint8(offset++);
                FC.REVERSIBLE_MOTORS.deadband_throttle = data.getUint16(offset, true);
                break;
            case MSPCodes.MSP_SENSOR_ALIGNMENT:
                FC.SENSOR_ALIGNMENT.align_gyro = data.getUint8(offset++);
                FC.SENSOR_ALIGNMENT.align_acc = data.getUint8(offset++);
                FC.SENSOR_ALIGNMENT.align_mag = data.getUint8(offset++);
                FC.SENSOR_ALIGNMENT.align_opflow = data.getUint8(offset++);
                break;
            case MSPCodes.MSP_SET_RAW_RC:
                break;
            case MSPCodes.MSP_SET_RAW_GPS:
                break;
            case MSPCodes.MSP2_SET_PID:
                console.log('PID settings saved');
                break;
            case MSPCodes.MSP_SET_RC_TUNING:
                console.log('RC Tuning saved');
                break;
            case MSPCodes.MSP_ACC_CALIBRATION:
                console.log('Accelerometer calibration executed');
                break;
            case MSPCodes.MSP_MAG_CALIBRATION:
                console.log('Mag calibration executed');
                break;
            case MSPCodes.MSP2_INAV_OPFLOW_CALIBRATION:
                console.log('Optic flow calibration executed');
                break;
            case MSPCodes.MSP_RESET_CONF:
                console.log('Settings Reset');
                break;
            case MSPCodes.MSP_SELECT_SETTING:
                console.log('Profile selected');
                break;
            case MSPCodes.MSP2_INAV_SET_SERVO_CONFIG:
                console.log('Servo Configuration saved');
                break;
            case MSPCodes.MSP_RTC:
                if (data.length >= 6) {
                    var seconds = data.getInt32(0, true);
                    var millis = data.getUint16(4, true);
                    console.log("RTC received: " + new Date(seconds * 1000 + millis));
                }
                break;
            case MSPCodes.MSP_SET_RTC:
                console.log('RTC set');
                break;
            case MSPCodes.MSP_EEPROM_WRITE:
                console.log('Settings Saved in EEPROM');
                break;
            case MSPCodes.MSP_DEBUGMSG:
                for (var ii = 0; ii < data.byteLength; ii++) {
                    var c = data.readU8();
                    if (c == 0) {
                        // End of message
                        if (debugMsgBuffer.length > 1) {
                            console.log('[DEBUG] ' + debugMsgBuffer);
                            FC.DEBUG_TRACE = (FC.DEBUG_TRACE || '') + debugMsgBuffer;
                        }
                        debugMsgBuffer = '';
                        continue;
                    }
                    debugMsgBuffer += String.fromCharCode(c);
                }
                break;
            case MSPCodes.MSP_DEBUG:
                for (let i = 0; i < 4; i++)
                    FC.SENSOR_DATA.debug[i] = data.getInt16((2 * i), 1);
                break;
            case MSPCodes.MSP2_INAV_DEBUG:
                for (let i = 0; i < 8; i++)
                    FC.SENSOR_DATA.debug[i] = data.getInt32((4 * i), 1);
                break;
            case MSPCodes.MSP_SET_MOTOR:
                console.log('Motor Speeds Updated');
                break;
            // Additional baseflight commands that are not compatible with MultiWii
            case MSPCodes.MSP_UID:
                FC.CONFIG.uid[0] = data.getUint32(0, true);
                FC.CONFIG.uid[1] = data.getUint32(4, true);
                FC.CONFIG.uid[2] = data.getUint32(8, true);
                break;
            case MSPCodes.MSP_ACC_TRIM:
                FC.CONFIG.accelerometerTrims[0] = data.getInt16(0, true); // pitch
                FC.CONFIG.accelerometerTrims[1] = data.getInt16(2, true); // roll
                break;
            case MSPCodes.MSP_SET_ACC_TRIM:
                console.log('Accelerometer trimms saved.');
                break;
            // Additional private MSP for baseflight configurator
            case MSPCodes.MSP_RX_MAP:
                //noinspection JSUndeclaredVariable
                FC.RC_MAP = []; // empty the array as new data is coming in

                for (let i = 0; i < data.byteLength; i++) {
                    FC.RC_MAP.push(data.getUint8(i));
                }
                break;
            case MSPCodes.MSP_SET_RX_MAP:
                console.log('RCMAP saved');
                break;

            case MSPCodes.MSP_BOARD_ALIGNMENT:
                FC.BOARD_ALIGNMENT.roll = data.getInt16(0, true); // -180 - 360
                FC.BOARD_ALIGNMENT.pitch = data.getInt16(2, true); // -180 - 360
                FC.BOARD_ALIGNMENT.yaw = data.getInt16(4, true); // -180 - 360
                break;

            case MSPCodes.MSP_SET_BOARD_ALIGNMENT:
                console.log('MSP_SET_BOARD_ALIGNMENT saved');
                break;

            case MSPCodes.MSP_CURRENT_METER_CONFIG:
                FC.CURRENT_METER_CONFIG.scale = data.getInt16(0, true);
                FC.CURRENT_METER_CONFIG.offset = data.getInt16(2, true);
                FC.CURRENT_METER_CONFIG.type = data.getUint8(4);
                FC.CURRENT_METER_CONFIG.capacity = data.getInt16(5, true);
                break;

            case MSPCodes.MSP_SET_CURRENT_METER_CONFIG:
                console.log('MSP_SET_CURRENT_METER_CONFIG saved');
                break;

            case MSPCodes.MSP_FEATURE:
                FC.FEATURES = data.getUint32(0, true);
                break;

            case MSPCodes.MSP_SET_FEATURE:
                console.log('MSP_SET_FEATURE saved');
                break;

            case MSPCodes.MSP_SET_REBOOT:
                console.log('Reboot request accepted');
                break;

            //
            // Cleanflight specific
            //

            case MSPCodes.MSP_API_VERSION:
                FC.CONFIG.mspProtocolVersion = data.getUint8(offset++);
                FC.CONFIG.apiVersion = data.getUint8(offset++) + '.' + data.getUint8(offset++) + '.0';
                break;

            case MSPCodes.MSP_FC_VARIANT:
                for (offset = 0; offset < 4; offset++) {
                    identifier += String.fromCharCode(data.getUint8(offset));
                }
                FC.CONFIG.flightControllerIdentifier = identifier;
                break;

            case MSPCodes.MSP_FC_VERSION:
                FC.CONFIG.flightControllerVersion = data.getUint8(offset++) + '.' + data.getUint8(offset++) + '.' + data.getUint8(offset++);
                break;

            case MSPCodes.MSP_BUILD_INFO:
                var dateLength = 11;

                buff = [];
                for (let i = 0; i < dateLength; i++) {
                    buff.push(data.getUint8(offset++));
                }
                buff.push(32); // ascii space

                var timeLength = 8;
                for (let i = 0; i < timeLength; i++) {
                    buff.push(data.getUint8(offset++));
                }
                FC.CONFIG.buildInfo = String.fromCharCode.apply(null, buff);
                break;

            case MSPCodes.MSP_BOARD_INFO:
                for (offset = 0; offset < 4; offset++) {
                    identifier += String.fromCharCode(data.getUint8(offset));
                }
                FC.CONFIG.boardIdentifier = identifier;
                FC.CONFIG.boardVersion = data.getUint16(offset, 1);
                offset += 2;
                if (semver.gt(FC.CONFIG.flightControllerVersion, "4.1.0")) {
                    FC.CONFIG.osdUsed = data.getUint8(offset++);
                    FC.CONFIG.commCompatability = data.getUint8(offset++);
                    let targetNameLen = data.getUint8(offset++);
                    let targetName = "";
                    targetNameLen += offset;
                    for (offset = offset; offset < targetNameLen; offset++) {
                        targetName += String.fromCharCode(data.getUint8(offset));
                    }
                    FC.CONFIG.target = targetName;
                }

                break;

            case MSPCodes.MSP2_CF_SERIAL_CONFIG:
                FC.SERIAL_CONFIG.ports = [];
                var bytesPerPort = 1 + 4 + 4;
                var serialPortCount = data.byteLength / bytesPerPort;

                for (let i = 0; i < serialPortCount; i++) {
                    var BAUD_RATES = mspHelper.BAUD_RATES_post1_6_3;

                    var serialPort = {
                        identifier: data.getUint8(offset),
                        functions: serialPortHelper.maskToFunctions(data.getUint32(offset + 1, true)),
                        msp_baudrate: BAUD_RATES[data.getUint8(offset + 5)],
                        sensors_baudrate: BAUD_RATES[data.getUint8(offset + 6)],
                        telemetry_baudrate: BAUD_RATES[data.getUint8(offset + 7)],
                        peripherals_baudrate: BAUD_RATES[data.getUint8(offset + 8)]
                    };

                    offset += bytesPerPort;
                    FC.SERIAL_CONFIG.ports.push(serialPort);
                }
                break;

            case MSPCodes.MSP2_SET_CF_SERIAL_CONFIG:
                console.log('Serial config saved');
                break;

            case MSPCodes.MSP_MODE_RANGES:
                //noinspection JSUndeclaredVariable
                FC.MODE_RANGES = []; // empty the array as new data is coming in

                var modeRangeCount = data.byteLength / 4; // 4 bytes per item.

                for (let i = 0; offset < data.byteLength && i < modeRangeCount; i++) {
                    var modeRange = {
                        id: data.getUint8(offset++),
                        auxChannelIndex: data.getUint8(offset++),
                        range: {
                            start: 900 + (data.getUint8(offset++) * 25),
                            end: 900 + (data.getUint8(offset++) * 25)
                        }
                    };
                    FC.MODE_RANGES.push(modeRange);
                }
                break;

            case MSPCodes.MSP_ADJUSTMENT_RANGES:
                //noinspection JSUndeclaredVariable
                FC.ADJUSTMENT_RANGES = []; // empty the array as new data is coming in

                var adjustmentRangeCount = data.byteLength / 6; // 6 bytes per item.

                for (let i = 0; offset < data.byteLength && i < adjustmentRangeCount; i++) {
                    var adjustmentRange = {
                        slotIndex: data.getUint8(offset++),
                        auxChannelIndex: data.getUint8(offset++),
                        range: {
                            start: 900 + (data.getUint8(offset++) * 25),
                            end: 900 + (data.getUint8(offset++) * 25)
                        },
                        adjustmentFunction: data.getUint8(offset++),
                        auxSwitchChannelIndex: data.getUint8(offset++)
                    };
                    FC.ADJUSTMENT_RANGES.push(adjustmentRange);
                }
                break;

            case MSPCodes.MSP_RX_CONFIG:
                FC.RX_CONFIG.serialrx_provider = data.getUint8(offset);
                offset++;
                FC.RX_CONFIG.maxcheck = data.getUint16(offset, true);
                offset += 2;
                FC.RX_CONFIG.midrc = data.getUint16(offset, true);
                offset += 2;
                FC.RX_CONFIG.mincheck = data.getUint16(offset, true);
                offset += 2;
                FC.RX_CONFIG.spektrum_sat_bind = data.getUint8(offset);
                offset++;
                FC.RX_CONFIG.rx_min_usec = data.getUint16(offset, true);
                offset += 2;
                FC.RX_CONFIG.rx_max_usec = data.getUint16(offset, true);
                offset += 2;
                offset += 4; // 4 null bytes for betaflight compatibility
                FC.RX_CONFIG.spirx_protocol = data.getUint8(offset);
                offset++;
                FC.RX_CONFIG.spirx_id = data.getUint32(offset, true);
                offset += 4;
                FC.RX_CONFIG.spirx_channel_count = data.getUint8(offset);
                offset += 1;
                // unused byte for fpvCamAngleDegrees, for compatiblity with betaflight
                offset += 1;
                FC.RX_CONFIG.receiver_type = data.getUint8(offset);
                offset += 1;
                break;

            case MSPCodes.MSP_FAILSAFE_CONFIG:
                FC.FAILSAFE_CONFIG.failsafe_delay = data.getUint8(offset);
                offset++;
                FC.FAILSAFE_CONFIG.failsafe_off_delay = data.getUint8(offset);
                offset++;
                FC.FAILSAFE_CONFIG.failsafe_throttle = data.getUint16(offset, true);
                offset += 2;
                FC.FAILSAFE_CONFIG.failsafe_kill_switch = data.getUint8(offset);
                offset++;
                FC.FAILSAFE_CONFIG.failsafe_throttle_low_delay = data.getUint16(offset, true);
                offset += 2;
                FC.FAILSAFE_CONFIG.failsafe_procedure = data.getUint8(offset);
                offset++;
                FC.FAILSAFE_CONFIG.failsafe_recovery_delay = data.getUint8(offset);
                offset++;
                FC.FAILSAFE_CONFIG.failsafe_fw_roll_angle = data.getUint16(offset, true);
                offset += 2;
                FC.FAILSAFE_CONFIG.failsafe_fw_pitch_angle = data.getUint16(offset, true);
                offset += 2;
                FC.FAILSAFE_CONFIG.failsafe_fw_yaw_rate = data.getUint16(offset, true);
                offset += 2;
                FC.FAILSAFE_CONFIG.failsafe_stick_motion_threshold = data.getUint16(offset, true);
                offset += 2;
                FC.FAILSAFE_CONFIG.failsafe_min_distance = data.getUint16(offset, true);
                offset += 2;
                FC.FAILSAFE_CONFIG.failsafe_min_distance_procedure = data.getUint8(offset);
                offset++;
                break;


            case MSPCodes.MSP_LED_STRIP_CONFIG:
                //noinspection JSUndeclaredVariable
                FC.LED_STRIP = [];

                var ledCount = data.byteLength / 4;
                var directionMask,
                    directions,
                    directionLetterIndex,
                    functions,
                    led;

                for (let i = 0; offset < data.byteLength && i < ledCount; i++) {

                    if (semver.lt(FC.CONFIG.apiVersion, "1.20.0")) {
                        directionMask = data.getUint16(offset, true);
                        offset += 2;

                        directions = [];
                        for (directionLetterIndex = 0; directionLetterIndex < MSP.ledDirectionLetters.length; directionLetterIndex++) {
                            if (BitHelper.bit_check(directionMask, directionLetterIndex)) {
                                directions.push(MSP.ledDirectionLetters[directionLetterIndex]);
                            }
                        }

                        var functionMask = data.getUint16(offset, 1);
                        offset += 2;

                        functions = [];
                        for (var functionLetterIndex = 0; functionLetterIndex < MSP.ledFunctionLetters.length; functionLetterIndex++) {
                            if (BitHelper.bit_check(functionMask, functionLetterIndex)) {
                                functions.push(MSP.ledFunctionLetters[functionLetterIndex]);
                            }
                        }

                        led = {
                            directions: directions,
                            functions: functions,
                            x: data.getUint8(offset++),
                            y: data.getUint8(offset++),
                            color: data.getUint8(offset++)
                        };

                        FC.LED_STRIP.push(led);
                    } else {
                        var mask = data.getUint32(offset, 1);
                        offset += 4;

                        var functionId = (mask >> 8) & 0xF;

                        functions = [];
                        for (var baseFunctionLetterIndex = 0; baseFunctionLetterIndex < MSP.ledBaseFunctionLetters.length; baseFunctionLetterIndex++) {
                            if (functionId == baseFunctionLetterIndex) {
                                functions.push(MSP.ledBaseFunctionLetters[baseFunctionLetterIndex]);
                                break;
                            }
                        }

                        var overlayMask = (mask >> 12) & 0x3F;
                        for (var overlayLetterIndex = 0; overlayLetterIndex < MSP.ledOverlayLetters.length; overlayLetterIndex++) {
                            if (BitHelper.bit_check(overlayMask, overlayLetterIndex)) {
                                functions.push(MSP.ledOverlayLetters[overlayLetterIndex]);
                            }
                        }

                        directionMask = (mask >> 22) & 0x3F;

                        directions = [];
                        for (directionLetterIndex = 0; directionLetterIndex < MSP.ledDirectionLetters.length; directionLetterIndex++) {
                            if (BitHelper.bit_check(directionMask, directionLetterIndex)) {
                                directions.push(MSP.ledDirectionLetters[directionLetterIndex]);
                            }
                        }
                        led = {
                            y: (mask) & 0xF,
                            x: (mask >> 4) & 0xF,
                            functions: functions,
                            color: (mask >> 18) & 0xF,
                            directions: directions,
                            parameters: (mask >> 28) & 0xF
                        };

                        FC.LED_STRIP.push(led);
                    }
                }
                break;
            case MSPCodes.MSP2_INAV_LED_STRIP_CONFIG_EX:
                //noinspection JSUndeclaredVariable
                FC.LED_STRIP = [];

                var ledCount = data.byteLength / 5;
                var directionMask,
                    directions,
                    directionLetterIndex,
                    functions,
                    led;

                for (let i = 0; offset < data.byteLength && i < ledCount; i++) {
                    var mask = data.getUint32(offset, 1);
                    offset += 4;
                    var extra = data.getUint8(offset, 1);
                    offset++;

                    var functionId = (mask >> 8) & 0xFF;

                    functions = [];
                    for (var baseFunctionLetterIndex = 0; baseFunctionLetterIndex < MSP.ledBaseFunctionLetters.length; baseFunctionLetterIndex++) {
                        if (functionId == baseFunctionLetterIndex) {
                            functions.push(MSP.ledBaseFunctionLetters[baseFunctionLetterIndex]);
                            break;
                        }
                    }

                    var overlayMask = (mask >> 16) & 0xFF;
                    for (var overlayLetterIndex = 0; overlayLetterIndex < MSP.ledOverlayLetters.length; overlayLetterIndex++) {
                        if (BitHelper.bit_check(overlayMask, overlayLetterIndex)) {
                            functions.push(MSP.ledOverlayLetters[overlayLetterIndex]);
                        }
                    }

                    directionMask = (mask >> 28) & 0xF | ((extra & 0x3) << 4);

                    directions = [];
                    for (directionLetterIndex = 0; directionLetterIndex < MSP.ledDirectionLetters.length; directionLetterIndex++) {
                        if (BitHelper.bit_check(directionMask, directionLetterIndex)) {
                            directions.push(MSP.ledDirectionLetters[directionLetterIndex]);
                        }
                    }
                    led = {
                        y: (mask) & 0xF,
                        x: (mask >> 4) & 0xF,
                        functions: functions,
                        color: (mask >> 24) & 0xF,
                        directions: directions,
                        parameters: (extra >> 2) & 0x3F
                    };

                    FC.LED_STRIP.push(led);
                }
                break;
            case MSPCodes.MSP_SET_LED_STRIP_CONFIG:
                console.log('Led strip config saved');
                break;
            case MSPCodes.MSP2_INAV_SET_LED_STRIP_CONFIG_EX:
                console.log('Led strip extended config saved');
                break;
            case MSPCodes.MSP_LED_COLORS:

                //noinspection JSUndeclaredVariable
                FC.LED_COLORS = [];

                colorCount = data.byteLength / 4;

                for (let i = 0; offset < data.byteLength && i < colorCount; i++) {

                    var h = data.getUint16(offset, true);
                    var s = data.getUint8(offset + 2);
                    var v = data.getUint8(offset + 3);
                    offset += 4;

                    color = {
                        h: h,
                        s: s,
                        v: v
                    };

                    FC.LED_COLORS.push(color);
                }

                break;
            case MSPCodes.MSP_SET_LED_COLORS:
                console.log('Led strip colors saved');
                break;
            case MSPCodes.MSP_LED_STRIP_MODECOLOR:
                //noinspection JSUndeclaredVariable
                FC.LED_MODE_COLORS = [];

                colorCount = data.byteLength / 3;

                for (let i = 0; offset < data.byteLength && i < colorCount; i++) {

                    var mode = data.getUint8(offset++);
                    var direction = data.getUint8(offset++);

                    color = data.getUint8(offset++);

                    FC.LED_MODE_COLORS.push({
                        mode: mode,
                        direction: direction,
                        color: color
                    });
                }
                break;
            case MSPCodes.MSP_SET_LED_STRIP_MODECOLOR:
                console.log('Led strip mode colors saved');
                break;

            case MSPCodes.MSP_DATAFLASH_SUMMARY:
                if (data.byteLength >= 13) {
                    flags = data.getUint8(0);
                    FC.DATAFLASH.ready = (flags & 1) != 0;
                    FC.DATAFLASH.supported = (flags & 2) != 0 || FC.DATAFLASH.ready;
                    FC.DATAFLASH.sectors = data.getUint32(1, 1);
                    FC.DATAFLASH.totalSize = data.getUint32(5, 1);
                    FC.DATAFLASH.usedSize = data.getUint32(9, 1);
                } else {
                    // Firmware version too old to support MSP_FC.DATAFLASH_SUMMARY
                    FC.DATAFLASH.ready = false;
                    FC.DATAFLASH.supported = false;
                    FC.DATAFLASH.sectors = 0;
                    FC.DATAFLASH.totalSize = 0;
                    FC.DATAFLASH.usedSize = 0;
                }
                GUI.update_dataflash_global();
                break;
            case MSPCodes.MSP_DATAFLASH_READ:
                // No-op, let callback handle it
                break;
            case MSPCodes.MSP_DATAFLASH_ERASE:
                console.log("Data flash erase begun...");
                break;
            case MSPCodes.MSP_SDCARD_SUMMARY:
                flags = data.getUint8(0);

                FC.SDCARD.supported = (flags & 0x01) != 0;
                FC.SDCARD.state = data.getUint8(1);
                FC.SDCARD.filesystemLastError = data.getUint8(2);
                FC.SDCARD.freeSizeKB = data.getUint32(3, true);
                FC.SDCARD.totalSizeKB = data.getUint32(7, true);
                break;
            case MSPCodes.MSP_BLACKBOX_CONFIG:
                FC.BLACKBOX.supported = (data.getUint8(0) & 1) != 0;
                FC.BLACKBOX.blackboxDevice = data.getUint8(1);
                FC.BLACKBOX.blackboxRateNum = data.getUint8(2);
                FC.BLACKBOX.blackboxRateDenom = data.getUint8(3);
                break;
            case MSPCodes.MSP_SET_BLACKBOX_CONFIG:
                console.log("Blackbox config saved");
                break;
            case MSPCodes.MSP_VTX_CONFIG:
                FC.VTX_CONFIG.device_type = data.getUint8(offset++);
                if (FC.VTX_CONFIG.device_type != VTX.DEV_UNKNOWN) {
                    FC.VTX_CONFIG.band = data.getUint8(offset++);
                    FC.VTX_CONFIG.channel = data.getUint8(offset++);
                    FC.VTX_CONFIG.power = data.getUint8(offset++);
                    FC.VTX_CONFIG.pitmode = data.getUint8(offset++);
                    // Ignore wether the VTX is ready for now
                    offset++;
                    FC.VTX_CONFIG.low_power_disarm = data.getUint8(offset++);
                }
                break;
            case MSPCodes.MSP_ADVANCED_CONFIG:
                FC.ADVANCED_CONFIG.gyroSyncDenominator = data.getUint8(offset);
                offset++;
                FC.ADVANCED_CONFIG.pidProcessDenom = data.getUint8(offset);
                offset++;
                FC.ADVANCED_CONFIG.useUnsyncedPwm = data.getUint8(offset);
                offset++;
                FC.ADVANCED_CONFIG.motorPwmProtocol = data.getUint8(offset);
                offset++;
                FC.ADVANCED_CONFIG.motorPwmRate = data.getUint16(offset, true);
                offset += 2;
                FC.ADVANCED_CONFIG.servoPwmRate = data.getUint16(offset, true);
                offset += 2;
                FC.ADVANCED_CONFIG.gyroSync = data.getUint8(offset);
                break;

            case MSPCodes.MSP_SET_VTX_CONFIG:
                console.log("VTX config saved");
                break;

            case MSPCodes.MSP_SET_ADVANCED_CONFIG:
                console.log("Advanced config saved");
                break;

            case MSPCodes.MSP_FILTER_CONFIG:
                FC.FILTER_CONFIG.gyroSoftLpfHz = data.getUint8(0);
                FC.FILTER_CONFIG.dtermLpfHz = data.getUint16(1, true);
                FC.FILTER_CONFIG.yawLpfHz = data.getUint16(3, true);

                FC.FILTER_CONFIG.gyroNotchHz1 = data.getUint16(5, true);
                FC.FILTER_CONFIG.gyroNotchCutoff1 = data.getUint16(7, true);
                FC.FILTER_CONFIG.dtermNotchHz = data.getUint16(9, true);
                FC.FILTER_CONFIG.dtermNotchCutoff = data.getUint16(11, true);
                FC.FILTER_CONFIG.gyroNotchHz2 = data.getUint16(13, true);
                FC.FILTER_CONFIG.gyroNotchCutoff2 = data.getUint16(15, true);

                FC.FILTER_CONFIG.accNotchHz = data.getUint16(17, true);
                FC.FILTER_CONFIG.accNotchCutoff = data.getUint16(19, true);
                FC.FILTER_CONFIG.gyroStage2LowpassHz = data.getUint16(21, true);

                break;

            case MSPCodes.MSP_SET_FILTER_CONFIG:
                console.log("Filter config saved");
                break;

            case MSPCodes.MSP_PID_ADVANCED:
                FC.PID_ADVANCED.rollPitchItermIgnoreRate = data.getUint16(0, true);
                FC.PID_ADVANCED.yawItermIgnoreRate = data.getUint16(2, true);
                FC.PID_ADVANCED.yawPLimit = data.getUint16(4, true);
                FC.PID_ADVANCED.dtermSetpointWeight = data.getUint8(9);
                FC.PID_ADVANCED.pidSumLimit = data.getUint16(10, true);
                FC.PID_ADVANCED.axisAccelerationLimitRollPitch = data.getUint16(13, true);
                FC.PID_ADVANCED.axisAccelerationLimitYaw = data.getUint16(15, true);
                break;

            case MSPCodes.MSP_SET_PID_ADVANCED:
                console.log("PID advanced saved");
                break;

            case MSPCodes.MSP_SENSOR_CONFIG:
                FC.SENSOR_CONFIG.accelerometer = data.getUint8(0, true);
                FC.SENSOR_CONFIG.barometer = data.getUint8(1, true);
                FC.SENSOR_CONFIG.magnetometer = data.getUint8(2, true);
                FC.SENSOR_CONFIG.pitot = data.getUint8(3, true);
                FC.SENSOR_CONFIG.rangefinder = data.getUint8(4, true);
                FC.SENSOR_CONFIG.opflow = data.getUint8(5, true);
                break;

            case MSPCodes.MSP_SET_SENSOR_CONFIG:
                console.log("Sensor config saved");
                break;

            case MSPCodes.MSP_INAV_PID:
                FC.INAV_PID_CONFIG.asynchronousMode = data.getUint8(0);
                FC.INAV_PID_CONFIG.accelerometerTaskFrequency = data.getUint16(1, true);
                FC.INAV_PID_CONFIG.attitudeTaskFrequency = data.getUint16(3, true);
                FC.INAV_PID_CONFIG.magHoldRateLimit = data.getUint8(5);
                FC.INAV_PID_CONFIG.magHoldErrorLpfFrequency = data.getUint8(6);
                FC.INAV_PID_CONFIG.yawJumpPreventionLimit = data.getUint16(7, true);
                FC.INAV_PID_CONFIG.gyroscopeLpf = data.getUint8(9);
                FC.INAV_PID_CONFIG.accSoftLpfHz = data.getUint8(10);
                break;

            case MSPCodes.MSP_SET_INAV_PID:
                console.log("MSP_INAV_PID saved");
                break;

            case MSPCodes.MSP_NAV_POSHOLD:
                FC.NAV_POSHOLD.userControlMode = data.getUint8(0);
                FC.NAV_POSHOLD.maxSpeed = data.getUint16(1, true);
                FC.NAV_POSHOLD.maxClimbRate = data.getUint16(3, true);
                FC.NAV_POSHOLD.maxManualSpeed = data.getUint16(5, true);
                FC.NAV_POSHOLD.maxManualClimbRate = data.getUint16(7, true);
                FC.NAV_POSHOLD.maxBankAngle = data.getUint8(9);
                FC.NAV_POSHOLD.useThrottleMidForAlthold = data.getUint8(10);
                FC.NAV_POSHOLD.hoverThrottle = data.getUint16(11, true);
                break;

            case MSPCodes.MSP_SET_NAV_POSHOLD:
                console.log('NAV_POSHOLD saved');
                break;

            case MSPCodes.MSP_CALIBRATION_DATA:
                var callibrations = data.getUint8(0);
                FC.CALIBRATION_DATA.acc.Pos0 = (1 & (callibrations >> 0));
                FC.CALIBRATION_DATA.acc.Pos1 = (1 & (callibrations >> 1));
                FC.CALIBRATION_DATA.acc.Pos2 = (1 & (callibrations >> 2));
                FC.CALIBRATION_DATA.acc.Pos3 = (1 & (callibrations >> 3));
                FC.CALIBRATION_DATA.acc.Pos4 = (1 & (callibrations >> 4));
                FC.CALIBRATION_DATA.acc.Pos5 = (1 & (callibrations >> 5));

                FC.CALIBRATION_DATA.accZero.X = data.getInt16(1, true);
                FC.CALIBRATION_DATA.accZero.Y = data.getInt16(3, true);
                FC.CALIBRATION_DATA.accZero.Z = data.getInt16(5, true);
                FC.CALIBRATION_DATA.accGain.X = data.getInt16(7, true);
                FC.CALIBRATION_DATA.accGain.Y = data.getInt16(9, true);
                FC.CALIBRATION_DATA.accGain.Z = data.getInt16(11, true);
                FC.CALIBRATION_DATA.magZero.X = data.getInt16(13, true);
                FC.CALIBRATION_DATA.magZero.Y = data.getInt16(15, true);
                FC.CALIBRATION_DATA.magZero.Z = data.getInt16(17, true);
                FC.CALIBRATION_DATA.opflow.Scale = (data.getInt16(19, true) / 256.0);

                FC.CALIBRATION_DATA.magGain.X = data.getInt16(21, true);
                FC.CALIBRATION_DATA.magGain.Y = data.getInt16(23, true);
                FC.CALIBRATION_DATA.magGain.Z = data.getInt16(25, true);

                break;

            case MSPCodes.MSP_SET_CALIBRATION_DATA:
                console.log('Calibration data saved');
                break;

            case MSPCodes.MSP_RTH_AND_LAND_CONFIG:
                FC.RTH_AND_LAND_CONFIG.minRthDistance = data.getUint16(0, true);
                FC.RTH_AND_LAND_CONFIG.rthClimbFirst = data.getUint8(2);
                FC.RTH_AND_LAND_CONFIG.rthClimbIgnoreEmergency = data.getUint8(3);
                FC.RTH_AND_LAND_CONFIG.rthTailFirst = data.getUint8(4);
                FC.RTH_AND_LAND_CONFIG.rthAllowLanding = data.getUint8(5);
                FC.RTH_AND_LAND_CONFIG.rthAltControlMode = data.getUint8(6);
                FC.RTH_AND_LAND_CONFIG.rthAbortThreshold = data.getUint16(7, true);
                FC.RTH_AND_LAND_CONFIG.rthAltitude = data.getUint16(9, true);
                FC.RTH_AND_LAND_CONFIG.landMinAltVspd = data.getUint16(11, true);
                FC.RTH_AND_LAND_CONFIG.landMaxAltVspd = data.getUint16(13, true);
                FC.RTH_AND_LAND_CONFIG.landSlowdownMinAlt = data.getUint16(15, true);
                FC.RTH_AND_LAND_CONFIG.landSlowdownMaxAlt = data.getUint16(17, true);
                FC.RTH_AND_LAND_CONFIG.emergencyDescentRate = data.getUint16(19, true);
                break;

            case MSPCodes.MSP_SET_RTH_AND_LAND_CONFIG:
                console.log('RTH_AND_LAND_CONFIG saved');
                break;

            case MSPCodes.MSP_FW_CONFIG:
                FC.FW_CONFIG.cruiseThrottle = data.getUint16(0, true);
                FC.FW_CONFIG.minThrottle = data.getUint16(2, true);
                FC.FW_CONFIG.maxThrottle = data.getUint16(4, true);
                FC.FW_CONFIG.maxBankAngle = data.getUint8(6);
                FC.FW_CONFIG.maxClimbAngle = data.getUint8(7);
                FC.FW_CONFIG.maxDiveAngle = data.getUint8(8);
                FC.FW_CONFIG.pitchToThrottle = data.getUint8(9);
                FC.FW_CONFIG.loiterRadius = data.getUint16(10, true);
                break;

            case MSPCodes.MSP_SET_FW_CONFIG:
                console.log('FW_CONFIG saved');
                break;

            case MSPCodes.MSP_SET_MODE_RANGE:
                console.log('Mode range saved');
                break;
            case MSPCodes.MSP_SET_ADJUSTMENT_RANGE:
                console.log('Adjustment range saved');
                break;
            case MSPCodes.MSP_SET_LOOP_TIME:
                console.log('Looptime saved');
                break;
            case MSPCodes.MSP_SET_RESET_CURR_PID:
                console.log('Current Control profile reset');
                break;
            case MSPCodes.MSP_SET_3D:
                console.log('3D settings saved');
                break;
            case MSPCodes.MSP_SET_RC_DEADBAND:
                console.log('Rc controls settings saved');
                break;
            case MSPCodes.MSP_SET_SENSOR_ALIGNMENT:
                console.log('Sensor alignment saved');
                break;
            case MSPCodes.MSP_SET_RX_CONFIG:
                console.log('Rx config saved');
                break;
            case MSPCodes.MSP_SET_FAILSAFE_CONFIG:
                console.log('Failsafe config saved');
                break;
            case MSPCodes.MSP_OSD_CHAR_READ:
                break;
            case MSPCodes.MSP_OSD_CHAR_WRITE:
                console.log('OSD char uploaded');
                break;
            case MSPCodes.MSP_NAME:
                FC.CONFIG.name = '';
                var char;
                while ((char = data.readU8()) !== null) {
                    FC.CONFIG.name += String.fromCharCode(char);
                }
                break;
            case MSPCodes.MSP_SET_NAME:
                console.log("Craft name set");
                break;
            case MSPCodes.MSPV2_SETTING:
                break;
            case MSPCodes.MSP2_COMMON_SETTING_INFO:
                break;
            case MSPCodes.MSPV2_SET_SETTING:
                console.log("Setting set");
                break;
            case MSPCodes.MSP_WP_GETINFO:
                // Reserved for waypoint capabilities data.getUint8(0);
                FC.MISSION_PLANNER.setMaxWaypoints(data.getUint8(1));
                FC.MISSION_PLANNER.setValidMission(data.getUint8(2));
                FC.MISSION_PLANNER.setCountBusyPoints(data.getUint8(3));
                break;
            case MSPCodes.MSP_SET_WP:
                console.log('Point saved');
                break;
            case MSPCodes.MSP_WP_MISSION_SAVE:
                // buffer.push(0);
                console.log(data);
                break;
            case MSPCodes.MSP_WP_MISSION_LOAD:
                console.log('Mission load');
                break;
            case MSPCodes.MSP2_INAV_MIXER:
                FC.MIXER_CONFIG.yawMotorDirection = data.getInt8(0);
                FC.MIXER_CONFIG.yawJumpPreventionLimit = data.getUint8(1, true);
                FC.MIXER_CONFIG.motorStopOnLow = data.getUint8(2, true);
                FC.MIXER_CONFIG.platformType = data.getInt8(3);
                FC.MIXER_CONFIG.hasFlaps = data.getInt8(4);
                FC.MIXER_CONFIG.appliedMixerPreset = data.getInt16(5, true);
                FC.MIXER_CONFIG.numberOfMotors = data.getInt8(7);
                FC.MIXER_CONFIG.numberOfServos = data.getInt8(8);
                FC.MOTOR_RULES.setMotorCount(FC.MIXER_CONFIG.numberOfMotors);
                FC.SERVO_RULES.setServoCount(FC.MIXER_CONFIG.numberOfServos);
                break;
            case MSPCodes.MSP2_INAV_SET_MIXER:
                console.log('Mixer config saved');
            case MSPCodes.MSP2_INAV_OSD_LAYOUTS:
                break;
            case MSPCodes.MSP2_INAV_OSD_SET_LAYOUT_ITEM:
                console.log('OSD layout item saved');
                break;
            case MSPCodes.MSP2_INAV_OSD_ALARMS:
                break;
            case MSPCodes.MSP2_INAV_OSD_SET_ALARMS:
                console.log('OSD alarms saved');
                break;
            case MSPCodes.MSP2_INAV_OSD_PREFERENCES:
                break;
            case MSPCodes.MSP2_INAV_OSD_SET_PREFERENCES:
                console.log('OSD preferences saved');
                break;
            case MSPCodes.MSP2_INAV_SELECT_BATTERY_PROFILE:
                console.log('Battery profile selected');
                break;
            case MSPCodes.MSP2_INAV_SET_CUSTOM_OSD_ELEMENTS:
                console.log('OSD custom elements preferences saved');
                break;
/*
            case MSPCodes.MSPV2_INAV_OUTPUT_MAPPING:
                FC.OUTPUT_MAPPING.flush();
                for (let i = 0; i < data.byteLength; ++i)
                    FC.OUTPUT_MAPPING.put({
                        'timerId': i,
                        'usageFlags': data.getUint8(i)});
                break;
 */
            case MSPCodes.MSPV2_INAV_OUTPUT_MAPPING_EXT2:
                FC.OUTPUT_MAPPING.flush();
                for (let i = 0; i < data.byteLength; i += 6) {
                    let timerId = data.getUint8(i);
                    let usageFlags = data.getUint32(i + 1, true);
                    let specialLabels = data.getUint8(i + 5);
                    FC.OUTPUT_MAPPING.put(
                        {
                            'timerId': timerId,
                            'usageFlags': usageFlags,
                            'specialLabels': specialLabels
                        });
                }
                break;
            
            case MSPCodes.MSP2_INAV_TIMER_OUTPUT_MODE:
                if(data.byteLength > 2) {
                    FC.OUTPUT_MAPPING.flushTimerOverrides();
                }
                for (let i = 0; i < data.byteLength; i += 2) {
                    let timerId = data.getUint8(i);
                    let outputMode = data.getUint8(i + 1);
                    FC.OUTPUT_MAPPING.setTimerOverride(timerId, outputMode);
                }
                break;

            case MSPCodes.MSP2_INAV_MC_BRAKING:
                try {
                    FC.BRAKING_CONFIG.speedThreshold = data.getUint16(0, true);
                    FC.BRAKING_CONFIG.disengageSpeed = data.getUint16(2, true);
                    FC.BRAKING_CONFIG.timeout = data.getUint16(4, true);
                    FC.BRAKING_CONFIG.boostFactor = data.getInt8(6);
                    FC.BRAKING_CONFIG.boostTimeout = data.getUint16(7, true);
                    FC.BRAKING_CONFIG.boostSpeedThreshold = data.getUint16(9, true);
                    FC.BRAKING_CONFIG.boostDisengageSpeed = data.getUint16(11, true);
                    FC.BRAKING_CONFIG.bankAngle = data.getInt8(13);
                } catch (e) {
                    console.log("MC_BRAKING MODE is not supported by the hardware");
                }
                break;

            case MSPCodes.MSP2_INAV_SET_MC_BRAKING:
                console.log('Braking config saved');
                break;
            case MSPCodes.MSP2_BLACKBOX_CONFIG:
                FC.BLACKBOX.supported = (data.getUint8(0) & 1) != 0;
                FC.BLACKBOX.blackboxDevice = data.getUint8(1);
                FC.BLACKBOX.blackboxRateNum = data.getUint16(2);
                FC.BLACKBOX.blackboxRateDenom = data.getUint16(4);
                FC.BLACKBOX.blackboxIncludeFlags = data.getUint32(6,true);
                break;
            case MSPCodes.MSP2_SET_BLACKBOX_CONFIG:
                console.log("Blackbox config saved");
                break;

            case MSPCodes.MSP2_INAV_TEMPERATURES:
                for (let i = 0; i < 8; ++i) {
                    let temp_decidegrees = data.getInt16(i * 2, true);
                    FC.SENSOR_DATA.temperature[i] = temp_decidegrees / 10; // °C
                }
                break;
            case MSPCodes.MSP2_INAV_SAFEHOME:
                var safeHome = new Safehome(
                    data.getUint8(0),
                    data.getUint8(1),
                    data.getInt32(2, true),
                    data.getInt32(6, true),
                );
                if (safeHome.getEnabled()) {
                    FC.SAFEHOMES.put(safeHome);
                }

                break;
            case MSPCodes.MSP2_INAV_SET_SAFEHOME:
                console.log('Safehome points saved');
                break;

            case MSPCodes.MSP2_INAV_FW_APPROACH:
                FC.FW_APPROACH.put(new FwApproach(
                    data.getUint8(0),
                    data.getInt32(1, true),
                    data.getInt32(5, true),
                    data.getUint8(9, true),
                    data.getInt16(10, true),
                    data.getInt16(12, true),
                    data.getUint8(14, true),
                ));                
                break;
            
                case MSPCodes.MSP2_INAV_SET_FW_APPROACH:
                    console.log('FW Approach saved');
                    break;

            case MSPCodes.MSP2_INAV_RATE_DYNAMICS:
                FC.RATE_DYNAMICS.sensitivityCenter = data.getUint8(0);
                FC.RATE_DYNAMICS.sensitivityEnd = data.getUint8(1);
                FC.RATE_DYNAMICS.correctionCenter = data.getUint8(2);
                FC.RATE_DYNAMICS.correctionEnd = data.getUint8(3);
                FC.RATE_DYNAMICS.weightCenter = data.getUint8(4);
                FC.RATE_DYNAMICS.weightEnd = data.getUint8(5);
                break;

            case MSPCodes.MSP2_INAV_SET_RATE_DYNAMICS:
                console.log('Rate dynamics saved');
                break;

            case MSPCodes.MSP2_INAV_EZ_TUNE:
                FC.EZ_TUNE.enabled = data.getUint8(0);
                FC.EZ_TUNE.filterHz = data.getUint16(1, true);
                FC.EZ_TUNE.axisRatio = data.getUint8(3);
                FC.EZ_TUNE.response = data.getUint8(4);
                FC.EZ_TUNE.damping = data.getUint8(5);
                FC.EZ_TUNE.stability = data.getUint8(6);
                FC.EZ_TUNE.aggressiveness = data.getUint8(7);
                FC.EZ_TUNE.rate = data.getUint8(8);
                FC.EZ_TUNE.expo = data.getUint8(9);
                FC.EZ_TUNE.snappiness = data.getUint8(10);
                break;

            case MSPCodes.MSP2_INAV_EZ_TUNE_SET:
                console.log('EzTune settings saved');
                break;

            case MSPCodes.MSP2_INAV_CUSTOM_OSD_ELEMENTS:
                FC.OSD_CUSTOM_ELEMENTS.items = [];

                let settingsIdx = 0;

                if(data.byteLength == 0) {
                    FC.OSD_CUSTOM_ELEMENTS.settings.customElementsCount = 0;
                    FC.OSD_CUSTOM_ELEMENTS.settings.customElementTextSize = 0;
                    FC.OSD_CUSTOM_ELEMENTS.settings.customElementParts = 0;
                    return;
                }

                FC.OSD_CUSTOM_ELEMENTS.settings.customElementsCount = data.getUint8(settingsIdx++);
                FC.OSD_CUSTOM_ELEMENTS.settings.customElementTextSize = data.getUint8(settingsIdx++);
                FC.OSD_CUSTOM_ELEMENTS.settings.customElementParts = data.getUint8(settingsIdx++);
                break;
            case MSPCodes.MSP2_INAV_CUSTOM_OSD_ELEMENT:        
                var customElement = {
                    customElementItems: [],
                    customElementVisibility: {type: 0, value: 0},
                    customElementText: [],
                };

                let index = 0;

                for (let ii = 0; ii < FC.OSD_CUSTOM_ELEMENTS.settings.customElementParts; ii++) {
                    var customElementPart = {type: 0,  value: 0,};
                    customElementPart.type = data.getUint8(index++);
                    customElementPart.value = data.getUint16(index, true);
                    index += 2;
                    customElement.customElementItems.push(customElementPart);
                }

                customElement.customElementVisibility.type = data.getUint8(index++);
                customElement.customElementVisibility.value = data.getUint16(index, true);
                index += 2;

                for (let ii = 0; ii < FC.OSD_CUSTOM_ELEMENTS.settings.customElementTextSize; ii++) {
                    var char = data.getUint8(index++);
                    if(char === 0) {
                        index += (FC.OSD_CUSTOM_ELEMENTS.settings.customElementTextSize - 1) - ii;
                        break;
                    }
                    customElement.customElementText[ii] = char;
                }

                customElement.customElementText = String.fromCharCode(...customElement.customElementText);

                FC.OSD_CUSTOM_ELEMENTS.items.push(customElement);
                break;

            case MSPCodes.MSP2_INAV_GPS_UBLOX_COMMAND:
                // Just and ACK from the fc.
                break;
            
            case MSPCodes.MSP2_INAV_GEOZONE:
                
                if (data.buffer.byteLength == 0) {
                    break;
                }
                var geozone = new Geozone(        
                    data.getUint8(1),
                    data.getUint8(2),
                    data.getInt32(3, true),
                    data.getInt32(7, true),
                    data.getUint8(11),
                    0,
                    data.getInt8(12, true),
                    null,
                    data.getUint8(0, true),
                );
                let verticesCount = data.getUint8(13, true);
                if (verticesCount == 0) {
                    break;
                }
                if (geozone.getShape() == GeozoneShapes.POLYGON) {
                    geozone.setVertices(new Array(verticesCount));
                } else {
                    geozone.setVertices(new Array(1));
                }                
                FC.GEOZONES.put(geozone);
                break;
            case MSPCodes.MSP2_INAV_GEOZONE_VERTEX:
                if (data.buffer.byteLength == 0) {
                    break;
                }
                var zoneID = data.getUint8(0);
                var vertexId = data.getUint8(1);
                var geozone = FC.GEOZONES.at(zoneID);
                if (zoneID < FC.GEOZONES.geozoneCount()) {
                    geozone.setVertex(
                        vertexId,
                        new GeozoneVertex(
                            vertexId,
                            data.getInt32(2, true),
                            data.getInt32(6, true),
                        )
                    );
                    if (geozone.getShape() == GeozoneShapes.CIRCULAR) {
                        geozone.setRadius(data.getUint32(10, true));
                    }
                }
                break;
            
            case MSPCodes.MSP2_INAV_SET_GEOZONE_VERTICE:
                console.log("Geozone vertex saved")
                break; 
            
            case MSPCodes.MSP2_INAV_SET_GEOZONE:
                console.log("Geozone saved")
                break;    

            default:
                console.log('Unknown code detected: 0x' + dataHandler.code.toString(16));
        } else {
            console.log('FC reports unsupported message error: 0x' + dataHandler.code.toString(16));
        }

        // trigger callbacks, cleanup/remove callback after trigger
        for (let i = dataHandler.callbacks.length - 1; i >= 0; i--) { // iterating in reverse because we use .splice which modifies array length
            if (i < dataHandler.callbacks.length) {
                if (dataHandler.callbacks[i].code == dataHandler.code) {
                    // save callback reference
                    var callback = dataHandler.callbacks[i].onFinish;

                    // remove timeout
                    clearTimeout(dataHandler.callbacks[i].timer);

                    /*
                     * Compute roundtrip
                     */
                    if (dataHandler.callbacks[i]) {
                        mspQueue.putRoundtrip(new Date().getTime() - dataHandler.callbacks[i].createdOn);

                        const hardwareRountrip = new Date().getTime() - dataHandler.callbacks[i].sentOn;

                        mspQueue.putHardwareRoundtrip(hardwareRountrip);

                        mspStatistics.add(dataHandler.code, hardwareRountrip);
                    }

                    //remove message from queue as received
                    mspDeduplicationQueue.remove(dataHandler.code);

                    // remove object from array
                    dataHandler.callbacks.splice(i, 1);

                    // fire callback
                    if (callback) {
                        callback({ 'command': dataHandler.code, 'data': data, 'length': dataHandler.message_length_expected });
                    }
                    break;
                }
            }
        }
    };

    self.crunch = function (code) {
        var buffer = [],
            i;

        switch (code) {

            case MSPCodes.MSP_SET_FEATURE:
                buffer.push(BitHelper.specificByte(FC.FEATURES, 0));
                buffer.push(BitHelper.specificByte(FC.FEATURES, 1));
                buffer.push(BitHelper.specificByte(FC.FEATURES, 2));
                buffer.push(BitHelper.specificByte(FC.FEATURES, 3));
                break;

            case MSPCodes.MSP_SET_BOARD_ALIGNMENT:
                buffer.push(BitHelper.specificByte(FC.BOARD_ALIGNMENT.roll, 0));
                buffer.push(BitHelper.specificByte(FC.BOARD_ALIGNMENT.roll, 1));
                buffer.push(BitHelper.specificByte(FC.BOARD_ALIGNMENT.pitch, 0));
                buffer.push(BitHelper.specificByte(FC.BOARD_ALIGNMENT.pitch, 1));
                buffer.push(BitHelper.specificByte(FC.BOARD_ALIGNMENT.yaw, 0));
                buffer.push(BitHelper.specificByte(FC.BOARD_ALIGNMENT.yaw, 1));
                break;

            case MSPCodes.MSP_SET_CURRENT_METER_CONFIG:
                buffer.push(BitHelper.specificByte(FC.CURRENT_METER_CONFIG.scale, 0));
                buffer.push(BitHelper.specificByte(FC.CURRENT_METER_CONFIG.scale, 1));
                buffer.push(BitHelper.specificByte(FC.CURRENT_METER_CONFIG.offset, 0));
                buffer.push(BitHelper.specificByte(FC.CURRENT_METER_CONFIG.offset, 1));
                buffer.push(FC.CURRENT_METER_CONFIG.type);
                buffer.push(BitHelper.specificByte(FC.CURRENT_METER_CONFIG.capacity, 0));
                buffer.push(BitHelper.specificByte(FC.CURRENT_METER_CONFIG.capacity, 1));
                break;

            case MSPCodes.MSP_SET_VTX_CONFIG:
                if (FC.VTX_CONFIG.band > 0) {
                    buffer.push16(((FC.VTX_CONFIG.band - 1) * 8) + (FC.VTX_CONFIG.channel - 1));
                } else {
                    // This tells the firmware to ignore this value.
                    buffer.push16(VTX.MAX_FREQUENCY_MHZ + 1);
                }
                buffer.push(FC.VTX_CONFIG.power);
                // Don't enable PIT mode
                buffer.push(0);
                buffer.push(FC.VTX_CONFIG.low_power_disarm);
                break;
            case MSPCodes.MSP2_SET_PID:
                for (let i = 0; i < FC.PIDs.length; i++) {
                    buffer.push(parseInt(FC.PIDs[i][0]));
                    buffer.push(parseInt(FC.PIDs[i][1]));
                    buffer.push(parseInt(FC.PIDs[i][2]));
                    buffer.push(parseInt(FC.PIDs[i][3]));
                }
                break;
            case MSPCodes.MSP_SET_RC_TUNING:
                buffer.push(Math.round(FC.RC_tuning.RC_RATE * 100));
                buffer.push(Math.round(FC.RC_tuning.RC_EXPO * 100));
                buffer.push(Math.round(FC.RC_tuning.roll_rate / 10));
                buffer.push(Math.round(FC.RC_tuning.pitch_rate / 10));
                buffer.push(Math.round(FC.RC_tuning.yaw_rate / 10));
                buffer.push(FC.RC_tuning.dynamic_THR_PID);
                buffer.push(Math.round(FC.RC_tuning.throttle_MID * 100));
                buffer.push(Math.round(FC.RC_tuning.throttle_EXPO * 100));
                buffer.push(BitHelper.lowByte(FC.RC_tuning.dynamic_THR_breakpoint));
                buffer.push(BitHelper.highByte(FC.RC_tuning.dynamic_THR_breakpoint));
                buffer.push(Math.round(FC.RC_tuning.RC_YAW_EXPO * 100));
                break;
            case MSPCodes.MSPV2_INAV_SET_RATE_PROFILE:
                // throttle
                buffer.push(Math.round(FC.RC_tuning.throttle_MID * 100));
                buffer.push(Math.round(FC.RC_tuning.throttle_EXPO * 100));
                buffer.push(FC.RC_tuning.dynamic_THR_PID);
                buffer.push(BitHelper.lowByte(FC.RC_tuning.dynamic_THR_breakpoint));
                buffer.push(BitHelper.highByte(FC.RC_tuning.dynamic_THR_breakpoint));

                // stabilized
                buffer.push(Math.round(FC.RC_tuning.RC_EXPO * 100));
                buffer.push(Math.round(FC.RC_tuning.RC_YAW_EXPO * 100));
                buffer.push(Math.round(FC.RC_tuning.roll_rate / 10));
                buffer.push(Math.round(FC.RC_tuning.pitch_rate / 10));
                buffer.push(Math.round(FC.RC_tuning.yaw_rate / 10));

                // manual
                buffer.push(Math.round(FC.RC_tuning.manual_RC_EXPO * 100));
                buffer.push(Math.round(FC.RC_tuning.manual_RC_YAW_EXPO * 100));
                buffer.push(FC.RC_tuning.manual_roll_rate);
                buffer.push(FC.RC_tuning.manual_pitch_rate);
                buffer.push(FC.RC_tuning.manual_yaw_rate);
                break;

            case MSPCodes.MSP_SET_RX_MAP:
                for (let i = 0; i < FC.RC_MAP.length; i++) {
                    buffer.push(FC.RC_MAP[i]);
                }
                break;
            case MSPCodes.MSP_SET_ACC_TRIM:
                buffer.push(BitHelper.lowByte(FC.CONFIG.accelerometerTrims[0]));
                buffer.push(BitHelper.highByte(FC.CONFIG.accelerometerTrims[0]));
                buffer.push(BitHelper.lowByte(FC.CONFIG.accelerometerTrims[1]));
                buffer.push(BitHelper.highByte(FC.CONFIG.accelerometerTrims[1]));
                break;
            case MSPCodes.MSP_SET_LOOP_TIME:
                buffer.push(BitHelper.lowByte(FC.FC_CONFIG.loopTime));
                buffer.push(BitHelper.highByte(FC.FC_CONFIG.loopTime));
                break;
            case MSPCodes.MSPV2_INAV_SET_MISC:
                buffer.push(BitHelper.lowByte(FC.MISC.midrc));
                buffer.push(BitHelper.highByte(FC.MISC.midrc));
                buffer.push(BitHelper.lowByte(FC.MISC.minthrottle));
                buffer.push(BitHelper.highByte(FC.MISC.minthrottle));
                buffer.push(BitHelper.lowByte(FC.MISC.maxthrottle));
                buffer.push(BitHelper.highByte(FC.MISC.maxthrottle));
                buffer.push(BitHelper.lowByte(FC.MISC.mincommand));
                buffer.push(BitHelper.highByte(FC.MISC.mincommand));
                buffer.push(BitHelper.lowByte(FC.MISC.failsafe_throttle));
                buffer.push(BitHelper.highByte(FC.MISC.failsafe_throttle));
                buffer.push(FC.MISC.gps_type);
                buffer.push(FC.MISC.sensors_baudrate);
                buffer.push(FC.MISC.gps_ubx_sbas);
                buffer.push(FC.MISC.rssi_channel);
                buffer.push(BitHelper.lowByte(Math.round(FC.MISC.mag_declination * 10)));
                buffer.push(BitHelper.highByte(Math.round(FC.MISC.mag_declination * 10)));
                buffer.push(BitHelper.lowByte(FC.MISC.vbatscale));
                buffer.push(BitHelper.highByte(FC.MISC.vbatscale));
                buffer.push(FC.MISC.voltage_source);
                buffer.push(FC.MISC.battery_cells);
                buffer.push(BitHelper.lowByte(Math.round(FC.MISC.vbatdetectcellvoltage * 100)));
                buffer.push(BitHelper.highByte(Math.round(FC.MISC.vbatdetectcellvoltage * 100)));
                buffer.push(BitHelper.lowByte(Math.round(FC.MISC.vbatmincellvoltage * 100)));
                buffer.push(BitHelper.highByte(Math.round(FC.MISC.vbatmincellvoltage * 100)));
                buffer.push(BitHelper.lowByte(Math.round(FC.MISC.vbatmaxcellvoltage * 100)));
                buffer.push(BitHelper.highByte(Math.round(FC.MISC.vbatmaxcellvoltage * 100)));
                buffer.push(BitHelper.lowByte(Math.round(FC.MISC.vbatwarningcellvoltage * 100)));
                buffer.push(BitHelper.highByte(Math.round(FC.MISC.vbatwarningcellvoltage * 100)));
                for (let byte_index = 0; byte_index < 4; ++byte_index)
                    buffer.push(BitHelper.specificByte(FC.MISC.battery_capacity, byte_index));
                for (let byte_index = 0; byte_index < 4; ++byte_index)
                    buffer.push(BitHelper.specificByte(FC.MISC.battery_capacity_warning, byte_index));
                for (let byte_index = 0; byte_index < 4; ++byte_index)
                    buffer.push(BitHelper.specificByte(FC.MISC.battery_capacity_critical, byte_index));
                buffer.push((FC.MISC.battery_capacity_unit == 'mAh') ? 0 : 1);
                break;
            case MSPCodes.MSPV2_INAV_SET_BATTERY_CONFIG:
                buffer.push(BitHelper.lowByte(FC.BATTERY_CONFIG.vbatscale));
                buffer.push(BitHelper.highByte(FC.BATTERY_CONFIG.vbatscale));
                buffer.push(FC.BATTERY_CONFIG.voltage_source);
                buffer.push(FC.BATTERY_CONFIG.battery_cells);
                buffer.push(BitHelper.lowByte(Math.round(FC.BATTERY_CONFIG.vbatdetectcellvoltage * 100)));
                buffer.push(BitHelper.highByte(Math.round(FC.BATTERY_CONFIG.vbatdetectcellvoltage * 100)));
                buffer.push(BitHelper.lowByte(Math.round(FC.BATTERY_CONFIG.vbatmincellvoltage * 100)));
                buffer.push(BitHelper.highByte(Math.round(FC.BATTERY_CONFIG.vbatmincellvoltage * 100)));
                buffer.push(BitHelper.lowByte(Math.round(FC.BATTERY_CONFIG.vbatmaxcellvoltage * 100)));
                buffer.push(BitHelper.highByte(Math.round(FC.BATTERY_CONFIG.vbatmaxcellvoltage * 100)));
                buffer.push(BitHelper.lowByte(Math.round(FC.BATTERY_CONFIG.vbatwarningcellvoltage * 100)));
                buffer.push(BitHelper.highByte(Math.round(FC.BATTERY_CONFIG.vbatwarningcellvoltage * 100)));
                buffer.push(BitHelper.lowByte(FC.BATTERY_CONFIG.current_offset));
                buffer.push(BitHelper.highByte(FC.BATTERY_CONFIG.current_offset));
                buffer.push(BitHelper.lowByte(FC.BATTERY_CONFIG.current_scale));
                buffer.push(BitHelper.highByte(FC.BATTERY_CONFIG.current_scale));
                for (let byte_index = 0; byte_index < 4; ++byte_index)
                    buffer.push(BitHelper.specificByte(FC.BATTERY_CONFIG.capacity, byte_index));
                for (let byte_index = 0; byte_index < 4; ++byte_index)
                    buffer.push(BitHelper.specificByte(FC.BATTERY_CONFIG.capacity_warning, byte_index));
                for (let byte_index = 0; byte_index < 4; ++byte_index)
                    buffer.push(BitHelper.specificByte(FC.BATTERY_CONFIG.capacity_critical, byte_index));
                buffer.push(FC.BATTERY_CONFIG.capacity_unit);
                break;

            case MSPCodes.MSP_SET_RX_CONFIG:
                buffer.push(FC.RX_CONFIG.serialrx_provider);
                buffer.push(BitHelper.lowByte(FC.RX_CONFIG.maxcheck));
                buffer.push(BitHelper.highByte(FC.RX_CONFIG.maxcheck));
                buffer.push(BitHelper.lowByte(FC.RX_CONFIG.midrc));
                buffer.push(BitHelper.highByte(FC.RX_CONFIG.midrc));
                buffer.push(BitHelper.lowByte(FC.RX_CONFIG.mincheck));
                buffer.push(BitHelper.highByte(FC.RX_CONFIG.mincheck));
                buffer.push(FC.RX_CONFIG.spektrum_sat_bind);
                buffer.push(BitHelper.lowByte(FC.RX_CONFIG.rx_min_usec));
                buffer.push(BitHelper.highByte(FC.RX_CONFIG.rx_min_usec));
                buffer.push(BitHelper.lowByte(FC.RX_CONFIG.rx_max_usec));
                buffer.push(BitHelper.highByte(FC.RX_CONFIG.rx_max_usec));
                buffer.push(0); // 4 null bytes for betaflight compatibility
                buffer.push(0);
                buffer.push(0);
                buffer.push(0);
                buffer.push(FC.RX_CONFIG.spirx_protocol);
                // spirx_id - 4 bytes
                buffer.push32(FC.RX_CONFIG.spirx_id);
                buffer.push(FC.RX_CONFIG.spirx_channel_count);
                // unused byte for fpvCamAngleDegrees, for compatiblity with betaflight
                buffer.push(0);
                // receiver type in FC.RX_CONFIG rather than in BF_CONFIG.features
                buffer.push(FC.RX_CONFIG.receiver_type);
                break;

            case MSPCodes.MSP_SET_FAILSAFE_CONFIG:
                buffer.push(FC.FAILSAFE_CONFIG.failsafe_delay);
                buffer.push(FC.FAILSAFE_CONFIG.failsafe_off_delay);
                buffer.push(BitHelper.lowByte(FC.FAILSAFE_CONFIG.failsafe_throttle));
                buffer.push(BitHelper.highByte(FC.FAILSAFE_CONFIG.failsafe_throttle));
                buffer.push(FC.FAILSAFE_CONFIG.failsafe_kill_switch);
                buffer.push(BitHelper.lowByte(FC.FAILSAFE_CONFIG.failsafe_throttle_low_delay));
                buffer.push(BitHelper.highByte(FC.FAILSAFE_CONFIG.failsafe_throttle_low_delay));
                buffer.push(FC.FAILSAFE_CONFIG.failsafe_procedure);
                buffer.push(FC.FAILSAFE_CONFIG.failsafe_recovery_delay);
                buffer.push(BitHelper.lowByte(FC.FAILSAFE_CONFIG.failsafe_fw_roll_angle));
                buffer.push(BitHelper.highByte(FC.FAILSAFE_CONFIG.failsafe_fw_roll_angle));
                buffer.push(BitHelper.lowByte(FC.FAILSAFE_CONFIG.failsafe_fw_pitch_angle));
                buffer.push(BitHelper.highByte(FC.FAILSAFE_CONFIG.failsafe_fw_pitch_angle));
                buffer.push(BitHelper.lowByte(FC.FAILSAFE_CONFIG.failsafe_fw_yaw_rate));
                buffer.push(BitHelper.highByte(FC.FAILSAFE_CONFIG.failsafe_fw_yaw_rate));
                buffer.push(BitHelper.lowByte(FC.FAILSAFE_CONFIG.failsafe_stick_motion_threshold));
                buffer.push(BitHelper.highByte(FC.FAILSAFE_CONFIG.failsafe_stick_motion_threshold));
                buffer.push(BitHelper.lowByte(FC.FAILSAFE_CONFIG.failsafe_min_distance));
                buffer.push(BitHelper.highByte(FC.FAILSAFE_CONFIG.failsafe_min_distance));
                buffer.push(FC.FAILSAFE_CONFIG.failsafe_min_distance_procedure);
                break;

            case MSPCodes.MSP2_SET_CF_SERIAL_CONFIG:
                console.log('will crunch', FC.SERIAL_CONFIG);
                for (let i = 0; i < FC.SERIAL_CONFIG.ports.length; i++) {
                    var serialPort = FC.SERIAL_CONFIG.ports[i];

                    buffer.push(serialPort.identifier);

                    var functionMask = serialPortHelper.functionsToMask(serialPort.functions);
                    buffer.push(BitHelper.specificByte(functionMask, 0));
                    buffer.push(BitHelper.specificByte(functionMask, 1));
                    buffer.push(BitHelper.specificByte(functionMask, 2));
                    buffer.push(BitHelper.specificByte(functionMask, 3));

                    var BAUD_RATES = mspHelper.BAUD_RATES_post1_6_3;
                    buffer.push(BAUD_RATES.indexOf(serialPort.msp_baudrate));
                    buffer.push(BAUD_RATES.indexOf(serialPort.sensors_baudrate));
                    buffer.push(BAUD_RATES.indexOf(serialPort.telemetry_baudrate));
                    buffer.push(BAUD_RATES.indexOf(serialPort.peripherals_baudrate));
                }
                break;

            case MSPCodes.MSP_SET_3D:
                buffer.push(BitHelper.lowByte(FC.REVERSIBLE_MOTORS.deadband_low));
                buffer.push(BitHelper.highByte(FC.REVERSIBLE_MOTORS.deadband_low));
                buffer.push(BitHelper.lowByte(FC.REVERSIBLE_MOTORS.deadband_high));
                buffer.push(BitHelper.highByte(FC.REVERSIBLE_MOTORS.deadband_high));
                buffer.push(BitHelper.lowByte(FC.REVERSIBLE_MOTORS.neutral));
                buffer.push(BitHelper.highByte(FC.REVERSIBLE_MOTORS.neutral));
                break;

            case MSPCodes.MSP_SET_RC_DEADBAND:
                buffer.push(FC.RC_deadband.deadband);
                buffer.push(FC.RC_deadband.yaw_deadband);
                buffer.push(FC.RC_deadband.alt_hold_deadband);
                buffer.push(BitHelper.lowByte(FC.REVERSIBLE_MOTORS.deadband_throttle));
                buffer.push(BitHelper.highByte(FC.REVERSIBLE_MOTORS.deadband_throttle));
                break;

            case MSPCodes.MSP_SET_SENSOR_ALIGNMENT:
                buffer.push(FC.SENSOR_ALIGNMENT.align_gyro);
                buffer.push(FC.SENSOR_ALIGNMENT.align_acc);
                buffer.push(FC.SENSOR_ALIGNMENT.align_mag);
                buffer.push(FC.SENSOR_ALIGNMENT.align_opflow);
                break;

            case MSPCodes.MSP_SET_ADVANCED_CONFIG:
                buffer.push(FC.ADVANCED_CONFIG.gyroSyncDenominator);
                buffer.push(FC.ADVANCED_CONFIG.pidProcessDenom);
                buffer.push(FC.ADVANCED_CONFIG.useUnsyncedPwm);
                buffer.push(FC.ADVANCED_CONFIG.motorPwmProtocol);

                buffer.push(BitHelper.lowByte(FC.ADVANCED_CONFIG.motorPwmRate));
                buffer.push(BitHelper.highByte(FC.ADVANCED_CONFIG.motorPwmRate));

                buffer.push(BitHelper.lowByte(FC.ADVANCED_CONFIG.servoPwmRate));
                buffer.push(BitHelper.highByte(FC.ADVANCED_CONFIG.servoPwmRate));

                buffer.push(FC.ADVANCED_CONFIG.gyroSync);
                break;

            case MSPCodes.MSP_SET_INAV_PID:
                buffer.push(FC.INAV_PID_CONFIG.asynchronousMode);

                buffer.push(BitHelper.lowByte(FC.INAV_PID_CONFIG.accelerometerTaskFrequency));
                buffer.push(BitHelper.highByte(FC.INAV_PID_CONFIG.accelerometerTaskFrequency));

                buffer.push(BitHelper.lowByte(FC.INAV_PID_CONFIG.attitudeTaskFrequency));
                buffer.push(BitHelper.highByte(FC.INAV_PID_CONFIG.attitudeTaskFrequency));

                buffer.push(FC.INAV_PID_CONFIG.magHoldRateLimit);
                buffer.push(FC.INAV_PID_CONFIG.magHoldErrorLpfFrequency);

                buffer.push(BitHelper.lowByte(FC.INAV_PID_CONFIG.yawJumpPreventionLimit));
                buffer.push(BitHelper.highByte(FC.INAV_PID_CONFIG.yawJumpPreventionLimit));

                buffer.push(FC.INAV_PID_CONFIG.gyroscopeLpf);
                buffer.push(FC.INAV_PID_CONFIG.accSoftLpfHz);

                buffer.push(0); //reserved
                buffer.push(0); //reserved
                buffer.push(0); //reserved
                buffer.push(0); //reserved
                break;

            case MSPCodes.MSP_SET_NAV_POSHOLD:
                buffer.push(FC.NAV_POSHOLD.userControlMode);

                buffer.push(BitHelper.lowByte(FC.NAV_POSHOLD.maxSpeed));
                buffer.push(BitHelper.highByte(FC.NAV_POSHOLD.maxSpeed));

                buffer.push(BitHelper.lowByte(FC.NAV_POSHOLD.maxClimbRate));
                buffer.push(BitHelper.highByte(FC.NAV_POSHOLD.maxClimbRate));

                buffer.push(BitHelper.lowByte(FC.NAV_POSHOLD.maxManualSpeed));
                buffer.push(BitHelper.highByte(FC.NAV_POSHOLD.maxManualSpeed));

                buffer.push(BitHelper.lowByte(FC.NAV_POSHOLD.maxManualClimbRate));
                buffer.push(BitHelper.highByte(FC.NAV_POSHOLD.maxManualClimbRate));

                buffer.push(FC.NAV_POSHOLD.maxBankAngle);
                buffer.push(FC.NAV_POSHOLD.useThrottleMidForAlthold);

                buffer.push(BitHelper.lowByte(FC.NAV_POSHOLD.hoverThrottle));
                buffer.push(BitHelper.highByte(FC.NAV_POSHOLD.hoverThrottle));
                break;

            case MSPCodes.MSP_SET_CALIBRATION_DATA:

                buffer.push(BitHelper.lowByte(FC.CALIBRATION_DATA.accZero.X));
                buffer.push(BitHelper.highByte(FC.CALIBRATION_DATA.accZero.X));

                buffer.push(BitHelper.lowByte(FC.CALIBRATION_DATA.accZero.Y));
                buffer.push(BitHelper.highByte(FC.CALIBRATION_DATA.accZero.Y));

                buffer.push(BitHelper.lowByte(FC.CALIBRATION_DATA.accZero.Z));
                buffer.push(BitHelper.highByte(FC.CALIBRATION_DATA.accZero.Z));

                buffer.push(BitHelper.lowByte(FC.CALIBRATION_DATA.accGain.X));
                buffer.push(BitHelper.highByte(FC.CALIBRATION_DATA.accGain.X));

                buffer.push(BitHelper.lowByte(FC.CALIBRATION_DATA.accGain.Y));
                buffer.push(BitHelper.highByte(FC.CALIBRATION_DATA.accGain.Y));

                buffer.push(BitHelper.lowByte(FC.CALIBRATION_DATA.accGain.Z));
                buffer.push(BitHelper.highByte(FC.CALIBRATION_DATA.accGain.Z));

                buffer.push(BitHelper.lowByte(FC.CALIBRATION_DATA.magZero.X));
                buffer.push(BitHelper.highByte(FC.CALIBRATION_DATA.magZero.X));

                buffer.push(BitHelper.lowByte(FC.CALIBRATION_DATA.magZero.Y));
                buffer.push(BitHelper.highByte(FC.CALIBRATION_DATA.magZero.Y));

                buffer.push(BitHelper.lowByte(FC.CALIBRATION_DATA.magZero.Z));
                buffer.push(BitHelper.highByte(FC.CALIBRATION_DATA.magZero.Z));

                buffer.push(BitHelper.lowByte(Math.round(FC.CALIBRATION_DATA.opflow.Scale * 256)));
                buffer.push(BitHelper.highByte(Math.round(FC.CALIBRATION_DATA.opflow.Scale * 256)));

                buffer.push(BitHelper.lowByte(FC.CALIBRATION_DATA.magGain.X));
                buffer.push(BitHelper.highByte(FC.CALIBRATION_DATA.magGain.X));

                buffer.push(BitHelper.lowByte(FC.CALIBRATION_DATA.magGain.Y));
                buffer.push(BitHelper.highByte(FC.CALIBRATION_DATA.magGain.Y));

                buffer.push(BitHelper.lowByte(FC.CALIBRATION_DATA.magGain.Z));
                buffer.push(BitHelper.highByte(FC.CALIBRATION_DATA.magGain.Z));

                break;

            case MSPCodes.MSP_SET_RTH_AND_LAND_CONFIG:
                buffer.push(BitHelper.lowByte(FC.RTH_AND_LAND_CONFIG.minRthDistance));
                buffer.push(BitHelper.highByte(FC.RTH_AND_LAND_CONFIG.minRthDistance));

                buffer.push(FC.RTH_AND_LAND_CONFIG.rthClimbFirst);
                buffer.push(FC.RTH_AND_LAND_CONFIG.rthClimbIgnoreEmergency);
                buffer.push(FC.RTH_AND_LAND_CONFIG.rthTailFirst);
                buffer.push(FC.RTH_AND_LAND_CONFIG.rthAllowLanding);
                buffer.push(FC.RTH_AND_LAND_CONFIG.rthAltControlMode);

                buffer.push(BitHelper.lowByte(FC.RTH_AND_LAND_CONFIG.rthAbortThreshold));
                buffer.push(BitHelper.highByte(FC.RTH_AND_LAND_CONFIG.rthAbortThreshold));

                buffer.push(BitHelper.lowByte(FC.RTH_AND_LAND_CONFIG.rthAltitude));
                buffer.push(BitHelper.highByte(FC.RTH_AND_LAND_CONFIG.rthAltitude));

                buffer.push(BitHelper.lowByte(FC.RTH_AND_LAND_CONFIG.landMinAltVspd));
                buffer.push(BitHelper.highByte(FC.RTH_AND_LAND_CONFIG.landMinAltVspd));

                buffer.push(BitHelper.lowByte(FC.RTH_AND_LAND_CONFIG.landMaxAltVspd));
                buffer.push(BitHelper.highByte(FC.RTH_AND_LAND_CONFIG.landMaxAltVspd));

                buffer.push(BitHelper.lowByte(FC.RTH_AND_LAND_CONFIG.landSlowdownMinAlt));
                buffer.push(BitHelper.highByte(FC.RTH_AND_LAND_CONFIG.landSlowdownMinAlt));

                buffer.push(BitHelper.lowByte(FC.RTH_AND_LAND_CONFIG.landSlowdownMaxAlt));
                buffer.push(BitHelper.highByte(FC.RTH_AND_LAND_CONFIG.landSlowdownMaxAlt));

                buffer.push(BitHelper.lowByte(FC.RTH_AND_LAND_CONFIG.emergencyDescentRate));
                buffer.push(BitHelper.highByte(FC.RTH_AND_LAND_CONFIG.emergencyDescentRate));
                break;

            case MSPCodes.MSP_SET_FW_CONFIG:

                buffer.push(BitHelper.lowByte(FC.FW_CONFIG.cruiseThrottle));
                buffer.push(BitHelper.highByte(FC.FW_CONFIG.cruiseThrottle));

                buffer.push(BitHelper.lowByte(FC.FW_CONFIG.minThrottle));
                buffer.push(BitHelper.highByte(FC.FW_CONFIG.minThrottle));

                buffer.push(BitHelper.lowByte(FC.FW_CONFIG.maxThrottle));
                buffer.push(BitHelper.highByte(FC.FW_CONFIG.maxThrottle));

                buffer.push(FC.FW_CONFIG.maxBankAngle);
                buffer.push(FC.FW_CONFIG.maxClimbAngle);
                buffer.push(FC.FW_CONFIG.maxDiveAngle);
                buffer.push(FC.FW_CONFIG.pitchToThrottle);

                buffer.push(BitHelper.lowByte(FC.FW_CONFIG.loiterRadius));
                buffer.push(BitHelper.highByte(FC.FW_CONFIG.loiterRadius));

                break;

            case MSPCodes.MSP_SET_FILTER_CONFIG:
                buffer.push(FC.FILTER_CONFIG.gyroSoftLpfHz);

                buffer.push(BitHelper.lowByte(FC.FILTER_CONFIG.dtermLpfHz));
                buffer.push(BitHelper.highByte(FC.FILTER_CONFIG.dtermLpfHz));

                buffer.push(BitHelper.lowByte(FC.FILTER_CONFIG.yawLpfHz));
                buffer.push(BitHelper.highByte(FC.FILTER_CONFIG.yawLpfHz));

                buffer.push(BitHelper.lowByte(FC.FILTER_CONFIG.gyroNotchHz1));
                buffer.push(BitHelper.highByte(FC.FILTER_CONFIG.gyroNotchHz1));

                buffer.push(BitHelper.lowByte(FC.FILTER_CONFIG.gyroNotchCutoff1));
                buffer.push(BitHelper.highByte(FC.FILTER_CONFIG.gyroNotchCutoff1));

                buffer.push(BitHelper.lowByte(FC.FILTER_CONFIG.dtermNotchHz));
                buffer.push(BitHelper.highByte(FC.FILTER_CONFIG.dtermNotchHz));

                buffer.push(BitHelper.lowByte(FC.FILTER_CONFIG.dtermNotchCutoff));
                buffer.push(BitHelper.highByte(FC.FILTER_CONFIG.dtermNotchCutoff));

                buffer.push(BitHelper.lowByte(FC.FILTER_CONFIG.gyroNotchHz2));
                buffer.push(BitHelper.highByte(FC.FILTER_CONFIG.gyroNotchHz2));

                buffer.push(BitHelper.lowByte(FC.FILTER_CONFIG.gyroNotchCutoff2));
                buffer.push(BitHelper.highByte(FC.FILTER_CONFIG.gyroNotchCutoff2));

                buffer.push(BitHelper.lowByte(FC.FILTER_CONFIG.accNotchHz));
                buffer.push(BitHelper.highByte(FC.FILTER_CONFIG.accNotchHz));

                buffer.push(BitHelper.lowByte(FC.FILTER_CONFIG.accNotchCutoff));
                buffer.push(BitHelper.highByte(FC.FILTER_CONFIG.accNotchCutoff));

                buffer.push(BitHelper.lowByte(FC.FILTER_CONFIG.gyroStage2LowpassHz));
                buffer.push(BitHelper.highByte(FC.FILTER_CONFIG.gyroStage2LowpassHz));

                break;

            case MSPCodes.MSP_SET_PID_ADVANCED:
                buffer.push(BitHelper.lowByte(FC.PID_ADVANCED.rollPitchItermIgnoreRate));
                buffer.push(BitHelper.highByte(FC.PID_ADVANCED.rollPitchItermIgnoreRate));

                buffer.push(BitHelper.lowByte(FC.PID_ADVANCED.yawItermIgnoreRate));
                buffer.push(BitHelper.highByte(FC.PID_ADVANCED.yawItermIgnoreRate));

                buffer.push(BitHelper.lowByte(FC.PID_ADVANCED.yawPLimit));
                buffer.push(BitHelper.highByte(FC.PID_ADVANCED.yawPLimit));

                buffer.push(0); //BF: currentProfile->pidProfile.deltaMethod
                buffer.push(0); //BF: currentProfile->pidProfile.vbatPidCompensation
                buffer.push(0); //BF: currentProfile->pidProfile.setpointRelaxRatio

                buffer.push(FC.PID_ADVANCED.dtermSetpointWeight);
                buffer.push(BitHelper.lowByte(FC.PID_ADVANCED.pidSumLimit));
                buffer.push(BitHelper.highByte(FC.PID_ADVANCED.pidSumLimit));

                buffer.push(0); //BF: currentProfile->pidProfile.itermThrottleGain

                buffer.push(BitHelper.lowByte(FC.PID_ADVANCED.axisAccelerationLimitRollPitch));
                buffer.push(BitHelper.highByte(FC.PID_ADVANCED.axisAccelerationLimitRollPitch));

                buffer.push(BitHelper.lowByte(FC.PID_ADVANCED.axisAccelerationLimitYaw));
                buffer.push(BitHelper.highByte(FC.PID_ADVANCED.axisAccelerationLimitYaw));
                break;

            case MSPCodes.MSP_SET_SENSOR_CONFIG:
                buffer.push(FC.SENSOR_CONFIG.accelerometer);
                buffer.push(FC.SENSOR_CONFIG.barometer);
                buffer.push(FC.SENSOR_CONFIG.magnetometer);
                buffer.push(FC.SENSOR_CONFIG.pitot);
                buffer.push(FC.SENSOR_CONFIG.rangefinder);
                buffer.push(FC.SENSOR_CONFIG.opflow);
                break;


            case MSPCodes.MSP_WP_MISSION_SAVE:
                buffer.push(0);
                break;

            case MSPCodes.MSP_WP_MISSION_LOAD:
                buffer.push(0);
                break;

            case MSPCodes.MSP2_INAV_SET_MIXER:
                buffer.push(FC.MIXER_CONFIG.yawMotorDirection);
                buffer.push(FC.MIXER_CONFIG.yawJumpPreventionLimit);
                buffer.push(FC.MIXER_CONFIG.motorStopOnLow);
                buffer.push(FC.MIXER_CONFIG.platformType);
                buffer.push(FC.MIXER_CONFIG.hasFlaps);
                buffer.push(BitHelper.lowByte(FC.MIXER_CONFIG.appliedMixerPreset));
                buffer.push(BitHelper.highByte(FC.MIXER_CONFIG.appliedMixerPreset));
                buffer.push(0); //Filler byte to match expect payload length
                buffer.push(0); //Filler byte to match expect payload length
                break;

            case MSPCodes.MSP2_INAV_SET_MC_BRAKING:
                buffer.push(BitHelper.lowByte(FC.BRAKING_CONFIG.speedThreshold));
                buffer.push(BitHelper.highByte(FC.BRAKING_CONFIG.speedThreshold));
                buffer.push(BitHelper.lowByte(FC.BRAKING_CONFIG.disengageSpeed));
                buffer.push(BitHelper.highByte(FC.BRAKING_CONFIG.disengageSpeed));
                buffer.push(BitHelper.lowByte(FC.BRAKING_CONFIG.timeout));
                buffer.push(BitHelper.highByte(FC.BRAKING_CONFIG.timeout));

                buffer.push(FC.BRAKING_CONFIG.boostFactor);

                buffer.push(BitHelper.lowByte(FC.BRAKING_CONFIG.boostTimeout));
                buffer.push(BitHelper.highByte(FC.BRAKING_CONFIG.boostTimeout));
                buffer.push(BitHelper.lowByte(FC.BRAKING_CONFIG.boostSpeedThreshold));
                buffer.push(BitHelper.highByte(FC.BRAKING_CONFIG.boostSpeedThreshold));
                buffer.push(BitHelper.lowByte(FC.BRAKING_CONFIG.boostDisengageSpeed));
                buffer.push(BitHelper.highByte(FC.BRAKING_CONFIG.boostDisengageSpeed));

                buffer.push(FC.BRAKING_CONFIG.bankAngle);
                break;

            case MSPCodes.MSP2_INAV_SET_RATE_DYNAMICS:
                buffer.push(FC.RATE_DYNAMICS.sensitivityCenter);
                buffer.push(FC.RATE_DYNAMICS.sensitivityEnd);
                buffer.push(FC.RATE_DYNAMICS.correctionCenter);
                buffer.push(FC.RATE_DYNAMICS.correctionEnd);
                buffer.push(FC.RATE_DYNAMICS.weightCenter);
                buffer.push(FC.RATE_DYNAMICS.weightEnd);
                break;

            case MSPCodes.MSP2_INAV_EZ_TUNE_SET:

                buffer.push(FC.EZ_TUNE.enabled);
                buffer.push(BitHelper.lowByte(FC.EZ_TUNE.filterHz));
                buffer.push(BitHelper.highByte(FC.EZ_TUNE.filterHz));
                buffer.push(FC.EZ_TUNE.axisRatio);
                buffer.push(FC.EZ_TUNE.response);
                buffer.push(FC.EZ_TUNE.damping);
                buffer.push(FC.EZ_TUNE.stability);
                buffer.push(FC.EZ_TUNE.aggressiveness);
                buffer.push(FC.EZ_TUNE.rate);
                buffer.push(FC.EZ_TUNE.expo);
                buffer.push(FC.EZ_TUNE.snappiness);
                break;


            default:
                return false;
        }

        return buffer;
    };

    /**
     * Set raw Rx values over MSP protocol.
     *
     * Channels is an array of 16-bit unsigned integer channel values to be sent. 8 channels is probably the maximum.
     */
    self.setRawRx = function (channels) {
        var buffer = [];

        for (var i = 0; i < channels.length; i++) {
            buffer.push(BitHelper.specificByte(channels[i], 0));
            buffer.push(BitHelper.specificByte(channels[i], 1));
        }

        MSP.send_message(MSPCodes.MSP_SET_RAW_RC, buffer, false);
    };

    self.sendBlackboxConfiguration = function (onDataCallback) {
        var buffer = [];
        var messageId = MSPCodes.MSP_SET_BLACKBOX_CONFIG;
        buffer.push(FC.BLACKBOX.blackboxDevice & 0xFF);
        messageId = MSPCodes.MSP2_SET_BLACKBOX_CONFIG;
        buffer.push(BitHelper.lowByte(FC.BLACKBOX.blackboxRateNum));
        buffer.push(BitHelper.highByte(FC.BLACKBOX.blackboxRateNum));
        buffer.push(BitHelper.lowByte(FC.BLACKBOX.blackboxRateDenom));
        buffer.push(BitHelper.highByte(FC.BLACKBOX.blackboxRateDenom));
        buffer.push32(FC.BLACKBOX.blackboxIncludeFlags);
        //noinspection JSUnusedLocalSymbols
        MSP.send_message(messageId, buffer, false, function (response) {
            onDataCallback();
        });
    };

    self.sendServoConfigurations = function (onCompleteCallback) {
        var nextFunction = send_next_servo_configuration;

        var servoIndex = 0;

        if (FC.SERVO_CONFIG.length == 0) {
            onCompleteCallback();
        } else {
            nextFunction();
        }

        function send_next_servo_configuration() {

            var buffer = [];

            // send one at a time, with index

            var servoConfiguration = FC.SERVO_CONFIG[servoIndex];

            buffer.push(servoIndex);

            buffer.push(BitHelper.lowByte(servoConfiguration.min));
            buffer.push(BitHelper.highByte(servoConfiguration.min));

            buffer.push(BitHelper.lowByte(servoConfiguration.max));
            buffer.push(BitHelper.highByte(servoConfiguration.max));

            buffer.push(BitHelper.lowByte(servoConfiguration.middle));
            buffer.push(BitHelper.highByte(servoConfiguration.middle));

            buffer.push(BitHelper.lowByte(servoConfiguration.rate));

            // prepare for next iteration
            servoIndex++;
            if (servoIndex == FC.SERVO_CONFIG.length) {
                nextFunction = onCompleteCallback;
            }
            MSP.send_message(MSPCodes.MSP2_INAV_SET_SERVO_CONFIG, buffer, false, nextFunction);
        }
    };

    self.sendServoMixer = function (onCompleteCallback) {
        var nextFunction = sendMixer,
            servoIndex = 0;

        if (FC.SERVO_RULES.length == 0) {
            onCompleteCallback();
        } else {
            nextFunction();
        }

        function sendMixer() {

            var buffer = [];

            // send one at a time, with index

            var servoRule = FC.SERVO_RULES.get()[servoIndex];

            //INAV 2.2 uses different MSP frame
            buffer.push(servoIndex);
            buffer.push(servoRule.getTarget());
            buffer.push(servoRule.getInput());
            buffer.push(BitHelper.lowByte(servoRule.getRate()));
            buffer.push(BitHelper.highByte(servoRule.getRate()));
            buffer.push(servoRule.getSpeed());
            buffer.push(servoRule.getConditionId());

            // prepare for next iteration
            servoIndex++;
            if (servoIndex == FC.SERVO_RULES.getServoRulesCount()) { //This is the last rule. Not pretty, but we have to send all rules
                nextFunction = onCompleteCallback;
            }
            MSP.send_message(MSPCodes.MSP2_INAV_SET_SERVO_MIXER, buffer, false, nextFunction);
        }
    };

    self.sendMotorMixer = function (onCompleteCallback) {

        var nextFunction = sendMixer,
            servoIndex = 0;

        if (FC.MOTOR_RULES.length === 0) {
            onCompleteCallback();
        } else {
            nextFunction();
        }

        function sendMixer() {

            var buffer = [];

            // send one at a time, with index

            var rule = FC.MOTOR_RULES.get()[servoIndex];

            if (rule) {

                buffer.push(servoIndex);

                buffer.push(BitHelper.lowByte(rule.getThrottleForMsp()));
                buffer.push(BitHelper.highByte(rule.getThrottleForMsp()));

                buffer.push(BitHelper.lowByte(rule.getRollForMsp()));
                buffer.push(BitHelper.highByte(rule.getRollForMsp()));

                buffer.push(BitHelper.lowByte(rule.getPitchForMsp()));
                buffer.push(BitHelper.highByte(rule.getPitchForMsp()));

                buffer.push(BitHelper.lowByte(rule.getYawForMsp()));
                buffer.push(BitHelper.highByte(rule.getYawForMsp()));

                // prepare for next iteration
                servoIndex++;
                if (servoIndex == FC.MOTOR_RULES.getMotorCount()) { //This is the last rule. Not pretty, but we have to send all rules
                    nextFunction = onCompleteCallback;
                }
                MSP.send_message(MSPCodes.MSP2_COMMON_SET_MOTOR_MIXER, buffer, false, nextFunction);
            } else {
                onCompleteCallback();
            }
        }
    };

    self.loadLogicConditions = function (callback) {
        if (semver.gte(FC.CONFIG.flightControllerVersion, "5.0.0")) {
            FC.LOGIC_CONDITIONS.flush();
            let idx = 0;
            MSP.send_message(MSPCodes.MSP2_INAV_LOGIC_CONDITIONS_SINGLE, [idx], false, nextLogicCondition);

            function nextLogicCondition() {
                idx++;
                if (idx < FC.LOGIC_CONDITIONS.getMaxLogicConditionCount() - 1) {
                    MSP.send_message(MSPCodes.MSP2_INAV_LOGIC_CONDITIONS_SINGLE, [idx], false, nextLogicCondition);
                } else {
                    MSP.send_message(MSPCodes.MSP2_INAV_LOGIC_CONDITIONS_SINGLE, [idx], false, callback);
                }
            }
        } else {
            MSP.send_message(MSPCodes.MSP2_INAV_LOGIC_CONDITIONS, false, false, callback);
        }
    }

    self.sendLogicConditions = function (onCompleteCallback) {
        let nextFunction = sendCondition,
            conditionIndex = 0;

        if (FC.LOGIC_CONDITIONS.getCount() == 0) {
            onCompleteCallback();
        } else {
            nextFunction();
        }

        function sendCondition() {

            let buffer = [];

            // send one at a time, with index, 14 bytes per one condition

            let condition = FC.LOGIC_CONDITIONS.get()[conditionIndex];

            buffer.push(conditionIndex);
            buffer.push(condition.getEnabled());
            buffer.push(condition.getActivatorId());
            buffer.push(condition.getOperation());
            buffer.push(condition.getOperandAType());
            buffer.push(BitHelper.specificByte(condition.getOperandAValue(), 0));
            buffer.push(BitHelper.specificByte(condition.getOperandAValue(), 1));
            buffer.push(BitHelper.specificByte(condition.getOperandAValue(), 2));
            buffer.push(BitHelper.specificByte(condition.getOperandAValue(), 3));
            buffer.push(condition.getOperandBType());
            buffer.push(BitHelper.specificByte(condition.getOperandBValue(), 0));
            buffer.push(BitHelper.specificByte(condition.getOperandBValue(), 1));
            buffer.push(BitHelper.specificByte(condition.getOperandBValue(), 2));
            buffer.push(BitHelper.specificByte(condition.getOperandBValue(), 3));
            buffer.push(condition.getFlags());

            // prepare for next iteration
            conditionIndex++;
            if (conditionIndex == FC.LOGIC_CONDITIONS.getCount()) { //This is the last rule. Not pretty, but we have to send all rules
                nextFunction = onCompleteCallback;
            }
            MSP.send_message(MSPCodes.MSP2_INAV_SET_LOGIC_CONDITIONS, buffer, false, nextFunction);
        }
    };

    self.loadProgrammingPid = function (callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_PROGRAMMING_PID, false, false, callback);
    }

    self.sendProgrammingPid = function (onCompleteCallback) {
        let nextFunction = sendPid,
            pidIndex = 0;

        if (FC.PROGRAMMING_PID.getCount() == 0) {
            onCompleteCallback();
        } else {
            nextFunction();
        }

        function sendPid() {

            let buffer = [];

            // send one at a time, with index, 20 bytes per one condition

            let pid = FC.PROGRAMMING_PID.get()[pidIndex];

            buffer.push(pidIndex);
            buffer.push(pid.getEnabled());
            buffer.push(pid.getSetpointType());
            buffer.push(BitHelper.specificByte(pid.getSetpointValue(), 0));
            buffer.push(BitHelper.specificByte(pid.getSetpointValue(), 1));
            buffer.push(BitHelper.specificByte(pid.getSetpointValue(), 2));
            buffer.push(BitHelper.specificByte(pid.getSetpointValue(), 3));
            buffer.push(pid.getMeasurementType());
            buffer.push(BitHelper.specificByte(pid.getMeasurementValue(), 0));
            buffer.push(BitHelper.specificByte(pid.getMeasurementValue(), 1));
            buffer.push(BitHelper.specificByte(pid.getMeasurementValue(), 2));
            buffer.push(BitHelper.specificByte(pid.getMeasurementValue(), 3));
            buffer.push(BitHelper.specificByte(pid.getGainP(), 0));
            buffer.push(BitHelper.specificByte(pid.getGainP(), 1));
            buffer.push(BitHelper.specificByte(pid.getGainI(), 0));
            buffer.push(BitHelper.specificByte(pid.getGainI(), 1));
            buffer.push(BitHelper.specificByte(pid.getGainD(), 0));
            buffer.push(BitHelper.specificByte(pid.getGainD(), 1));
            buffer.push(BitHelper.specificByte(pid.getGainFF(), 0));
            buffer.push(BitHelper.specificByte(pid.getGainFF(), 1));

            // prepare for next iteration
            pidIndex++;
            if (pidIndex == FC.PROGRAMMING_PID.getCount()) { //This is the last rule. Not pretty, but we have to send all rules
                nextFunction = onCompleteCallback;
            }
            MSP.send_message(MSPCodes.MSP2_INAV_SET_PROGRAMMING_PID, buffer, false, nextFunction);
        }
    };

    self.loadOsdCustomElements = function (callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_CUSTOM_OSD_ELEMENTS, false, false, nextCustomOSDElement);

        var cosdeIdx = 0;

        function nextCustomOSDElement() {
            if (cosdeIdx < FC.OSD_CUSTOM_ELEMENTS .settings.customElementsCount - 1) {
                MSP.send_message(MSPCodes.MSP2_INAV_CUSTOM_OSD_ELEMENT, [cosdeIdx++], false, nextCustomOSDElement);
            } else {
                MSP.send_message(MSPCodes.MSP2_INAV_CUSTOM_OSD_ELEMENT, [cosdeIdx++], false, callback);
            }
        }
    }

    self.sendModeRanges = function (onCompleteCallback) {
        var nextFunction = send_next_mode_range;

        var modeRangeIndex = 0;

        if (FC.MODE_RANGES.length == 0) {
            onCompleteCallback();
        } else {
            send_next_mode_range();
        }

        function send_next_mode_range() {

            var modeRange = FC.MODE_RANGES[modeRangeIndex];

            var buffer = [];
            buffer.push(modeRangeIndex);
            buffer.push(modeRange.id);
            buffer.push(modeRange.auxChannelIndex);
            buffer.push((modeRange.range.start - 900) / 25);
            buffer.push((modeRange.range.end - 900) / 25);

            // prepare for next iteration
            modeRangeIndex++;
            if (modeRangeIndex == FC.MODE_RANGES.length) {
                nextFunction = onCompleteCallback;

            }
            MSP.send_message(MSPCodes.MSP_SET_MODE_RANGE, buffer, false, nextFunction);
        }
    };

    /**
     * Send a request to read a block of data from the dataflash at the given address and pass that address and a ArrayBuffer
     * of the returned data to the given callback (or null for the data if an error occured).
     */
    self.dataflashRead = function (address, onDataCallback) {
        var buffer = [];
        buffer.push(address & 0xFF);
        buffer.push((address >> 8) & 0xFF);
        buffer.push((address >> 16) & 0xFF);
        buffer.push((address >> 24) & 0xFF);

        // For API > 2.0.0 we support requesting payload size - request 4KiB and let firmware decide what actual size to send
        if (FC.CONFIG.apiVersion && semver.gte(FC.CONFIG.apiVersion, "2.0.0")) {
            buffer.push(BitHelper.lowByte(4096));
            buffer.push(BitHelper.highByte(4096));
        }

        MSP.send_message(MSPCodes.MSP_DATAFLASH_READ, buffer, false, function (response) {
            var chunkAddress = response.data.getUint32(0, 1);

            // Verify that the address of the memory returned matches what the caller asked for
            if (chunkAddress == address) {
                /* Strip that address off the front of the reply and deliver it separately so the caller doesn't have to
                 * figure out the reply format:
                 */
                onDataCallback(address, response.data.buffer.slice(4));
            } else {
                // Report error
                onDataCallback(address, null);
            }
        });
    };

    self.sendServoMixRules = function (onCompleteCallback) {
        // TODO implement
        onCompleteCallback();
    };

    self.sendAdjustmentRanges = function (onCompleteCallback) {
        var nextFunction = send_next_adjustment_range;

        var adjustmentRangeIndex = 0;

        if (FC.ADJUSTMENT_RANGES.length == 0) {
            onCompleteCallback();
        } else {
            send_next_adjustment_range();
        }


        function send_next_adjustment_range() {

            var adjustmentRange = FC.ADJUSTMENT_RANGES[adjustmentRangeIndex];

            var buffer = [];
            buffer.push(adjustmentRangeIndex);
            buffer.push(adjustmentRange.slotIndex);
            buffer.push(adjustmentRange.auxChannelIndex);
            buffer.push((adjustmentRange.range.start - 900) / 25);
            buffer.push((adjustmentRange.range.end - 900) / 25);
            buffer.push(adjustmentRange.adjustmentFunction);
            buffer.push(adjustmentRange.auxSwitchChannelIndex);

            // prepare for next iteration
            adjustmentRangeIndex++;
            if (adjustmentRangeIndex == FC.ADJUSTMENT_RANGES.length) {
                nextFunction = onCompleteCallback;

            }
            MSP.send_message(MSPCodes.MSP_SET_ADJUSTMENT_RANGE, buffer, false, nextFunction);
        }
    };

    self.sendLedStripColors = function (onCompleteCallback) {
        if (FC.LED_COLORS.length == 0) {
            onCompleteCallback();
        } else {
            var buffer = [];

            for (var colorIndex = 0; colorIndex < FC.LED_COLORS.length; colorIndex++) {
                var color = FC.LED_COLORS[colorIndex];

                buffer.push(BitHelper.specificByte(color.h, 0));
                buffer.push(BitHelper.specificByte(color.h, 1));
                buffer.push(color.s);
                buffer.push(color.v);
            }
            MSP.send_message(MSPCodes.MSP_SET_LED_COLORS, buffer, false, onCompleteCallback);
        }
    };

    self.sendLedStripConfig = function (onCompleteCallback) {

        var nextFunction = send_next_led_strip_config;

        var ledIndex = 0;

        if (FC.LED_STRIP.length == 0) {
            onCompleteCallback();
        } else {
            send_next_led_strip_config();
        }

        function send_next_led_strip_config() {

            var led = FC.LED_STRIP[ledIndex];
            /*
             var led = {
             directions: directions,
             functions: functions,
             x: data.getUint8(offset++, 1),
             y: data.getUint8(offset++, 1),
             color: data.getUint8(offset++, 1)
             };
             */
            var buffer = [],
                directionLetterIndex,
                functionLetterIndex,
                bitIndex;

            buffer.push(ledIndex);

            var mask = 0;
            var extra = 0;
            /*
                ledDirectionLetters:        ['n', 'e', 's', 'w', 'u', 'd'],      // in LSB bit order
                ledFunctionLetters:         ['i', 'w', 'f', 'a', 't', 'r', 'c', 'g', 's', 'b', 'l'], // in LSB bit order
                ledBaseFunctionLetters:     ['c', 'f', 'a', 'l', 's', 'g', 'r', 'h'], // in LSB bit
                ledOverlayLetters:          ['t', 'o', 'b', 'n', 'i', 'w', 'e'], // in LSB bit

                */
            mask |= (led.y << 0);
            mask |= (led.x << 4);

            for (functionLetterIndex = 0; functionLetterIndex < led.functions.length; functionLetterIndex++) {
                var fnIndex = MSP.ledBaseFunctionLetters.indexOf(led.functions[functionLetterIndex]);
                if (fnIndex >= 0) {
                    mask |= (fnIndex << 8);
                    break;
                }
            }

            for (var overlayLetterIndex = 0; overlayLetterIndex < led.functions.length; overlayLetterIndex++) {

                bitIndex = MSP.ledOverlayLetters.indexOf(led.functions[overlayLetterIndex]);
                if (bitIndex >= 0) {
                    mask |= BitHelper.bit_set(mask, bitIndex + 16);
                }

            }

            mask |= (led.color << 24);

            for (directionLetterIndex = 0; directionLetterIndex < led.directions.length; directionLetterIndex++) {

                bitIndex = MSP.ledDirectionLetters.indexOf(led.directions[directionLetterIndex]);
                if (bitIndex >= 0) {
                    if(bitIndex < 4) {
                        mask |= BitHelper.bit_set(mask, bitIndex + 28);
                    } else {
                        extra |= BitHelper.bit_set(extra, bitIndex - 4);
                    }
                }
            }

            extra |= (0 << 2); // parameters

            buffer.push(BitHelper.specificByte(mask, 0));
            buffer.push(BitHelper.specificByte(mask, 1));
            buffer.push(BitHelper.specificByte(mask, 2));
            buffer.push(BitHelper.specificByte(mask, 3));
            buffer.push(BitHelper.specificByte(extra, 0));

            // prepare for next iteration
            ledIndex++;
            if (ledIndex == FC.LED_STRIP.length) {
                nextFunction = onCompleteCallback;
            }

            MSP.send_message(MSPCodes.MSP2_INAV_SET_LED_STRIP_CONFIG_EX, buffer, false, nextFunction);
        }
    };

    self.sendLedStripModeColors = function (onCompleteCallback) {

        var nextFunction = send_next_led_strip_mode_color;
        var index = 0;

        if (FC.LED_MODE_COLORS.length == 0) {
            onCompleteCallback();
        } else {
            send_next_led_strip_mode_color();
        }

        function send_next_led_strip_mode_color() {
            var buffer = [];

            var mode_color = FC.LED_MODE_COLORS[index];

            buffer.push(mode_color.mode);
            buffer.push(mode_color.direction);
            buffer.push(mode_color.color);

            // prepare for next iteration
            index++;
            if (index == FC.LED_MODE_COLORS.length) {
                nextFunction = onCompleteCallback;
            }

            MSP.send_message(MSPCodes.MSP_SET_LED_STRIP_MODECOLOR, buffer, false, nextFunction);
        }
    };

    /*
     * Basic sending methods used for chaining purposes
     */

    self.loadINAVPidConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_INAV_PID, false, false, callback);
    };

    self.loadAdvancedConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_ADVANCED_CONFIG, false, false, callback);
    };

    self.loadFilterConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_FILTER_CONFIG, false, false, callback);
    };

    self.loadPidAdvanced = function (callback) {
        MSP.send_message(MSPCodes.MSP_PID_ADVANCED, false, false, callback);
    };

    self.loadRcTuningData = function (callback) {
        MSP.send_message(MSPCodes.MSP_RC_TUNING, false, false, callback);
    };

    self.loadRateProfileData = function (callback) {
        MSP.send_message(MSPCodes.MSPV2_INAV_RATE_PROFILE, false, false, callback);
    };

    self.loadPidData = function (callback) {
        MSP.send_message(MSPCodes.MSP2_PID, false, false, callback);
    };

    self.loadPidNames = function (callback) {
        MSP.send_message(MSPCodes.MSP_PIDNAMES, false, false, callback);
    };

    self.loadFeatures = function (callback) {
        MSP.send_message(MSPCodes.MSP_FEATURE, false, false, callback);
    };

    self.loadBoardAlignment = function (callback) {
        MSP.send_message(MSPCodes.MSP_BOARD_ALIGNMENT, false, false, callback);
    };

    self.loadCurrentMeterConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_CURRENT_METER_CONFIG, false, false, callback);
    };

    self.queryFcStatus = function (callback) {
        MSP.send_message(MSPCodes.MSPV2_INAV_STATUS, false, false, callback);
    };

    self.loadMiscV2 = function (callback) {
        MSP.send_message(MSPCodes.MSPV2_INAV_MISC, false, false, callback);
    };

    self.loadOutputMapping = function (callback) {
        alert('Obsolete MSPHelper.loadOutputMapping call');
        MSP.send_message(MSPCodes.MSPV2_INAV_OUTPUT_MAPPING, false, false, callback);
    };

    self.loadOutputMappingExt = function (callback) {
        MSP.send_message(MSPCodes.MSPV2_INAV_OUTPUT_MAPPING_EXT2, false, false, callback);
    };

    self.loadTimerOutputModes = function(callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_TIMER_OUTPUT_MODE, false, false, callback);
    }

    self.sendTimerOutputModes = function(onCompleteCallback) {
        var nextFunction = send_next_output_mode;
        var idIndex = 0;

        var overrideIds = FC.OUTPUT_MAPPING.getUsedTimerIds();

        if (overrideIds.length == 0) {
            onCompleteCallback();
        } else {
            send_next_output_mode();
        }

        function send_next_output_mode() {

            var timerId = overrideIds[idIndex];

            var outputMode = FC.OUTPUT_MAPPING.getTimerOverride(timerId);

            var buffer = [];
            buffer.push(timerId);
            buffer.push(outputMode);

            // prepare for next iteration
            idIndex++;
            if (idIndex == overrideIds.length) {
                nextFunction = onCompleteCallback;

            }
            MSP.send_message(MSPCodes.MSP2_INAV_SET_TIMER_OUTPUT_MODE, buffer, false, nextFunction);
        }

    }

    self.loadBatteryConfig = function (callback) {
        MSP.send_message(MSPCodes.MSPV2_BATTERY_CONFIG, false, false, callback);
    };

    self.loadRxConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_RX_CONFIG, false, false, callback);
    };

    self.load3dConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_3D, false, false, callback);
    };

    self.loadSensorAlignment = function (callback) {
        MSP.send_message(MSPCodes.MSP_SENSOR_ALIGNMENT, false, false, callback);
    };

    self.loadSensorConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_SENSOR_CONFIG, false, false, callback);
    };

    self.loadSensorStatus = function (callback) {
        MSP.send_message(MSPCodes.MSP_SENSOR_STATUS, false, false, callback);
    };

    self.loadRcDeadband = function (callback) {
        MSP.send_message(MSPCodes.MSP_RC_DEADBAND, false, false, callback);
    };

    self.loadRcMap = function (callback) {
        MSP.send_message(MSPCodes.MSP_RX_MAP, false, false, callback);
    };

    self.loadRcData = function (callback) {
        MSP.send_message(MSPCodes.MSP_RC, false, false, callback);
    };

    self.loadAccTrim = function (callback) {
        MSP.send_message(MSPCodes.MSP_ACC_TRIM, false, false, callback);
    };

    self.saveToEeprom = function saveToEeprom(callback) {
        MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, callback);
    };

    self.saveINAVPidConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_INAV_PID, mspHelper.crunch(MSPCodes.MSP_SET_INAV_PID), false, callback);
    };

    self.saveAdvancedConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_ADVANCED_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_ADVANCED_CONFIG), false, callback);
    };

    self.saveFilterConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_FILTER_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_FILTER_CONFIG), false, callback);
    };

    self.savePidData = function (callback) {
        MSP.send_message(MSPCodes.MSP2_SET_PID, mspHelper.crunch(MSPCodes.MSP2_SET_PID), false, callback);
    };

    self.saveRcTuningData = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_RC_TUNING, mspHelper.crunch(MSPCodes.MSP_SET_RC_TUNING), false, callback);
    };

    self.saveRateProfileData = function (callback) {
        MSP.send_message(MSPCodes.MSPV2_INAV_SET_RATE_PROFILE, mspHelper.crunch(MSPCodes.MSPV2_INAV_SET_RATE_PROFILE), false, callback);
    };

    self.savePidAdvanced = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_PID_ADVANCED, mspHelper.crunch(MSPCodes.MSP_SET_PID_ADVANCED), false, callback);
    };

    self.saveFeatures = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_FEATURE, mspHelper.crunch(MSPCodes.MSP_SET_FEATURE), false, callback);
    };

    self.saveCurrentMeterConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_CURRENT_METER_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_CURRENT_METER_CONFIG), false, callback);
    };

    self.saveBoardAlignment = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_BOARD_ALIGNMENT, mspHelper.crunch(MSPCodes.MSP_SET_BOARD_ALIGNMENT), false, callback);
    };

    self.saveMiscV2 = function (callback) {
        MSP.send_message(MSPCodes.MSPV2_INAV_SET_MISC, mspHelper.crunch(MSPCodes.MSPV2_INAV_SET_MISC), false, callback);
    };

    self.saveBatteryConfig = function (callback) {
        MSP.send_message(MSPCodes.MSPV2_SET_BATTERY_CONFIG, mspHelper.crunch(MSPCodes.MSPV2_SET_BATTERY_CONFIG), false, callback);
    };

    self.save3dConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_3D, mspHelper.crunch(MSPCodes.MSP_SET_3D), false, callback);
    };

    self.saveSensorAlignment = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_SENSOR_ALIGNMENT, mspHelper.crunch(MSPCodes.MSP_SET_SENSOR_ALIGNMENT), false, callback);
    };

    self.saveAccTrim = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_ACC_TRIM, mspHelper.crunch(MSPCodes.MSP_SET_ACC_TRIM), false, callback);
    };

    self.saveRxConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_RX_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_RX_CONFIG), false, callback);
    };

    self.saveSensorConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_SENSOR_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_SENSOR_CONFIG), false, callback);
    };

    self.loadNavPosholdConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_NAV_POSHOLD, false, false, callback);
    };

    self.saveNavPosholdConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_NAV_POSHOLD, mspHelper.crunch(MSPCodes.MSP_SET_NAV_POSHOLD), false, callback);
    };

    self.loadCalibrationData = function (callback) {
        MSP.send_message(MSPCodes.MSP_CALIBRATION_DATA, false, false, callback);
    };

    self.saveCalibrationData = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_CALIBRATION_DATA, mspHelper.crunch(MSPCodes.MSP_SET_CALIBRATION_DATA), false, callback);
    };

    self.loadRthAndLandConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_RTH_AND_LAND_CONFIG, false, false, callback);
    };

    self.saveRthAndLandConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_RTH_AND_LAND_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_RTH_AND_LAND_CONFIG), false, callback);
    };

    self.loadFwConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_FW_CONFIG, false, false, callback);
    };

    self.saveFwConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_FW_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_FW_CONFIG), false, callback);
    };

    self.getMissionInfo = function (callback) {
        MSP.send_message(MSPCodes.MSP_WP_GETINFO, false, false, callback);
    };

    self.loadWaypoints = function (callback) {
        FC.MISSION_PLANNER.reinit();
        let waypointId = 0;
        let startTime = new Date().getTime();
        MSP.send_message(MSPCodes.MSP_WP_GETINFO, false, false, loadWaypoint);

        function loadWaypoint() {
            waypointId++;
            if (waypointId < FC.MISSION_PLANNER.getCountBusyPoints()) {
                MSP.send_message(MSPCodes.MSP_WP, [waypointId], false, loadWaypoint);
            } else {
                MSP.send_message(MSPCodes.MSP_WP, [waypointId], false, callback);
            }
        };
    };

    self.saveWaypoints = function (callback) {
        let waypointId = 0;
        let startTime = new Date().getTime();
        sendWaypoint();

        function sendWaypoint() {
            waypointId++;
            if (waypointId < FC.MISSION_PLANNER.get().length) {
                MSP.send_message(MSPCodes.MSP_SET_WP, FC.MISSION_PLANNER.extractBuffer(waypointId), false, sendWaypoint);
            }
            else {
                MSP.send_message(MSPCodes.MSP_SET_WP, FC.MISSION_PLANNER.extractBuffer(waypointId), false, endMission);
            }
        };

        function endMission() {
            MSP.send_message(MSPCodes.MSP_WP_GETINFO, false, false, callback);
        }
    };

    self.loadSafehomes = function (callback) {
        FC.SAFEHOMES.flush();
        let safehomeId = 0;
        MSP.send_message(MSPCodes.MSP2_INAV_SAFEHOME, [safehomeId], false, nextSafehome);

        function nextSafehome() {
            safehomeId++;
            if (safehomeId < FC.SAFEHOMES.getMaxSafehomeCount() - 1) {
                MSP.send_message(MSPCodes.MSP2_INAV_SAFEHOME, [safehomeId], false, nextSafehome);
            }
            else {
                MSP.send_message(MSPCodes.MSP2_INAV_SAFEHOME, [safehomeId], false, callback);
            }
        };
    };

    self.saveSafehomes = function (callback) {
        let safehomeId = 0;
        MSP.send_message(MSPCodes.MSP2_INAV_SET_SAFEHOME, FC.SAFEHOMES.extractBuffer(safehomeId), false, nextSendSafehome);

        function nextSendSafehome() {
            safehomeId++;
            if (safehomeId < FC.SAFEHOMES.getMaxSafehomeCount() - 1) {
                MSP.send_message(MSPCodes.MSP2_INAV_SET_SAFEHOME, FC.SAFEHOMES.extractBuffer(safehomeId), false, nextSendSafehome);
            }
            else {
                MSP.send_message(MSPCodes.MSP2_INAV_SET_SAFEHOME, FC.SAFEHOMES.extractBuffer(safehomeId), false, callback);
            }
        };
    };

    self.loadFwApproach = function (callback) {
        FC.FW_APPROACH.flush();
        let id = 0;
        MSP.send_message(MSPCodes.MSP2_INAV_FW_APPROACH, [id], false, nextFwApproach);

        function nextFwApproach() {
            id++;
            if (id < FC.FW_APPROACH.getMaxFwApproachCount() - 1) {
                MSP.send_message(MSPCodes.MSP2_INAV_FW_APPROACH, [id], false, nextFwApproach);
            }
            else {
                MSP.send_message(MSPCodes.MSP2_INAV_FW_APPROACH, [id], false, callback);
            }
        };
    };

    self.saveFwApproach = function (callback) {
        let id = 0;
        MSP.send_message(MSPCodes.MSP2_INAV_SET_FW_APPROACH, FC.FW_APPROACH.extractBuffer(id), false, nextFwApproach);

        function nextFwApproach() {
            id++;
            if (id < FC.FW_APPROACH.getMaxFwApproachCount() - 1) {
                MSP.send_message(MSPCodes.MSP2_INAV_SET_FW_APPROACH, FC.FW_APPROACH.extractBuffer(id), false, nextFwApproach);
            }
            else {
                MSP.send_message(MSPCodes.MSP2_INAV_SET_FW_APPROACH, FC.FW_APPROACH.extractBuffer(id), false, callback);
            }
        };
    };

    self.loadGeozones = function (callback) {
        FC.GEOZONES.flush();
        let geozoneID = -1;
        let vertexID = -1;
        nextGeozone();

        function nextVertex() {
            vertexID++;
            let zone = FC.GEOZONES.at(geozoneID);
            if (!zone || zone.getVerticesCount() == 0) {
                nextGeozone();
                return;
            }
            if (vertexID < FC.GEOZONES.at(geozoneID).getVerticesCount() && zone.getShape() == GeozoneShapes.POLYGON) {
                MSP.send_message(MSPCodes.MSP2_INAV_GEOZONE_VERTEX, [geozoneID, vertexID], false, nextVertex); 
            } else {
                MSP.send_message(MSPCodes.MSP2_INAV_GEOZONE_VERTEX, [geozoneID, vertexID], false, nextGeozone); 
            }
        }

        function nextGeozone() {
            geozoneID++;
            vertexID = -1;
            if (geozoneID < FC.GEOZONES.getMaxZones()) {
                MSP.send_message(MSPCodes.MSP2_INAV_GEOZONE, [geozoneID], false, nextVertex);
            } else {
                MSP.send_message(MSPCodes.MSP2_INAV_GEOZONE, [geozoneID], false, callback);
            }
        }
    };

    self.saveGeozones = function (callback) {
        let geozoneID = -1;
        let vertexID = -1;
        nextGeozone()

        function nextVertex() {
            vertexID++;

            let zone = FC.GEOZONES.at(geozoneID);
            if (!zone || zone.getVerticesCount() == 0) {
                nextGeozone();
                return;
            }
            if (vertexID < FC.GEOZONES.at(geozoneID).getVerticesCount() - 1) {
                MSP.send_message(MSPCodes.MSP2_INAV_SET_GEOZONE_VERTICE, FC.GEOZONES.extractBufferVertices(geozoneID, vertexID), false, nextVertex); 
            } else {
                MSP.send_message(MSPCodes.MSP2_INAV_SET_GEOZONE_VERTICE, FC.GEOZONES.extractBufferVertices(geozoneID, vertexID), false, nextGeozone); 
            }
        }

        function nextGeozone() {
            geozoneID++;
            vertexID = -1;
            if (geozoneID < FC.GEOZONES.getMaxZones()) {
                MSP.send_message(MSPCodes.MSP2_INAV_SET_GEOZONE, FC.GEOZONES.extractBufferZone(geozoneID), false, nextVertex);
            } else {
                MSP.send_message(MSPCodes.MSP2_INAV_SET_GEOZONE, FC.GEOZONES.extractBufferZone(geozoneID), false, callback);
            }
        }
    }

    self._getSetting = function (name) {

        const storedSetting = settingsCache.get(name);
        if (typeof storedSetting !== 'undefined') {
            return Promise.resolve(storedSetting);
        }

        var data = [];
        self._encodeSettingReference(name, null, data);
        return MSP.promise(MSPCodes.MSP2_COMMON_SETTING_INFO, data).then(function (result) {
            const MODE_LOOKUP = 1 << 6;
            var settingTypes = {
                0: "uint8_t",
                1: "int8_t",
                2: "uint16_t",
                3: "int16_t",
                4: "uint32_t",
                5: "float",
                6: "string",
            };
            var setting = {};

            // Discard setting name
            result.data.readString();

            // Discard PG ID
            result.data.readU16();

            var type = result.data.readU8();
            setting.type = settingTypes[type];
            if (!setting.type) {
                console.log("Unknown setting type " + type + " for setting '" + name + "'");
                return null;
            }
            // Discard section
            result.data.readU8();
            setting.mode = result.data.readU8();
            setting.min = result.data.read32();
            setting.max = result.data.readU32();

            setting.index = result.data.readU16();

            // Discard profile info
            result.data.readU8();
            result.data.readU8();

            if (setting.mode == MODE_LOOKUP) {
                var values = [];
                for (var ii = setting.min; ii <= setting.max; ii++) {
                    values.push(result.data.readString());
                }
                setting.table = { values: values };
            }
            settingsCache.set(name, setting);
            return setting;
        });
    }

    self._encodeSettingReference = function (name, index, data) {
        if (Number.isInteger(index)) {
            data.push8(0);
            data.push16(index);
        } else {
            for (var ii = 0; ii < name.length; ii++) {
                data.push(name.charCodeAt(ii));
            }
            data.push(0);
        }
    };

    self.getSetting = function (name) {
        var $this = this;
        return this._getSetting(name).then(function (setting) {
            if (!setting) {
                // Setting not available in the FC
                return null;
            }
            var data = [];
            $this._encodeSettingReference(name, setting.index, data);
            return MSP.promise(MSPCodes.MSPV2_SETTING, data).then(function (resp) {
                var value;
                switch (setting.type) {
                    case "uint8_t":
                        value = resp.data.getUint8(0);
                        break;
                    case "int8_t":
                        value = resp.data.getInt8(0);
                        break;
                    case "uint16_t":
                        value = resp.data.getUint16(0, true);
                        break;
                    case "int16_t":
                        value = resp.data.getInt16(0, true);
                        break;
                    case "uint32_t":
                        value = resp.data.getUint32(0, true);
                        break;
                    case "float":
                        var fi32 = resp.data.getUint32(0, true);
                        var buf = new ArrayBuffer(4);
                        (new Uint32Array(buf))[0] = fi32;
                        value = (new Float32Array(buf))[0];
                        break;
                    case "string":
                        value = resp.data.readString();
                        break;
                    default:
                        throw "Unknown setting type " + setting.type;
                }
                return { setting: setting, value: value };
            });
        });
    };

    self.encodeSetting = function (name, value) {
        return this._getSetting(name).then(function (setting) {
            
            if (!setting) {
                throw 'Invalid setting';
            }
            
            if (setting.table && !Number.isInteger(value)) {
                var found = false;
                for (var ii = 0; ii < setting.table.values.length; ii++) {
                    if (setting.table.values[ii] == value) {
                        value = ii;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    throw 'Invalid value "' + value + '" for setting ' + name;
                }
            }
            var data = [];
            self._encodeSettingReference(name, setting.index, data);
            switch (setting.type) {
                case "uint8_t":
                case "int8_t":
                    data.push8(value);
                    break;
                case "uint16_t":
                case "int16_t":
                    data.push16(value);
                    break;
                case "uint32_t":
                    data.push32(value);
                    break;
                case "float":
                    var buf = new ArrayBuffer(4);
                    (new Float32Array(buf))[0] = value;
                    var if32 = (new Uint32Array(buf))[0];
                    data.push32(if32);
                    break;
                case "string":
                    for (var ii = 0; ii < value.length; ii++) {
                        data.push(value.charCodeAt(ii));
                    }
                    break;
                default:
                    throw "Unknown setting type " + setting.type;
            }
            return data;
        });
    };

    self.setSetting = function (name, value, callback) {
        this.encodeSetting(name, value).then(function (data) {
            return MSP.promise(MSPCodes.MSPV2_SET_SETTING, data).then(callback);
        }).catch(error =>  {
            console.log("Invalid setting: " + name, error);
            return Promise.resolve().then(callback);
        });
    };

    self.getRTC = function (callback) {
        MSP.send_message(MSPCodes.MSP_RTC, false, false, function (resp) {
            var seconds = resp.data.read32();
            var millis = resp.data.readU16();
            if (callback) {
                callback(seconds, millis);
            }
        });
    };

    self.setRTC = function (callback) {
        var now = Date.now();
        var secs = now / 1000;
        var millis = now % 1000;
        var data = [];
        data.push32(secs);
        data.push16(millis);
        MSP.send_message(MSPCodes.MSP_SET_RTC, data, false, callback);
    };

    self.loadServoConfiguration = function (callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_SERVO_CONFIG, false, false, callback);
    };

    self.loadServoMixRules = function (callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_SERVO_MIXER, false, false, callback);
    };

    self.loadMotorMixRules = function (callback) {
        MSP.send_message(MSPCodes.MSP2_COMMON_MOTOR_MIXER, false, false, callback);
    };

    self.loadMotors = function (callback) {
        MSP.send_message(MSPCodes.MSP_MOTOR, false, false, callback);
    };

    self.getTarget = function(callback) {
        MSP.send_message(MSPCodes.MSP_FC_VERSION, false, false, function(resp){
            var target = resp.data.readString();
            if (callback) {
                callback(target);
            }
        });
    }

    self.getCraftName = function (callback) {
        MSP.send_message(MSPCodes.MSP_NAME, false, false, function (resp) {
            var name = resp.data.readString();
            if (callback) {
                callback(name);
            }
        });
    };

    self.setCraftName = function (name, callback) {
        var data = [];
        name = name || "";
        for (var ii = 0; ii < name.length; ii++) {
            data.push(name.charCodeAt(ii));
        }
        MSP.send_message(MSPCodes.MSP_SET_NAME, data, false, callback);
    };

    self.loadMixerConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_MIXER, false, false, callback);
    };

    self.saveMixerConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_SET_MIXER, mspHelper.crunch(MSPCodes.MSP2_INAV_SET_MIXER), false, callback);
    };

    self.loadVTXConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_VTX_CONFIG, false, false, callback);
    };

    self.saveVTXConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_VTX_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_VTX_CONFIG), false, callback);
    };

    self.loadBrakingConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_MC_BRAKING, false, false, callback);
    }

    self.saveBrakingConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_SET_MC_BRAKING, mspHelper.crunch(MSPCodes.MSP2_INAV_SET_MC_BRAKING), false, callback);
    };

    self.loadRateDynamics = function (callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_RATE_DYNAMICS, false, false, callback);
    }

    self.saveRateDynamics = function (callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_SET_RATE_DYNAMICS, mspHelper.crunch(MSPCodes.MSP2_INAV_SET_RATE_DYNAMICS), false, callback);
    }

    self.loadEzTune = function (callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_EZ_TUNE, false, false, callback);
    }

    self.saveEzTune = function (callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_EZ_TUNE_SET, mspHelper.crunch(MSPCodes.MSP2_INAV_EZ_TUNE_SET), false, callback);
    }

    self.loadParameterGroups = function (callback) {
        MSP.send_message(MSPCodes.MSP2_COMMON_PG_LIST, false, false, function (resp) {
            var groups = [];
            while (resp.data.offset < resp.data.byteLength) {
                var id = resp.data.readU16();
                var start = resp.data.readU16();
                var end = resp.data.readU16();
                groups.push({ id: id, start: start, end: end });
            }
            if (callback) {
                callback(groups);
            }
        });
    };

    self.loadBrakingConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_MC_BRAKING, false, false, callback);
    }

    self.loadLogicConditionsStatus = function (callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_LOGIC_CONDITIONS_STATUS, false, false, callback);
    };

    self.loadGlobalVariablesStatus = function (callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_GVAR_STATUS, false, false, callback);
    };

    self.loadProgrammingPidStatus = function (callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_PROGRAMMING_PID_STATUS, false, false, callback);
    };

    self.loadSerialPorts = function (callback) {
        MSP.send_message(MSPCodes.MSP2_CF_SERIAL_CONFIG, false, false, callback);
    };

    self.saveSerialPorts = function (callback) {
        MSP.send_message(MSPCodes.MSP2_SET_CF_SERIAL_CONFIG, mspHelper.crunch(MSPCodes.MSP2_SET_CF_SERIAL_CONFIG), false, callback);
    };

    self.sendUbloxCommand = function (ubloxData, callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_GPS_UBLOX_COMMAND, ubloxData, false, callback);
    };

    return self;
})();

module.exports = mspHelper;
