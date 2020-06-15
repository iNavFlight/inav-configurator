'use strict';

var presets = presets || {};

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
                    values = defaults[settingName];

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
            window.BF_CONFIG.features |= 1 << 22; // AIRMODE
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
        mspHelper.loadPidData,
        mspHelper.loadMixerConfig
    ]);
    loadChainer.setExitPoint(loadHtml);
    loadChainer.execute();

    saveChainer.setChain([
        mspHelper.saveBfConfig,
        mspHelper.saveMixerConfig,
        mspHelper.saveINAVPidConfig,
        mspHelper.saveLooptimeConfig,
        mspHelper.saveAdvancedConfig,
        mspHelper.saveFilterConfig,
        mspHelper.savePidData,
        mspHelper.saveRcTuningData,
        mspHelper.savePidAdvanced
    ]);
    saveChainer.setExitPoint(applySettings);

    function loadHtml() {
        GUI.load("./tabs/profiles.html", processHtml);
    }
    
    function applySettings() {
        if (currentPreset.settings && currentPreset.settings.length > 0) {
            Promise.mapSeries(currentPreset.settings, function (input, ii) {
                return mspHelper.getSetting(input.key);
            }).then(function () {
                Promise.mapSeries(currentPreset.settings, function (input, ii) {
                    console.log('applying', input.key, input.value);
                    return mspHelper.setSetting(input.key, input.value);
                }).then(function () {
                    mspHelper.saveToEeprom(function () {
                        //noinspection JSUnresolvedVariable
                        GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));
                
                        GUI.tab_switch_cleanup(function() {
                            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function () {
                                //noinspection JSUnresolvedVariable
                                GUI.log(chrome.i18n.getMessage('deviceRebooting'));
                                GUI.handleReconnect();
                            });
                        });
                    });
                })
            });
        }
    } 

    function applyAndSave() {

        presets.model.applyDefaults(currentPreset.applyDefaults, presets.defaultValues, currentPreset.type);

        var setting;

        //Iterate over settings saved in preset
        for (let i in currentPreset.settingsMSP) {
            if (currentPreset.settingsMSP.hasOwnProperty(i)) {
                setting = currentPreset.settingsMSP[i];
                //Apply setting
                window[setting.group][setting.field] = setting.value;
            }
        }
        var promises = {};
        var settings = presets.settings.get(currentPreset.type);
        Object.keys(settings).forEach(function(key, ii) {
            var value = settings[key];
            promises[key] = mspHelper.setSetting(name, value);
        });
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
        var modal;
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
            modal.close();

            googleAnalytics.sendEvent('Presets', 'Applied', currentPreset.name);
        });

        localize();

        //noinspection JSValidateTypes
        $('#content').scrollTop((scrollPosition) ? scrollPosition : 0);

        modal = new jBox('Modal', {
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
