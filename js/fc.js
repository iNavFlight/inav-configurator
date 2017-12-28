'use strict';

// define all the global variables that are uses to hold FC state
var CONFIG,
    BF_CONFIG,
    LED_STRIP,
    LED_COLORS,
    LED_MODE_COLORS,
    PID,
    PID_names,
    PIDs,
    RC_MAP,
    RC,
    RC_tuning,
    AUX_CONFIG,
    AUX_CONFIG_IDS,
    MODE_RANGES,
    ADJUSTMENT_RANGES,
    SERVO_CONFIG,
    SERVO_RULES,
    SERIAL_CONFIG,
    SENSOR_DATA,
    MOTOR_DATA,
    SERVO_DATA,
    GPS_DATA,
    ANALOG,
    ARMING_CONFIG,
    FC_CONFIG,
    MISC,
    _3D,
    DATAFLASH,
    SDCARD,
    BLACKBOX,
    TRANSPONDER,
    RC_deadband,
    SENSOR_ALIGNMENT,
    RX_CONFIG,
    FAILSAFE_CONFIG,
    RXFAIL_CONFIG,
    ADVANCED_CONFIG,
    INAV_PID_CONFIG,
    PID_ADVANCED,
    FILTER_CONFIG,
    SENSOR_STATUS,
    SENSOR_CONFIG,
    NAV_POSHOLD,
    CALIBRATION_DATA,
    POSITION_ESTIMATOR,
    RTH_AND_LAND_CONFIG,
    FW_CONFIG;

var FC = {
    MAX_SERVO_RATE: 125,
    MIN_SERVO_RATE: -125,
    isRatesInDps: function () {
        return !!(typeof CONFIG != "undefined" && CONFIG.flightControllerIdentifier == "INAV" && semver.gt(CONFIG.flightControllerVersion, "1.1.0"));
    },
    resetState: function () {
        SENSOR_STATUS = {
            isHardwareHealthy: 0,
            gyroHwStatus: 0,
            accHwStatus: 0,
            magHwStatus: 0,
            baroHwStatus: 0,
            gpsHwStatus: 0,
            rangeHwStatus: 0,
            speedHwStatus: 0,
            flowHwStatus: 0
        };

        SENSOR_CONFIG = {
            accelerometer: 0,
            barometer: 0,
            magnetometer: 0,
            pitot: 0,
            rangefinder: 0,
            opflow: 0
        };

        CONFIG = {
            apiVersion: "0.0.0",
            flightControllerIdentifier: '',
            flightControllerVersion: '',
            version: 0,
            buildInfo: '',
            multiType: 0,
            msp_version: 0, // not specified using semantic versioning
            capability: 0,
            cycleTime: 0,
            i2cError: 0,
            activeSensors: 0,
            mode: 0,
            profile: 0,
            uid: [0, 0, 0],
            accelerometerTrims: [0, 0],
            armingFlags: 0
        };

        BF_CONFIG = {
            mixerConfiguration: 0,
            features: 0,
            serialrx_type: 0,
            board_align_roll: 0,
            board_align_pitch: 0,
            board_align_yaw: 0,
            currentscale: 0,
            currentoffset: 0
        };

        LED_STRIP = [];
        LED_COLORS = [];
        LED_MODE_COLORS = [];

        PID = {
        };

        PID_names = [];
        PIDs = new Array(10);
        for (var i = 0; i < 10; i++) {
            PIDs[i] = new Array(3);
        }

        RC_MAP = [];

        // defaults
        // roll, pitch, yaw, throttle, aux 1, ... aux n
        RC = {
            active_channels: 0,
            channels: new Array(32)
        };

        RC_tuning = {
            RC_RATE: 0,
            RC_EXPO: 0,
            roll_pitch_rate: 0, // pre 1.7 api only
            roll_rate: 0,
            pitch_rate: 0,
            yaw_rate: 0,
            dynamic_THR_PID: 0,
            throttle_MID: 0,
            throttle_EXPO: 0,
            dynamic_THR_breakpoint: 0,
            RC_YAW_EXPO: 0
        };

        AUX_CONFIG = [];
        AUX_CONFIG_IDS = [];

        MODE_RANGES = [];
        ADJUSTMENT_RANGES = [];

        SERVO_CONFIG = [];
        SERVO_RULES = [];

        SERIAL_CONFIG = {
            ports: [],

            // pre 1.6 settings
            mspBaudRate: 0,
            gpsBaudRate: 0,
            gpsPassthroughBaudRate: 0,
            cliBaudRate: 0
        };

        SENSOR_DATA = {
            gyroscope: [0, 0, 0],
            accelerometer: [0, 0, 0],
            magnetometer: [0, 0, 0],
            altitude: 0,
            barometer: 0,
            sonar: 0,
            kinematics: [0.0, 0.0, 0.0],
            debug: [0, 0, 0, 0]
        };

        MOTOR_DATA = new Array(8);
        SERVO_DATA = new Array(8);

        GPS_DATA = {
            fix: 0,
            numSat: 0,
            lat: 0,
            lon: 0,
            alt: 0,
            speed: 0,
            ground_course: 0,
            distanceToHome: 0,
            ditectionToHome: 0,
            update: 0,
            hdop: 0,
            eph: 0,
            epv: 0,
            messageDt: 0,
            errors: 0,
            timeouts: 0,
            packetCount: 0
        };

        ANALOG = {
            voltage: 0,
            mAhdrawn: 0,
            rssi: 0,
            amperage: 0
        };

        ARMING_CONFIG = {
            auto_disarm_delay: 0,
            disarm_kill_switch: 0
        };

        FC_CONFIG = {
            loopTime: 0
        };

        MISC = {
            midrc: 0,
            minthrottle: 0,
            maxthrottle: 0,
            mincommand: 0,
            failsafe_throttle: 0,
            gps_type: 0,
            sensors_baudrate: 0,
            gps_ubx_sbas: 0,
            multiwiicurrentoutput: 0,
            rssi_channel: 0,
            placeholder2: 0,
            mag_declination: 0, // not checked
            vbatscale: 0,
            vbatmincellvoltage: 0,
            vbatmaxcellvoltage: 0,
            vbatwarningcellvoltage: 0
        };

        ADVANCED_CONFIG = {
            gyroSyncDenominator: null,
            pidProcessDenom: null,
            useUnsyncedPwm: null,
            motorPwmProtocol: null,
            motorPwmRate: null,
            servoPwmRate: null,
            gyroSync: null
        };

        FILTER_CONFIG = {
            gyroSoftLpfHz: null,
            dtermLpfHz: null,
            yawLpfHz: null,
            gyroNotchHz1: null,
            gyroNotchCutoff1: null,
            dtermNotchHz: null,
            dtermNotchCutoff: null,
            gyroNotchHz2: null,
            gyroNotchCutoff2: null
        };

        PID_ADVANCED = {
            rollPitchItermIgnoreRate: null,
            yawItermIgnoreRate: null,
            yawPLimit: null,
            axisAccelerationLimitRollPitch: null,
            axisAccelerationLimitYaw: null,
            dtermSetpointWeight: null,
            pidSumLimit: null
        };

        INAV_PID_CONFIG = {
            asynchronousMode: null,
            accelerometerTaskFrequency: null,
            attitudeTaskFrequency: null,
            magHoldRateLimit: null,
            magHoldErrorLpfFrequency: null,
            yawJumpPreventionLimit: null,
            gyroscopeLpf: null,
            accSoftLpfHz: null
        };

        NAV_POSHOLD = {
            userControlMode: null,
            maxSpeed: null,
            maxClimbRate: null,
            maxManualSpeed: null,
            maxManualClimbRate: null,
            maxBankAngle: null,
            useThrottleMidForAlthold: null,
            hoverThrottle: null
        };

        CALIBRATION_DATA = {
            acc: {
                Pos0: null,
                Pos1: null,
                Pos2: null,
                Pos3: null,
                Pos4: null,
                Pos5: null
            },
            accZero: {
                X: null,
                Y: null,
                Z: null
            },
            accGain: {
                X: null,
                Y: null,
                Z: null
            },
            magZero: {
                X: null,
                Y: null,
                Z: null
            }
        };

        RTH_AND_LAND_CONFIG = {
             minRthDistance: null,
             rthClimbFirst: null,
             rthClimbIgnoreEmergency: null,
             rthTailFirst: null,
             rthAllowLanding: null,
             rthAltControlMode: null,
             rthAbortThreshold: null,
             rthAltitude: null,
             landDescentRate: null,
             landSlowdownMinAlt: null,
             landSlowdownMaxAlt: null,
             emergencyDescentRate: null
        };

        _3D = {
            deadband3d_low: 0,
            deadband3d_high: 0,
            neutral3d: 0,
            deadband3d_throttle: 0
        };

        DATAFLASH = {
            ready: false,
            supported: false,
            sectors: 0,
            totalSize: 0,
            usedSize: 0
        };

        SDCARD = {
            supported: false,
            state: 0,
            filesystemLastError: 0,
            freeSizeKB: 0,
            totalSizeKB: 0
        };

        BLACKBOX = {
            supported: false,
            blackboxDevice: 0,
            blackboxRateNum: 1,
            blackboxRateDenom: 1
        };

        TRANSPONDER = {
            supported: false,
            data: []
        };

        RC_deadband = {
            deadband: 0,
            yaw_deadband: 0,
            alt_hold_deadband: 0
        };

        SENSOR_ALIGNMENT = {
            align_gyro: 0,
            align_acc: 0,
            align_mag: 0
        };

        RX_CONFIG = {
            receiver_type: 0,
            serialrx_provider: 0,
            maxcheck: 0,
            midrc: 0,
            mincheck: 0,
            spektrum_sat_bind: 0,
            rx_min_usec: 0,
            rx_max_usec: 0,
            spirx_protocol: 0,
            spirx_id: 0,
            spirx_channel_count: 0,
        };

        POSITION_ESTIMATOR = {
            w_z_baro_p: null,
            w_z_gps_p: null,
            w_z_gps_v: null,
            w_xy_gps_p: null,
            w_xy_gps_v: null,
            gps_min_sats: null,
            use_gps_velned: null
        };

        FAILSAFE_CONFIG = {
            failsafe_delay: 0,
            failsafe_off_delay: 0,
            failsafe_throttle: 0,
            failsafe_kill_switch: 0,
            failsafe_throttle_low_delay: 0,
            failsafe_procedure: 0,
            failsafe_recovery_delay: 0,
            failsafe_fw_roll_angle: 0,
            failsafe_fw_pitch_angle: 0,
            failsafe_fw_yaw_rate: 0,
            failsafe_stick_motion_threshold: 0,
            failsafe_min_distance: 0,
            failsafe_min_distance_procedure: 0
        };

        FW_CONFIG = {
            cruiseThrottle: null,
            minThrottle: null,
            maxThrottle: null,
            maxBankAngle: null,
            maxClimbAngle: null,
            maxDiveAngle: null,
            pitchToThrottle: null,
            loiterRadius: null
        };

        RXFAIL_CONFIG = [];
    },
    getFeatures: function () {
        var features = [
            {bit: 1, group: 'batteryVoltage', name: 'VBAT'},
            {bit: 4, group: 'esc', name: 'MOTOR_STOP'},
            {bit: 5, group: 'other', name: 'SERVO_TILT', showNameInTip: true},
            {bit: 6, group: 'other', name: 'SOFTSERIAL', haveTip: true, showNameInTip: true},
            {bit: 7, group: 'gps', name: 'GPS', haveTip: true},
            {bit: 10, group: 'other', name: 'TELEMETRY', showNameInTip: true},
            {bit: 11, group: 'batteryCurrent', name: 'CURRENT_METER'},
            {bit: 12, group: 'other', name: '3D', showNameInTip: true},
            {bit: 15, group: 'other', name: 'RSSI_ADC', haveTip: true, showNameInTip: true},
            {bit: 16, group: 'other', name: 'LED_STRIP', showNameInTip: true},
            {bit: 17, group: 'other', name: 'DISPLAY', showNameInTip: true},
            {bit: 19, group: 'other', name: 'BLACKBOX', haveTip: true, showNameInTip: true},
            {bit: 20, group: 'other', name: 'CHANNEL_FORWARDING', showNameInTip: true}
        ];

        if (semver.lt(CONFIG.flightControllerVersion, "1.6.0")) {
            features.push(
                {bit: 2, group: 'other', name: 'INFLIGHT_ACC_CAL', showNameInTip: true},
                {bit: 9, group: 'other', name: 'SONAR', showNameInTip: true},
                {bit: 8, group: 'rxFailsafe', name: 'FAILSAFE'}
            );
        }

        if (semver.lt(CONFIG.flightControllerVersion, "1.3.0")) {
            features.push(
                {bit: 18, group: 'esc', name: 'ONESHOT125', haveTip: true}
            );
        }

        if (semver.gte(CONFIG.flightControllerVersion, "1.4.0")) {
            features.push(
                {bit: 28, group: 'esc-priority', name: 'PWM_OUTPUT_ENABLE', haveTip: true}
            );
        } else {
            $('.features.esc-priority').parent().hide();
        }

        /*
         * Transponder disabled until not implemented in firmware
         */
        if (false && semver.gte(CONFIG.apiVersion, "1.16.0")) {
            features.push(
                {bit: 21, group: 'other', name: 'TRANSPONDER', haveTip: true, showNameInTip: true}
            );
        }

        if (semver.gte(CONFIG.apiVersion, "1.21.0")) {
            features.push(
                {bit: 26, group: 'other', name: 'SOFTSPI'}
            );
        }

        if (semver.gte(CONFIG.flightControllerVersion, '1.3.0')) {
            features.push(
                {bit: 27, group: 'other', name: 'PWM_SERVO_DRIVER', haveTip: true, showNameInTip: true}
            );
        }

        if (semver.gte(CONFIG.flightControllerVersion, '1.5.0')) {
            features.push(
                {bit: 29, group: 'other', name: 'OSD', haveTip: false, showNameInTip: false}
            );
        }

        if (semver.gte(CONFIG.flightControllerVersion, '1.7.3')) {
            features.push(
                {bit: 22, group: 'other', name: 'AIRMODE', haveTip: false, showNameInTip: false}
            );
        }

        return features.reverse();
    },
    isFeatureEnabled: function (featureName, features) {
        if (features === undefined) {
            features = this.getFeatures();
        }
        for (var i = 0; i < features.length; i++) {
            if (features[i].name == featureName && bit_check(BF_CONFIG.features, features[i].bit)) {
                return true;
            }
        }
        return false;
    },
    isMotorOutputEnabled: function () {
        return this.isFeatureEnabled('PWM_OUTPUT_ENABLE', this.getFeatures());
    },
    getLooptimes: function () {
        return {
            125: {
                defaultLooptime: 2000,
                looptimes: {
                    4000: "250Hz",
                    3000: "334Hz",
                    2000: "500Hz",
                    1500: "667Hz",
                    1000: "1kHz",
                    500: "2kHz",
                    250: "4kHz",
                    125: "8kHz"
                }
            },
            1000: {
                defaultLooptime: 2000,
                looptimes: {
                    4000: "250Hz",
                    2000: "500Hz",
                    1000: "1kHz"
                }
            }
        };
    },
    getGyroFrequencies: function () {
        return {
            125: {
                defaultLooptime: 1000,
                looptimes: {
                    4000: "250Hz",
                    3000: "334Hz",
                    2000: "500Hz",
                    1500: "667Hz",
                    1000: "1kHz",
                    500: "2kHz",
                    250: "4kHz",
                    125: "8kHz"
                }
            },
            1000: {
                defaultLooptime: 1000,
                looptimes: {
                    4000: "250Hz",
                    2000: "500Hz",
                    1000: "1kHz"
                }
            }
        };
    },
    getGyroLpfValues: function () {
        return [
            {
                tick: 125,
                defaultDenominator: 16,
                label: "256Hz"
            },
            {
                tick: 1000,
                defaultDenominator: 2,
                label: "188Hz"
            },
            {
                tick: 1000,
                defaultDenominator: 2,
                label: "98Hz"
            },
            {
                tick: 1000,
                defaultDenominator: 2,
                label: "42Hz"
            },
            {
                tick: 1000,
                defaultDenominator: 2,
                label: "20Hz"
            },
            {
                tick: 1000,
                defaultDenominator: 2,
                label: "10Hz"
            }
        ];
    },
    getGpsProtocols: function () {
        var data = [
            'NMEA',
            'UBLOX',
            'I2C-NAV',
            'DJI NAZA'
        ];

        if (semver.gte(CONFIG.flightControllerVersion, "1.7.1")) {
            data.push('UBLOX7')
        }

        if (semver.gte(CONFIG.flightControllerVersion, "1.7.2")) {
            data.push('MTK')
        }

        return data;
    },
    getGpsBaudRates: function () {
        return [
            '115200',
            '57600',
            '38400',
            '19200',
            '9600'
        ];
    },
    getGpsSbasProviders: function () {
        return [
            'Autodetect',
            'European EGNOS',
            'North American WAAS',
            'Japanese MSAS',
            'Indian GAGAN',
            'Disabled'
        ];
    },
    getRxTypes: function() {
        // Keep value field in sync with rxReceiverType_e in rx.h
        var rxTypes = [
            {
                name: 'RX_SERIAL',
                bit: 3,
                value: 3,
            },
            {
                name: 'RX_PPM',
                bit: 0,
                value: 2,
            },
            {
                name: 'RX_PWM',
                bit: 13,
                value: 1,
            },
        ];

        if (semver.gte(CONFIG.apiVersion, "1.21.0")) {
            rxTypes.push({
                name: 'RX_SPI',
                bit: 25,
                value: 5,
            });
        }

        rxTypes.push({
            name: 'RX_MSP',
            bit: 14,
            value: 4,
        });

        // Versions using feature bits don't allow not having an
        // RX and fallback to RX_PPM.
        if (semver.gt(CONFIG.flightControllerVersion, "1.7.3")) {
            rxTypes.push({
                name: 'RX_NONE',
                value: 0,
            });
        }

        return rxTypes;
    },
    isRxTypeEnabled: function(rxType) {
        if (semver.gt(CONFIG.flightControllerVersion, "1.7.3")) {
            return RX_CONFIG.receiver_type == rxType.value;
        }
        return bit_check(BF_CONFIG.features, rxType.bit);
    },
    setRxTypeEnabled: function(rxType) {
        if (semver.gt(CONFIG.flightControllerVersion, "1.7.3")) {
            RX_CONFIG.receiver_type = rxType.value;
        } else {
            // Clear other rx features before
            var rxTypes = this.getRxTypes();
            for (var ii = 0; ii < rxTypes.length; ii++) {
                BF_CONFIG.features = bit_clear(BF_CONFIG.features, rxTypes[ii].bit);
            }
            // Set the feature for this rx type (if any, RX_NONE is set by clearing all)
            if (rxType.bit !== undefined) {
                BF_CONFIG.features = bit_set(BF_CONFIG.features, rxType.bit);
            }
        }
    },
    getSerialRxTypes: function () {
        var data = [
            'SPEKTRUM1024',
            'SPEKTRUM2048',
            'SBUS',
            'SUMD',
            'SUMH',
            'XBUS_MODE_B',
            'XBUS_MODE_B_RJ01',
            'IBUS'
        ];

        if (semver.gte(CONFIG.flightControllerVersion, "1.6.0")) {
            data.push('JETI EXBUS');
            data.push('TBS Crossfire');
        }

        return data;
    },
    getSPIProtocolTypes: function () {
        return [
            'V202 250Kbps',
            'V202 1Mbps',
            'Syma X',
            'Syma X5C',
            'Cheerson CX10',
            'Cheerson CX10A',
            'JJRC H8_3D',
            'iNav Reference protocol',
            'eLeReS'
            
        ];
    },
    getSensorAlignments: function () {
        return [
            'CW 0°',
            'CW 90°',
            'CW 180°',
            'CW 270°',
            'CW 0° flip',
            'CW 90° flip',
            'CW 180° flip',
            'CW 270° flip'
        ];
    },
    getEscProtocols: function () {
        return {
            0: {
                name: "STANDARD",
                defaultRate: 400,
                rates: {
                    50: "50Hz",
                    400: "400Hz"
                }
            },
            1: {
                name: "ONESHOT125",
                defaultRate: 1000,
                rates: {
                    400: "400Hz",
                    1000: "1kHz",
                    2000: "2kHz"
                }
            },
            2: {
                name: "ONESHOT42",
                defaultRate: 2000,
                rates: {
                    400: "400Hz",
                    1000: "1kHz",
                    2000: "2kHz",
                    4000: "4kHz",
                    8000: "8kHz"
                }
            },
            3: {
                name: "MULTISHOT",
                defaultRate: 2000,
                rates: {
                    400: "400Hz",
                    1000: "1kHz",
                    2000: "2kHz",
                    4000: "4kHz",
                    8000: "8kHz"
                }
            },
            4: {
                name: "BRUSHED",
                defaultRate: 8000,
                rates: {
                    8000: "8kHz",
                    16000: "16kHz",
                    32000: "32kHz"
                }
            }
        };
    },
    getServoRates: function () {
        return {
            50: "50Hz",
            60: "60Hz",
            100: "100Hz",
            160: "160Hz",
            330: "330Hz"
        };
    },
    getAsyncModes: function () {
        return [
            'Disabled',
            'Gyro',
            'All'
        ]
    },
    getAccelerometerTaskFrequencies: function () {
        return {
            100: '100Hz',
            200: '200Hz',
            250: '250Hz',
            500: '500Hz',
            750: '750Hz',
            1000: '1kHz'
        }
    },
    getAttitudeTaskFrequencies: function () {
        return {
            100: '100Hz',
            200: '200Hz',
            250: '250Hz',
            500: '500Hz',
            750: '750Hz',
            1000: '1kHz'
        }
    },
    getOsdDisabledFields: function () {
        return ['CRAFT_NAME'];
    },
    getAccelerometerNames: function () {
        return [ "NONE", "AUTO", "ADXL345", "MPU6050", "MMA845x", "BMA280", "LSM303DLHC", "MPU6000", "MPU6500", "MPU9250", "FAKE"];
    },
    getMagnetometerNames: function () {
        return ["NONE", "AUTO", "HMC5883", "AK8975", "GPSMAG", "MAG3110", "AK8963", "IST8310", "FAKE"];
    },
    getBarometerNames: function () {
        if (semver.gte(CONFIG.flightControllerVersion, "1.6.2")) {
            return ["NONE", "AUTO", "BMP085", "MS5611", "BMP280", "MS5607", "FAKE"];
        }
        else {
            return ["NONE", "AUTO", "BMP085", "MS5611", "BMP280", "FAKE"];
        }
    },
    getPitotNames: function () {
        if (semver.gte(CONFIG.flightControllerVersion, "1.6.3")) {
            return ["NONE", "AUTO", "MS4525", "ADC", "VIRTUAL", "FAKE"];
        }
        else {
            return ["NONE", "AUTO", "MS4525", "FAKE"];
        }
    },
    getRangefinderNames: function () {
        return [ "NONE", "HCSR04", "SRF10"];
    },
    getArmingFlags: function () {
        return {
            0: "OK_TO_ARM",
            1: "PREVENT_ARMING",
            2: "ARMED",
            3: "WAS_EVER_ARMED",
            8: "BLOCKED_UAV_NOT_LEVEL",
            9: "BLOCKED_SENSORS_CALIBRATING",
            10: "BLOCKED_SYSTEM_OVERLOADED",
            11: "BLOCKED_NAVIGATION_SAFETY",
            12: "BLOCKED_COMPASS_NOT_CALIBRATED",
            13: "BLOCKED_ACCELEROMETER_NOT_CALIBRATED",
            14: null,
            15: "BLOCKED_HARDWARE_FAILURE"
        }
    },
    getArmingBlockingFlags: function() {
        var allFlags = this.getArmingFlags(),
            retVal = {};

        for (var i in allFlags) {
            if (allFlags.hasOwnProperty(i) && parseInt(i, 10) >= 8 && allFlags[i] !== null) {
                retVal[i] = allFlags[i];
            }
        }

        return retVal;
    },
    getUserControlMode: function () {
        return [
            "Attitude",
            "Cruise"
        ]
    },
    getPidNames: function () {

        if (semver.lt(CONFIG.flightControllerVersion, "1.6.0")) {
            return PID_names;
        } else {
            return [
                'Roll',
                'Pitch',
                'Yaw',
                'Position Z',
                'Position XY',
                'Velocity XY',
                'Surface',
                'Level',
                'Heading',
                'Velocity Z'
            ];
        }
    },
    getRthAltControlMode: function () {
        return ["Current", "Extra", "Fixed", "Max", "At Least"];
    },
    getRthAllowLanding: function() {
        var values = ["Never", "Always"];
        if (semver.gt(CONFIG.flightControllerVersion, '1.7.3')) {
            values.push("Only on failsafe");
        }
        return values;
    },
    getFailsafeProcedure: function () {
        return {
            0: "Land",
            1: "Drop",
            2: "RTH", 
            3: "Do Nothing", 
        }
    },
    getRcMapLetters: function () {
        return ['A', 'E', 'R', 'T', '5', '6', '7', '8'];
    }
};
