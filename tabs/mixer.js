/*global $,helper,mspHelper,MSP,GUI,SERVO_RULES,MOTOR_RULES,MIXER_CONFIG,googleAnalytics,LOGIC_CONDITIONS,TABS,ServoMixRule*/
'use strict';

TABS.mixer = {};

TABS.mixer.initialize = function (callback, scrollPosition) {

    let loadChainer = new MSPChainerClass(),
        saveChainer = new MSPChainerClass(),
        currentPlatform,
        currentMixerPreset,
        loadedMixerPresetID,
        $servoMixTable,
        $servoMixTableBody,
        $motorMixTable,
        $motorMixTableBody,
        modal,
        motorWizardModal;

    if (GUI.active_tab != 'mixer') {
        GUI.active_tab = 'mixer';
        googleAnalytics.sendAppView('Mixer');
    }

    loadChainer.setChain([
        mspHelper.loadMixerConfig,
        mspHelper.loadMotors,
        mspHelper.loadServoMixRules,
        mspHelper.loadMotorMixRules,
        mspHelper.loadOutputMapping,
        mspHelper.loadLogicConditions
    ]);
    loadChainer.setExitPoint(loadHtml);
    loadChainer.execute();

    saveChainer.setChain([
        mspHelper.saveMixerConfig,
        mspHelper.sendServoMixer,
        mspHelper.sendMotorMixer,
        saveSettings,
        mspHelper.saveToEeprom
    ]);
    saveChainer.setExitPoint(reboot);

    function saveSettings(onComplete) {
        Settings.saveInputs().then(onComplete);
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
        GUI.handleReconnect($('.tab_mixer a'));
    }

    function loadHtml() {
        GUI.load("./tabs/mixer.html", Settings.processHtml(processHtml));
    }

    function renderOutputTable() {
        let outputCount = OUTPUT_MAPPING.getOutputCount(),
            $outputRow = $('#output-row'),
            $functionRow = $('#function-row');

        $outputRow.append('<th data-i18n="mappingTableOutput"></th>');
        $functionRow.append('<th data-i18n="mappingTableFunction"></th>');

        for (let i = 1; i <= outputCount; i++) {
            $outputRow.append('<td>S' + i + '</td>');
            $functionRow.append('<td id="function-' + i +'">-</td>');
        }

        $outputRow.find('td').css('width', 100 / (outputCount + 1) + '%');

    }

    function renderOutputMapping() {
        let outputMap = OUTPUT_MAPPING.getOutputTable(
            MIXER_CONFIG.platformType == PLATFORM_MULTIROTOR || MIXER_CONFIG.platformType == PLATFORM_TRICOPTER,
            MOTOR_RULES.getNumberOfConfiguredMotors(),
            SERVO_RULES.getUsedServoIndexes()
        );

        for (let i = 1; i <= OUTPUT_MAPPING.getOutputCount(); i++) {
            $('#function-' + i).html(outputMap[i - 1]);
        }

        renderServoOutputImage(outputMap);
    }

    function renderServoOutputImage(outputMap) {
        let mixerPreview = $('.mixerPreview');
        mixerPreview.find('.outputImageNumber').remove();

        $(".mix-rule-servo").each(function() {
            $(this).css("background-color", "");
            $(this).css("font-weight", "");
            $(this).css("color", "");
        });

        if (MIXER_CONFIG.platformType == PLATFORM_AIRPLANE) {
            if (outputMap != null && currentMixerPreset.hasOwnProperty('imageOutputsNumbers')) {
                let outputPad = 1;
                let outputArea = null;
                let inputBoxes = null;
                let surfaces = {
                    aileronSet: helper.mixer.countSurfaceType(currentMixerPreset, INPUT_STABILIZED_ROLL),
                    elevatorSet: helper.mixer.countSurfaceType(currentMixerPreset, INPUT_STABILIZED_PITCH),
                    rudderSet: helper.mixer.countSurfaceType(currentMixerPreset, INPUT_STABILIZED_YAW),
                };
                let motors = [];
                let servoRules = SERVO_RULES;

                for (let omIndex of outputMap) {
                    if (omIndex != '-') {
                        omIndex = omIndex.split(' ');
                        if (omIndex[0] == "Motor") {
                            motors.push(outputPad);
                        } else {
                            let servo = servoRules.getServoMixRuleFromTarget(omIndex[1]);
                            let divID = "servoPreview" + omIndex[1];

                            switch (parseInt(servo.getInput())) {
                                case INPUT_STABILIZED_PITCH:
                                case STABILIZED_PITCH_POSITIVE:
                                case STABILIZED_PITCH_NEGATIVE:
                                case INPUT_RC_PITCH:
                                    outputArea = getOutputImageArea(currentMixerPreset.imageOutputsNumbers, INPUT_STABILIZED_PITCH, surfaces.elevatorSet);
                                    if (outputArea != null) {
                                        mixerPreview.append('<div id="' + divID + '" class="outputImageNumber">S' + outputPad + '</div>');

                                        $("#"+divID).css("top", outputArea.top + "px");
                                        $("#"+divID).css("left", outputArea.left + "px");
                                        $("#"+divID).css("border-color", outputArea.colour);

                                        inputBoxes = getServoNumberInput(servo.getTarget());
                                        if (inputBoxes.length > 0) {
                                            $.each(inputBoxes, function() {
                                                $(this).css("background-color", outputArea.colour);
                                                $(this).css("font-weight", "bold");
                                                $(this).css("color", "#FFFFFF");
                                            });
                                        }

                                        surfaces.elevatorSet--;
                                    }
                                    break;
                                case INPUT_STABILIZED_ROLL:
                                case STABILIZED_ROLL_POSITIVE:
                                case STABILIZED_ROLL_NEGATIVE:
                                case INPUT_RC_ROLL:
                                    outputArea = getOutputImageArea(currentMixerPreset.imageOutputsNumbers, INPUT_STABILIZED_ROLL, surfaces.aileronSet);
                                    if (outputArea != null) {
                                        mixerPreview.append('<div id="' + divID + '" class="outputImageNumber">S' + outputPad + '</div>');

                                        $("#"+divID).css("top", outputArea.top + "px");
                                        $("#"+divID).css("left", outputArea.left + "px");
                                        $("#"+divID).css("border-color", outputArea.colour);

                                        inputBoxes = getServoNumberInput(servo.getTarget());
                                        if (inputBoxes.length > 0) {
                                            $.each(inputBoxes, function() {
                                                $(this).css("background-color", outputArea.colour);
                                                $(this).css("font-weight", "bold");
                                                $(this).css("color", "#FFFFFF");
                                            });
                                        }

                                        surfaces.aileronSet--;
                                    }
                                    break;
                                case INPUT_STABILIZED_YAW:
                                case STABILIZED_YAW_POSITIVE:
                                case STABILIZED_YAW_NEGATIVE:
                                case INPUT_RC_YAW:
                                    outputArea = getOutputImageArea(currentMixerPreset.imageOutputsNumbers, INPUT_STABILIZED_YAW, surfaces.rudderSet);
                                    if (outputArea != null) {
                                        mixerPreview.append('<div id="' + divID + '" class="outputImageNumber">S' + outputPad + '</div>');

                                        $("#"+divID).css("top", outputArea.top + "px");
                                        $("#"+divID).css("left", outputArea.left + "px");
                                        $("#"+divID).css("border-color", outputArea.colour);

                                        inputBoxes = getServoNumberInput(servo.getTarget());
                                        if (inputBoxes.length > 0) {
                                            $.each(inputBoxes, function() {
                                                $(this).css("background-color", outputArea.colour);
                                                $(this).css("font-weight", "bold");
                                                $(this).css("color", "#FFFFFF");
                                            });
                                        }

                                        surfaces.rudderSet--;
                                    }
                                    break;
                            }
                        }
                    }

                    outputPad++;
                }

                if (motors.length > 0) {
                    mixerPreview.append('<div id="motorsPreview" class="outputImageNumber isMotor">S' + motors.join('/') + '</div>');

                    outputArea = getOutputImageArea(currentMixerPreset.imageOutputsNumbers, INPUT_STABILIZED_THROTTLE, 0);
                    if (outputArea != null) {
                        $("#motorsPreview").css("top", outputArea.top + "px");
                        $("#motorsPreview").css("left", outputArea.left + "px");
                        $("#motorsPreview").css("border-color", outputArea.colour);
                    }
                }
            }
        }
    }

    var lastRoll = -1;
    var lastPitch = -1;
    var lastYaw = -1;

    function getOutputImageArea(outputImageAreas, input, surfacesSet) {
        let returnArea = null;
        
        for (let area of outputImageAreas) {
            if (area.input == input) {
                if ( input === INPUT_STABILIZED_THROTTLE
                    || (surfacesSet > 0 && 
                            ((input === INPUT_STABILIZED_YAW && surfacesSet !== lastYaw) 
                            || (input === INPUT_STABILIZED_ROLL && surfacesSet !== lastRoll) 
                            || (input === INPUT_STABILIZED_PITCH && surfacesSet !== lastPitch))
                        )
                ) {
                    returnArea = area;
                }

                if (input === INPUT_STABILIZED_ROLL) {
                    lastRoll = surfacesSet-1;
                } else if (input === INPUT_STABILIZED_PITCH) {
                    lastPitch = surfacesSet-1;
                } else if (input === INPUT_STABILIZED_YAW) {
                    lastYaw = surfacesSet-1;
                }

                if (returnArea !== null) {
                    break;
                }
            }
        }

        return returnArea;
    }

    function getServoNumberInput(target) {
        let servoInputs = [];

        $(".mix-rule-servo").each(function() {
            if ($(this).val() == target) {
                servoInputs.push($(this));
            }
        });

        return servoInputs;
    }

    function renderServoMixRules() {
        /*
         * Process servo mix table UI
         */
        let rules = SERVO_RULES.get();
        $servoMixTableBody.find("*").remove();
        for (let servoRuleIndex in rules) {
            if (rules.hasOwnProperty(servoRuleIndex)) {
                const servoRule = rules[servoRuleIndex];

                $servoMixTableBody.append('\
                    <tr>\
                    <td><input type="number" class="mix-rule-servo" step="1" min="0" max="15" /></td>\
                    <td><select class="mix-rule-input"></select></td>\
                    <td class="mixer-fixed-value-col"><input type="number" class="mix-rule-fixed-value" min="875" max="2125" disabled /></td> \
                    <td><input type="number" class="mix-rule-rate" step="1" min="-125" max="125" /></td>\
                    <td><input type="number" class="mix-rule-speed" step="1" min="0" max="255" /></td>\
                    <td class="mixer-table__condition"></td>\
                    <td><span class="btn default_btn narrow red"><a href="#" data-role="role-servo-delete" data-i18n="servoMixerDelete"></a></span></td>\
                    </tr>\
                ');

                const $row = $servoMixTableBody.find('tr:last');

                GUI.renderLogicConditionSelect(
                    $row.find('.mixer-table__condition'), 
                    LOGIC_CONDITIONS, 
                    servoRule.getConditionId(), 
                    function () {
                        servoRule.setConditionId($(this).val());
                    },
                    true,
                    true
                );

                GUI.fillSelect($row.find(".mix-rule-input"), FC.getServoMixInputNames(), servoRule.getInput());

                if (!MIXER_CONFIG.hasFlaps) {
                    $row.find(".mix-rule-input").children('option[value="14"]').remove();
                }

                $row.find(".mix-rule-input").val(servoRule.getInput()).change(function () {
                    servoRule.setInput($(this).val());
                    updateFixedValueVisibility($row, $(this));

                    renderOutputMapping();
                });

                $row.find(".mix-rule-servo").val(servoRule.getTarget()).change(function () {
                    servoRule.setTarget($(this).val());
                });

                $row.find(".mix-rule-rate").val(servoRule.getRate()).change(function () {
                    servoRule.setRate($(this).val());
                    $row.find(".mix-rule-fixed-value").val(mapServoWeightToFixedValue($(this).val()));
                });

                $row.find(".mix-rule-fixed-value").val(mapServoWeightToFixedValue($row.find(".mix-rule-rate").val()));

                $row.find(".mix-rule-speed").val(servoRule.getSpeed()).change(function () {
                    servoRule.setSpeed($(this).val());
                });

                $row.find("[data-role='role-servo-delete']").attr("data-index", servoRuleIndex);

                updateFixedValueVisibility($row, $row.find(".mix-rule-input"));
            }
        }

        let rate_inputs = $('.mix-rule-rate');
        rate_inputs.attr("min", -1000);
        rate_inputs.attr("max", 1000);

        localize();
    }

    function updateFixedValueVisibility(row, $mixRuleInput) {

        // Show the fixed value input box if "MAX" input was selected for this servo
        const $fixedValueCalcInput = row.find(".mix-rule-fixed-value");
        if (FC.getServoMixInputNames()[$mixRuleInput.val()] === 'MAX') {
            $fixedValueCalcInput.show();
            row.find(".mix-rule-speed").prop('disabled', true);
        } else {
            $fixedValueCalcInput.hide();
            row.find(".mix-rule-speed").prop('disabled', false);
        }

        // Show the Fixed Value column if at least one servo has the "MAX" input assigned
        const $fixedValueCol = $("#servo-mix-table").find(".mixer-fixed-value-col");
        const rules = SERVO_RULES.get();
        for (let servoRuleIndex in rules) {
            if (rules.hasOwnProperty(servoRuleIndex)) {
                if (FC.getServoMixInputNames()[rules[servoRuleIndex].getInput()] === 'MAX') {
                    $fixedValueCol.show();
                    return;
                }
            }
        }
        $fixedValueCol.hide();
    }

    function mapServoWeightToFixedValue(weight) {
        return (parseInt(weight) + 100) * 1000 / 200 + 1000;
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
                    <td><input type="number" class="mix-rule-roll" step="0.001" min="-2" max="2" /></td>\
                    <td><input type="number" class="mix-rule-pitch" step="0.001" min="-2" max="2" /></td>\
                    <td><input type="number" class="mix-rule-yaw" step="0.001" min="-2" max="2" /></td>\
                    <td><span class="btn default_btn narrow red"><a href="#" data-role="role-motor-delete" data-i18n="servoMixerDelete"></a></span></td>\
                    </tr>\
                ');

                const $row = $motorMixTableBody.find('tr:last');

                $row.find('.mix-rule-motor').html(index);
                $row.find('.mix-rule-throttle').val(rule.getThrottle()).change(function () {
                    rule.setThrottle($(this).val());
                });
                $row.find('.mix-rule-roll').val(rule.getRoll()).change(function () {
                    rule.setRoll($(this).val());
                });
                $row.find('.mix-rule-pitch').val(rule.getPitch()).change(function () {
                    rule.setPitch($(this).val());
                });
                $row.find('.mix-rule-yaw').val(rule.getYaw()).change(function () {
                    rule.setYaw($(this).val());
                });
                $row.find("[data-role='role-motor-delete']").attr("data-index", i);
            }

        }
        localize();
    }

    function saveAndReboot() {

        /*
         * Send tracking
         */
        googleAnalytics.sendEvent('Mixer', 'Platform type', helper.platform.getById(MIXER_CONFIG.platformType).name);
        googleAnalytics.sendEvent('Mixer', 'Mixer preset',  helper.mixer.getById(MIXER_CONFIG.appliedMixerPreset).name);

        /*
         * Send mixer rules
         */
        SERVO_RULES.cleanup();
        SERVO_RULES.inflate();
        MOTOR_RULES.cleanup();
        MOTOR_RULES.inflate();
        saveChainer.execute();
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
            $mixerPreset = $('#mixer-preset'),
            $wizardButton = $("#mixer-wizard");

        motorWizardModal = new jBox('Modal', {
            width: 480,
            height: 410,
            closeButton: 'title',
            animation: false,
            attach: $wizardButton,
            title: chrome.i18n.getMessage("mixerWizardModalTitle"),
            content: $('#mixerWizardContent')
        });

        function validateMixerWizard() {
            let errorCount = 0;
            for (let i = 0; i < 4; i++) {
                const $elements = $('[data-motor] option:selected[id=' + i + ']'),
                    assignedRulesCount = $elements.length;

                if (assignedRulesCount != 1) {
                    errorCount++;
                    $elements.closest('tr').addClass("red-background");
                } else {
                    $elements.closest('tr').removeClass("red-background");
                }

            }

            return (errorCount == 0);
        }

        $(".wizard-motor-select").change(validateMixerWizard);

        $("#wizard-execute-button").click(function () {

            // Validate mixer settings
            if (!validateMixerWizard()) {
                return;
            }

            MOTOR_RULES.flush();

            for (let i = 0; i < 4; i++) {
                const $selects = $(".wizard-motor-select");
                let rule = -1;

                $selects.each(function () {
                    if (parseInt($(this).find(":selected").attr("id"), 10) == i) {
                        rule = parseInt($(this).attr("data-motor"), 10);
                    }
                });

                const r = currentMixerPreset.motorMixer[rule];

                MOTOR_RULES.put(
                    new MotorMixRule(
                        r.getThrottle(),
                        r.getRoll(),
                        r.getPitch(),
                        r.getYaw()
                    )
                );
                
            }

            renderMotorMixRules();
            renderOutputMapping();

            motorWizardModal.close();
        });

        const updateMotorDirection = function () {
            let motorDirectionCheckbox = $("#motor_direction_inverted");
            const isReversed = motorDirectionCheckbox.is(":checked") && (MIXER_CONFIG.platformType == PLATFORM_MULTIROTOR || MIXER_CONFIG.platformType == PLATFORM_TRICOPTER);

            const path = './resources/motor_order/'
                + currentMixerPreset.image + (isReversed ? "_reverse" : "") + '.svg';
            $('.mixerPreview img').attr('src', path);

            if (MIXER_CONFIG.platformType == PLATFORM_MULTIROTOR || MIXER_CONFIG.platformType == PLATFORM_TRICOPTER) {
                if (isReversed) {
                    motorDirectionCheckbox.parent().find("label span").html(chrome.i18n.getMessage("motor_direction_isInverted"));
                } else {
                    motorDirectionCheckbox.parent().find("label span").html(chrome.i18n.getMessage("motor_direction_inverted"));
                }
            }

            renderServoOutputImage();
        };

        $("#motor_direction_inverted").change(updateMotorDirection);

        $platformSelect.find("*").remove();

        for (let i in platforms) {
            if (platforms.hasOwnProperty(i)) {
                let p = platforms[i];
                $platformSelect.append('<option value="' + p.id + '">' + p.name + '</option>');
            }
        }

        $platformSelect.change(function () {
            MIXER_CONFIG.platformType = parseInt($platformSelect.val(), 10);
            currentPlatform = helper.platform.getById(MIXER_CONFIG.platformType);

            var $platformSelectParent = $platformSelect.parent('.select');

            fillMixerPreset();
            $mixerPreset.change();
        });

        currentPlatform = helper.platform.getById(MIXER_CONFIG.platformType);
        $platformSelect.val(MIXER_CONFIG.platformType).change();

        $mixerPreset.change(function () {
            const presetId = parseInt($mixerPreset.val(), 10);
            currentMixerPreset = helper.mixer.getById(presetId);

            MIXER_CONFIG.appliedMixerPreset = presetId;

            if (currentMixerPreset.id == 3) {
                $wizardButton.parent().removeClass("is-hidden");
            } else {
                $wizardButton.parent().addClass("is-hidden");
            }

            if (MIXER_CONFIG.platformType == PLATFORM_AIRPLANE && currentMixerPreset.id != loadedMixerPresetID) {
                $("#needToUpdateMixerMessage").removeClass("is-hidden");
            } else {
                $("#needToUpdateMixerMessage").addClass("is-hidden");
            }

            if (MIXER_CONFIG.platformType == PLATFORM_MULTIROTOR || MIXER_CONFIG.platformType == PLATFORM_TRICOPTER) {
                $('#motor_direction_inverted').parent().removeClass("is-hidden");
                $('#platform-type').parent('.select').removeClass('no-bottom-border');
            } else {
                $('#motor_direction_inverted').parent().addClass("is-hidden");
                $('#platform-type').parent('.select').addClass('no-bottom-border');
            }

            updateRefreshButtonStatus();

            updateMotorDirection();
        });

        if (MIXER_CONFIG.appliedMixerPreset > -1) {
            loadedMixerPresetID = MIXER_CONFIG.appliedMixerPreset;
            $("#needToUpdateMixerMessage").addClass("is-hidden");
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

        $('#execute-button').click(function () {
            loadedMixerPresetID = currentMixerPreset.id;
            helper.mixer.loadServoRules(currentMixerPreset);
            helper.mixer.loadMotorRules(currentMixerPreset);
            MIXER_CONFIG.hasFlaps = (currentMixerPreset.hasFlaps === true) ? true : false;
            renderServoMixRules();
            renderMotorMixRules();
            renderOutputMapping();
            modal.close();
            saveAndReboot();
        });

        $('#load-mixer-button').click(function () {
            if (MIXER_CONFIG.platformType == PLATFORM_AIRPLANE) {
                $("#needToUpdateMixerMessage").addClass("is-hidden");
            }
            loadedMixerPresetID = currentMixerPreset.id;
            helper.mixer.loadServoRules(currentMixerPreset);
            helper.mixer.loadMotorRules(currentMixerPreset);
            MIXER_CONFIG.hasFlaps = (currentMixerPreset.hasFlaps === true) ? true : false;
            renderServoMixRules();
            renderMotorMixRules();
            renderOutputMapping();
            updateRefreshButtonStatus();
        });

        $('#refresh-mixer-button').click(function () {
            currentMixerPreset = helper.mixer.getById(loadedMixerPresetID);
            MIXER_CONFIG.platformType = currentMixerPreset.platform;
            currentPlatform = helper.platform.getById(MIXER_CONFIG.platformType);
            $platformSelect.val(MIXER_CONFIG.platformType).change();
            $mixerPreset.val(loadedMixerPresetID).change();
            renderServoMixRules();
            renderMotorMixRules();
            renderOutputMapping();
        });

        $servoMixTableBody.on('click', "[data-role='role-servo-delete']", function (event) {
            SERVO_RULES.drop($(event.currentTarget).attr("data-index"));
            renderServoMixRules();
            renderOutputMapping();
        });

        $motorMixTableBody.on('click', "[data-role='role-motor-delete']", function (event) {
            MOTOR_RULES.drop($(event.currentTarget).attr("data-index"));
            renderMotorMixRules();
            renderOutputMapping();
        });

        $servoMixTableBody.on('change', "input", function (event) {
            renderOutputMapping();
        });

        $("[data-role='role-servo-add']").click(function () {
            if (SERVO_RULES.hasFreeSlots()) {
                SERVO_RULES.put(new ServoMixRule(SERVO_RULES.getNextUnusedIndex(), 0, 100, 0));
                renderServoMixRules();
                renderOutputMapping();
            }
        });

        $("[data-role='role-motor-add']").click(function () {
            if (MOTOR_RULES.hasFreeSlots()) {
                MOTOR_RULES.put(new MotorMixRule(1, 0, 0, 0));
                renderMotorMixRules();
                renderOutputMapping();
            }
        });

        $("[data-role='role-logic-conditions-open']").click(function () {
            LOGIC_CONDITIONS.open();
        });

        $('#save-button').click(saveAndReboot);

        renderServoMixRules();
        renderMotorMixRules();

        renderOutputTable();
        renderOutputMapping();

        LOGIC_CONDITIONS.init($('#logic-wrapper'));

        localize();

        helper.mspBalancedInterval.add('logic_conditions_pull', 350, 1, getLogicConditionsStatus);

        GUI.content_ready(callback);
    }

    function updateRefreshButtonStatus() {
        if (
            (currentMixerPreset.id != loadedMixerPresetID && helper.mixer.getById(loadedMixerPresetID).platform == PLATFORM_AIRPLANE) ||
            (currentMixerPreset.id == loadedMixerPresetID && currentMixerPreset.platform == PLATFORM_AIRPLANE)
           ) {
            $("#refresh-mixer-button").parent().removeClass("is-hidden");
        } else {
            $("#refresh-mixer-button").parent().addClass("is-hidden");
        }
    }

    function getLogicConditionsStatus() {
        mspHelper.loadLogicConditionsStatus(onStatusPullDone);
    }

    function onStatusPullDone() {
        LOGIC_CONDITIONS.update(LOGIC_CONDITIONS_STATUS);
    }

};

TABS.mixer.cleanup = function (callback) {
    delete modal;
    delete motorWizardModal;
    $('.jBox-wrapper').remove();
    if (callback) callback();
};
