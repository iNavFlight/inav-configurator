'use strict';

import MSPChainerClass from './../js/msp/MSPchainer';
import mspHelper from './../js/msp/MSPHelper';
import MSPCodes from './../js/msp/MSPCodes';
import MSP from './../js/msp';
import GUI from './../js/gui';
import FC from './../js/fc';
import CONFIGURATOR from './../js/data_storage';
import Settings from './../js/settings';
import i18n from './../js/localization';
import interval from './../js/intervals';

const receiverTab = {
    rateChartHeight: 117
};

receiverTab.initialize = function (callback) {
    var self = this;

    if (GUI.active_tab !== this) {
        GUI.active_tab = this;
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
        import('./receiver.html?raw').then(({default: html}) => GUI.load(html, Settings.processHtml(process_html)));
    }

    function saveSettings(onComplete) {
        Settings.saveInputs(onComplete);
    }

    function process_html(settingsPromise) {
        // translate to user-selected language
       i18n.localize();;

        const $primaryMode = $('#receiver_type');
        const $primaryWrapper = $('#serialrx_provider-wrapper');
        const $primaryProvider = $('#serialrx_provider');
        const $secondaryMode = $('#receiver_type_rx2');
        const $secondaryWrapper = $('#serialrx_provider_rx2-wrapper');
        const $secondaryProvider = $('#serialrx_provider_rx2');
        let dualRxEnabled = false;

        function setupReceiverMode($modeSelect, $serialWrapper, $providerSelect, enableFrSky) {
            let serialRxProviders = $providerSelect.find('option');
            const selectedRxProvider = $providerSelect.val();
            serialRxProviders.sort(function(a, b) {
                return a.text.localeCompare(b.text);
            });
            $providerSelect.empty().append(serialRxProviders);
            $providerSelect.val(selectedRxProvider);

            $providerSelect.on('change', function() {
                if (!enableFrSky) {
                    return;
                }
                const frSkyRXProviders = ["SBUS", "FPORT", "FPORT2", "FBUS"];
                $('#frSkyOptions').toggle(frSkyRXProviders.includes($(this).find('option:selected').text()));
            });

            $modeSelect.on('change', function () {
                if ($(this).find('option:selected').text() === 'SERIAL') {
                    $serialWrapper.show();
                    $providerSelect.trigger('change');
                    $modeSelect.parent().removeClass('no-bottom-border');
                } else {
                    $serialWrapper.hide();
                    if (enableFrSky) {
                        $('#frSkyOptions').hide();
                    }
                    $modeSelect.parent().addClass('no-bottom-border');
                }
            });
        }

        setupReceiverMode($primaryMode, $primaryWrapper, $primaryProvider, true);
        setupReceiverMode($secondaryMode, $secondaryWrapper, $secondaryProvider, false);

        function dualStatusText(status) {
            const keys = [
                'receiverDualDisabled',
                'receiverDualOk',
                'receiverDualRx1NotConfigured',
                'receiverDualRx2NotConfigured',
                'receiverDualUnsupportedPair',
                'receiverDualInitFailed',
            ];
            return i18n.getMessage(keys[status] || 'receiverStatusUnavailable');
        }

        function switchReasonText(reason) {
            const keys = [
                'receiverSwitchBoot',
                'receiverSwitchLinkLoss',
                'receiverSwitchLogicHandover',
                'receiverSwitchMspHandover',
                'receiverSwitchApiHandover',
            ];
            return i18n.getMessage(keys[reason] || 'receiverStatusUnavailable');
        }

        function linkStateText(status, link) {
            const bit = 1 << link;
            if (!(status.configuredMask & bit)) {
                return i18n.getMessage('receiverLinkNotConfigured');
            }
            if (!(status.initializedMask & bit)) {
                return i18n.getMessage('receiverLinkInitError');
            }
            if (!(status.validMask & bit)) {
                return i18n.getMessage('receiverLinkLost');
            }
            return i18n.getMessage('receiverLinkOk');
        }

        function linkMetricsText(status, link) {
            const bit = 1 << link;
            if (!(status.validMask & bit) || !(status.statsValidMask & bit)) {
                return '';
            }

            const metrics = status.links[link];
            const values = [];
            if (metrics.validFields & (1 << 0)) {
                values.push(metrics.uplinkRSSI + ' dBm');
            }
            if (metrics.validFields & (1 << 1)) {
                values.push('LQ ' + metrics.uplinkLQ + '%');
            }
            if (metrics.validFields & (1 << 3)) {
                values.push('SNR ' + metrics.uplinkSNR + ' dB');
            }
            return values.join(' · ');
        }

        function renderDualRxStatus() {
            if (!dualRxEnabled) {
                return;
            }

            const status = FC.RX_LINK_STATUS;
            const $rx1Button = $('.receiver-select-rx1');
            const $rx2Button = $('.receiver-select-rx2');

            if (status.extensionVersion !== 1 || status.active === null) {
                const unavailable = i18n.getMessage('receiverStatusUnavailable');
                $('.receiver-dual-active').text(unavailable);
                $('.receiver-dual-rx1').text(unavailable);
                $('.receiver-dual-rx2').text(unavailable);
                $('.receiver-dual-rx1-metrics, .receiver-dual-rx2-metrics').text('');
                $('.receiver-dual-health').text(unavailable);
                $('.receiver-dual-last-switch').text(unavailable);
                $rx1Button.add($rx2Button).addClass('disabled').attr('aria-disabled', 'true');
                return;
            }

            $('.receiver-dual-active').text(status.active === 0 ? 'RX1' : 'RX2');
            $('.receiver-dual-rx1').text(linkStateText(status, 0));
            $('.receiver-dual-rx2').text(linkStateText(status, 1));
            $('.receiver-dual-rx1-metrics').text(linkMetricsText(status, 0));
            $('.receiver-dual-rx2-metrics').text(linkMetricsText(status, 1));
            $('.receiver-dual-health').text(dualStatusText(status.dualStatus));
            $('.receiver-dual-last-switch').text(switchReasonText(status.lastSwitchReason) + ' @ ' + status.lastSwitchTimeMs + ' ms');

            const rx1Selectable = (status.validMask & 0x01) !== 0 && status.active !== 0;
            const rx2Selectable = (status.validMask & 0x02) !== 0 && status.active !== 1;
            $rx1Button.toggleClass('disabled', !rx1Selectable).attr('aria-disabled', rx1Selectable ? 'false' : 'true');
            $rx2Button.toggleClass('disabled', !rx2Selectable).attr('aria-disabled', rx2Selectable ? 'false' : 'true');
        }

        function refreshDualRxStatus() {
            if (!dualRxEnabled) {
                return;
            }
            mspHelper.loadRxLinkStatus(renderDualRxStatus);
        }

        function setDualRxUiEnabled(enabled) {
            dualRxEnabled = enabled;
            $('.receiver-secondary').toggleClass('is-hidden', !enabled);
            $('.receiver-dual-status').toggleClass('is-hidden', !enabled);
            $('.receiver-primary-title').text(i18n.getMessage(enabled ? 'receiverPrimaryMode' : 'configurationReceiver'));
            if (enabled) {
                refreshDualRxStatus();
            }
        }

        $('.receiver-dual-actions a').on('click', function(event) {
            event.preventDefault();
            const $button = $(this);
            if ($button.hasClass('disabled')) {
                return;
            }
            const link = Number.parseInt($button.data('rx-link'));
            mspHelper.setRxLink(link, function(success) {
                if (!success) {
                    GUI.log(i18n.getMessage('receiverHandoverRefused'));
                    return;
                }
                refreshDualRxStatus();
            });
        });

        // Wait for settings to load before triggering change events.
        settingsPromise.then(function() {
            $primaryMode.trigger('change');
            $secondaryMode.trigger('change');
            mspHelper.getSetting('dual_rx_enabled').then(function(setting) {
                setDualRxUiEnabled(!!(setting && setting.value));
            }).catch(function() {
                setDualRxUiEnabled(false);
            });
        });

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
            ],
            bar_container = $('.tab-receiver .bars');

        for (var i = 0; i < FC.RC.active_channels; i++) {
            var name;
            if (i < bar_names.length) {
                name = bar_names[i];
            } else {
                name = i18n.getMessage("radioChannelShort") + (i + 1);
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

        var rateHeight = receiverTab.rateChartHeight;

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

        $('a.update').on('click', function () {
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
                            GUI.handleReconnect($('.tab_receiver a'));
                        });
                    });
                });
            }

            MSP.send_message(MSPCodes.MSPV2_INAV_SET_RATE_PROFILE, mspHelper.crunch(MSPCodes.MSPV2_INAV_SET_RATE_PROFILE), false, save_rc_map);
        });

        $("a.sticks").on('click', function () {
            var mspWin = window.open("tabs/receiver_msp.html", "receiver_msp", "width=420,height=760,menubar=no");
            
            mspWin.window.setRawRx = function (channels) {
                if (CONFIGURATOR.connectionValid && GUI.active_tab != 'cli') {
                    mspHelper.setRawRx(channels);
                    return true;
                } else {
                    return false;
                }
            }
        });

        // Show MSP control sticks when either configured receiver uses MSP.
        Promise.all([
            mspHelper.getSetting('receiver_type'),
            mspHelper.getSetting('dual_rx_enabled').catch(function() { return null; }),
            mspHelper.getSetting('receiver_type_rx2').catch(function() { return null; }),
        ]).then(function(settings) {
            const primary = settings[0];
            const dual = settings[1];
            const secondary = settings[2];
            const primaryIsMsp = primary && primary.setting.table && primary.setting.table.values && primary.setting.table.values[primary.value] === 'MSP';
            const secondaryIsMsp = dual && dual.value && secondary && secondary.setting.table && secondary.setting.table.values && secondary.setting.table.values[secondary.value] === 'MSP';
            $('.sticks_btn').toggle(!!(primaryIsMsp || secondaryIsMsp));
        });

        function get_rc_data() {
            MSP.send_message(MSPCodes.MSP_RC, false, false, update_ui);
        }

        function update_ui() {
            // update bars with latest data
            for (let i = 0; i < FC.RC.active_channels; i++) {
                meter_fill_array[i].css('width', ((FC.RC.channels[i] - meter_scale.min) / (meter_scale.max - meter_scale.min) * 100).clamp(0, 100) + '%');
                meter_label_array[i].text(FC.RC.channels[i]);
            }

        }

        interval.add('receiver_pull', get_rc_data, 25);
        interval.add('dual_rx_status_pull', refreshDualRxStatus, 500);

        GUI.content_ready(callback);
    }
};

receiverTab.cleanup = function (callback) {
    $(window).off('resize', this.resize);

    if (callback) callback();
};

export default receiverTab;
