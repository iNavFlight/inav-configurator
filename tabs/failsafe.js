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
           i18n.localize();;

            // for some odd reason chrome 38+ changes scroll according to the touched select element
            // i am guessing this is a bug, since this wasn't happening on 37
            // code below is a temporary fix, which we will be able to remove in the future (hopefully)
            $('#content').scrollTop((scrollPosition) ? scrollPosition : 0);

            // set stage 2 failsafe procedure
            $('input[type="radio"].procedure').on('change', function () {
                var element = $(this),
                    checked = element.is(':checked'),
                    id = element.attr('id');
                switch (id) {
                    case 'drop':
                        if (checked) {
                            $('input[name="failsafe_throttle"]').prop("disabled", true);
                            $('input[name="failsafe_off_delay"]').prop("disabled", true);
                        }
                        break;

                    case 'land':
                        if (checked) {
                            $('input[name="failsafe_throttle"]').prop("disabled", false);
                            $('input[name="failsafe_off_delay"]').prop("disabled", false);
                        }
                        break;
                }
            });

            // switch (MSPHelper.getSetting('failsafe_procedure')) {  // Use once #7734 is merged
            switch (FC.FAILSAFE_CONFIG.failsafe_procedure) {
                default:
                case 0:
                    var element = $('input[id="land"]');
                    element.prop('checked', true);
                    element.trigger('change');
                    break;
                case 1:
                    var element = $('input[id="drop"]');
                    element.prop('checked', true);
                    element.trigger('change');
                    break;
                case 2:
                    var element = $('input[id="rth"]');
                    element.prop('checked', true);
                    element.trigger('change');
                    break;
                case 3:
                    var element = $('input[id="nothing"]');
                    element.prop('checked', true);
                    element.trigger('change');
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

            $('a.save').on('click', function () {
                if ($('input[id="land"]').is(':checked')) {
                    FC.FAILSAFE_CONFIG.failsafe_procedure = 0;
                } else if ($('input[id="drop"]').is(':checked')) {
                    FC.FAILSAFE_CONFIG.failsafe_procedure = 1;
                } else if ($('input[id="rth"]').is(':checked')) {
                    FC.FAILSAFE_CONFIG.failsafe_procedure = 2;
                } else if ($('input[id="nothing"]').is(':checked')) {
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
