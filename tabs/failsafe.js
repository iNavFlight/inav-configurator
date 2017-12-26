'use strict';

TABS.failsafe = {};

TABS.failsafe.initialize = function (callback, scrollPosition) {

    if (GUI.active_tab != 'failsafe') {
        GUI.active_tab = 'failsafe';
        googleAnalytics.sendAppView('Failsafe');
    }

    function load_rx_config() {
        MSP.send_message(MSPCodes.MSP_RX_CONFIG, false, false, load_failssafe_config);
    }

    function load_failssafe_config() {
        MSP.send_message(MSPCodes.MSP_FAILSAFE_CONFIG, false, false, load_rxfail_config);
    }

    function load_rxfail_config() {
        if (semver.lt(CONFIG.flightControllerVersion, "1.6.0")) {
            MSP.send_message(MSPCodes.MSP_RXFAIL_CONFIG, false, false, get_box_names);
        } else {
            get_box_names();
        }
    }

    function get_box_names() {
        if (semver.lt(CONFIG.flightControllerVersion, "1.6.0")) {
            MSP.send_message(MSPCodes.MSP_BOXNAMES, false, false, get_mode_ranges);
        } else {
            get_mode_ranges();
        }
    }

    function get_mode_ranges() {
        if (semver.lt(CONFIG.flightControllerVersion, "1.6.0")) {
            MSP.send_message(MSPCodes.MSP_MODE_RANGES, false, false, get_box_ids);
        } else {
            get_box_ids();
        }
    }

    function get_box_ids() {
        MSP.send_message(MSPCodes.MSP_BOXIDS, false, false, get_rc_data);
    }

    function get_rc_data() {
        MSP.send_message(MSPCodes.MSP_RC, false, false, load_config);
    }

    function load_config() {
        MSP.send_message(MSPCodes.MSP_BF_CONFIG, false, false, load_misc);
    }

    function load_misc() {
        MSP.send_message(MSPCodes.MSP_MISC, false, false, load_html);
    }

    function load_html() {
        $('#content').load("./tabs/failsafe.html", process_html);
    }

    load_rx_config();

    function process_html() {

        if (semver.gte(CONFIG.flightControllerVersion, "1.6.0")) {
            $('.pre-v1_6').hide();
            $('.requires-v1_6').show();
        }

        var failsafeFeature;

        // translate to user-selected language
        localize();

        var $failsafeUseMinimumDistanceCheckbox = $('#failsafe_use_minimum_distance');
        var $failsafeMinDistanceElements = $('#failsafe_min_distance_elements')
        var $failsafeMinDistance = $('#failsafe_min_distance')
        var $failsafeMinDistanceProcedureElements = $('#failsafe_min_distance_procedure_elements')
        var $failsafeMinDistanceProcedure = $('#failsafe_min_distance_procedure');

        // generate labels for assigned aux modes
        var auxAssignment = [],
            i,
            element;

        for (var channelIndex = 0; channelIndex < RC.active_channels - 4; channelIndex++) {
            auxAssignment.push("");
        }

        for (var modeIndex = 0; modeIndex < AUX_CONFIG.length; modeIndex++) {

            var modeId = AUX_CONFIG_IDS[modeIndex];

            // scan mode ranges to find assignments
            for (var modeRangeIndex = 0; modeRangeIndex < MODE_RANGES.length; modeRangeIndex++) {
                var modeRange = MODE_RANGES[modeRangeIndex];

                if (modeRange.id != modeId) {
                    continue;
                }

                var range = modeRange.range;
                if (!(range.start < range.end)) {
                    continue; // invalid!
                }

                var modeName = AUX_CONFIG[modeIndex];                      
                modeName = adjustBoxNameIfPeripheralWithModeID(modeId, modeName);
                auxAssignment[modeRange.auxChannelIndex] += "<span class=\"modename\">" + modeName + "</span>";
            }
        }

        // generate full channel list
        var channelNames = [
                chrome.i18n.getMessage('controlAxisRoll'),
                chrome.i18n.getMessage('controlAxisPitch'),
                chrome.i18n.getMessage('controlAxisYaw'),
                chrome.i18n.getMessage('controlAxisThrottle')
            ],
            fullChannels_e = $('div.activechannellist'),
            aux_assignment_index = 0;

        for (i = 0; i < RXFAIL_CONFIG.length; i++) {
            if (i < channelNames.length) {
                fullChannels_e.append('\
                        <div class="number">\
                            <div class="channelprimary">\
                                <span>' + channelNames[i] + '</span>\
                            </div>\
                            <div class="cf_tip channelsetting" title="' + chrome.i18n.getMessage("failsafeChannelFallbackSettingsAuto") + '">\
                                <select class="aux_set" id="' + i + '">\
                                    <option value="0">Auto</option>\
                                    <option value="1">Hold</option>\
                                </select>\
                            </div>\
                        </div>\
                    ');
            } else {
                fullChannels_e.append('\
                        <div class="number">\
                            <div class="channelauxiliary">\
                                <span class="channelname">' + chrome.i18n.getMessage("radioChannelShort") + (i + 1) + '</span>\
                                ' + auxAssignment[aux_assignment_index++] + '\
                            </div>\
                            <div class="cf_tip channelsetting" title="' + chrome.i18n.getMessage("failsafeChannelFallbackSettingsHold") + '">\
                                <select class="aux_set" id="' + i + '">\
                                    <option value="1">Hold</option>\
                                    <option value="2">Set</option>\
                                </select>\
                            </div>\
                            <div class="auxiliary"><input type="number" name="aux_value" min="750" max="2250" id="' + i + '"/></div>\
                        </div>\
                    ');
            }
        }

        var channel_mode_array = [];
        $('.number', fullChannels_e).each(function () {
            channel_mode_array.push($('select.aux_set', this));
        });

        var channel_value_array = [];
        $('.number', fullChannels_e).each(function () {
            channel_value_array.push($('input[name="aux_value"]', this));
        });

        var channelMode = $('select.aux_set');
        var channelValue = $('input[name="aux_value"]');

        // UI hooks
        channelMode.change(function () {
            var currentMode = parseInt($(this).val());
            var i = parseInt($(this).prop("id"));
            RXFAIL_CONFIG[i].mode = currentMode;
            if (currentMode == 2) {
                channel_value_array[i].prop("disabled", false);
                channel_value_array[i].show();
            } else {
                channel_value_array[i].prop("disabled", true);
                channel_value_array[i].hide();
            }
        });

        // UI hooks
        channelValue.change(function () {
            var i = parseInt($(this).prop("id"));
            RXFAIL_CONFIG[i].value = parseInt($(this).val());
        });

        // for some odd reason chrome 38+ changes scroll according to the touched select element
        // i am guessing this is a bug, since this wasn't happening on 37
        // code below is a temporary fix, which we will be able to remove in the future (hopefully)
        $('#content').scrollTop((scrollPosition) ? scrollPosition : 0);

        // fill stage 1 Valid Pulse Range Settings
        $('input[name="rx_min_usec"]').val(RX_CONFIG.rx_min_usec);
        $('input[name="rx_max_usec"]').val(RX_CONFIG.rx_max_usec);

        // fill fallback settings (mode and value) for all channels
        for (i = 0; i < RXFAIL_CONFIG.length; i++) {
            channel_value_array[i].val(RXFAIL_CONFIG[i].value);
            channel_mode_array[i].val(RXFAIL_CONFIG[i].mode);
            channel_mode_array[i].change();
        }

        var isFailsafeEnabled;

        if (semver.gte(CONFIG.flightControllerVersion, "1.6.0")) {
            isFailsafeEnabled = true;
        } else {
            isFailsafeEnabled = bit_check(BF_CONFIG.features, 8);
        }

        // fill stage 2 fields
        failsafeFeature = $('input[name="failsafe_feature_new"]');
        failsafeFeature.change(function () {
            if ($(this).is(':checked')) {
                $('div.stage2').show();
            } else {
                $('div.stage2').hide();
            }
        });

        failsafeFeature.prop('checked', isFailsafeEnabled);
        failsafeFeature.change();

        $('input[name="failsafe_throttle"]').val(FAILSAFE_CONFIG.failsafe_throttle);
        $('input[name="failsafe_off_delay"]').val(FAILSAFE_CONFIG.failsafe_off_delay);
        $('input[name="failsafe_throttle_low_delay"]').val(FAILSAFE_CONFIG.failsafe_throttle_low_delay);
        $('input[name="failsafe_delay"]').val(FAILSAFE_CONFIG.failsafe_delay);
        if (semver.gte(CONFIG.flightControllerVersion, "1.7.4")) {
            $('input[name="failsafe_min_distance"]').val(FAILSAFE_CONFIG.failsafe_min_distance);
        }

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

        // set stage 2 kill switch option
        $('input[name="failsafe_kill_switch"]').prop('checked', FAILSAFE_CONFIG.failsafe_kill_switch);

        if (semver.gte(CONFIG.flightControllerVersion, "1.7.4")) {
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
            $('.requires-v1_7_4').show();
        } else {
            $('.requires-v1_7_4').hide();
        }

        $('a.save').click(function () {
            // gather data that doesn't have automatic change event bound
            RX_CONFIG.rx_min_usec = parseInt($('input[name="rx_min_usec"]').val());
            RX_CONFIG.rx_max_usec = parseInt($('input[name="rx_max_usec"]').val());

            if (semver.lt(CONFIG.flightControllerVersion, "1.6.0")) {
                if ($('input[name="failsafe_feature_new"]').is(':checked')) {
                    BF_CONFIG.features = bit_set(BF_CONFIG.features, 8);
                } else {
                    BF_CONFIG.features = bit_clear(BF_CONFIG.features, 8);
                }
            }

            FAILSAFE_CONFIG.failsafe_throttle = parseInt($('input[name="failsafe_throttle"]').val());
            FAILSAFE_CONFIG.failsafe_off_delay = parseInt($('input[name="failsafe_off_delay"]').val());
            FAILSAFE_CONFIG.failsafe_throttle_low_delay = parseInt($('input[name="failsafe_throttle_low_delay"]').val());
            FAILSAFE_CONFIG.failsafe_delay = parseInt($('input[name="failsafe_delay"]').val());
            if (semver.gte(CONFIG.flightControllerVersion, "1.7.4")) {
                FAILSAFE_CONFIG.failsafe_min_distance = parseInt($('input[name="failsafe_min_distance"]').val());
            }

            if ($('input[id="land"]').is(':checked')) {
                FAILSAFE_CONFIG.failsafe_procedure = 0;
            } else if ($('input[id="drop"]').is(':checked')) {
                FAILSAFE_CONFIG.failsafe_procedure = 1;
            } else if ($('input[id="rth"]').is(':checked')) {
                FAILSAFE_CONFIG.failsafe_procedure = 2;
            } else if ($('input[id="nothing"]').is(':checked')) {
                FAILSAFE_CONFIG.failsafe_procedure = 3;
            }

            FAILSAFE_CONFIG.failsafe_kill_switch = $('input[name="failsafe_kill_switch"]').is(':checked') ? 1 : 0;

            function save_failssafe_config() {
                MSP.send_message(MSPCodes.MSP_SET_FAILSAFE_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_FAILSAFE_CONFIG), false, save_rxfail_config);
            }

            function save_rxfail_config() {
                if (semver.lt(CONFIG.flightControllerVersion, "1.6.0")) {
                    mspHelper.sendRxFailConfig(save_bf_config);
                } else {
                    save_bf_config();
                }
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

            MSP.send_message(MSPCodes.MSP_SET_RX_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_RX_CONFIG), false, save_failssafe_config);
        });

        GUI.content_ready(callback);
    }
};

TABS.failsafe.cleanup = function (callback) {
    if (callback) callback();
};
