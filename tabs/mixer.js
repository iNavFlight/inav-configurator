'use strict';

TABS.mixer = {};

TABS.mixer.initialize = function (callback, scrollPosition) {

    let loadChainer = new MSPChainerClass(),
        saveChainer = new MSPChainerClass(),
        currentPlatform,
        currentMixerPreset;

    if (GUI.active_tab != 'mixer') {
        GUI.active_tab = 'mixer';
        googleAnalytics.sendAppView('Mixer');
    }

    loadChainer.setChain([
        mspHelper.loadBfConfig,
        mspHelper.loadMixerConfig,
        mspHelper.loadMotors
    ]);
    loadChainer.setExitPoint(loadHtml);
    loadChainer.execute();

    saveChainer.setChain([
        mspHelper.saveBfConfig,
        mspHelper.saveMixerConfig,
        mspHelper.saveToEeprom
    ]);
    saveChainer.setExitPoint(function () {
        GUI.log(chrome.i18n.getMessage('mixerSaved'));
        SERVO_RULES.cleanup();
        MOTOR_RULES.cleanup();
    });

    function loadHtml() {
        $('#content').load("./tabs/mixer.html", processHtml);
    }

    function processHtml() {

        function fillMixerPreset() {
            let mixers = helper.mixer.getByPlatform(MIXER_CONFIG.platformType);

            $mixerPreset.find("*").remove();
            for (i in mixers) {
                if (mixers.hasOwnProperty(i)) {
                    let m = mixers[i];
                    $mixerPreset.append('<option value="' + m.id + '">' + m.name + '</option>');
                }
            }
        }

        let $platformSelect = $('#platform-type'),
            platforms = helper.platform.getList(),
            $hasFlapsWrapper = $('#has-flaps-wrapper'),
            $hasFlaps = $('#has-flaps'),
            $mixerPreset = $('#mixer-preset');

        $platformSelect.find("*").remove();

        for (i in platforms) {
            if (platforms.hasOwnProperty(i)) {
                let p = platforms[i];
                $platformSelect.append('<option value="' + p.id + '">' + p.name + '</option>');
            }
        }

        $platformSelect.change(function () {
            MIXER_CONFIG.platformType = parseInt($platformSelect.val(), 10);
            currentPlatform = helper.platform.getById(MIXER_CONFIG.platformType);

            if (currentPlatform.flapsPossible) {
                $hasFlapsWrapper.removeClass('is-hidden');
            } else {
                $hasFlapsWrapper.addClass('is-hidden');
            }

            fillMixerPreset();
            $mixerPreset.change();
        });

        currentPlatform = helper.platform.getById(MIXER_CONFIG.platformType);
        $platformSelect.val(MIXER_CONFIG.platformType).change();

        $mixerPreset.change(function () {
            currentMixerPreset = helper.mixer.getById(parseInt($mixerPreset.val(), 10));

            $('.mixerPreview img').attr('src', './resources/motor_order/'
                + currentMixerPreset.image + '.svg');
        });

        if (MIXER_CONFIG.appliedMixerPreset > -1) {
            $mixerPreset.val(MIXER_CONFIG.appliedMixerPreset).change();
        } else {
            $mixerPreset.change();
        }

        localize();
        GUI.content_ready(callback);
    }

};

TABS.mixer.cleanup = function (callback) {
    if (callback) callback();
};