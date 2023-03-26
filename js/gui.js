/*global $*/
'use strict';

var TABS = {}; // filled by individual tab js file

var GUI_control = function () {
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
        'sitl',
        'help'
    ];
    this.defaultAllowedTabsWhenConnected = [
        'failsafe',
        'adjustments',
        'auxiliary',
        'cli',
        'configuration',
        'gps',
        'magnetometer',
        'led_strip',
        'logging',
        'onboard_logging',
        'modes',
        'outputs',
        'pid_tuning',
        'ports',
        'receiver',
        'sensors',
        'calibration',
        'setup',
        'osd',
        'profiles',
        'advanced_tuning',
        'mission_control',
        'mixer',
        'programming'
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
    const content = $('#content').removeClass('loading');
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

    // Insert a documentation button next to the tab title
    const tabTitle = $('div#content .tab_title').first();
    const documentationDiv = $('<div>').addClass('cf_doc_version_bt');
    $('<a>').attr('href', 'https://github.com/iNavFlight/inav/wiki')
        .attr('target', '_blank').attr('id', 'button-documentation')
        .html(chrome.i18n.getMessage('documentation')).appendTo(documentationDiv);
    documentationDiv.insertAfter(tabTitle);

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

    const duration = content.data('empty') ? 0 : 400;
    $('#content .data-loading:first').fadeOut(duration, function() {
        $(this).remove();
    });
    if (callback) {
        callback();
    }
};

GUI_control.prototype.updateStatusBar = function() {

    var armingFlags = {
        'ARMED':(1 << 2),
        //'WAS_EVER_ARMED':(1 << 3),
        'SIMULATOR_MODE':(1 << 4),
        'ARMING_DISABLED_FAILSAFE_SYSTEM':(1 << 7),
        'ARMING_DISABLED_NOT_LEVEL':(1 << 8),
        'ARMING_DISABLED_SENSORS_CALIBRATING':(1 << 9),
        'ARMING_DISABLED_SYSTEM_OVERLOADED':(1 << 10),
        'ARMING_DISABLED_NAVIGATION_UNSAFE':(1 << 11),
        'ARMING_DISABLED_COMPASS_NOT_CALIBRATED':(1 << 12),
        'ARMING_DISABLED_ACCELEROMETER_NOT_CALIBRATED':(1 << 13),
        'ARMING_DISABLED_ARM_SWITCH':(1 << 14),
        'ARMING_DISABLED_HARDWARE_FAILURE':(1 << 15),
        'ARMING_DISABLED_BOXFAILSAFE':(1 << 16),
        'ARMING_DISABLED_BOXKILLSWITCH':(1 << 17),
        'ARMING_DISABLED_RC_LINK':(1 << 18),
        'ARMING_DISABLED_THROTTLE':(1 << 19),
        'ARMING_DISABLED_CLI':(1 << 20),
        'ARMING_DISABLED_CMS_MENU':(1 << 21),
        'ARMING_DISABLED_OSD_MENU':(1 << 22),
        'ARMING_DISABLED_ROLLPITCH_NOT_CENTERED':(1 << 23),
        'ARMING_DISABLED_SERVO_AUTOTRIM':(1 << 24),
        'ARMING_DISABLED_OOM':(1 << 25),
        'ARMING_DISABLED_INVALID_SETTING':(1 << 26),
        'ARMING_DISABLED_PWM_OUTPUT_ERROR':(1 << 27),
        'ARMING_DISABLED_NO_PREARM':(1 << 28),
        'ARMING_DISABLED_DSHOT_BEEPER':(1 << 29),
        'ARMING_DISABLED_LANDING_DETECTED':(1 << 30),
    };

    var activeArmFlags =  [];
    for(var i=0;i<32;i++) {
        var checkBit = (1 << i);
        if(Object.values(armingFlags).includes(checkBit) && (checkBit & CONFIG.armingFlags)) {
            activeArmFlags.push(Object.keys(armingFlags)[Object.values(armingFlags).indexOf(checkBit)]);
        }
    }

    $('span.i2c-error').text(CONFIG.i2cError);
    $('span.cycle-time').text(CONFIG.cycleTime);
    $('span.cpu-load').text(chrome.i18n.getMessage('statusbar_cpu_load', [CONFIG.cpuload]));
    $('span.arming-flags').text(activeArmFlags.length ? activeArmFlags.join(', ') : '-');
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

GUI_control.prototype.load = function(rel, callback) {
    const content = $('#content').addClass('loading');
    $.get(rel, function(data) {
        $(data).appendTo(content);
        if (callback) {
            callback();
        }
    });
}

GUI_control.prototype.renderOperandValue = function ($container, operandMetadata, operand, value, onChange) {

    $container.find('.logic_element__operand--value').remove();

    switch (operandMetadata.type) {
        case "value":
            $container.append('<input type="number" class="logic_element__operand--value" data-operand="' + operand + '" step="' + operandMetadata.step + '" min="' + operandMetadata.min + '" max="' + operandMetadata.max + '" value="' + value + '" />');
            break;
        case "range":
        case "dictionary":
            $container.append('<select class="logic_element__operand--value" data-operand="' + operand + '"></select>');
            let $t = $container.find('.logic_element__operand--value');
            
            if (operandMetadata.type == "range") {
                for (let i = operandMetadata.range[0]; i <= operandMetadata.range[1]; i++) {
                    $t.append('<option value="' + i + '">' + i + '</option>');
                }
            } else if (operandMetadata.type == "dictionary") {
                let operandValues = [];

                for (let j in operandMetadata.values) {
                    if (operandMetadata.values.hasOwnProperty(j)) {
                        operandValues[parseInt(j,10)] = {
                            id: parseInt(j, 10),
                            name: operandMetadata.values[j],
                        };
                    }
                }

                operandValues.sort((a, b) => {
                    let ovAN = a.name.toLowerCase(),
                        ovBN = b.name.toLowerCase();

                    return (ovAN < ovBN) ? -1 : 1;
                });
                
                operandValues.forEach( val => {
                    $t.append('<option value="' + val.id + '">' + val.name + '</option>');
                });
            }

            $t.val(value);
            break;
    }

    $container.find('.logic_element__operand--value').change(onChange);
};

/**
 * @param  {jQuery} $container
 * @param  {LogicConditionsCollection} logicConditions
 * @param  {int} current
 * @param  {function} onChange
 * @param  {boolean} withAlways
 */
GUI_control.prototype.renderLogicConditionSelect = function ($container, logicConditions, current, onChange, withAlways, onlyEnabled) {

    let $select = $container.append('<select class="mix-rule-condition">').find("select"),
        lcCount = logicConditions.getCount();
        option  = "";

    if (withAlways) {
        $select.append('<option value="-1">Always</option>')
    }
    for (let i = 0; i < lcCount ; i++) {
        if (!onlyEnabled || i === current || (logicConditions.isEnabled(i))) {
            option = '<option';

            if (i === current && !logicConditions.isEnabled(i)) {
                option+= ' class="lc_disabled"';
            }
            
            option+= ' value="' + i + '">Logic Condition ' + i + ' </option>';

            $select.append(option);
        }
    }

    $select.val(current).change(onChange);
}

// initialize object into GUI variable
var GUI = new GUI_control();
