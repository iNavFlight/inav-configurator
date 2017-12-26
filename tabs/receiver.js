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

    loadChainer.setChain([
        mspHelper.loadRcTuningData,
        mspHelper.loadMisc,
        mspHelper.loadRcData,
        mspHelper.loadRcMap,
        mspHelper.loadBfConfig,
        mspHelper.loadRcDeadband
    ]);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    function load_html() {
        $('#content').load("./tabs/receiver.html", process_html);
    }

    function process_html() {
        // translate to user-selected language
        localize();

        // fill in data from RC_tuning
        $('.tunings .throttle input[name="mid"]').val(RC_tuning.throttle_MID.toFixed(2));
        $('.tunings .throttle input[name="expo"]').val(RC_tuning.throttle_EXPO.toFixed(2));

        $('.tunings .rate input[name="expo"]').val(RC_tuning.RC_EXPO.toFixed(2));
        $('.tunings .yaw_rate input[name="yaw_expo"]').val(RC_tuning.RC_YAW_EXPO.toFixed(2));

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
        var strBuffer = [];
        for (var i = 0; i < RC_MAP.length; i++) {
            strBuffer[RC_MAP[i]] = FC.getRcMapLetters()[i];
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
            var val = $(this).val(),
                strBuffer = val.split(''),
                duplicityBuffer = [];

            if (val.length != 8) {
                $(this).val(last_valid);
                return false;
            }

            // check if characters inside are all valid, also check for duplicity
            for (var i = 0; i < val.length; i++) {
                if (FC.getRcMapLetters().indexOf(strBuffer[i]) < 0) {
                    $(this).val(last_valid);
                    return false;
                }

                if (duplicityBuffer.indexOf(strBuffer[i]) < 0) {
                    duplicityBuffer.push(strBuffer[i]);
                } else {
                    $(this).val(last_valid);
                    return false;
                }
            }
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
                var expoE = $('.tunings .rate input[name="expo"]'),
                    expo = parseFloat(expoE.val()),
                    pitch_roll_curve = $('.pitch_roll_curve canvas').get(0),
                    context = pitch_roll_curve.getContext("2d");

                // local validation to deal with input event
                if (expo >= parseFloat(expoE.prop('min')) &&
                    expo <= parseFloat(expoE.prop('max'))) {
                    // continue
                } else {
                    return;
                }

                // draw
                context.clearRect(0, 0, 200, rateHeight);
                context.beginPath();
                context.moveTo(0, rateHeight);
                context.quadraticCurveTo(110, rateHeight - ((rateHeight / 2) * (1 - expo)), 200, 0);
                context.lineWidth = 2;
                context.strokeStyle = '#37a8db';
                context.stroke();
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

            MSP.send_message(MSPCodes.MSP_SET_RC_TUNING, mspHelper.crunch(MSPCodes.MSP_SET_RC_TUNING), false, save_rc_map);
        });

        $("a.sticks").click(function () {
            var
                windowWidth = 370,
                windowHeight = 510;

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
        $(".sticks_btn").toggle(bit_check(BF_CONFIG.features, 14 /* RX_MSP */));

        var plot_update_rate = parseInt($(this).val(), 10);

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

        // setup plot
        var RX_plot_data = new Array(RC.active_channels);
        for (var i = 0; i < RX_plot_data.length; i++) {
            RX_plot_data[i] = [];
        }

        var samples = 0,
            svg = d3.select("svg"),
            RX_plot_e = $('#RX_plot'),
            margin = {top: 20, right: 0, bottom: 10, left: 40},
            width, height, widthScale, heightScale;

        function update_receiver_plot_size() {
            width = RX_plot_e.width() - margin.left - margin.right;
            height = RX_plot_e.height() - margin.top - margin.bottom;

            widthScale.range([0, width]);
            heightScale.range([height, 0]);
        }

        function update_ui() {
            var i;

            // update bars with latest data
            for (i = 0; i < RC.active_channels; i++) {
                meter_fill_array[i].css('width', ((RC.channels[i] - meter_scale.min) / (meter_scale.max - meter_scale.min) * 100).clamp(0, 100) + '%');
                meter_label_array[i].text(RC.channels[i]);
            }

            // push latest data to the main array
            for (i = 0; i < RC.active_channels; i++) {
                RX_plot_data[i].push([samples, RC.channels[i]]);
            }

            // Remove old data from array
            while (RX_plot_data[0].length > 300) {
                for (i = 0; i < RX_plot_data.length; i++) {
                    RX_plot_data[i].shift();
                }
            }

            // update required parts of the plot
            widthScale = d3.scale.linear().
                domain([(samples - 299), samples]);

            heightScale = d3.scale.linear().
                domain([800, 2200]);

            update_receiver_plot_size();

            var xGrid = d3.svg.axis().
                scale(widthScale).
                orient("bottom").
                tickSize(-height, 0, 0).
                tickFormat("");

            var yGrid = d3.svg.axis().
                scale(heightScale).
                orient("left").
                tickSize(-width, 0, 0).
                tickFormat("");

            var xAxis = d3.svg.axis().
                scale(widthScale).
                orient("bottom").
                tickFormat(function (d) {
                    return d;
                });

            var yAxis = d3.svg.axis().
                scale(heightScale).
                orient("left").
                tickFormat(function (d) {
                    return d;
                });

            var line = d3.svg.line().
                x(function (d) {
                    return widthScale(d[0]);
                }).
                y(function (d) {
                    return heightScale(d[1]);
                });

            svg.select(".x.grid").call(xGrid);
            svg.select(".y.grid").call(yGrid);
            svg.select(".x.axis").call(xAxis);
            svg.select(".y.axis").call(yAxis);

            var data = svg.select("g.data"),
                lines = data.selectAll("path").data(RX_plot_data, function (d, i) {
                    return i;
                });

            lines.enter().append("path").attr("class", "line");

            lines.attr('d', line);

            samples++;
        }

        helper.mspBalancedInterval.add('receiver_pull', 35, 1, get_rc_data);

        GUI.content_ready(callback);
    }
};

TABS.receiver.cleanup = function (callback) {
    $(window).off('resize', this.resize);

    if (callback) callback();
};
