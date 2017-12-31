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
            [40, 30, 23],
            [40, 30, 23],
            [85, 45, 0],
            [50, 0, 0],
            [65, 120, 10],
            [180, 15, 100],
            [0, 0, 0],
            [20, 15, 75],
            [60, 0, 0],
            [100, 50, 10]
        ],
        fw: [
            [25, 35, 10],
            [20, 35, 10],
            [50, 45, 0],
            [50, 0, 0],
            [75, 5, 8],
            [0, 0, 0],
            [0, 0, 0],
            [20, 15, 75],
            [60, 0, 0],
            [0, 0, 0]
        ]},
    INAV_PID_CONFIG: {"asynchronousMode": "0", "accelerometerTaskFrequency": 500, "attitudeTaskFrequency": 250, "magHoldRateLimit": 90, "magHoldErrorLpfFrequency": 2, "yawJumpPreventionLimit": 200, "gyroscopeLpf": "3", "accSoftLpfHz": 15},
    ADVANCED_CONFIG: {"gyroSyncDenominator": 2, "pidProcessDenom": 1, "useUnsyncedPwm": 1, "motorPwmProtocol": 0, "motorPwmRate": 400, "servoPwmRate": 50, "gyroSync": 0},
    RC_tuning: {"RC_RATE": 1, "RC_EXPO": 0.7, "roll_pitch_rate": 0, "roll_rate": 200, "pitch_rate": 200, "yaw_rate": 200, "dynamic_THR_PID": 0, "throttle_MID": 0.5, "throttle_EXPO": 0, "dynamic_THR_breakpoint": 1500, "RC_YAW_EXPO": 0.2},
    PID_ADVANCED: {"rollPitchItermIgnoreRate": 200, "yawItermIgnoreRate": 50, "yawPLimit": 300, "axisAccelerationLimitRollPitch": 0, "axisAccelerationLimitYaw": 1000},
    FILTER_CONFIG: {"gyroSoftLpfHz": 60, "dtermLpfHz": 40, "yawLpfHz": 30, "gyroNotchHz1": 0, "gyroNotchCutoff1": 0, "dtermNotchHz": 0, "dtermNotchCutoff": 0, "gyroNotchHz2": 0, "gyroNotchCutoff2": 0},
    FC_CONFIG: {"loopTime": 2000}
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

/*
 * When defining a preset, following fields are required:
 *
 * BF_CONFIG::mixerConfiguration
 *
 */


/**
 * When defining a preset, following fields are required:
 *
 * BF_CONFIG::mixerConfiguration
 *
 * @type {{name: string, description: string, features: string[], applyDefaults: string[], settings: *[], type: string}[]}
 */
presets.presets = [
    {
        name: 'Default Preset',
        description: "INAV Quad X configuration",
        features: ["Default INAV Settings"],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG"],
        settings: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 3)
        ],
        type: 'multirotor'
    },
    {
        name: '5" Racer',
        description: "210-250 class racer with F3/F4 CPU on 4S battery<br>" +
            "<span>400g-650g weight, 2000KV - 2600KV motors, 5 inch propellers, MPU6000 or MPU6050 gyro, acro flight optimized</span>",
        features: [
            "Asynchronous processing",
            "OneShot125 at 2kHz",
            "800dps rates",
            "Dterm and gyro notch filter",
            "Increased LPF cutoff frequencies",
            "Improved PID defaults"
        ],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG"],
        settings: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 3),
            presets.elementHelper("INAV_PID_CONFIG", "asynchronousMode", 2),
            presets.elementHelper("FC_CONFIG", "loopTime", 1000),
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 0),
            presets.elementHelper("INAV_PID_CONFIG", "attitudeTaskFrequency", 100),
            presets.elementHelper("ADVANCED_CONFIG", "gyroSync", 1),
            presets.elementHelper("ADVANCED_CONFIG", "gyroSyncDenominator", 4),
            presets.elementHelper("ADVANCED_CONFIG", "motorPwmProtocol", 1),
            presets.elementHelper("ADVANCED_CONFIG", "motorPwmRate", 2000),
            presets.elementHelper("FILTER_CONFIG", "gyroSoftLpfHz", 90),
            presets.elementHelper("FILTER_CONFIG", "dtermLpfHz", 80),
            presets.elementHelper("RC_tuning", "roll_rate", 800),
            presets.elementHelper("RC_tuning", "pitch_rate", 800),
            presets.elementHelper("RC_tuning", "yaw_rate", 650),
            presets.elementHelper("FILTER_CONFIG", "dtermNotchHz", 260),
            presets.elementHelper("FILTER_CONFIG", "dtermNotchCutoff", 160),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchHz1", 400),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchCutoff1", 300),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchHz2", 200),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchCutoff2", 100),
            presets.elementHelper("PIDs", 0, [43, 40, 20]),  //ROLL PIDs
            presets.elementHelper("PIDs", 1, [58, 50, 22]),  //PITCH PIDs
            presets.elementHelper("PIDs", 2, [70, 45, 0])  //YAW PIDs
        ],
        type: 'multirotor'
    },
    {
        name: '5" GPS',
        description: "210-250 class quadcopter with F1/F3/F4 CPU on 3S or 4S battery<br>" +
            "<span>500g-700g weight, 2000KV - 2600KV motors, 5 inch propellers, MPU6000 or MPU6050 gyro, GPS optimized</span>",
        features: [
            "OneShot125 at 1kHz",
            "500dps rates",
            "Dterm and gyro notch filter",
            "Increased LPF cutoff frequencies",
            "Improved PID defaults"
        ],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG"],
        settings: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 3),
            presets.elementHelper("INAV_PID_CONFIG", "asynchronousMode", 0),
            presets.elementHelper("FC_CONFIG", "loopTime", 2000),
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 1),
            presets.elementHelper("ADVANCED_CONFIG", "gyroSyncDenominator", 2),
            presets.elementHelper("ADVANCED_CONFIG", "gyroSync", 1),
            presets.elementHelper("ADVANCED_CONFIG", "motorPwmProtocol", 1),
            presets.elementHelper("ADVANCED_CONFIG", "motorPwmRate", 1000),
            presets.elementHelper("FILTER_CONFIG", "gyroSoftLpfHz", 90),
            presets.elementHelper("FILTER_CONFIG", "dtermLpfHz", 80),
            presets.elementHelper("RC_tuning", "roll_rate", 500),
            presets.elementHelper("RC_tuning", "pitch_rate", 500),
            presets.elementHelper("RC_tuning", "yaw_rate", 450),
            presets.elementHelper("FILTER_CONFIG", "dtermNotchHz", 200),
            presets.elementHelper("FILTER_CONFIG", "dtermNotchCutoff", 100),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchHz1", 200),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchCutoff1", 100),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchHz2", 0),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchCutoff2", 1),
            presets.elementHelper("PIDs", 0, [43, 40, 20]),  //ROLL PIDs
            presets.elementHelper("PIDs", 1, [58, 50, 22]),  //PITCH PIDs
            presets.elementHelper("PIDs", 2, [70, 45, 0])  //YAW PIDs
        ],
        type: 'multirotor'
    },
    {
        name: '10" General Purpose',
        description: "450-600 class general purpose multirotor <br><span>1.0kg - 1.4kg weight, 10 inch propellers, <br>F1, F3 or F4 CPU, MPU6000 or MPU6050 gyro, GPS optional.</span>",
        features: [
            "Asynchronous gyro processing",
            "400dps rates",
            "Dterm and gyro notch filter",
            "Increased LPF cutoff frequencies",
            "Improved PID defaults"
        ],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG"],
        settings: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 3),
            presets.elementHelper("INAV_PID_CONFIG", "asynchronousMode", 1),
            presets.elementHelper("FC_CONFIG", "loopTime", 2000),
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 1),
            presets.elementHelper("ADVANCED_CONFIG", "gyroSync", 1),
            presets.elementHelper("ADVANCED_CONFIG", "gyroSyncDenominator", 1),
            presets.elementHelper("FILTER_CONFIG", "gyroSoftLpfHz", 70),
            presets.elementHelper("FILTER_CONFIG", "dtermLpfHz", 40),
            presets.elementHelper("RC_tuning", "roll_rate", 400),
            presets.elementHelper("RC_tuning", "pitch_rate", 400),
            presets.elementHelper("RC_tuning", "yaw_rate", 200),
            presets.elementHelper("FILTER_CONFIG", "dtermNotchHz", 125),
            presets.elementHelper("FILTER_CONFIG", "dtermNotchCutoff", 90),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchHz1", 170),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchCutoff1", 125),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchHz2", 85),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchCutoff2", 43),
            presets.elementHelper("INAV_PID_CONFIG", "magHoldRateLimit", 30),
            presets.elementHelper("PID_ADVANCED", "axisAccelerationLimitRollPitch", 240),
            presets.elementHelper("PID_ADVANCED", "axisAccelerationLimitYaw", 36),
            presets.elementHelper("PIDs", 0, [80, 30, 18]),  //ROLL PIDs
            presets.elementHelper("PIDs", 1, [80, 30, 18]),  //PITCH PIDs
            presets.elementHelper("PIDs", 2, [95, 45, 0])  //YAW PIDs
        ],
        type: 'multirotor'
    },
    {
        name: '12" General Purpose',
        description: "550 and above general purpose multirotor<br>" +
            "<span>12 inch propellers, 1.4kg-2kg weight, F3 or F4 CPU, MPU6000 or MPU6050 gyro, GPS optional</span>",
        features: [
            "Asynchronous gyro processing",
            "180dps rates",
            "Limited rate acceleration",
            "Dterm and gyro notch filter",
            "Increased LPF cutoff frequencies",
            "Improved PID defaults"
        ],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG"],
        settings: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 3),
            presets.elementHelper("INAV_PID_CONFIG", "asynchronousMode", 1),
            presets.elementHelper("FC_CONFIG", "loopTime", 2000),
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 1),
            presets.elementHelper("ADVANCED_CONFIG", "gyroSync", 1),
            presets.elementHelper("ADVANCED_CONFIG", "gyroSyncDenominator", 1),
            presets.elementHelper("FILTER_CONFIG", "gyroSoftLpfHz", 55),
            presets.elementHelper("FILTER_CONFIG", "dtermLpfHz", 30),
            presets.elementHelper("RC_tuning", "roll_rate", 180),
            presets.elementHelper("RC_tuning", "pitch_rate", 180),
            presets.elementHelper("RC_tuning", "yaw_rate", 90),
            presets.elementHelper("FILTER_CONFIG", "dtermNotchHz", 108),
            presets.elementHelper("FILTER_CONFIG", "dtermNotchCutoff", 72),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchHz1", 144),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchCutoff1", 90),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchHz2", 72),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchCutoff2", 50),
            presets.elementHelper("INAV_PID_CONFIG", "magHoldRateLimit", 30),
            presets.elementHelper("PID_ADVANCED", "axisAccelerationLimitRollPitch", 120),
            presets.elementHelper("PID_ADVANCED", "axisAccelerationLimitYaw", 18),
            presets.elementHelper("PIDs", 0, [100, 30, 25]),  //ROLL PIDs
            presets.elementHelper("PIDs", 1, [100, 30, 25]),  //PITCH PIDs
            presets.elementHelper("PIDs", 2, [120, 45, 0]),  //YAW PIDs
            presets.elementHelper("PIDs", 7, [10, 7, 75])  //Level PIDs
        ],
        type: 'multirotor'
    },
    {
        name: '280mm Tricopter',
        description: "280mm class tricopter with F3/F4 CPU",
        features: [
            "Asynchronous processing",
            "Dterm and gyro notch filter",
            "Increased LPF cutoff frequencies",
            "Improved PID defaults"
        ],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG"],
        settings: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 1),
            presets.elementHelper("INAV_PID_CONFIG", "asynchronousMode", 1),
            presets.elementHelper("FC_CONFIG", "loopTime", 1000),
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 0),
            presets.elementHelper("ADVANCED_CONFIG", "gyroSync", 1),
            presets.elementHelper("ADVANCED_CONFIG", "gyroSyncDenominator", 8),
            presets.elementHelper("ADVANCED_CONFIG", "motorPwmProtocol", 0),
            presets.elementHelper("ADVANCED_CONFIG", "motorPwmRate", 490),
            presets.elementHelper("ADVANCED_CONFIG", "servoPwmRate", 50),
            presets.elementHelper("FILTER_CONFIG", "gyroSoftLpfHz", 90),
            presets.elementHelper("FILTER_CONFIG", "dtermLpfHz", 80),
            presets.elementHelper("RC_tuning", "roll_rate", 700),
            presets.elementHelper("RC_tuning", "pitch_rate", 550),
            presets.elementHelper("RC_tuning", "yaw_rate", 250),
            presets.elementHelper("RC_tuning", "dynamic_THR_PID", 20),
            presets.elementHelper("RC_tuning", "dynamic_THR_breakpoint", 1650),
            presets.elementHelper("FILTER_CONFIG", "dtermNotchHz", 260),
            presets.elementHelper("FILTER_CONFIG", "dtermNotchCutoff", 160),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchHz1", 400),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchCutoff1", 300),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchHz2", 200),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchCutoff2", 100),
            presets.elementHelper("PIDs", 0, [55, 40, 15]),  //ROLL PIDs
            presets.elementHelper("PIDs", 1, [55, 40, 15]),  //PITCH PIDs
            presets.elementHelper("PIDs", 2, [90, 20, 0])  //YAW PIDs
        ],
        type: 'multirotor'
    },
    {
        name: '600mm Tricopter',
        description: "600mm class tricopter with F3/F4 CPU<br>",
        features: [
            "Asynchronous processing",
            "Dterm and gyro notch filter",
            "GPS ready",
            "Improved PID defaults"
        ],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG"],
        settings: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 1),
            presets.elementHelper("FC_CONFIG", "loopTime", 1000),
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 0),
            presets.elementHelper("ADVANCED_CONFIG", "gyroSync", 1),
            presets.elementHelper("ADVANCED_CONFIG", "gyroSyncDenominator", 8),
            presets.elementHelper("ADVANCED_CONFIG", "motorPwmProtocol", 1),
            presets.elementHelper("ADVANCED_CONFIG", "motorPwmRate", 2000),
            presets.elementHelper("ADVANCED_CONFIG", "servoPwmRate", 50),
            presets.elementHelper("FILTER_CONFIG", "gyroSoftLpfHz", 70),
            presets.elementHelper("RC_tuning", "roll_rate", 550),
            presets.elementHelper("RC_tuning", "pitch_rate", 480),
            presets.elementHelper("RC_tuning", "dynamic_THR_PID", 20),
            presets.elementHelper("RC_tuning", "dynamic_THR_breakpoint", 1650),
            presets.elementHelper("FILTER_CONFIG", "dtermNotchHz", 125),
            presets.elementHelper("FILTER_CONFIG", "dtermNotchCutoff", 90),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchHz1", 170),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchCutoff1", 125),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchHz2", 85),
            presets.elementHelper("FILTER_CONFIG", "gyroNotchCutoff2", 43),
            presets.elementHelper("PIDs", 0, [110, 20, 52]),  //ROLL PIDs
            presets.elementHelper("PIDs", 1, [110, 20, 52]),  //PITCH PIDs
            presets.elementHelper("PIDs", 2, [75, 20, 0])  //YAW PIDs
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
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG"],
        settings: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 14),
            presets.elementHelper("PIDs", 0, [20, 30, 15]),  //ROLL PIDs
            presets.elementHelper("PIDs", 1, [20, 30, 15]),  //PITCH PIDs
            presets.elementHelper("PIDs", 2, [45, 5, 15]),  //YAW PIDs
            presets.elementHelper("RC_tuning", "roll_rate", 200),
            presets.elementHelper("RC_tuning", "pitch_rate", 150),
            presets.elementHelper("RC_tuning", "yaw_rate", 90),
            presets.elementHelper("ADVANCED_CONFIG", "gyroSync", 1),
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 1)
        ],
        type: 'airplane'
    },
    {
        name: "600mm Flying Wing",
        description: "Small flying wing on multirotor racer parts<br>" +
            "<span>300g-500g weight, 3S-4S battery</span>",
        features: [
            "Adjusted gyro filtering",
            "Adjusted PIDs",
            "Adjusted rates"
        ],
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG"],
        settings: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 8),
            presets.elementHelper("PIDs", 0, [15, 30, 15]),  //ROLL PIDs
            presets.elementHelper("PIDs", 1, [15, 40, 15]),  //PITCH PIDs
            presets.elementHelper("RC_tuning", "roll_rate", 400),
            presets.elementHelper("RC_tuning", "pitch_rate", 150),
            presets.elementHelper("ADVANCED_CONFIG", "gyroSync", 1),
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 1)
        ],
        type: 'flyingwing'
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
        applyDefaults: ["PIDs", "INAV_PID_CONFIG", "ADVANCED_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG", "FC_CONFIG"],
        settings: [
            presets.elementHelper("BF_CONFIG", "mixerConfiguration", 8),
            presets.elementHelper("PIDs", 0, [2, 15, 30]),  //ROLL PIDs
            presets.elementHelper("PIDs", 1, [2, 15, 70]),  //PITCH PIDs
            presets.elementHelper("PIDs", 7, [10, 15, 75]),  //LEVEL PIDs
            presets.elementHelper("RC_tuning", "roll_rate", 350),
            presets.elementHelper("RC_tuning", "pitch_rate", 90),
            presets.elementHelper("RC_tuning", "dynamic_THR_PID", 33),
            presets.elementHelper("RC_tuning", "dynamic_THR_breakpoint", 1300),
            presets.elementHelper("ADVANCED_CONFIG", "gyroSync", 1),
            presets.elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 4)
        ],
        type: 'flyingwing'
    }
];

presets.model = (function () {

    var self = {};

    /**
     * @param {Array} toApply
     * @param {Object} defaults
     * @param {String} mixerType
     */
    self.applyDefaults = function (toApply, defaults, mixerType) {

        for (var settingToApply in toApply) {
            if (toApply.hasOwnProperty(settingToApply)) {

                var settingName = toApply[settingToApply],
                    values;

                if (settingName == 'PIDs') {
                    if (mixerType == 'multirotor') {
                        values = defaults[settingName]['mr'];
                    } else {
                        values = defaults[settingName]['fw'];
                    }
                } else {
                    values = defaults[settingName];
                }

                for (var key in values) {
                    if (values.hasOwnProperty(key)) {
                        window[settingName][key] = values[key];
                    }
                }

            }
        }
        if (mixerType == 'airplane' || mixerType == 'flyingwing') {
            // Always set MOTOR_STOP and feature AIRMODE for fixed wing
            window.BF_CONFIG.features |= 1 << 4; // MOTOR_STOP
            if (semver.gt(CONFIG.flightControllerVersion, '1.7.2')) {
                // Note that feature_AIRMODE is only supported on
                // INAV > 1.7.2.
                window.BF_CONFIG.features |= 1 << 22; // AIRMODE
            }
        }
    };

    self.extractPresetNames = function (presets) {

        var retVal = {};

        for (var i in presets) {
            if (presets.hasOwnProperty(i)) {
                retVal[i] = presets[i].name;
            }
        }

        return retVal;
    };

    return self;
})();

TABS.profiles = {};

TABS.profiles.initialize = function (callback, scrollPosition) {

    var currentPreset,
        currentPresetId,
        loadChainer = new MSPChainerClass(),
        saveChainer = new MSPChainerClass();

    if (GUI.active_tab != 'profiles') {
        GUI.active_tab = 'profiles';
        googleAnalytics.sendAppView('Presets');
    }

    loadChainer.setChain([
        mspHelper.loadBfConfig,
        mspHelper.loadLoopTime,
        mspHelper.loadINAVPidConfig,
        mspHelper.loadAdvancedConfig,
        mspHelper.loadFilterConfig,
        mspHelper.loadPidAdvanced,
        mspHelper.loadRcTuningData,
        mspHelper.loadPidData
    ]);
    loadChainer.setExitPoint(loadHtml);
    loadChainer.execute();

    saveChainer.setChain([
        mspHelper.saveBfConfig,
        mspHelper.saveINAVPidConfig,
        mspHelper.saveLooptimeConfig,
        mspHelper.saveAdvancedConfig,
        mspHelper.saveFilterConfig,
        mspHelper.savePidData,
        mspHelper.saveRcTuningData,
        mspHelper.savePidAdvanced,
        mspHelper.saveToEeprom
    ]);
    saveChainer.setExitPoint(reboot);

    function loadHtml() {
        $('#content').load("./tabs/profiles.html", processHtml);
    }

    function reboot() {
        //noinspection JSUnresolvedVariable
        GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));
        GUI.tab_switch_cleanup(function () {
            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, reinitialize);
        });
    }

    function reinitialize() {
        //noinspection JSUnresolvedVariable
        GUI.log(chrome.i18n.getMessage('deviceRebooting'));
        GUI.handleReconnect($('.tab_setup a'));
    }

    function applyAndSave() {

        presets.model.applyDefaults(currentPreset.applyDefaults, presets.defaultValues, currentPreset.type);

        var setting;

        //Iterate over settings saved in preset
        for (var i in currentPreset.settings) {
            if (currentPreset.settings.hasOwnProperty(i)) {
                setting = currentPreset.settings[i];
                //Apply setting
                window[setting.group][setting.field] = setting.value;
            }
        }
        var promises = {};
        if (semver.gt(CONFIG.flightControllerVersion, '1.7.3')) {
            var settings = presets.settings.get(currentPreset.type);
            Object.keys(settings).forEach(function(key, ii) {
                var value = settings[key];
                promises[key] = mspHelper.encodeSetting(key, value).then(function(data) {
                    return MSP.promise(MSPCodes.MSPV2_SET_SETTING, data);
                });
            });
        }
        Promise.props(promises).then(function () {
            saveChainer.execute();
        });
    }

    function fillPresetDescription(preset) {

        var $features = $('#preset-features');

        $('#preset-image').html('<div class="' + preset.type + '"></div>');
        $('#preset-name').html(preset.name);
        $('#preset-description').html(preset.description);
        document.getElementById('preset-info').style.display = "none";
        document.getElementById('details-head').style.display = "block";


        $features.find('*').remove();

        for (var i in preset.features) {
            if (preset.features.hasOwnProperty(i)) {
                $features.append('<li class="preset__feature"><span class="preset__feature-text">' + preset.features[i] + "</span></li>");

            }
        }

    }

    function processHtml() {

        var $presetList = $('#presets-list');

        var presetsList = presets.model.extractPresetNames(presets.presets);

        for (var preset in presetsList) {
            if (presetsList.hasOwnProperty(preset)) {
                $presetList.append('<li class="preset__element-wrapper"><a href="#" class="preset__element-link" data-val="' + preset + '">' + presetsList[preset] + '</a></li>');
            }
        }

        $('.preset__element-link').click(function () {
            currentPresetId = $(this).data('val');
            currentPreset = presets.presets[currentPresetId];
            fillPresetDescription(currentPreset);

            $presetList.find('li').removeClass('active');
            $(this).parent().addClass('active');

            $('#save-button').removeClass('disabled');

            googleAnalytics.sendEvent('Presets', 'Displayed', currentPreset.name);
        });

        $('#execute-button').click(function () {
            applyAndSave();
            OSD.GUI.jbox.close();

            googleAnalytics.sendEvent('Presets', 'Applied', currentPreset.name);
        });

        localize();

        //noinspection JSValidateTypes
        $('#content').scrollTop((scrollPosition) ? scrollPosition : 0);

        var modal = new jBox('Modal', {
            width: 600,
            height: 240,
            closeButton: 'title',
            animation: false,
            attach: $('#save-button'),
            title: chrome.i18n.getMessage("presetApplyTitle"),
            content: $('#presetApplyContent')
        });

        GUI.content_ready(callback);
    }
};

TABS.profiles.cleanup = function (callback) {
    if (callback) callback();
};
