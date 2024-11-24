'use strict';


const path = require('path');
const wNumb = require('wnumb/wNumb')
const Store = require('electron-store');
const store = new Store();

const mspHelper = require('./../js/msp/MSPHelper');
const MSPCodes = require('./../js/msp/MSPCodes');
const MSP = require('./../js/msp');
const { GUI, TABS } = require('./../js/gui');
const FC = require('./../js/fc');
const adjustBoxNameIfPeripheralWithModeID = require('./../js/peripherals');
const i18n = require('./../js/localization');
const interval = require('./../js/intervals');

var ORIG_AUX_CONFIG_IDS = [];

TABS.auxiliary = {};

TABS.auxiliary.initialize = function (callback) {
    GUI.active_tab_ref = this;
    GUI.active_tab = 'auxiliary';

    let LOCAL_AUX_CONFIG = [];
    let LOCAL_AUX_CONFIG_IDS = [];
    let prevChannelsValues = null;

    MSP.send_message(MSPCodes.MSP_MODE_RANGES, false, false, get_box_ids);

    function get_box_ids() {
        MSP.send_message(MSPCodes.MSP_BOXIDS, false, false, function () {
            FC.generateAuxConfig();

            //Copy global settings into local ones
            LOCAL_AUX_CONFIG = Array.from(FC.AUX_CONFIG);
            LOCAL_AUX_CONFIG_IDS = Array.from(FC.AUX_CONFIG_IDS);

            get_rc_data();
        });
    }

    function get_rc_data() {
        MSP.send_message(MSPCodes.MSP_RC, false, false, load_html);
    }

    function load_html() {
        sort_modes_for_display();
        GUI.load(path.join(__dirname, "auxiliary.html"), process_html);
    }

    // This object separates out the dividers. This is also used to order the modes
    const modeSections = {};
        modeSections["Arming"] = ["ARM", "PREARM"];
        modeSections["Flight Modes"] = ["ANGLE", "HORIZON", "MANUAL", "ANGLE HOLD"];
        modeSections["Navigation Modes"] = ["NAV COURSE HOLD", "NAV CRUISE", "NAV POSHOLD", "NAV RTH", "NAV WP", "GCS NAV"];
        modeSections["Flight Mode Modifiers"] = ["NAV ALTHOLD", "HEADING HOLD", "AIR MODE", "SOARING", "SURFACE", "TURN ASSIST"];
        modeSections["Fixed Wing"] = ["AUTO TUNE", "SERVO AUTOTRIM", "AUTO LEVEL TRIM", "NAV LAUNCH", "LOITER CHANGE", "FLAPERON"];
        modeSections["Multi-rotor"] = ["FPV ANGLE MIX", "TURTLE", "MC BRAKING", "HEADFREE", "HEADADJ"];
        modeSections["OSD Modes"] = ["OSD OFF", "OSD ALT 1", "OSD ALT 2", "OSD ALT 3"];
        modeSections["FPV Camera Modes"] = ["CAMSTAB", "CAMERA CONTROL 1", "CAMERA CONTROL 2", "CAMERA CONTROL 3"];
        modeSections["VTOL"] = ["MIXER PROFILE 2", "MIXER TRANSITION"];
        modeSections["Beeper"] = ["BEEPER", "BEEPER MUTE"];
        modeSections["Gimbal"] = ["GIMBAL LEVEL TILT", "GIMBAL LEVEL ROLL", "GIMBAL LEVEL PAN", "GIMBAL HEADTRACKER", "GIMBAL CENTER"];
        modeSections["Misc Modes"] = ["LEDS OFF", "LIGHTS", "HOME RESET", "WP PLANNER", "MISSION CHANGE", "BLACKBOX", "FAILSAFE", "KILLSWITCH", "TELEMETRY", "MSP RC OVERRIDE", "USER1", "USER2", "USER3", "USER4"];

    function sort_modes_for_display() {
        // Sort the modes
        var tmpAUX_CONFIG = [];
        var tmpAUX_CONFIG_IDS =[];
        var found = false;
        var sortedID = 0;

        for (let i=0; i<LOCAL_AUX_CONFIG.length; i++) {
            tmpAUX_CONFIG[i] = LOCAL_AUX_CONFIG[i];
            tmpAUX_CONFIG_IDS[i] = LOCAL_AUX_CONFIG_IDS[i];
        }

        LOCAL_AUX_CONFIG = [];
        LOCAL_AUX_CONFIG_IDS = [];

        for (let categoryModesIndex in modeSections) {
            let categoryModes = modeSections[categoryModesIndex];
            for (let cM=0; cM<categoryModes.length; cM++){
                for(let j=0; j<tmpAUX_CONFIG.length; j++) {
                    if (categoryModes[cM] === tmpAUX_CONFIG[j]) {
                        LOCAL_AUX_CONFIG[sortedID] = tmpAUX_CONFIG[j];
                        LOCAL_AUX_CONFIG_IDS[sortedID] = tmpAUX_CONFIG_IDS[j];
                        ORIG_AUX_CONFIG_IDS[sortedID++] = j;

                        break;
                    }
                }
            }
        }

        // There are modes that are missing from the modeSections object. Add them to the end until they are ordered correctly.
        if (tmpAUX_CONFIG.length > LOCAL_AUX_CONFIG.length) {
            for (let i=0; i<tmpAUX_CONFIG.length; i++) {
                found = false;
                for (let j=0; j<LOCAL_AUX_CONFIG.length; j++) {
                    if (tmpAUX_CONFIG[i] === LOCAL_AUX_CONFIG[j]) {
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    LOCAL_AUX_CONFIG[sortedID] = tmpAUX_CONFIG[i];
                    LOCAL_AUX_CONFIG_IDS[sortedID] = tmpAUX_CONFIG_IDS[i];
                    ORIG_AUX_CONFIG_IDS[sortedID++] = i;
                }
            }
        }
    }

    function createModeSection(sectionName) {
        var modeSectionTemplate = $('#tab-auxiliary-templates .modeSection');
        var newModeSection = modeSectionTemplate.clone();
        $(newModeSection).attr('id', 'section-' + sectionName);
        $(newModeSection).find('.modeSectionName').text(sectionName);

        return newModeSection;
    }

    function createMode(modeIndex, modeId) {
        var modeTemplate = $('#tab-auxiliary-templates .mode');
        var newMode = modeTemplate.clone();
        var modeName = LOCAL_AUX_CONFIG[modeIndex];

        // If the runcam split peripheral is used, then adjust the boxname(BOXCAMERA1, BOXCAMERA2, BOXCAMERA3)
        // If platform is fixed wing, rename POS HOLD to LOITER
        modeName = adjustBoxNameIfPeripheralWithModeID(modeId, modeName);

        $(newMode).attr('id', 'mode-' + modeIndex);
        $(newMode).find('.name').text(modeName);

        $(newMode).data('index', modeIndex);
        $(newMode).data('id', modeId);
        $(newMode).data('origId', ORIG_AUX_CONFIG_IDS[modeIndex]);
        $(newMode).data('modeName', LOCAL_AUX_CONFIG[modeIndex]);

        $(newMode).find('.name').data('modeElement', newMode);
        $(newMode).find('a.addRange').data('modeElement', newMode);

        return newMode;
    }

    function configureRangeTemplate(auxChannelCount) {

        var rangeTemplate = $('#tab-auxiliary-templates .range');

        var channelList = $(rangeTemplate).find('.channel');
        var channelOptionTemplate = $(channelList).find('option');
        channelOptionTemplate.remove();

        //add value to autodetect channel
        let channelOption = channelOptionTemplate.clone();
        channelOption.text(i18n.getMessage('auxiliaryAutoChannelSelect'));
        channelOption.val(-1);
        channelList.append(channelOption);

        for (var channelIndex = 0; channelIndex < auxChannelCount; channelIndex++) {
            channelOption = channelOptionTemplate.clone();
            channelOption.text('CH ' + (channelIndex + 5));
            channelOption.val(channelIndex);
            channelList.append(channelOption);
        }
        channelList.val(0);
    }

    function addRangeToMode(modeElement, auxChannelIndex, range) {
        var modeIndex = $(modeElement).data('index');

        var channel_range = {
                'min': [  900 ],
                'max': [ 2100 ]
            };

        var rangeValues = [1300, 1700]; // matches MultiWii default values for the old checkbox MID range.
        if (range != undefined) {
            rangeValues = [range.start, range.end];
        }

        var rangeIndex = $(modeElement).find('.range').length;

        var rangeElement = $('#tab-auxiliary-templates .range').clone();
        rangeElement.attr('id', 'mode-' + modeIndex + '-range-' + rangeIndex);
        modeElement.find('.ranges').append(rangeElement);

        $(rangeElement).find('.channel-slider').noUiSlider({
            start: rangeValues,
            behaviour: 'snap-drag',
            margin: 50,
            step: 25,
            connect: true,
            range: channel_range,
            format: wNumb({
                decimals: 0
            })
        });

        var elementName =  '#mode-' + modeIndex + '-range-' + rangeIndex;
        $(elementName + ' .channel-slider').Link('lower').to($(elementName + ' .lowerLimitValue'));
        $(elementName + ' .channel-slider').Link('upper').to($(elementName + ' .upperLimitValue'));

        $(rangeElement).find(".pips-channel-range").noUiSlider_pips({
            mode: 'values',
            values: [900, 1000, 1200, 1400, 1500, 1600, 1800, 2000, 2100],
            density: 4,
            stepped: true
        });

        $(rangeElement).find('.deleteRange').data('rangeElement', rangeElement);

        $(rangeElement).find('a.deleteRange').on('click', function () {
            var rangeElement = $(this).data('rangeElement');
            modeElement.removeClass('inRange');
            rangeElement.remove();
        });

        $(rangeElement).find('.channel').val(auxChannelIndex);

    }

    function process_html() {

        var auxChannelCount = FC.RC.active_channels - 4;

        configureRangeTemplate(auxChannelCount);

        var modeTableBodyElement = $('.tab-auxiliary .modes tbody');
        let modeSelectionID = "";
        let modeSelectionRange = "";

        for (var modeIndex = 0; modeIndex < LOCAL_AUX_CONFIG.length; modeIndex++) {
            // Get current mode category
            for (modeSelectionRange in modeSections) {
                if (modeSections[modeSelectionRange].indexOf(LOCAL_AUX_CONFIG[modeIndex]) != -1) {
                    break;
                }
            }

            // Create divider if needed
            if (modeSelectionRange != modeSelectionID) {
                modeSelectionID = modeSelectionRange;
                var newSection = createModeSection(modeSelectionRange);
                modeTableBodyElement.append(newSection);
            }

            var modeId = LOCAL_AUX_CONFIG_IDS[modeIndex];
            var newMode = createMode(modeIndex, modeId);
            modeTableBodyElement.append(newMode);

            // generate ranges from the supplied AUX names and MODE_RANGE data
            for (var modeRangeIndex = 0; modeRangeIndex < FC.MODE_RANGES.length; modeRangeIndex++) {
                var modeRange = FC.MODE_RANGES[modeRangeIndex];

                if (modeRange.id != modeId) {
                    continue;
                }

                var range = modeRange.range;
                if (!(range.start < range.end)) {
                    continue; // invalid!
                }

                addRangeToMode(newMode, modeRange.auxChannelIndex, range)
            }

        }

        function findFirstUnusedChannel(modeElement) {
            var auxChannelIndexCandidates = [];
            for (var auxChannelIndex = 0; auxChannelIndex < auxChannelCount; auxChannelIndex++) {
                auxChannelIndexCandidates.push(auxChannelIndex);
            }

            $(modeElement).find('.channel').each( function() {
                var valueToRemove = $(this).val();
                auxChannelIndexCandidates = auxChannelIndexCandidates.filter(function(item) {
                    return item != valueToRemove;
                });
            });

            return auxChannelIndexCandidates[0];
        }

        $('a.addRange').on('click', function () {
            var modeElement = $(this).data('modeElement');
            addRangeToMode(modeElement, -1);
        });

        // translate to user-selected language
       i18n.localize();;

        // UI Hooks
        $('a.save').on('click', function () {

            // update internal data structures based on current UI elements

            // we must send this many back to the FC - overwrite all of the old ones to be sure.
            var requiredModesRangeCount = FC.MODE_RANGES.length;

            FC.MODE_RANGES = [];

            var uniqueModes = [];

            $('.tab-auxiliary .modes .mode').each(function () {
                var modeElement = $(this);
                var modeId = modeElement.data('id');
                $(modeElement).find('.range').each(function() {

                    var rangeValues = $(this).find('.channel-slider').val();
                    var modeRange = {
                        id: modeId,
                        auxChannelIndex: parseInt($(this).find('.channel').val()),
                        range: {
                            start: rangeValues[0],
                            end: rangeValues[1]
                        }
                    };

                    uniqueModes.push(modeElement.find('.name').text());

                    FC.MODE_RANGES.push(modeRange);
                });
            });

            for (var modeRangeIndex = FC.MODE_RANGES.length; modeRangeIndex < requiredModesRangeCount; modeRangeIndex++) {
                var defaultModeRange = {
                    id: 0,
                    auxChannelIndex: 0,
                    range: {
                        start: 900,
                        end: 900
                    }
                };
                FC.MODE_RANGES.push(defaultModeRange);
            }
            //
            // send data to FC
            //
            mspHelper.sendModeRanges(save_to_eeprom);

            function save_to_eeprom() {
                MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, function () {
                    GUI.log(i18n.getMessage('auxiliaryEepromSaved'));
                });
            }
        });


        function update_marker(auxChannelIndex, channelPosition) {

            if (channelPosition < 900) {
                channelPosition = 900;
            } else if (channelPosition > 2100) {
                channelPosition = 2100;
            }

            var percentage = (channelPosition - 900) / (2100-900) * 100;

            $('.modes .ranges .range').each( function () {
                var auxChannelCandidateIndex = $(this).find('.channel').val();
                if (auxChannelCandidateIndex != auxChannelIndex) {
                    return;
                }

                $(this).find('.marker').css('left', percentage + '%');
            });
        }

        // data pulling functions used inside interval timer
        function get_rc_data() {
            MSP.send_message(MSPCodes.MSP_RC, false, false, update_ui);
        }

        function update_ui() {
            let hasUsedMode = false;
            let acroEnabled = true;
            let acroFail = ["ANGLE", "HORIZON", "MANUAL", "ANGLE HOLD", "NAV RTH", "NAV POSHOLD", "NAV CRUISE", "NAV COURSE HOLD", "NAV WP", "GCS NAV"];

            var auxChannelCount = FC.RC.active_channels - 4;

            for (var i = 0; i < (auxChannelCount); i++) {
                update_marker(i, FC.RC.channels[i + 4]);
            }

            for (var i = 0; i < LOCAL_AUX_CONFIG.length; i++) {
                var modeElement = $('#mode-' + i);
                let inRange = false;

                if (modeElement.find(' .range').length == 0) {
                    // if the mode is unused, skip it
                    modeElement.removeClass('off').removeClass('on');
                    continue;
                }

                if (FC.isModeBitSet(modeElement.data('origId'))) {
                    // The flight controller can activate the mode
                    $('.mode .name').eq(modeElement.data('index')).data('modeElement').addClass('on').removeClass('inRange').removeClass('off');

                    if (jQuery.inArray(modeElement.data('modeName'), acroFail) !== -1) {
                        acroEnabled = false;
                    }
                } else {
                    // Check to see if the mode is in range
                    var modeRanges = modeElement.find(' .range');
                    for (let r = 0; r < modeRanges.length; r++) {
                        var rangeLow = $(modeRanges[r]).find('.lowerLimitValue').html();
                        var rangeHigh = $(modeRanges[r]).find('.upperLimitValue').html();
                        var markerPosition = $(modeRanges[r]).find('.marker')[0].style.left;
                        markerPosition = markerPosition.substring(0, markerPosition.length-1);

                        rangeLow = (rangeLow - 900) / (2100-900) * 100;
                        rangeHigh = (rangeHigh - 900) / (2100-900) * 100;

                        if ((markerPosition >= rangeLow) && (markerPosition <= rangeHigh)) {
                            inRange = true;
                        }
                    }

                    if (inRange) {
                        $('.mode .name').eq(modeElement.data('index')).data('modeElement').removeClass('on').addClass('inRange').removeClass('off');

                        if (jQuery.inArray(modeElement.data('modeName'), acroFail) !== -1) {
                            acroEnabled = false;
                        }
                    } else {
                        // If not, it is shown as disabled.
                        $('.mode .name').eq(modeElement.data('index')).data('modeElement').removeClass('on').removeClass('inRange').addClass('off');
                    }
                }
                hasUsedMode = true;
            }

            if (acroEnabled) {
                $('.acroEnabled').addClass('on').removeClass('off');
            } else {
                $('.acroEnabled').removeClass('on').addClass('off');
            }

            let hideUnused = hideUnusedModes && hasUsedMode;
            for (let i = 0; i < LOCAL_AUX_CONFIG.length; i++) {
                let modeElement = $('#mode-' + i);
                if (modeElement.find(' .range').length == 0) {
                    modeElement.toggle(!hideUnused);
                }
            }

           auto_select_channel(FC.RC.channels, FC.RC.active_channels, FC.MISC.rssi_channel);

            $(".modeSection").each(function() {
                $(this).toggle(!hideUnused);
            });
        }

        /**
         * Autodetect channel based on maximum deference with previous value
         * minimum value to autodetect is 100
         */
        function auto_select_channel(RC_channels, activeChannels, RSSI_channel) {
            const auto_option = $('.tab-auxiliary select.channel option[value="-1"]:selected');
            if (auto_option.length === 0) {
                prevChannelsValues = null;
                return;
            }

            const fillPrevChannelsValues = function () {
                prevChannelsValues = RC_channels.slice(0); //clone array
            };

            if (!prevChannelsValues || RC_channels.length === 0) return fillPrevChannelsValues();

            let diff_array = RC_channels.map(function(currentValue, index) {
                return Math.abs(prevChannelsValues[index] - currentValue);
            });

            diff_array = diff_array.slice(0, activeChannels);

            const largest = diff_array.reduce(function(x,y){
                return (x > y) ? x : y;
            }, 0);

            //minimum change to autoselect is 100
            if (largest < 100) return fillPrevChannelsValues();

            const indexOfMaxValue = diff_array.indexOf(largest);
            if (indexOfMaxValue >= 4 && indexOfMaxValue != RSSI_channel - 1){ //set channel
                auto_option.parent().val(indexOfMaxValue - 4);
            }

            return fillPrevChannelsValues();
        }

        let hideUnusedModes = false;
        let hideUnusedModesStore =  store.get('hideUnusedModes', false);
        $("input#switch-toggle-unused")
            .on('change', function () {
                hideUnusedModes = $(this).prop("checked");
                store.set('hideUnusedModes', hideUnusedModes);
                update_ui();
            })
            .prop("checked", !!hideUnusedModesStore)
            .trigger('change');

        // update ui instantly on first load
        update_ui();

        // enable data pulling
        interval.add('aux_data_pull', get_rc_data, 50);

        $(".tab-auxiliary .acroEnabled").width($("#mode-0 .info").width());

        GUI.content_ready(callback);
    }
};

TABS.auxiliary.cleanup = function (callback) {
    if (callback) callback();
};

$(window).on('resize', function(){
    $(".tab-auxiliary .acroEnabled").width($("#mode-0 .info").width());
});
