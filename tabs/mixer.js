'use strict';

TABS.mixer = {};

TABS.mixer.initialize = function (callback, scrollPosition) {

    let loadChainer = new MSPChainerClass(),
        saveChainer = new MSPChainerClass(),
        currentPlatform,
        currentMixerPreset,
        $servoMixTable,
        $servoMixTableBody,
        $motorMixTable,
        $motorMixTableBody;

    if (GUI.active_tab != 'mixer') {
        GUI.active_tab = 'mixer';
        googleAnalytics.sendAppView('Mixer');
    }

    loadChainer.setChain([
        mspHelper.loadBfConfig,
        mspHelper.loadMixerConfig,
        mspHelper.loadMotors,
        mspHelper.loadServoMixRules,
        mspHelper.loadMotorMixRules
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

    function renderServoMixRules() {
        /*
         * Process servo mix table UI
         */
        var rules = SERVO_RULES.get();
        $servoMixTableBody.find("*").remove();
        for (var servoRuleIndex in rules) {
            if (rules.hasOwnProperty(servoRuleIndex)) {
                const servoRule = rules[servoRuleIndex];

                $servoMixTableBody.append('\
                    <tr>\
                    <td><input type="number" class="mix-rule-servo" step="1" min="0" max="7" /></td>\
                    <td><select class="mix-rule-input"></select></td>\
                    <td><input type="number" class="mix-rule-rate" step="1" min="-100" max="100" /></td>\
                    <td><input type="number" class="mix-rule-speed" step="1" min="0" max="255" /></td>\
                    <td><span class="btn default_btn narrow red"><a href="#" data-role="role-servo-delete" data-i18n="servoMixerDelete"></a></span></td>\
                    </tr>\
                ');

                const $row = $servoMixTableBody.find('tr:last');

                GUI.fillSelect($row.find(".mix-rule-input"), FC.getServoMixInputNames(), servoRule.getInput());
                
                $row.find(".mix-rule-input").val(servoRule.getInput()).change(function () {
                    servoRule.setInput($(this).val());
                });

                $row.find(".mix-rule-servo").val(servoRule.getTarget()).change(function () {
                    servoRule.setTarget($(this).val());
                });

                $row.find(".mix-rule-rate").val(servoRule.getRate()).change(function () {
                    servoRule.setRate($(this).val());
                });

                $row.find(".mix-rule-speed").val(servoRule.getSpeed()).change(function () {
                    servoRule.setSpeed($(this).val());
                });
                
                $row.find("[data-role='role-servo-delete']").attr("data-index", servoRuleIndex);
            }

        }
        localize();
    }

    function renderMotorMixRules() {

        /*
         * Process motor mix table UI
         */
        var rules = MOTOR_RULES.get();
        $motorMixTableBody.find("*").remove();
        let index = 0;
        for (const i in rules) {
            if (rules.hasOwnProperty(i)) {
                const rule = rules[i];
                index++;

                $motorMixTableBody.append('\
                    <tr>\
                    <td><span class="mix-rule-motor"></span></td>\
                    <td><input type="number" class="mix-rule-throttle" step="0.001" min="0" max="1" /></td>\
                    <td><input type="number" class="mix-rule-roll" step="0.001" min="-1" max="1" /></td>\
                    <td><input type="number" class="mix-rule-pitch" step="0.001" min="-1" max="1" /></td>\
                    <td><input type="number" class="mix-rule-yaw" step="0.001" min="-1" max="1" /></td>\
                    <td><span class="btn default_btn narrow red"><a href="#" data-role="role-motor-delete" data-i18n="servoMixerDelete"></a></span></td>\
                    </tr>\
                ');

                const $row = $motorMixTableBody.find('tr:last');

                $row.find('.mix-rule-motor').html(index);
                $row.find('.mix-rule-throttle').val(rule.getThrottle());
                $row.find('.mix-rule-roll').val(rule.getRoll());
                $row.find('.mix-rule-pitch').val(rule.getPitch());
                $row.find('.mix-rule-yaw').val(rule.getYaw());
                $row.find("[data-role='role-motor-delete']").attr("data-index", i);
            }

        }
        localize();
    }

    function processHtml() {

        $servoMixTable = $('#servo-mix-table');
        $servoMixTableBody = $servoMixTable.find('tbody');
        $motorMixTable = $('#motor-mix-table');
        $motorMixTableBody = $motorMixTable.find('tbody');

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
            $mixerPreset = $('#mixer-preset'),
            modal;

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

        modal = new jBox('Modal', {
            width: 480,
            height: 240,
            closeButton: 'title',
            animation: false,
            attach: $('#load-and-apply-mixer-button'),
            title: chrome.i18n.getMessage("mixerApplyModalTitle"),
            content: $('#mixerApplyContent')
        });

        $('#load-mixer-button').click(function () {
            helper.mixer.loadServoRules(currentMixerPreset);
            helper.mixer.loadMotorRules(currentMixerPreset);
            renderServoMixRules();
            renderMotorMixRules();
        });

        $servoMixTableBody.on('click', "[data-role='role-servo-delete']", function (event) {
            SERVO_RULES.drop($(event.currentTarget).attr("data-index"));
            renderServoMixRules();
        });

        $motorMixTableBody.on('click', "[data-role='role-motor-delete']", function (event) {
            MOTOR_RULES.drop($(event.currentTarget).attr("data-index"));
            renderMotorMixRules();
        });

        localize();
        GUI.content_ready(callback);
    }

};

TABS.mixer.cleanup = function (callback) {
    if (callback) callback();
};