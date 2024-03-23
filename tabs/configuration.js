/*global chrome,GUI,FC_CONFIG,$,mspHelper,googleAnalytics,ADVANCED_CONFIG,VTX_CONFIG,CONFIG,MSPChainerClass,BOARD_ALIGNMENT,TABS,MISC*/
'use strict';

TABS.configuration = {};

TABS.configuration.initialize = function (callback, scrollPosition) {

    if (GUI.active_tab != 'configuration') {
        GUI.active_tab = 'configuration';
        googleAnalytics.sendAppView('Configuration');
    }

    var loadChainer = new MSPChainerClass();

    var loadChain = [
        mspHelper.loadFeatures,
        mspHelper.loadArmingConfig,
        mspHelper.loadSensorAlignment,
        mspHelper.loadAdvancedConfig,
        mspHelper.loadVTXConfig,
        mspHelper.loadBoardAlignment,
        mspHelper.loadCurrentMeterConfig,
        mspHelper.loadMiscV2
    ];

    loadChainer.setChain(loadChain);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    var saveChainer = new MSPChainerClass();

    var saveChain = [
        mspHelper.saveAccTrim,
        mspHelper.saveArmingConfig,
        mspHelper.saveAdvancedConfig,
        mspHelper.saveVTXConfig,
        mspHelper.saveCurrentMeterConfig,
        mspHelper.saveMiscV2,
        saveSettings,
        mspHelper.saveToEeprom
    ];

    function saveSettings(onComplete) {
        Settings.saveInputs().then(onComplete);
    }

    saveChainer.setChain(saveChain);
    saveChainer.setExitPoint(reboot);

    function reboot() {
        //noinspection JSUnresolvedVariable
        GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));

        GUI.tab_switch_cleanup(function () {
            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, reinitialize);
        });
    }

    function reinitialize() {
        //noinspection JSUnresolvedVariable
        GUI.log(chrome.i18n.getMessage('deviceRebooting'));
        GUI.handleReconnect($('.tab_configuration a'));
    }

    function load_html() {
        GUI.load("./tabs/configuration.html", Settings.processHtml(process_html));
    }

    function process_html() {

        let i;

        // generate features
        var features = FC.getFeatures();

        var features_e = $('.features');
        for (i = 0; i < features.length; i++) {
            var row_e,
                tips = [],
                feature_tip_html = '';

            if (features[i].showNameInTip) {
                tips.push(chrome.i18n.getMessage("manualEnablingTemplate").replace("{name}", features[i].name));
            }

            if (features[i].haveTip) {
                tips.push(chrome.i18n.getMessage("feature" + features[i].name + "Tip"));
            }

            if (tips.length > 0) {
                feature_tip_html = '<div class="helpicon cf_tip" title="' + tips.join("<br><br>") + '"></div>';
            }

            row_e = $('<div class="checkbox">' +
                '<input type="checkbox" data-bit="' + features[i].bit + '" class="feature toggle" name="' + features[i].name + '" title="' + features[i].name + '"' +
                ' id="feature-' + features[i].bit + '" ' +
                '>' +
                '<label for="feature-' + features[i].bit + '">' +
                '<span data-i18n="feature' + features[i].name + '"></span>' +
                '</label>' +
                feature_tip_html +
                '</div>');

            features_e.each(function () {
                if ($(this).hasClass(features[i].group)) {
                    $(this).after(row_e);
                }
            });
        }

        helper.features.updateUI($('.tab-configuration'), FEATURES);

        // translate to user-selected language
        localize();

        // VTX
        var config_vtx = $('.config-vtx');
        if (VTX_CONFIG.device_type != VTX.DEV_UNKNOWN) {

            var vtx_band = $('#vtx_band');
            vtx_band.empty();
            var vtx_no_band_note = $('#vtx_no_band');
            if (VTX_CONFIG.band < VTX.BAND_MIN || VTX_CONFIG.band > VTX.BAND_MAX) {
                var noBandName = chrome.i18n.getMessage("configurationNoBand");
                $('<option value="0">' + noBandName + '</option>').appendTo(vtx_band);
                vtx_no_band_note.show();
            } else {
                vtx_no_band_note.hide();
            }
            for (var ii = 0; ii < VTX.BANDS.length; ii++) {
                var band_name = VTX.BANDS[ii].name;
                var option = $('<option value="' + VTX.BANDS[ii].code + '">' + band_name + '</option>');
                if (VTX.BANDS[ii].code == VTX_CONFIG.band) {
                    option.prop('selected', true);
                }
                option.appendTo(vtx_band);
            }
            vtx_band.change(function () {
                VTX_CONFIG.band = parseInt($(this).val());
            });

            var vtx_channel = $('#vtx_channel');
            vtx_channel.empty();
            for (var ii = VTX.CHANNEL_MIN; ii <= VTX.CHANNEL_MAX; ii++) {
                var option = $('<option value="' + ii + '">' + ii + '</option>');
                if (ii == VTX_CONFIG.channel) {
                    option.prop('selected', true);
                }
                option.appendTo(vtx_channel);
            }
            vtx_channel.change(function () {
                VTX_CONFIG.channel = parseInt($(this).val());
            });

            var vtx_power = $('#vtx_power');
            vtx_power.empty();
            var minPower = VTX.getMinPower(VTX_CONFIG.device_type);
            var maxPower = VTX.getMaxPower(VTX_CONFIG.device_type);
            for (var ii = minPower; ii <= maxPower; ii++) {
                var option = $('<option value="' + ii + '">' + ii + '</option>');
                if (ii == VTX_CONFIG.power) {
                    option.prop('selected', true);
                }
                option.appendTo(vtx_power);
            }
            vtx_power.change(function () {
                VTX_CONFIG.power = parseInt($(this).val());
            });

            var vtx_low_power_disarm = $('#vtx_low_power_disarm');
            vtx_low_power_disarm.empty();
            for (var ii = VTX.LOW_POWER_DISARM_MIN; ii <= VTX.LOW_POWER_DISARM_MAX; ii++) {
                var name = chrome.i18n.getMessage("configurationVTXLowPowerDisarmValue_" + ii);
                if (!name) {
                    name = ii;
                }
                var option = $('<option value="' + ii + '">' + name + '</option>');
                if (ii == VTX_CONFIG.low_power_disarm) {
                    option.prop('selected', true);
                }
                option.appendTo(vtx_low_power_disarm);
            }
            vtx_low_power_disarm.change(function () {
                VTX_CONFIG.low_power_disarm = parseInt($(this).val());
            });

            config_vtx.show();
        } else {
            config_vtx.hide();
        }

        // for some odd reason chrome 38+ changes scroll according to the touched select element
        // i am guessing this is a bug, since this wasn't happening on 37
        // code below is a temporary fix, which we will be able to remove in the future (hopefully)
        //noinspection JSValidateTypes
        $('#content').scrollTop((scrollPosition) ? scrollPosition : 0);

        // fill board alignment
        $('input[name="board_align_yaw"]').val((BOARD_ALIGNMENT.yaw / 10.0).toFixed(1));

        // fill magnetometer
        //UPDATE: moved to GPS tab and hidden
        //$('#mag_declination').val(MISC.mag_declination);

        // fill battery voltage
        $('#voltagesource').val(MISC.voltage_source);
        $('#cells').val(MISC.battery_cells);
        $('#celldetectvoltage').val(MISC.vbatdetectcellvoltage);
        $('#mincellvoltage').val(MISC.vbatmincellvoltage);
        $('#maxcellvoltage').val(MISC.vbatmaxcellvoltage);
        $('#warningcellvoltage').val(MISC.vbatwarningcellvoltage);
        $('#voltagescale').val(MISC.vbatscale);

        // fill current
        $('#currentscale').val(CURRENT_METER_CONFIG.scale);
        $('#currentoffset').val(CURRENT_METER_CONFIG.offset / 10);

        // fill battery capacity
        $('#battery_capacity').val(MISC.battery_capacity);
        $('#battery_capacity_warning').val(Math.round(MISC.battery_capacity_warning * 100 / MISC.battery_capacity));
        $('#battery_capacity_critical').val(Math.round(MISC.battery_capacity_critical * 100 / MISC.battery_capacity));
        $('#battery_capacity_unit').val(MISC.battery_capacity_unit);

        let $i2cSpeed = $('#i2c_speed'),
            $i2cSpeedInfo = $('#i2c_speed-info');

        $i2cSpeed.change(function () {
            let $this = $(this),
                value = $this.children("option:selected").text();

            if (value == "400KHZ") {

                $i2cSpeedInfo.removeClass('ok-box');
                $i2cSpeedInfo.addClass('info-box');
                $i2cSpeedInfo.removeClass('warning-box');

                $i2cSpeedInfo.html(chrome.i18n.getMessage('i2cSpeedSuggested800khz'));
                $i2cSpeedInfo.show();

            } else if (value == "800KHZ") {
                $i2cSpeedInfo.removeClass('ok-box');
                $i2cSpeedInfo.removeClass('info-box');
                $i2cSpeedInfo.removeClass('warning-box');
                $i2cSpeedInfo.hide();
            } else {
                $i2cSpeedInfo.removeClass('ok-box');
                $i2cSpeedInfo.removeClass('info-box');
                $i2cSpeedInfo.addClass('warning-box');
                $i2cSpeedInfo.html(chrome.i18n.getMessage('i2cSpeedTooLow'));
                $i2cSpeedInfo.show();
            }

        });

        $i2cSpeed.change();

        $('a.save').click(function () {
            //UPDATE: moved to GPS tab and hidden
            //MISC.mag_declination = parseFloat($('#mag_declination').val());

            ARMING_CONFIG.auto_disarm_delay = parseInt($('input[name="autodisarmdelay"]').val());

            MISC.battery_cells = parseInt($('#cells').val());
            MISC.voltage_source = parseInt($('#voltagesource').val());
            MISC.vbatdetectcellvoltage = parseFloat($('#celldetectvoltage').val());
            MISC.vbatmincellvoltage = parseFloat($('#mincellvoltage').val());
            MISC.vbatmaxcellvoltage = parseFloat($('#maxcellvoltage').val());
            MISC.vbatwarningcellvoltage = parseFloat($('#warningcellvoltage').val());
            MISC.vbatscale = parseInt($('#voltagescale').val());

            MISC.battery_capacity = parseInt($('#battery_capacity').val());
            MISC.battery_capacity_warning = parseInt($('#battery_capacity_warning').val() * MISC.battery_capacity / 100);
            MISC.battery_capacity_critical = parseInt($('#battery_capacity_critical').val() * MISC.battery_capacity / 100);
            MISC.battery_capacity_unit = $('#battery_capacity_unit').val();

            googleAnalytics.sendEvent('Setting', 'I2CSpeed', $('#i2c_speed').children("option:selected").text());

            googleAnalytics.sendEvent('Board', 'Accelerometer', $('#sensor-acc').children("option:selected").text());
            googleAnalytics.sendEvent('Board', 'Magnetometer', $('#sensor-mag').children("option:selected").text());
            googleAnalytics.sendEvent('Board', 'Barometer', $('#sensor-baro').children("option:selected").text());
            googleAnalytics.sendEvent('Board', 'Pitot', $('#sensor-pitot').children("option:selected").text());

            for (var i = 0; i < features.length; i++) {
                var featureName = features[i].name;
                if (FC.isFeatureEnabled(featureName, features)) {
                    googleAnalytics.sendEvent('Setting', 'Feature', featureName);
                }
            }

            helper.features.reset();
            helper.features.fromUI($('.tab-configuration'));
            helper.features.execute(function () {
                CURRENT_METER_CONFIG.scale = parseInt($('#currentscale').val());
                CURRENT_METER_CONFIG.offset = Math.round(parseFloat($('#currentoffset').val()) * 10);
                saveChainer.execute();
            });
        });

        helper.interval.add('config_load_analog', function () {
            $('#batteryvoltage').val([ANALOG.voltage.toFixed(2)]);
            $('#batterycurrent').val([ANALOG.amperage.toFixed(2)]);
        }, 100, true); // 10 fps

        GUI.content_ready(callback);
    }
};

TABS.configuration.cleanup = function (callback) {
    if (callback) callback();
};
