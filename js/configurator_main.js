import '../src/css/styles.css'

import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui';
import * as THREE from 'three'

import { GUI, TABS } from './gui';
import CONFIGURATOR from './data_storage';
import FC  from './fc';
import { globalSettings, UnitType } from './globalSettings';
import { PLATFORM } from './model'
import i18n from './localization';
import SerialBackend from './serial_backend';
import MSP from './msp';
import MSPCodes  from './../js/msp/MSPCodes';
import mspHelper  from './msp/MSPHelper';
import update from './globalUpdates';
import appUpdater from './appUpdater';
import CliAutoComplete from './CliAutoComplete'; 
import { SITLProcess } from './sitl';
import settingsCache from './settingsCache';
import store from './store';


window.$ = $;

// Set how the units render on the configurator only
$(function() {
    i18n.init( () => {
        i18n.localize();

        MSP.init();
        mspHelper.init();
        SerialBackend.init();

        GUI.updateEzTuneTabVisibility = function(loadMixerConfig) {
            let useEzTune = true;
            if (CONFIGURATOR.connectionValid) {
                if (loadMixerConfig) {
                    mspHelper.loadMixerConfig(function () {
                        if (FC.MIXER_CONFIG.platformType == PLATFORM.MULTIROTOR || FC.MIXER_CONFIG.platformType == PLATFORM.TRICOPTER) {
                            $('.tab_ez_tune').removeClass("is-hidden");
                        } else {
                            $('.tab_ez_tune').addClass("is-hidden");
                            useEzTune = false;
                        }
                    });
                } else {
                    if (FC.MIXER_CONFIG.platformType == PLATFORM.MULTIROTOR || FC.MIXER_CONFIG.platformType == PLATFORM.TRICOPTER) {
                        $('.tab_ez_tune').removeClass("is-hidden");
                    } else {
                        $('.tab_ez_tune').addClass("is-hidden");
                        useEzTune = false;
                    }
                }
            }
        
            return useEzTune;
        };

        GUI.updateActivatedTab = function() {
            var activeTab = $('#tabs > ul li.active');
            activeTab.removeClass('active');
            $('a', activeTab).trigger('click');
        }

        globalSettings.unitType = store.get('unit_type', UnitType.none);
        globalSettings.mapProviderType = store.get('map_provider_type', 'osm'); 
        globalSettings.assistnowApiKey = store.get('assistnow_api_key', '');
        globalSettings.proxyURL = store.get('proxyurl', 'http://192.168.1.222/mapproxy/service?');
        globalSettings.proxyLayer = store.get('proxylayer', 'your_proxy_layer_name');
        globalSettings.showProfileParameters = store.get('show_profile_parameters', 1);
        globalSettings.assistnowOfflineData = store.get('assistnow_offline_data', []);
        globalSettings.assistnowOfflineDate = store.get('assistnow_offline_date', 0);
        updateProfilesHighlightColours();

        var cliAutocomplete = store.get('cli_autocomplete', true);
        globalSettings.cliAutocomplete = cliAutocomplete;
        CliAutoComplete.setEnabled(cliAutocomplete);
        

        // Resets the OSD units used by the unit coversion when the FC is disconnected.
        if (!CONFIGURATOR.connectionValid) {
            globalSettings.osdUnits = null;
        }

        const version = window.electronAPI.appGetVersion();
        // alternative - window.navigator.appVersion.match(/Chrome\/([0-9.]*)/)[1];
        GUI.log(i18n.getMessage('getRunningOS') + GUI.operating_system + '</strong>, ' +
            'Electron: <strong>' + navigator.userAgent.match(/Electron\/([\d\.]+\d+)/)[1] + '</strong>, ' +
            i18n.getMessage('getConfiguratorVersion') + version + '</strong>');

        $('#status-bar .version').text(version);
        $('#logo .version').text(version);
        update.firmwareVersion();

        if (store.get('logopen', false)) {
            $("#showlog").trigger('click');
        }

        if (store.get('update_notify', true)) { 
            appUpdater.checkRelease(version);
        }
        

        // log library versions in console to make version tracking easier
        console.log('Libraries: jQuery - ' + $.fn.jquery + ', three.js - ' + THREE.REVISION);

        // Tabs
        var ui_tabs = $('#tabs > ul');
        $('a', ui_tabs).on('click', function() {

            if ($(this).parent().hasClass("tab_help")) {
                return;
            }

            if ($(this).parent().hasClass('active') == false && !GUI.tab_switch_in_progress) { // only initialize when the tab isn't already active
                var self = this,
                    tabClass = $(self).parent().prop('class');

                var tabRequiresConnection = $(self).parent().hasClass('mode-connected');

                var tab = tabClass.substring(4);
                var tabName = $(self).text();

                if (tabRequiresConnection && !CONFIGURATOR.connectionValid) {
                    GUI.log(i18n.getMessage('tabSwitchConnectionRequired'));
                    return;
                }

                if (GUI.connect_lock) { // tab switching disabled while operation is in progress
                    GUI.log(i18n.getMessage('tabSwitchWaitForOperation'));
                    return;
                }

                if (GUI.allowedTabs.indexOf(tab) < 0) {
                    GUI.log(i18n.getMessage('tabSwitchUpgradeRequired', [tabName]));
                    return;
                }

                GUI.tab_switch_in_progress = true;

                GUI.tab_switch_cleanup(function () {
                    // disable previously active tab highlight
                    $('li', ui_tabs).removeClass('active');

                    // Highlight selected tab
                    $(self).parent().addClass('active');

                    // detach listeners and remove element data
                    var content = $('#content');
                    content.data('empty', !!content.is(':empty'));
                    content.empty();

                    // display loading screen
                    $('#cache .data-loading').clone().appendTo(content);

                    function content_ready() {
                        GUI.tab_switch_in_progress = false;

                        // Update CSS on to show highlighing or not
                        updateProfilesHighlightColours();
                    }

                    switch (tab) {
                        case 'landing':
                            import('./../tabs/landing').then(() => TABS.landing.initialize(content_ready));
                            break;
                        case 'firmware_flasher':
                            import('./../tabs/firmware_flasher').then(() => TABS.firmware_flasher.initialize(content_ready));
                            break;
                        case 'sitl':
                            import('./../tabs/sitl').then(() => TABS.sitl.initialize(content_ready));
                            break;
                        case 'auxiliary':
                            import('./../tabs/auxiliary').then(() => TABS.auxiliary.initialize(content_ready));
                            break;
                        case 'adjustments':
                            import('./../tabs/adjustments').then(() => TABS.adjustments.initialize(content_ready));
                            break;
                        case 'ports':
                            import('./../tabs/ports').then(() => TABS.ports.initialize(content_ready));
                            break;
                        case 'led_strip':
                            import('./../tabs/led_strip').then(() => TABS.led_strip.initialize(content_ready));
                            break;
                        case 'failsafe':
                            import('./../tabs/failsafe').then(() => TABS.failsafe.initialize(content_ready));
                            break;
                        case 'setup':
                            import('./../tabs/setup').then(() => TABS.setup.initialize(content_ready));
                            break;
                        case 'calibration':
                            import('./../tabs/calibration').then(() => TABS.calibration.initialize(content_ready));
                            break;
                        case 'configuration':
                            import('./../tabs/configuration').then(() => TABS.configuration.initialize(content_ready));
                            break;
                        case 'pid_tuning':
                            import('./../tabs/pid_tuning').then(() => TABS.pid_tuning.initialize(content_ready));
                            break;
                        case 'receiver':
                            import('./../tabs/receiver').then(() => TABS.receiver.initialize(content_ready));
                            break;
                        case 'gps':
                            import('./../tabs/gps').then(() => TABS.gps.initialize(content_ready));
                            break;
                        case 'magnetometer':
                            import('./../tabs/magnetometer').then(() => TABS.magnetometer.initialize(content_ready));
                            break;
                        case 'mission_control':
                            import('./../tabs/mission_control').then(() => TABS.mission_control.initialize(content_ready));
                            break;
                        case 'mixer':
                            import('./../tabs/mixer').then(() => TABS.mixer.initialize(content_ready));
                            break;
                        case 'outputs':
                            import('./../tabs/outputs').then(() => TABS.outputs.initialize(content_ready));
                            break;
                        case 'osd':
                            import('./../tabs/osd').then(() => TABS.osd.initialize(content_ready));
                            break;
                        case 'sensors':
                            import('./../tabs/sensors').then(() => TABS.sensors.initialize(content_ready));
                            break;
                        case 'logging':
                            import('./../tabs/logging').then(() => TABS.logging.initialize(content_ready));
                            break;
                        case 'onboard_logging':
                            import('./../tabs/onboard_logging').then(() => TABS.onboard_logging.initialize(content_ready));
                            break;
                        case 'advanced_tuning':
                            import('./../tabs/advanced_tuning').then(() => TABS.advanced_tuning.initialize(content_ready));
                            break;
                        case 'programming':
                            import('./../tabs/programming').then(() => TABS.programming.initialize(content_ready));
                            break;
                        case 'cli':
                            import('./../tabs/cli').then(() => TABS.cli.initialize(content_ready));
                            break;
                        case 'search':
                            import('./../tabs/search').then(() => TABS.search.initialize(content_ready));
                            break;

                       case 'javascript_programming':
                           import('./../tabs/javascript_programming').then(() => TABS.javascript_programming.initialize(content_ready));
                           break;
                        default:
                            console.log('Tab not found:' + tab);
                    }
                });
            }
        });

        $('#tabs ul.mode-disconnected li a:first').trigger( "click" );

    

        // options
        $('#options').on('click', function() {
            var el = $(this);

            function closeOptions() {
                $('div#options-window').slideUp(250, function () {
                    el.removeClass('active');
                    $(this).empty().remove();
                });
            }

            if (!el.hasClass('active')) {
                el.addClass('active');
                el.after('<div id="options-window"></div>');

                import('./../tabs/options.html?raw').then(({default: html}) => {
                    $('div#options-window').html(html);
                    // translate to user-selected language
                    i18n.localize();

                    // if notifications are enabled, or wasn't set, check the notifications checkbox
                    if (store.get('update_notify', true)) {
                        $('div.notifications input').prop('checked', true);
                    }

                    $('div.notifications input').on('change', function () {
                        var check = $(this).is(':checked');
                        store.set('update_notify', check);
                    });

                    $('div.statistics input').on('change', function () {
                        var check = $(this).is(':checked');
                    });

                    $('div.show_profile_parameters input').on('change', function () {
                        globalSettings.showProfileParameters = $(this).is(':checked');
                        store.set('show_profile_parameters', globalSettings.showProfileParameters);

                        // Update CSS on select boxes
                        updateProfilesHighlightColours();

                        // Horrible way to reload the tab
                        const activeTab = $('#tabs li.active');
                        activeTab.removeClass('active');
                        activeTab.find('a').trigger( "click" );
                    });

                    $('div.cli_autocomplete input').on('change', function () {
                        globalSettings.cliAutocomplete = $(this).is(':checked');
                        store.set('cli_autocomplete', globalSettings.cliAutocomplete);

                        CliAutoComplete.setEnabled($(this).is(':checked'));
                    });

                    $('#ui-unit-type').val(globalSettings.unitType);
                    $('#map-provider-type').val(globalSettings.mapProviderType);
                    $('#proxyurl').val(globalSettings.proxyURL);
                    $('#proxylayer').val(globalSettings.proxyLayer);
                    $('#showProfileParameters').prop('checked', globalSettings.showProfileParameters);
                    $('#cliAutocomplete').prop('checked', globalSettings.cliAutocomplete);
                    $('#assistnow-api-key').val(globalSettings.assistnowApiKey);
                    
                    i18n.getLanguages().forEach(lng => {
                        $('#languageOption').append("<option value='{0}'>{1}</option>".format(lng, i18n.getMessage("language_" + lng)));
                    });

                                        
                    $('#languageOption').val(i18n.getCurrentLanguage());
                    
                    $('#languageOption').on('change', () => {
                        i18n.changeLanguage($('#languageOption').val());
                    });

                    // Set the value of the unit type
                    // none, OSD, imperial, metric
                    $('#ui-unit-type').on('change', function () {
                        store.set('unit_type', $(this).val());
                        globalSettings.unitType = $(this).val();

                        // Update the osd units in global settings
                        // but only if we need it
                        if (globalSettings.unitType === UnitType.OSD) {
                            get_osd_settings();
                        }

                        // Horrible way to reload the tab
                        const activeTab = $('#tabs li.active');
                        activeTab.removeClass('active');
                        activeTab.find('a').trigger( "click" );
                    });
                    $('#map-provider-type').on('change', function () {
                        store.set('map_provider_type', $(this).val());
                        globalSettings.mapProviderType = $(this).val();
                    });
                    $('#proxyurl').on('change', function () {
                        store.set('proxyurl', $(this).val());
                        globalSettings.proxyURL = $(this).val();
                    });
                    $('#proxylayer').on('change', function () {
                        store.set('proxylayer', $(this).val());
                        globalSettings.proxyLayer = $(this).val();
                    });
                    $('#assistnow-api-key').on('change', function () {
                        store.set('assistnow_api_key', $(this).val());
                        globalSettings.assistnowApiKey = $(this).val();
                    });
 
                    $('#demoModeReset').on('click', function () {
                        SITLProcess.deleteEepromFile('demo.bin');
                    });
                    $('#maintenanceFlushSettingsCache').on('click', function () {
                        settingsCache.flush();
                    });

                    $('#optionsClose').on('click', () => {
                        if ($('#options').hasClass('active')) {
                            closeOptions();
                        }
                    })
        
                    $('div#options-window').slideDown(250);
                });
            } else {
                closeOptions();
            }
        });

        var $content = $("#content");

        // listen to all input change events and adjust the value within limits if necessary
        $content.on('focus', 'input[type="number"]', function () {
            var element = $(this),
                val = element.val();

            if (!isNaN(val)) {
                element.data('previousValue', parseFloat(val));
            }
        });

        $content.on('keydown', 'input[type="number"]', function (e) {
            // whitelist all that we need for numeric control
            var whitelist = [
                96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, // numpad and standard number keypad
                109, 189, // minus on numpad and in standard keyboard
                8, 46, 9, // backspace, delete, tab
                190, 110, // decimal point
                37, 38, 39, 40, 13 // arrows and enter
            ];

            if (whitelist.indexOf(e.keyCode) == -1) {
                e.preventDefault();
            }
        });

        $content.on('change', 'input[type="number"]', function () {
            var element = $(this),
                min = parseFloat(element.prop('min')),
                max = parseFloat(element.prop('max')),
                step = parseFloat(element.prop('step')),
                val = parseFloat(element.val()),
                decimal_places;

            // only adjust minimal end if bound is set
            if (element.prop('min')) {
                if (val < min) {
                    element.val(min);
                    val = min;
                }
            }

            // only adjust maximal end if bound is set
            if (element.prop('max')) {
                if (val > max) {
                    element.val(max);
                    val = max;
                }
            }

            // if entered value is illegal use previous value instead
            if (isNaN(val)) {
                element.val(element.data('previousValue'));
                val = element.data('previousValue');
            }

            // if step is not set or step is int and value is float use previous value instead
            if (isNaN(step) || step % 1 === 0) {
                if (val % 1 !== 0) {
                    element.val(element.data('previousValue'));
                    val = element.data('previousValue');
                }
            }

            // if step is set and is float and value is int, convert to float, keep decimal places in float according to step *experimental*
            if (!isNaN(step) && step % 1 !== 0) {
                decimal_places = String(step).split('.')[1].length;

                if (val % 1 === 0) {
                    element.val(val.toFixed(decimal_places));
                } else if (String(val).split('.')[1].length != decimal_places) {
                    element.val(val.toFixed(decimal_places));
                }
            }
        });

        $("#showlog").on('click', function() {
        var state = $(this).data('state'),
            $log = $("#log");

        if (state) {
            $log.animate({height: 27}, 200, function() {
                var command_log = $('div#log');
                //noinspection JSValidateTypes
                command_log.scrollTop($('div.wrapper', command_log).height());
            });
            $log.removeClass('active');
            $("#content").removeClass('logopen');
            $(".tab_container").removeClass('logopen');
            $("#scrollicon").removeClass('active');
            store.set('logopen', false);

            state = false;
        }else{
            $log.animate({height: 111}, 200);
            $log.addClass('active');
            $("#content").addClass('logopen');
            $(".tab_container").addClass('logopen');
            $("#scrollicon").addClass('active');
            store.set('logopen', true);

            state = true;
        }
        
        $(this).html(state ? i18n.getMessage("mainHideLog") : i18n.getMessage("mainShowLog"));
        $(this).data('state', state);

        });

        var mixerprofile_e = $('#mixerprofilechange');

        mixerprofile_e.on('change', function () {
            var mixerprofile = parseInt($(this).val());
            MSP.send_message(MSPCodes.MSP2_INAV_SELECT_MIXER_PROFILE, [mixerprofile], false, function () {
                GUI.log(i18n.getMessage('setMixerProfile', [mixerprofile + 1]));
                MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function () {
                    GUI.log(i18n.getMessage('deviceRebooting'));
                    GUI.handleReconnect();
                });
            });
        });

        var profile_e = $('#profilechange');

        profile_e.on('change', function () {
            var profile = parseInt($(this).val());
            MSP.send_message(MSPCodes.MSP_SELECT_SETTING, [profile], false, function () {
                GUI.log(i18n.getMessage('setControlProfile', [profile + 1]));
            });
        });

        var batteryprofile_e = $('#batteryprofilechange');

        batteryprofile_e.on('change', function () {
            var batteryprofile = parseInt($(this).val());
            MSP.send_message(MSPCodes.MSP2_INAV_SELECT_BATTERY_PROFILE, [batteryprofile], false, function () {
                GUI.log(i18n.getMessage('setBatteryProfile', [batteryprofile + 1]));
            });
        });

    });
});


function get_osd_settings() {
    if (globalSettings.osdUnits !== undefined && globalSettings.osdUnits !== null) {
        return;
    }

    MSP.promise(MSPCodes.MSP2_INAV_OSD_PREFERENCES).then(function (resp) {
        var prefs = resp.data;
        prefs.readU8();
        prefs.readU8();
        prefs.readU8();
        prefs.readU8();
        prefs.readU8();
        prefs.readU8();
        prefs.readU8();
        globalSettings.osdUnits = prefs.readU8();
    });
}

function updateProfilesHighlightColours() {
    if (globalSettings.showProfileParameters) {
        $('.dropdown-dark #profilechange').addClass('showProfileParams');
        $('.dropdown-dark #batteryprofilechange').addClass('showProfileParams');

        $('.batteryProfileHighlight').each(function () {
            $(this).addClass('batteryProfileHighlightActive');
            $(this).removeClass('batteryProfileHighlight');
        });

        $('.controlProfileHighlight').each(function () {
            $(this).addClass('controlProfileHighlightActive');
            $(this).removeClass('controlProfileHighlight');
        });
    } else {
        $('.dropdown-dark #profilechange').removeClass('showProfileParams');
        $('.dropdown-dark #batteryprofilechange').removeClass('showProfileParams');

        $('.batteryProfileHighlightActive').each(function () {
            $(this).addClass('batteryProfileHighlight');
            $(this).removeClass('batteryProfileHighlightActive');
        });

        $('.controlProfileHighlightActive').each(function () {
            $(this).addClass('controlProfileHighlight');
            $(this).removeClass('controlProfileHighlightActive');
        });
    }
}

Number.prototype.clamp = function (min, max) {
    return Math.min(Math.max(this, min), max);
};

/**
 * String formatting now supports currying (partial application).
 * For a format string with N replacement indices, you can call .format
 * with M <= N arguments. The result is going to be a format string
 * with N-M replacement indices, properly counting from 0 .. N-M.
 * The following Example should explain the usage of partial applied format:
 *  "{0}:{1}:{2}".format("a","b","c") === "{0}:{1}:{2}".format("a","b").format("c")
 *  "{0}:{1}:{2}".format("a").format("b").format("c") === "{0}:{1}:{2}".format("a").format("b", "c")
 **/
String.prototype.format = function () {
    var args = arguments;
    return this.replace(/\{(\d+)\}/g, function (t, i) {
        return args[i] !== void 0 ? args[i] : "{" + (i - args.length) + "}";
    });
};

