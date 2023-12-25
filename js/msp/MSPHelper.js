/*global $, SERVO_DATA, PID_names, ADJUSTMENT_RANGES, RXFAIL_CONFIG, SERVO_CONFIG,CONFIG*/
'use strict';

var mspHelper = (function (gui) {
    var self = {};

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

    self.SERIAL_PORT_FUNCTIONS = {
        'MSP': 0,
        'GPS': 1,
        'TELEMETRY_FRSKY': 2,
        'TELEMETRY_HOTT': 3,
        'TELEMETRY_LTM': 4, // LTM replaced MSP
        'TELEMETRY_SMARTPORT': 5,
        'RX_SERIAL': 6,
        'BLACKBOX': 7,
        'TELEMETRY_MAVLINK': 8,
        'TELEMETRY_IBUS': 9,
        'RUNCAM_DEVICE_CONTROL': 10,
        'TBS_SMARTAUDIO': 11,
        'IRC_TRAMP': 12,
        'OPFLOW': 14,
        'LOG': 15,
        'RANGEFINDER': 16,
        'VTX_FFPV': 17,
        'ESC': 18,
        'GSM_SMS': 19,
        'FRSKY_OSD': 20,
        'DJI_FPV': 21,
        'SMARTPORT_MASTER': 23,
        'MSP_DISPLAYPORT': 25,
    };

    // Required for MSP_DEBUGMSG because console.log() doesn't allow omitting
    // the newline at the end, so we keep the pending message here until we find a
    // '\0', then print it. Messages sent by MSP_DEBUGMSG are guaranteed to
    // always finish with a '\0'.
    var debugMsgBuffer = '';

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
                let profile_changed = false;
                CONFIG.cycleTime = data.getUint16(offset, true);
                offset += 2;
                CONFIG.i2cError = data.getUint16(offset, true);
                offset += 2;
                CONFIG.activeSensors = data.getUint16(offset, true);
                offset += 2;
                CONFIG.cpuload = data.getUint16(offset, true);
                offset += 2;

                profile_byte = data.getUint8(offset++)
                let profile = profile_byte & 0x0F;
                profile_changed |= (profile !== CONFIG.profile) && (CONFIG.profile !==-1);
                CONFIG.profile = profile;

                let battery_profile = (profile_byte & 0xF0) >> 4;
                profile_changed |= (battery_profile !== CONFIG.battery_profile) && (CONFIG.battery_profile !==-1);
                CONFIG.battery_profile = battery_profile;

                CONFIG.armingFlags = data.getUint32(offset, true);
                offset += 4;
                
                //As there are 8 bytes for mspBoxModeFlags (number of bytes is actually variable)
                //read mixer profile as the last byte in the the message
                profile_byte = data.getUint8(dataHandler.message_length_expected - 1);
                let mixer_profile = profile_byte & 0x0F;
                profile_changed |= (mixer_profile !== CONFIG.mixer_profile) && (CONFIG.mixer_profile !==-1);
                CONFIG.mixer_profile = mixer_profile;

                gui.updateStatusBar();
                gui.updateProfileChange(profile_changed);
                break;

            case MSPCodes.MSP_ACTIVEBOXES:
                var words = dataHandler.message_length_expected / 4;

                CONFIG.mode = [];
                for (i = 0; i < words; ++i)
                    CONFIG.mode.push(data.getUint32(i * 4, true));
                break;

            case MSPCodes.MSP_SENSOR_STATUS:
                SENSOR_STATUS.isHardwareHealthy = data.getUint8(0);
                SENSOR_STATUS.gyroHwStatus = data.getUint8(1);
                SENSOR_STATUS.accHwStatus = data.getUint8(2);
                SENSOR_STATUS.magHwStatus = data.getUint8(3);
                SENSOR_STATUS.baroHwStatus = data.getUint8(4);
                SENSOR_STATUS.gpsHwStatus = data.getUint8(5);
                SENSOR_STATUS.rangeHwStatus = data.getUint8(6);
                SENSOR_STATUS.speedHwStatus = data.getUint8(7);
                SENSOR_STATUS.flowHwStatus = data.getUint8(8);
                sensor_status_ex(SENSOR_STATUS);
                break;

            case MSPCodes.MSP_RAW_IMU:
                // 512 for mpu6050, 256 for mma
                // currently we are unable to differentiate between the sensor types, so we are goign with 512
                SENSOR_DATA.accelerometer[0] = data.getInt16(0, true) / 512;
                SENSOR_DATA.accelerometer[1] = data.getInt16(2, true) / 512;
                SENSOR_DATA.accelerometer[2] = data.getInt16(4, true) / 512;

                // properly scaled
                SENSOR_DATA.gyroscope[0] = data.getInt16(6, true) * (4 / 16.4);
                SENSOR_DATA.gyroscope[1] = data.getInt16(8, true) * (4 / 16.4);
                SENSOR_DATA.gyroscope[2] = data.getInt16(10, true) * (4 / 16.4);

                // no clue about scaling factor
                SENSOR_DATA.magnetometer[0] = data.getInt16(12, true) / 1090;
                SENSOR_DATA.magnetometer[1] = data.getInt16(14, true) / 1090;
                SENSOR_DATA.magnetometer[2] = data.getInt16(16, true) / 1090;
                break;
            case MSPCodes.MSP_SERVO:
                var servoCount = dataHandler.message_length_expected / 2;
                for (i = 0; i < servoCount; i++) {
                    SERVO_DATA[i] = data.getUint16(needle, true);

                    needle += 2;
                }
                break;
            case MSPCodes.MSP_MOTOR:
                var motorCount = dataHandler.message_length_expected / 2;
                for (i = 0; i < motorCount; i++) {
                    MOTOR_DATA[i] = data.getUint16(needle, true);

                    needle += 2;
                }
                break;
            case MSPCodes.MSP_RC:
                RC.active_channels = dataHandler.message_length_expected / 2;

                for (i = 0; i < RC.active_channels; i++) {
                    RC.channels[i] = data.getUint16((i * 2), true);
                }
                break;
            case MSPCodes.MSP_RAW_GPS:
                GPS_DATA.fix = data.getUint8(0);
                GPS_DATA.numSat = data.getUint8(1);
                GPS_DATA.lat = data.getInt32(2, true);
                GPS_DATA.lon = data.getInt32(6, true);
                GPS_DATA.alt = data.getInt16(10, true);
                GPS_DATA.speed = data.getUint16(12, true);
                GPS_DATA.ground_course = data.getUint16(14, true);
                GPS_DATA.hdop = data.getUint16(16, true);
                break;
            case MSPCodes.MSP_COMP_GPS:
                GPS_DATA.distanceToHome = data.getUint16(0, 1);
                GPS_DATA.directionToHome = data.getUint16(2, 1);
                GPS_DATA.update = data.getUint8(4);
                break;
            case MSPCodes.MSP_GPSSTATISTICS:
                GPS_DATA.messageDt = data.getUint16(0, true);
                GPS_DATA.errors = data.getUint32(2, true);
                GPS_DATA.timeouts = data.getUint32(6, true);
                GPS_DATA.packetCount = data.getUint32(10, true);
                GPS_DATA.hdop = data.getUint16(14, true);
                GPS_DATA.eph = data.getUint16(16, true);
                GPS_DATA.epv = data.getUint16(18, true);
                break;
            case MSPCodes.MSP_ATTITUDE:
                SENSOR_DATA.kinematics[0] = data.getInt16(0, true) / 10.0; // x
                SENSOR_DATA.kinematics[1] = data.getInt16(2, true) / 10.0; // y
                SENSOR_DATA.kinematics[2] = data.getInt16(4, true); // z
                break;
            case MSPCodes.MSP_ALTITUDE:
                SENSOR_DATA.altitude = parseFloat((data.getInt32(0, true) / 100.0).toFixed(2)); // correct scale factor
                SENSOR_DATA.barometer = parseFloat((data.getInt32(6, true) / 100.0).toFixed(2)); // correct scale factor
                break;
            case MSPCodes.MSP_SONAR:
                SENSOR_DATA.sonar = data.getInt32(0, true);
                break;
            case MSPCodes.MSPV2_INAV_AIR_SPEED:
                SENSOR_DATA.air_speed = data.getInt32(0, true);
                break;
            case MSPCodes.MSP_ANALOG:
                ANALOG.voltage = data.getUint8(0) / 10.0;
                ANALOG.mAhdrawn = data.getUint16(1, true);
                ANALOG.rssi = data.getUint16(3, true); // 0-1023
                ANALOG.amperage = data.getInt16(5, true) / 100; // A
                break;
            case MSPCodes.MSPV2_INAV_ANALOG:
                let tmp = data.getUint8(offset++);
                ANALOG.battery_full_when_plugged_in = (tmp & 1 ? true : false);
                ANALOG.use_capacity_thresholds = ((tmp & 2) >> 1 ? true : false);
                ANALOG.battery_state = (tmp & 12) >> 2;
                ANALOG.cell_count = (tmp & 0xF0) >> 4;
                ANALOG.voltage = data.getUint16(offset, true) / 100.0;
                offset += 2;
                ANALOG.amperage = data.getInt16(offset, true) / 100; // A
                offset += 2;
                ANALOG.power = data.getInt32(offset, true) / 100.0;
                offset += 4;
                ANALOG.mAhdrawn = data.getInt32(offset, true);
                offset += 4;
                ANALOG.mWhdrawn = data.getInt32(offset, true);
                offset += 4;
                ANALOG.battery_remaining_capacity = data.getUint32(offset, true);
                offset += 4;
                ANALOG.battery_percentage = data.getUint8(offset++);
                ANALOG.rssi = data.getUint16(offset, true); // 0-1023
                offset += 2;
                //noinspection JSValidateTypes
                dataHandler.analog_last_received_timestamp = Date.now();
                break;
            case MSPCodes.MSP_RC_TUNING:
                RC_tuning.RC_RATE = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                RC_tuning.RC_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                RC_tuning.roll_pitch_rate = 0;
                RC_tuning.roll_rate = parseFloat((data.getUint8(offset++) * 10));
                RC_tuning.pitch_rate = parseFloat((data.getUint8(offset++) * 10));
                RC_tuning.yaw_rate = parseFloat((data.getUint8(offset++) * 10));

                RC_tuning.dynamic_THR_PID = parseInt(data.getUint8(offset++));
                RC_tuning.throttle_MID = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                RC_tuning.throttle_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                RC_tuning.dynamic_THR_breakpoint = data.getUint16(offset, true);
                offset += 2;
                RC_tuning.RC_YAW_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                break;
            case MSPCodes.MSPV2_INAV_RATE_PROFILE:
                // compat
                RC_tuning.RC_RATE = 100;
                RC_tuning.roll_pitch_rate = 0;

                // throttle
                RC_tuning.throttle_MID = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                RC_tuning.throttle_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                RC_tuning.dynamic_THR_PID = parseInt(data.getUint8(offset++));
                RC_tuning.dynamic_THR_breakpoint = data.getUint16(offset, true);
                offset += 2;

                // stabilized
                RC_tuning.RC_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                RC_tuning.RC_YAW_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                RC_tuning.roll_rate = data.getUint8(offset++) * 10;
                RC_tuning.pitch_rate = data.getUint8(offset++) * 10;
                RC_tuning.yaw_rate = data.getUint8(offset++) * 10;

                // manual
                RC_tuning.manual_RC_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                RC_tuning.manual_RC_YAW_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                RC_tuning.manual_roll_rate = data.getUint8(offset++);
                RC_tuning.manual_pitch_rate = data.getUint8(offset++);
                RC_tuning.manual_yaw_rate = data.getUint8(offset++);
                break;
            case MSPCodes.MSP2_PID:
                // PID data arrived, we need to scale it and save to appropriate bank / array
                for (i = 0, needle = 0; i < (dataHandler.message_length_expected / 4); i++, needle += 4) {
                    PIDs[i][0] = data.getUint8(needle);
                    PIDs[i][1] = data.getUint8(needle + 1);
                    PIDs[i][2] = data.getUint8(needle + 2);
                    PIDs[i][3] = data.getUint8(needle + 3);
                }
                break;
            case MSPCodes.MSP_ARMING_CONFIG:
                ARMING_CONFIG.auto_disarm_delay = data.getUint8(0);
                ARMING_CONFIG.disarm_kill_switch = data.getUint8(1);
                break;
            case MSPCodes.MSP_LOOP_TIME:
                FC_CONFIG.loopTime = data.getInt16(0, true);
                break;
            case MSPCodes.MSP_MISC: // 22 bytes
                MISC.midrc = data.getInt16(offset, true);
                offset += 2;
                MISC.minthrottle = data.getUint16(offset, true); // 0-2000
                offset += 2;
                MISC.maxthrottle = data.getUint16(offset, true); // 0-2000
                offset += 2;
                MISC.mincommand = data.getUint16(offset, true); // 0-2000
                offset += 2;
                MISC.failsafe_throttle = data.getUint16(offset, true); // 1000-2000
                offset += 2;
                MISC.gps_type = data.getUint8(offset++);
                MISC.sensors_baudrate = data.getUint8(offset++);
                MISC.gps_ubx_sbas = data.getInt8(offset++);
                MISC.multiwiicurrentoutput = data.getUint8(offset++);
                MISC.rssi_channel = data.getUint8(offset++);
                MISC.placeholder2 = data.getUint8(offset++);
                MISC.mag_declination = data.getInt16(offset, 1) / 10; // -18000-18000
                offset += 2;
                MISC.vbatscale = data.getUint8(offset++); // 10-200
                MISC.vbatmincellvoltage = data.getUint8(offset++) / 10; // 10-50
                MISC.vbatmaxcellvoltage = data.getUint8(offset++) / 10; // 10-50
                MISC.vbatwarningcellvoltage = data.getUint8(offset++) / 10; // 10-50
                break;
            case MSPCodes.MSPV2_INAV_MISC:
                MISC.midrc = data.getInt16(offset, true);
                offset += 2;
                MISC.minthrottle = data.getUint16(offset, true); // 0-2000
                offset += 2;
                MISC.maxthrottle = data.getUint16(offset, true); // 0-2000
                offset += 2;
                MISC.mincommand = data.getUint16(offset, true); // 0-2000
                offset += 2;
                MISC.failsafe_throttle = data.getUint16(offset, true); // 1000-2000
                offset += 2;
                MISC.gps_type = data.getUint8(offset++);
                MISC.sensors_baudrate = data.getUint8(offset++);
                MISC.gps_ubx_sbas = data.getInt8(offset++);
                MISC.rssi_channel = data.getUint8(offset++);
                MISC.mag_declination = data.getInt16(offset, 1) / 10; // -18000-18000
                offset += 2;
                MISC.vbatscale = data.getUint16(offset, true);
                offset += 2;
                MISC.voltage_source = data.getUint8(offset++);
                MISC.battery_cells = data.getUint8(offset++);
                MISC.vbatdetectcellvoltage = data.getUint16(offset, true) / 100;
                offset += 2;
                MISC.vbatmincellvoltage = data.getUint16(offset, true) / 100;
                offset += 2;
                MISC.vbatmaxcellvoltage = data.getUint16(offset, true) / 100;
                offset += 2;
                MISC.vbatwarningcellvoltage = data.getUint16(offset, true) / 100;
                offset += 2;
                MISC.battery_capacity = data.getUint32(offset, true);
                offset += 4;
                MISC.battery_capacity_warning = data.getUint32(offset, true);
                offset += 4;
                MISC.battery_capacity_critical = data.getUint32(offset, true);
                offset += 4;
                MISC.battery_capacity_unit = (data.getUint8(offset++) ? 'mWh' : 'mAh');
                break;
            case MSPCodes.MSPV2_INAV_SET_MISC:
                console.log('MISC INAV Configuration saved');
                break;
            case MSPCodes.MSPV2_INAV_BATTERY_CONFIG:
                BATTERY_CONFIG.vbatscale = data.getUint16(offset, true);
                offset += 2;
                BATTERY_CONFIG.voltage_source = data.getUint8(offset++);
                BATTERY_CONFIG.battery_cells = data.getUint8(offset++);
                BATTERY_CONFIG.vbatdetectcellvoltage = data.getUint16(offset, true) / 100;
                offset += 2;
                BATTERY_CONFIG.vbatmincellvoltage = data.getUint16(offset, true) / 100;
                offset += 2;
                BATTERY_CONFIG.vbatmaxcellvoltage = data.getUint16(offset, true) / 100;
                offset += 2;
                BATTERY_CONFIG.vbatwarningcellvoltage = data.getUint16(offset, true) / 100;
                offset += 2;
                BATTERY_CONFIG.current_offset = data.getUint16(offset, true);
                offset += 2;
                BATTERY_CONFIG.current_scale = data.getUint16(offset, true);
                offset += 2;
                BATTERY_CONFIG.capacity = data.getUint32(offset, true);
                offset += 4;
                BATTERY_CONFIG.capacity_warning = data.getUint32(offset, true);
                offset += 4;
                BATTERY_CONFIG.capacity_critical = data.getUint32(offset, true);
                offset += 4;
                BATTERY_CONFIG.battery_capacity_unit = (data.getUint8(offset++) ? 'mWh' : 'mAh');
                break;
            case MSPCodes.MSP_3D:
                REVERSIBLE_MOTORS.deadband_low = data.getUint16(offset, true);
                offset += 2;
                REVERSIBLE_MOTORS.deadband_high = data.getUint16(offset, true);
                offset += 2;
                REVERSIBLE_MOTORS.neutral = data.getUint16(offset, true);
                break;
            case MSPCodes.MSP_MOTOR_PINS:
                console.log(data);
                break;
            case MSPCodes.MSP_BOXNAMES:
                //noinspection JSUndeclaredVariable
                AUX_CONFIG = []; // empty the array as new data is coming in
                buff = [];
                for (i = 0; i < data.byteLength; i++) {
                    if (data.getUint8(i) == 0x3B) { // ; (delimeter char)
                        AUX_CONFIG.push(String.fromCharCode.apply(null, buff)); // convert bytes into ASCII and save as strings

                        // empty buffer
                        buff = [];
                    } else {
                        buff.push(data.getUint8(i));
                    }
                }
                break;
            case MSPCodes.MSP_PIDNAMES:
                //noinspection JSUndeclaredVariable
                PID_names = []; // empty the array as new data is coming in

                buff = [];
                for (i = 0; i < data.byteLength; i++) {
                    if (data.getUint8(i) == 0x3B) { // ; (delimiter char)
                        PID_names.push(String.fromCharCode.apply(null, buff)); // convert bytes into ASCII and save as strings

                        // empty buffer
                        buff = [];
                    } else {
                        buff.push(data.getUint8(i));
                    }
                }
                break;
            case MSPCodes.MSP_WP:
                MISSION_PLANNER.put(new Waypoint(
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
                AUX_CONFIG_IDS = []; // empty the array as new data is coming in

                for (i = 0; i < data.byteLength; i++) {
                    AUX_CONFIG_IDS.push(data.getUint8(i));
                }
                break;
            case MSPCodes.MSP_SERVO_MIX_RULES:
                SERVO_RULES.flush();
                if (data.byteLength % 8 === 0) {
                    for (i = 0; i < data.byteLength; i += 8) {
                        SERVO_RULES.put(new ServoMixRule(
                            data.getInt8(i),
                            data.getInt8(i + 1),
                            data.getInt16(i + 2, true),
                            data.getInt8(i + 4)
                        ));
                    }
                }
                SERVO_RULES.cleanup();

                break;
            case MSPCodes.MSP2_INAV_SERVO_MIXER:
                SERVO_RULES.flush();
                if (data.byteLength % 6 === 0) {
                    for (i = 0; i < data.byteLength; i += 6) {
                        SERVO_RULES.put(new ServoMixRule(
                            data.getInt8(i),
                            data.getInt8(i + 1),
                            data.getInt16(i + 2, true),
                            data.getInt8(i + 4),
                            data.getInt8(i + 5)
                        ));
                    }
                }
                SERVO_RULES.cleanup();
                break;

            case MSPCodes.MSP_SET_SERVO_MIX_RULE:
                console.log("Servo mix saved");
                break;
            case MSPCodes.MSP2_INAV_SET_SERVO_MIXER:
                console.log("Servo mix saved");
                break;
            case MSPCodes.MSP2_INAV_LOGIC_CONDITIONS:
                LOGIC_CONDITIONS.flush();
                if (data.byteLength % 14 === 0) {
                    for (i = 0; i < data.byteLength; i += 14) {
                        LOGIC_CONDITIONS.put(new LogicCondition(
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
                LOGIC_CONDITIONS.put(new LogicCondition(
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
                    for (i = 0; i < data.byteLength; i += 4) {
                        LOGIC_CONDITIONS_STATUS.set(index, data.getInt32(i, true));
                        index++;
                    }
                }
                break;

            case MSPCodes.MSP2_INAV_GVAR_STATUS:
                if (data.byteLength % 4 === 0) {
                    let index = 0;
                    for (i = 0; i < data.byteLength; i += 4) {
                        GLOBAL_VARIABLES_STATUS.set(index, data.getInt32(i, true));
                        index++;
                    }
                }
                break;

            case MSPCodes.MSP2_INAV_SET_LOGIC_CONDITIONS:
                console.log("Logic conditions saved");
                break;

            case MSPCodes.MSP2_INAV_PROGRAMMING_PID:
                PROGRAMMING_PID.flush();
                if (data.byteLength % 19 === 0) {
                    for (i = 0; i < data.byteLength; i += 19) {
                        PROGRAMMING_PID.put(new ProgrammingPid(
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
                    for (i = 0; i < data.byteLength; i += 4) {
                        PROGRAMMING_PID_STATUS.set(index, data.getInt32(i, true));
                        index++;
                    }
                }
                break;

            case MSPCodes.MSP2_INAV_SET_PROGRAMMING_PID:
                console.log("Programming PID saved");
                break;

            case MSPCodes.MSP2_COMMON_MOTOR_MIXER:
                MOTOR_RULES.flush();

                if (data.byteLength % 8 === 0) {
                    for (i = 0; i < data.byteLength; i += 8) {
                        var rule = new MotorMixRule(0, 0, 0, 0);

                        rule.fromMsp(
                            data.getUint16(i, true),
                            data.getUint16(i + 2, true),
                            data.getUint16(i + 4, true),
                            data.getUint16(i + 6, true)
                        );

                        MOTOR_RULES.put(rule);
                    }
                }
                MOTOR_RULES.cleanup();

                break;

            case MSPCodes.MSP2_COMMON_SET_MOTOR_MIXER:
                console.log("motor mixer saved");
                break;

            case MSPCodes.MSP_SERVO_CONFIGURATIONS:
                //noinspection JSUndeclaredVariable
                SERVO_CONFIG = []; // empty the array as new data is coming in

                if (data.byteLength % 14 == 0) {
                    for (i = 0; i < data.byteLength; i += 14) {
                        var arr = {
                            'min': data.getInt16(i + 0, true),
                            'max': data.getInt16(i + 2, true),
                            'middle': data.getInt16(i + 4, true),
                            'rate': data.getInt8(i + 6),
                            'indexOfChannelToForward': data.getInt8(i + 9)
                        };
                        data.getUint32(i + 10); // Skip 4 bytes that used to be reversed Sources
                        SERVO_CONFIG.push(arr);
                    }
                }
                break;
            case MSPCodes.MSP_RC_DEADBAND:
                RC_deadband.deadband = data.getUint8(offset++);
                RC_deadband.yaw_deadband = data.getUint8(offset++);
                RC_deadband.alt_hold_deadband = data.getUint8(offset++);
                REVERSIBLE_MOTORS.deadband_throttle = data.getUint16(offset, true);
                break;
            case MSPCodes.MSP_SENSOR_ALIGNMENT:
                SENSOR_ALIGNMENT.align_gyro = data.getUint8(offset++);
                SENSOR_ALIGNMENT.align_acc = data.getUint8(offset++);
                SENSOR_ALIGNMENT.align_mag = data.getUint8(offset++);
                SENSOR_ALIGNMENT.align_opflow = data.getUint8(offset++);
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
            case MSPCodes.MSP_SET_MISC:
                console.log('MISC Configuration saved');
                break;
            case MSPCodes.MSP_RESET_CONF:
                console.log('Settings Reset');
                break;
            case MSPCodes.MSP_SELECT_SETTING:
                console.log('Profile selected');
                break;
            case MSPCodes.MSP_SET_SERVO_CONFIGURATION:
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
                            DEBUG_TRACE = (DEBUG_TRACE || '') + debugMsgBuffer;
                        }
                        debugMsgBuffer = '';
                        continue;
                    }
                    debugMsgBuffer += String.fromCharCode(c);
                }
                break;
            case MSPCodes.MSP_DEBUG:
                for (i = 0; i < 4; i++)
                    SENSOR_DATA.debug[i] = data.getInt16((2 * i), 1);
                break;
            case MSPCodes.MSP2_INAV_DEBUG:
                for (i = 0; i < 8; i++)
                    SENSOR_DATA.debug[i] = data.getInt32((4 * i), 1);
                break;
            case MSPCodes.MSP_SET_MOTOR:
                console.log('Motor Speeds Updated');
                break;
            // Additional baseflight commands that are not compatible with MultiWii
            case MSPCodes.MSP_UID:
                CONFIG.uid[0] = data.getUint32(0, true);
                CONFIG.uid[1] = data.getUint32(4, true);
                CONFIG.uid[2] = data.getUint32(8, true);
                break;
            case MSPCodes.MSP_ACC_TRIM:
                CONFIG.accelerometerTrims[0] = data.getInt16(0, true); // pitch
                CONFIG.accelerometerTrims[1] = data.getInt16(2, true); // roll
                break;
            case MSPCodes.MSP_SET_ACC_TRIM:
                console.log('Accelerometer trimms saved.');
                break;
            // Additional private MSP for baseflight configurator
            case MSPCodes.MSP_RX_MAP:
                //noinspection JSUndeclaredVariable
                RC_MAP = []; // empty the array as new data is coming in

                for (i = 0; i < data.byteLength; i++) {
                    RC_MAP.push(data.getUint8(i));
                }
                break;
            case MSPCodes.MSP_SET_RX_MAP:
                console.log('RCMAP saved');
                break;

            case MSPCodes.MSP_BOARD_ALIGNMENT:
                BOARD_ALIGNMENT.roll = data.getInt16(0, true); // -180 - 360
                BOARD_ALIGNMENT.pitch = data.getInt16(2, true); // -180 - 360
                BOARD_ALIGNMENT.yaw = data.getInt16(4, true); // -180 - 360
                break;

            case MSPCodes.MSP_SET_BOARD_ALIGNMENT:
                console.log('MSP_SET_BOARD_ALIGNMENT saved');
                break;

            case MSPCodes.MSP_CURRENT_METER_CONFIG:
                CURRENT_METER_CONFIG.scale = data.getInt16(0, true);
                CURRENT_METER_CONFIG.offset = data.getInt16(2, true);
                CURRENT_METER_CONFIG.type = data.getUint8(4);
                CURRENT_METER_CONFIG.capacity = data.getInt16(5, true);
                break;

            case MSPCodes.MSP_SET_CURRENT_METER_CONFIG:
                console.log('MSP_SET_CURRENT_METER_CONFIG saved');
                break;

            case MSPCodes.MSP_FEATURE:
                FEATURES = data.getUint32(0, true);
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
                CONFIG.mspProtocolVersion = data.getUint8(offset++);
                CONFIG.apiVersion = data.getUint8(offset++) + '.' + data.getUint8(offset++) + '.0';
                break;

            case MSPCodes.MSP_FC_VARIANT:
                for (offset = 0; offset < 4; offset++) {
                    identifier += String.fromCharCode(data.getUint8(offset));
                }
                CONFIG.flightControllerIdentifier = identifier;
                break;

            case MSPCodes.MSP_FC_VERSION:
                CONFIG.flightControllerVersion = data.getUint8(offset++) + '.' + data.getUint8(offset++) + '.' + data.getUint8(offset++);
                break;

            case MSPCodes.MSP_BUILD_INFO:
                var dateLength = 11;

                buff = [];
                for (i = 0; i < dateLength; i++) {
                    buff.push(data.getUint8(offset++));
                }
                buff.push(32); // ascii space

                var timeLength = 8;
                for (i = 0; i < timeLength; i++) {
                    buff.push(data.getUint8(offset++));
                }
                CONFIG.buildInfo = String.fromCharCode.apply(null, buff);
                break;

            case MSPCodes.MSP_BOARD_INFO:
                for (offset = 0; offset < 4; offset++) {
                    identifier += String.fromCharCode(data.getUint8(offset));
                }
                CONFIG.boardIdentifier = identifier;
                CONFIG.boardVersion = data.getUint16(offset, 1);
                offset += 2;
                if (semver.gt(CONFIG.flightControllerVersion, "4.1.0")) {
                    CONFIG.osdUsed = data.getUint8(offset++);
                    CONFIG.commCompatability = data.getUint8(offset++);
                    let targetNameLen = data.getUint8(offset++);
                    let targetName = "";
                    targetNameLen += offset;
                    for (offset = offset; offset < targetNameLen; offset++) {
                        targetName += String.fromCharCode(data.getUint8(offset));
                    }
                    CONFIG.target = targetName;
                }

                break;

            case MSPCodes.MSP_SET_CHANNEL_FORWARDING:
                console.log('Channel forwarding saved');
                break;

            case MSPCodes.MSP2_CF_SERIAL_CONFIG:
                SERIAL_CONFIG.ports = [];
                var bytesPerPort = 1 + 4 + 4;
                var serialPortCount = data.byteLength / bytesPerPort;

                for (i = 0; i < serialPortCount; i++) {
                    var BAUD_RATES = mspHelper.BAUD_RATES_post1_6_3;

                    var serialPort = {
                        identifier: data.getUint8(offset),
                        functions: mspHelper.serialPortFunctionMaskToFunctions(data.getUint32(offset + 1, true)),
                        msp_baudrate: BAUD_RATES[data.getUint8(offset + 5)],
                        sensors_baudrate: BAUD_RATES[data.getUint8(offset + 6)],
                        telemetry_baudrate: BAUD_RATES[data.getUint8(offset + 7)],
                        peripherals_baudrate: BAUD_RATES[data.getUint8(offset + 8)]
                    };

                    offset += bytesPerPort;
                    SERIAL_CONFIG.ports.push(serialPort);
                }
                break;

            case MSPCodes.MSP2_SET_CF_SERIAL_CONFIG:
                console.log('Serial config saved');
                break;

            case MSPCodes.MSP_MODE_RANGES:
                //noinspection JSUndeclaredVariable
                MODE_RANGES = []; // empty the array as new data is coming in

                var modeRangeCount = data.byteLength / 4; // 4 bytes per item.

                for (i = 0; offset < data.byteLength && i < modeRangeCount; i++) {
                    var modeRange = {
                        id: data.getUint8(offset++),
                        auxChannelIndex: data.getUint8(offset++),
                        range: {
                            start: 900 + (data.getUint8(offset++) * 25),
                            end: 900 + (data.getUint8(offset++) * 25)
                        }
                    };
                    MODE_RANGES.push(modeRange);
                }
                break;

            case MSPCodes.MSP_ADJUSTMENT_RANGES:
                //noinspection JSUndeclaredVariable
                ADJUSTMENT_RANGES = []; // empty the array as new data is coming in

                var adjustmentRangeCount = data.byteLength / 6; // 6 bytes per item.

                for (i = 0; offset < data.byteLength && i < adjustmentRangeCount; i++) {
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
                    ADJUSTMENT_RANGES.push(adjustmentRange);
                }
                break;

            case MSPCodes.MSP_CHANNEL_FORWARDING:
                for (i = 0; i < data.byteLength && i < SERVO_CONFIG.length; i++) {
                    var channelIndex = data.getUint8(i);
                    if (channelIndex < 255) {
                        SERVO_CONFIG[i].indexOfChannelToForward = channelIndex;
                    } else {
                        SERVO_CONFIG[i].indexOfChannelToForward = undefined;
                    }
                }
                break;

            case MSPCodes.MSP_RX_CONFIG:
                RX_CONFIG.serialrx_provider = data.getUint8(offset);
                offset++;
                RX_CONFIG.maxcheck = data.getUint16(offset, true);
                offset += 2;
                RX_CONFIG.midrc = data.getUint16(offset, true);
                offset += 2;
                RX_CONFIG.mincheck = data.getUint16(offset, true);
                offset += 2;
                RX_CONFIG.spektrum_sat_bind = data.getUint8(offset);
                offset++;
                RX_CONFIG.rx_min_usec = data.getUint16(offset, true);
                offset += 2;
                RX_CONFIG.rx_max_usec = data.getUint16(offset, true);
                offset += 2;
                offset += 4; // 4 null bytes for betaflight compatibility
                RX_CONFIG.spirx_protocol = data.getUint8(offset);
                offset++;
                RX_CONFIG.spirx_id = data.getUint32(offset, true);
                offset += 4;
                RX_CONFIG.spirx_channel_count = data.getUint8(offset);
                offset += 1;
                // unused byte for fpvCamAngleDegrees, for compatiblity with betaflight
                offset += 1;
                RX_CONFIG.receiver_type = data.getUint8(offset);
                offset += 1;
                break;

            case MSPCodes.MSP_FAILSAFE_CONFIG:
                FAILSAFE_CONFIG.failsafe_delay = data.getUint8(offset);
                offset++;
                FAILSAFE_CONFIG.failsafe_off_delay = data.getUint8(offset);
                offset++;
                FAILSAFE_CONFIG.failsafe_throttle = data.getUint16(offset, true);
                offset += 2;
                FAILSAFE_CONFIG.failsafe_kill_switch = data.getUint8(offset);
                offset++;
                FAILSAFE_CONFIG.failsafe_throttle_low_delay = data.getUint16(offset, true);
                offset += 2;
                FAILSAFE_CONFIG.failsafe_procedure = data.getUint8(offset);
                offset++;
                FAILSAFE_CONFIG.failsafe_recovery_delay = data.getUint8(offset);
                offset++;
                FAILSAFE_CONFIG.failsafe_fw_roll_angle = data.getUint16(offset, true);
                offset += 2;
                FAILSAFE_CONFIG.failsafe_fw_pitch_angle = data.getUint16(offset, true);
                offset += 2;
                FAILSAFE_CONFIG.failsafe_fw_yaw_rate = data.getUint16(offset, true);
                offset += 2;
                FAILSAFE_CONFIG.failsafe_stick_motion_threshold = data.getUint16(offset, true);
                offset += 2;
                FAILSAFE_CONFIG.failsafe_min_distance = data.getUint16(offset, true);
                offset += 2;
                FAILSAFE_CONFIG.failsafe_min_distance_procedure = data.getUint8(offset);
                offset++;
                break;

            case MSPCodes.MSP_RXFAIL_CONFIG:
                //noinspection JSUndeclaredVariable
                RXFAIL_CONFIG = []; // empty the array as new data is coming in

                var channelCount = data.byteLength / 3;

                for (i = 0; offset < data.byteLength && i < channelCount; i++, offset++) {
                    var rxfailChannel = {
                        mode: data.getUint8(offset++),
                        value: data.getUint16(offset++, true)
                    };
                    RXFAIL_CONFIG.push(rxfailChannel);
                }
                break;


            case MSPCodes.MSP_LED_STRIP_CONFIG:
                //noinspection JSUndeclaredVariable
                LED_STRIP = [];

                var ledCount = data.byteLength / 4;
                var directionMask,
                    directions,
                    directionLetterIndex,
                    functions,
                    led;

                for (i = 0; offset < data.byteLength && i < ledCount; i++) {

                    if (semver.lt(CONFIG.apiVersion, "1.20.0")) {
                        directionMask = data.getUint16(offset, true);
                        offset += 2;

                        directions = [];
                        for (directionLetterIndex = 0; directionLetterIndex < MSP.ledDirectionLetters.length; directionLetterIndex++) {
                            if (bit_check(directionMask, directionLetterIndex)) {
                                directions.push(MSP.ledDirectionLetters[directionLetterIndex]);
                            }
                        }

                        var functionMask = data.getUint16(offset, 1);
                        offset += 2;

                        functions = [];
                        for (var functionLetterIndex = 0; functionLetterIndex < MSP.ledFunctionLetters.length; functionLetterIndex++) {
                            if (bit_check(functionMask, functionLetterIndex)) {
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

                        LED_STRIP.push(led);
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
                            if (bit_check(overlayMask, overlayLetterIndex)) {
                                functions.push(MSP.ledOverlayLetters[overlayLetterIndex]);
                            }
                        }

                        directionMask = (mask >> 22) & 0x3F;

                        directions = [];
                        for (directionLetterIndex = 0; directionLetterIndex < MSP.ledDirectionLetters.length; directionLetterIndex++) {
                            if (bit_check(directionMask, directionLetterIndex)) {
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

                        LED_STRIP.push(led);
                    }
                }
                break;
            case MSPCodes.MSP2_INAV_LED_STRIP_CONFIG_EX:
                //noinspection JSUndeclaredVariable
                LED_STRIP = [];

                var ledCount = data.byteLength / 5;
                var directionMask,
                    directions,
                    directionLetterIndex,
                    functions,
                    led;

                for (i = 0; offset < data.byteLength && i < ledCount; i++) {
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
                        if (bit_check(overlayMask, overlayLetterIndex)) {
                            functions.push(MSP.ledOverlayLetters[overlayLetterIndex]);
                        }
                    }

                    directionMask = (mask >> 28) & 0xF | ((extra & 0x3) << 4);

                    directions = [];
                    for (directionLetterIndex = 0; directionLetterIndex < MSP.ledDirectionLetters.length; directionLetterIndex++) {
                        if (bit_check(directionMask, directionLetterIndex)) {
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

                    LED_STRIP.push(led);
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
                LED_COLORS = [];

                colorCount = data.byteLength / 4;

                for (i = 0; offset < data.byteLength && i < colorCount; i++) {

                    var h = data.getUint16(offset, true);
                    var s = data.getUint8(offset + 2);
                    var v = data.getUint8(offset + 3);
                    offset += 4;

                    color = {
                        h: h,
                        s: s,
                        v: v
                    };

                    LED_COLORS.push(color);
                }

                break;
            case MSPCodes.MSP_SET_LED_COLORS:
                console.log('Led strip colors saved');
                break;
            case MSPCodes.MSP_LED_STRIP_MODECOLOR:
                //noinspection JSUndeclaredVariable
                LED_MODE_COLORS = [];

                colorCount = data.byteLength / 3;

                for (i = 0; offset < data.byteLength && i < colorCount; i++) {

                    var mode = data.getUint8(offset++);
                    var direction = data.getUint8(offset++);

                    color = data.getUint8(offset++);

                    LED_MODE_COLORS.push({
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
                    DATAFLASH.ready = (flags & 1) != 0;
                    DATAFLASH.supported = (flags & 2) != 0 || DATAFLASH.ready;
                    DATAFLASH.sectors = data.getUint32(1, 1);
                    DATAFLASH.totalSize = data.getUint32(5, 1);
                    DATAFLASH.usedSize = data.getUint32(9, 1);
                } else {
                    // Firmware version too old to support MSP_DATAFLASH_SUMMARY
                    DATAFLASH.ready = false;
                    DATAFLASH.supported = false;
                    DATAFLASH.sectors = 0;
                    DATAFLASH.totalSize = 0;
                    DATAFLASH.usedSize = 0;
                }
                update_dataflash_global();
                break;
            case MSPCodes.MSP_DATAFLASH_READ:
                // No-op, let callback handle it
                break;
            case MSPCodes.MSP_DATAFLASH_ERASE:
                console.log("Data flash erase begun...");
                break;
            case MSPCodes.MSP_SDCARD_SUMMARY:
                flags = data.getUint8(0);

                SDCARD.supported = (flags & 0x01) != 0;
                SDCARD.state = data.getUint8(1);
                SDCARD.filesystemLastError = data.getUint8(2);
                SDCARD.freeSizeKB = data.getUint32(3, true);
                SDCARD.totalSizeKB = data.getUint32(7, true);
                break;
            case MSPCodes.MSP_BLACKBOX_CONFIG:
                BLACKBOX.supported = (data.getUint8(0) & 1) != 0;
                BLACKBOX.blackboxDevice = data.getUint8(1);
                BLACKBOX.blackboxRateNum = data.getUint8(2);
                BLACKBOX.blackboxRateDenom = data.getUint8(3);
                break;
            case MSPCodes.MSP_SET_BLACKBOX_CONFIG:
                console.log("Blackbox config saved");
                break;
            case MSPCodes.MSP_VTX_CONFIG:
                VTX_CONFIG.device_type = data.getUint8(offset++);
                if (VTX_CONFIG.device_type != VTX.DEV_UNKNOWN) {
                    VTX_CONFIG.band = data.getUint8(offset++);
                    VTX_CONFIG.channel = data.getUint8(offset++);
                    VTX_CONFIG.power = data.getUint8(offset++);
                    VTX_CONFIG.pitmode = data.getUint8(offset++);
                    // Ignore wether the VTX is ready for now
                    offset++;
                    VTX_CONFIG.low_power_disarm = data.getUint8(offset++);
                }
                break;
            case MSPCodes.MSP_ADVANCED_CONFIG:
                ADVANCED_CONFIG.gyroSyncDenominator = data.getUint8(offset);
                offset++;
                ADVANCED_CONFIG.pidProcessDenom = data.getUint8(offset);
                offset++;
                ADVANCED_CONFIG.useUnsyncedPwm = data.getUint8(offset);
                offset++;
                ADVANCED_CONFIG.motorPwmProtocol = data.getUint8(offset);
                offset++;
                ADVANCED_CONFIG.motorPwmRate = data.getUint16(offset, true);
                offset += 2;
                ADVANCED_CONFIG.servoPwmRate = data.getUint16(offset, true);
                offset += 2;
                ADVANCED_CONFIG.gyroSync = data.getUint8(offset);
                break;

            case MSPCodes.MSP_SET_VTX_CONFIG:
                console.log("VTX config saved");
                break;

            case MSPCodes.MSP_SET_ADVANCED_CONFIG:
                console.log("Advanced config saved");
                break;

            case MSPCodes.MSP_FILTER_CONFIG:
                FILTER_CONFIG.gyroSoftLpfHz = data.getUint8(0);
                FILTER_CONFIG.dtermLpfHz = data.getUint16(1, true);
                FILTER_CONFIG.yawLpfHz = data.getUint16(3, true);

                FILTER_CONFIG.gyroNotchHz1 = data.getUint16(5, true);
                FILTER_CONFIG.gyroNotchCutoff1 = data.getUint16(7, true);
                FILTER_CONFIG.dtermNotchHz = data.getUint16(9, true);
                FILTER_CONFIG.dtermNotchCutoff = data.getUint16(11, true);
                FILTER_CONFIG.gyroNotchHz2 = data.getUint16(13, true);
                FILTER_CONFIG.gyroNotchCutoff2 = data.getUint16(15, true);

                FILTER_CONFIG.accNotchHz = data.getUint16(17, true);
                FILTER_CONFIG.accNotchCutoff = data.getUint16(19, true);
                FILTER_CONFIG.gyroStage2LowpassHz = data.getUint16(21, true);

                break;

            case MSPCodes.MSP_SET_FILTER_CONFIG:
                console.log("Filter config saved");
                break;

            case MSPCodes.MSP_PID_ADVANCED:
                PID_ADVANCED.rollPitchItermIgnoreRate = data.getUint16(0, true);
                PID_ADVANCED.yawItermIgnoreRate = data.getUint16(2, true);
                PID_ADVANCED.yawPLimit = data.getUint16(4, true);
                PID_ADVANCED.dtermSetpointWeight = data.getUint8(9);
                PID_ADVANCED.pidSumLimit = data.getUint16(10, true);
                PID_ADVANCED.axisAccelerationLimitRollPitch = data.getUint16(13, true);
                PID_ADVANCED.axisAccelerationLimitYaw = data.getUint16(15, true);
                break;

            case MSPCodes.MSP_SET_PID_ADVANCED:
                console.log("PID advanced saved");
                break;

            case MSPCodes.MSP_SENSOR_CONFIG:
                SENSOR_CONFIG.accelerometer = data.getUint8(0, true);
                SENSOR_CONFIG.barometer = data.getUint8(1, true);
                SENSOR_CONFIG.magnetometer = data.getUint8(2, true);
                SENSOR_CONFIG.pitot = data.getUint8(3, true);
                SENSOR_CONFIG.rangefinder = data.getUint8(4, true);
                SENSOR_CONFIG.opflow = data.getUint8(5, true);
                break;

            case MSPCodes.MSP_SET_SENSOR_CONFIG:
                console.log("Sensor config saved");
                break;

            case MSPCodes.MSP_INAV_PID:
                INAV_PID_CONFIG.asynchronousMode = data.getUint8(0);
                INAV_PID_CONFIG.accelerometerTaskFrequency = data.getUint16(1, true);
                INAV_PID_CONFIG.attitudeTaskFrequency = data.getUint16(3, true);
                INAV_PID_CONFIG.magHoldRateLimit = data.getUint8(5);
                INAV_PID_CONFIG.magHoldErrorLpfFrequency = data.getUint8(6);
                INAV_PID_CONFIG.yawJumpPreventionLimit = data.getUint16(7, true);
                INAV_PID_CONFIG.gyroscopeLpf = data.getUint8(9);
                INAV_PID_CONFIG.accSoftLpfHz = data.getUint8(10);
                break;

            case MSPCodes.MSP_SET_INAV_PID:
                console.log("MSP_INAV_PID saved");
                break;

            case MSPCodes.MSP_NAV_POSHOLD:
                NAV_POSHOLD.userControlMode = data.getUint8(0);
                NAV_POSHOLD.maxSpeed = data.getUint16(1, true);
                NAV_POSHOLD.maxClimbRate = data.getUint16(3, true);
                NAV_POSHOLD.maxManualSpeed = data.getUint16(5, true);
                NAV_POSHOLD.maxManualClimbRate = data.getUint16(7, true);
                NAV_POSHOLD.maxBankAngle = data.getUint8(9);
                NAV_POSHOLD.useThrottleMidForAlthold = data.getUint8(10);
                NAV_POSHOLD.hoverThrottle = data.getUint16(11, true);
                break;

            case MSPCodes.MSP_SET_NAV_POSHOLD:
                console.log('NAV_POSHOLD saved');
                break;

            case MSPCodes.MSP_CALIBRATION_DATA:
                var callibrations = data.getUint8(0);
                CALIBRATION_DATA.acc.Pos0 = (1 & (callibrations >> 0));
                CALIBRATION_DATA.acc.Pos1 = (1 & (callibrations >> 1));
                CALIBRATION_DATA.acc.Pos2 = (1 & (callibrations >> 2));
                CALIBRATION_DATA.acc.Pos3 = (1 & (callibrations >> 3));
                CALIBRATION_DATA.acc.Pos4 = (1 & (callibrations >> 4));
                CALIBRATION_DATA.acc.Pos5 = (1 & (callibrations >> 5));

                CALIBRATION_DATA.accZero.X = data.getInt16(1, true);
                CALIBRATION_DATA.accZero.Y = data.getInt16(3, true);
                CALIBRATION_DATA.accZero.Z = data.getInt16(5, true);
                CALIBRATION_DATA.accGain.X = data.getInt16(7, true);
                CALIBRATION_DATA.accGain.Y = data.getInt16(9, true);
                CALIBRATION_DATA.accGain.Z = data.getInt16(11, true);
                CALIBRATION_DATA.magZero.X = data.getInt16(13, true);
                CALIBRATION_DATA.magZero.Y = data.getInt16(15, true);
                CALIBRATION_DATA.magZero.Z = data.getInt16(17, true);
                CALIBRATION_DATA.opflow.Scale = (data.getInt16(19, true) / 256.0);

                CALIBRATION_DATA.magGain.X = data.getInt16(21, true);
                CALIBRATION_DATA.magGain.Y = data.getInt16(23, true);
                CALIBRATION_DATA.magGain.Z = data.getInt16(25, true);

                break;

            case MSPCodes.MSP_SET_CALIBRATION_DATA:
                console.log('Calibration data saved');
                break;

            case MSPCodes.MSP_POSITION_ESTIMATION_CONFIG:
                POSITION_ESTIMATOR.w_z_baro_p = data.getUint16(0, true) / 100;
                POSITION_ESTIMATOR.w_z_gps_p = data.getUint16(2, true) / 100;
                POSITION_ESTIMATOR.w_z_gps_v = data.getUint16(4, true) / 100;
                POSITION_ESTIMATOR.w_xy_gps_p = data.getUint16(6, true) / 100;
                POSITION_ESTIMATOR.w_xy_gps_v = data.getUint16(8, true) / 100;
                POSITION_ESTIMATOR.gps_min_sats = data.getUint8(10);
                POSITION_ESTIMATOR.use_gps_velned = data.getUint8(11);
                break;

            case MSPCodes.MSP_SET_POSITION_ESTIMATION_CONFIG:
                console.log('POSITION_ESTIMATOR saved');
                break;

            case MSPCodes.MSP_RTH_AND_LAND_CONFIG:
                RTH_AND_LAND_CONFIG.minRthDistance = data.getUint16(0, true);
                RTH_AND_LAND_CONFIG.rthClimbFirst = data.getUint8(2);
                RTH_AND_LAND_CONFIG.rthClimbIgnoreEmergency = data.getUint8(3);
                RTH_AND_LAND_CONFIG.rthTailFirst = data.getUint8(4);
                RTH_AND_LAND_CONFIG.rthAllowLanding = data.getUint8(5);
                RTH_AND_LAND_CONFIG.rthAltControlMode = data.getUint8(6);
                RTH_AND_LAND_CONFIG.rthAbortThreshold = data.getUint16(7, true);
                RTH_AND_LAND_CONFIG.rthAltitude = data.getUint16(9, true);
                RTH_AND_LAND_CONFIG.landMinAltVspd = data.getUint16(11, true);
                RTH_AND_LAND_CONFIG.landMaxAltVspd = data.getUint16(13, true);
                RTH_AND_LAND_CONFIG.landSlowdownMinAlt = data.getUint16(15, true);
                RTH_AND_LAND_CONFIG.landSlowdownMaxAlt = data.getUint16(17, true);
                RTH_AND_LAND_CONFIG.emergencyDescentRate = data.getUint16(19, true);
                break;

            case MSPCodes.MSP_SET_RTH_AND_LAND_CONFIG:
                console.log('RTH_AND_LAND_CONFIG saved');
                break;

            case MSPCodes.MSP_FW_CONFIG:
                FW_CONFIG.cruiseThrottle = data.getUint16(0, true);
                FW_CONFIG.minThrottle = data.getUint16(2, true);
                FW_CONFIG.maxThrottle = data.getUint16(4, true);
                FW_CONFIG.maxBankAngle = data.getUint8(6);
                FW_CONFIG.maxClimbAngle = data.getUint8(7);
                FW_CONFIG.maxDiveAngle = data.getUint8(8);
                FW_CONFIG.pitchToThrottle = data.getUint8(9);
                FW_CONFIG.loiterRadius = data.getUint16(10, true);
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
            case MSPCodes.MSP_SET_ARMING_CONFIG:
                console.log('Arming config saved');
                break;
            case MSPCodes.MSP_SET_RESET_CURR_PID:
                console.log('Current PID profile reset');
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
            case MSPCodes.MSP_SET_RXFAIL_CONFIG:
                console.log('Rxfail config saved');
                break;
            case MSPCodes.MSP_SET_FAILSAFE_CONFIG:
                console.log('Failsafe config saved');
                break;
            case MSPCodes.MSP_OSD_CONFIG:
                break;
            case MSPCodes.MSP_SET_OSD_CONFIG:
                console.log('OSD config set');
                break;
            case MSPCodes.MSP_OSD_CHAR_READ:
                break;
            case MSPCodes.MSP_OSD_CHAR_WRITE:
                console.log('OSD char uploaded');
                break;
            case MSPCodes.MSP_NAME:
                CONFIG.name = '';
                var char;
                while ((char = data.readU8()) !== null) {
                    CONFIG.name += String.fromCharCode(char);
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
                MISSION_PLANNER.setMaxWaypoints(data.getUint8(1));
                MISSION_PLANNER.setValidMission(data.getUint8(2));
                MISSION_PLANNER.setCountBusyPoints(data.getUint8(3));
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
                MIXER_CONFIG.yawMotorDirection = data.getInt8(0);
                MIXER_CONFIG.yawJumpPreventionLimit = data.getUint8(1, true);
                MIXER_CONFIG.motorStopOnLow = data.getUint8(2, true);
                MIXER_CONFIG.platformType = data.getInt8(3);
                MIXER_CONFIG.hasFlaps = data.getInt8(4);
                MIXER_CONFIG.appliedMixerPreset = data.getInt16(5, true);
                MIXER_CONFIG.numberOfMotors = data.getInt8(7);
                MIXER_CONFIG.numberOfServos = data.getInt8(8);
                MOTOR_RULES.setMotorCount(MIXER_CONFIG.numberOfMotors);
                SERVO_RULES.setServoCount(MIXER_CONFIG.numberOfServos);
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
            case MSPCodes.MSPV2_INAV_OUTPUT_MAPPING:
                OUTPUT_MAPPING.flush();
                for (i = 0; i < data.byteLength; ++i)
                    OUTPUT_MAPPING.put({
                        'timerId': i,
                        'usageFlags': data.getUint8(i)});
                break;
            case MSPCodes.MSPV2_INAV_OUTPUT_MAPPING_EXT:
                OUTPUT_MAPPING.flush();
                for (i = 0; i < data.byteLength; i += 2) {
                    timerId = data.getUint8(i);
                    usageFlags = data.getUint8(i + 1);
                    OUTPUT_MAPPING.put(
                        {
                            'timerId': timerId,
                            'usageFlags': usageFlags
                        });
                }
                break;
            
            case MSPCodes.MSP2_INAV_TIMER_OUTPUT_MODE:
                if(data.byteLength > 2) {
                    OUTPUT_MAPPING.flushTimerOverrides();
                }
                for (i = 0; i < data.byteLength; i += 2) {
                    timerId = data.getUint8(i);
                    outputMode = data.getUint8(i + 1);
                    OUTPUT_MAPPING.setTimerOverride(timerId, outputMode);
                }
                break;

            case MSPCodes.MSP2_INAV_MC_BRAKING:
                try {
                    BRAKING_CONFIG.speedThreshold = data.getUint16(0, true);
                    BRAKING_CONFIG.disengageSpeed = data.getUint16(2, true);
                    BRAKING_CONFIG.timeout = data.getUint16(4, true);
                    BRAKING_CONFIG.boostFactor = data.getInt8(6);
                    BRAKING_CONFIG.boostTimeout = data.getUint16(7, true);
                    BRAKING_CONFIG.boostSpeedThreshold = data.getUint16(9, true);
                    BRAKING_CONFIG.boostDisengageSpeed = data.getUint16(11, true);
                    BRAKING_CONFIG.bankAngle = data.getInt8(13);
                } catch (e) {
                    console.log("MC_BRAKING MODE is not supported by the hardware");
                }
                break;

            case MSPCodes.MSP2_INAV_SET_MC_BRAKING:
                console.log('Braking config saved');
                break;
            case MSPCodes.MSP2_BLACKBOX_CONFIG:
                BLACKBOX.supported = (data.getUint8(0) & 1) != 0;
                BLACKBOX.blackboxDevice = data.getUint8(1);
                BLACKBOX.blackboxRateNum = data.getUint16(2);
                BLACKBOX.blackboxRateDenom = data.getUint16(4);
                BLACKBOX.blackboxIncludeFlags = data.getUint32(6,true);
                break;
            case MSPCodes.MSP2_SET_BLACKBOX_CONFIG:
                console.log("Blackbox config saved");
                break;

            case MSPCodes.MSP2_INAV_TEMPERATURES:
                for (i = 0; i < 8; ++i) {
                    temp_decidegrees = data.getInt16(i * 2, true);
                    SENSOR_DATA.temperature[i] = temp_decidegrees / 10; // °C
                }
                break;
            case MSPCodes.MSP2_INAV_SAFEHOME:
                SAFEHOMES.put(new Safehome(
                    data.getUint8(0),
                    data.getUint8(1),
                    data.getInt32(2, true),
                    data.getInt32(6, true)
                ));
                break;
            case MSPCodes.MSP2_INAV_SET_SAFEHOME:
                console.log('Safehome points saved');
                break;

            case MSPCodes.MSP2_INAV_RATE_DYNAMICS:
                RATE_DYNAMICS.sensitivityCenter = data.getUint8(0);
                RATE_DYNAMICS.sensitivityEnd = data.getUint8(1);
                RATE_DYNAMICS.correctionCenter = data.getUint8(2);
                RATE_DYNAMICS.correctionEnd = data.getUint8(3);
                RATE_DYNAMICS.weightCenter = data.getUint8(4);
                RATE_DYNAMICS.weightEnd = data.getUint8(5);
                break;

            case MSPCodes.MSP2_INAV_SET_RATE_DYNAMICS:
                console.log('Rate dynamics saved');
                break;

            case MSPCodes.MSP2_INAV_EZ_TUNE:
                EZ_TUNE.enabled = data.getUint8(0);
                EZ_TUNE.filterHz = data.getUint16(1, true);
                EZ_TUNE.axisRatio = data.getUint8(3);
                EZ_TUNE.response = data.getUint8(4);
                EZ_TUNE.damping = data.getUint8(5);
                EZ_TUNE.stability = data.getUint8(6);
                EZ_TUNE.aggressiveness = data.getUint8(7);
                EZ_TUNE.rate = data.getUint8(8);
                EZ_TUNE.expo = data.getUint8(9);
                break;

            case MSPCodes.MSP2_INAV_EZ_TUNE_SET:
                console.log('EzTune settings saved');
                break;

            default:
                console.log('Unknown code detected: ' + dataHandler.code);
        } else {
            console.log('FC reports unsupported message error: ' + dataHandler.code);
        }

        // trigger callbacks, cleanup/remove callback after trigger
        for (i = dataHandler.callbacks.length - 1; i >= 0; i--) { // iterating in reverse because we use .splice which modifies array length
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
                        helper.mspQueue.putRoundtrip(new Date().getTime() - dataHandler.callbacks[i].createdOn);
                        helper.mspQueue.putHardwareRoundtrip(new Date().getTime() - dataHandler.callbacks[i].sentOn);
                    }

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
                buffer.push(specificByte(FEATURES, 0));
                buffer.push(specificByte(FEATURES, 1));
                buffer.push(specificByte(FEATURES, 2));
                buffer.push(specificByte(FEATURES, 3));
                break;

            case MSPCodes.MSP_SET_BOARD_ALIGNMENT:
                buffer.push(specificByte(BOARD_ALIGNMENT.roll, 0));
                buffer.push(specificByte(BOARD_ALIGNMENT.roll, 1));
                buffer.push(specificByte(BOARD_ALIGNMENT.pitch, 0));
                buffer.push(specificByte(BOARD_ALIGNMENT.pitch, 1));
                buffer.push(specificByte(BOARD_ALIGNMENT.yaw, 0));
                buffer.push(specificByte(BOARD_ALIGNMENT.yaw, 1));
                break;

            case MSPCodes.MSP_SET_CURRENT_METER_CONFIG:
                buffer.push(specificByte(CURRENT_METER_CONFIG.scale, 0));
                buffer.push(specificByte(CURRENT_METER_CONFIG.scale, 1));
                buffer.push(specificByte(CURRENT_METER_CONFIG.offset, 0));
                buffer.push(specificByte(CURRENT_METER_CONFIG.offset, 1));
                buffer.push(CURRENT_METER_CONFIG.type);
                buffer.push(specificByte(CURRENT_METER_CONFIG.capacity, 0));
                buffer.push(specificByte(CURRENT_METER_CONFIG.capacity, 1));
                break;

            case MSPCodes.MSP_SET_VTX_CONFIG:
                if (VTX_CONFIG.band > 0) {
                    buffer.push16(((VTX_CONFIG.band - 1) * 8) + (VTX_CONFIG.channel - 1));
                } else {
                    // This tells the firmware to ignore this value.
                    buffer.push16(VTX.MAX_FREQUENCY_MHZ + 1);
                }
                buffer.push(VTX_CONFIG.power);
                // Don't enable PIT mode
                buffer.push(0);
                buffer.push(VTX_CONFIG.low_power_disarm);
                break;
            case MSPCodes.MSP2_SET_PID:
                for (i = 0; i < PIDs.length; i++) {
                    buffer.push(parseInt(PIDs[i][0]));
                    buffer.push(parseInt(PIDs[i][1]));
                    buffer.push(parseInt(PIDs[i][2]));
                    buffer.push(parseInt(PIDs[i][3]));
                }
                break;
            case MSPCodes.MSP_SET_RC_TUNING:
                buffer.push(Math.round(RC_tuning.RC_RATE * 100));
                buffer.push(Math.round(RC_tuning.RC_EXPO * 100));
                buffer.push(Math.round(RC_tuning.roll_rate / 10));
                buffer.push(Math.round(RC_tuning.pitch_rate / 10));
                buffer.push(Math.round(RC_tuning.yaw_rate / 10));
                buffer.push(RC_tuning.dynamic_THR_PID);
                buffer.push(Math.round(RC_tuning.throttle_MID * 100));
                buffer.push(Math.round(RC_tuning.throttle_EXPO * 100));
                buffer.push(lowByte(RC_tuning.dynamic_THR_breakpoint));
                buffer.push(highByte(RC_tuning.dynamic_THR_breakpoint));
                buffer.push(Math.round(RC_tuning.RC_YAW_EXPO * 100));
                break;
            case MSPCodes.MSPV2_INAV_SET_RATE_PROFILE:
                // throttle
                buffer.push(Math.round(RC_tuning.throttle_MID * 100));
                buffer.push(Math.round(RC_tuning.throttle_EXPO * 100));
                buffer.push(RC_tuning.dynamic_THR_PID);
                buffer.push(lowByte(RC_tuning.dynamic_THR_breakpoint));
                buffer.push(highByte(RC_tuning.dynamic_THR_breakpoint));

                // stabilized
                buffer.push(Math.round(RC_tuning.RC_EXPO * 100));
                buffer.push(Math.round(RC_tuning.RC_YAW_EXPO * 100));
                buffer.push(Math.round(RC_tuning.roll_rate / 10));
                buffer.push(Math.round(RC_tuning.pitch_rate / 10));
                buffer.push(Math.round(RC_tuning.yaw_rate / 10));

                // manual
                buffer.push(Math.round(RC_tuning.manual_RC_EXPO * 100));
                buffer.push(Math.round(RC_tuning.manual_RC_YAW_EXPO * 100));
                buffer.push(RC_tuning.manual_roll_rate);
                buffer.push(RC_tuning.manual_pitch_rate);
                buffer.push(RC_tuning.manual_yaw_rate);
                break;

            case MSPCodes.MSP_SET_RX_MAP:
                for (i = 0; i < RC_MAP.length; i++) {
                    buffer.push(RC_MAP[i]);
                }
                break;
            case MSPCodes.MSP_SET_ACC_TRIM:
                buffer.push(lowByte(CONFIG.accelerometerTrims[0]));
                buffer.push(highByte(CONFIG.accelerometerTrims[0]));
                buffer.push(lowByte(CONFIG.accelerometerTrims[1]));
                buffer.push(highByte(CONFIG.accelerometerTrims[1]));
                break;
            case MSPCodes.MSP_SET_ARMING_CONFIG:
                buffer.push(ARMING_CONFIG.auto_disarm_delay);
                buffer.push(ARMING_CONFIG.disarm_kill_switch);
                break;
            case MSPCodes.MSP_SET_LOOP_TIME:
                buffer.push(lowByte(FC_CONFIG.loopTime));
                buffer.push(highByte(FC_CONFIG.loopTime));
                break;
            case MSPCodes.MSP_SET_MISC:
                buffer.push(lowByte(MISC.midrc));
                buffer.push(highByte(MISC.midrc));
                buffer.push(lowByte(MISC.minthrottle));
                buffer.push(highByte(MISC.minthrottle));
                buffer.push(lowByte(MISC.maxthrottle));
                buffer.push(highByte(MISC.maxthrottle));
                buffer.push(lowByte(MISC.mincommand));
                buffer.push(highByte(MISC.mincommand));
                buffer.push(lowByte(MISC.failsafe_throttle));
                buffer.push(highByte(MISC.failsafe_throttle));
                buffer.push(MISC.gps_type);
                buffer.push(MISC.sensors_baudrate);
                buffer.push(MISC.gps_ubx_sbas);
                buffer.push(MISC.multiwiicurrentoutput);
                buffer.push(MISC.rssi_channel);
                buffer.push(MISC.placeholder2);
                buffer.push(lowByte(Math.round(MISC.mag_declination * 10)));
                buffer.push(highByte(Math.round(MISC.mag_declination * 10)));
                buffer.push(MISC.vbatscale);
                buffer.push(Math.round(MISC.vbatmincellvoltage * 10));
                buffer.push(Math.round(MISC.vbatmaxcellvoltage * 10));
                buffer.push(Math.round(MISC.vbatwarningcellvoltage * 10));
                break;
            case MSPCodes.MSPV2_INAV_SET_MISC:
                buffer.push(lowByte(MISC.midrc));
                buffer.push(highByte(MISC.midrc));
                buffer.push(lowByte(MISC.minthrottle));
                buffer.push(highByte(MISC.minthrottle));
                buffer.push(lowByte(MISC.maxthrottle));
                buffer.push(highByte(MISC.maxthrottle));
                buffer.push(lowByte(MISC.mincommand));
                buffer.push(highByte(MISC.mincommand));
                buffer.push(lowByte(MISC.failsafe_throttle));
                buffer.push(highByte(MISC.failsafe_throttle));
                buffer.push(MISC.gps_type);
                buffer.push(MISC.sensors_baudrate);
                buffer.push(MISC.gps_ubx_sbas);
                buffer.push(MISC.rssi_channel);
                buffer.push(lowByte(Math.round(MISC.mag_declination * 10)));
                buffer.push(highByte(Math.round(MISC.mag_declination * 10)));
                buffer.push(lowByte(MISC.vbatscale));
                buffer.push(highByte(MISC.vbatscale));
                buffer.push(MISC.voltage_source);
                buffer.push(MISC.battery_cells);
                buffer.push(lowByte(Math.round(MISC.vbatdetectcellvoltage * 100)));
                buffer.push(highByte(Math.round(MISC.vbatdetectcellvoltage * 100)));
                buffer.push(lowByte(Math.round(MISC.vbatmincellvoltage * 100)));
                buffer.push(highByte(Math.round(MISC.vbatmincellvoltage * 100)));
                buffer.push(lowByte(Math.round(MISC.vbatmaxcellvoltage * 100)));
                buffer.push(highByte(Math.round(MISC.vbatmaxcellvoltage * 100)));
                buffer.push(lowByte(Math.round(MISC.vbatwarningcellvoltage * 100)));
                buffer.push(highByte(Math.round(MISC.vbatwarningcellvoltage * 100)));
                for (byte_index = 0; byte_index < 4; ++byte_index)
                    buffer.push(specificByte(MISC.battery_capacity, byte_index));
                for (byte_index = 0; byte_index < 4; ++byte_index)
                    buffer.push(specificByte(MISC.battery_capacity_warning, byte_index));
                for (byte_index = 0; byte_index < 4; ++byte_index)
                    buffer.push(specificByte(MISC.battery_capacity_critical, byte_index));
                buffer.push((MISC.battery_capacity_unit == 'mAh') ? 0 : 1);
                break;
            case MSPCodes.MSPV2_INAV_SET_BATTERY_CONFIG:
                buffer.push(lowByte(BATTERY_CONFIG.vbatscale));
                buffer.push(highByte(BATTERY_CONFIG.vbatscale));
                buffer.push(BATTERY_CONFIG.voltage_source);
                buffer.push(BATTERY_CONFIG.battery_cells);
                buffer.push(lowByte(Math.round(BATTERY_CONFIG.vbatdetectcellvoltage * 100)));
                buffer.push(highByte(Math.round(BATTERY_CONFIG.vbatdetectcellvoltage * 100)));
                buffer.push(lowByte(Math.round(BATTERY_CONFIG.vbatmincellvoltage * 100)));
                buffer.push(highByte(Math.round(BATTERY_CONFIG.vbatmincellvoltage * 100)));
                buffer.push(lowByte(Math.round(BATTERY_CONFIG.vbatmaxcellvoltage * 100)));
                buffer.push(highByte(Math.round(BATTERY_CONFIG.vbatmaxcellvoltage * 100)));
                buffer.push(lowByte(Math.round(BATTERY_CONFIG.vbatwarningcellvoltage * 100)));
                buffer.push(highByte(Math.round(BATTERY_CONFIG.vbatwarningcellvoltage * 100)));
                buffer.push(lowByte(BATTERY_CONFIG.current_offset));
                buffer.push(highByte(BATTERY_CONFIG.current_offset));
                buffer.push(lowByte(BATTERY_CONFIG.current_scale));
                buffer.push(highByte(BATTERY_CONFIG.current_scale));
                for (byte_index = 0; byte_index < 4; ++byte_index)
                    buffer.push(specificByte(BATTERY_CONFIG.capacity, byte_index));
                for (byte_index = 0; byte_index < 4; ++byte_index)
                    buffer.push(specificByte(BATTERY_CONFIG.capacity_warning, byte_index));
                for (byte_index = 0; byte_index < 4; ++byte_index)
                    buffer.push(specificByte(BATTERY_CONFIG.capacity_critical, byte_index));
                buffer.push(BATTERY_CONFIG.capacity_unit);
                break;

            case MSPCodes.MSP_SET_RX_CONFIG:
                buffer.push(RX_CONFIG.serialrx_provider);
                buffer.push(lowByte(RX_CONFIG.maxcheck));
                buffer.push(highByte(RX_CONFIG.maxcheck));
                buffer.push(lowByte(RX_CONFIG.midrc));
                buffer.push(highByte(RX_CONFIG.midrc));
                buffer.push(lowByte(RX_CONFIG.mincheck));
                buffer.push(highByte(RX_CONFIG.mincheck));
                buffer.push(RX_CONFIG.spektrum_sat_bind);
                buffer.push(lowByte(RX_CONFIG.rx_min_usec));
                buffer.push(highByte(RX_CONFIG.rx_min_usec));
                buffer.push(lowByte(RX_CONFIG.rx_max_usec));
                buffer.push(highByte(RX_CONFIG.rx_max_usec));
                buffer.push(0); // 4 null bytes for betaflight compatibility
                buffer.push(0);
                buffer.push(0);
                buffer.push(0);
                buffer.push(RX_CONFIG.spirx_protocol);
                // spirx_id - 4 bytes
                buffer.push32(RX_CONFIG.spirx_id);
                buffer.push(RX_CONFIG.spirx_channel_count);
                // unused byte for fpvCamAngleDegrees, for compatiblity with betaflight
                buffer.push(0);
                // receiver type in RX_CONFIG rather than in BF_CONFIG.features
                buffer.push(RX_CONFIG.receiver_type);
                break;

            case MSPCodes.MSP_SET_FAILSAFE_CONFIG:
                buffer.push(FAILSAFE_CONFIG.failsafe_delay);
                buffer.push(FAILSAFE_CONFIG.failsafe_off_delay);
                buffer.push(lowByte(FAILSAFE_CONFIG.failsafe_throttle));
                buffer.push(highByte(FAILSAFE_CONFIG.failsafe_throttle));
                buffer.push(FAILSAFE_CONFIG.failsafe_kill_switch);
                buffer.push(lowByte(FAILSAFE_CONFIG.failsafe_throttle_low_delay));
                buffer.push(highByte(FAILSAFE_CONFIG.failsafe_throttle_low_delay));
                buffer.push(FAILSAFE_CONFIG.failsafe_procedure);
                buffer.push(FAILSAFE_CONFIG.failsafe_recovery_delay);
                buffer.push(lowByte(FAILSAFE_CONFIG.failsafe_fw_roll_angle));
                buffer.push(highByte(FAILSAFE_CONFIG.failsafe_fw_roll_angle));
                buffer.push(lowByte(FAILSAFE_CONFIG.failsafe_fw_pitch_angle));
                buffer.push(highByte(FAILSAFE_CONFIG.failsafe_fw_pitch_angle));
                buffer.push(lowByte(FAILSAFE_CONFIG.failsafe_fw_yaw_rate));
                buffer.push(highByte(FAILSAFE_CONFIG.failsafe_fw_yaw_rate));
                buffer.push(lowByte(FAILSAFE_CONFIG.failsafe_stick_motion_threshold));
                buffer.push(highByte(FAILSAFE_CONFIG.failsafe_stick_motion_threshold));
                buffer.push(lowByte(FAILSAFE_CONFIG.failsafe_min_distance));
                buffer.push(highByte(FAILSAFE_CONFIG.failsafe_min_distance));
                buffer.push(FAILSAFE_CONFIG.failsafe_min_distance_procedure);
                break;

            case MSPCodes.MSP_SET_CHANNEL_FORWARDING:
                for (i = 0; i < SERVO_CONFIG.length; i++) {
                    var out = SERVO_CONFIG[i].indexOfChannelToForward;
                    if (out == undefined) {
                        out = 255; // Cleanflight defines "CHANNEL_FORWARDING_DISABLED" as "(uint8_t)0xFF"
                    }
                    buffer.push(out);
                }
                break;

            case MSPCodes.MSP2_SET_CF_SERIAL_CONFIG:
                for (i = 0; i < SERIAL_CONFIG.ports.length; i++) {
                    var serialPort = SERIAL_CONFIG.ports[i];

                    buffer.push(serialPort.identifier);

                    var functionMask = mspHelper.SERIAL_PORT_FUNCTIONSToMask(serialPort.functions);
                    buffer.push(specificByte(functionMask, 0));
                    buffer.push(specificByte(functionMask, 1));
                    buffer.push(specificByte(functionMask, 2));
                    buffer.push(specificByte(functionMask, 3));

                    var BAUD_RATES = mspHelper.BAUD_RATES_post1_6_3;
                    buffer.push(BAUD_RATES.indexOf(serialPort.msp_baudrate));
                    buffer.push(BAUD_RATES.indexOf(serialPort.sensors_baudrate));
                    buffer.push(BAUD_RATES.indexOf(serialPort.telemetry_baudrate));
                    buffer.push(BAUD_RATES.indexOf(serialPort.peripherals_baudrate));
                }
                break;

            case MSPCodes.MSP_SET_3D:
                buffer.push(lowByte(REVERSIBLE_MOTORS.deadband_low));
                buffer.push(highByte(REVERSIBLE_MOTORS.deadband_low));
                buffer.push(lowByte(REVERSIBLE_MOTORS.deadband_high));
                buffer.push(highByte(REVERSIBLE_MOTORS.deadband_high));
                buffer.push(lowByte(REVERSIBLE_MOTORS.neutral));
                buffer.push(highByte(REVERSIBLE_MOTORS.neutral));
                break;

            case MSPCodes.MSP_SET_RC_DEADBAND:
                buffer.push(RC_deadband.deadband);
                buffer.push(RC_deadband.yaw_deadband);
                buffer.push(RC_deadband.alt_hold_deadband);
                buffer.push(lowByte(REVERSIBLE_MOTORS.deadband_throttle));
                buffer.push(highByte(REVERSIBLE_MOTORS.deadband_throttle));
                break;

            case MSPCodes.MSP_SET_SENSOR_ALIGNMENT:
                buffer.push(SENSOR_ALIGNMENT.align_gyro);
                buffer.push(SENSOR_ALIGNMENT.align_acc);
                buffer.push(SENSOR_ALIGNMENT.align_mag);
                buffer.push(SENSOR_ALIGNMENT.align_opflow);
                break;

            case MSPCodes.MSP_SET_ADVANCED_CONFIG:
                buffer.push(ADVANCED_CONFIG.gyroSyncDenominator);
                buffer.push(ADVANCED_CONFIG.pidProcessDenom);
                buffer.push(ADVANCED_CONFIG.useUnsyncedPwm);
                buffer.push(ADVANCED_CONFIG.motorPwmProtocol);

                buffer.push(lowByte(ADVANCED_CONFIG.motorPwmRate));
                buffer.push(highByte(ADVANCED_CONFIG.motorPwmRate));

                buffer.push(lowByte(ADVANCED_CONFIG.servoPwmRate));
                buffer.push(highByte(ADVANCED_CONFIG.servoPwmRate));

                buffer.push(ADVANCED_CONFIG.gyroSync);
                break;

            case MSPCodes.MSP_SET_INAV_PID:
                buffer.push(INAV_PID_CONFIG.asynchronousMode);

                buffer.push(lowByte(INAV_PID_CONFIG.accelerometerTaskFrequency));
                buffer.push(highByte(INAV_PID_CONFIG.accelerometerTaskFrequency));

                buffer.push(lowByte(INAV_PID_CONFIG.attitudeTaskFrequency));
                buffer.push(highByte(INAV_PID_CONFIG.attitudeTaskFrequency));

                buffer.push(INAV_PID_CONFIG.magHoldRateLimit);
                buffer.push(INAV_PID_CONFIG.magHoldErrorLpfFrequency);

                buffer.push(lowByte(INAV_PID_CONFIG.yawJumpPreventionLimit));
                buffer.push(highByte(INAV_PID_CONFIG.yawJumpPreventionLimit));

                buffer.push(INAV_PID_CONFIG.gyroscopeLpf);
                buffer.push(INAV_PID_CONFIG.accSoftLpfHz);

                buffer.push(0); //reserved
                buffer.push(0); //reserved
                buffer.push(0); //reserved
                buffer.push(0); //reserved
                break;

            case MSPCodes.MSP_SET_NAV_POSHOLD:
                buffer.push(NAV_POSHOLD.userControlMode);

                buffer.push(lowByte(NAV_POSHOLD.maxSpeed));
                buffer.push(highByte(NAV_POSHOLD.maxSpeed));

                buffer.push(lowByte(NAV_POSHOLD.maxClimbRate));
                buffer.push(highByte(NAV_POSHOLD.maxClimbRate));

                buffer.push(lowByte(NAV_POSHOLD.maxManualSpeed));
                buffer.push(highByte(NAV_POSHOLD.maxManualSpeed));

                buffer.push(lowByte(NAV_POSHOLD.maxManualClimbRate));
                buffer.push(highByte(NAV_POSHOLD.maxManualClimbRate));

                buffer.push(NAV_POSHOLD.maxBankAngle);
                buffer.push(NAV_POSHOLD.useThrottleMidForAlthold);

                buffer.push(lowByte(NAV_POSHOLD.hoverThrottle));
                buffer.push(highByte(NAV_POSHOLD.hoverThrottle));
                break;

            case MSPCodes.MSP_SET_CALIBRATION_DATA:

                buffer.push(lowByte(CALIBRATION_DATA.accZero.X));
                buffer.push(highByte(CALIBRATION_DATA.accZero.X));

                buffer.push(lowByte(CALIBRATION_DATA.accZero.Y));
                buffer.push(highByte(CALIBRATION_DATA.accZero.Y));

                buffer.push(lowByte(CALIBRATION_DATA.accZero.Z));
                buffer.push(highByte(CALIBRATION_DATA.accZero.Z));

                buffer.push(lowByte(CALIBRATION_DATA.accGain.X));
                buffer.push(highByte(CALIBRATION_DATA.accGain.X));

                buffer.push(lowByte(CALIBRATION_DATA.accGain.Y));
                buffer.push(highByte(CALIBRATION_DATA.accGain.Y));

                buffer.push(lowByte(CALIBRATION_DATA.accGain.Z));
                buffer.push(highByte(CALIBRATION_DATA.accGain.Z));

                buffer.push(lowByte(CALIBRATION_DATA.magZero.X));
                buffer.push(highByte(CALIBRATION_DATA.magZero.X));

                buffer.push(lowByte(CALIBRATION_DATA.magZero.Y));
                buffer.push(highByte(CALIBRATION_DATA.magZero.Y));

                buffer.push(lowByte(CALIBRATION_DATA.magZero.Z));
                buffer.push(highByte(CALIBRATION_DATA.magZero.Z));

                buffer.push(lowByte(Math.round(CALIBRATION_DATA.opflow.Scale * 256)));
                buffer.push(highByte(Math.round(CALIBRATION_DATA.opflow.Scale * 256)));

                buffer.push(lowByte(CALIBRATION_DATA.magGain.X));
                buffer.push(highByte(CALIBRATION_DATA.magGain.X));

                buffer.push(lowByte(CALIBRATION_DATA.magGain.Y));
                buffer.push(highByte(CALIBRATION_DATA.magGain.Y));

                buffer.push(lowByte(CALIBRATION_DATA.magGain.Z));
                buffer.push(highByte(CALIBRATION_DATA.magGain.Z));

                break;

            case MSPCodes.MSP_SET_POSITION_ESTIMATION_CONFIG:
                buffer.push(lowByte(POSITION_ESTIMATOR.w_z_baro_p * 100));
                buffer.push(highByte(POSITION_ESTIMATOR.w_z_baro_p * 100));

                buffer.push(lowByte(POSITION_ESTIMATOR.w_z_gps_p * 100));
                buffer.push(highByte(POSITION_ESTIMATOR.w_z_gps_p * 100));

                buffer.push(lowByte(POSITION_ESTIMATOR.w_z_gps_v * 100));
                buffer.push(highByte(POSITION_ESTIMATOR.w_z_gps_v * 100));

                buffer.push(lowByte(POSITION_ESTIMATOR.w_xy_gps_p * 100));
                buffer.push(highByte(POSITION_ESTIMATOR.w_xy_gps_p * 100));

                buffer.push(lowByte(POSITION_ESTIMATOR.w_xy_gps_v * 100));
                buffer.push(highByte(POSITION_ESTIMATOR.w_xy_gps_v * 100));

                buffer.push(POSITION_ESTIMATOR.gps_min_sats);
                buffer.push(POSITION_ESTIMATOR.use_gps_velned);
                break;

            case MSPCodes.MSP_SET_RTH_AND_LAND_CONFIG:
                buffer.push(lowByte(RTH_AND_LAND_CONFIG.minRthDistance));
                buffer.push(highByte(RTH_AND_LAND_CONFIG.minRthDistance));

                buffer.push(RTH_AND_LAND_CONFIG.rthClimbFirst);
                buffer.push(RTH_AND_LAND_CONFIG.rthClimbIgnoreEmergency);
                buffer.push(RTH_AND_LAND_CONFIG.rthTailFirst);
                buffer.push(RTH_AND_LAND_CONFIG.rthAllowLanding);
                buffer.push(RTH_AND_LAND_CONFIG.rthAltControlMode);

                buffer.push(lowByte(RTH_AND_LAND_CONFIG.rthAbortThreshold));
                buffer.push(highByte(RTH_AND_LAND_CONFIG.rthAbortThreshold));

                buffer.push(lowByte(RTH_AND_LAND_CONFIG.rthAltitude));
                buffer.push(highByte(RTH_AND_LAND_CONFIG.rthAltitude));

                buffer.push(lowByte(RTH_AND_LAND_CONFIG.landMinAltVspd));
                buffer.push(highByte(RTH_AND_LAND_CONFIG.landMinAltVspd));

                buffer.push(lowByte(RTH_AND_LAND_CONFIG.landMaxAltVspd));
                buffer.push(highByte(RTH_AND_LAND_CONFIG.landMaxAltVspd));

                buffer.push(lowByte(RTH_AND_LAND_CONFIG.landSlowdownMinAlt));
                buffer.push(highByte(RTH_AND_LAND_CONFIG.landSlowdownMinAlt));

                buffer.push(lowByte(RTH_AND_LAND_CONFIG.landSlowdownMaxAlt));
                buffer.push(highByte(RTH_AND_LAND_CONFIG.landSlowdownMaxAlt));

                buffer.push(lowByte(RTH_AND_LAND_CONFIG.emergencyDescentRate));
                buffer.push(highByte(RTH_AND_LAND_CONFIG.emergencyDescentRate));
                break;

            case MSPCodes.MSP_SET_FW_CONFIG:

                buffer.push(lowByte(FW_CONFIG.cruiseThrottle));
                buffer.push(highByte(FW_CONFIG.cruiseThrottle));

                buffer.push(lowByte(FW_CONFIG.minThrottle));
                buffer.push(highByte(FW_CONFIG.minThrottle));

                buffer.push(lowByte(FW_CONFIG.maxThrottle));
                buffer.push(highByte(FW_CONFIG.maxThrottle));

                buffer.push(FW_CONFIG.maxBankAngle);
                buffer.push(FW_CONFIG.maxClimbAngle);
                buffer.push(FW_CONFIG.maxDiveAngle);
                buffer.push(FW_CONFIG.pitchToThrottle);

                buffer.push(lowByte(FW_CONFIG.loiterRadius));
                buffer.push(highByte(FW_CONFIG.loiterRadius));

                break;

            case MSPCodes.MSP_SET_FILTER_CONFIG:
                buffer.push(FILTER_CONFIG.gyroSoftLpfHz);

                buffer.push(lowByte(FILTER_CONFIG.dtermLpfHz));
                buffer.push(highByte(FILTER_CONFIG.dtermLpfHz));

                buffer.push(lowByte(FILTER_CONFIG.yawLpfHz));
                buffer.push(highByte(FILTER_CONFIG.yawLpfHz));

                buffer.push(lowByte(FILTER_CONFIG.gyroNotchHz1));
                buffer.push(highByte(FILTER_CONFIG.gyroNotchHz1));

                buffer.push(lowByte(FILTER_CONFIG.gyroNotchCutoff1));
                buffer.push(highByte(FILTER_CONFIG.gyroNotchCutoff1));

                buffer.push(lowByte(FILTER_CONFIG.dtermNotchHz));
                buffer.push(highByte(FILTER_CONFIG.dtermNotchHz));

                buffer.push(lowByte(FILTER_CONFIG.dtermNotchCutoff));
                buffer.push(highByte(FILTER_CONFIG.dtermNotchCutoff));

                buffer.push(lowByte(FILTER_CONFIG.gyroNotchHz2));
                buffer.push(highByte(FILTER_CONFIG.gyroNotchHz2));

                buffer.push(lowByte(FILTER_CONFIG.gyroNotchCutoff2));
                buffer.push(highByte(FILTER_CONFIG.gyroNotchCutoff2));

                buffer.push(lowByte(FILTER_CONFIG.accNotchHz));
                buffer.push(highByte(FILTER_CONFIG.accNotchHz));

                buffer.push(lowByte(FILTER_CONFIG.accNotchCutoff));
                buffer.push(highByte(FILTER_CONFIG.accNotchCutoff));

                buffer.push(lowByte(FILTER_CONFIG.gyroStage2LowpassHz));
                buffer.push(highByte(FILTER_CONFIG.gyroStage2LowpassHz));

                break;

            case MSPCodes.MSP_SET_PID_ADVANCED:
                buffer.push(lowByte(PID_ADVANCED.rollPitchItermIgnoreRate));
                buffer.push(highByte(PID_ADVANCED.rollPitchItermIgnoreRate));

                buffer.push(lowByte(PID_ADVANCED.yawItermIgnoreRate));
                buffer.push(highByte(PID_ADVANCED.yawItermIgnoreRate));

                buffer.push(lowByte(PID_ADVANCED.yawPLimit));
                buffer.push(highByte(PID_ADVANCED.yawPLimit));

                buffer.push(0); //BF: currentProfile->pidProfile.deltaMethod
                buffer.push(0); //BF: currentProfile->pidProfile.vbatPidCompensation
                buffer.push(0); //BF: currentProfile->pidProfile.setpointRelaxRatio

                buffer.push(PID_ADVANCED.dtermSetpointWeight);
                buffer.push(lowByte(PID_ADVANCED.pidSumLimit));
                buffer.push(highByte(PID_ADVANCED.pidSumLimit));

                buffer.push(0); //BF: currentProfile->pidProfile.itermThrottleGain

                buffer.push(lowByte(PID_ADVANCED.axisAccelerationLimitRollPitch));
                buffer.push(highByte(PID_ADVANCED.axisAccelerationLimitRollPitch));

                buffer.push(lowByte(PID_ADVANCED.axisAccelerationLimitYaw));
                buffer.push(highByte(PID_ADVANCED.axisAccelerationLimitYaw));
                break;

            case MSPCodes.MSP_SET_SENSOR_CONFIG:
                buffer.push(SENSOR_CONFIG.accelerometer);
                buffer.push(SENSOR_CONFIG.barometer);
                buffer.push(SENSOR_CONFIG.magnetometer);
                buffer.push(SENSOR_CONFIG.pitot);
                buffer.push(SENSOR_CONFIG.rangefinder);
                buffer.push(SENSOR_CONFIG.opflow);
                break;


            case MSPCodes.MSP_WP_MISSION_SAVE:
                buffer.push(0);
                break;

            case MSPCodes.MSP_WP_MISSION_LOAD:
                buffer.push(0);
                break;

            case MSPCodes.MSP2_INAV_SET_MIXER:
                buffer.push(MIXER_CONFIG.yawMotorDirection);
                buffer.push(MIXER_CONFIG.yawJumpPreventionLimit);
                buffer.push(MIXER_CONFIG.motorStopOnLow);
                buffer.push(MIXER_CONFIG.platformType);
                buffer.push(MIXER_CONFIG.hasFlaps);
                buffer.push(lowByte(MIXER_CONFIG.appliedMixerPreset));
                buffer.push(highByte(MIXER_CONFIG.appliedMixerPreset));
                buffer.push(0); //Filler byte to match expect payload length
                buffer.push(0); //Filler byte to match expect payload length
                break;

            case MSPCodes.MSP2_INAV_SET_MC_BRAKING:
                buffer.push(lowByte(BRAKING_CONFIG.speedThreshold));
                buffer.push(highByte(BRAKING_CONFIG.speedThreshold));
                buffer.push(lowByte(BRAKING_CONFIG.disengageSpeed));
                buffer.push(highByte(BRAKING_CONFIG.disengageSpeed));
                buffer.push(lowByte(BRAKING_CONFIG.timeout));
                buffer.push(highByte(BRAKING_CONFIG.timeout));

                buffer.push(BRAKING_CONFIG.boostFactor);

                buffer.push(lowByte(BRAKING_CONFIG.boostTimeout));
                buffer.push(highByte(BRAKING_CONFIG.boostTimeout));
                buffer.push(lowByte(BRAKING_CONFIG.boostSpeedThreshold));
                buffer.push(highByte(BRAKING_CONFIG.boostSpeedThreshold));
                buffer.push(lowByte(BRAKING_CONFIG.boostDisengageSpeed));
                buffer.push(highByte(BRAKING_CONFIG.boostDisengageSpeed));

                buffer.push(BRAKING_CONFIG.bankAngle);
                break;

            case MSPCodes.MSP2_INAV_SET_RATE_DYNAMICS:
                buffer.push(RATE_DYNAMICS.sensitivityCenter);
                buffer.push(RATE_DYNAMICS.sensitivityEnd);
                buffer.push(RATE_DYNAMICS.correctionCenter);
                buffer.push(RATE_DYNAMICS.correctionEnd);
                buffer.push(RATE_DYNAMICS.weightCenter);
                buffer.push(RATE_DYNAMICS.weightEnd);
                break;

            case MSPCodes.MSP2_INAV_EZ_TUNE_SET:

                buffer.push(EZ_TUNE.enabled);
                buffer.push(lowByte(EZ_TUNE.filterHz));
                buffer.push(highByte(EZ_TUNE.filterHz));
                buffer.push(EZ_TUNE.axisRatio);
                buffer.push(EZ_TUNE.response);
                buffer.push(EZ_TUNE.damping);
                buffer.push(EZ_TUNE.stability);
                buffer.push(EZ_TUNE.aggressiveness);
                buffer.push(EZ_TUNE.rate);
                buffer.push(EZ_TUNE.expo);
                console.log(buffer);
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
            buffer.push(specificByte(channels[i], 0));
            buffer.push(specificByte(channels[i], 1));
        }

        MSP.send_message(MSPCodes.MSP_SET_RAW_RC, buffer, false);
    };

    self.sendBlackboxConfiguration = function (onDataCallback) {
        var buffer = [];
        var messageId = MSPCodes.MSP_SET_BLACKBOX_CONFIG;
        buffer.push(BLACKBOX.blackboxDevice & 0xFF);
        messageId = MSPCodes.MSP2_SET_BLACKBOX_CONFIG;
        buffer.push(lowByte(BLACKBOX.blackboxRateNum));
        buffer.push(highByte(BLACKBOX.blackboxRateNum));
        buffer.push(lowByte(BLACKBOX.blackboxRateDenom));
        buffer.push(highByte(BLACKBOX.blackboxRateDenom));
        buffer.push32(BLACKBOX.blackboxIncludeFlags);
        //noinspection JSUnusedLocalSymbols
        MSP.send_message(messageId, buffer, false, function (response) {
            onDataCallback();
        });
    };

    self.sendServoConfigurations = function (onCompleteCallback) {
        var nextFunction = send_next_servo_configuration;

        var servoIndex = 0;

        if (SERVO_CONFIG.length == 0) {
            onCompleteCallback();
        } else {
            nextFunction();
        }

        function send_next_servo_configuration() {

            var buffer = [];

            // send one at a time, with index

            var servoConfiguration = SERVO_CONFIG[servoIndex];

            buffer.push(servoIndex);

            buffer.push(lowByte(servoConfiguration.min));
            buffer.push(highByte(servoConfiguration.min));

            buffer.push(lowByte(servoConfiguration.max));
            buffer.push(highByte(servoConfiguration.max));

            buffer.push(lowByte(servoConfiguration.middle));
            buffer.push(highByte(servoConfiguration.middle));

            buffer.push(lowByte(servoConfiguration.rate));

            buffer.push(0);
            buffer.push(0);

            var out = servoConfiguration.indexOfChannelToForward;
            if (out == undefined) {
                out = 255; // Cleanflight defines "CHANNEL_FORWARDING_DISABLED" as "(uint8_t)0xFF"
            }
            buffer.push(out);

            //Mock 4 bytes of servoConfiguration.reversedInputSources
            buffer.push(0);
            buffer.push(0);
            buffer.push(0);
            buffer.push(0);

            // prepare for next iteration
            servoIndex++;
            if (servoIndex == SERVO_CONFIG.length) {
                nextFunction = onCompleteCallback;
            }
            MSP.send_message(MSPCodes.MSP_SET_SERVO_CONFIGURATION, buffer, false, nextFunction);
        }
    };

    self.sendServoMixer = function (onCompleteCallback) {
        var nextFunction = sendMixer,
            servoIndex = 0;

        if (SERVO_RULES.length == 0) {
            onCompleteCallback();
        } else {
            nextFunction();
        }

        function sendMixer() {

            var buffer = [];

            // send one at a time, with index

            var servoRule = SERVO_RULES.get()[servoIndex];

            //INAV 2.2 uses different MSP frame
            buffer.push(servoIndex);
            buffer.push(servoRule.getTarget());
            buffer.push(servoRule.getInput());
            buffer.push(lowByte(servoRule.getRate()));
            buffer.push(highByte(servoRule.getRate()));
            buffer.push(servoRule.getSpeed());
            buffer.push(servoRule.getConditionId());

            // prepare for next iteration
            servoIndex++;
            if (servoIndex == SERVO_RULES.getServoRulesCount()) { //This is the last rule. Not pretty, but we have to send all rules
                nextFunction = onCompleteCallback;
            }
            MSP.send_message(MSPCodes.MSP2_INAV_SET_SERVO_MIXER, buffer, false, nextFunction);
        }
    };

    self.sendMotorMixer = function (onCompleteCallback) {

        var nextFunction = sendMixer,
            servoIndex = 0;

        if (MOTOR_RULES.length === 0) {
            onCompleteCallback();
        } else {
            nextFunction();
        }

        function sendMixer() {

            var buffer = [];

            // send one at a time, with index

            var rule = MOTOR_RULES.get()[servoIndex];

            if (rule) {

                buffer.push(servoIndex);

                buffer.push(lowByte(rule.getThrottleForMsp()));
                buffer.push(highByte(rule.getThrottleForMsp()));

                buffer.push(lowByte(rule.getRollForMsp()));
                buffer.push(highByte(rule.getRollForMsp()));

                buffer.push(lowByte(rule.getPitchForMsp()));
                buffer.push(highByte(rule.getPitchForMsp()));

                buffer.push(lowByte(rule.getYawForMsp()));
                buffer.push(highByte(rule.getYawForMsp()));

                // prepare for next iteration
                servoIndex++;
                if (servoIndex == MOTOR_RULES.getMotorCount()) { //This is the last rule. Not pretty, but we have to send all rules
                    nextFunction = onCompleteCallback;
                }
                MSP.send_message(MSPCodes.MSP2_COMMON_SET_MOTOR_MIXER, buffer, false, nextFunction);
            } else {
                onCompleteCallback();
            }
        }
    };

    self.loadLogicConditions = function (callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "5.0.0")) {
            LOGIC_CONDITIONS.flush();
            let idx = 0;
            MSP.send_message(MSPCodes.MSP2_INAV_LOGIC_CONDITIONS_SINGLE, [idx], false, nextLogicCondition);

            function nextLogicCondition() {
                idx++;
                if (idx < LOGIC_CONDITIONS.getMaxLogicConditionCount() - 1) {
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

        if (LOGIC_CONDITIONS.getCount() == 0) {
            onCompleteCallback();
        } else {
            nextFunction();
        }

        function sendCondition() {

            let buffer = [];

            // send one at a time, with index, 14 bytes per one condition

            let condition = LOGIC_CONDITIONS.get()[conditionIndex];

            buffer.push(conditionIndex);
            buffer.push(condition.getEnabled());
            buffer.push(condition.getActivatorId());
            buffer.push(condition.getOperation());
            buffer.push(condition.getOperandAType());
            buffer.push(specificByte(condition.getOperandAValue(), 0));
            buffer.push(specificByte(condition.getOperandAValue(), 1));
            buffer.push(specificByte(condition.getOperandAValue(), 2));
            buffer.push(specificByte(condition.getOperandAValue(), 3));
            buffer.push(condition.getOperandBType());
            buffer.push(specificByte(condition.getOperandBValue(), 0));
            buffer.push(specificByte(condition.getOperandBValue(), 1));
            buffer.push(specificByte(condition.getOperandBValue(), 2));
            buffer.push(specificByte(condition.getOperandBValue(), 3));
            buffer.push(condition.getFlags());

            // prepare for next iteration
            conditionIndex++;
            if (conditionIndex == LOGIC_CONDITIONS.getCount()) { //This is the last rule. Not pretty, but we have to send all rules
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

        if (PROGRAMMING_PID.getCount() == 0) {
            onCompleteCallback();
        } else {
            nextFunction();
        }

        function sendPid() {

            let buffer = [];

            // send one at a time, with index, 20 bytes per one condition

            let pid = PROGRAMMING_PID.get()[pidIndex];

            buffer.push(pidIndex);
            buffer.push(pid.getEnabled());
            buffer.push(pid.getSetpointType());
            buffer.push(specificByte(pid.getSetpointValue(), 0));
            buffer.push(specificByte(pid.getSetpointValue(), 1));
            buffer.push(specificByte(pid.getSetpointValue(), 2));
            buffer.push(specificByte(pid.getSetpointValue(), 3));
            buffer.push(pid.getMeasurementType());
            buffer.push(specificByte(pid.getMeasurementValue(), 0));
            buffer.push(specificByte(pid.getMeasurementValue(), 1));
            buffer.push(specificByte(pid.getMeasurementValue(), 2));
            buffer.push(specificByte(pid.getMeasurementValue(), 3));
            buffer.push(specificByte(pid.getGainP(), 0));
            buffer.push(specificByte(pid.getGainP(), 1));
            buffer.push(specificByte(pid.getGainI(), 0));
            buffer.push(specificByte(pid.getGainI(), 1));
            buffer.push(specificByte(pid.getGainD(), 0));
            buffer.push(specificByte(pid.getGainD(), 1));
            buffer.push(specificByte(pid.getGainFF(), 0));
            buffer.push(specificByte(pid.getGainFF(), 1));

            // prepare for next iteration
            pidIndex++;
            if (pidIndex == PROGRAMMING_PID.getCount()) { //This is the last rule. Not pretty, but we have to send all rules
                nextFunction = onCompleteCallback;
            }
            MSP.send_message(MSPCodes.MSP2_INAV_SET_PROGRAMMING_PID, buffer, false, nextFunction);
        }
    };

    self.sendModeRanges = function (onCompleteCallback) {
        var nextFunction = send_next_mode_range;

        var modeRangeIndex = 0;

        if (MODE_RANGES.length == 0) {
            onCompleteCallback();
        } else {
            send_next_mode_range();
        }

        function send_next_mode_range() {

            var modeRange = MODE_RANGES[modeRangeIndex];

            var buffer = [];
            buffer.push(modeRangeIndex);
            buffer.push(modeRange.id);
            buffer.push(modeRange.auxChannelIndex);
            buffer.push((modeRange.range.start - 900) / 25);
            buffer.push((modeRange.range.end - 900) / 25);

            // prepare for next iteration
            modeRangeIndex++;
            if (modeRangeIndex == MODE_RANGES.length) {
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
        if (CONFIG.apiVersion && semver.gte(CONFIG.apiVersion, "2.0.0")) {
            buffer.push(lowByte(4096));
            buffer.push(highByte(4096));
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

    self.sendRxFailConfig = function (onCompleteCallback) {
        var nextFunction = send_next_rxfail_config;

        var rxFailIndex = 0;

        if (RXFAIL_CONFIG.length == 0) {
            onCompleteCallback();
        } else {
            send_next_rxfail_config();
        }

        function send_next_rxfail_config() {

            var rxFail = RXFAIL_CONFIG[rxFailIndex];

            var buffer = [];
            buffer.push(rxFailIndex);
            buffer.push(rxFail.mode);
            buffer.push(lowByte(rxFail.value));
            buffer.push(highByte(rxFail.value));

            // prepare for next iteration
            rxFailIndex++;
            if (rxFailIndex == RXFAIL_CONFIG.length) {
                nextFunction = onCompleteCallback;

            }
            MSP.send_message(MSPCodes.MSP_SET_RXFAIL_CONFIG, buffer, false, nextFunction);
        }
    };

    /**
     * @return {number}
     */
    self.SERIAL_PORT_FUNCTIONSToMask = function (functions) {
        var mask = 0;
        for (var index = 0; index < functions.length; index++) {
            var key = functions[index];
            var bitIndex = mspHelper.SERIAL_PORT_FUNCTIONS[key];
            if (bitIndex >= 0) {
                mask = bit_set(mask, bitIndex);
            }
        }
        return mask;
    };

    self.serialPortFunctionMaskToFunctions = function (functionMask) {
        var functions = [];

        var keys = Object.keys(mspHelper.SERIAL_PORT_FUNCTIONS);
        for (var index = 0; index < keys.length; index++) {
            var key = keys[index];
            var bit = mspHelper.SERIAL_PORT_FUNCTIONS[key];
            if (bit_check(functionMask, bit)) {
                functions.push(key);
            }
        }
        return functions;
    };

    self.sendServoMixRules = function (onCompleteCallback) {
        // TODO implement
        onCompleteCallback();
    };

    self.sendAdjustmentRanges = function (onCompleteCallback) {
        var nextFunction = send_next_adjustment_range;

        var adjustmentRangeIndex = 0;

        if (ADJUSTMENT_RANGES.length == 0) {
            onCompleteCallback();
        } else {
            send_next_adjustment_range();
        }


        function send_next_adjustment_range() {

            var adjustmentRange = ADJUSTMENT_RANGES[adjustmentRangeIndex];

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
            if (adjustmentRangeIndex == ADJUSTMENT_RANGES.length) {
                nextFunction = onCompleteCallback;

            }
            MSP.send_message(MSPCodes.MSP_SET_ADJUSTMENT_RANGE, buffer, false, nextFunction);
        }
    };

    self.sendLedStripColors = function (onCompleteCallback) {
        if (LED_COLORS.length == 0) {
            onCompleteCallback();
        } else {
            var buffer = [];

            for (var colorIndex = 0; colorIndex < LED_COLORS.length; colorIndex++) {
                var color = LED_COLORS[colorIndex];

                buffer.push(specificByte(color.h, 0));
                buffer.push(specificByte(color.h, 1));
                buffer.push(color.s);
                buffer.push(color.v);
            }
            MSP.send_message(MSPCodes.MSP_SET_LED_COLORS, buffer, false, onCompleteCallback);
        }
    };

    self.sendLedStripConfig = function (onCompleteCallback) {

        var nextFunction = send_next_led_strip_config;

        var ledIndex = 0;

        if (LED_STRIP.length == 0) {
            onCompleteCallback();
        } else {
            send_next_led_strip_config();
        }

        function send_next_led_strip_config() {

            var led = LED_STRIP[ledIndex];
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
                    mask |= bit_set(mask, bitIndex + 16);
                }

            }

            mask |= (led.color << 24);

            for (directionLetterIndex = 0; directionLetterIndex < led.directions.length; directionLetterIndex++) {

                bitIndex = MSP.ledDirectionLetters.indexOf(led.directions[directionLetterIndex]);
                if (bitIndex >= 0) {
                    if(bitIndex < 4) {
                        mask |= bit_set(mask, bitIndex + 28);
                    } else {
                        extra |= bit_set(extra, bitIndex - 4);
                    }
                }
            }

            extra |= (0 << 2); // parameters

            buffer.push(specificByte(mask, 0));
            buffer.push(specificByte(mask, 1));
            buffer.push(specificByte(mask, 2));
            buffer.push(specificByte(mask, 3));
            buffer.push(specificByte(extra, 0));

            // prepare for next iteration
            ledIndex++;
            if (ledIndex == LED_STRIP.length) {
                nextFunction = onCompleteCallback;
            }

            MSP.send_message(MSPCodes.MSP2_INAV_SET_LED_STRIP_CONFIG_EX, buffer, false, nextFunction);
        }
    };

    self.sendLedStripModeColors = function (onCompleteCallback) {

        var nextFunction = send_next_led_strip_mode_color;
        var index = 0;

        if (LED_MODE_COLORS.length == 0) {
            onCompleteCallback();
        } else {
            send_next_led_strip_mode_color();
        }

        function send_next_led_strip_mode_color() {
            var buffer = [];

            var mode_color = LED_MODE_COLORS[index];

            buffer.push(mode_color.mode);
            buffer.push(mode_color.direction);
            buffer.push(mode_color.color);

            // prepare for next iteration
            index++;
            if (index == LED_MODE_COLORS.length) {
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

    self.loadMisc = function (callback) {
        MSP.send_message(MSPCodes.MSP_MISC, false, false, callback);
    };

    self.loadMiscV2 = function (callback) {
        MSP.send_message(MSPCodes.MSPV2_INAV_MISC, false, false, callback);
    };

    self.loadOutputMapping = function (callback) {
        MSP.send_message(MSPCodes.MSPV2_INAV_OUTPUT_MAPPING, false, false, callback);
    };

    self.loadOutputMappingExt = function (callback) {
        MSP.send_message(MSPCodes.MSPV2_INAV_OUTPUT_MAPPING_EXT, false, false, callback);
    };

    self.loadTimerOutputModes = function(callback) {
        MSP.send_message(MSPCodes.MSP2_INAV_TIMER_OUTPUT_MODE, false, false, callback);
    }

    self.sendTimerOutputModes = function(onCompleteCallback) {
        var nextFunction = send_next_output_mode;
        var idIndex = 0;

        var overrideIds = OUTPUT_MAPPING.getUsedTimerIds();

        if (overrideIds.length == 0) {
            onCompleteCallback();
        } else {
            send_next_output_mode();
        }

        function send_next_output_mode() {

            var timerId = overrideIds[idIndex];

            var outputMode = OUTPUT_MAPPING.getTimerOverride(timerId);

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

    self.loadArmingConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_ARMING_CONFIG, false, false, callback);
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

    self.loadAnalog = function (callback) {
        MSP.send_message(MSPCodes.MSP_ANALOG, false, false, callback);
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

    self.saveMisc = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_MISC, mspHelper.crunch(MSPCodes.MSP_SET_MISC), false, callback);
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

    self.saveArmingConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_ARMING_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_ARMING_CONFIG), false, callback);
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

    self.loadPositionEstimationConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_POSITION_ESTIMATION_CONFIG, false, false, callback);
    };

    self.savePositionEstimationConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_POSITION_ESTIMATION_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_POSITION_ESTIMATION_CONFIG), false, callback);
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
        MISSION_PLANNER.reinit();
        let waypointId = 0;
        let startTime = new Date().getTime();
        MSP.send_message(MSPCodes.MSP_WP_GETINFO, false, false, loadWaypoint);

        function loadWaypoint() {
            waypointId++;
            if (waypointId < MISSION_PLANNER.getCountBusyPoints()) {
                MSP.send_message(MSPCodes.MSP_WP, [waypointId], false, loadWaypoint);
            } else {
                GUI.log(chrome.i18n.getMessage('ReceiveTime') + (new Date().getTime() - startTime) + 'ms');
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
            if (waypointId < MISSION_PLANNER.get().length) {
                MSP.send_message(MSPCodes.MSP_SET_WP, MISSION_PLANNER.extractBuffer(waypointId), false, sendWaypoint);
            }
            else {
                MSP.send_message(MSPCodes.MSP_SET_WP, MISSION_PLANNER.extractBuffer(waypointId), false, endMission);
            }
        };

        function endMission() {
            GUI.log(chrome.i18n.getMessage('SendTime') + (new Date().getTime() - startTime) + 'ms');
            MSP.send_message(MSPCodes.MSP_WP_GETINFO, false, false, callback);
        }
    };

    self.loadSafehomes = function (callback) {
        SAFEHOMES.flush();
        let safehomeId = 0;
        MSP.send_message(MSPCodes.MSP2_INAV_SAFEHOME, [safehomeId], false, nextSafehome);

        function nextSafehome() {
            safehomeId++;
            if (safehomeId < SAFEHOMES.getMaxSafehomeCount() - 1) {
                MSP.send_message(MSPCodes.MSP2_INAV_SAFEHOME, [safehomeId], false, nextSafehome);
            }
            else {
                MSP.send_message(MSPCodes.MSP2_INAV_SAFEHOME, [safehomeId], false, callback);
            }
        };
    };

    self.saveSafehomes = function (callback) {
        let safehomeId = 0;
        MSP.send_message(MSPCodes.MSP2_INAV_SET_SAFEHOME, SAFEHOMES.extractBuffer(safehomeId), false, nextSendSafehome);

        function nextSendSafehome() {
            safehomeId++;
            if (safehomeId < SAFEHOMES.getMaxSafehomeCount() - 1) {
                MSP.send_message(MSPCodes.MSP2_INAV_SET_SAFEHOME, SAFEHOMES.extractBuffer(safehomeId), false, nextSendSafehome);
            }
            else {
                MSP.send_message(MSPCodes.MSP2_INAV_SET_SAFEHOME, SAFEHOMES.extractBuffer(safehomeId), false, callback);
            }
        };
    };

    self._getSetting = function (name) {
        if (SETTINGS[name]) {
            return Promise.resolve(SETTINGS[name]);
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
            SETTINGS[name] = setting;
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
                console.log("Setting invalid: " + name);
                return null;
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
            if (data) {
                return MSP.promise(MSPCodes.MSPV2_SET_SETTING, data).then(callback);
            } else {
                return Promise.resolve().then(callback);
            }
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
        MSP.send_message(MSPCodes.MSP_SERVO_CONFIGURATIONS, false, false, callback);
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


    return self;
})(GUI);
