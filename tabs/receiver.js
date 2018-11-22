/*global chrome*/

'use strict';

TABS.receiver = {
    rateChartHeight: 117
};

TABS.receiver.initialize = function (callback) {
    var self = this;

    if (GUI.active_tab != 'receiver') {
        GUI.active_tab = 'receiver';
        googleAnalytics.sendAppView('Receiver');
    }

    var loadChainer = new MSPChainerClass();

    var loadChain = [
        mspHelper.loadMisc,
        mspHelper.loadRcData,
        mspHelper.loadRcMap,
        mspHelper.loadRxConfig,
        mspHelper.loadRcDeadband
    ];

    if (semver.gte(CONFIG.flightControllerVersion, '1.8.1')) {
        loadChain.push(mspHelper.loadRateProfileData);
    } else {
        loadChain.push(mspHelper.loadRcTuningData);
    }

    loadChainer.setChain(loadChain);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    function load_html() {
        $('#content').load("./tabs/receiver.html", process_html);
    }

    function drawRollPitchExpo() {
        var pitch_roll_curve = $('.pitch_roll_curve canvas').get(0);
        var context = pitch_roll_curve.getContext("2d");

        var expoAVal = $('.tunings .rate input[name="expo"]');
        var expoA = parseFloat(expoAVal.val());

        var expoMVal = $('.tunings .rate input[name="manual_expo"]');
        var expoM = parseFloat(expoMVal.val());

        if (expoA <= parseFloat(expoAVal.prop('min')) || expoA >= parseFloat(expoAVal.prop('max')) ||
            expoM <= parseFloat(expoMVal.prop('min')) || expoM >= parseFloat(expoMVal.prop('max'))) {
            return;
        }

        var rateHeight = TABS.receiver.rateChartHeight;

        // draw
        context.clearRect(0, 0, 200, rateHeight);

        context.beginPath();
        context.moveTo(0, rateHeight);
        context.quadraticCurveTo(110, rateHeight - ((rateHeight / 2) * (1 - expoA)), 200, 0);
        context.lineWidth = 2;
        context.strokeStyle = '#37a8db';
        context.stroke();

        context.beginPath();
        context.moveTo(0, rateHeight);
        context.quadraticCurveTo(110, rateHeight - ((rateHeight / 2) * (1 - expoM)), 200, 0);
        context.lineWidth = 2;
        context.strokeStyle = '#a837db';
        context.stroke();
    }

    function process_html() {
        // translate to user-selected language
        localize();

        if (semver.lt(CONFIG.flightControllerVersion, '1.9.1')) {
            rcmap_options = $('select[name="rcmap_helper"] option');
            for (i = 0; i < rcmap_options.length; ++i) {
                option = rcmap_options[i];
                option.setAttribute("value", option.getAttribute("value") + "5678");
            }
        }

        // fill in data from RC_tuning
        $('.tunings .throttle input[name="mid"]').val(RC_tuning.throttle_MID.toFixed(2));
        $('.tunings .throttle input[name="expo"]').val(RC_tuning.throttle_EXPO.toFixed(2));

        $('.tunings .rate input[name="expo"]').val(RC_tuning.RC_EXPO.toFixed(2));
        $('.tunings .yaw_rate input[name="yaw_expo"]').val(RC_tuning.RC_YAW_EXPO.toFixed(2));

        $('.tunings .rate input[name="manual_expo"]').val(RC_tuning.manual_RC_EXPO.toFixed(2));
        $('.tunings .yaw_rate input[name="manual_yaw_expo"]').val(RC_tuning.manual_RC_YAW_EXPO.toFixed(2));

        $('.deadband input[name="yaw_deadband"]').val(RC_deadband.yaw_deadband);
        $('.deadband input[name="deadband"]').val(RC_deadband.deadband);

        // generate bars
        var bar_names = [
                chrome.i18n.getMessage('controlAxisRoll'),
                chrome.i18n.getMessage('controlAxisPitch'),
                chrome.i18n.getMessage('controlAxisYaw'),
                chrome.i18n.getMessage('controlAxisThrottle')
            ],
            bar_container = $('.tab-receiver .bars');

        for (var i = 0; i < RC.active_channels; i++) {
            var name;
            if (i < bar_names.length) {
                name = bar_names[i];
            } else {
                name = chrome.i18n.getMessage("radioChannelShort") + (i + 1);
            }

            bar_container.append('\
                <ul>\
                    <li class="name">' + name + '</li>\
                    <li class="meter">\
                        <div class="meter-bar">\
                            <div class="label"></div>\
                            <div class="fill">\
                                <div class="label"></div>\
                            </div>\
                        </div>\
                    </li>\
                </ul>\
            ');
        }

        // we could probably use min and max throttle for the range, will see
        var meter_scale = {
            'min': 800,
            'max': 2200
        };

        var meter_fill_array = [];
        $('.meter .fill', bar_container).each(function () {
            meter_fill_array.push($(this));
        });

        var meter_label_array = [];
        $('.meter', bar_container).each(function () {
            meter_label_array.push($('.label', this));
        });

        // correct inner label margin on window resize (i don't know how we could do this in css)
        self.resize = function () {
            var containerWidth = $('.meter:first', bar_container).width(),
                labelWidth = $('.meter .label:first', bar_container).width(),
                margin = (containerWidth / 2) - (labelWidth / 2);

            for (var i = 0; i < meter_label_array.length; i++) {
                meter_label_array[i].css('margin-left', margin);
            }
        };

        $(window).on('resize', self.resize).resize(); // trigger so labels get correctly aligned on creation

        // handle rcmap & rssi aux channel
        var strBuffer = [], rcMapLetters = FC.getRcMapLetters();
        for (var i = 0; i < RC_MAP.length; i++) {
            strBuffer[RC_MAP[i]] = rcMapLetters[i];
        }

        // reconstruct
        var str = strBuffer.join(''),
            $rcMap = $('input[name="rcmap"]');

        // set current value
        $rcMap.val(str);

        /*
         * Send tracking event so we can know if users are using different mappings than EATR
         */
        googleAnalytics.sendEvent('Setting', 'RcMappingRead', str);

        // validation / filter
        var last_valid = str;

        $rcMap.on('input', function () {
            var val = $(this).val();

            // limit length to max 8
            if (val.length > 8) {
                val = val.substr(0, 8);
                $(this).val(val);
            }
        });

        $rcMap.focusout(function () {
            if (!FC.isRcMapValid($(this).val()))
                $(this).val(last_valid);
        });

        $rcMap.on('input change', function() {
            $(this).css("color", FC.isRcMapValid($(this).val()) ? "" : "#FF0000");
        });

        // handle helper
        $('select[name="rcmap_helper"]').val(0); // go out of bounds
        $('select[name="rcmap_helper"]').change(function () {
            $rcMap.val($(this).val());
        });

        // rssi
        var rssi_channel_e = $('select[name="rssi_channel"]');
        rssi_channel_e.append('<option value="0">Disabled</option>');
        for (var i = 5; i < RC.active_channels + 1; i++) {
            rssi_channel_e.append('<option value="' + i + '">CH' + i + '</option>');
        }

        $('select[name="rssi_channel"]').val(MISC.rssi_channel);

        var rateHeight = TABS.receiver.rateChartHeight;

        // UI Hooks
        // curves
        $('.tunings .throttle input').on('input change', function () {
            setTimeout(function () { // let global validation trigger and adjust the values first
                var throttleMidE = $('.tunings .throttle input[name="mid"]'),
                    throttleExpoE = $('.tunings .throttle input[name="expo"]'),
                    mid = parseFloat(throttleMidE.val()),
                    expo = parseFloat(throttleExpoE.val()),
                    throttle_curve = $('.throttle_curve canvas').get(0),
                    context = throttle_curve.getContext("2d");

                // local validation to deal with input event
                if (mid >= parseFloat(throttleMidE.prop('min')) &&
                    mid <= parseFloat(throttleMidE.prop('max')) &&
                    expo >= parseFloat(throttleExpoE.prop('min')) &&
                    expo <= parseFloat(throttleExpoE.prop('max'))) {
                    // continue
                } else {
                    return;
                }

                // math magic by englishman
                var midx = 200 * mid,
                    midxl = midx * 0.5,
                    midxr = (((200 - midx) * 0.5) + midx),
                    midy = rateHeight - (midx * (rateHeight / 200)),
                    midyl = rateHeight - ((rateHeight - midy) * 0.5 * (expo + 1)),
                    midyr = (midy / 2) * (expo + 1);

                // draw
                context.clearRect(0, 0, 200, rateHeight);
                context.beginPath();
                context.moveTo(0, rateHeight);
                context.quadraticCurveTo(midxl, midyl, midx, midy);
                context.moveTo(midx, midy);
                context.quadraticCurveTo(midxr, midyr, 200, 0);
                context.lineWidth = 2;
                context.strokeStyle = '#37a8db';
                context.stroke();
            }, 0);
        }).trigger('input');

        $('.tunings .rate input').on('input change', function () {
            setTimeout(function () { // let global validation trigger and adjust the values first
                drawRollPitchExpo();
            }, 0);
        }).trigger('input');

        $('a.refresh').click(function () {
            MSP.send_message(MSPCodes.MSP_RC_TUNING, false, false, function () {
                GUI.log(chrome.i18n.getMessage('receiverDataRefreshed'));

                // fill in data from RC_tuning
                $('.tunings .throttle input[name="mid"]').val(RC_tuning.throttle_MID.toFixed(2));
                $('.tunings .throttle input[name="expo"]').val(RC_tuning.throttle_EXPO.toFixed(2));

                $('.tunings .rate input[name="expo"]').val(RC_tuning.RC_EXPO.toFixed(2));

                // update visual representation
                $('.tunings .throttle input').change();
                $('.tunings .rate input').change();
            });
        });

        $('a.update').click(function () {
            // catch RC_tuning changes
            RC_tuning.throttle_MID = parseFloat($('.tunings .throttle input[name="mid"]').val());
            RC_tuning.throttle_EXPO = parseFloat($('.tunings .throttle input[name="expo"]').val());

            RC_tuning.RC_EXPO = parseFloat($('.tunings .rate input[name="expo"]').val());
            RC_tuning.RC_YAW_EXPO = parseFloat($('.tunings .yaw_rate input[name="yaw_expo"]').val());

            RC_tuning.manual_RC_EXPO = parseFloat($('.tunings .rate input[name="manual_expo"]').val());
            RC_tuning.manual_RC_YAW_EXPO = parseFloat($('.tunings .yaw_rate input[name="manual_yaw_expo"]').val());

            RC_deadband.yaw_deadband = parseInt($('.deadband input[name="yaw_deadband"]').val());
            RC_deadband.deadband = parseInt($('.deadband input[name="deadband"]').val());

            // catch rc map
            var rcMapValue = $('input[name="rcmap"]').val();
            var strBuffer = rcMapValue.split('');

            /*
             * Send tracking event so we can know if users are using different mappings than EATR
             */
            googleAnalytics.sendEvent('Setting', 'RcMappingSave', rcMapValue);

            for (var i = 0; i < RC_MAP.length; i++) {
                RC_MAP[i] = strBuffer.indexOf(FC.getRcMapLetters()[i]);
            }

            // catch rssi aux
            MISC.rssi_channel = parseInt($('select[name="rssi_channel"]').val());

            function save_rc_map() {
                MSP.send_message(MSPCodes.MSP_SET_RX_MAP, mspHelper.crunch(MSPCodes.MSP_SET_RX_MAP), false, save_misc);
            }

            function save_misc() {
                MSP.send_message(MSPCodes.MSP_SET_MISC, mspHelper.crunch(MSPCodes.MSP_SET_MISC), false, save_rc_configs);
            }

            function save_rc_configs() {
                MSP.send_message(MSPCodes.MSP_SET_RC_DEADBAND, mspHelper.crunch(MSPCodes.MSP_SET_RC_DEADBAND), false, save_to_eeprom);
            }

            function save_to_eeprom() {
                MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, function () {
                    GUI.log(chrome.i18n.getMessage('receiverEepromSaved'));
                });
            }

            if (semver.gte(CONFIG.flightControllerVersion, '1.8.1')) {
                MSP.send_message(MSPCodes.MSPV2_INAV_SET_RATE_PROFILE, mspHelper.crunch(MSPCodes.MSPV2_INAV_SET_RATE_PROFILE), false, save_rc_map);
            } else {
                MSP.send_message(MSPCodes.MSP_SET_RC_TUNING, mspHelper.crunch(MSPCodes.MSP_SET_RC_TUNING), false, save_rc_map);
            }
        });

        $("a.sticks").click(function () {
            var
                windowWidth = 420,
                windowHeight = Math.min(window.innerHeight, 720);

            chrome.app.window.create("/tabs/receiver_msp.html", {
                id: "receiver_msp",
                innerBounds: {
                    minWidth: windowWidth, minHeight: windowHeight,
                    width: windowWidth, height: windowHeight,
                    maxWidth: windowWidth, maxHeight: windowHeight
                },
                alwaysOnTop: true
            }, function (createdWindow) {
                // Give the window a callback it can use to send the channels (otherwise it can't see those objects)
                createdWindow.contentWindow.setRawRx = function (channels) {
                    if (CONFIGURATOR.connectionValid && GUI.active_tab != 'cli') {
                        mspHelper.setRawRx(channels);
                        return true;
                    } else {
                        return false;
                    }
                }
            });
        });

        // Only show the MSP control sticks if the MSP Rx feature is enabled
        $(".sticks_btn").toggle(FC.isRxTypeEnabled('RX_MSP'));

        function get_rc_data() {

            /*
             * Throttling
             */
            if (helper.mspQueue.shouldDrop()) {
                update_ui();
                return;
            }

            MSP.send_message(MSPCodes.MSP_RC, false, false, update_ui);
        }

        function update_ui() {
            var i;

            // update bars with latest data
            for (i = 0; i < RC.active_channels; i++) {
                meter_fill_array[i].css('width', ((RC.channels[i] - meter_scale.min) / (meter_scale.max - meter_scale.min) * 100).clamp(0, 100) + '%');
                meter_label_array[i].text(RC.channels[i]);
            }

        }

        helper.mspBalancedInterval.add('receiver_pull', 35, 1, get_rc_data);

        GUI.content_ready(callback);
    }
};

TABS.receiver.cleanup = function (callback) {
    $(window).off('resize', this.resize);

    if (callback) callback();
};
