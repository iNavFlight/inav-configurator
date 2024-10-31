'use strict';

const path = require('path');

const MSPChainerClass = require('./../js/msp/MSPchainer');
const mspHelper = require('./../js/msp/MSPHelper');
const MSPCodes = require('./../js/msp/MSPCodes');
const MSP = require('./../js/msp');
const { GUI, TABS } = require('./../js/gui');
const FC = require('./../js/fc');
const CONFIGURATOR = require('./../js/data_storage');
const Settings = require('./../js/settings');
const i18n = require('./../js/localization');
const interval = require('./../js/intervals');

const channelColors = [
    '#f1453d', '#673fb4', '#2b98f0', '#1fbcd2',
    '#159588', '#50ae55', '#cdda49', '#fdc02f',
    '#fc5830', '#785549', '#9e9e9e', '#617d8a',
    '#cf267d', '#7a1464', '#3a7a14', '#14407a',
    '#e36b4b', '#7d54b8', '#349ae3', '#1ac8e6',
    '#18a399', '#5cb766', '#d7e35b', '#ffc945',
    '#ff7f48', '#90694e', '#acacac', '#738b9c',
    '#d4398c', '#8c1b72', '#46891b', '#1655a0',
    '#f28571', '#8360c6', '#3fb0ff', '#33d1ff',
    '#1bbca1', '#67c574'
];

TABS.receiver = {
    rateChartHeight: 137
};

TABS.receiver.initialize = function (callback) {
    var self = this;

    if (GUI.active_tab != 'receiver') {
        GUI.active_tab = 'receiver';
    }

    var loadChainer = new MSPChainerClass();

    var loadChain = [
        mspHelper.loadMiscV2,
        mspHelper.loadRcData,
        mspHelper.loadRcMap,
        mspHelper.loadRxConfig,
        mspHelper.loadRcDeadband
    ];

    loadChain.push(mspHelper.loadRateProfileData);
    loadChainer.setChain(loadChain);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    function load_html() {
        GUI.load(path.join(__dirname, "receiver.html"), Settings.processHtml(process_html));
    }

    function saveSettings(onComplete) {
        Settings.saveInputs(onComplete);
    }

    function process_html() {
        // translate to user-selected language
       i18n.localize();;

        let $receiverMode = $('#receiver_type'),
            $serialWrapper = $('#serialrx_provider-wrapper');

        // Order Serial Rx providers
        let serialRxProviders = $('#serialrx_provider option');
        let selectedRxProvider = $('#serialrx_provider').val();
        serialRxProviders.sort(function(a,b) {
            if (a.text > b.text) {
                return 1;
            } else if (a.text < b.text) {
                return -1;
            } else {
                return 0;
            }
        });
        $("#serialrx_provider").empty().append(serialRxProviders);
        $('#serialrx_provider').val(selectedRxProvider);

        $receiverMode.on('change', function () {
            if ($(this).find("option:selected").text() == "SERIAL") {
                $serialWrapper.show();
                $receiverMode.parent().removeClass("no-bottom-border");
            } else {
                $serialWrapper.hide();
                $receiverMode.parent().addClass("no-bottom-border");
            }
        });

        $receiverMode.trigger("change");

        // fill in data from RC_tuning
        $('.tunings .throttle input[name="mid"]').val(FC.RC_tuning.throttle_MID.toFixed(2));
        $('.tunings .throttle input[name="expo"]').val(FC.RC_tuning.throttle_EXPO.toFixed(2));

        $('.deadband input[name="yaw_deadband"]').val(FC.RC_deadband.yaw_deadband);
        $('.deadband input[name="deadband"]').val(FC.RC_deadband.deadband);

        // generate bars
        var bar_names = [
                i18n.getMessage('controlAxisRoll'),
                i18n.getMessage('controlAxisPitch'),
                i18n.getMessage('controlAxisYaw'),
                i18n.getMessage('controlAxisThrottle')
            ];
        let channelsWrapper = $('#channels-wrapper');

        for (var i = 0; i < FC.RC.active_channels; i++) {
            var name;
            if (i < bar_names.length) {
                name = bar_names[i];
            } else {
                name = i18n.getMessage("radioChannelShort") + (i + 1);
            }

            channelsWrapper.append(`
                <div data-channel-name="${name}" class="hstack py-1">
                    <div class="w-7r">${name}</div>
                    <div class="progress position-relative flex-fill"
                        style="--inav-progress-height: 1.5rem; --inav-progress-bar-transition: none; --inav-progress-bar-bg: ${channelColors[i]};">
                        <div class="progress-label position-absolute w-100 h-100 text-center fw-bold fs-6" style="line-height: var(--inav-progress-height); ">1500</div>
                        <div class="progress-bar"></div>
                    </div>
                </div>
            `);
        }

        // we could probably use min and max throttle for the range, will see
        var meter_scale = {
            'min': 800,
            'max': 2200
        };

        let channelList = [];
        $('#channels-wrapper .hstack .progress').each(function () {
            channelList.push($(this));
        });

        // handle rcmap & rssi aux channel
        var strBuffer = [], rcMapLetters = FC.getRcMapLetters();
        for (var i = 0; i < FC.RC_MAP.length; i++) {
            strBuffer[FC.RC_MAP[i]] = rcMapLetters[i];
        }

        // reconstruct
        var str = strBuffer.join(''),
            $rcMap = $('input[name="rcmap"]');

        // set current value
        $rcMap.val(str);

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
        $('select[name="rcmap_helper"]').on('change', function () {
            $rcMap.val($(this).val());
        });

        // rssi
        var rssi_channel_e = $('select[name="rssi_channel"]');
        rssi_channel_e.append('<option value="0">Disabled</option>');
        for (var i = 5; i < FC.RC.active_channels + 1; i++) {
            rssi_channel_e.append('<option value="' + i + '">CH' + i + '</option>');
        }

        $('select[name="rssi_channel"]').val(FC.MISC.rssi_channel);

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

        $('#save-btn').on('click', function () {
            // catch RC_tuning changes
            FC.RC_tuning.throttle_MID = parseFloat($('.tunings .throttle input[name="mid"]').val());
            FC.RC_tuning.throttle_EXPO = parseFloat($('.tunings .throttle input[name="expo"]').val());

            FC.RC_deadband.yaw_deadband = parseInt($('.deadband input[name="yaw_deadband"]').val());
            FC.RC_deadband.deadband = parseInt($('.deadband input[name="deadband"]').val());

            // catch rc map
            var rcMapValue = $('input[name="rcmap"]').val();
            var strBuffer = rcMapValue.split('');


            for (var i = 0; i < FC.RC_MAP.length; i++) {
                FC.RC_MAP[i] = strBuffer.indexOf(FC.getRcMapLetters()[i]);
            }

            // catch rssi aux
            FC.MISC.rssi_channel = parseInt($('select[name="rssi_channel"]').val());

            function save_rc_map() {
                MSP.send_message(MSPCodes.MSP_SET_RX_MAP, mspHelper.crunch(MSPCodes.MSP_SET_RX_MAP), false, save_misc);
            }

            function save_misc() {
                MSP.send_message(MSPCodes.MSPV2_INAV_SET_MISC, mspHelper.crunch(MSPCodes.MSPV2_INAV_SET_MISC), false, save_rc_configs);
            }

            function save_rc_configs() {
                MSP.send_message(MSPCodes.MSP_SET_RC_DEADBAND, mspHelper.crunch(MSPCodes.MSP_SET_RC_DEADBAND), false, storeSettings);
            }

            function storeSettings() {
                saveSettings(save_to_eeprom);
            }

            function save_to_eeprom() {
                MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, function () {
                    GUI.log(i18n.getMessage('receiverEepromSaved'));

                    GUI.tab_switch_cleanup(function () {
                        MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function () {
                            GUI.log(i18n.getMessage('deviceRebooting'));
                            GUI.handleReconnect($('[data-tab="receiver"] > a'));
                        });
                    });
                });
            }

            MSP.send_message(MSPCodes.MSPV2_INAV_SET_RATE_PROFILE, mspHelper.crunch(MSPCodes.MSPV2_INAV_SET_RATE_PROFILE), false, save_rc_map);
        });

        $("#sticks-btn").on('click', function () {
            var mspWin = window.open("tabs/receiver_msp.html", "receiver_msp", "width=420,height=760,menubar=no,contextIsolation=no,nodeIntegration=yes");
            
            mspWin.window.setRawRx = function (channels) {
                if (CONFIGURATOR.connectionValid && GUI.active_tab != 'cli') {
                    mspHelper.setRawRx(channels);
                    return true;
                } else {
                    return false;
                }
            }
        });

        // Only show the MSP control sticks if the MSP Rx feature is enabled
        mspHelper.getSetting("receiver_type").then(function (s) {
            if (s && s.setting.table && s.setting.table.values) {
                $("#sticks-btn").toggle(s.setting.table.values[s.value] == 'MSP');
            }
        });

        function get_rc_data() {
            MSP.send_message(MSPCodes.MSP_RC, false, false, update_ui);
        }

        function update_ui() {
            // update bars with latest data
            for (let i = 0; i < FC.RC.active_channels; i++) {
                $('.progress-bar', channelList[i]).css('width', ((FC.RC.channels[i] - meter_scale.min) / (meter_scale.max - meter_scale.min) * 100).clamp(0, 100) + '%');
                $('.progress-label', channelList[i]).text(FC.RC.channels[i]);
            }
        }

        interval.add('receiver_pull', get_rc_data, 25);

        GUI.content_ready(callback);
    }
};

TABS.receiver.cleanup = function (callback) {
    $(window).off('resize', this.resize);

    if (callback) callback();
};
