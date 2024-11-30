'use strict';

const path = require('path');

const MSPChainerClass = require('./../js/msp/MSPchainer');
const mspHelper = require('./../js/msp/MSPHelper');
const MSPCodes = require('./../js/msp/MSPCodes');
const MSP = require('./../js/msp');
const { GUI, TABS } = require('./../js/gui');
const FC = require('./../js/fc');
const i18n = require('./../js/localization');
const { mixer, platform, PLATFORM, INPUT, STABILIZED } = require('./../js/model');
const Settings = require('./../js/settings');
const jBox = require('../js/libraries/jBox/jBox.min');
const interval = require('./../js/intervals');
const ServoMixRule = require('./../js/servoMixRule');
const MotorMixRule = require('./../js/motorMixRule');

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
    }

    loadChainer.setChain([
        mspHelper.loadMixerConfig,
        mspHelper.loadMotors,
        mspHelper.loadServoMixRules,
        mspHelper.loadMotorMixRules,
        mspHelper.loadOutputMappingExt,
        mspHelper.loadTimerOutputModes,
        mspHelper.loadLogicConditions,
        mspHelper.loadEzTune,
    ]);
    loadChainer.setExitPoint(loadHtml);
    loadChainer.execute();

    saveChainer.setChain([
        mspHelper.saveMixerConfig,
        mspHelper.sendServoMixer,
        mspHelper.sendMotorMixer,
        mspHelper.sendTimerOutputModes,
        saveSettings,
        mspHelper.saveToEeprom
    ]);
    saveChainer.setExitPoint(reboot);

    function saveSettings(onComplete) {
        Settings.saveInputs(onComplete);
    }

    function reboot() {
        //noinspection JSUnresolvedVariable
        GUI.log(i18n.getMessage('configurationEepromSaved'));

        GUI.tab_switch_cleanup(function() {
            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, reinitialize);
        });
    }

    function reinitialize() {
        //noinspection JSUnresolvedVariable
        GUI.log(i18n.getMessage('deviceRebooting'));
        GUI.handleReconnect($('.tab_mixer a'));
    }

    function loadHtml() {
        GUI.load(path.join(__dirname, "mixer.html"), Settings.processHtml(processHtml));
    }

    function renderOutputTable() {
        let outputCount = FC.OUTPUT_MAPPING.getOutputCount(),
            $outputRow = $('#output-row'),
            $functionRow = $('#function-row');

        $outputRow.append('<th data-i18n="mappingTableOutput"></th>');
        $functionRow.append('<th data-i18n="mappingTableFunction"></th>');
        
        for (let i = 1; i <= outputCount; i++) {

            let timerId = FC.OUTPUT_MAPPING.getTimerId(i - 1);
            let color = FC.OUTPUT_MAPPING.getOutputTimerColor(i - 1);
            let isLed = FC.OUTPUT_MAPPING.isLedPin(i - 1);

            $outputRow.append('<td style="background-color: ' + color + '">S' + i + (isLed ? '/LED' : '') + ' (Timer&nbsp;' + (timerId + 1) + ')</td>');
            $functionRow.append('<td id="function-' + i +'">-</td>');
        }

        $outputRow.find('td').css('width', 100 / (outputCount + 1) + '%');

    }

    function updateTimerOverride() {
        let timers = FC.OUTPUT_MAPPING.getUsedTimerIds();

        for(let i =0; i < timers.length;++i) {
            let timerId = timers[i];
            let $select = $('#timer-output-' + timerId);
            if(!$select) {
                continue;
            }
            FC.OUTPUT_MAPPING.setTimerOverride(timerId, $select.val());
        }
    }

    function renderTimerOverride() {
        let outputCount = FC.OUTPUT_MAPPING.getOutputCount(),
            $container = $('#timerOutputsList'), timers = {};


        let usedTimers = FC.OUTPUT_MAPPING.getUsedTimerIds();

        for (let t of usedTimers) {
            var usageMode = FC.OUTPUT_MAPPING.getTimerOverride(t);
            $container.append(
                        '<div class="select" style="padding: 5px; margin: 1px; background-color: ' + FC.OUTPUT_MAPPING.getTimerColor(t) + '">' +
                            '<select id="timer-output-' + t + '">' +
                                '<option value=' + FC.OUTPUT_MAPPING.TIMER_OUTPUT_MODE_AUTO + '' + (usageMode == FC.OUTPUT_MAPPING.TIMER_OUTPUT_MODE_AUTO ? ' selected' : '')+ '>AUTO</option>'+
                                '<option value=' + FC.OUTPUT_MAPPING.TIMER_OUTPUT_MODE_MOTORS + '' + (usageMode == FC.OUTPUT_MAPPING.TIMER_OUTPUT_MODE_MOTORS ? ' selected' : '')+ '>MOTORS</option>'+
                                '<option value=' + FC.OUTPUT_MAPPING.TIMER_OUTPUT_MODE_SERVOS + '' + (usageMode == FC.OUTPUT_MAPPING.TIMER_OUTPUT_MODE_SERVOS ? ' selected' : '')+ '>SERVOS</option>'+
                                '<option value=' + FC.OUTPUT_MAPPING.TIMER_OUTPUT_MODE_LED + '' + (usageMode == FC.OUTPUT_MAPPING.TIMER_OUTPUT_MODE_LED ? ' selected' : '')+ '>LED</option>'+
                            '</select>' +
                            '<label for="timer-output-' + t + '">' +
                                '<span> Timer ' + (parseInt(t) + 1) + '</span>' +
                            '</label>' +
                        '</div>'
            );
        }

    }

    function renderOutputMapping() {
        let outputMap = FC.OUTPUT_MAPPING.getOutputTable(
            FC.MIXER_CONFIG.platformType == PLATFORM.MULTIROTOR || FC.MIXER_CONFIG.platformType == PLATFORM.TRICOPTER,
            FC.MOTOR_RULES.getNumberOfConfiguredMotors(),
            FC.SERVO_RULES.getUsedServoIndexes()
        );

        for (let i = 1; i <= FC.OUTPUT_MAPPING.getOutputCount(); i++) {
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

        if (FC.MIXER_CONFIG.platformType == PLATFORM.AIRPLANE) {
            if (outputMap != null && currentMixerPreset.hasOwnProperty('imageOutputsNumbers')) {
                let outputPad = 1;
                let outputArea = null;
                let inputBoxes = null;
                let surfaces = {
                    aileronSet: mixer.countSurfaceType(currentMixerPreset, INPUT.STABILIZED_ROLL),
                    elevatorSet: mixer.countSurfaceType(currentMixerPreset, INPUT.STABILIZED_PITCH),
                    rudderSet: mixer.countSurfaceType(currentMixerPreset, INPUT.STABILIZED_YAW),
                };
                let motors = [];
                let servoRules = FC.SERVO_RULES;

                for (let omIndex of outputMap) {
                    if (omIndex != '-') {
                        omIndex = omIndex.split(' ');
                        if (omIndex[0] == "Motor") {
                            motors.push(outputPad);
                        } else {
                            let servo = servoRules.getServoMixRuleFromTarget(omIndex[1]);
                            if (servo == null) {continue;}
                            let divID = "servoPreview" + omIndex[1];
                            
                            switch (parseInt(servo.getInput())) {
                                case INPUT.STABILIZED_PITCH:
                                case STABILIZED.PITCH_POSITIVE:
                                case STABILIZED.PITCH_NEGATIVE:
                                case INPUT.RC_PITCH:
                                    outputArea = getOutputImageArea(currentMixerPreset.imageOutputsNumbers, INPUT.STABILIZED_PITCH, surfaces.elevatorSet);
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
                                case INPUT.STABILIZED_ROLL:
                                case STABILIZED.ROLL_POSITIVE:
                                case STABILIZED.ROLL_NEGATIVE:
                                case INPUT.RC_ROLL:
                                    outputArea = getOutputImageArea(currentMixerPreset.imageOutputsNumbers, INPUT.STABILIZED_ROLL, surfaces.aileronSet);
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
                                case INPUT.STABILIZED_YAW:
                                case STABILIZED.YAW_POSITIVE:
                                case STABILIZED.YAW_NEGATIVE:
                                case INPUT.RC_YAW:
                                    outputArea = getOutputImageArea(currentMixerPreset.imageOutputsNumbers, INPUT.STABILIZED_YAW, surfaces.rudderSet);
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

                    outputArea = getOutputImageArea(currentMixerPreset.imageOutputsNumbers, INPUT.STABILIZED_THROTTLE, 0);
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
                if ( input === INPUT.STABILIZED_THROTTLE
                    || (surfacesSet > 0 && 
                            ((input === INPUT.STABILIZED_YAW && surfacesSet !== lastYaw) 
                            || (input === INPUT.STABILIZED_ROLL && surfacesSet !== lastRoll) 
                            || (input === INPUT.STABILIZED_PITCH && surfacesSet !== lastPitch))
                        )
                ) {
                    returnArea = area;
                }

                if (input === INPUT.STABILIZED_ROLL) {
                    lastRoll = surfacesSet-1;
                } else if (input === INPUT.STABILIZED_PITCH) {
                    lastPitch = surfacesSet-1;
                } else if (input === INPUT.STABILIZED_YAW) {
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
        let rules = FC.SERVO_RULES.get();
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
                    FC.LOGIC_CONDITIONS, 
                    servoRule.getConditionId(), 
                    function () {
                        servoRule.setConditionId($(this).val());
                    },
                    true,
                    true
                );

                GUI.fillSelect($row.find(".mix-rule-input"), FC.getServoMixInputNames(), servoRule.getInput());

                if (!FC.MIXER_CONFIG.hasFlaps) {
                    $row.find(".mix-rule-input").children('option[value="14"]').remove();
                }

                $row.find(".mix-rule-input").val(servoRule.getInput()).on('change', function () {
                    servoRule.setInput($(this).val());
                    updateFixedValueVisibility($row, $(this));

                    renderOutputMapping();
                });

                $row.find(".mix-rule-servo").val(servoRule.getTarget()).on('change', function () {
                    servoRule.setTarget(Number($(this).val()));
                });

                $row.find(".mix-rule-rate").val(servoRule.getRate()).on('change', function () {
                    servoRule.setRate($(this).val());
                    $row.find(".mix-rule-fixed-value").val(mapServoWeightToFixedValue($(this).val()));
                });

                $row.find(".mix-rule-fixed-value").val(mapServoWeightToFixedValue($row.find(".mix-rule-rate").val()));

                $row.find(".mix-rule-speed").val(servoRule.getSpeed()).on('change', function () {
                    servoRule.setSpeed($(this).val());
                });

                $row.find("[data-role='role-servo-delete']").attr("data-index", servoRuleIndex);

                updateFixedValueVisibility($row, $row.find(".mix-rule-input"));
            }
        }

        let rate_inputs = $('.mix-rule-rate');
        rate_inputs.attr("min", -1000);
        rate_inputs.attr("max", 1000);

       i18n.localize();;
    }

    function updateFixedValueVisibility(row, $mixRuleInput) {

        // Show the fixed value input box if "MAX" input was selected for this servo
        const $fixedValueCalcInput = row.find(".mix-rule-fixed-value");
        if (FC.getServoMixInputNames()[$mixRuleInput.val()] === 'MAX') {
            $fixedValueCalcInput.show();
        } else {
            $fixedValueCalcInput.hide();
            row.find(".mix-rule-speed").prop('disabled', false);
        }

        // Show the Fixed Value column if at least one servo has the "MAX" input assigned
        const $fixedValueCol = $("#servo-mix-table").find(".mixer-fixed-value-col");
        const rules = FC.SERVO_RULES.get();
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


    function labelMotorNumbers() {

        let index = 0;
        var rules;

        if (currentMixerPreset.id == loadedMixerPresetID) {
            rules = FC.MOTOR_RULES.get();
        } else {
            rules = currentMixerPreset.motorMixer;
        }

        if (currentMixerPreset.image != 'quad_x') {
            for (let i = 1; i < 5; i++) {
                $("#motorNumber"+i).css("visibility", "hidden");
            }
        }

        for (const i in rules) {
            if (rules.hasOwnProperty(i)) {
                const rule = rules[i];
                index++;

                if (currentMixerPreset.image != 'quad_x') {
                    continue;
                }

                let top_px = 30;
                let left_px = 28;
                if (rule.getRoll() < -0.5) {
                  left_px = $("#motor-mixer-preview-img").width() - 42;
                }

                if (rule.getPitch() > 0.5) {
                  top_px = $("#motor-mixer-preview-img").height() - 42;
                }
                $("#motorNumber"+index).css("left", left_px + "px");
                $("#motorNumber"+index).css("top", top_px + "px");
                $("#motorNumber"+index).removeClass("is-hidden");
                $("#motorNumber"+index).css("visibility", "visible");
            }
        }
    }


    function renderMotorMixRules() {

        /*
         * Process motor mix table UI
         */
        var rules = FC.MOTOR_RULES.get();
        $motorMixTableBody.find("*").remove();
        let index = 0;
        for (const i in rules) {
            if (rules.hasOwnProperty(i)) {
                const rule = rules[i];
                index++;

                $motorMixTableBody.append('\
                    <tr>\
                    <td><span class="mix-rule-motor"></span></td>\
                    <td>\
                        <input type="number" class="mix-rule-throttle" step="0.001" min="-2" max="2" />\
                        <div class="throttle-warning-text" data-i18n="mixerThrottleWarning" ></div>\
                    </td>\
                    <td><input type="number" class="mix-rule-roll" step="0.001" min="-2" max="2" /></td>\
                    <td><input type="number" class="mix-rule-pitch" step="0.001" min="-2" max="2" /></td>\
                    <td><input type="number" class="mix-rule-yaw" step="0.001" min="-2" max="2" /></td>\
                    <td><span class="btn default_btn narrow red"><a href="#" data-role="role-motor-delete" data-i18n="servoMixerDelete"></a></span></td>\
                    </tr>\
                ');

                const $row = $motorMixTableBody.find('tr:last');

                $row.find('.mix-rule-motor').html(index);
                const $throttleInput = $row.find('.mix-rule-throttle').val(rule.getThrottle());
                const $warningBox = $row.find('.throttle-warning-text');
    
                // Function to update throttle and show/hide warning box
                function updateThrottle() {
                    rule.setThrottle($throttleInput.val());
                    // Change color if value exceeds 1
                    if (parseFloat($throttleInput.val()) > 1 || parseFloat($throttleInput.val()) < 0) {
                        $throttleInput.css('background-color', 'orange');
                        // Show warning box
                        $warningBox.show();
                    } else {
                        $throttleInput.css('background-color', ''); // Reset to default
                        // Hide warning box
                        $warningBox.hide();
                    }
                }
                updateThrottle();
                $throttleInput.on('change', updateThrottle);

                $row.find('.mix-rule-roll').val(rule.getRoll()).on('change', function () {
                    rule.setRoll($(this).val());
                });
                $row.find('.mix-rule-pitch').val(rule.getPitch()).on('change', function () {
                    rule.setPitch($(this).val());
                });
                $row.find('.mix-rule-yaw').val(rule.getYaw()).on('change', function () {
                    rule.setYaw($(this).val());
                });
                $row.find("[data-role='role-motor-delete']").attr("data-index", i);
            }

        }
       labelMotorNumbers();
       i18n.localize();;
    }

    function saveAndReboot() {
        /*
         * Send mixer rules
         */
        FC.SERVO_RULES.cleanup();
        FC.SERVO_RULES.inflate();
        FC.MOTOR_RULES.cleanup();
        FC.MOTOR_RULES.inflate();

        updateTimerOverride();

        saveChainer.execute();
    }

    function processHtml() {

        $servoMixTable = $('#servo-mix-table');
        $servoMixTableBody = $servoMixTable.find('tbody');
        $motorMixTable = $('#motor-mix-table');
        $motorMixTableBody = $motorMixTable.find('tbody');

        function fillMixerPreset() {
            let mixers = mixer.getByPlatform(FC.MIXER_CONFIG.platformType);

            $mixerPreset.find("*").remove();
            for (let i in mixers) {
                if (mixers.hasOwnProperty(i)) {
                    let m = mixers[i];
                    $mixerPreset.append('<option value="' + m.id + '">' + m.name + '</option>');
                }
            }
        }

        let $platformSelect = $('#platform-type'),
            platforms = platform.getList(),
            $mixerPreset = $('#mixer-preset'),
            $wizardButton = $("#mixer-wizard");

        motorWizardModal = new jBox('Modal', {
            width: 480,
            height: 410,
            closeButton: 'title',
            animation: false,
            attach: $wizardButton,
            title: i18n.getMessage("mixerWizardModalTitle"),
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

        $(".wizard-motor-select").on('change', validateMixerWizard);

        $("#wizard-execute-button").on('click', function () {

            // Validate mixer settings
            if (!validateMixerWizard()) {
                return;
            }

            FC.MOTOR_RULES.flush();

            for (let i = 0; i < 4; i++) {
                const $selects = $(".wizard-motor-select");
                let rule = -1;

                $selects.each(function () {
                    if (parseInt($(this).find(":selected").attr("id"), 10) == i) {
                        rule = parseInt($(this).attr("data-motor"), 10);
                    }
                });

                const r = currentMixerPreset.motorMixer[rule];

                FC.MOTOR_RULES.put(
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
            let motorDirectionCheckbox = $('input[name=motor_direction_inverted]:checked');
            const isReversed = motorDirectionCheckbox.val() == 1 && (FC.MIXER_CONFIG.platformType == PLATFORM.MULTIROTOR || FC.MIXER_CONFIG.platformType == PLATFORM.TRICOPTER);

            const path = './resources/motor_order/'
                + currentMixerPreset.image + (isReversed ? "_reverse" : "") + '.svg';
            $('.mixerPreview img').attr('src', path);
            renderServoOutputImage();
        };

        $("#motor_direction_inverted").on('change', updateMotorDirection);

        $platformSelect.find("*").remove();

        for (let i in platforms) {
            if (platforms.hasOwnProperty(i)) {
                let p = platforms[i];
                $platformSelect.append('<option value="' + p.id + '">' + p.name + '</option>');
            }
        }

        $platformSelect.on('change', function () {
            FC.MIXER_CONFIG.platformType = parseInt($platformSelect.val(), 10);
            currentPlatform = platform.getById(FC.MIXER_CONFIG.platformType);

            var $platformSelectParent = $platformSelect.parent('.select');

            fillMixerPreset();
            $mixerPreset.trigger('change');
        });

        currentPlatform = platform.getById(FC.MIXER_CONFIG.platformType);
        $platformSelect.val(FC.MIXER_CONFIG.platformType).trigger('change');

        $mixerPreset.on('change', function () {
            const presetId = parseInt($mixerPreset.val(), 10);
            currentMixerPreset = mixer.getById(presetId);

            FC.MIXER_CONFIG.appliedMixerPreset = presetId;

            if (currentMixerPreset.id == 3) {
                $("#mixer-wizard-gui_box").removeClass("is-hidden");
            } else {
                $("#mixer-wizard-gui_box").addClass("is-hidden");
            }

            if (FC.MIXER_CONFIG.platformType == PLATFORM.AIRPLANE && currentMixerPreset.id != loadedMixerPresetID) {
                $("#needToUpdateMixerMessage").removeClass("is-hidden");
            } else {
                $("#needToUpdateMixerMessage").addClass("is-hidden");
            }

            if (FC.MIXER_CONFIG.platformType == PLATFORM.MULTIROTOR || FC.MIXER_CONFIG.platformType == PLATFORM.TRICOPTER) {
                $('#motor_direction_inverted').parent().removeClass("is-hidden");
                $('#platform-type').parent('.select').removeClass('no-bottom-border');
            } else {
                $('#motor_direction_inverted').parent().addClass("is-hidden");
                $('#platform-type').parent('.select').addClass('no-bottom-border');
            }

            if (!GUI.updateEzTuneTabVisibility(false)) {
                FC.EZ_TUNE.enabled = 0;
                mspHelper.saveEzTune();
            }

            updateRefreshButtonStatus();
            labelMotorNumbers();
            updateMotorDirection();
        });

        if (FC.MIXER_CONFIG.appliedMixerPreset > -1) {
            loadedMixerPresetID = FC.MIXER_CONFIG.appliedMixerPreset;
            $("#needToUpdateMixerMessage").addClass("is-hidden");
            $mixerPreset.val(FC.MIXER_CONFIG.appliedMixerPreset).trigger('change');
        } else {
            $mixerPreset.trigger('change');
        }

        modal = new jBox('Modal', {
            width: 480,
            height: 240,
            closeButton: 'title',
            animation: false,
            attach: $('#load-and-apply-mixer-button'),
            title: i18n.getMessage("mixerApplyModalTitle"),
            content: $('#mixerApplyContent')
        });

        $('#execute-button').on('click', function () {
            loadedMixerPresetID = currentMixerPreset.id;
            mixer.loadServoRules(FC, currentMixerPreset);
            mixer.loadMotorRules(FC, currentMixerPreset);
            FC.MIXER_CONFIG.hasFlaps = (currentMixerPreset.hasFlaps === true) ? true : false;
            renderServoMixRules();
            renderMotorMixRules();
            renderOutputMapping();
            modal.close();
            saveAndReboot();
        });

        $('#load-mixer-button').on('click', function () {
            if (FC.MIXER_CONFIG.platformType == PLATFORM.AIRPLANE) {
                $("#needToUpdateMixerMessage").addClass("is-hidden");
            }
            loadedMixerPresetID = currentMixerPreset.id;
            mixer.loadServoRules(FC, currentMixerPreset);
            mixer.loadMotorRules(FC, currentMixerPreset);
            FC.MIXER_CONFIG.hasFlaps = (currentMixerPreset.hasFlaps === true) ? true : false;
            renderServoMixRules();
            renderMotorMixRules();
            renderOutputMapping();
            updateRefreshButtonStatus();
        });

        $('#refresh-mixer-button').on('click', function () {
            currentMixerPreset = mixer.getById(loadedMixerPresetID);
            FC.MIXER_CONFIG.platformType = currentMixerPreset.platform;
            currentPlatform = platform.getById(FC.MIXER_CONFIG.platformType);
            $platformSelect.val(FC.MIXER_CONFIG.platformType).trigger('change');
            $mixerPreset.val(loadedMixerPresetID).trigger('change');
            renderServoMixRules();
            renderMotorMixRules();
            renderOutputMapping();
        });

        $servoMixTableBody.on('click', "[data-role='role-servo-delete']", function (event) {
            FC.SERVO_RULES.drop($(event.currentTarget).attr("data-index"));
            renderServoMixRules();
            renderOutputMapping();
        });

        $motorMixTableBody.on('click', "[data-role='role-motor-delete']", function (event) {
            FC.MOTOR_RULES.drop($(event.currentTarget).attr("data-index"));
            renderMotorMixRules();
            renderOutputMapping();
        });

        $servoMixTableBody.on('change', "input", function (event) {
            renderOutputMapping();
        });

        $("[data-role='role-servo-add']").on('click', function () {
            if (FC.SERVO_RULES.hasFreeSlots()) {
                FC.SERVO_RULES.put(new ServoMixRule(FC.SERVO_RULES.getNextUnusedIndex(), 0, 100, 0));
                renderServoMixRules();
                renderOutputMapping();
            }
        });

        $("[data-role='role-motor-add']").on('click', function () {
            if (FC.MOTOR_RULES.hasFreeSlots()) {
                FC.MOTOR_RULES.put(new MotorMixRule(1, 0, 0, 0));
                renderMotorMixRules();
                renderOutputMapping();
            }
        });

        $("[data-role='role-logic-conditions-open']").on('click', function () {
            FC.LOGIC_CONDITIONS.open();
        });

        $('#save-button').on('click', saveAndReboot);

        renderServoMixRules();
        renderMotorMixRules();

        renderOutputTable();
        renderOutputMapping();
        renderTimerOverride();

        FC.LOGIC_CONDITIONS.init($('#logic-wrapper'));

        i18n.localize();;

        interval.add('logic_conditions_pull', getLogicConditionsStatus, 350);

        GUI.content_ready(callback);
    }

    function updateRefreshButtonStatus() {
        if (
            (currentMixerPreset.id != loadedMixerPresetID && mixer.getById(loadedMixerPresetID).platform == PLATFORM.AIRPLANE) ||
            (currentMixerPreset.id == loadedMixerPresetID && currentMixerPreset.platform == PLATFORM.AIRPLANE)
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
        FC.LOGIC_CONDITIONS.update(FC.LOGIC_CONDITIONS_STATUS);
    }

};

TABS.mixer.cleanup = function (callback) {
    //delete modal;
    //delete motorWizardModal;
    $('.jBox-wrapper').remove();
    if (callback) callback();
};
