'use strict';

TABS.failsafe = {};

TABS.failsafe.initialize = function (callback, scrollPosition) {

    if (GUI.active_tab != 'failsafe') {
        GUI.active_tab = 'failsafe';
        googleAnalytics.sendAppView('Failsafe');
    }

    function load_failssafe_config() {
        MSP.send_message(MSPCodes.MSP_FAILSAFE_CONFIG, false, false, load_config);
    }

    function load_config() {
        MSP.send_message(MSPCodes.MSP_BF_CONFIG, false, false, load_misc);
    }

    function load_misc() {
        MSP.send_message(MSPCodes.MSP_MISC, false, false, load_html);
    }

    function load_html() {
        GUI.load("./tabs/failsafe.html", process_html);
    }

    load_failssafe_config();

    function process_html() {

        // translate to user-selected language
        localize();

        var $failsafeUseMinimumDistanceCheckbox = $('#failsafe_use_minimum_distance');
        var $failsafeMinDistanceElements = $('#failsafe_min_distance_elements')
        var $failsafeMinDistance = $('#failsafe_min_distance')
        var $failsafeMinDistanceProcedureElements = $('#failsafe_min_distance_procedure_elements')
        var $failsafeMinDistanceProcedure = $('#failsafe_min_distance_procedure');

        // generate labels for assigned aux modes
        var element;

        // for some odd reason chrome 38+ changes scroll according to the touched select element
        // i am guessing this is a bug, since this wasn't happening on 37
        // code below is a temporary fix, which we will be able to remove in the future (hopefully)
        $('#content').scrollTop((scrollPosition) ? scrollPosition : 0);

        $('input[name="failsafe_throttle"]').val(FAILSAFE_CONFIG.failsafe_throttle);
        $('input[name="failsafe_off_delay"]').val(FAILSAFE_CONFIG.failsafe_off_delay);
        $('input[name="failsafe_throttle_low_delay"]').val(FAILSAFE_CONFIG.failsafe_throttle_low_delay);
        $('input[name="failsafe_delay"]').val(FAILSAFE_CONFIG.failsafe_delay);
        $('input[name="failsafe_min_distance"]').val(FAILSAFE_CONFIG.failsafe_min_distance);

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
        $failsafeUseMinimumDistanceCheckbox.change(function() {
            if ($(this).is(':checked')) {
                // 20 meters seems like a reasonable default for a minimum distance
                $failsafeMinDistance.val(2000);
                $failsafeMinDistanceElements.show();
                $failsafeMinDistanceProcedureElements.show();
            } else {
                // If they uncheck it, clear the distance to 0, which disables this feature
                $failsafeMinDistance.val(0);
                $failsafeMinDistanceElements.hide();
                $failsafeMinDistanceProcedureElements.hide();
            }
        });

        // Set initial state of controls according to data
        if (FAILSAFE_CONFIG.failsafe_min_distance > 0) {
            $failsafeUseMinimumDistanceCheckbox.prop('checked', true);
            $failsafeMinDistanceElements.show();
            $failsafeMinDistanceProcedureElements.show();
        } else {
            $failsafeUseMinimumDistanceCheckbox.prop('checked', false);
            $failsafeMinDistanceElements.hide();
            $failsafeMinDistanceProcedureElements.hide();
        }

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
    }
};

TABS.failsafe.cleanup = function (callback) {
    if (callback) callback();
};
