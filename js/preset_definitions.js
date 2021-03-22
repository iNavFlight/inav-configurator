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
                key: "airmode_type",
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
                key: "airmode_type",
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
                key: "airmode_type",
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
                key: "airmode_type",
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
                key: "airmode_type",
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
                key: "airmode_type",
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
                key: "airmode_type",
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
		name: 'Airplane with a tail',
        description: "General setup for airplanes with tails.",
        features: ["Adjusted gyro filtering", "Adjusted PIDs", "Adjusted rates"],
        applyDefaults: ["INAV_PID_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG"],
        settingsMSP: [],
		type: 'airplane',
        settings: [
	{
                key: "platform_type",
                value: "AIRPLANE"
	},
	{
                key: "applied_defaults",
                value: 3
	},
	{
                key: "gyro_hardware_lpf",
                value: "256HZ"
	},
	{
                key: "gyro_lpf_hz",
                value: 25
	},
	{
                  key: "dterm_lpf_hz",
                  value: 40
        },
	{
                key: "gyro_lpf_type",
                value: "BIQUAD"
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
                key: "motor_pwm_protocol",
                value: "STANDARD"
	},
	{ 
                key: "throttle_idle",
                value: 5.0
	},
	{
                key: "rc_yaw_expo",
                value: 30
	},
	{
                key: "rc_expo",
                value: 30
	},
	{
                key: "roll_rate",
                value: 18
	},
	{
                key: "pitch_rate",
                value: 9
	},
	{
                key: "yaw_rate",
                value: 3
	},
	{ 
                key: "nav_fw_pos_z_p",
				value: 20
	},
	{ 
                key: "nav_fw_pos_z_d",
                value: 5
	},
	{ 
                key: "nav_fw_pos_xy_p",
                value: 50
	},
	{ 
                key: "fw_turn_assist_pitch_gain",
                value: 0.5
	},
	{ 
                key: "max_angle_inclination_rll",
                value: 350
	},
	{ 
                key: "nav_fw_bank_angle",
                value: 35
	},
	{ 
                key: "fw_p_pitch",
                value: 15
	},
	{ 
                key: "fw_i_pitch",
                value: 10
	},
	{ 
                key: "fw_ff_pitch",
                value: 60
	},
	{ 
                key: "fw_p_roll",
                value: 10
	},
	{ 
                key: "fw_i_roll",
                value: 8
	},
	{ 
                key: "fw_ff_roll",
                value: 40
	},
	{ 
                key: "fw_p_yaw",
                value: 20
	},
	{ 
                key: "fw_i_yaw",
                value: 5
	},
	{ 
                key: "fw_ff_yaw",
                value: 100
	},
	{
                key: "imu_acc_ignore_rate",
                value: 10
	},
	{
                key: "airmode_type",
                value: "STICK_CENTER_ONCE"
	},
	{
                key: "small_angle",
                value: 180
	},
	{
                key: "nav_fw_control_smoothness",
                value: 2
	},
	{
                key: "nav_rth_allow_landing",
                value: "FS_ONLY"
	},
	{
                key: "nav_rth_altitude",
                value: 5000
	},
	{
                key: "failsafe_mission",
		value: "ON"
	},
	{
                key: "nav_wp_radius",
                value: 1500
	},
		],
    },
    {
        name: "Airplane without tail",
        description: "General setup for airplanes without tails: Flying Wing, Delta, etc.",
		features: ["Adjusted gyro filtering", "Adjusted PIDs", "Adjusted rates"],
        applyDefaults: ["INAV_PID_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG"],
        settingsMSP: [],
		type: 'flyingwing',
        settings: [
	{
                key: "platform_type",
                value: "AIRPLANE"
	},
	{
                key: "applied_defaults",
                value: 3
	},
	{
                key: "gyro_hardware_lpf",
                value: "256HZ"
	},
	{
                 key: "gyro_lpf_hz",
                 value: 25
	},
	{
                  key: "dterm_lpf_hz",
                  value: 40
        },
	{
                key: "gyro_lpf_type",
                value: "BIQUAD"
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
                key: "motor_pwm_protocol",
                value: "STANDARD"
	},
	{ 
                key: "throttle_idle",
                value: 5.0
	},
	{
                key: "rc_yaw_expo",
                value: 30
	},
	{
                key: "rc_expo",
                value: 30
	},
	{
                key: "roll_rate",
                value: 18
	},
	{
                key: "pitch_rate",
                value: 9
	},
	{
                key: "yaw_rate",
                value: 3
	},
	{ 
                key: "nav_fw_pos_z_p",
                value: 20
	},
	{ 
                key: "nav_fw_pos_z_d",
                value: 5
	},
	{ 
                key: "nav_fw_pos_xy_p",
                value: 50
	},
	{ 
                key: "fw_turn_assist_pitch_gain",
                value: 0.2
	},
	{ 
                key: "max_angle_inclination_rll",
                value: 450
	},
	{ 
                key: "nav_fw_bank_angle",
                value: 45
	},
	{ 
                key: "fw_p_pitch",
                value: 10
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
                value: 5
	},
	{ 
                key: "fw_i_roll",
                value: 8
	},
	{ 
                key: "fw_ff_roll",
                value: 35
	},
	{ 
                key: "fw_p_yaw",
                value: 20
	},
	{ 
                key: "fw_i_yaw",
                value: 5
	},
	{ 
                key: "fw_ff_yaw",
                value: 100
	},
	{
                key: "imu_acc_ignore_rate",
                value: 10
	},
	{
                key: "airmode_type",
                value: "STICK_CENTER_ONCE"
	},
	{
                key: "small_angle",
                value: 180
	},
	{
                key: "nav_fw_control_smoothness",
                value: 2
	},
	{
                key: "nav_rth_allow_landing",
                value: "FS_ONLY"
	},
	{
                key: "nav_rth_altitude",
                value: 5000
	},
	{
                key: "failsafe_mission",
                value: "ON"
	},
	{
                key: "nav_wp_radius",
                value: 1500
	},
	],
    },
];
