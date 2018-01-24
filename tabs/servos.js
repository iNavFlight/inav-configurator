/*global fc*/
'use strict';

TABS.servos = {};
TABS.servos.initialize = function (callback) {

    if (GUI.active_tab != 'servos') {
        GUI.active_tab = 'servos';
        googleAnalytics.sendAppView('Servos');
    }

    var loadChainer = new MSPChainerClass();

    loadChainer.setChain([
        mspHelper.loadServoConfiguration,
        mspHelper.loadRcData,
        mspHelper.loadBfConfig,
        mspHelper.loadServoMixRules
    ]);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    var saveChainer = new MSPChainerClass();

    saveChainer.setChain([
        mspHelper.sendServoConfigurations,
        mspHelper.saveToEeprom
    ]);
    saveChainer.setExitPoint(function () {
        GUI.log(chrome.i18n.getMessage('servosEepromSave'));
    });

    function load_html() {
        $('#content').load("./tabs/servos.html", process_html);
    }

    function update_ui() {

        var i,
            $tabServos = $(".tab-servos"),
            $servoConfigTable = $('#servo-config-table'),
            $servoMixTable = $('#servo-mix-table'),
            $servoMixTableBody = $servoMixTable.find('tbody');

        if (SERVO_CONFIG.length == 0) {
            $tabServos.addClass("is-hidden");
            return;
        }

        var servoCheckbox = '';
        var servoHeader = '';
        for (i = 0; i < RC.active_channels - 4; i++) {
            servoHeader = servoHeader + '<th class="short">CH' + (i + 5) + '</th>';
        }
        servoHeader = servoHeader + '<th data-i18n="servosDirectionAndRate"></th>';

        for (i = 0; i < RC.active_channels; i++) {
            servoCheckbox = servoCheckbox + '<td class="channel"><input type="checkbox"/></td>';
        }

        $servoConfigTable.find('tr.main').append(servoHeader);

        function process_servos(name, alternate, obj) {

            $servoConfigTable.append('\
                <tr> \
                    <td style="text-align: center">' + name + '</td>\
                    <td class="middle"><input type="number" min="500" max="2500" value="' + SERVO_CONFIG[obj].middle + '" /></td>\
                    <td class="min"><input type="number" min="500" max="2500" value="' + SERVO_CONFIG[obj].min + '" /></td>\
                    <td class="max"><input type="number" min="500" max="2500" value="' + SERVO_CONFIG[obj].max + '" /></td>\
                    ' + servoCheckbox + '\
                    <td class="direction">\
                    </td>\
                </tr> \
            ');

            if (SERVO_CONFIG[obj].indexOfChannelToForward >= 0) {
                $servoConfigTable.find('tr:last td.channel input').eq(SERVO_CONFIG[obj].indexOfChannelToForward).prop('checked', true);
            }

            // adding select box and generating options
            $servoConfigTable.find('tr:last td.direction').append('<select class="rate" name="rate"></select>');

            var select = $servoConfigTable.find('tr:last td.direction select');

            for (var i = FC.MAX_SERVO_RATE; i >= FC.MIN_SERVO_RATE; i--) {
                select.append('<option value="' + i + '">Rate: ' + i + '%</option>');
            }

            // select current rate
            select.val(SERVO_CONFIG[obj].rate);

            $servoConfigTable.find('tr:last').data('info', { 'obj': obj });

            // UI hooks

            // only one checkbox for indicating a channel to forward can be selected at a time, perhaps a radio group would be best here.
            $servoConfigTable.find('tr:last td.channel input').click(function () {
                if ($(this).is(':checked')) {
                    $(this).parent().parent().find('.channel input').not($(this)).prop('checked', false);
                }
            });
        }

        function servos_update(save_configuration_to_eeprom) {
            $servoConfigTable.find('tr:not(".main")').each(function () {
                var info = $(this).data('info');


                var selection = $('.channel input', this);
                var channelIndex = parseInt(selection.index(selection.filter(':checked')));
                if (channelIndex == -1) {
                    channelIndex = undefined;
                }

                SERVO_CONFIG[info.obj].indexOfChannelToForward = channelIndex;

                SERVO_CONFIG[info.obj].middle = parseInt($('.middle input', this).val());
                SERVO_CONFIG[info.obj].min = parseInt($('.min input', this).val());
                SERVO_CONFIG[info.obj].max = parseInt($('.max input', this).val());
                SERVO_CONFIG[info.obj].rate = parseInt($('.direction select', this).val());
            });

            //Save configuration to FC
            saveChainer.execute();

        }

        // drop previous table
        $servoConfigTable.find('tr:not(:first)').remove();

        for (var servoIndex = 0; servoIndex < 8; servoIndex++) {
            process_servos('Servo ' + servoIndex, '', servoIndex, false);
        }

        // UI hooks for dynamically generated elements
        $('table.directions select, table.directions input, #servo-config-table select, #servo-config-table input').change(function () {
            if ($('div.live input').is(':checked')) {
                // apply small delay as there seems to be some funky update business going wrong
                helper.timeout.add('servos_update', servos_update, 10);
            }
        });

        $('a.update').click(function () {
            servos_update(true);
        });

        $servoMixTableBody.on('click', "[data-role='role-delete']", function (event) {
            SERVO_RULES.drop($(event.currentTarget).attr("data-index"));
            renderServoMixRules();
        });

        $("[data-role='role-add']").click(function () {
            if (SERVO_RULES.hasFreeSlots()) {
                SERVO_RULES.put(new ServoMixRule(0, 0, 0, 0));
                renderServoMixRules();
            }
        });

        function renderServoMixRules() {
            /*
             * Process servo mix table UI
             */
            var rules = SERVO_RULES.get();
            $servoMixTableBody.find("*").remove();
            for (servoRuleIndex in rules) {
                if (rules.hasOwnProperty(servoRuleIndex)) {
                    const servoRule = rules[servoRuleIndex];

                    $servoMixTableBody.append('\
                        <tr>\
                        <td><input type="number" class="mix-rule-servo" step="1" min="0" max="7" /></td>\
                        <td><select class="mix-rule-input"></select></td>\
                        <td><input type="number" class="mix-rule-rate" step="1" min="-100" max="100" /></td>\
                        <td><input type="number" class="mix-rule-speed" step="1" min="0" max="255" /></td>\
                        <td><span class="btn default_btn narrow"><a href="#" data-role="role-delete" data-i18n="servoMixerDelete"></a></span></td>\
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
                    
                    $row.find("[data-role='role-delete']").attr("data-index", servoRuleIndex);
                }

            }
            localize();
        }

        renderServoMixRules();

    }

    function process_html() {

        update_ui();

        // translate to user-selected language
        localize();

        GUI.content_ready(callback);
    }
};

TABS.servos.cleanup = function (callback) {
    if (callback) callback();
};
