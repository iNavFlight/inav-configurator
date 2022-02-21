'use strict';

TABS.failsafe = {};

TABS.failsafe.initialize = function (callback, scrollPosition) {

    if (GUI.active_tab != 'failsafe') {
        GUI.active_tab = 'failsafe';
        googleAnalytics.sendAppView('Failsafe');
    }

    // Can get rid of this when MSPHelper supports strings (fixed in #7734, awaiting merge)
    function load_failssafe_config() {
        MSP.send_message(MSPCodes.MSP_FAILSAFE_CONFIG, false, false, load_html);
    }

    /* function load_config() {
        MSP.send_message(MSPCodes.MSP_BF_CONFIG, false, false, load_misc);
    }

    function load_misc() {
        MSP.send_message(MSPCodes.MSP_MISC, false, false, load_html);
    }*/

    function load_html() {
        GUI.load("./tabs/failsafe.html", Settings.processHtml(function() {
            GUI.simpleBind();

            // translate to user-selected language
            localize();

            // for some odd reason chrome 38+ changes scroll according to the touched select element
            // i am guessing this is a bug, since this wasn't happening on 37
            // code below is a temporary fix, which we will be able to remove in the future (hopefully)
            $('#content').scrollTop((scrollPosition) ? scrollPosition : 0);

            // set stage 2 failsafe procedure
            $('input[type="radio"].procedure').change(function () {
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
            switch (FAILSAFE_CONFIG.failsafe_procedure) {
                default:
                case 0:
                    element = $('input[id="land"]');
                    element.prop('checked', true);
                    element.change();
                    break;
                case 1:
                    element = $('input[id="drop"]');
                    element.prop('checked', true);
                    element.change();
                    break;
                case 2:
                    element = $('input[id="rth"]');
                    element.prop('checked', true);
                    element.change();
                    break;
                case 3:
                    element = $('input[id="nothing"]');
                    element.prop('checked', true);
                    element.change();
                    break;
            }

            // Adjust Minimum Distance values when checkbox is checked/unchecked
            $('#failsafe_use_minimum_distance').change(function() {
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

            $('a.save').click(function () {
                if ($('input[id="land"]').is(':checked')) {
                    FAILSAFE_CONFIG.failsafe_procedure = 0;
                } else if ($('input[id="drop"]').is(':checked')) {
                    FAILSAFE_CONFIG.failsafe_procedure = 1;
                } else if ($('input[id="rth"]').is(':checked')) {
                    FAILSAFE_CONFIG.failsafe_procedure = 2;
                } else if ($('input[id="nothing"]').is(':checked')) {
                    FAILSAFE_CONFIG.failsafe_procedure = 3;
                }
        
                MSP.send_message(MSPCodes.MSP_SET_FAILSAFE_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_FAILSAFE_CONFIG), false, savePhaseTwo);
            });

            GUI.content_ready(callback);
        }));
    }

    load_failssafe_config();

    function savePhaseTwo() {
        Settings.saveInputs().then(function () {
            var self = this;
            MSP.promise(MSPCodes.MSP_EEPROM_WRITE);
            setTimeout(function () {
                $(self).html(oldText);
            }, 2000);
            reboot();
        });
    }

    function reboot() {
        //noinspection JSUnresolvedVariable
        GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));
        GUI.tab_switch_cleanup(function () {
            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, reinitialize);
        });
    }

    function reinitialize() {
        //noinspection JSUnresolvedVariable
        GUI.log(chrome.i18n.getMessage('deviceRebooting'));
        GUI.handleReconnect($('.tab_failsafe a'));
    }

    /*function process_html() {

        // generate labels for assigned aux modes
        var element;

        

        $('input[name="failsafe_throttle"]').val(FAILSAFE_CONFIG.failsafe_throttle);
        $('input[name="failsafe_off_delay"]').val(FAILSAFE_CONFIG.failsafe_off_delay);
        $('input[name="failsafe_throttle_low_delay"]').val(FAILSAFE_CONFIG.failsafe_throttle_low_delay);
        $('input[name="failsafe_delay"]').val(FAILSAFE_CONFIG.failsafe_delay);
        $('input[name="failsafe_min_distance"]').val(FAILSAFE_CONFIG.failsafe_min_distance);

        

        

        

        // Alternate, minimum distance failsafe procedure
        GUI.fillSelect($failsafeMinDistanceProcedure, FC.getFailsafeProcedure(), FAILSAFE_CONFIG.failsafe_min_distance_procedure);
        $failsafeMinDistanceProcedure.val(FAILSAFE_CONFIG.failsafe_min_distance_procedure);
        $failsafeMinDistanceProcedure.change(function () {
            FAILSAFE_CONFIG.failsafe_min_distance_procedure = $failsafeMinDistanceProcedure.val();
        });

        $('a.save').click(function () {
            FAILSAFE_CONFIG.failsafe_throttle = parseInt($('input[name="failsafe_throttle"]').val());
            FAILSAFE_CONFIG.failsafe_off_delay = parseInt($('input[name="failsafe_off_delay"]').val());
            FAILSAFE_CONFIG.failsafe_throttle_low_delay = parseInt($('input[name="failsafe_throttle_low_delay"]').val());
            FAILSAFE_CONFIG.failsafe_delay = parseInt($('input[name="failsafe_delay"]').val());
            FAILSAFE_CONFIG.failsafe_min_distance = parseInt($('input[name="failsafe_min_distance"]').val());

            if ($('input[id="land"]').is(':checked')) {
                FAILSAFE_CONFIG.failsafe_procedure = 0;
            } else if ($('input[id="drop"]').is(':checked')) {
                FAILSAFE_CONFIG.failsafe_procedure = 1;
            } else if ($('input[id="rth"]').is(':checked')) {
                FAILSAFE_CONFIG.failsafe_procedure = 2;
            } else if ($('input[id="nothing"]').is(':checked')) {
                FAILSAFE_CONFIG.failsafe_procedure = 3;
            }

            function save_failssafe_config() {
                MSP.send_message(MSPCodes.MSP_SET_FAILSAFE_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_FAILSAFE_CONFIG), false, save_bf_config);
            }

            function save_bf_config() {
                MSP.send_message(MSPCodes.MSP_SET_BF_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_BF_CONFIG), false, save_to_eeprom);
            }

            function save_to_eeprom() {
                MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, reboot);
            }

            function reboot() {
                GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));

                GUI.tab_switch_cleanup(function () {
                    MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, reinitialize);
                });
            }

            function reinitialize() {
                GUI.log(chrome.i18n.getMessage('deviceRebooting'));
                GUI.handleReconnect($('.tab_failsafe a'));
            }

            save_failssafe_config();
        });

        GUI.content_ready(callback);
    }*/
};

TABS.failsafe.cleanup = function (callback) {
    if (callback) callback();
};
