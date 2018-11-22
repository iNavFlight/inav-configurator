/*global $,fc,mspHelper,TABS*/
'use strict';

TABS.servos = {};
TABS.servos.initialize = function (callback) {

    if (GUI.active_tab != 'servos') {
        GUI.active_tab = 'servos';
        googleAnalytics.sendAppView('Servos');
    }

    let loadChainer = new MSPChainerClass();

    loadChainer.setChain([
        mspHelper.loadServoMixRules,
        mspHelper.loadServoConfiguration,
        mspHelper.loadOutputMapping,
        mspHelper.loadMixerConfig,
        mspHelper.loadRcData,
        mspHelper.loadBfConfig,
    ]);

    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    let saveChainer = new MSPChainerClass();

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

        let i,
            $tabServos = $(".tab-servos"),
            $servoEmptyTableInfo = $('#servoEmptyTableInfo'),
            $servoConfigTableContainer = $('#servo-config-table-container'),
            $servoConfigTable = $('#servo-config-table'),
            $servoMixTable = $('#servo-mix-table'),
            $servoMixTableBody = $servoMixTable.find('tbody');

        if (SERVO_CONFIG.length == 0) {
            $tabServos.addClass("is-hidden");
            return;
        }

        let servoCheckbox = '',
            servoHeader = '';

        if (semver.lt(CONFIG.flightControllerVersion, "2.0.0")) {

            $servoEmptyTableInfo.hide();

            for (i = 0; i < RC.active_channels - 4; i++) {
                servoHeader = servoHeader + '<th class="short">CH' + (i + 5) + '</th>';
            }
            servoHeader = servoHeader + '<th data-i18n="servosRate"></th><th data-i18n="servosReverse"></th>';

            for (i = 0; i < RC.active_channels; i++) {
                servoCheckbox = servoCheckbox + '<td class="channel"><input type="checkbox"/></td>';
            }

            $servoConfigTable.find('tr.main').append(servoHeader);
        } else {
            $servoConfigTable.find('tr.main').html('\
                <th width="110px" data-i18n="servosName"></th>\
                    <th data-i18n="servosMid"></th>\
                    <th data-i18n="servosMin"></th>\
                    <th data-i18n="servosMax"></th>\
                    <th data-i18n="servosRate"></th>\
                    <th data-i18n="servosReverse"></th>\
                    <th data-i18n="servoOutput"></th>\
                ');
        }

        function process_servos(name, alternate, obj) {

            $servoConfigTable.append('\
                <tr> \
                    <td class="text-center">' + name + '</td>\
                    <td class="middle"><input type="number" min="500" max="2500" value="' + SERVO_CONFIG[obj].middle + '" /></td>\
                    <td class="min"><input type="number" min="500" max="2500" value="' + SERVO_CONFIG[obj].min + '" /></td>\
                    <td class="max"><input type="number" min="500" max="2500" value="' + SERVO_CONFIG[obj].max + '" /></td>\
                    ' + servoCheckbox + '\
                    <td class="text-center rate">\
                    <td class="text-center reverse">\
                    </td>\
                </tr> \
            ');

            let $currentRow = $servoConfigTable.find('tr:last');

            //This routine is pre 2.0 only
            if (SERVO_CONFIG[obj].indexOfChannelToForward >= 0) {
                $currentRow.find('td.channel input').eq(SERVO_CONFIG[obj].indexOfChannelToForward).prop('checked', true);
            }

            // adding select box and generating options
            $currentRow.find('td.rate').append(
                '<input class="rate-input" type="number" min="' + FC.MIN_SERVO_RATE + '" max="' + FC.MAX_SERVO_RATE + '" value="' + Math.abs(SERVO_CONFIG[obj].rate) + '" />'
            );

            $currentRow.find('td.reverse').append(
                '<input type="checkbox" class="reverse-input togglemedium" ' + (SERVO_CONFIG[obj].rate < 0 ? ' checked ' :  '') + '/>'
            );

            $currentRow.data('info', { 'obj': obj });

            if (semver.lt(CONFIG.flightControllerVersion, "2.0.0")) {
                // only one checkbox for indicating a channel to forward can be selected at a time, perhaps a radio group would be best here.
                $currentRow.find('td.channel input').click(function () {
                    if ($(this).is(':checked')) {
                        $(this).parent().parent().find('.channel input').not($(this)).prop('checked', false);
                    }
                });
            } else {

                $currentRow.append('<td class="text-center output"></td>');

                let output,
                    outputString;

                if (MIXER_CONFIG.platformType == PLATFORM_MULTIROTOR || MIXER_CONFIG.platformType == PLATFORM_TRICOPTER) {
                    output = OUTPUT_MAPPING.getMrServoOutput(usedServoIndex);
                } else {
                    output = OUTPUT_MAPPING.getFwServoOutput(usedServoIndex);
                }

                if (output === null) {
                    outputString = "-";
                } else {
                    outputString = "S" + output;
                }

                $currentRow.find('.output').html(outputString);
                //For 2.0 and above hide a row when servo is not configured
                if (!SERVO_RULES.isServoConfigured(obj)) {
                    $currentRow.hide();
                } else {
                    usedServoIndex++;
                }
            }
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
                var rate = parseInt($('.rate-input', this).val());
                if ($('.reverse-input', this).is(':checked')) {
                    rate = -rate;
                }
                SERVO_CONFIG[info.obj].rate = rate;
            });

            //Save configuration to FC
            saveChainer.execute();
        }

        // drop previous table
        $servoConfigTable.find('tr:not(:first)').remove();

        let usedServoIndex = 0;

        for (let servoIndex = 0; servoIndex < 8; servoIndex++) {
            process_servos('Servo ' + servoIndex, '', servoIndex);
        }
        if (usedServoIndex == 0) {
            // No servos configured
            $servoEmptyTableInfo.show();
            $servoConfigTableContainer.hide();
        } else {
            $servoEmptyTableInfo.hide();
            $servoConfigTableContainer.show();
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
