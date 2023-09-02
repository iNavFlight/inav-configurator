'use strict';

// define all the global variables that are used to hold FC state
const TARGET = {  // woga65: info about the target variant
    fullIdentifier: "",
    isVariablePitch: false,
}

var CONFIG,
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
    MOTOR_RULES,
    LOGIC_CONDITIONS,
    LOGIC_CONDITIONS_STATUS,
    GLOBAL_FUNCTIONS,
    GLOBAL_VARIABLES_STATUS,
    PROGRAMMING_PID,
    PROGRAMMING_PID_STATUS,
    SERIAL_CONFIG,
    SENSOR_DATA,
    MOTOR_DATA,
    SERVO_DATA,
    GPS_DATA,
    MISSION_PLANNER,
    ANALOG,
    ARMING_CONFIG,
    FC_CONFIG,
    MISC,
    REVERSIBLE_MOTORS,
    DATAFLASH,
    SDCARD,
    BLACKBOX,
    RC_deadband,
    SENSOR_ALIGNMENT,
    RX_CONFIG,
    FAILSAFE_CONFIG,
    RXFAIL_CONFIG,
    VTX_CONFIG,
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
    FW_CONFIG,
    DEBUG_TRACE,
    MIXER_CONFIG,
    BATTERY_CONFIG,
    OUTPUT_MAPPING,
    SETTINGS,
    BRAKING_CONFIG,
    SAFEHOMES,
    BOARD_ALIGNMENT,
    CURRENT_METER_CONFIG,
    FEATURES,
    ESC_RPMS;       // woga65:

var FC = {
    restartRequired: false,
    MAX_SERVO_RATE: 125,
    MIN_SERVO_RATE: 0,
    isAirplane: function () {
        return (MIXER_CONFIG.platformType == PLATFORM_AIRPLANE);
    },
    isMultirotor: function () {
        return (MIXER_CONFIG.platformType == PLATFORM_MULTIROTOR || MIXER_CONFIG.platformType == PLATFORM_TRICOPTER);
    },
    isHelicopter: function () {
        return (MIXER_CONFIG.platformType == PLATFORM_HELICOPTER);
    },
    isRpyFfComponentUsed: function () {
        return true; // Currently all planes have roll, pitch and yaw FF
    },
    isRpyDComponentUsed: function () {
        return true; // Currently all platforms use D term
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
            mode: [],
            profile: 0,
            battery_profile: 0,
            uid: [0, 0, 0],
            accelerometerTrims: [0, 0],
            armingFlags: 0,
            name: ''
        };

        BOARD_ALIGNMENT = {
            roll: 0,
            pitch: 0,
            yaw: 0
        };

        CURRENT_METER_CONFIG = {
            scale: 0,
            offset: 0,
            type: 0,
            capacity: 0
        };

        LED_STRIP = [];
        LED_COLORS = [];
        LED_MODE_COLORS = [];

        FEATURES = 0;

        PID = {
        };

        PID_names = [];
        PIDs = [];
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
            RC_YAW_EXPO: 0,
            manual_RC_EXPO: 0,
            manual_RC_YAW_EXPO: 0,
            manual_roll_rate: 0,
            manual_pitch_rate: 0,
            manual_yaw_rate: 0,
        };

        AUX_CONFIG = [];
        AUX_CONFIG_IDS = [];

        MODE_RANGES = [];
        ADJUSTMENT_RANGES = [];

        SERVO_CONFIG = [];
        SERVO_RULES             = new ServoMixerRuleCollection();
        MOTOR_RULES             = new MotorMixerRuleCollection();
        LOGIC_CONDITIONS        = new LogicConditionsCollection();
        LOGIC_CONDITIONS_STATUS = new LogicConditionsStatus();
        GLOBAL_VARIABLES_STATUS = new GlobalVariablesStatus();
        PROGRAMMING_PID         = new ProgrammingPidCollection();
        PROGRAMMING_PID_STATUS  = new ProgrammingPidStatus();

        MIXER_CONFIG = {
            yawMotorDirection: 0,
            yawJumpPreventionLimit: 0,
            platformType: -1,
            hasFlaps: false,
            appliedMixerPreset: -1,
            numberOfMotors: 0,
            numberOfServos: 0
        },

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
            air_speed: 0,
            kinematics: [0.0, 0.0, 0.0],
            temperature: [0, 0, 0, 0, 0, 0, 0, 0],
            debug: [0, 0, 0, 0]
        };

        MOTOR_DATA = new Array(8);
        SERVO_DATA = new Array(16);

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

        MISSION_PLANNER = new WaypointCollection();

        ANALOG = {
            voltage: 0,
            mAhdrawn: 0,
            mWhdrawn: 0,
            rssi: 0,
            amperage: 0,
            power: 0,
            cell_count: 0,
            battery_percentage: 0,
            battery_full_when_plugged_in: false,
            use_capacity_thresholds: false,
            battery_remaining_capacity: 0,
            battery_flags: 0
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
            battery_cells: 0,
            vbatscale: 0,
            vbatdetectcellvoltage: 0,
            vbatmincellvoltage: 0,
            vbatmaxcellvoltage: 0,
            vbatwarningcellvoltage: 0,
            battery_capacity: 0,
            battery_capacity_warning: 0,
            battery_capacity_critical: 0,
            battery_capacity_unit: 'mAh'
        };

        BATTERY_CONFIG = {
            vbatscale: 0,
            vbatdetectcellvoltage: 0,
            vbatmincellvoltage: 0,
            vbatmaxcellvoltage: 0,
            vbatwarningcellvoltage: 0,
            current_offset: 0,
            current_scale: 0,
            capacity: 0,
            capacity_warning: 0,
            capacity_critical: 0,
            capacity_unit: 0
        };

        VTX_CONFIG = {
            device_type: VTX.DEV_UNKNOWN,
            band: 0,
            channel: 1,
            power: 0,
            pitmode: 0,
            low_power_disarm: 0,
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
            gyroNotchCutoff2: null,
            accNotchHz: null,
            accNotchCutoff: null,
            gyroStage2LowpassHz: null
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
            },
            opflow: {
                Scale: null
            },
            magGain: {
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

        REVERSIBLE_MOTORS = {
            deadband_low: 0,
            deadband_high: 0,
            neutral: 0,
            deadband_throttle: 0
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

        RC_deadband = {
            deadband: 0,
            yaw_deadband: 0,
            alt_hold_deadband: 0
        };

        SENSOR_ALIGNMENT = {
            align_gyro: 0,
            align_acc: 0,
            align_mag: 0,
            align_opflow: 0
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

        BRAKING_CONFIG = {
            speedThreshold: null,
            disengageSpeed: null,
            timeout: null,
            boostFactor: null,
            boostTimeout: null,
            boostSpeedThreshold: null,
            boostDisengageSpeed: null,
            bankAngle: null
        }

        RXFAIL_CONFIG = [];

        OUTPUT_MAPPING = new OutputMappingCollection();

        SETTINGS = {};

        ESC_RPMS = [];      // woga65:

        SAFEHOMES = new SafehomeCollection();
    },
    getOutputUsages: function() {
        return {
            'ANY':      (0),
            'MC_MOTOR': (1<<2),
            'MC_SERVO': (1<<3),
            'FW_MOTOR': (1<<5),
            'FW_SERVO': (1<<6),
            'LED':      (1<<24)
        };
    },
    getFeatures: function () {
        var features = [
            {bit: 1, group: 'batteryVoltage', name: 'VBAT'},
            {bit: 4, group: 'other', name: 'MOTOR_STOP'},
            {bit: 6, group: 'other', name: 'SOFTSERIAL', haveTip: true, showNameInTip: true},
            {bit: 7, group: 'other', name: 'GPS', haveTip: true},
            {bit: 10, group: 'other', name: 'TELEMETRY', showNameInTip: true},
            {bit: 11, group: 'batteryCurrent', name: 'CURRENT_METER'},
            {bit: 12, group: 'other', name: 'REVERSIBLE_MOTORS', showNameInTip: true},
            {bit: 15, group: 'other', name: 'RSSI_ADC', haveTip: true, showNameInTip: true},
            {bit: 16, group: 'other', name: 'LED_STRIP', showNameInTip: true},
            {bit: 17, group: 'other', name: 'DASHBOARD', showNameInTip: true},
            {bit: 19, group: 'other', name: 'BLACKBOX', haveTip: true, showNameInTip: true},
            {bit: 28, group: 'other', name: 'PWM_OUTPUT_ENABLE', haveTip: true},
            {bit: 26, group: 'other', name: 'SOFTSPI'},
            {bit: 29, group: 'other', name: 'OSD', haveTip: false, showNameInTip: false},
            {bit: 22, group: 'other', name: 'AIRMODE', haveTip: false, showNameInTip: false},
            {bit: 30, group: 'other', name: 'FW_LAUNCH', haveTip: false, showNameInTip: false},
            {bit: 2, group: 'other', name: 'TX_PROF_SEL', haveTip: false, showNameInTip: false},
            {bit: 0, group: 'other', name: 'THR_VBAT_COMP', haveTip: true, showNameInTip: true},
            {bit: 3, group: 'other', name: 'BAT_PROFILE_AUTOSWITCH', haveTip: true, showNameInTip: true},
            {bit: 31, group: 'other', name: "FW_AUTOTRIM", haveTip: true, showNameInTip: true}
        ];

        return features.reverse();
    },
    isFeatureEnabled: function (featureName, features) {
        if (features === undefined) {
            features = this.getFeatures();
        }
        for (var i = 0; i < features.length; i++) {
            if (features[i].name == featureName && bit_check(FEATURES, features[i].bit)) {
                return true;
            }
        }
        return false;
    },
    isMotorOutputEnabled: function () {
        return this.isFeatureEnabled('PWM_OUTPUT_ENABLE', this.getFeatures());
    },
    getGpsProtocols: function () {
        return [
            'NMEA',
            'UBLOX',
            'UBLOX7',
            'MSP',
            'FAKE'
        ];
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
                message: null,
                defaultRate: 400,
                rates: {
                    50: "50Hz",
                    400: "400Hz"
                }
            },
            1: {
                name: "ONESHOT125",
                message: null,
                defaultRate: 1000,
                rates: {
                    1000: "1kHz",
                    2000: "2kHz"
                }
            },
            2: {
                name: "MULTISHOT",
                message: null,
                defaultRate: 2000,
                rates: {
                    1000: "1kHz",
                    2000: "2kHz"
                }
            },
            3: {
                name: "BRUSHED",
                message: null,
                defaultRate: 8000,
                rates: {
                    8000: "8kHz",
                    16000: "16kHz",
                    32000: "32kHz"
                }
            },
            4: {
                name: "DSHOT150",
                message: null,
                defaultRate: 4000,
                rates: {
                    4000: "4kHz"
                }
            },
            5: {
                name: "DSHOT300",
                message: null,
                defaultRate: 8000,
                rates: {
                    8000: "8kHz"
                }
            },
            6: {
                name: "DSHOT600",
                message: null,
                defaultRate: 16000,
                rates: {
                    16000: "16kHz"
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
        return [];
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
            15: "BLOCKED_HARDWARE_FAILURE",
            26: "BLOCKED_INVALID_SETTING",
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
    getAccelerometerCalibrated: function () {
        var calibrated = true;
        var flagNames = FC.getArmingFlags();

        if (CALIBRATION_DATA.accGain.X === 4096 && CALIBRATION_DATA.accGain.Y === 4096 && CALIBRATION_DATA.accGain.Z === 4096 && 
            CALIBRATION_DATA.accZero.X === 0 && CALIBRATION_DATA.accZero.Y === 0 && CALIBRATION_DATA.accZero.Z === 0
           ) {
            calibrated = false;
        }

        if ((calibrated) && flagNames.hasOwnProperty(13)) {
            if (bit_check(CONFIG.armingFlags, 13)) {
                calibrated = false;
            }
        }

        return calibrated;
    },
    getUserControlMode: function () {
        return [
            "Attitude",
            "Cruise"
        ]
    },
    getPidNames: function () {
        return [
            'Roll',
            'Pitch',
            'Yaw',
            'Position Z',
            'Position XY',
            'Velocity XY',
            'Surface',
            'Level',
            'Heading Hold',
            'Velocity Z',
            'Nav Heading'
        ];
    },
    getRthAltControlMode: function () {
        return ["Current", "Extra", "Fixed", "Max", "At least", "At least, linear descent"];
    },
    getRthAllowLanding: function() {
        return ["Never", "Always", "Only on failsafe"];
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
        if (RC_MAP.length === 8 || TARGET.isVariablePitch) {
            return MIXER_CONFIG.platformType === PLATFORM_HELICOPTER    // woga65: rc-channel remapping
                ? ['A', 'E', 'R', 'T', '5', '6', 'C', 'G']              // if variable pitch, map collective + gyro gain
                : ['A', 'E', 'R', 'T', '5', '6', '7', '8'];             // else map AUX3/CH7 + AUX4/CH8
        }
        return ['A', 'E', 'R', 'T'];                                    // FC firmware restricted to 4-channel mapping
    },
    isRcMapValid: function (val) {
        var strBuffer = val.split(''),
            duplicityBuffer = [];

        if (val.length != FC.getRcMapLetters().length)
            return false;

        // check if characters inside are all valid, also check for duplicity
        for (var i = 0; i < val.length; i++) {
            if (FC.getRcMapLetters().indexOf(strBuffer[i]) < 0)
                return false;

            if (duplicityBuffer.indexOf(strBuffer[i]) < 0)
                duplicityBuffer.push(strBuffer[i]);
            else
                return false;
        }

        return true;
    },
    getServoMixInputNames: function () {
        return [
            'Stabilized Roll',      // 0
            'Stabilized Pitch',     // 1
            'Stabilized Yaw',       // 2
            'Stabilized Throttle',  // 3
            'RC Roll',              // 4
            'RC Pitch',             // 5
            'RC Yaw',               // 6
            'RC Throttle',          // 7
            'RC Channel 5',         // 8
            'RC Channel 6',         // 9
            TARGET.isVariablePitch ? 'RC Collective Pitch' : 'RC Channel 7',    // 10   // woga65: channel naming for either
            TARGET.isVariablePitch ? 'RC Gyro Gain' : 'RC Channel 8',           // 11   // variable pitch or regular aircraft
            'Gimbal Pitch',         // 12
            'Gimbal Roll',          // 13
            'Flaperon Mode',        // 14
            'RC Channel 9',         // 15
            'RC Channel 10',        // 16
            'RC Channel 11',        // 17
            'RC Channel 12',        // 18
            'RC Channel 13',        // 19
            'RC Channel 14',        // 20
            'RC Channel 15',        // 21
            'RC Channel 16',        // 22
            'Stabilized Roll+',     // 23
            'Stabilized Roll-',     // 24
            'Stabilized Pitch+',    // 25
            'Stabilized Pitch-',    // 26
            'Stabilized Yaw+',      // 27
            'Stabilized Yaw-',      // 28,
            'MAX',                  // 29,
            'GVAR 0',               // 30
            'GVAR 1',               // 31
            'GVAR 2',               // 32
            'GVAR 3',               // 33
            'GVAR 4',               // 34
            'GVAR 5',               // 35
            'GVAR 6',               // 36
            'GVAR 7',               // 37
        ];
    },
    getServoMixInputName: function (input) {
        return this.getServoMixInputNames()[input];
    },
    getModeId: function (name) {
        for (var i = 0; i < AUX_CONFIG.length; i++) {
            if (AUX_CONFIG[i] == name)
                return i;
        }
        return -1;
    },
    isModeBitSet: function (i) {
        return bit_check(CONFIG.mode[Math.trunc(i / 32)], i % 32);
    },
    isModeEnabled: function (name) {
        return this.isModeBitSet(this.getModeId(name));
    },
    getLogicOperators: function () {
        return {
            0: {
                name: "True",
                operandType: "Active",
                hasOperand: [false, false],
                output: "boolean"
            },
            1: {
                name: "Equal (A = B)",
                operandType: "Comparison",
                hasOperand: [true, true],
                output: "boolean"
            },
            2: {
                name: "Greater Than (A > B)",
                operandType: "Comparison",
                hasOperand: [true, true],
                output: "boolean"
            },
            3: {
                name: "Lower Than (A < B)",
                operandType: "Comparison",
                hasOperand: [true, true],
                output: "boolean"
            },
            4: {
                name: "Low",
                operandType: "RC Switch Check",
                hasOperand: [true, false],
                output: "boolean"
            },
            5: {
                name: "Mid",
                operandType: "RC Switch Check",
                hasOperand: [true, false],
                output: "boolean"
            },
            6: {
                name: "High",
                operandType: "RC Switch Check",
                hasOperand: [true, false],
                output: "boolean"
            },
            7: {
                name: "AND",
                operandType: "Logic Switches",
                hasOperand: [true, true],
                output: "boolean"
            },
            8: {
                name: "OR",
                operandType: "Logic Switches",
                hasOperand: [true, true],
                output: "boolean"
            },
            9: {
                name: "XOR",
                operandType: "Logic Switches",
                hasOperand: [true, true],
                output: "boolean"
            },
            10: {
                name: "NAND",
                operandType: "Logic Switches",
                hasOperand: [true, true],
                output: "boolean"
            },
            11: {
                name: "NOR",
                operandType: "Logic Switches",
                hasOperand: [true, true],
                output: "boolean"
            },
            12: {
                name: "NOT",
                operandType: "Logic Switches",
                hasOperand: [true, false],
                output: "boolean"
            },
            13: {
                name: "Sticky",
                operandType: "Logic Switches",
                hasOperand: [true, true],
                output: "boolean"
            },
            14: {
                name: "Basic: Add",
                operandType: "Maths",
                hasOperand: [true, true],
                output: "raw"
            },
            15: {
                name: "Basic: Subtract",
                operandType: "Maths",
                hasOperand: [true, true],
                output: "raw"
            },
            16: {
                name: "Basic: Multiply",
                operandType: "Maths",
                hasOperand: [true, true],
                output: "raw"
            },
            17: {
                name: "Basic: Divide",
                operandType: "Maths",
                hasOperand: [true, true],
                output: "raw"
            },
            40: {
                name: "Modulo",
                operandType: "Maths",
                hasOperand: [true, true],
                output: "raw"
            },
            18: {
                name: "Set GVAR",
                operandType: "Variables",
                hasOperand: [true, true],
                output: "none"
            },
            19: {
                name: "Increase GVAR",
                operandType: "Variables",
                hasOperand: [true, true],
                output: "none"
            },
            20: {
                name: "Decrease GVAR",
                operandType: "Variables",
                hasOperand: [true, true],
                output: "none"
            },
            21: {
                name: "Set IO Port",
                operandType: "Set Flight Parameter",
                hasOperand: [true, true],
                output: "none"
            },
            22: {
                name: "Override Arming Safety",
                operandType: "Set Flight Parameter",
                hasOperand: [false, false],
                output: "boolean"
            },
            23: {
                name: "Override Throttle Scale",
                operandType: "Set Flight Parameter",
                hasOperand: [true, false],
                output: "boolean"
            },
            29: {
                name: "Override Throttle",
                operandType: "Set Flight Parameter",
                hasOperand: [true, false],
                output: "boolean"
            },
            24: {
                name: "Swap Roll & Yaw",
                operandType: "Set Flight Parameter",
                hasOperand: [false, false],
                output: "boolean"
            },
            25: {
                name: "Set VTx Power Level",
                operandType: "Set Flight Parameter",
                hasOperand: [true, false],
                output: "boolean"
            },
            30: {
                name: "Set VTx Band",
                operandType: "Set Flight Parameter",
                hasOperand: [true, false],
                output: "boolean"
            },
            31: {
                name: "Set VTx Channel",
                operandType: "Set Flight Parameter",
                hasOperand: [true, false],
                output: "boolean"
            },
            26: {
                name: "Invert Roll",
                operandType: "Set Flight Parameter",
                hasOperand: [false, false],
                output: "boolean"
            },
            27: {
                name: "Invert Pitch",
                operandType: "Set Flight Parameter",
                hasOperand: [false, false],
                output: "boolean"
            },
            28: {
                name: "Invert Yaw",
                operandType: "Set Flight Parameter",
                hasOperand: [false, false],
                output: "boolean"
            },
            32: {
                name: "Set OSD Layout",
                operandType: "Set Flight Parameter",
                hasOperand: [true, false],
                output: "boolean"
            },
            33: {
                name: "Trigonometry: Sine",
                operandType: "Maths",
                hasOperand: [true, true],
                output: "raw"
            },
            34: {
                name: "Trigonometry: Cosine",
                operandType: "Maths",
                hasOperand: [true, true],
                output: "raw"
            },
            35: {
                name: "Trigonometry: Tangent",
                operandType: "Maths",
                hasOperand: [true, true],
                output: "raw"
            },
            36: {
                name: "Map Input",
                operandType: "Maths",
                hasOperand: [true, true],
                output: "raw"
            },
            37: {
                name: "Map Output",
                operandType: "Maths",
                hasOperand: [true, true],
                output: "raw"
            },
            38: {
                name: "Override RC Channel",
                operandType: "Set Flight Parameter",
                hasOperand: [true, true],
                output: "boolean"
            },

            41: {
                name: "Override Loiter Radius",
                operandType: "Set Flight Parameter",
                hasOperand: [true, false],
                output: "boolean"
            },
            42: {
                name: "Set Profile",
                operandType: "Set Flight Parameter",
                hasOperand: [true, false],
                output: "boolean"
            },
            43: {
                name: "Use Lowest Value",
                operandType: "Comparison",
                hasOperand: [true, true],
                output: "raw"
            },
            44: {
                name: "Use Highest Value",
                operandType: "Comparison",
                hasOperand: [true, true],
                output: "raw"
            },
            45: {
                name: "Flight Axis Angle Override",
                operandType: "Set Flight Parameter",
                hasOperand: [true, true],
                output: "boolean"
            },
            46: {
                name: "Flight Axis Rate Override",
                operandType: "Set Flight Parameter",
                hasOperand: [true, true],
                output: "boolean"
            },
            47: {
                name: "Edge",
                operandType: "Logic Switches",
                hasOperand: [true, true],
                output: "boolean"
            },
            48: {
                name: "Delay",
                operandType: "Logic Switches",
                hasOperand: [true, true],
                output: "boolean"
            },
            49: {
                name: "Timer",
                operandType: "Logic Switches",
                hasOperand: [true, true],
                output: "boolean"
            },
            50: {
                name: "Delta (|A| >= B)",
                operandType: "Comparison",
                hasOperand: [true, true],
                output: "boolean"
            },
            51: {
                name: "Approx Equals (A ~ B)",
                operandType: "Comparison",
                hasOperand: [true, true],
                output: "boolean"
            },
        }
    },
    getOperandTypes: function () {
        return {
            0: {
                name: "Value",
                type: "value",
                min: -1000000,
                max: 1000000,
                step: 1,
                default: 0
            },
            1: {
                name: "Get RC Channel",
                type: "range",
                range: [1, 16],
                default: 1
            },
            2: {
                name: "Flight",
                type: "dictionary",
                default: 0,
                values: {
                    0: "ARM timer [s]",
                    1: "Home distance [m]",
                    2: "Trip distance [m]",
                    3: "RSSI",
                    4: "Vbat [centi-Volt] [1V = 100]",
                    5: "Cell voltage [centi-Volt] [1V = 100]",
                    6: "Current [centi-Amp] [1A = 100]",
                    7: "Current drawn [mAh]",
                    8: "GPS Sats",
                    9: "Ground speed [cm/s]",
                    10: "3D speed [cm/s]",
                    11: "Air speed [cm/s]",
                    12: "Altitude [cm]",
                    13: "Vertical speed [cm/s]",
                    14: "Throttle position [%]",
                    15: "Roll [deg]",
                    16: "Pitch [deg]",
                    17: "Is Armed",
                    18: "Is Autolaunch",
                    19: "Is Controlling Altitude",
                    20: "Is Controlling Position",
                    21: "Is Emergency Landing",
                    22: "Is RTH",
                    23: "Is Landing",
                    24: "Is Failsafe",
                    25: "Stabilized Roll",
                    26: "Stabilized Pitch",
                    27: "Stabilized Yaw",
                    28: "3D home distance [m]",
                    29: "CRSF LQ",
                    30: "CRSF SNR",
                    31: "GPS Valid Fix",
                    32: "Loiter Radius [cm]",
                    33: "Active Profile",
                    34: "Battery cells",
                    35: "AGL status [0/1]",
                    36: "AGL [cm]",
                    37: "Rangefinder [cm]",
                }
            },
            3: {
                name: "Flight Mode",
                type: "dictionary",
                default: 0,
                values: {
                    0: "Failsafe",
                    1: "Manual",
                    2: "RTH",
                    3: "Position Hold",
                    4: "Cruise",
                    5: "Altitude Hold",
                    6: "Angle",
                    7: "Horizon",
                    8: "Air",
                    9: "USER 1",
                    10: "USER 2",
                    11: "Course Hold",
                    12: "USER 3",
                    13: "USER 4",
                    14: "Acro",
                    15: "Waypoint Mission",
                }
            },
            4: {
                name: "Logic Condition",
                type: "range",
                range: [0, (LOGIC_CONDITIONS.getMaxLogicConditionCount()-1)],
                default: 0
            },
            5: {
                name: "Global Variable",
                type: "range",
                range: [0, 7],
                default: 0
            },
            6: {
                name: "Programming PID",
                type: "range",
                range: [0, 3],
                default: 0
            },
            7: {
                name: "Waypoints",
                type: "dictionary",
                default: 0,
                values: {
                    0: "Is WP",
                    1: "Current Waypoint Index",
                    2: "Current Waypoint Action",
                    3: "Next Waypoint Action",
                    4: "Distance to next Waypoint [m]",
                    5: "Distance from last Waypoint [m]",
                    6: "Current WP has User Action 1",
                    7: "Current WP has User Action 2",
                    8: "Current WP has User Action 3",
                    9: "Current WP has User Action 4",
                    10: "Next WP has User Action 1",
                    11: "Next WP has User Action 2",
                    12: "Next WP has User Action 3",
                    13: "Next WP has User Action 4",
                }
            },
        }
    },
    getBatteryProfileParameters: function () {
        return [
            'bat_cells',
            'vbat_cell_detect_voltage',
            'vbat_max_cell_voltage',
            'vbat_min_cell_voltage',
            'vbat_warning_cell_voltage',
            'battery_capacity',
            'battery_capacity_warning',
            'battery_capacity_critical',
            'battery_capacity_unit',
            'controlrate_profile',
            'throttle_scale',
            'throttle_idle',
            'turtle_mode_power_factor',
            'failsafe_throttle',
            'nav_mc_hover_thr',
            'nav_fw_cruise_thr',
            'nav_fw_min_thr',
            'nav_fw_max_thr',
            'nav_fw_pitch2thr',
            'nav_fw_launch_thr',
            'nav_fw_launch_idle_thr',
            'limit_cont_current',
            'limit_burst_current',
            'limit_burst_current_time',
            'limit_burst_current_falldown_time',
            'limit_cont_power',
            'limit_burst_power',
            'limit_burst_power_time',
            'limit_burst_power_falldown_time'
        ];
    },
    isBatteryProfileParameter: function(paramName) {
        return ($.inArray(paramName,this.getBatteryProfileParameters()) != -1);
    },
    getControlProfileParameters: function () {
        return [
            'mc_p_pitch',
            'mc_i_pitch',
            'mc_d_pitch',
            'mc_cd_pitch',
            'mc_p_roll',
            'mc_i_roll',
            'mc_d_roll',
            'mc_cd_roll',
            'mc_p_yaw',
            'mc_i_yaw',
            'mc_d_yaw',
            'mc_cd_yaw',
            'mc_p_level',
            'mc_i_level',
            'mc_d_level',
            'fw_p_pitch',
            'fw_i_pitch',
            'fw_d_pitch',
            'fw_ff_pitch',
            'fw_p_roll',
            'fw_i_roll',
            'fw_d_roll',
            'fw_ff_roll',
            'fw_p_yaw',
            'fw_i_yaw',
            'fw_d_yaw',
            'fw_ff_yaw',
            'fw_p_level',
            'fw_i_level',
            'fw_d_level',
            'max_angle_inclination_rll',
            'max_angle_inclination_pit',
            'dterm_lpf_hz',
            'dterm_lpf_type',
            'dterm_lpf2_hz',
            'dterm_lpf2_type',
            'yaw_lpf_hz',
            'fw_iterm_throw_limit',
            'fw_reference_airspeed',
            'fw_turn_assist_yaw_gain',
            'fw_turn_assist_pitch_gain',
            'fw_iterm_limit_stick_position',
            'fw_yaw_iterm_freeze_bank_angle',
            'pidsum_limit',
            'pidsum_limit_yaw',
            'iterm_windup',
            'rate_accel_limit_roll_pitch',
            'rate_accel_limit_yaw',
            'heading_hold_rate_limit',
            'nav_mc_pos_z_p',
            'nav_mc_vel_z_p',
            'nav_mc_vel_z_i',
            'nav_mc_vel_z_d',
            'nav_mc_pos_xy_p',
            'nav_mc_vel_xy_p',
            'nav_mc_vel_xy_i',
            'nav_mc_vel_xy_d',
            'nav_mc_vel_xy_ff',
            'nav_mc_heading_p',
            'nav_mc_vel_xy_dterm_lpf_hz',
            'nav_mc_vel_xy_dterm_attenuation',
            'nav_mc_vel_xy_dterm_attenuation_start',
            'nav_mc_vel_xy_dterm_attenuation_end',
            'nav_fw_pos_z_p',
            'nav_fw_pos_z_i',
            'nav_fw_pos_z_d',
            'nav_fw_pos_xy_p',
            'nav_fw_pos_xy_i',
            'nav_fw_pos_xy_d',
            'nav_fw_heading_p',
            'nav_fw_pos_hdg_p',
            'nav_fw_pos_hdg_i',
            'nav_fw_pos_hdg_d',
            'nav_fw_pos_hdg_pidsum_limit',
            'mc_iterm_relax',
            'mc_iterm_relax_cutoff',
            'd_boost_min',
            'd_boost_max',
            'd_boost_max_at_acceleration',
            'd_boost_gyro_delta_lpf_hz',
            'antigravity_gain',
            'antigravity_accelerator',
            'antigravity_cutoff_lpf_hz',
            'pid_type',
            'mc_cd_lpf_hz',
            'fw_level_pitch_trim',
            'smith_predictor_strength',
            'smith_predictor_delay',
            'smith_predictor_lpf_hz',
            'fw_level_pitch_gain',
            'thr_mid',
            'thr_expo',
            'tpa_rate',
            'tpa_breakpoint',
            'fw_tpa_time_constant',
            'rc_expo',
            'rc_yaw_expo',
            'roll_rate',
            'pitch_rate',
            'yaw_rate',
            'manual_rc_expo',
            'manual_rc_yaw_expo',
            'manual_roll_rate',
            'manual_pitch_rate',
            'manual_yaw_rate',
            'fpv_mix_degrees',
            'rate_dynamics_center_sensitivity',
            'rate_dynamics_end_sensitivity',
            'rate_dynamics_center_correction',
            'rate_dynamics_end_correction',
            'rate_dynamics_center_weight',
            'rate_dynamics_end_weight'
        ];
    },
    isControlProfileParameter: function(paramName) {
        return ($.inArray(paramName, this.getControlProfileParameters()) != -1);
    }
};
