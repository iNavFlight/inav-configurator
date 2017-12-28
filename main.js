/*global $, chrome, analytics*/
'use strict';

// Google Analytics
var googleAnalyticsService = analytics.getService('ice_cream_app');
var googleAnalytics = googleAnalyticsService.getTracker("UA-75834706-2");
var googleAnalyticsConfig = false;
googleAnalyticsService.getConfig().addCallback(function (config) {
    googleAnalyticsConfig = config;
});

chrome.storage = chrome.storage || {};

$(document).ready(function () {
    // translate to user-selected language
    localize();

    // alternative - window.navigator.appVersion.match(/Chrome\/([0-9.]*)/)[1];
    GUI.log('Running - OS: <strong>' + GUI.operating_system + '</strong>, ' +
        'Chrome: <strong>' + window.navigator.appVersion.replace(/.*Chrome\/([0-9.]*).*/, "$1") + '</strong>, ' +
        'Configurator: <strong>' + chrome.runtime.getManifest().version + '</strong>');

    $('#status-bar .version').text(chrome.runtime.getManifest().version);
    $('#logo .version').text(chrome.runtime.getManifest().version);

    // notification messages for various operating systems
    switch (GUI.operating_system) {
        case 'Windows':
            break;
        case 'MacOS':
            // var main_chromium_version = window.navigator.appVersion.replace(/.*Chrome\/([0-9.]*).*/,"$1").split('.')[0];
            break;
        case 'ChromeOS':
            break;
        case 'Linux':
            break;
        case 'UNIX':
            break;
    }

    chrome.storage.local.get('logopen', function (result) {
        if (result.logopen) {
            $("#showlog").trigger('click');
         }
    });

    // log library versions in console to make version tracking easier
    console.log('Libraries: jQuery - ' + $.fn.jquery + ', d3 - ' + d3.version + ', three.js - ' + THREE.REVISION);

    // Tabs
    var ui_tabs = $('#tabs > ul');
    $('a', ui_tabs).click(function () {
        if ($(this).parent().hasClass('active') == false && !GUI.tab_switch_in_progress) { // only initialize when the tab isn't already active
            var self = this,
                tabClass = $(self).parent().prop('class');

            var tabRequiresConnection = $(self).parent().hasClass('mode-connected');

            var tab = tabClass.substring(4);
            var tabName = $(self).text();

            if (tabRequiresConnection && !CONFIGURATOR.connectionValid) {
                GUI.log(chrome.i18n.getMessage('tabSwitchConnectionRequired'));
                return;
            }

            if (GUI.connect_lock) { // tab switching disabled while operation is in progress
                GUI.log(chrome.i18n.getMessage('tabSwitchWaitForOperation'));
                return;
            }

            if (GUI.allowedTabs.indexOf(tab) < 0) {
                GUI.log(chrome.i18n.getMessage('tabSwitchUpgradeRequired', [tabName]));
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
                content.empty();

                // display loading screen
                $('#cache .data-loading').clone().appendTo(content);

                function content_ready() {
                    GUI.tab_switch_in_progress = false;
                }

                switch (tab) {
                    case 'landing':
                        TABS.landing.initialize(content_ready);
                        break;
                    case 'firmware_flasher':
                        TABS.firmware_flasher.initialize(content_ready);
                        break;
                    case 'help':
                        TABS.help.initialize(content_ready);
                        break;

                    case 'auxiliary':
                        TABS.auxiliary.initialize(content_ready);
                        break;
                    case 'adjustments':
                        TABS.adjustments.initialize(content_ready);
                        break;
                    case 'ports':
                        TABS.ports.initialize(content_ready);
                        break;
                    case 'led_strip':
                        TABS.led_strip.initialize(content_ready);
                        break;
                    case 'failsafe':
                        TABS.failsafe.initialize(content_ready);
                        break;
                    case 'transponder':
                        TABS.transponder.initialize(content_ready);
                        break;
                    case 'setup':
                        TABS.setup.initialize(content_ready);
                        break;
                    case 'calibration':
                        TABS.calibration.initialize(content_ready);
                        break;
                    case 'configuration':
                        TABS.configuration.initialize(content_ready);
                        break;
                    case 'profiles':
                        TABS.profiles.initialize(content_ready);
                        break;
                    case 'pid_tuning':
                        TABS.pid_tuning.initialize(content_ready);
                        break;
                    case 'receiver':
                        TABS.receiver.initialize(content_ready);
                        break;
                    case 'modes':
                        TABS.modes.initialize(content_ready);
                        break;
                    case 'servos':
                        TABS.servos.initialize(content_ready);
                        break;
                    case 'gps':
                        TABS.gps.initialize(content_ready);
                        break;
                    case 'motors':
                        TABS.motors.initialize(content_ready);
                        break;
                    case 'osd':
                        TABS.osd.initialize(content_ready);
                        break;
                    case 'sensors':
                        TABS.sensors.initialize(content_ready);
                        break;
                    case 'logging':
                        TABS.logging.initialize(content_ready);
                        break;
                    case 'onboard_logging':
                        TABS.onboard_logging.initialize(content_ready);
                        break;
                    case 'advanced_tuning':
                        TABS.advanced_tuning.initialize(content_ready);
                        break;
                    case 'cli':
                        TABS.cli.initialize(content_ready);
                        break;

                    default:
                        console.log('Tab not found:' + tab);
                }
            });
        }
    });

    $('#tabs ul.mode-disconnected li a:first').click();

    // options
    $('#options').click(function () {
        var el = $(this);

        if (!el.hasClass('active')) {
            el.addClass('active');
            el.after('<div id="options-window"></div>');

            $('div#options-window').load('./tabs/options.html', function () {
                googleAnalytics.sendAppView('Options');

                // translate to user-selected language
                localize();

                // if notifications are enabled, or wasn't set, check the notifications checkbox
                chrome.storage.local.get('update_notify', function (result) {
                    if (typeof result.update_notify === 'undefined' || result.update_notify) {
                        $('div.notifications input').prop('checked', true);
                    }
                });

                $('div.notifications input').change(function () {
                    var check = $(this).is(':checked');
                    googleAnalytics.sendEvent('Settings', 'Notifications', check);

                    chrome.storage.local.set({'update_notify': check});
                });

                // if tracking is enabled, check the statistics checkbox
                if (googleAnalyticsConfig.isTrackingPermitted()) {
                    $('div.statistics input').prop('checked', true);
                }

                $('div.statistics input').change(function () {
                    var check = $(this).is(':checked');
                    googleAnalytics.sendEvent('Settings', 'GoogleAnalytics', check);
                    googleAnalyticsConfig.setTrackingPermitted(check);
                });

                function close_and_cleanup(e) {
                    if (e.type == 'click' && !$.contains($('div#options-window')[0], e.target) || e.type == 'keyup' && e.keyCode == 27) {
                        $(document).unbind('click keyup', close_and_cleanup);

                        $('div#options-window').slideUp(250, function () {
                            el.removeClass('active');
                            $(this).empty().remove();
                        });
                    }
                }

                $(document).bind('click keyup', close_and_cleanup);

                $(this).slideDown(250);
            });
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
        chrome.storage.local.set({'logopen': false});

        state = false;
    }else{
        $log.animate({height: 111}, 200);
        $log.addClass('active');
        $("#content").addClass('logopen');
        $(".tab_container").addClass('logopen');
        $("#scrollicon").addClass('active');
        chrome.storage.local.set({'logopen': true});

        state = true;
    }
    $(this).text(state ? 'Hide Log' : 'Show Log');
    $(this).data('state', state);

    });

    var profile_e = $('#profilechange');

    profile_e.change(function () {
        var profile = parseInt($(this).val());
        MSP.send_message(MSPCodes.MSP_SELECT_SETTING, [profile], false, function () {
            GUI.log(chrome.i18n.getMessage('pidTuningLoadedProfile', [profile + 1]));
            updateActivatedTab();
        });
    });
});

function catch_startup_time(startTime) {
    var endTime = new Date().getTime(),
        timeSpent = endTime - startTime;

    googleAnalytics.sendTiming('Load Times', 'Application Startup', timeSpent);
}

function millitime() {
    return new Date().getTime();
}

function bytesToSize(bytes) {
    if (bytes < 1024) {
        bytes = bytes + ' Bytes';
    } else if (bytes < 1048576) {
        bytes = (bytes / 1024).toFixed(3) + ' KB';
    } else if (bytes < 1073741824) {
        bytes = (bytes / 1048576).toFixed(3) + ' MB';
    } else {
        bytes = (bytes / 1073741824).toFixed(3) + ' GB';
    }

    return bytes;
}

Number.prototype.clamp = function(min, max) {
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
        return args[i] !== void 0 ? args[i] : "{"+(i-args.length)+"}";
    });
};



function updateActivatedTab() {
    var activeTab = $('#tabs > ul li.active');
    activeTab.removeClass('active');
    $('a', activeTab).trigger('click');
}
