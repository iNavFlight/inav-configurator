'use strict';

var presets = presets || {};

presets.elementHelper = function (group, field, value) {
    return {
        group: group,
        field: field,
        value: value
    }
};

presets.defaultValues = {
    PIDs: {
        mr: [
            [40, 30, 23, 0],   //PID_ROLL
            [40, 30, 23, 0],   //PID_PITCH
            [85, 45, 0, 0],    //PID_YAW
            [50, 0, 0, 0],     //PID_POS_Z
            [65, 120, 10, 0],  //PID_POS_XY
            [40, 15, 100, 40],  //PID_VEL_XY
            [0, 0, 0, 0],      //PID_SURFACE
            [20, 15, 75, 0],   //PID_LEVEL
            [60, 0, 0, 0],     //PID_HEADING
            [100, 50, 10, 0]   //PID_VEL_Z
        ],
        fw: [
            [5, 7, 0, 50],     //PID_ROLL
            [5, 7, 0, 50],     //PID_PITCH
            [6, 10, 0, 60],    //PID_YAW
            [40, 5, 10, 0],    //PID_POS_Z
            [75, 5, 8, 0],     //PID_POS_XY
            [0, 0, 0, 0],      //PID_VEL_XY
            [0, 0, 0, 0],      //PID_SURFACE
            [20, 5, 75, 0],    //PID_LEVEL
            [60, 0, 0, 0],     //PID_HEADING
            [0, 0, 0, 0]       //PID_VEL_Z
        ]},
    INAV_PID_CONFIG: {"asynchronousMode": "0", "accelerometerTaskFrequency": 500, "attitudeTaskFrequency": 250, "magHoldRateLimit": 90, "magHoldErrorLpfFrequency": 2, "yawJumpPreventionLimit": 200, "gyroscopeLpf": "3", "accSoftLpfHz": 15},
    ADVANCED_CONFIG: {"gyroSyncDenominator": 2, "pidProcessDenom": 1, "useUnsyncedPwm": 1, "motorPwmProtocol": 0, "motorPwmRate": 400, "servoPwmRate": 50, "gyroSync": 1},
    RC_tuning: {"RC_RATE": 1, "RC_EXPO": 0.7, "roll_pitch_rate": 0, "roll_rate": 200, "pitch_rate": 200, "yaw_rate": 200, "dynamic_THR_PID": 0, "throttle_MID": 0.5, "throttle_EXPO": 0, "dynamic_THR_breakpoint": 1500, "RC_YAW_EXPO": 0.2},
    PID_ADVANCED: {"rollPitchItermIgnoreRate": 200, "yawItermIgnoreRate": 50, "yawPLimit": 300, "axisAccelerationLimitRollPitch": 0, "axisAccelerationLimitYaw": 1000},
    FILTER_CONFIG: {"gyroSoftLpfHz": 60, "dtermLpfHz": 40, "yawLpfHz": 30, "gyroNotchHz1": 0, "gyroNotchCutoff1": 0, "dtermNotchHz": 0, "dtermNotchCutoff": 0, "gyroNotchHz2": 0, "gyroNotchCutoff2": 0, "accNotchHz": 0, "accNotchCutoff": 0, "gyroStage2LowpassHz": 0},
    FC_CONFIG: {"loopTime": 1000},
    MIXER_CONFIG: {
        "yawMotorDirection": 1,
        "yawJumpPreventionLimit": 200,
        "platformType": 0,
        "hasFlaps": false
    }
};

presets.settings = {
    COMMON: {

    },
    FW: {
        "small_angle": 180,
    },
    MR: {
    },
    get: function(mixerType) {
        var settings = {};
        $.extend(settings, presets.settings.COMMON);
        if (mixerType == 'multirotor') {
            $.extend(settings, presets.settings.MR);
        } else {
            $.extend(settings, presets.settings.FW);
        }
        return settings;
    },
}

/**
 * When defining a preset, following fields are required:
 *
 * BF_CONFIG::mixerConfiguration
 * MIXER_CONFIG::platformType
 *
 * @type {{name: string, description: string, features: string[], applyDefaults: string[], settingsMSP: *[], type: string}[]}
 */
presets.presets = [
    {
        name: '3-inch Multirotor Preset',
        description: "INAV Quad X configuration, 3-inch propellers. F4/F7 CPU.",
        features: ["DSHOT600", "4k mode", "Matrix Filter", "Improved mechanics", "Optimized filtering", "Optimized rates"],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG", "MIXER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 3),
            presets.elementHelper("MIXER_CONFIG", "platformType", 0)
        ],
        settings: [
            {
                key: "motor_pwm_protocol",
                value: "DSHOT600"
            },
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "looptime",
                value: 250
            },
            {
                key: "gyro_lpf_hz",
                value: 130
            },
            {
                key: "gyro_lpf_type",
                value: "PT1"
            },
            {
                key: "gyro_stage2_lowpass_hz",
                value: 150
            },
            {
                key: "gyro_stage2_lowpass_type",
                value: "PT1"
            },
            {
                key: "dterm_lpf_hz",
                value: 100
            },
            {
                key: "dterm_lpf_type",
                value: "PT1"
            },
            {
                key: "dterm_lpf2_hz",
                value: 150
            },
            {
                key: "dterm_lpf2_type",
                value: "PT1"
            },
            {
                key: "use_dterm_fir_filter",
                value: "OFF"
            },
            {
                key: "mc_iterm_relax_type",
                value: "SETPOINT"
            },
            {
                key: "mc_iterm_relax",
                value: "RP"
            },
            {
                key: "d_boost_factor",
                value: 1.5
            },
            {
                key: "d_boost_max_at_acceleration",
                value: 5000.000
            },
            {
                key: "d_boost_gyro_delta_lpf_hz",
                value: 80
            },
            {
                key: "antigravity_gain",
                value: 2
            },
            {
                key: "antigravity_accelerator",
                value: 5
            },
            {
                key: "rc_yaw_expo",
                value: 70
            },
            {
                key: "rc_expo",
                value: 70
            },
            {
                key: "roll_rate",
                value: 70
            },
            {
                key: "pitch_rate",
                value: 70
            },
            {
                key: "yaw_rate",
                value: 60
            },
            {
                key: "mc_p_pitch",
                value: 38
            },
            {
                key: "mc_i_pitch",
                value: 55
            },
            {
                key: "mc_d_pitch",
                value: 25
            },
            {
                key: "mc_p_roll",
                value: 35
            },
            {
                key: "mc_i_roll",
                value: 50
            },
            {
                key: "mc_d_roll",
                value: 25
            },
            {
                key: "mc_p_yaw",
                value: 45
            },
            {
                key: "mc_i_yaw",
                value: 70
            },
            {
                key: "mc_airmode_type",
                value: "THROTTLE_THRESHOLD"
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON"
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 150
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 150
            },
            {
                key: "min_check",
                value: 1050
            },
            {
                key: "throttle_idle",
                value: 12
            },
            {
                key: "dterm_setpoint_weight",
                value: 0.500
            }
        ],
        type: 'multirotor'
    },
    {
        name: 'MegaBee Cinewoop',
        description: "iFlight MegaBee Preset",
        features: ["DSHOT600", "4k mode", "Matrix Filter", "Improved mechanics", "Optimized filtering", "Optimized rates"],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG", "MIXER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 3),
            presets.elementHelper("MIXER_CONFIG", "platformType", 0)
        ],
        settings: [
            {
                key: "motor_pwm_protocol",
                value: "DSHOT600"
            },
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "looptime",
                value: 250
            },
            {
                key: "gyro_lpf_hz",
                value: 130
            },
            {
                key: "gyro_lpf_type",
                value: "PT1"
            },
            {
                key: "gyro_stage2_lowpass_hz",
                value: 180
            },
            {
                key: "gyro_stage2_lowpass_type",
                value: "PT1"
            },
            {
                key: "gyro_notch1_hz",
                value: 200
            },
            {
                key: "gyro_notch1_cutoff",
                value: 175
            },
            {
                key: "dterm_lpf_hz",
                value: 100
            },
            {
                key: "dterm_lpf_type",
                value: "PT1"
            },
            {
                key: "dterm_lpf2_hz",
                value: 150
            },
            {
                key: "dterm_lpf2_type",
                value: "PT1"
            },
            {
                key: "use_dterm_fir_filter",
                value: "OFF"
            },
            {
                key: "mc_iterm_relax_type",
                value: "GYRO"
            },
            {
                key: "mc_iterm_relax",
                value: "RP"
            },
            {
                key: "d_boost_factor",
                value: 1.5
            },
            {
                key: "d_boost_max_at_acceleration",
                value: 5000.000
            },
            {
                key: "d_boost_gyro_delta_lpf_hz",
                value: 80
            },
            {
                key: "antigravity_gain",
                value: 2
            },
            {
                key: "antigravity_accelerator",
                value: 5
            },
            {
                key: "rc_yaw_expo",
                value: 70
            },
            {
                key: "rc_expo",
                value: 70
            },
            {
                key: "roll_rate",
                value: 70
            },
            {
                key: "pitch_rate",
                value: 70
            },
            {
                key: "yaw_rate",
                value: 60
            },
            {
                key: "mc_p_pitch",
                value: 34
            },
            {
                key: "mc_i_pitch",
                value: 55
            },
            {
                key: "mc_d_pitch",
                value: 35
            },
            {
                key: "mc_p_roll",
                value: 32
            },
            {
                key: "mc_i_roll",
                value: 45
            },
            {
                key: "mc_d_roll",
                value: 33
            },
            {
                key: "mc_p_yaw",
                value: 65
            },
            {
                key: "mc_i_yaw",
                value: 70
            },
            {
                key: "mc_airmode_type",
                value: "THROTTLE_THRESHOLD"
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON"
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 180
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 150
            },
            {
                key: "min_check",
                value: 1050
            },
            {
                key: "throttle_idle",
                value: 12
            },
            {
                key: "dterm_setpoint_weight",
                value: 0.400
            }
        ],
        type: 'multirotor'
    },
    {
        name: '5-inch Multirotor Preset',
        description: "INAV Quad X configuration, 5-inch propellers. F4/F7 CPU. GPS and Magnetometer are optional",
        features: ["DSHOT600", "2k mode", "Matrix Filter", "Improved mechanics", "Optimized filtering", "Optimized rates"],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG", "MIXER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 3),
            presets.elementHelper("MIXER_CONFIG", "platformType", 0)
        ],
        settings: [
            {
                key: "motor_pwm_protocol",
                value: "DSHOT600"
            },
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "looptime",
                value: 500
            },
            {
                key: "gyro_lpf_hz",
                value: 110
            },
            {
                key: "gyro_lpf_type",
                value: "PT1"
            },
            {
                key: "gyro_stage2_lowpass_hz",
                value: 250
            },
            {
                key: "gyro_stage2_lowpass_type",
                value: "PT1"
            },
            {
                key: "dterm_lpf_hz",
                value: 100
            },
            {
                key: "dterm_lpf_type",
                value: "PT1"
            },
            {
                key: "use_dterm_fir_filter",
                value: "OFF"
            },
            {
                key: "mc_iterm_relax_type",
                value: "SETPOINT"
            },
            {
                key: "mc_iterm_relax",
                value: "RP"
            },
            {
                key: "d_boost_factor",
                value: 1.5
            },
            {
                key: "d_boost_max_at_acceleration",
                value: 7500.000
            },
            {
                key: "d_boost_gyro_delta_lpf_hz",
                value: 80
            },
            {
                key: "antigravity_gain",
                value: 2
            },
            {
                key: "antigravity_accelerator",
                value: 5
            },
            {
                key: "rc_yaw_expo",
                value: 70
            },
            {
                key: "rc_expo",
                value: 70
            },
            {
                key: "roll_rate",
                value: 70
            },
            {
                key: "pitch_rate",
                value: 70
            },
            {
                key: "yaw_rate",
                value: 60
            },
            {
                key: "mc_p_pitch",
                value: 44
            },
            {
                key: "mc_i_pitch",
                value: 60
            },
            {
                key: "mc_d_pitch",
                value: 25
            },
            {
                key: "mc_p_roll",
                value: 40
            },
            {
                key: "mc_i_roll",
                value: 50
            },
            {
                key: "mc_d_roll",
                value: 25
            },
            {
                key: "mc_p_yaw",
                value: 45
            },
            {
                key: "mc_i_yaw",
                value: 70
            },
            {
                key: "mc_airmode_type",
                value: "THROTTLE_THRESHOLD"
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON"
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 200
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 150
            },
            {
                key: "min_check",
                value: 1050
            },
            {
                key: "throttle_idle",
                value: 12
            },
            {
                key: "dterm_setpoint_weight",
                value: 0.850
            }
        ],
        type: 'multirotor'
    },
    {
        name: '5-inch, 2208 2450KV motors',
        description: "Overpowered freestyle kwad. 5-inch, 3 bladed propellers like HQProp S4, Nepal N1, 2208 2450KV motors, 4S, DSHOT600 ESC protocol. Optimized for smooth, freestyle or acrobatic flight.",
        features: ["DSHOT600", "4k mode", "Matrix Filter", "Improved mechanics", "Optimized filtering", "Optimized rates"],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG", "MIXER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 3),
            presets.elementHelper("MIXER_CONFIG", "platformType", 0)
        ],
        settings: [
            {
                key: "motor_pwm_protocol",
                value: "DSHOT600"
            },
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "looptime",
                value: 250
            },
            {
                key: "gyro_lpf_hz",
                value: 115
            },
            {
                key: "gyro_lpf_type",
                value: "PT1"
            },
            {
                key: "gyro_stage2_lowpass_hz",
                value: 250
            },
            {
                key: "gyro_stage2_lowpass_type",
                value: "PT1"
            },
            {
                key: "dterm_lpf_hz",
                value: 110
            },
            {
                key: "dterm_lpf_type",
                value: "PT1"
            },
            {
                key: "dterm_lpf2_hz",
                value: 250
            },
            {
                key: "dterm_lpf2_type",
                value: "PT1"
            },
            {
                key: "use_dterm_fir_filter",
                value: "OFF"
            },
            {
                key: "mc_iterm_relax_type",
                value: "SETPOINT"
            },
            {
                key: "mc_iterm_relax",
                value: "RP"
            },
            {
                key: "d_boost_factor",
                value: 1.5
            },
            {
                key: "d_boost_max_at_acceleration",
                value: 7500.000
            },
            {
                key: "d_boost_gyro_delta_lpf_hz",
                value: 80
            },
            {
                key: "antigravity_gain",
                value: 2
            },
            {
                key: "antigravity_accelerator",
                value: 5
            },
            {
                key: "rc_yaw_expo",
                value: 70
            },
            {
                key: "rc_expo",
                value: 70
            },
            {
                key: "roll_rate",
                value: 85
            },
            {
                key: "pitch_rate",
                value: 85
            },
            {
                key: "yaw_rate",
                value: 75
            },
            {
                key: "mc_p_pitch",
                value: 26
            },
            {
                key: "mc_i_pitch",
                value: 60
            },
            {
                key: "mc_d_pitch",
                value: 30
            },
            {
                key: "mc_p_roll",
                value: 22
            },
            {
                key: "mc_i_roll",
                value: 50
            },
            {
                key: "mc_d_roll",
                value: 26
            },
            {
                key: "mc_p_yaw",
                value: 44
            },
            {
                key: "mc_i_yaw",
                value: 70
            },
            {
                key: "mc_airmode_type",
                value: "THROTTLE_THRESHOLD"
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON"
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 200
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 140
            },
            {
                key: "min_check",
                value: 1050
            },
            {
                key: "throttle_idle",
                value: 12
            },
            {
                key: "dterm_setpoint_weight",
                value: 0.850
            }
        ],
        type: 'multirotor'
    },
    {
        name: '6-inch, 2207 1700KV motors',
        description: "6-inch, 3 bladed propellers, 2207 1700KV motors, 4S, DSHOT600 ESC protocol. Optimized for smooth, freestyle or acrobatic flight with GPS or not.",
        features: ["DSHOT600", "2k mode", "Matrix Filter", "Improved mechanics", "Optimized filtering", "Optimized rates"],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG", "MIXER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 3),
            presets.elementHelper("MIXER_CONFIG", "platformType", 0)
        ],
        settings: [
            {
                key: "motor_pwm_protocol",
                value: "DSHOT600"
            },
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "looptime",
                value: 500
            },
            {
                key: "gyro_lpf_hz",
                value: 100
            },
            {
                key: "gyro_lpf_type",
                value: "PT1"
            },
            {
                key: "gyro_stage2_lowpass_hz",
                value: 250
            },
            {
                key: "gyro_stage2_lowpass_type",
                value: "PT1"
            },
            {
                key: "dterm_lpf_hz",
                value: 90
            },
            {
                key: "dterm_lpf_type",
                value: "PT1"
            },
            {
                key: "dterm_lpf2_hz",
                value: 200
            },
            {
                key: "dterm_lpf2_type",
                value: "PT1"
            },
            {
                key: "use_dterm_fir_filter",
                value: "OFF"
            },
            {
                key: "mc_iterm_relax_type",
                value: "SETPOINT"
            },
            {
                key: "mc_iterm_relax",
                value: "RP"
            },
            {
                key: "d_boost_factor",
                value: 1.5
            },
            {
                key: "d_boost_max_at_acceleration",
                value: 5500.000
            },
            {
                key: "d_boost_gyro_delta_lpf_hz",
                value: 70
            },
            {
                key: "antigravity_gain",
                value: 2
            },
            {
                key: "antigravity_accelerator",
                value: 5
            },
            {
                key: "rc_yaw_expo",
                value: 70
            },
            {
                key: "rc_expo",
                value: 70
            },
            {
                key: "roll_rate",
                value: 70
            },
            {
                key: "pitch_rate",
                value: 70
            },
            {
                key: "yaw_rate",
                value: 60
            },
            {
                key: "mc_p_pitch",
                value: 37
            },
            {
                key: "mc_i_pitch",
                value: 70
            },
            {
                key: "mc_d_pitch",
                value: 22
            },
            {
                key: "mc_p_roll",
                value: 31
            },
            {
                key: "mc_i_roll",
                value: 50
            },
            {
                key: "mc_d_roll",
                value: 21
            },
            {
                key: "mc_p_yaw",
                value: 50
            },
            {
                key: "mc_i_yaw",
                value: 70
            },
            {
                key: "mc_airmode_type",
                value: "THROTTLE_THRESHOLD"
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON"
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 175
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 110
            },
            {
                key: "min_check",
                value: 1050
            },
            {
                key: "throttle_idle",
                value: 12
            },
            {
                key: "dterm_setpoint_weight",
                value: 0.700
            }
        ],
        type: 'multirotor'
    },
    {
        name: '7-inch Multirotor Preset',
        description: "General configuration for 7-inch propellers. Adjusted rates and filtering.",
        features: ["DSHOT600", "2k mode", "Matrix Filter", "Improved mechanics", "Optimized filtering", "Optimized rates"],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG", "MIXER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 3),
            presets.elementHelper("MIXER_CONFIG", "platformType", 0)
        ],
        settings: [
            {
                key: "motor_pwm_protocol",
                value: "DSHOT600"
            },
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "looptime",
                value: 500
            },
            {
                key: "gyro_lpf_hz",
                value: 100
            },
            {
                key: "gyro_lpf_type",
                value: "PT1"
            },
            {
                key: "gyro_stage2_lowpass_hz",
                value: 160
            },
            {
                key: "gyro_stage2_lowpass_type",
                value: "PT1"
            },
            {
                key: "dterm_lpf_hz",
                value: 90
            },
            {
                key: "dterm_lpf_type",
                value: "PT1"
            },
            {
                key: "dterm_lpf2_hz",
                value: 0
            },
            {
                key: "dterm_lpf2_type",
                value: "PT1"
            },
            {
                key: "use_dterm_fir_filter",
                value: "OFF"
            },
            {
                key: "mc_iterm_relax_type",
                value: "SETPOINT"
            },
            {
                key: "mc_iterm_relax",
                value: "RPY"
            },
            {
                key: "d_boost_factor",
                value: 1.5
            },
            {
                key: "d_boost_max_at_acceleration",
                value: 5000.000
            },
            {
                key: "d_boost_gyro_delta_lpf_hz",
                value: 65
            },
            {
                key: "antigravity_gain",
                value: 2
            },
            {
                key: "antigravity_accelerator",
                value: 5
            },
            {
                key: "rc_yaw_expo",
                value: 70
            },
            {
                key: "rc_expo",
                value: 70
            },
            {
                key: "roll_rate",
                value: 70
            },
            {
                key: "pitch_rate",
                value: 70
            },
            {
                key: "yaw_rate",
                value: 60
            },
            {
                key: "mc_p_pitch",
                value: 44
            },
            {
                key: "mc_i_pitch",
                value: 60
            },
            {
                key: "mc_d_pitch",
                value: 25
            },
            {
                key: "mc_p_roll",
                value: 40
            },
            {
                key: "mc_i_roll",
                value: 50
            },
            {
                key: "mc_d_roll",
                value: 25
            },
            {
                key: "mc_p_yaw",
                value: 45
            },
            {
                key: "mc_i_yaw",
                value: 70
            },
            {
                key: "mc_airmode_type",
                value: "THROTTLE_THRESHOLD"
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON"
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 200
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 80
            },
            {
                key: "min_check",
                value: 1050
            },
            {
                key: "throttle_idle",
                value: 12
            },
            {
                key: "dterm_setpoint_weight",
                value: 0.800
            }
        ],
        type: 'multirotor'
    },
    {
        name: '10-inch Multirotor Preset',
        description: "450-600 class general purpose multirotor with 10-inch 2-bladed propellers.",
        features: [
            "DSHOT600",
            "400dps rates",
            "Improved PID defaults",
            "Adjusted filtering"
        ],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG", "MIXER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 3),
            presets.elementHelper("MIXER_CONFIG", "platformType", 0)
        ],
        settings: [
            {
                key: "motor_pwm_protocol",
                value: "DSHOT600"
            },
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "looptime",
                value: 500
            },
            {
                key: "gyro_lpf_hz",
                value: 60
            },
            {
                key: "gyro_lpf_type",
                value: "PT1"
            },
            {
                key: "gyro_stage2_lowpass_hz",
                value: 120
            },
            {
                key: "gyro_stage2_lowpass_type",
                value: "PT1"
            },
            {
                key: "dterm_lpf_hz",
                value: 60
            },
            {
                key: "dterm_lpf_type",
                value: "PT1"
            },
            {
                key: "dterm_lpf2_hz",
                value: 0
            },
            {
                key: "dterm_lpf2_type",
                value: "PT1"
            },
            {
                key: "use_dterm_fir_filter",
                value: "OFF"
            },
            {
                key: "mc_iterm_relax_type",
                value: "SETPOINT"
            },
            {
                key: "mc_iterm_relax",
                value: "RPY"
            },
            {
                key: "d_boost_factor",
                value: 1.5
            },
            {
                key: "d_boost_max_at_acceleration",
                value: 5000.000
            },
            {
                key: "d_boost_gyro_delta_lpf_hz",
                value: 50
            },
            {
                key: "antigravity_gain",
                value: 2
            },
            {
                key: "antigravity_accelerator",
                value: 5
            },
            {
                key: "rc_yaw_expo",
                value: 70
            },
            {
                key: "rc_expo",
                value: 70
            },
            {
                key: "roll_rate",
                value: 70
            },
            {
                key: "pitch_rate",
                value: 70
            },
            {
                key: "yaw_rate",
                value: 60
            },
            {
                key: "mc_p_pitch",
                value: 44
            },
            {
                key: "mc_i_pitch",
                value: 60
            },
            {
                key: "mc_d_pitch",
                value: 25
            },
            {
                key: "mc_p_roll",
                value: 40
            },
            {
                key: "mc_i_roll",
                value: 50
            },
            {
                key: "mc_d_roll",
                value: 25
            },
            {
                key: "mc_p_yaw",
                value: 45
            },
            {
                key: "mc_i_yaw",
                value: 70
            },
            {
                key: "mc_airmode_type",
                value: "THROTTLE_THRESHOLD"
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON"
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 150
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 60
            },
            {
                key: "min_check",
                value: 1050
            },
            {
                key: "throttle_idle",
                value: 12
            },
            {
                key: "dterm_setpoint_weight",
                value: 0.300
            },
            {
                key: "heading_hold_rate_limit",
                value: 30
            }
        ],
        type: 'multirotor'
    },
    {
        name: "Airplane General",
        description: "General setup for airplanes",
        features: [
            "Adjusted gyro filtering",
            "Adjusted PIDs",
            "Adjusted rates"
        ],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG", "MIXER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 14),
            presets.elementHelper("MIXER_CONFIG", "platformType", 1),
            presets.elementHelper("RC_tuning", "roll_rate", 200),
            presets.elementHelper("RC_tuning", "pitch_rate", 150),
            presets.elementHelper("RC_tuning", "yaw_rate", 90),
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 1)
        ],
        type: 'airplane'
    },
    {
        name: "Flying wing Z84",
        description: "Small flying wing on multirotor racer parts<br>" +
            "<span>300g-500g weight, 3S-4S battery</span>",
        features: [
            "Adjusted gyro filtering",
            "Adjusted PIDs",
            "Adjusted rates"
        ],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG", "MIXER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 8),
            presets.elementHelper("MIXER_CONFIG", "platformType", 1),
            presets.elementHelper("PIDs", 0, [2, 15, 0, 30]),  //ROLL PIDs
            presets.elementHelper("PIDs", 1, [2, 15, 0, 70]),  //PITCH PIDs
            presets.elementHelper("PIDs", 7, [10, 15, 75, 0]),  //LEVEL PIDs
            presets.elementHelper("RC_tuning", "roll_rate", 350),
            presets.elementHelper("RC_tuning", "pitch_rate", 90),
            presets.elementHelper("RC_tuning", "dynamic_THR_PID", 33),
            presets.elementHelper("RC_tuning", "dynamic_THR_breakpoint", 1300),
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 4)
        ],
        type: 'flyingwing'
    },
    {
        name: "Flying Wing S800 Sky Shadow",
        description: "Flying wing on multirotor racer parts with 3S/4S battery and FPV equipment",
        features: [
            "Adjusted gyro filtering",
            "Adjusted PIDs",
            "Adjusted rates"
        ],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG", "MIXER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 8),
            presets.elementHelper("MIXER_CONFIG", "platformType", 1),
            presets.elementHelper("PIDs", 0, [6, 6, 0, 49]),  //ROLL PIDs
            presets.elementHelper("PIDs", 1, [6, 9, 0, 52]),  //PITCH PIDs
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 0),
            presets.elementHelper("FILTER_CONFIG", "gyroSoftLpfHz", 40),
            presets.elementHelper("RC_tuning", "roll_rate", 280),
            presets.elementHelper("RC_tuning", "pitch_rate", 140),
            presets.elementHelper("RC_tuning", "dynamic_THR_PID", 20),
            presets.elementHelper("RC_tuning", "dynamic_THR_breakpoint", 1600)
        ],
        type: 'flyingwing'
    },
    {
        name: "Ritewing Mini Drak",
        description: "Amazig looking and flying airplane with 8x6 propeller, 2216 1400KV motor, powered with 4S LiPo. AUW above 1200g",
        features: [
            "Adjusted gyro filtering",
            "Adjusted PIDs",
            "Adjusted rates"
        ],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG", "MIXER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 8),
            presets.elementHelper("MIXER_CONFIG", "platformType", 1),
            presets.elementHelper("PIDs", 0, [7, 7, 0, 25]),  //ROLL PIDs
            presets.elementHelper("PIDs", 1, [5, 9, 0, 56]),  //PITCH PIDs
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 0),
            presets.elementHelper("FILTER_CONFIG", "gyroSoftLpfHz", 35),
            presets.elementHelper("RC_tuning", "roll_rate", 260),
            presets.elementHelper("RC_tuning", "pitch_rate", 140),
            presets.elementHelper("RC_tuning", "dynamic_THR_PID", 30),
            presets.elementHelper("RC_tuning", "dynamic_THR_breakpoint", 1550)
        ],
        type: 'flyingwing'
    },
    {
        name: "ZOHD Dart 250G",
        description: "Small and light flying wing that can be build below 250g and as such be fully legal in many countries",
        features: [
            "Adjusted gyro filtering",
            "Adjusted PIDs",
            "Adjusted rates"
        ],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG", "MIXER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 8),
            presets.elementHelper("MIXER_CONFIG", "platformType", 1),
            presets.elementHelper("PIDs", 0, [9, 12, 0, 15]),  //ROLL PIDs
            presets.elementHelper("PIDs", 1, [9, 15, 0, 14]),  //PITCH PIDs
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 0),
            presets.elementHelper("FILTER_CONFIG", "gyroSoftLpfHz", 35),
            presets.elementHelper("RC_tuning", "roll_rate", 360),
            presets.elementHelper("RC_tuning", "pitch_rate", 130),
            presets.elementHelper("RC_tuning", "dynamic_THR_PID", 30),
            presets.elementHelper("RC_tuning", "dynamic_THR_breakpoint", 1500)
        ],
        type: 'flyingwing'
    },
    {
        name: "Mini AR Wing",
        description: "Small, 600mm wingspan, FPV flying wing",
        features: [
            "Adjusted gyro filtering",
            "Adjusted PIDs",
            "Adjusted rates"
        ],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG", "MIXER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 8),
            presets.elementHelper("MIXER_CONFIG", "platformType", 1),
            presets.elementHelper("PIDs", 0, [8, 16, 0, 64]),  //ROLL PIDs
            presets.elementHelper("PIDs", 1, [5, 18, 0, 60]),  //PITCH PIDs
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 0),
            presets.elementHelper("FILTER_CONFIG", "gyroSoftLpfHz", 35),
            presets.elementHelper("RC_tuning", "roll_rate", 280),
            presets.elementHelper("RC_tuning", "pitch_rate", 120)
        ],
        type: 'flyingwing'
    }
];