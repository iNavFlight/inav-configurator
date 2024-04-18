// Disabled via main.js/main.html, cleanflight does not use MSP_BOX.

'use strict';

const path = require('path');

const mspHelper = require('./../js/msp/MSPHelper');
const MSPCodes = require('./../js/msp/MSPCodes');
const MSP = require('./../js/msp');
const { GUI, TABS } = require('./../js/gui');
const FC = require('./../js/fc');
const interval = require('./../js/intervals');
const BitHelper = require('./../js/bitHelper');
const i18n = require('./../js/localization');

TABS.modes = {};
TABS.modes.initialize = function (callback) {
    var self = this;

    if (GUI.active_tab != 'modes') {
        GUI.active_tab = 'modes';
    }

    function get_active_box_data() {
        MSP.send_message(MSPCodes.MSP_ACTIVEBOXES, false, false, get_box_ids);
    }

    function get_box_ids() {
        MSP.send_message(MSPCodes.MSP_BOXIDS, false, false, get_rc_data);
    }

    function get_rc_data() {
        MSP.send_message(MSPCodes.MSP_RC, false, false, load_html);
    }

    function load_html() {
        GUI.load(path.join(__dirname, "modes.html"), process_html);
    }

    MSP.send_message(MSPCodes.MSP_BOXNAMES, false, false, get_active_box_data);

    function process_html() {
        // generate heads according to RC count
        var table_head = $('table.boxes .heads');
        var main_head = $('table.boxes .main');
        for (var i = 0; i < (FC.RC.active_channels - 4); i++) {
            table_head.append('<th colspan="3">AUX ' + (i + 1) + '</th>');

            // 3 columns per aux channel (this might be requested to change to 6 in the future, so watch out)
            main_head.append('\
                <th i18n="auxiliaryLow"></th>\
                <th i18n="auxiliaryMed"></th>\
                <th i18n="auxiliaryHigh"></th>\
            ');
        }

        // translate to user-selected language
       i18n.localize();;

        // generate table from the supplied AUX names and AUX data
        for (var i = 0; i < FC.AUX_CONFIG.length; i++) {
            var line = '<tr class="switches">';
            line += '<td class="name">' + FC.AUX_CONFIG[i] + '</td>';

            for (var j = 0; j < (RC.active_channels - 4) * 3; j++) {
                if (BitHelper.bit_check(FC.AUX_CONFIG_values[i], j)) {
                    line += '<td><input type="checkbox" checked="checked" /></td>';
                } else {
                    line += '<td><input type="checkbox" /></td>';
                }
            }

            line += '</tr>';

            $('.boxes > tbody:last').append(line);
        }

        // UI Hooks
        $('a.update').on('click', function () {
            // catch the input changes
            var main_needle = 0,
                needle = 0;

            $('.boxes input').each(function () {
                if ($(this).is(':checked')) {
                    FC.AUX_CONFIG_values[main_needle] = BitHelper.bit_set(FC.AUX_CONFIG_values[main_needle], needle);
                } else {
                    FC.AUX_CONFIG_values[main_needle] = BitHelper.bit_clear(FC.AUX_CONFIG_values[main_needle], needle);
                }

                needle++;

                if (needle >= (FC.RC.active_channels - 4) * 3) { // 1 aux * 3 checkboxes, 4 AUX = 12 bits per line
                    main_needle++;
                    needle = 0;
                }
            });

            function save_to_eeprom() {
                MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, function () {
                    GUI.log(i18n.getMessage('auxiliaryEepromSaved'));
                });
            }

            MSP.send_message(MSPCodes.MSP_SET_BOX, mspHelper.crunch(MSPCodes.MSP_SET_BOX), false, save_to_eeprom);
        });

        // val = channel value
        // aux_num = position of corresponding aux channel in the html table
        var switches_e = $('table.boxes .switches');
        function box_highlight(aux_num, val) {
            var pos = 0; // < 1300

            if (val > 1300 && val < 1700) {
                pos = 1;
            } else if (val > 1700) {
                pos = 2;
            }

            var highlight_column = (aux_num * 3) + pos + 2; // +2 to skip name column and index starting on 1 instead of 0
            var erase_columns = (aux_num * 3) + 2;

            $('td:nth-child(n+' + erase_columns + '):nth-child(-n+' + (erase_columns + 2) + ')', switches_e).css('background-color', 'transparent');
            $('td:nth-child(' + highlight_column + ')', switches_e).css('background-color', 'orange');
        }

        // data pulling functions used inside interval timer
        function get_rc_data() {
            MSP.send_message(MSPCodes.MSP_RC, false, false, update_ui);
        }

        function update_ui() {
            for (var i = 0; i < FC.AUX_CONFIG.length; i++) {
                if (FC.isModeBitSet(i)) {
                    $('td.name').eq(i).addClass('on').removeClass('off');
                } else {
                    $('td.name').eq(i).removeClass('on').removeClass('off');

                    if (FC.AUX_CONFIG_values[i] > 0) {
                        $('td.name').eq(i).addClass('off');
                    }
                }

            }

            for (var i = 0; i < (FC.RC.active_channels - 4); i++) {
                box_highlight(i, FC.RC.channels[i + 4]);
            }
        }

        // update ui instantly on first load
        update_ui();

        // enable data pulling
        interval.add('aux_data_pull', get_rc_data, 50);

        GUI.content_ready(callback);
    }
};

TABS.modes.cleanup = function (callback) {
    if (callback) callback();
};
