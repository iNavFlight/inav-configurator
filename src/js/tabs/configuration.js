/*global chrome,GUI,FC_CONFIG,$,mspHelper,googleAnalytics,ADVANCED_CONFIG*/
'use strict';

TABS.configuration = {};

TABS.configuration.initialize = function (callback, scrollPosition) {

    if (GUI.active_tab != 'configuration') {
        GUI.active_tab = 'configuration';
        googleAnalytics.sendAppView('Configuration');
    }

    var craftName = null;
    var loadCraftName = function (callback) {
        if (!CONFIG.name || CONFIG.name.trim() === '') {
            mspHelper.getCraftName(function (name) {
                craftName = name;
                callback();
            });
        } else {
            craftName = CONFIG.name;
            callback();
        }
    };

    var saveCraftName = function (callback) {
        mspHelper.setCraftName(craftName, callback);
    };

    var loadChainer = new MSPChainerClass();

    var loadChain = [
        mspHelper.loadBfConfig,
        mspHelper.loadArmingConfig,
        mspHelper.loadLoopTime,
        mspHelper.load3dConfig,
        mspHelper.loadSensorAlignment,
        mspHelper.loadAdvancedConfig,
        mspHelper.loadINAVPidConfig,
        mspHelper.loadSensorConfig,
        mspHelper.loadVTXConfig,
        mspHelper.loadMixerConfig,
        loadCraftName,
        mspHelper.loadMiscV2
    ];

    loadChainer.setChain(loadChain);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    var saveChainer = new MSPChainerClass();

    var saveChain = [
        mspHelper.saveBfConfig,
        mspHelper.save3dConfig,
        mspHelper.saveSensorAlignment,
        mspHelper.saveAccTrim,
        mspHelper.saveArmingConfig,
        mspHelper.saveLooptimeConfig,
        mspHelper.saveAdvancedConfig,
        mspHelper.saveINAVPidConfig,
        mspHelper.saveSensorConfig,
        mspHelper.saveVTXConfig,
        saveCraftName,
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
        for (let i = 0; i < features.length; i++) {
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

        helper.features.updateUI($('.tab-configuration'), BF_CONFIG.features);

        // translate to user-selected language
        localize();

        let alignments = FC.getSensorAlignments();
        let orientation_mag_e = $('select.magalign');

        for (let i = 0; i < alignments.length; i++) {
            orientation_mag_e.append('<option value="' + (i + 1) + '">' + alignments[i] + '</option>');
        }
        orientation_mag_e.val(SENSOR_ALIGNMENT.align_mag);

        // generate GPS
        var gpsProtocols = FC.getGpsProtocols();
        var gpsSbas = FC.getGpsSbasProviders();

        var gps_protocol_e = $('#gps_protocol');
        for (let i = 0; i < gpsProtocols.length; i++) {
            gps_protocol_e.append('<option value="' + i + '">' + gpsProtocols[i] + '</option>');
        }

        gps_protocol_e.change(function () {
            MISC.gps_type = parseInt($(this).val());
        });

        gps_protocol_e.val(MISC.gps_type);

        var gps_ubx_sbas_e = $('#gps_ubx_sbas');
        for (let i = 0; i < gpsSbas.length; i++) {
            gps_ubx_sbas_e.append('<option value="' + i + '">' + gpsSbas[i] + '</option>');
        }

        gps_ubx_sbas_e.change(function () {
            MISC.gps_ubx_sbas = parseInt($(this).val());
        });

        gps_ubx_sbas_e.val(MISC.gps_ubx_sbas);

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
        $('input[name="board_align_roll"]').val((BF_CONFIG.board_align_roll / 10.0).toFixed(1));
        $('input[name="board_align_pitch"]').val((BF_CONFIG.board_align_pitch / 10.0).toFixed(1));
        $('input[name="board_align_yaw"]').val((BF_CONFIG.board_align_yaw / 10.0).toFixed(1));

        // fill magnetometer
        $('#mag_declination').val(MISC.mag_declination);

        // fill battery voltage
        $('#voltagesource').val(MISC.voltage_source);
        $('#cells').val(MISC.battery_cells);
        $('#celldetectvoltage').val(MISC.vbatdetectcellvoltage);
        $('#mincellvoltage').val(MISC.vbatmincellvoltage);
        $('#maxcellvoltage').val(MISC.vbatmaxcellvoltage);
        $('#warningcellvoltage').val(MISC.vbatwarningcellvoltage);
        $('#voltagescale').val(MISC.vbatscale);

        // fill current
        $('#currentscale').val(BF_CONFIG.currentscale);
        $('#currentoffset').val(BF_CONFIG.currentoffset / 10);

        // fill battery capacity
        $('#battery_capacity').val(MISC.battery_capacity);
        $('#battery_capacity_warning').val(MISC.battery_capacity_warning * 100 / MISC.battery_capacity);
        $('#battery_capacity_critical').val(MISC.battery_capacity_critical * 100 / MISC.battery_capacity);
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

        var $looptime = $("#looptime");

        var $gyroLpf = $("#gyro-lpf"),
            $gyroLpfMessage = $('#gyrolpf-info');

        var values = FC.getGyroLpfValues();

        for (let i in values) {
            if (values.hasOwnProperty(i)) {
                //noinspection JSUnfilteredForInLoop
                $gyroLpf.append('<option value="' + i + '">' + values[i].label + '</option>');
            }
        }

        $gyroLpf.val(INAV_PID_CONFIG.gyroscopeLpf);

        $gyroLpf.change(function () {
            INAV_PID_CONFIG.gyroscopeLpf = $gyroLpf.val();

            GUI.fillSelect(
                $looptime,
                FC.getLooptimes()[FC.getGyroLpfValues()[INAV_PID_CONFIG.gyroscopeLpf].tick].looptimes,
                FC_CONFIG.loopTime,
                'Hz'
            );
            $looptime.val(FC.getLooptimes()[FC.getGyroLpfValues()[INAV_PID_CONFIG.gyroscopeLpf].tick].defaultLooptime);
            $looptime.change();

            $gyroLpfMessage.hide();
            $gyroLpfMessage.removeClass('ok-box');
            $gyroLpfMessage.removeClass('info-box');
            $gyroLpfMessage.removeClass('warning-box');

            if (MIXER_CONFIG.platformType == PLATFORM_MULTIROTOR || MIXER_CONFIG.platformType == PLATFORM_TRICOPTER) {
                switch (parseInt(INAV_PID_CONFIG.gyroscopeLpf, 10)) {
                    case 0:
                        $gyroLpfMessage.html(chrome.i18n.getMessage('gyroLpfSuggestedMessage'));
                        $gyroLpfMessage.addClass('ok-box');
                        $gyroLpfMessage.show();
                        break;
                    case 1:
                        $gyroLpfMessage.html(chrome.i18n.getMessage('gyroLpfWhyNotHigherMessage'));
                        $gyroLpfMessage.addClass('info-box');
                        $gyroLpfMessage.show();
                        break;
                    case 2:
                        $gyroLpfMessage.html(chrome.i18n.getMessage('gyroLpfWhyNotSlightlyHigherMessage'));
                        $gyroLpfMessage.addClass('info-box');
                        $gyroLpfMessage.show();
                        break
                    case 3:
                        $gyroLpfMessage.html(chrome.i18n.getMessage('gyroLpfNotAdvisedMessage'));
                        $gyroLpfMessage.addClass('info-box');
                        $gyroLpfMessage.show();
                        break;
                    case 4:
                    case 5:
                        $gyroLpfMessage.html(chrome.i18n.getMessage('gyroLpfNotFlyableMessage'));
                        $gyroLpfMessage.addClass('warning-box');
                        $gyroLpfMessage.show();
                        break;
                }

            }
        });

        $gyroLpf.change();

        $looptime.val(FC_CONFIG.loopTime);
        $looptime.change(function () {
            FC_CONFIG.loopTime = $(this).val();

            if (FC_CONFIG.loopTime < 500) {
                $('#looptime-warning').show();
            } else {
                $('#looptime-warning').hide();
            }

            if (INAV_PID_CONFIG.asynchronousMode == 0) {
                //All task running together
                ADVANCED_CONFIG.gyroSyncDenominator = Math.floor(FC_CONFIG.loopTime / FC.getGyroLpfValues()[INAV_PID_CONFIG.gyroscopeLpf].tick);
            }
        });
        $looptime.change();

        var $sensorAcc = $('#sensor-acc'),
            $sensorMag = $('#sensor-mag'),
            $sensorBaro = $('#sensor-baro'),
            $sensorPitot = $('#sensor-pitot'),
            $sensorRangefinder = $('#sensor-rangefinder'),
            $sensorOpflow = $('#sensor-opflow');

        GUI.fillSelect($sensorAcc, FC.getAccelerometerNames());
        $sensorAcc.val(SENSOR_CONFIG.accelerometer);
        $sensorAcc.change(function () {
            SENSOR_CONFIG.accelerometer = $sensorAcc.val();
        });


        GUI.fillSelect($sensorMag, FC.getMagnetometerNames());
        $sensorMag.val(SENSOR_CONFIG.magnetometer);
        $sensorMag.change(function () {
            SENSOR_CONFIG.magnetometer = $sensorMag.val();
        });

        GUI.fillSelect($sensorBaro, FC.getBarometerNames());
        $sensorBaro.val(SENSOR_CONFIG.barometer);
        $sensorBaro.change(function () {
            SENSOR_CONFIG.barometer = $sensorBaro.val();
        });

        GUI.fillSelect($sensorPitot, FC.getPitotNames());
        $sensorPitot.val(SENSOR_CONFIG.pitot);
        $sensorPitot.change(function () {
            SENSOR_CONFIG.pitot = $sensorPitot.val();
        });

        GUI.fillSelect($sensorRangefinder, FC.getRangefinderNames());
        $sensorRangefinder.val(SENSOR_CONFIG.rangefinder);
        $sensorRangefinder.change(function () {
            SENSOR_CONFIG.rangefinder = $sensorRangefinder.val();
        });

        GUI.fillSelect($sensorOpflow, FC.getOpticalFlowNames());
        $sensorOpflow.val(SENSOR_CONFIG.opflow);
        $sensorOpflow.change(function () {
            SENSOR_CONFIG.opflow = $sensorOpflow.val();
        });

        $('#3ddeadbandlow').val(REVERSIBLE_MOTORS.deadband_low);
        $('#3ddeadbandhigh').val(REVERSIBLE_MOTORS.deadband_high);
        $('#3dneutral').val(REVERSIBLE_MOTORS.neutral);
        
        // Craft name
        if (craftName != null) {
            $('.config-personalization').show();
            $('input[name="craft_name"]').val(craftName);
        } else {
            // craft name not supported by the firmware
            $('.config-personalization').hide();
        }

        $('a.save').click(function () {
            MISC.mag_declination = parseFloat($('#mag_declination').val());

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

            REVERSIBLE_MOTORS.deadband_low = parseInt($('#3ddeadbandlow').val());
            REVERSIBLE_MOTORS.deadband_high = parseInt($('#3ddeadbandhigh').val());
            REVERSIBLE_MOTORS.neutral = parseInt($('#3dneutral').val());

            SENSOR_ALIGNMENT.align_mag = parseInt(orientation_mag_e.val());

            craftName = $('input[name="craft_name"]').val();

            if (FC.isFeatureEnabled('GPS', features)) {
                googleAnalytics.sendEvent('Setting', 'GpsProtocol', gpsProtocols[MISC.gps_type]);
                googleAnalytics.sendEvent('Setting', 'GpsSbas', gpsSbas[MISC.gps_ubx_sbas]);
            }

            googleAnalytics.sendEvent('Setting', 'GPSEnabled', FC.isFeatureEnabled('GPS', features) ? "true" : "false");
            googleAnalytics.sendEvent("Platform", helper.platform.getById(MIXER_CONFIG.platformType).name, "LPF: " + FC.getGyroLpfValues()[INAV_PID_CONFIG.gyroscopeLpf].label + " | Looptime: " + FC_CONFIG.loopTime);

            googleAnalytics.sendEvent('Setting', 'Looptime', FC_CONFIG.loopTime);
            googleAnalytics.sendEvent('Setting', 'GyroLpf', FC.getGyroLpfValues()[INAV_PID_CONFIG.gyroscopeLpf].label);
            googleAnalytics.sendEvent('Setting', 'I2CSpeed', $('#i2c_speed').children("option:selected").text());

            googleAnalytics.sendEvent('Board', 'Accelerometer', FC.getAccelerometerNames()[SENSOR_CONFIG.accelerometer]);
            googleAnalytics.sendEvent('Board', 'Magnetometer', FC.getMagnetometerNames()[SENSOR_CONFIG.magnetometer]);
            googleAnalytics.sendEvent('Board', 'Barometer', FC.getBarometerNames()[SENSOR_CONFIG.barometer]);
            googleAnalytics.sendEvent('Board', 'Pitot', FC.getPitotNames()[SENSOR_CONFIG.pitot]);

            for (var i = 0; i < features.length; i++) {
                var featureName = features[i].name;
                if (FC.isFeatureEnabled(featureName, features)) {
                    googleAnalytics.sendEvent('Setting', 'Feature', featureName);
                }
            }


            helper.features.reset();
            helper.features.fromUI($('.tab-configuration'));
            helper.features.execute(function () {
                BF_CONFIG.board_align_roll = Math.round(parseFloat($('input[name="board_align_roll"]').val()) * 10);
                BF_CONFIG.board_align_pitch = Math.round(parseFloat($('input[name="board_align_pitch"]').val()) * 10);
                BF_CONFIG.board_align_yaw = Math.round(parseFloat($('input[name="board_align_yaw"]').val()) * 10);
                BF_CONFIG.currentscale = parseInt($('#currentscale').val());
                BF_CONFIG.currentoffset = Math.round(parseFloat($('#currentoffset').val()) * 10);
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
