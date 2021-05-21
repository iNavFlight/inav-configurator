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
    window.preset_quad_generic_3_inch,
    window.preset_quad_generic_5_inch,
    window.preset_quad_generic_7_inch,
    window.preset_quad_cinewhoop_3_inch,
    window.preset_quad_freestyle_5_inch,
    window.preset_quad_freestyle_6_inch,
    window.preset_plane_tail,
    window.preset_plane_tailless
];
