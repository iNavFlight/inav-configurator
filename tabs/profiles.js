'use strict';

function elementHelper(group, field, value) {
    return {
        group: group,
        field: field,
        value: value
    }
}

var availablePresets = [
    {
        name: '5" Racer',
        description: "210-250 class racer with F3/F4 CPU on 4S battery",
        features: [
            "4S battery",
            "2000KV - 2600KV motors",
            "5 inch propellers",
            "400g-650g weight",
            "F3 or F4 CPU",
            "MPU6000 gyro",
            "No GPS capabilities"
        ],
        settings: [
            elementHelper("INAV_PID_CONFIG", "asynchronousMode", 2),
            elementHelper("FC_CONFIG", "loopTime", 1000),
            elementHelper("INAV_PID_CONFIG", "gyroscopeLpf", 0),
            elementHelper("ADVANCED_CONFIG", "gyroSync", 1),
            elementHelper("ADVANCED_CONFIG", "gyroSyncDenominator", 4),
            elementHelper("FILTER_CONFIG", "gyroSoftLpfHz", 90),
            elementHelper("FILTER_CONFIG", "dtermLpfHz", 80),
            elementHelper("RC_tuning", "roll_rate", 800),
            elementHelper("RC_tuning", "pitch_rate", 800),
            elementHelper("RC_tuning", "yaw_rate", 650)
        ]
    },
    {
        name: "600mm Flying Wing",
        description: "Small flying wing on multirotor racer parts",
        features: [
            "3S-4S battery",
            "300g-500g weight"
        ],
        settings: [
            elementHelper("PIDs", 0, [15, 30, 15]),  //ROLL PIDs
            elementHelper("PIDs", 1, [15, 40, 15]),  //PITCH PIDs
            elementHelper("RC_tuning", "roll_rate", 400),
            elementHelper("RC_tuning", "pitch_rate", 150)
        ]
    }
];

TABS.profiles = {};

TABS.profiles.initialize = function (callback, scrollPosition) {

    var currentPreset,
        currentPresetId;

    if (GUI.active_tab != 'profiles') {
        GUI.active_tab = 'profiles';
        googleAnalytics.sendAppView('Presets');
    }

    MSP.send_message(MSPCodes.MSP_IDENT, false, false, loadINAVPidConfig);

    //FIXME duplicate
    function loadINAVPidConfig() {
        var next_callback = loadLoopTime;
        if (semver.gt(CONFIG.flightControllerVersion, "1.3.0")) {
            MSP.send_message(MSPCodes.MSP_INAV_PID, false, false, next_callback);
        } else {
            next_callback();
        }
    }

    function loadLoopTime() {
        MSP.send_message(MSPCodes.MSP_LOOP_TIME, false, false, loadAdvancedConfig);
    }

    function loadAdvancedConfig() {
        var next_callback = loadFilterConfig;
        if (semver.gte(CONFIG.flightControllerVersion, "1.3.0")) {
            MSP.send_message(MSPCodes.MSP_ADVANCED_CONFIG, false, false, next_callback);
        } else {
            next_callback();
        }
    }

    function loadFilterConfig() {
        var next_callback = loadRcTuningData;
        if (semver.gte(CONFIG.flightControllerVersion, "1.4.0")) {
            MSP.send_message(MSPCodes.MSP_FILTER_CONFIG, false, false, next_callback);
        } else {
            next_callback();
        }
    }

    function loadRcTuningData() {
        MSP.send_message(MSPCodes.MSP_RC_TUNING, false, false, loadPidData);
    }

    function loadPidData() {
        MSP.send_message(MSPCodes.MSP_PID, false, false, loadHtml);
    }

    function loadHtml() {
        $('#content').load("./tabs/profiles.html", processHtml);
    }

    function extractPresetNames(presets) {

        var retVal = {};

        for (var i in presets) {
            if (presets.hasOwnProperty(i)) {
                retVal[i] = presets[i].name;
            }
        }

        return retVal;
    }

    function fillPresetDescription(preset) {
        console.log(preset);

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

        GUI.fillSelect($presetList, extractPresetNames(availablePresets));

        $presetList.change(function () {
            currentPresetId = $presetList.val();
            currentPreset = availablePresets[currentPresetId];
            fillPresetDescription(currentPreset);
        });

        localize();

        $('#content').scrollTop((scrollPosition) ? scrollPosition : 0);

        $('#save-button').click(function () {

            var setting;

            //Iterate over settings saved in preset
            for(var i in currentPreset.settings) {
                if (currentPreset.settings.hasOwnProperty(i)) {
                    setting = currentPreset.settings[i];
                    //Apply setting
                    window[setting.group][setting.field] = setting.value;
                }
            }

            saveINAVPidConfig();
        });

        //FIXME duplicate from configuration.js
        function saveINAVPidConfig() {
            var next_callback = saveLooptimeConfig;
            if(semver.gt(CONFIG.flightControllerVersion, "1.3.0")) {
                MSP.send_message(MSPCodes.MSP_SET_INAV_PID, mspHelper.crunch(MSPCodes.MSP_SET_INAV_PID), false, next_callback);
            } else {
                next_callback();
            }
        }

        //FIXME duplicate from configuration.js
        function saveLooptimeConfig() {
            MSP.send_message(MSPCodes.MSP_SET_LOOP_TIME, mspHelper.crunch(MSPCodes.MSP_SET_LOOP_TIME), false, saveAdvancedConfig);
        }

        //FIXME Duplicate
        function saveAdvancedConfig() {
            var next_callback = saveFilterConfig;
            if(semver.gte(CONFIG.flightControllerVersion, "1.3.0")) {
                MSP.send_message(MSPCodes.MSP_SET_ADVANCED_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_ADVANCED_CONFIG), false, next_callback);
            } else {
                next_callback();
            }
        }

        //FIXME duplicate
        function saveFilterConfig() {
            var next_callback = savePids;
            if(semver.gte(CONFIG.flightControllerVersion, "1.4.0")) {
                MSP.send_message(MSPCodes.MSP_SET_FILTER_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_FILTER_CONFIG), false, next_callback);
            } else {
                next_callback();
            }
        }

        function savePids() {
            MSP.send_message(MSPCodes.MSP_SET_PID, mspHelper.crunch(MSPCodes.MSP_SET_PID), false, saveRcTuning);
        }

        function saveRcTuning() {
            MSP.send_message(MSPCodes.MSP_SET_RC_TUNING, mspHelper.crunch(MSPCodes.MSP_SET_RC_TUNING), false, saveToEeprom);
        }

        //FIXME duplicate from configuration.js
        function saveToEeprom() {
            MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, reboot);
        }

        function reboot() {
            //noinspection JSUnresolvedVariable
            GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));

            GUI.tab_switch_cleanup(function() {
                MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, reinitialize);
            });
        }

        function reinitialize() {
            //noinspection JSUnresolvedVariable
            GUI.log(chrome.i18n.getMessage('deviceRebooting'));
            GUI.handleReconnect($('.tab_profiles a'));
        }

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
