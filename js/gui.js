/*global $*/
'use strict';

var TABS = {}; // filled by individual tab js file

var GUI_control = function () {
    this.auto_connect = false;
    this.connecting_to = false;
    this.connected_to = false;
    this.connect_lock = false;
    this.active_tab;
    this.tab_switch_in_progress = false;
    this.operating_system;
    this.defaultAllowedTabsWhenDisconnected = [
        'landing',
        'firmware_flasher',
        'mission_control',
        'help'
    ];
    this.defaultAllowedTabsWhenConnected = [
        'failsafe',
        'transponder',
        'adjustments',
        'auxiliary',
        'cli',
        'configuration',
        'gps',
        'led_strip',
        'logging',
        'onboard_logging',
        'modes',
        'motors',
        'pid_tuning',
        'ports',
        'receiver',
        'sensors',
        'servos',
        'calibration',
        'setup',
        'osd',
        'profiles',
        'advanced_tuning',
        'mission_control',
        'mixer'
    ];
    this.allowedTabs = this.defaultAllowedTabsWhenDisconnected;

    // check which operating system is user running
    if (navigator.appVersion.indexOf("Win") != -1)          this.operating_system = "Windows";
    else if (navigator.appVersion.indexOf("Mac") != -1)     this.operating_system = "MacOS";
    else if (navigator.appVersion.indexOf("CrOS") != -1)    this.operating_system = "ChromeOS";
    else if (navigator.appVersion.indexOf("Linux") != -1)   this.operating_system = "Linux";
    else if (navigator.appVersion.indexOf("X11") != -1)     this.operating_system = "UNIX";
    else this.operating_system = "Unknown";
};

// message = string
GUI_control.prototype.log = function (message) {
    var command_log = $('div#log');
    var d = new Date();
    var year = d.getFullYear();
    var month = ((d.getMonth() < 9) ? '0' + (d.getMonth() + 1) : (d.getMonth() + 1));
    var date =  ((d.getDate() < 10) ? '0' + d.getDate() : d.getDate());
    var time = ((d.getHours() < 10) ? '0' + d.getHours(): d.getHours())
         + ':' + ((d.getMinutes() < 10) ? '0' + d.getMinutes(): d.getMinutes())
         + ':' + ((d.getSeconds() < 10) ? '0' + d.getSeconds(): d.getSeconds());

    var formattedDate = "{0}-{1}-{2} {3}".format(
                                year,
                                month,
                                date,
                                ' @ ' + time
                            );
    $('div.wrapper', command_log).append('<p>' + formattedDate + ' -- ' + message + '</p>');
    command_log.scrollTop($('div.wrapper', command_log).height());
};

// Method is called every time a valid tab change event is received
// callback = code to run when cleanup is finished
// default switch doesn't require callback to be set
GUI_control.prototype.tab_switch_cleanup = function (callback) {
    MSP.callbacks_cleanup(); // we don't care about any old data that might or might not arrive

    helper.interval.killAll(['global_data_refresh', 'msp-load-update']);
    helper.mspBalancedInterval.flush();

    if (this.active_tab) {
        TABS[this.active_tab].cleanup(callback);
    } else {
        callback();
    }
};

GUI_control.prototype.switchery = function() {
    $('.togglesmall').each(function(index, elem) {
        var switchery = new Switchery(elem, {
            size: 'small',
            color: '#37a8db',
            secondaryColor: '#c4c4c4'
        });
        $(elem).on("change", function (evt) {
            switchery.setPosition();
        });
        $(elem).removeClass('togglesmall');
    });

    $('.toggle').each(function(index, elem) {
        var switchery = new Switchery(elem, {
            color: '#37a8db',
            secondaryColor: '#c4c4c4'
        });
        $(elem).on("change", function (evt) {
            switchery.setPosition();
        });
        $(elem).removeClass('toggle');
    });

    $('.togglemedium').each(function(index, elem) {
        var switchery = new Switchery(elem, {
            className: 'switcherymid',
            color: '#37a8db',
            secondaryColor: '#c4c4c4'
        });
        $(elem).on("change", function (evt) {
            switchery.setPosition();
        });
        $(elem).removeClass('togglemedium');
    });
};


GUI_control.prototype.content_ready = function (callback) {

    $('.togglesmall').each(function(index, elem) {
        var switchery = new Switchery(elem, {
          size: 'small',
          color: '#37a8db',
          secondaryColor: '#c4c4c4'
        });
        $(elem).on("change", function (evt) {
            switchery.setPosition();
        });
        $(elem).removeClass('togglesmall');
    });

    $('.toggle').each(function(index, elem) {
        var switchery = new Switchery(elem, {
            color: '#37a8db',
            secondaryColor: '#c4c4c4'
        });
        $(elem).on("change", function (evt) {
            switchery.setPosition();
        });
        $(elem).removeClass('toggle');
    });

    $('.togglemedium').each(function(index, elem) {
        var switchery = new Switchery(elem, {
            className: 'switcherymid',
            color: '#37a8db',
            secondaryColor: '#c4c4c4'
         });
         $(elem).on("change", function (evt) {
             switchery.setPosition();
         });
         $(elem).removeClass('togglemedium');
    });

    if (CONFIGURATOR.connectionValid) {
        // Build link to in-use CF version documentation
        var documentationButton = $('div#content #button-documentation');
        documentationButton.html("Documentation for INAV");
        documentationButton.attr("href","https://github.com/iNavFlight/inav/wiki");
    }

    // loading tooltip
    jQuery(document).ready(function($) {
        $('cf_tip').each(function() { // Grab all ".cf_tip" elements, and for each...
        log(this); // ...print out "this", which now refers to each ".cf_tip" DOM element
    });

    $('.cf_tip').each(function() {
        $(this).jBox('Tooltip', {
            delayOpen: 100,
            delayClose: 100,
            position: {
                x: 'right',
                y: 'center'
            },
            outside: 'x'
            });
        });
    });

    if (callback) callback();
};

GUI_control.prototype.updateStatusBar = function() {
    $('span.i2c-error').text(CONFIG.i2cError);
    $('span.cycle-time').text(CONFIG.cycleTime);
    $('span.cpu-load').text(chrome.i18n.getMessage('statusbar_cpu_load', [CONFIG.cpuload]));
};

GUI_control.prototype.updateProfileChange = function() {
    $('#profilechange').val(CONFIG.profile);
    $('#batteryprofilechange').val(CONFIG.battery_profile);
};

GUI_control.prototype.fillSelect = function ($element, values, currentValue, unit) {
    if (unit == null) {
        unit = '';
    }

    $element.find("*").remove();

    for (var i in values) {
        if (values.hasOwnProperty(i)) {
            $element.append('<option value="' + i + '">' + values[i] + '</option>');
        }
    }

    /*
     *  If current Value is not on the list, add a new entry
     */
    if (currentValue != null && $element.find('[value="' + currentValue + '"]').length == 0) {
        $element.append('<option value="' + currentValue + '">' + currentValue + unit + '</option>');
    }
};

GUI_control.prototype.simpleBind = function () {
    $('input[data-simple-bind]').not('[data-simple-binded="true"]').each(function () {
        var $this = $(this),
            toBind = $this.data('simple-bind').split(".");

        if (toBind.length !== 2 || window[toBind[0]][toBind[1]] === undefined) {
            return;
        }

        $this.change(function () {
            window[toBind[0]][toBind[1]] = $(this).val();
        });

        $this.val(window[toBind[0]][toBind[1]]);
        $this.attr('data-simple-binded', true);
    });
};

// initialize object into GUI variable
var GUI = new GUI_control();
