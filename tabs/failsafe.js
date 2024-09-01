'use strict';

const path = require('path');

const mspHelper = require('./../js/msp/MSPHelper');
const MSPCodes = require('./../js/msp/MSPCodes');
const MSP = require('./../js/msp');
const { GUI, TABS } = require('./../js/gui');
const FC = require('./../js/fc');
const Settings = require('./../js/settings');
const i18n = require('./../js/localization');

TABS.failsafe = {};

TABS.failsafe.initialize = function (callback, scrollPosition) {

    if (GUI.active_tab != 'failsafe') {
        GUI.active_tab = 'failsafe';
    }

    // Can get rid of this when MSPHelper supports strings (fixed in #7734, awaiting merge)
    function load_failssafe_config() {
        MSP.send_message(MSPCodes.MSP_FAILSAFE_CONFIG, false, false, load_html);
    }

    function load_html() {
        GUI.load(path.join(__dirname, "failsafe.html"), Settings.processHtml(function() {
            GUI.simpleBind();

            // translate to user-selected language
           i18n.localize();

            // for some odd reason chrome 38+ changes scroll according to the touched select element
            // i am guessing this is a bug, since this wasn't happening on 37
            // code below is a temporary fix, which we will be able to remove in the future (hopefully)
            $('#content').scrollTop((scrollPosition) ? scrollPosition : 0);

            // set stage 2 failsafe procedure
            $('#procedure').on('change', function() {
                let procedure = $('#procedure').val();
                if (procedure === 'land') {
                    $('input[name="failsafe_throttle"]').prop("disabled", false);
                    $('input[name="failsafe_off_delay"]').prop("disabled", false);
                } else {
                    $('input[name="failsafe_throttle"]').prop("disabled", true);
                    $('input[name="failsafe_off_delay"]').prop("disabled", true);
                }
                $('#procedure-visualization')
                    .removeClass('procedure-land procedure-drop procedure-rth procedure-nothing')
                    .addClass('procedure-' + procedure);
            })

            // switch (MSPHelper.getSetting('failsafe_procedure')) {  // Use once #7734 is merged
            switch (FC.FAILSAFE_CONFIG.failsafe_procedure) {
                case 0:
                    $('#procedure').val('land').trigger('change');
                    break;
                case 1:
                    $('#procedure').val('drop').trigger('change');
                    break;
                case 2:
                    $('#procedure').val('rth').trigger('change');
                    break;
                case 3:
                    $('#procedure').val('nothing').trigger('change');
                    break;
                default:
                    break;
            }


            // Adjust Minimum Distance values when checkbox is checked/unchecked
            $('#failsafe_use_minimum_distance').on('change', function () {
                if ($(this).is(':checked')) {
                    // No default distance added due to conversions
                    $('#failsafe_min_distance_elements').show();
                    $('#failsafe_min_distance_procedure_elements').show();
                } else {
                    // If they uncheck it, clear the distance to 0, which disables this feature
                    $('#failsafe_min_distance').val(0);
                    $('#failsafe_min_distance_elements').hide();
                    $('#failsafe_min_distance_procedure_elements').hide();
                }
            });

            // Set initial state of controls according to data
            if ( $('#failsafe_min_distance').val() > 0) {
                $('#failsafe_use_minimum_distance').prop('checked', true);
                $('#failsafe_min_distance_elements').show();
                $('#failsafe_min_distance_procedure_elements').show();
            } else {
                $('#failsafe_use_minimum_distance').prop('checked', false);
                $('#failsafe_min_distance_elements').hide();
                $('#failsafe_min_distance_procedure_elements').hide();
            }

            $('#save-btn').on('click', function () {
                let procedure = $('#procedure').val();

                if (procedure === 'land') {
                    FC.FAILSAFE_CONFIG.failsafe_procedure = 0;
                } else if (procedure === 'drop') {
                    FC.FAILSAFE_CONFIG.failsafe_procedure = 1;
                } else if (procedure === 'rth') {
                    FC.FAILSAFE_CONFIG.failsafe_procedure = 2;
                } else if (procedure === 'nothing') {
                    FC.FAILSAFE_CONFIG.failsafe_procedure = 3;
                }
        
                MSP.send_message(MSPCodes.MSP_SET_FAILSAFE_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_FAILSAFE_CONFIG), false, savePhaseTwo);
            });

            GUI.content_ready(callback);
        }));
    }

    load_failssafe_config();

    function save_to_eeprom() {
        console.log('save_to_eeprom');
        MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, function () {
            GUI.log(i18n.getMessage('eepromSaved'));

            GUI.tab_switch_cleanup(function () {
                MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function () {
                    GUI.log(i18n.getMessage('deviceRebooting'));
                    GUI.handleReconnect($('.tab_failsafe a'));
                });
            });
        });
    }

    function savePhaseTwo() {
        Settings.saveInputs(save_to_eeprom);
    }
};

TABS.failsafe.cleanup = function (callback) {
    if (callback) callback();
};
