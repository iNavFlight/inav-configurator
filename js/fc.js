'use strict';

// define all the global variables that are uses to hold FC state
var CONFIG;
var BF_CONFIG;
var LED_STRIP;
var LED_COLORS;
var LED_MODE_COLORS;
var PID;
var PID_names;
var PIDs;
var RC_MAP;
var RC;
var RC_tuning;
var AUX_CONFIG;
var AUX_CONFIG_IDS;
var MODE_RANGES;
var ADJUSTMENT_RANGES;
var SERVO_CONFIG;
var SERVO_RULES;
var SERIAL_CONFIG;
var SENSOR_DATA;
var MOTOR_DATA;
var SERVO_DATA;
var GPS_DATA;
var ANALOG;
var ARMING_CONFIG;
var FC_CONFIG;
var MISC;
var _3D;
var DATAFLASH;
var SDCARD;
var BLACKBOX;
var TRANSPONDER;
var RC_deadband;
var SENSOR_ALIGNMENT;
var RX_CONFIG;
var FAILSAFE_CONFIG;
var RXFAIL_CONFIG;
var ADVANCED_CONFIG;

var FC = {
    isRatesInDps: function () {
        if (typeof CONFIG != "undefined" && CONFIG.flightControllerIdentifier == "INAV" && semver.gt(CONFIG.flightControllerVersion, "1.1.0")) {
            return true;
        } else {
            return false;
        }
    },
    resetState: function() {
        CONFIG = {
            apiVersion:    "0.0.0",
            flightControllerIdentifier: '',
            flightControllerVersion: '',
            version:       0,
            buildInfo:     '',
            multiType:     0,
            msp_version:   0, // not specified using semantic versioning
            capability:    0,
            cycleTime:     0,
            i2cError:      0,
            activeSensors: 0,
            mode:          0,
            profile:       0,
            uid:           [0, 0, 0],
            accelerometerTrims: [0, 0]
        };

        BF_CONFIG = {
            mixerConfiguration:     0,
            features:               0,
            serialrx_type:          0,
            board_align_roll:       0,
            board_align_pitch:      0,
            board_align_yaw:        0,
            currentscale:           0,
            currentoffset:          0
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
            RC_RATE:         0,
            RC_EXPO:         0,
            roll_pitch_rate: 0, // pre 1.7 api only
            roll_rate:       0,
            pitch_rate:      0,
            yaw_rate:        0,
            dynamic_THR_PID: 0,
            throttle_MID:    0,
            throttle_EXPO:   0,
            dynamic_THR_breakpoint: 0,
        	RC_YAW_EXPO:         0
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
            cliBaudRate: 0,
        };

        SENSOR_DATA = {
            gyroscope:     [0, 0, 0],
            accelerometer: [0, 0, 0],
            magnetometer:  [0, 0, 0],
            altitude:      0,
            sonar:         0,
            kinematics:    [0.0, 0.0, 0.0],
            debug:         [0, 0, 0, 0]
        };

        MOTOR_DATA = new Array(8);
        SERVO_DATA = new Array(8);

        GPS_DATA = {
            fix:             0,
            numSat:          0,
            lat:             0,
            lon:             0,
            alt:             0,
            speed:           0,
            ground_course:   0,
            distanceToHome:  0,
            ditectionToHome: 0,
            update:          0,
            hdop:            0,
            eph:             0,
            epv:             0,
            messageDt:       0,
            errors:          0,
            timeouts:        0,
            packetCount:     0
        };

        ANALOG = {
            voltage:    0,
            mAhdrawn:   0,
            rssi:       0,
            amperage:   0
        };

        ARMING_CONFIG = {
            auto_disarm_delay:      0,
            disarm_kill_switch:     0
        };

        FC_CONFIG = {
            loopTime: 0
        };

        MISC = {
            midrc:                  0,
            minthrottle:            0,
            maxthrottle:            0,
            mincommand:             0,
            failsafe_throttle:      0,
            gps_type:               0,
            gps_baudrate:           0,
            gps_ubx_sbas:           0,
            multiwiicurrentoutput:  0,
            rssi_channel:           0,
            placeholder2:           0,
            mag_declination:        0, // not checked
            vbatscale:              0,
            vbatmincellvoltage:     0,
            vbatmaxcellvoltage:     0,
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

        _3D = {
            deadband3d_low:         0,
            deadband3d_high:        0,
            neutral3d:              0,
            deadband3d_throttle:    0
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
            totalSizeKB: 0,
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
            deadband:               0,
            yaw_deadband:           0,
            alt_hold_deadband:      0
        };

        SENSOR_ALIGNMENT = {
            align_gyro:             0,
            align_acc:              0,
            align_mag:              0
        };

        RX_CONFIG = {
            serialrx_provider:      0,
            maxcheck:               0,
            midrc:                  0,
            mincheck:               0,
            spektrum_sat_bind:      0,
            rx_min_usec:            0,
            rx_max_usec:            0,
            nrf24rx_protocol:       0,
            nrf24rx_id:             0
        };

        FAILSAFE_CONFIG = {
            failsafe_delay:                 0,
            failsafe_off_delay:             0,
            failsafe_throttle:              0,
            failsafe_kill_switch:           0,
            failsafe_throttle_low_delay:    0,
            failsafe_procedure:             0
        };

        RXFAIL_CONFIG = [];
    }
};
