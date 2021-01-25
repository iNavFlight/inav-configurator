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
    INAV_PID_CONFIG: {"asynchronousMode": "0", "accelerometerTaskFrequency": 500, "attitudeTaskFrequency": 250, "magHoldRateLimit": 90, "magHoldErrorLpfFrequency": 2, "yawJumpPreventionLimit": 200, "gyroscopeLpf": "3", "accSoftLpfHz": 15},
    RC_tuning: {"RC_RATE": 1, "RC_EXPO": 0.7, "roll_pitch_rate": 0, "roll_rate": 200, "pitch_rate": 200, "yaw_rate": 200, "dynamic_THR_PID": 0, "throttle_MID": 0.5, "throttle_EXPO": 0, "dynamic_THR_breakpoint": 1500, "RC_YAW_EXPO": 0.2},
    PID_ADVANCED: {"rollPitchItermIgnoreRate": 200, "yawItermIgnoreRate": 50, "yawPLimit": 300, "axisAccelerationLimitRollPitch": 0, "axisAccelerationLimitYaw": 1000},
    FILTER_CONFIG: {"gyroSoftLpfHz": 60, "dtermLpfHz": 40, "yawLpfHz": 30, "gyroNotchHz1": 0, "gyroNotchCutoff1": 0, "dtermNotchHz": 0, "dtermNotchCutoff": 0, "gyroNotchHz2": 0, "gyroNotchCutoff2": 0, "accNotchHz": 0, "accNotchCutoff": 0, "gyroStage2LowpassHz": 0}
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
 * @type {{name: string, description: string, features: string[], applyDefaults: string[], settingsMSP: *[], type: string}[]}
 */
presets.presets = [
    {
        name: 'Generic 3" Quadcopter',
        description: "Quad X, 3\" propellers. F4/F7 CPU.",
        features: ["DSHOT600", "4k mode", "Matrix Filter", "Improved mechanics", "Optimized filtering", "Optimized rates"],
        applyDefaults: ["INAV_PID_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG"],
        settingsMSP: [],
        settings: [
            {
                key: "platform_type",
                value: "MULTIROTOR"
            },
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
            }
        ],
        type: 'multirotor'
    },
    {
        name: 'Generic 5" Quadcopter',
        description: "Quad X, 5\" propellers. F4/F7 CPU.",
        features: ["DSHOT600", "2k mode", "Matrix Filter", "Improved mechanics", "Optimized filtering", "Optimized rates"],
        applyDefaults: ["INAV_PID_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG"],
        settingsMSP: [],
        settings: [
            {
                key: "platform_type",
                value: "MULTIROTOR"
            },
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
                value: 23
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
            }
        ],
        type: 'multirotor'
    },
    {
        name: 'Generic 7" Quadcopter',
        description: "Quad X, 7\" propellers. F4/F7 CPU.",
        features: ["DSHOT600", "2k mode", "Matrix Filter", "Improved mechanics", "Optimized filtering", "Optimized rates"],
        applyDefaults: ["INAV_PID_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG"],
        settingsMSP: [],
        settings: [
            {
                key: "platform_type",
                value: "MULTIROTOR"
            },
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
            }
        ],
        type: 'multirotor'
    },
    {
        name: 'Generic 10" Multirotor',
        description: "General purpose 450-600 class multirotor with 10\", 2-bladed propellers.",
        features: [
            "DSHOT600",
            "400dps rates",
            "Improved PID defaults",
            "Adjusted filtering"
        ],
        applyDefaults: ["INAV_PID_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG"],
        settingsMSP: [],
        settings: [
            {
                key: "platform_type",
                value: "MULTIROTOR"
            },
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
                key: "heading_hold_rate_limit",
                value: 30
            }
        ],
        type: 'multirotor'
    },
    {
        name: '3" Cinewhoop',
        description: "Based on the iFlight MegaBee Cinewhoop.",
        features: ["DSHOT600", "4k mode", "Matrix Filter", "Improved mechanics", "Optimized filtering", "Optimized rates"],
        applyDefaults: ["INAV_PID_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG"],
        settingsMSP: [],
        settings: [
            {
                key: "platform_type",
                value: "MULTIROTOR"
            },
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
            }
        ],
        type: 'multirotor'
    },
    {
        name: '5" Freestyle Quadcopter, 2208 2450kV motors',
        description: "Overpowered freestyle quad. 5\", 3 bladed propellers like HQProp S4, Nepal N1, 2208 2450KV motors, 4S, DSHOT600 ESC protocol.<br>Optimized for smooth, freestyle or acrobatic flight.",
        features: ["DSHOT600", "4k mode", "Matrix Filter", "Improved mechanics", "Optimized filtering", "Optimized rates"],
        applyDefaults: ["INAV_PID_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG"],
        settingsMSP: [],
        settings: [
            {
                key: "platform_type",
                value: "MULTIROTOR"
            },
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
                value: 0
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
                value: 170
            },
            {
                key: "dterm_lpf2_type",
                value: "PT1"
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
                value: 28
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
                value: 24
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
            }
        ],
        type: 'multirotor'
    },
    {
        name: '6" Freestyle Quadcopter, 2207 1700kV motors',
        description: "6\", 3 bladed propellers, 2207 1700kV motors, 4S, DSHOT600 ESC protocol.<br>Optimized for smooth, freestyle or acrobatic flight with GPS or not.",
        features: ["DSHOT600", "2k mode", "Matrix Filter", "Improved mechanics", "Optimized filtering", "Optimized rates"],
        applyDefaults: ["INAV_PID_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG"],
        settingsMSP: [],
        settings: [
            {
                key: "platform_type",
                value: "MULTIROTOR"
            },
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
            }
        ],
        type: 'multirotor'
    },
    {
        name: "Generic Airplane",
        description: "General setup for airplanes.",
        features: [
            "Adjusted gyro filtering",
            "Adjusted PIDs",
            "Adjusted rates"
        ],
        applyDefaults: ["INAV_PID_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("RC_tuning", "roll_rate", 200),
            presets.elementHelper("RC_tuning", "pitch_rate", 150),
            presets.elementHelper("RC_tuning", "yaw_rate", 90),
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 1)
        ],
        settings: [
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "gyro_lpf_hz",
                value: 25
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON"
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 250
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 30
            },
            {
                key: "gyro_lpf_type",
                value: "BIQUAD"
            },
            {
                key: "platform_type",
                value: "AIRPLANE"
            },
            {
                key: "rc_expo",
                value: 30
            },
            {
                key: "manual_rc_expo",
                value: 30
            },
            {
                key: "imu_acc_ignore_rate",
                value: 10
            }
        ],
        type: 'airplane'
    },
    {
        name: "Flying Wing Z84",
        description: "Small flying wing on multirotor racer parts. 3S/4S battery, AUW under 500g.",
        features: [
            "Adjusted gyro filtering",
            "Adjusted PIDs",
            "Adjusted rates"
        ],
        applyDefaults: ["INAV_PID_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("RC_tuning", "roll_rate", 350),
            presets.elementHelper("RC_tuning", "pitch_rate", 90),
            presets.elementHelper("RC_tuning", "dynamic_THR_PID", 33),
            presets.elementHelper("RC_tuning", "dynamic_THR_breakpoint", 1300),
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 4)
        ],
        settings: [
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "gyro_lpf_hz",
                value: 25
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON"
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 250
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 30
            },
            {
                key: "gyro_lpf_type",
                value: "BIQUAD"
            },
            {
                key: "platform_type",
                value: "AIRPLANE"
            },
            {
                key: "fw_p_pitch",
                value: 2
            },
            {
                key: "fw_i_pitch",
                value: 15
            },
            {
                key: "fw_ff_pitch",
                value: 70
            },
            {
                key: "fw_p_roll",
                value: 2
            },
            {
                key: "fw_i_roll",
                value: 15
            },
            {
                key: "fw_ff_roll",
                value: 30
            },
            {
                key: "rc_expo",
                value: 30
            },
            {
                key: "manual_rc_expo",
                value: 30
            },
            {
                key: "imu_acc_ignore_rate",
                value: 10
            }
        ],
        type: 'flyingwing'
    },
    {
        name: "Flying Wing S800 Sky Shadow",
        description: "Flying wing on multirotor racer parts. 3S/4S battery and FPV equipment. AUW under 1000g.",
        features: [
            "Adjusted gyro filtering",
            "Adjusted PIDs",
            "Adjusted rates"
        ],
        applyDefaults: ["INAV_PID_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 0),
            presets.elementHelper("FILTER_CONFIG", "gyroSoftLpfHz", 40),
            presets.elementHelper("RC_tuning", "roll_rate", 280),
            presets.elementHelper("RC_tuning", "pitch_rate", 140),
            presets.elementHelper("RC_tuning", "dynamic_THR_PID", 20),
            presets.elementHelper("RC_tuning", "dynamic_THR_breakpoint", 1600)
        ],
        settings: [
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "gyro_lpf_hz",
                value: 25
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON"
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 250
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 30
            },
            {
                key: "gyro_lpf_type",
                value: "BIQUAD"
            },
            {
                key: "platform_type",
                value: "AIRPLANE"
            },
            {
                key: "fw_p_pitch",
                value: 6
            },
            {
                key: "fw_i_pitch",
                value: 9
            },
            {
                key: "fw_ff_pitch",
                value: 52
            },
            {
                key: "fw_p_roll",
                value: 6
            },
            {
                key: "fw_i_roll",
                value: 6
            },
            {
                key: "fw_ff_roll",
                value: 49
            },
            {
                key: "rc_expo",
                value: 30
            },
            {
                key: "manual_rc_expo",
                value: 30
            },
            {
                key: "imu_acc_ignore_rate",
                value: 10
            }
        ],
        type: 'flyingwing'
    },
    {
        name: "Ritewing Mini Drak",
        description: "8x6 propeller, 2216 1400kV motor, 4S LiPo. AUW above 1200g.",
        features: [
            "Adjusted gyro filtering",
            "Adjusted PIDs",
            "Adjusted rates"
        ],
        applyDefaults: ["INAV_PID_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 0),
            presets.elementHelper("FILTER_CONFIG", "gyroSoftLpfHz", 35),
            presets.elementHelper("RC_tuning", "roll_rate", 260),
            presets.elementHelper("RC_tuning", "pitch_rate", 140),
            presets.elementHelper("RC_tuning", "dynamic_THR_PID", 30),
            presets.elementHelper("RC_tuning", "dynamic_THR_breakpoint", 1550)
        ],
        settings: [
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "gyro_lpf_hz",
                value: 25
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON"
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 250
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 30
            },
            {
                key: "gyro_lpf_type",
                value: "BIQUAD"
            },
            {
                key: "platform_type",
                value: "AIRPLANE"
            },
            {
                key: "fw_p_pitch",
                value: 5
            },
            {
                key: "fw_i_pitch",
                value: 14
            },
            {
                key: "fw_ff_pitch",
                value: 56
            },
            {
                key: "fw_p_roll",
                value: 7
            },
            {
                key: "fw_i_roll",
                value: 12
            },
            {
                key: "fw_ff_roll",
                value: 25
            },
            {
                key: "rc_expo",
                value: 30
            },
            {
                key: "manual_rc_expo",
                value: 30
            },
            {
                key: "imu_acc_ignore_rate",
                value: 10
            }
        ],
        type: 'flyingwing'
    },
    {
        name: "ZOHD Dart 250g",
        description: "3x5x3 propeller, 1406 2600kV motor, 3S LiPo. 570mm wingspan, AUW potentially under 250g on 2S.<br /><br /><strong>Please set the Stabilised Roll weight to 80, and the Stabilised Pitch weight to 65.</strong>",
        features: [
            "Adjusted gyro filtering",
            "Adjusted PIDs",
            "Adjusted rates"
        ],
        applyDefaults: ["INAV_PID_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 3),
            presets.elementHelper("FILTER_CONFIG", "gyroSoftLpfHz", 30),
            presets.elementHelper("RC_tuning", "roll_rate", 360),
            presets.elementHelper("RC_tuning", "pitch_rate", 130),
            presets.elementHelper("RC_tuning", "dynamic_THR_PID", 30),
            presets.elementHelper("RC_tuning", "dynamic_THR_breakpoint", 1500)
        ],
        settings: [
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "gyro_lpf_hz",
                value: 25
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON"
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 250
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 30
            },
            {
                key: "gyro_lpf_type",
                value: "BIQUAD"
            },
            {
                key: "platform_type",
                value: "AIRPLANE"
            },
            {
                key: "fw_p_pitch",
                value: 3
            },
            {
                key: "fw_i_pitch",
                value: 7
            },
            {
                key: "fw_ff_pitch",
                value: 40
            },
            {
                key: "fw_p_roll",
                value: 2
            },
            {
                key: "fw_i_roll",
                value: 4
            },
            {
                key: "fw_ff_roll",
                value: 18
            },
            {
                key: "rc_expo",
                value: 70
            },
            {
                key: "manual_rc_expo",
                value: 70
            },
            {
                key: "rc_yaw_expo",
                value: 20
            },
            {
                key: "imu_acc_ignore_rate",
                value: 10
            }
        ],
        type: 'flyingwing'
    },
    {
        name: "SonicModell Mini AR Wing",
        description: "5x4.5 propeller, 1805 2400kV motor, 3S LiPo. 600mm wingspan, AUW under 400g.",
        features: [
            "Adjusted gyro filtering",
            "Adjusted PIDs",
            "Adjusted rates"
        ],
        applyDefaults: ["INAV_PID_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG"],
        settingsMSP: [
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 0),
            presets.elementHelper("FILTER_CONFIG", "gyroSoftLpfHz", 35),
            presets.elementHelper("RC_tuning", "roll_rate", 280),
            presets.elementHelper("RC_tuning", "pitch_rate", 120)
        ],
        settings: [
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "gyro_lpf_hz",
                value: 25
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON"
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 250
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 30
            },
            {
                key: "gyro_lpf_type",
                value: "BIQUAD"
            },
            {
                key: "platform_type",
                value: "AIRPLANE"
            },
            {
                key: "fw_p_pitch",
                value: 5
            },
            {
                key: "fw_i_pitch",
                value: 18
            },
            {
                key: "fw_ff_pitch",
                value: 60
            },
            {
                key: "fw_p_roll",
                value: 8
            },
            {
                key: "fw_i_roll",
                value: 16
            },
            {
                key: "fw_ff_roll",
                value: 64
            },
            {
                key: "rc_expo",
                value: 30
            },
            {
                key: "manual_rc_expo",
                value: 30
            },
            {
                key: "imu_acc_ignore_rate",
                value: 10
            }
        ],
        type: 'flyingwing'
    }
];
