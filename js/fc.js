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
var INAV_PID_CONFIG;

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

        INAV_PID_CONFIG = {
            asynchronousMode: null,
            accelerometerTaskFrequency: null,
            attitudeTaskFrequency: null,
            magHoldRateLimit: null,
            magHoldErrorLpfFrequency: null,
            yawJumpPreventionLimit: null,
            gyroscopeLpf: null,
            accSoftLpfHz: null
        }

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
    },
    getFeatures: function () {
        var features = [
            {bit: 0, group: 'rxMode', mode: 'group', name: 'RX_PPM'},
            {bit: 1, group: 'batteryVoltage', name: 'VBAT'},
            {bit: 2, group: 'other', name: 'INFLIGHT_ACC_CAL'},
            {bit: 3, group: 'rxMode', mode: 'group', name: 'RX_SERIAL'},
            {bit: 4, group: 'esc', name: 'MOTOR_STOP'},
            {bit: 5, group: 'other', name: 'SERVO_TILT'},
            {bit: 6, group: 'other', name: 'SOFTSERIAL', haveTip: true},
            {bit: 7, group: 'gps', name: 'GPS', haveTip: true},
            {bit: 8, group: 'rxFailsafe', name: 'FAILSAFE'},
            {bit: 9, group: 'other', name: 'SONAR'},
            {bit: 10, group: 'other', name: 'TELEMETRY'},
            {bit: 11, group: 'batteryCurrent', name: 'CURRENT_METER'},
            {bit: 12, group: 'other', name: '3D'},
            {bit: 13, group: 'rxMode', mode: 'group', name: 'RX_PARALLEL_PWM'},
            {bit: 14, group: 'rxMode', mode: 'group', name: 'RX_MSP'},
            {bit: 15, group: 'rssi', name: 'RSSI_ADC'},
            {bit: 16, group: 'other', name: 'LED_STRIP'},
            {bit: 17, group: 'other', name: 'DISPLAY'},
            {bit: 19, group: 'other', name: 'BLACKBOX', haveTip: true}
        ];

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

        if (semver.gte(CONFIG.apiVersion, "1.12.0")) {
            features.push(
                {bit: 20, group: 'other', name: 'CHANNEL_FORWARDING'}
            );
        }

        if (semver.gte(CONFIG.apiVersion, "1.16.0")) {
            features.push(
                {bit: 21, group: 'other', name: 'TRANSPONDER', haveTip: true}
            );
        }

        if (semver.gte(CONFIG.apiVersion, "1.21.0")) {
            features.push(
                {bit: 25, group: 'rxMode', mode: 'group', name: 'RX_NRF24', haveTip: true},
                {bit: 26, group: 'other', name: 'SOFTSPI'}
            );
        }

        if (semver.gte(CONFIG.flightControllerVersion, '1.3.0')) {
            features.push(
                {bit: 27, group: 'other', name: 'PWM_SERVO_DRIVER', haveTip: true}
            );
        }
        return features;
    },
    isFeatureEnabled: function(featureName, features) {
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
   getGyroLpfValues: function () {
       return [
           {
               tick: 125,
               defaultDenominator: 16,
               label: "256Hz"
           }, {
               tick: 1000,
               defaultDenominator: 2,
               label: "188Hz"
           }, {
               tick: 1000,
               defaultDenominator: 2,
               label: "98Hz"
           }, {
               tick: 1000,
               defaultDenominator: 2,
               label: "42Hz"
           }, {
               tick: 1000,
               defaultDenominator: 2,
               label: "20Hz"
           }, {
               tick: 1000,
               defaultDenominator: 2,
               label: "10Hz"
           }
       ];
   }
};
