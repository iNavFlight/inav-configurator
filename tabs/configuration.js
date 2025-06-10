'use strict';

const path = require('path');

const MSPChainerClass = require('./../js/msp/MSPchainer');
const mspHelper = require('./../js/msp/MSPHelper');
const MSPCodes = require('./../js/msp/MSPCodes');
const MSP = require('./../js/msp');
const { GUI, TABS } = require('./../js/gui');
const FC = require('./../js/fc');
const interval = require('./../js/intervals');
const VTX = require('./../js/vtx');
const i18n = require('./../js/localization');
const Settings = require('./../js/settings');
const features = require('./../js/feature_framework');

TABS.configuration = {};

TABS.configuration.initialize = function (callback, scrollPosition) {

    if (GUI.active_tab != 'configuration') {
        GUI.active_tab = 'configuration';

    }

    var loadChainer = new MSPChainerClass();

    var loadChain = [
        mspHelper.loadFeatures,
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
        mspHelper.saveAdvancedConfig,
        mspHelper.saveVTXConfig,
        mspHelper.saveCurrentMeterConfig,
        mspHelper.saveMiscV2,
        saveSettings,
        mspHelper.saveToEeprom
    ];

    function saveSettings(onComplete) {
        Settings.saveInputs(onComplete);
    }

    saveChainer.setChain(saveChain);
    saveChainer.setExitPoint(reboot);

    function reboot() {
        //noinspection JSUnresolvedVariable
        GUI.log(i18n.getMessage('configurationEepromSaved'));

        GUI.tab_switch_cleanup(function () {
            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, reinitialize);
        });
    }

    function reinitialize() {
        //noinspection JSUnresolvedVariable
        GUI.log(i18n.getMessage('deviceRebooting'));
        GUI.handleReconnect($('.tab_configuration a'));
    }

    function load_html() {
        GUI.load(path.join(__dirname, "configuration.html"), Settings.processHtml(process_html));
    }

    function process_html() {

        let i;

        // generate features
        var fcFeatures = FC.getFeatures();

        var features_e = $('.features');
        for (let i = 0; i < fcFeatures.length; i++) {
            var row_e,
                tips = [],
                feature_tip_html = '';

            if (fcFeatures[i].showNameInTip) {
                tips.push(i18n.getMessage("manualEnablingTemplate").replace("{name}", fcFeatures[i].name));
            }

            if (fcFeatures[i].haveTip) {
                tips.push(i18n.getMessage("feature" + fcFeatures[i].name + "Tip"));
            }

            if (tips.length > 0) {
                feature_tip_html = '<div class="helpicon cf_tip" title="' + tips.join("<br><br>") + '"></div>';
            }

            row_e = $('<div class="checkbox">' +
                '<input type="checkbox" data-bit="' + fcFeatures[i].bit + '" class="feature toggle" name="' + fcFeatures[i].name + '" title="' + fcFeatures[i].name + '"' +
                ' id="feature-' + fcFeatures[i].bit + '" ' +
                '>' +
                '<label for="feature-' + fcFeatures[i].bit + '">' +
                '<span data-i18n="feature' + fcFeatures[i].name + '"></span>' +
                '</label>' +
                feature_tip_html +
                '</div>');

            features_e.each(function () {
                if ($(this).hasClass(fcFeatures[i].group)) {
                    $(this).after(row_e);
                }
            });
        }

        features.updateUI($('.tab-configuration'), FC.FEATURES);

        // translate to user-selected language
       i18n.localize();;

        // VTX
        var config_vtx = $('.config-vtx');
        if (FC.VTX_CONFIG.device_type != VTX.DEV_UNKNOWN) {

            var vtx_band = $('#vtx_band');
            vtx_band.empty();
            var vtx_no_band_note = $('#vtx_no_band');
            if (FC.VTX_CONFIG.band < VTX.BAND_MIN || FC.VTX_CONFIG.band > VTX.BAND_MAX) {
                var noBandName = i18n.getMessage("configurationNoBand");
                $('<option value="0">' + noBandName + '</option>').appendTo(vtx_band);
                vtx_no_band_note.show();
            } else {
                vtx_no_band_note.hide();
            }
            for (var ii = 0; ii < VTX.BANDS.length; ii++) {
                var band_name = VTX.BANDS[ii].name;
                var option = $('<option value="' + VTX.BANDS[ii].code + '">' + band_name + '</option>');
                if (VTX.BANDS[ii].code == FC.VTX_CONFIG.band) {
                    option.prop('selected', true);
                }
                option.appendTo(vtx_band);
            }
            vtx_band.on('change', function () {
                FC.VTX_CONFIG.band = parseInt($(this).val());
            });

            var vtx_channel = $('#vtx_channel');
            vtx_channel.empty();
            for (var ii = VTX.CHANNEL_MIN; ii <= VTX.CHANNEL_MAX; ii++) {
                var option = $('<option value="' + ii + '">' + ii + '</option>');
                if (ii == FC.VTX_CONFIG.channel) {
                    option.prop('selected', true);
                }
                option.appendTo(vtx_channel);
            }
            vtx_channel.on('change', function () {
                FC.VTX_CONFIG.channel = parseInt($(this).val());
            });

            var vtx_power = $('#vtx_power');
            vtx_power.empty();
            var minPower = VTX.getMinPower(FC.VTX_CONFIG.device_type);
            var maxPower = VTX.getMaxPower(FC.VTX_CONFIG.device_type);
            for (var ii = minPower; ii <= maxPower; ii++) {
                var option = $('<option value="' + ii + '">' + ii + '</option>');
                if (ii == FC.VTX_CONFIG.power) {
                    option.prop('selected', true);
                }
                option.appendTo(vtx_power);
            }
            vtx_power.on('change', function () {
                FC.VTX_CONFIG.power = parseInt($(this).val());
            });

            var vtx_low_power_disarm = $('#vtx_low_power_disarm');
            vtx_low_power_disarm.empty();
            for (var ii = VTX.LOW_POWER_DISARM_MIN; ii <= VTX.LOW_POWER_DISARM_MAX; ii++) {
                var name = i18n.getMessage("configurationVTXLowPowerDisarmValue_" + ii);
                if (!name) {
                    name = ii;
                }
                var option = $('<option value="' + ii + '">' + name + '</option>');
                if (ii == FC.VTX_CONFIG.low_power_disarm) {
                    option.prop('selected', true);
                }
                option.appendTo(vtx_low_power_disarm);
            }
            vtx_low_power_disarm.on('change', function () {
                FC.VTX_CONFIG.low_power_disarm = parseInt($(this).val());
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
        $('input[name="board_align_yaw"]').val((FC.BOARD_ALIGNMENT.yaw / 10.0).toFixed(1));

        // fill magnetometer
        //UPDATE: moved to GPS tab and hidden
        //$('#mag_declination').val(FC.MISC.mag_declination);

        // fill battery voltage
        $('#voltagesource').val(FC.MISC.voltage_source);
        $('#cells').val(FC.MISC.battery_cells);
        $('#celldetectvoltage').val(FC.MISC.vbatdetectcellvoltage);
        $('#mincellvoltage').val(FC.MISC.vbatmincellvoltage);
        $('#maxcellvoltage').val(FC.MISC.vbatmaxcellvoltage);
        $('#warningcellvoltage').val(FC.MISC.vbatwarningcellvoltage);
        $('#voltagescale').val(FC.MISC.vbatscale);

        // fill current
        $('#currentscale').val(FC.CURRENT_METER_CONFIG.scale);
        $('#currentoffset').val(FC.CURRENT_METER_CONFIG.offset / 10);

        // fill battery capacity
        $('#battery_capacity').val(FC.MISC.battery_capacity);
        let batCapWarn = Math.round(FC.MISC.battery_capacity_warning * 100 / FC.MISC.battery_capacity);
        $('#battery_capacity_warning').val(isNaN(batCapWarn) ? "" : batCapWarn);
        let batCapWarnCrit = Math.round(FC.MISC.battery_capacity_critical * 100 / FC.MISC.battery_capacity);
        $('#battery_capacity_critical').val(isNaN(batCapWarnCrit) ? "" : batCapWarnCrit);
        $('#battery_capacity_unit').val(FC.MISC.battery_capacity_unit);

        let $i2cSpeed = $('#i2c_speed'),
            $i2cSpeedInfo = $('#i2c_speed-info');

        $i2cSpeed.on('change', function () {
            let $this = $(this),
                value = $this.children("option:selected").text();

            if (value == "400KHZ") {

                $i2cSpeedInfo.removeClass('ok-box');
                $i2cSpeedInfo.addClass('info-box');
                $i2cSpeedInfo.removeClass('warning-box');

                $i2cSpeedInfo.html(i18n.getMessage('i2cSpeedSuggested800khz'));
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
                $i2cSpeedInfo.html(i18n.getMessage('i2cSpeedTooLow'));
                $i2cSpeedInfo.show();
            }

        });

        $i2cSpeed.trigger('change');

        $('a.save').on('click', function () {
            //UPDATE: moved to GPS tab and hidden
            //FC.MISC.mag_declination = parseFloat($('#mag_declination').val());

            FC.MISC.battery_cells = parseInt($('#cells').val());
            FC.MISC.voltage_source = parseInt($('#voltagesource').val());
            FC.MISC.vbatdetectcellvoltage = parseFloat($('#celldetectvoltage').val());
            FC.MISC.vbatmincellvoltage = parseFloat($('#mincellvoltage').val());
            FC.MISC.vbatmaxcellvoltage = parseFloat($('#maxcellvoltage').val());
            FC.MISC.vbatwarningcellvoltage = parseFloat($('#warningcellvoltage').val());
            FC.MISC.vbatscale = parseInt($('#voltagescale').val());

            FC.MISC.battery_capacity = parseInt($('#battery_capacity').val());
            FC.MISC.battery_capacity_warning = parseInt($('#battery_capacity_warning').val() * FC.MISC.battery_capacity / 100);
            FC.MISC.battery_capacity_critical = parseInt($('#battery_capacity_critical').val() * FC.MISC.battery_capacity / 100);
            FC.MISC.battery_capacity_unit = $('#battery_capacity_unit').val();

            features.reset();
            features.fromUI($('.tab-configuration'));
            features.execute(function () {
                FC.CURRENT_METER_CONFIG.scale = parseInt($('#currentscale').val());
                FC.CURRENT_METER_CONFIG.offset = Math.round(parseFloat($('#currentoffset').val()) * 10);
                saveChainer.execute();
            });
        });
        interval.add('config_load_analog', function () {
            $('#batteryvoltage').val([FC.ANALOG.voltage.toFixed(2)]);
            $('#batterycurrent').val([FC.ANALOG.amperage.toFixed(2)]);
        }, 100, true); // 10 fps

        GUI.content_ready(callback);
    }
};

TABS.configuration.cleanup = function (callback) {
    if (callback) callback();
};
