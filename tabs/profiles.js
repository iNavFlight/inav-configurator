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
    PIDs: [
        [40, 30, 23],
        [40, 30, 23],
        [85, 45, 0],
        [50, 0, 0],
        [65, 120, 10],
        [180, 15, 100],
        [10, 5, 8],
        [20, 15, 75],
        [60, 0, 0],
        [100, 50, 10]
    ],
    INAV_PID_CONFIG: {"asynchronousMode": "0", "accelerometerTaskFrequency": 500, "attitudeTaskFrequency": 250, "magHoldRateLimit": 90, "magHoldErrorLpfFrequency": 2, "yawJumpPreventionLimit": 200, "gyroscopeLpf": "3", "accSoftLpfHz": 15},
    ADVANCED_CONFIG: {"gyroSyncDenominator": 2, "pidProcessDenom": 1, "useUnsyncedPwm": 1, "motorPwmProtocol": 0, "motorPwmRate": 400, "servoPwmRate": 50, "gyroSync": 0},
    RC_tuning: {"RC_RATE": 0, "RC_EXPO": 0, "roll_pitch_rate": 0, "roll_rate": 0, "pitch_rate": 0, "yaw_rate": 0, "dynamic_THR_PID": 0, "throttle_MID": 0, "throttle_EXPO": 0, "dynamic_THR_breakpoint": 0, "RC_YAW_EXPO": 0},
    PID_ADVANCED: {"rollPitchItermIgnoreRate": 200, "yawItermIgnoreRate": 50, "yawPLimit": 300, "axisAccelerationLimitRollPitch": 0, "axisAccelerationLimitYaw": 1000},
    FILTER_CONFIG: {"gyroSoftLpfHz": 60, "dtermLpfHz": 40, "yawLpfHz": 30, "gyroNotchHz1": 0, "gyroNotchCutoff1": 0, "dtermNotchHz": 0, "dtermNotchCutoff": 0, "gyroNotchHz2": 0, "gyroNotchCutoff2": 0},
    FC_CONFIG: {"loopTime": 2000}
};

/*
 * When defining a preset, following fields are required:
 *
 * BF_CONFIG::mixerConfiguration
 *
 */
presets.presets = [
    {
        name: '5" Racer',
        description: "210-250 class racer with F3/F4 CPU on 4S battery",
        features: [
            "4S battery",
            "2000KV - 2600KV motors",
            "5 inch propellers",
            "400g-650g weight",
            "F3 or F4 CPU",
            "MPU6000 or MPU6050 gyro",
            "No GPS capabilities"
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
            presets.elementHelper("FILTER_CONFIG", "gyroSoftLpfHz", 90),
            presets.elementHelper("FILTER_CONFIG", "dtermLpfHz", 80),
            presets.elementHelper("RC_tuning", "roll_rate", 800),
            presets.elementHelper("RC_tuning", "pitch_rate", 800),
            presets.elementHelper("RC_tuning", "yaw_rate", 650)
        ]
    },
    {
        name: "600mm Flying Wing",
        description: "Small flying wing on multirotor racer parts",
        features: [
            "3S-4S battery",
            "300g-500g weight"
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
        ]
    }
];

presets.model = (function () {

    var self = {};

    /**
     * @param {Array} toApply
     * @param {Object} defaults
     */
    self.applyDefaults = function (toApply, defaults) {

        for (var settingToApply in toApply) {
            if (toApply.hasOwnProperty(settingToApply)) {

                var settingName = toApply[settingToApply],
                    values = defaults[settingName];

                for (var key in values) {
                    if (values.hasOwnProperty(key)) {
                        window[settingName][key] = values[key];
                    }
                }

            }
        }
    };

    self.extractPresetNames = function(presets) {

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
        mspHelper.loadMspIdent,
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
        mspHelper.saveINAVPidConfig,
        mspHelper.saveLooptimeConfig,
        mspHelper.saveAdvancedConfig,
        mspHelper.saveFilterConfig,
        mspHelper.savePidData,
        mspHelper.saveRcTuningData,
        mspHelper.savePidAdvanced,
        mspHelper.saveBfConfig,
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

        presets.model.applyDefaults(currentPreset.applyDefaults, presets.defaultValues);

        var setting;

        //Iterate over settings saved in preset
        for (var i in currentPreset.settings) {
            if (currentPreset.settings.hasOwnProperty(i)) {
                setting = currentPreset.settings[i];
                //Apply setting
                window[setting.group][setting.field] = setting.value;
            }
        }

        saveChainer.execute();
    }

    function fillPresetDescription(preset) {

        var $features = $('#preset-features');

        $('#preset-name').html(preset.name);
        $('#preset-description').html(preset.description);

        $features.find('*').remove();

        for (var i in preset.features) {
            if (preset.features.hasOwnProperty(i)) {
                $features.append('<li class="preset__feature"><span class="preset__feature-text">' + preset.features[i] + "</span></li>");
            }
        }

    }

    function processHtml() {

        var $presetList = $('#presets-list');

        GUI.fillSelect($presetList, presets.model.extractPresetNames(presets.presets));

        $presetList.change(function () {
            currentPresetId = $presetList.val();
            currentPreset = presets.presets[currentPresetId];
            fillPresetDescription(currentPreset);
            $('#save-button').removeClass('disabled');
        });

        $('#execute-button').click(function () {
            applyAndSave();
            OSD.GUI.jbox.close();
        });

        localize();

        //noinspection JSValidateTypes
        $('#content').scrollTop((scrollPosition) ? scrollPosition : 0);

        OSD.GUI.jbox = new jBox('Modal', {
            width: 600,
            height: 240,
            closeButton: 'title',
            animation: false,
            attach: $('#save-button'),
            title: chrome.i18n.getMessage("presetApplyTitle"),
            content: $('#presetApplyContent')
        });

        GUI.interval_add('status_pull', function status_pull() {
            MSP.send_message(MSPCodes.MSP_STATUS);

            if (semver.gte(CONFIG.flightControllerVersion, "1.5.0")) {
                MSP.send_message(MSPCodes.MSP_SENSOR_STATUS);
            }
        }, 250, true);
        GUI.content_ready(callback);
    }
};

TABS.profiles.cleanup = function (callback) {
    if (callback) callback();
};
