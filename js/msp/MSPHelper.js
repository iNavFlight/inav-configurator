/*global $, SERVO_DATA, PID_names, ADJUSTMENT_RANGES, RXFAIL_CONFIG, SERVO_CONFIG*/
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

    self.BAUD_RATES_pre1_6_3 = [
        'AUTO',
        '9600',
        '19200',
        '38400',
        '57600',
        '115200',
        '230400',
        '250000'
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
        'RUNCAM_DEVICE_CONTROL' : 10,
        'TBS_SMARTAUDIO': 11,
        'IRC_TRAMP': 12
    };

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

        if (!dataHandler.unsupported) switch (dataHandler.code) {
            case MSPCodes.MSP_IDENT:
                //FIXME remove this frame when proven not needed
                console.log('Using deprecated msp command: MSP_IDENT');
                // Deprecated
                CONFIG.version = parseFloat((data.getUint8(0) / 100).toFixed(2));
                CONFIG.multiType = data.getUint8(1);
                CONFIG.msp_version = data.getUint8(2);
                CONFIG.capability = data.getUint32(3, true);
                break;
            case MSPCodes.MSP_STATUS:
                console.log('Using deprecated msp command: MSP_STATUS');
                CONFIG.cycleTime = data.getUint16(0, true);
                CONFIG.i2cError = data.getUint16(2, true);
                CONFIG.activeSensors = data.getUint16(4, true);
                CONFIG.mode = data.getUint32(6, true);
                CONFIG.profile = data.getUint8(10);
                gui.updateProfileChange();
                gui.updateStatusBar();

                /*
                 * Update sensor status only for older firmwares
                 * Newer firmwares use MSP_SENSOR_STATUS instead
                 */
                if (semver.lt(CONFIG.flightControllerVersion, "1.5.0")) {
                    sensor_status(CONFIG.activeSensors);
                }

                break;
            case MSPCodes.MSP_STATUS_EX:
                CONFIG.cycleTime = data.getUint16(0, true);
                CONFIG.i2cError = data.getUint16(2, true);
                CONFIG.activeSensors = data.getUint16(4, true);

                /* For 1.7.4+ MSP_ACTIVEBOXES should be used to determine active modes */
                if (semver.lt(CONFIG.flightControllerVersion, "1.7.4")) {
                    CONFIG.mode = data.getUint32(6, true);
                }

                CONFIG.profile = data.getUint8(10);
                CONFIG.cpuload = data.getUint16(11, true);

                if (semver.gte(CONFIG.flightControllerVersion, "1.5.0")) {
                    CONFIG.armingFlags = data.getUint16(13, true);
                }

                if (semver.lt(CONFIG.flightControllerVersion, "1.5.0")) {
                    sensor_status(CONFIG.activeSensors);
                }
                gui.updateStatusBar();
                gui.updateProfileChange();
                break;

            case MSPCodes.MSP_ACTIVEBOXES:
                var words = dataHandler.message_length_expected / 4;

                CONFIG.mode = 0;
                if (words == 1) {
                    CONFIG.mode = data.getUint32(0, true);
                }
                else if (words == 2) {
                    CONFIG.mode = data.getUint32(0, true) | (data.getUint32(4, true) << 32);
                }
                else {
                    console.log('MSP_ACTIVEBOXES doesn\'t support more than 53 bits at the moment');
                }
                break;

            case MSPCodes.MSP_SENSOR_STATUS:
                SENSOR_STATUS.isHardwareHealthy = data.getUint8(0);
                SENSOR_STATUS.gyroHwStatus      = data.getUint8(1);
                SENSOR_STATUS.accHwStatus       = data.getUint8(2);
                SENSOR_STATUS.magHwStatus       = data.getUint8(3);
                SENSOR_STATUS.baroHwStatus      = data.getUint8(4);
                SENSOR_STATUS.gpsHwStatus       = data.getUint8(5);
                SENSOR_STATUS.rangeHwStatus     = data.getUint8(6);
                SENSOR_STATUS.speedHwStatus     = data.getUint8(7);
                SENSOR_STATUS.flowHwStatus      = data.getUint8(8);
                if (semver.gte(CONFIG.flightControllerVersion, "1.5.0")) {
                    sensor_status_ex(SENSOR_STATUS);
                }
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
                // On 1.6 and above this provides also baro raw altitude
                if (semver.gte(CONFIG.flightControllerVersion, "1.6.0")) {
                    SENSOR_DATA.barometer = parseFloat((data.getInt32(6, true) / 100.0).toFixed(2)); // correct scale factor
                }
                break;
            case MSPCodes.MSP_SONAR:
                SENSOR_DATA.sonar = data.getInt32(0, true);
                break;
            case MSPCodes.MSP_ANALOG:
                ANALOG.voltage = data.getUint8(0) / 10.0;
                ANALOG.mAhdrawn = data.getUint16(1, true);
                ANALOG.rssi = data.getUint16(3, true); // 0-1023
                ANALOG.amperage = data.getInt16(5, true) / 100; // A
                //noinspection JSValidateTypes
                dataHandler.analog_last_received_timestamp = Date.now();
                break;
            case MSPCodes.MSP_RC_TUNING:
                RC_tuning.RC_RATE = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                RC_tuning.RC_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                if (FC.isRatesInDps()) {
                    RC_tuning.roll_pitch_rate = 0;
                    RC_tuning.roll_rate = parseFloat((data.getUint8(offset++) * 10));
                    RC_tuning.pitch_rate = parseFloat((data.getUint8(offset++) * 10));
                    RC_tuning.yaw_rate = parseFloat((data.getUint8(offset++) * 10));
                } else {
                    RC_tuning.roll_pitch_rate = 0;
                    RC_tuning.roll_rate = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                    RC_tuning.pitch_rate = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                    RC_tuning.yaw_rate = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                }

                RC_tuning.dynamic_THR_PID = parseInt(data.getUint8(offset++));
                RC_tuning.throttle_MID = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                RC_tuning.throttle_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                RC_tuning.dynamic_THR_breakpoint = data.getUint16(offset, true);
                offset += 2;
                RC_tuning.RC_YAW_EXPO = parseFloat((data.getUint8(offset++) / 100).toFixed(2));
                break;
            case MSPCodes.MSP_PID:
                // PID data arrived, we need to scale it and save to appropriate bank / array
                for (i = 0, needle = 0; i < (dataHandler.message_length_expected / 3); i++, needle += 3) {
                    PIDs[i][0] = data.getUint8(needle);
                    PIDs[i][1] = data.getUint8(needle + 1);
                    PIDs[i][2] = data.getUint8(needle + 2);
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
            case MSPCodes.MSP_3D:
                _3D.deadband3d_low = data.getUint16(offset, true);
                offset += 2;
                _3D.deadband3d_high = data.getUint16(offset, true);
                offset += 2;
                _3D.neutral3d = data.getUint16(offset, true);
                if (semver.lt(CONFIG.apiVersion, "1.17.0")) {
                    offset += 2;
                    _3D.deadband3d_throttle = data.getUint16(offset, true);
                }
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
                console.log(data);
                break;
            case MSPCodes.MSP_BOXIDS:
                //noinspection JSUndeclaredVariable
                AUX_CONFIG_IDS = []; // empty the array as new data is coming in

                for (i = 0; i < data.byteLength; i++) {
                    AUX_CONFIG_IDS.push(data.getUint8(i));
                }
                break;
            case MSPCodes.MSP_SERVO_MIX_RULES:
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
                            'indexOfChannelToForward': data.getInt8(i + 9),
                            'reversedInputSources': data.getUint32(i + 10)
                        };

                        SERVO_CONFIG.push(arr);
                    }
                }
                break;
            case MSPCodes.MSP_RC_DEADBAND:
                RC_deadband.deadband = data.getUint8(offset++);
                RC_deadband.yaw_deadband = data.getUint8(offset++);
                RC_deadband.alt_hold_deadband = data.getUint8(offset++);
                if (semver.gte(CONFIG.apiVersion, "1.24.0")) {
                    _3D.deadband3d_throttle = data.getUint16(offset, true);
                }
                break;
            case MSPCodes.MSP_SENSOR_ALIGNMENT:
                SENSOR_ALIGNMENT.align_gyro = data.getUint8(offset++);
                SENSOR_ALIGNMENT.align_acc = data.getUint8(offset++);
                SENSOR_ALIGNMENT.align_mag = data.getUint8(offset++);
                break;
            case MSPCodes.MSP_SET_RAW_RC:
                break;
            case MSPCodes.MSP_SET_RAW_GPS:
                break;
            case MSPCodes.MSP_SET_PID:
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
                break;
            case MSPCodes.MSP_DEBUG:
                for (i = 0; i < 4; i++)
                    SENSOR_DATA.debug[i] = data.getInt16((2 * i), 1);
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
            case MSPCodes.MSP_BF_CONFIG:
                BF_CONFIG.mixerConfiguration = data.getUint8(0);
                BF_CONFIG.features = data.getUint32(1, true);
                BF_CONFIG.serialrx_type = data.getUint8(5);
                BF_CONFIG.board_align_roll = data.getInt16(6, true); // -180 - 360
                BF_CONFIG.board_align_pitch = data.getInt16(8, true); // -180 - 360
                BF_CONFIG.board_align_yaw = data.getInt16(10, true); // -180 - 360
                BF_CONFIG.currentscale = data.getInt16(12, true);
                BF_CONFIG.currentoffset = data.getUint16(14, true);
                break;
            case MSPCodes.MSP_SET_BF_CONFIG:
                console.log('BF_CONFIG saved');
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
                break;

            case MSPCodes.MSP_SET_CHANNEL_FORWARDING:
                console.log('Channel forwarding saved');
                break;

            case MSPCodes.MSP_CF_SERIAL_CONFIG:
                SERIAL_CONFIG.ports = [];
                var bytesPerPort = 1 + 2 + 4;
                var serialPortCount = data.byteLength / bytesPerPort;

                for (i = 0; i < serialPortCount; i++) {
                    var BAUD_RATES = (semver.gte(CONFIG.flightControllerVersion, "1.6.3")) ? mspHelper.BAUD_RATES_post1_6_3 : mspHelper.BAUD_RATES_pre1_6_3;

                    var serialPort = {
                        identifier: data.getUint8(offset),
                        functions: mspHelper.serialPortFunctionMaskToFunctions(data.getUint16(offset + 1, true)),
                        msp_baudrate: BAUD_RATES[data.getUint8(offset + 3)],
                        sensors_baudrate: BAUD_RATES[data.getUint8(offset + 4)],
                        telemetry_baudrate: BAUD_RATES[data.getUint8(offset + 5)],
                        blackbox_baudrate: BAUD_RATES[data.getUint8(offset + 6)]
                    };

                    offset += bytesPerPort;
                    SERIAL_CONFIG.ports.push(serialPort);
                }
                break;

            case MSPCodes.MSP_SET_CF_SERIAL_CONFIG:
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
                if (semver.gte(CONFIG.apiVersion, "1.21.0")) {
                    offset += 4; // 4 null bytes for betaflight compatibility
                    RX_CONFIG.spirx_protocol = data.getUint8(offset);
                    offset++;
                    RX_CONFIG.spirx_id = data.getUint32(offset, true);
                    offset += 4;
                    RX_CONFIG.spirx_channel_count = data.getUint8(offset);
                    offset += 1;
                }
                if (semver.gt(CONFIG.flightControllerVersion, "1.7.3")) {
                    // unused byte for fpvCamAngleDegrees, for compatiblity with betaflight
                    offset += 1;
                    RX_CONFIG.receiver_type = data.getUint8(offset);
                    offset += 1;
                }
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
                if (semver.gte(CONFIG.flightControllerVersion, "1.7.3")) {
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
                }
                if (semver.gte(CONFIG.flightControllerVersion, "1.7.4")) {
                    FAILSAFE_CONFIG.failsafe_min_distance = data.getUint16(offset, true);
                    offset += 2;
                    FAILSAFE_CONFIG.failsafe_min_distance_procedure = data.getUint8(offset);
                    offset++;
                }
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

                var ledCount = data.byteLength / 7; // v1.4.0 and below incorrectly reported 4 bytes per led.

                if (semver.gte(CONFIG.apiVersion, "1.20.0"))
                    ledCount = data.byteLength / 4;

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
            case MSPCodes.MSP_SET_LED_STRIP_CONFIG:
                console.log('Led strip config saved');
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
                if (semver.gte(CONFIG.apiVersion, "1.19.0")) {

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
            case MSPCodes.MSP_TRANSPONDER_CONFIG:
                TRANSPONDER.supported = (data.getUint8(offset++) & 1) != 0;
                TRANSPONDER.data = [];
                var bytesRemaining = data.byteLength - offset;
                for (i = 0; i < bytesRemaining; i++) {
                    TRANSPONDER.data.push(data.getUint8(offset++));
                }
                break;
            case MSPCodes.MSP_SET_TRANSPONDER_CONFIG:
                console.log("Transponder config saved");
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

                break;

            case MSPCodes.MSP_SET_FILTER_CONFIG:
                console.log("Filter config saved");
                break;

            case MSPCodes.MSP_PID_ADVANCED:
                PID_ADVANCED.rollPitchItermIgnoreRate = data.getUint16(0, true);
                PID_ADVANCED.yawItermIgnoreRate = data.getUint16(2, true);
                PID_ADVANCED.yawPLimit = data.getUint16(4, true);

                if (semver.gte(CONFIG.flightControllerVersion, "1.6.0")) {
                    PID_ADVANCED.dtermSetpointWeight = data.getUint8(9);
                    PID_ADVANCED.pidSumLimit = data.getUint16(10, true);
                }

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
                if (semver.lte(CONFIG.flightControllerVersion, "1.8.0")) {
                    break;
                }

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
                RTH_AND_LAND_CONFIG.landDescentRate = data.getUint16(11, true);
                RTH_AND_LAND_CONFIG.landSlowdownMinAlt = data.getUint16(13, true);
                RTH_AND_LAND_CONFIG.landSlowdownMaxAlt = data.getUint16(15, true);
                RTH_AND_LAND_CONFIG.emergencyDescentRate = data.getUint16(17, true);
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
            case MSPCodes.MSPV2_SETTING:
                break;
            case MSPCodes.MSPV2_SET_SETTING:
                console.log("Setting set");
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
                    if (callback) callback({'command': dataHandler.code, 'data': data, 'length': dataHandler.message_length_expected});
                }
            }
        }
    };

    self.crunch = function (code) {
        var buffer = [],
            i;

        switch (code) {
            case MSPCodes.MSP_SET_BF_CONFIG:
                buffer.push(BF_CONFIG.mixerConfiguration);
                buffer.push(specificByte(BF_CONFIG.features, 0));
                buffer.push(specificByte(BF_CONFIG.features, 1));
                buffer.push(specificByte(BF_CONFIG.features, 2));
                buffer.push(specificByte(BF_CONFIG.features, 3));
                buffer.push(BF_CONFIG.serialrx_type);
                buffer.push(specificByte(BF_CONFIG.board_align_roll, 0));
                buffer.push(specificByte(BF_CONFIG.board_align_roll, 1));
                buffer.push(specificByte(BF_CONFIG.board_align_pitch, 0));
                buffer.push(specificByte(BF_CONFIG.board_align_pitch, 1));
                buffer.push(specificByte(BF_CONFIG.board_align_yaw, 0));
                buffer.push(specificByte(BF_CONFIG.board_align_yaw, 1));
                buffer.push(lowByte(BF_CONFIG.currentscale));
                buffer.push(highByte(BF_CONFIG.currentscale));
                buffer.push(lowByte(BF_CONFIG.currentoffset));
                buffer.push(highByte(BF_CONFIG.currentoffset));
                break;
            case MSPCodes.MSP_SET_PID:
                for (i = 0; i < PIDs.length; i++) {
                    buffer.push(parseInt(PIDs[i][0]));
                    buffer.push(parseInt(PIDs[i][1]));
                    buffer.push(parseInt(PIDs[i][2]));
                }
                break;
            case MSPCodes.MSP_SET_RC_TUNING:
                buffer.push(Math.round(RC_tuning.RC_RATE * 100));
                buffer.push(Math.round(RC_tuning.RC_EXPO * 100));
                if (FC.isRatesInDps()) {
                    buffer.push(Math.round(RC_tuning.roll_rate / 10));
                    buffer.push(Math.round(RC_tuning.pitch_rate / 10));
                    buffer.push(Math.round(RC_tuning.yaw_rate / 10));
                } else {
                    buffer.push(Math.round(RC_tuning.roll_rate * 100));
                    buffer.push(Math.round(RC_tuning.pitch_rate * 100));
                    buffer.push(Math.round(RC_tuning.yaw_rate * 100));
                }

                buffer.push(RC_tuning.dynamic_THR_PID);
                buffer.push(Math.round(RC_tuning.throttle_MID * 100));
                buffer.push(Math.round(RC_tuning.throttle_EXPO * 100));
                buffer.push(lowByte(RC_tuning.dynamic_THR_breakpoint));
                buffer.push(highByte(RC_tuning.dynamic_THR_breakpoint));
                buffer.push(Math.round(RC_tuning.RC_YAW_EXPO * 100));
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
                if (semver.gte(CONFIG.apiVersion, "1.21.0")) {
                    buffer.push(0); // 4 null bytes for betaflight compatibility
                    buffer.push(0);
                    buffer.push(0);
                    buffer.push(0);
                    buffer.push(RX_CONFIG.spirx_protocol);
                    // spirx_id - 4 bytes
                    buffer.push32(RX_CONFIG.spirx_id);
                    buffer.push(RX_CONFIG.spirx_channel_count);
                }
                if (semver.gt(CONFIG.flightControllerVersion, "1.7.3")) {
                    // unused byte for fpvCamAngleDegrees, for compatiblity with betaflight
                    buffer.push(0);
                    // receiver type in RX_CONFIG rather than in BF_CONFIG.features
                    buffer.push(RX_CONFIG.receiver_type);
                }
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
                if (semver.gte(CONFIG.flightControllerVersion, "1.7.3")) {
                    buffer.push(FAILSAFE_CONFIG.failsafe_recovery_delay);
                    buffer.push(lowByte(FAILSAFE_CONFIG.failsafe_fw_roll_angle));
                    buffer.push(highByte(FAILSAFE_CONFIG.failsafe_fw_roll_angle));
                    buffer.push(lowByte(FAILSAFE_CONFIG.failsafe_fw_pitch_angle));
                    buffer.push(highByte(FAILSAFE_CONFIG.failsafe_fw_pitch_angle));
                    buffer.push(lowByte(FAILSAFE_CONFIG.failsafe_fw_yaw_rate));
                    buffer.push(highByte(FAILSAFE_CONFIG.failsafe_fw_yaw_rate));
                    buffer.push(lowByte(FAILSAFE_CONFIG.failsafe_stick_motion_threshold));
                    buffer.push(highByte(FAILSAFE_CONFIG.failsafe_stick_motion_threshold));
                }   
                if (semver.gte(CONFIG.flightControllerVersion, "1.7.4")) {
                    buffer.push(lowByte(FAILSAFE_CONFIG.failsafe_min_distance));
                    buffer.push(highByte(FAILSAFE_CONFIG.failsafe_min_distance));
                    buffer.push(FAILSAFE_CONFIG.failsafe_min_distance_procedure);
                }
                break;

            case MSPCodes.MSP_SET_TRANSPONDER_CONFIG:
                for (i = 0; i < TRANSPONDER.data.length; i++) {
                    buffer.push(TRANSPONDER.data[i]);
                }
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
            case MSPCodes.MSP_SET_CF_SERIAL_CONFIG:
                for (i = 0; i < SERIAL_CONFIG.ports.length; i++) {
                    var serialPort = SERIAL_CONFIG.ports[i];

                    buffer.push(serialPort.identifier);

                    var functionMask = mspHelper.SERIAL_PORT_FUNCTIONSToMask(serialPort.functions);
                    buffer.push(specificByte(functionMask, 0));
                    buffer.push(specificByte(functionMask, 1));

                    var BAUD_RATES = (semver.gte(CONFIG.flightControllerVersion, "1.6.3")) ? mspHelper.BAUD_RATES_post1_6_3 : mspHelper.BAUD_RATES_pre1_6_3;
                    buffer.push(BAUD_RATES.indexOf(serialPort.msp_baudrate));
                    buffer.push(BAUD_RATES.indexOf(serialPort.sensors_baudrate));
                    buffer.push(BAUD_RATES.indexOf(serialPort.telemetry_baudrate));
                    buffer.push(BAUD_RATES.indexOf(serialPort.blackbox_baudrate));
                }
                break;

            case MSPCodes.MSP_SET_3D:
                buffer.push(lowByte(_3D.deadband3d_low));
                buffer.push(highByte(_3D.deadband3d_low));
                buffer.push(lowByte(_3D.deadband3d_high));
                buffer.push(highByte(_3D.deadband3d_high));
                buffer.push(lowByte(_3D.neutral3d));
                buffer.push(highByte(_3D.neutral3d));
                if (semver.lt(CONFIG.apiVersion, "1.17.0")) {
                    buffer.push(lowByte(_3D.deadband3d_throttle));
                    buffer.push(highByte(_3D.deadband3d_throttle));
                }
                break;

            case MSPCodes.MSP_SET_RC_DEADBAND:
                buffer.push(RC_deadband.deadband);
                buffer.push(RC_deadband.yaw_deadband);
                buffer.push(RC_deadband.alt_hold_deadband);
                if (semver.gte(CONFIG.apiVersion, "1.24.0")) {
                    buffer.push(lowByte(_3D.deadband3d_throttle));
                    buffer.push(highByte(_3D.deadband3d_throttle));
                }
                break;

            case MSPCodes.MSP_SET_SENSOR_ALIGNMENT:
                buffer.push(SENSOR_ALIGNMENT.align_gyro);
                buffer.push(SENSOR_ALIGNMENT.align_acc);
                buffer.push(SENSOR_ALIGNMENT.align_mag);
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

                buffer.push(lowByte(RTH_AND_LAND_CONFIG.landDescentRate));
                buffer.push(highByte(RTH_AND_LAND_CONFIG.landDescentRate));

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

                if (semver.gte(CONFIG.flightControllerVersion, "1.6.0")) {
                    buffer.push(PID_ADVANCED.dtermSetpointWeight);
                    buffer.push(lowByte(PID_ADVANCED.pidSumLimit));
                    buffer.push(highByte(PID_ADVANCED.pidSumLimit));
                } else {
                    buffer.push(0);
                    buffer.push(0); // reserved
                    buffer.push(0); // reserved
                }

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
        var message = [
                BLACKBOX.blackboxDevice & 0xFF,
                BLACKBOX.blackboxRateNum & 0xFF,
                BLACKBOX.blackboxRateDenom & 0xFF
        ];

        //noinspection JSUnusedLocalSymbols
        MSP.send_message(MSPCodes.MSP_SET_BLACKBOX_CONFIG, message, false, function (response) {
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

            buffer.push(specificByte(servoConfiguration.reversedInputSources, 0));
            buffer.push(specificByte(servoConfiguration.reversedInputSources, 1));
            buffer.push(specificByte(servoConfiguration.reversedInputSources, 2));
            buffer.push(specificByte(servoConfiguration.reversedInputSources, 3));

            // prepare for next iteration
            servoIndex++;
            if (servoIndex == SERVO_CONFIG.length) {
                nextFunction = onCompleteCallback;
            }
            MSP.send_message(MSPCodes.MSP_SET_SERVO_CONFIGURATION, buffer, false, nextFunction);
        }

        //FIXME looks like this is not used and not ever implemented
        //noinspection JSUnusedLocalSymbols
        function send_channel_forwarding() {

            var buffer = [];

            for (var i = 0; i < SERVO_CONFIG.length; i++) {
                var out = SERVO_CONFIG[i].indexOfChannelToForward;
                if (out == undefined) {
                    out = 255; // Cleanflight defines "CHANNEL_FORWARDING_DISABLED" as "(uint8_t)0xFF"
                }
                buffer.push(out);
            }

            nextFunction = onCompleteCallback;

            MSP.send_message(MSPCodes.MSP_SET_CHANNEL_FORWARDING, buffer, false, nextFunction);
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
     * Send a request to read a block of data from the dataflash at the given address and pass that address and a dataview
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
                onDataCallback(address, new DataView(response.data.buffer, response.data.byteOffset + 4, response.data.buffer.byteLength - 4));
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

            if (semver.lt(CONFIG.apiVersion, "1.20.0")) {
                var directionMask = 0;
                for (directionLetterIndex = 0; directionLetterIndex < led.directions.length; directionLetterIndex++) {

                    bitIndex = MSP.ledDirectionLetters.indexOf(led.directions[directionLetterIndex]);
                    if (bitIndex >= 0) {
                        directionMask = bit_set(directionMask, bitIndex);
                    }

                }
                buffer.push(specificByte(directionMask, 0));
                buffer.push(specificByte(directionMask, 1));

                var functionMask = 0;
                for (functionLetterIndex = 0; functionLetterIndex < led.functions.length; functionLetterIndex++) {

                    bitIndex = MSP.ledFunctionLetters.indexOf(led.functions[functionLetterIndex]);
                    if (bitIndex >= 0) {
                        functionMask = bit_set(functionMask, bitIndex);
                    }

                }
                buffer.push(specificByte(functionMask, 0));
                buffer.push(specificByte(functionMask, 1));

                buffer.push(led.x);
                buffer.push(led.y);

                buffer.push(led.color);
            } else {
                var mask = 0;
                /*
                 ledDirectionLetters:        ['n', 'e', 's', 'w', 'u', 'd'],      // in LSB bit order
                 ledFunctionLetters:         ['i', 'w', 'f', 'a', 't', 'r', 'c', 'g', 's', 'b', 'l'], // in LSB bit order
                 ledBaseFunctionLetters:     ['c', 'f', 'a', 'l', 's', 'g', 'r'], // in LSB bit
                 ledOverlayLetters:          ['t', 'o', 'b', 'n', 'i', 'w'], // in LSB bit

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
                        mask |= bit_set(mask, bitIndex + 12);
                    }

                }

                mask |= (led.color << 18);

                for (directionLetterIndex = 0; directionLetterIndex < led.directions.length; directionLetterIndex++) {

                    bitIndex = MSP.ledDirectionLetters.indexOf(led.directions[directionLetterIndex]);
                    if (bitIndex >= 0) {
                        mask |= bit_set(mask, bitIndex + 22);
                    }

                }

                mask |= (0 << 28); // parameters


                buffer.push(specificByte(mask, 0));
                buffer.push(specificByte(mask, 1));
                buffer.push(specificByte(mask, 2));
                buffer.push(specificByte(mask, 3));
            }

            // prepare for next iteration
            ledIndex++;
            if (ledIndex == LED_STRIP.length) {
                nextFunction = onCompleteCallback;
            }

            MSP.send_message(MSPCodes.MSP_SET_LED_STRIP_CONFIG, buffer, false, nextFunction);
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

    /**
     * @deprecated
     * @param callback
     */
    self.loadMspIdent = function (callback) {
        MSP.send_message(MSPCodes.MSP_IDENT, false, false, callback);
    };

    self.loadINAVPidConfig = function(callback) {
        if (semver.gt(CONFIG.flightControllerVersion, "1.3.0")) {
            MSP.send_message(MSPCodes.MSP_INAV_PID, false, false, callback);
        } else {
            callback();
        }
    };

    self.loadLoopTime = function (callback) {
        MSP.send_message(MSPCodes.MSP_LOOP_TIME, false, false, callback);
    };

    self.loadAdvancedConfig = function(callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "1.3.0")) {
            MSP.send_message(MSPCodes.MSP_ADVANCED_CONFIG, false, false, callback);
        } else {
            callback();
        }
    };

    self.loadFilterConfig = function (callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "1.4.0")) {
            MSP.send_message(MSPCodes.MSP_FILTER_CONFIG, false, false, callback);
        } else {
            callback();
        }
    };

    self.loadPidAdvanced = function (callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "1.4.0")) {
            MSP.send_message(MSPCodes.MSP_PID_ADVANCED, false, false, callback);
        } else {
            callback();
        }
    };

    self.loadRcTuningData = function (callback) {
        MSP.send_message(MSPCodes.MSP_RC_TUNING, false, false, callback);
    };

    self.loadPidData = function (callback) {
        MSP.send_message(MSPCodes.MSP_PID, false, false, callback);
    };

    self.loadPidNames = function (callback) {
        MSP.send_message(MSPCodes.MSP_PIDNAMES, false, false, callback);
    };

    self.loadStatus = function (callback) {
        MSP.send_message(MSPCodes.MSP_STATUS, false, false, callback);
    };

    self.loadBfConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_BF_CONFIG, false, false, callback);
    };

    self.queryFcStatus = function (callback) {
        MSP.send_message(MSPCodes.MSP_STATUS_EX, false, false, callback);
    };

    self.loadMisc = function (callback) {
        MSP.send_message(MSPCodes.MSP_MISC, false, false, callback);
    };

    self.loadArmingConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_ARMING_CONFIG, false, false, callback);
    };

    self.loadRxConfig = function (callback) {
        if (semver.gte(CONFIG.apiVersion, "1.21.0")) {
            MSP.send_message(MSPCodes.MSP_RX_CONFIG, false, false, callback);
        } else {
            callback();
        }
    };

    self.load3dConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_3D, false, false, callback);
    };

    self.loadSensorAlignment = function (callback) {
        MSP.send_message(MSPCodes.MSP_SENSOR_ALIGNMENT, false, false, callback);
    };

    self.loadSensorConfig = function (callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "1.5.0")) {
            MSP.send_message(MSPCodes.MSP_SENSOR_CONFIG, false, false, callback);
        } else {
            callback();
        }
    };

    self.loadSensorStatus = function (callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "1.5.0")) {
            MSP.send_message(MSPCodes.MSP_SENSOR_STATUS, false, false, callback);
        } else {
            callback();
        }
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
        if (semver.gt(CONFIG.flightControllerVersion, "1.3.0")) {
            MSP.send_message(MSPCodes.MSP_SET_INAV_PID, mspHelper.crunch(MSPCodes.MSP_SET_INAV_PID), false, callback);
        } else {
            callback();
        }
    };

    self.saveLooptimeConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_LOOP_TIME, mspHelper.crunch(MSPCodes.MSP_SET_LOOP_TIME), false, callback);
    };

    self.saveAdvancedConfig = function (callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "1.3.0")) {
            MSP.send_message(MSPCodes.MSP_SET_ADVANCED_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_ADVANCED_CONFIG), false, callback);
        } else {
            callback();
        }
    };

    self.saveFilterConfig = function (callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "1.4.0")) {
            MSP.send_message(MSPCodes.MSP_SET_FILTER_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_FILTER_CONFIG), false, callback);
        } else {
            callback();
        }
    };

    self.savePidData = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_PID, mspHelper.crunch(MSPCodes.MSP_SET_PID), false, callback);
    };

    self.saveRcTuningData = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_RC_TUNING, mspHelper.crunch(MSPCodes.MSP_SET_RC_TUNING), false, callback);
    };

    self.savePidAdvanced = function (callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "1.4.0")) {
            MSP.send_message(MSPCodes.MSP_SET_PID_ADVANCED, mspHelper.crunch(MSPCodes.MSP_SET_PID_ADVANCED), false, callback);
        } else {
            callback();
        }
    };

    self.saveBfConfig = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_BF_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_BF_CONFIG), false, callback);
    };

    self.saveMisc = function (callback) {
        MSP.send_message(MSPCodes.MSP_SET_MISC, mspHelper.crunch(MSPCodes.MSP_SET_MISC), false, callback);
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
        if(semver.gte(CONFIG.apiVersion, "1.21.0")) {
            MSP.send_message(MSPCodes.MSP_SET_RX_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_RX_CONFIG), false, callback);
        } else {
            callback();
        }
    };

    self.saveSensorConfig = function (callback) {
        if(semver.gte(CONFIG.flightControllerVersion, "1.5.0")) {
            MSP.send_message(MSPCodes.MSP_SET_SENSOR_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_SENSOR_CONFIG), false, callback);
        } else {
            callback();
        }
    };

    self.loadNavPosholdConfig = function (callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "1.6.0")) {
            MSP.send_message(MSPCodes.MSP_NAV_POSHOLD, false, false, callback);
        } else {
            callback();
        }
    };

    self.saveNavPosholdConfig = function (callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "1.6.0")) {
            MSP.send_message(MSPCodes.MSP_SET_NAV_POSHOLD, mspHelper.crunch(MSPCodes.MSP_SET_NAV_POSHOLD), false, callback);
        } else {
            callback();
        }
    };

    self.loadPositionEstimationConfig = function (callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "1.6.0")) {
            MSP.send_message(MSPCodes.MSP_POSITION_ESTIMATION_CONFIG, false, false, callback);
        } else {
            callback();
        }
    };

    self.savePositionEstimationConfig = function (callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "1.6.0")) {
            MSP.send_message(MSPCodes.MSP_SET_POSITION_ESTIMATION_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_POSITION_ESTIMATION_CONFIG), false, callback);
        } else {
            callback();
        }
    };

    self.loadCalibrationData = function (callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "1.8.1")) {
            MSP.send_message(MSPCodes.MSP_CALIBRATION_DATA, false, false, callback);
        } else {
            callback();
        }
    };

    self.saveCalibrationData = function (callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "1.8.1")) {
            MSP.send_message(MSPCodes.MSP_SET_CALIBRATION_DATA, mspHelper.crunch(MSPCodes.MSP_SET_CALIBRATION_DATA), false, callback);
        } else {
            callback();
        }
    };

    self.loadRthAndLandConfig = function (callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "1.7.1")) {
            MSP.send_message(MSPCodes.MSP_RTH_AND_LAND_CONFIG, false, false, callback);
        } else {
            callback();
        }
    };

    self.saveRthAndLandConfig = function (callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "1.7.1")) {
            MSP.send_message(MSPCodes.MSP_SET_RTH_AND_LAND_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_RTH_AND_LAND_CONFIG), false, callback);
        } else {
            callback();
        }
    };

    self.loadFwConfig = function (callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "1.7.1")) {
            MSP.send_message(MSPCodes.MSP_FW_CONFIG, false, false, callback);
        } else {
            callback();
        }
    };

    self.saveFwConfig = function (callback) {
        if (semver.gte(CONFIG.flightControllerVersion, "1.7.1")) {
            MSP.send_message(MSPCodes.MSP_SET_FW_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_FW_CONFIG), false, callback);
        } else {
            callback();
        }
    };

    self._getSetting = function(name) {
        var promise;
        if (this._settings) {
            promise = Promise.resolve(this._settings);
        } else {
            promise = new Promise(function(resolve, reject) {
                var $this = this;
                $.ajax({
                    url: chrome.runtime.getURL('/resources/settings.json'),
                    dataType: 'json',
                    error: function(jqXHR, text, error) {
                        reject(error);
                    },
                    success: function(data) {
                        $this._settings = data;
                        resolve(data);
                    }
                });
            });
        }
        return promise.then(function (data) {
            return data[name];
        });
    };

    self._encodeSettingName = function(name, data) {
        for (var ii = 0; ii < name.length; ii++) {
            data.push(name.charCodeAt(ii));
        }
        data.push(0);
    };

    self.getSetting = function(name, callback) {
        var $this = this;
        return this._getSetting(name).then(function (setting) {
           var data = [];
            $this._encodeSettingName(name, data);
            MSP.send_message(MSPCodes.MSPV2_SETTING, data, false, function(resp) {
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
                    default:
                        throw "Unknown setting type " + setting.type;
                }
                if (setting.table) {
                    value = setting.table.values[value];
                }
                if (callback) {
                    callback(value, setting);
                }
            });
        });
    };

    self.encodeSetting = function(name, value) {
        var $this = this;
        return this._getSetting(name).then(function (setting) {
            if (setting.table) {
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
            $this._encodeSettingName(name, data);
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
                default:
                    throw "Unknown setting type " + setting.type;
            }
            return data;
        });
    };

    self.setSetting = function(name, value, callback) {
        this.encodeSetting(name, value).then(function (data) {
            MSP.send_message(MSPCodes.MSPV2_SET_SETTING, data, false, callback);
        });
    };

    self.getRTC = function(callback) {
        if (semver.gt(CONFIG.flightControllerVersion, "1.7.3")) {
            MSP.send_message(MSPCodes.MSP_RTC, false, false, function(resp) {
                var seconds = resp.data.read32();
                var millis = resp.data.readU16();
                if (callback) {
                    callback(seconds, millis);
                }
            });
        } else if (callback) {
            callback(0, 0);
        }
    };

    self.setRTC = function(callback) {
        if (semver.gt(CONFIG.flightControllerVersion, "1.7.3")) {
            var now = Date.now();
            var secs = now / 1000;
            var millis = now % 1000;
            var data = [];
            data.push32(secs);
            data.push16(millis);
            MSP.send_message(MSPCodes.MSP_SET_RTC, data, false, callback);
        } else if (callback) {
            callback();
        }
    };

    return self;
})(GUI);
