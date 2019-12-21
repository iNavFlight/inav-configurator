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
        mspHelper.loadRxConfig,
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
        mspHelper.saveRxConfig,
        mspHelper.saveAdvancedConfig,
        mspHelper.saveINAVPidConfig,
        mspHelper.saveSensorConfig,
        mspHelper.saveVTXConfig,
        saveCraftName,
        mspHelper.saveMiscV2,
        mspHelper.saveToEeprom
    ];

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
        $('#content').load("./tabs/configuration.html", process_html);
    }

    function process_html() {

        let i,
            mixer_list_e = $('select.mixerList'),
            legacyMixers = helper.mixer.getLegacyList();

        for (i in legacyMixers) {
            if (legacyMixers.hasOwnProperty(i)) {
                mixer_list_e.append('<option value="' + legacyMixers[i].id + '">' + legacyMixers[i].name + '</option>');
            }
        }

        mixer_list_e.change(function () {
            BF_CONFIG.mixerConfiguration = parseInt($(this).val(), 10);

            $('.mixerPreview img').attr('src', './resources/motor_order/' +
                helper.mixer.getById(BF_CONFIG.mixerConfiguration).image + '.svg');
        });

        // select current mixer configuration
        mixer_list_e.val(BF_CONFIG.mixerConfiguration).change();

        // receiver configuration
        var rxTypesSelect = $('#rxType');
        var rxTypes = FC.getRxTypes();
        for (var ii = 0; ii < rxTypes.length; ii++) {
            var rxType = rxTypes[ii];
            var option = $('<option value="' + rxType.name + '" >' + chrome.i18n.getMessage(rxType.name) + '</option>');
            option.data('rx-type', rxType);
            if (FC.isRxTypeEnabled(rxType)) {
                option.prop('selected', true);
            }
            option.appendTo(rxTypesSelect);
        }
        var rxTypeOptions = $('[data-rx-type]');

        var updateRxOptions = function (animated) {
            var duration = animated ? 400 : 0;
            rxTypeOptions.each(function (ii, obj) {
                var $obj = $(obj);
                var rxType = $obj.data('rx-type');
                if (rxType && rxType != rxTypesSelect.val()) {
                    $obj.slideUp(duration);
                } else {
                    $obj.slideDown(duration);
                }
            });
        };
        updateRxOptions(false);

        rxTypesSelect.change(function () {
            updateRxOptions(true);
            var rxType = rxTypesSelect.find(':selected').data('rx-type');
            FC.setRxTypeEnabled(rxType);
        });

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

        helper.features.updateUI($('.tab-configuration'), BF_CONFIG.features);

        // translate to user-selected language
        localize();

        var alignments = FC.getSensorAlignments();

        var orientation_gyro_e = $('select.gyroalign');
        var orientation_acc_e = $('select.accalign');
        var orientation_mag_e = $('select.magalign');

        for (i = 0; i < alignments.length; i++) {
            orientation_gyro_e.append('<option value="' + (i + 1) + '">' + alignments[i] + '</option>');
            orientation_acc_e.append('<option value="' + (i + 1) + '">' + alignments[i] + '</option>');
            orientation_mag_e.append('<option value="' + (i + 1) + '">' + alignments[i] + '</option>');
        }
        orientation_gyro_e.val(SENSOR_ALIGNMENT.align_gyro);
        orientation_acc_e.val(SENSOR_ALIGNMENT.align_acc);
        orientation_mag_e.val(SENSOR_ALIGNMENT.align_mag);

        // generate GPS
        var gpsProtocols = FC.getGpsProtocols();
        var gpsSbas = FC.getGpsSbasProviders();

        var gps_protocol_e = $('#gps_protocol');
        for (i = 0; i < gpsProtocols.length; i++) {
            gps_protocol_e.append('<option value="' + i + '">' + gpsProtocols[i] + '</option>');
        }

        gps_protocol_e.change(function () {
            MISC.gps_type = parseInt($(this).val());
        });

        gps_protocol_e.val(MISC.gps_type);

        var gps_ubx_sbas_e = $('#gps_ubx_sbas');
        for (i = 0; i < gpsSbas.length; i++) {
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

        // generate serial RX
        var serialRxTypes = FC.getSerialRxTypes();

        var serialRX_e = $('#serial-rx-protocol');
        for (i = 0; i < serialRxTypes.length; i++) {
            serialRX_e.append('<option value="' + i + '">' + serialRxTypes[i] + '</option>');
        }

        serialRX_e.change(function () {
            RX_CONFIG.serialrx_provider = parseInt($(this).val());
        });

        // select current serial RX type
        serialRX_e.val(RX_CONFIG.serialrx_provider);

        // for some odd reason chrome 38+ changes scroll according to the touched select element
        // i am guessing this is a bug, since this wasn't happening on 37
        // code below is a temporary fix, which we will be able to remove in the future (hopefully)
        //noinspection JSValidateTypes
        $('#content').scrollTop((scrollPosition) ? scrollPosition : 0);

        var spiProtocol_e = $('#spi-protocol');
        GUI.fillSelect(spiProtocol_e, FC.getSPIProtocolTypes());

        spiProtocol_e.change(function () {
            RX_CONFIG.spirx_protocol = parseInt($(this).val());
            RX_CONFIG.spirx_id = 0;
        });

        // select current spi protocol
        spiProtocol_e.val(RX_CONFIG.spirx_protocol);

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

        var $looptime = $("#looptime");

        var $gyroLpf = $("#gyro-lpf"),
            $gyroSync = $("#gyro-sync-checkbox"),
            $asyncMode = $('#async-mode'),
            $gyroFrequency = $('#gyro-frequency'),
            $accelerometerFrequency = $('#accelerometer-frequency'),
            $attitudeFrequency = $('#attitude-frequency'),
            $gyroLpfMessage = $('#gyrolpf-info');

        var values = FC.getGyroLpfValues();

        for (i in values) {
            if (values.hasOwnProperty(i)) {
                //noinspection JSUnfilteredForInLoop
                $gyroLpf.append('<option value="' + i + '">' + values[i].label + '</option>');
            }
        }

        $gyroLpf.val(INAV_PID_CONFIG.gyroscopeLpf);
        $gyroSync.prop("checked", ADVANCED_CONFIG.gyroSync);

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

            GUI.fillSelect($gyroFrequency, FC.getGyroFrequencies()[FC.getGyroLpfValues()[INAV_PID_CONFIG.gyroscopeLpf].tick].looptimes);
            $gyroFrequency.val(FC.getLooptimes()[FC.getGyroLpfValues()[INAV_PID_CONFIG.gyroscopeLpf].tick].defaultLooptime);
            $gyroFrequency.change();

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

        $gyroFrequency.val(ADVANCED_CONFIG.gyroSyncDenominator * FC.getGyroLpfValues()[INAV_PID_CONFIG.gyroscopeLpf].tick);
        $gyroFrequency.change(function () {
            ADVANCED_CONFIG.gyroSyncDenominator = Math.floor($gyroFrequency.val() / FC.getGyroLpfValues()[INAV_PID_CONFIG.gyroscopeLpf].tick);
        });

        $gyroSync.change(function () {
            if ($(this).is(":checked")) {
                ADVANCED_CONFIG.gyroSync = 1;
            } else {
                ADVANCED_CONFIG.gyroSync = 0;
            }
        });

        $gyroSync.change();

        /*
         * Async mode select
         */
        GUI.fillSelect($asyncMode, FC.getAsyncModes());
        $asyncMode.val(INAV_PID_CONFIG.asynchronousMode);
        $asyncMode.change(function () {
            INAV_PID_CONFIG.asynchronousMode = $asyncMode.val();

            if (INAV_PID_CONFIG.asynchronousMode == 0) {
                $('#gyro-sync-wrapper').show();
                $('#gyro-frequency-wrapper').hide();
                $('#accelerometer-frequency-wrapper').hide();
                $('#attitude-frequency-wrapper').hide();
            } else if (INAV_PID_CONFIG.asynchronousMode == 1) {
                $('#gyro-sync-wrapper').hide();
                $('#gyro-frequency-wrapper').show();
                $('#accelerometer-frequency-wrapper').hide();
                $('#attitude-frequency-wrapper').hide();
                ADVANCED_CONFIG.gyroSync = 1;
            } else {
                $('#gyro-sync-wrapper').hide();
                $('#gyro-frequency-wrapper').show();
                $('#accelerometer-frequency-wrapper').show();
                $('#attitude-frequency-wrapper').show();
                ADVANCED_CONFIG.gyroSync = 1;
            }
        });
        $asyncMode.change();

        GUI.fillSelect($accelerometerFrequency, FC.getAccelerometerTaskFrequencies(), INAV_PID_CONFIG.accelerometerTaskFrequency, 'Hz');
        $accelerometerFrequency.val(INAV_PID_CONFIG.accelerometerTaskFrequency);
        $accelerometerFrequency.change(function () {
            INAV_PID_CONFIG.accelerometerTaskFrequency = $accelerometerFrequency.val();
        });

        GUI.fillSelect($attitudeFrequency, FC.getAttitudeTaskFrequencies(), INAV_PID_CONFIG.attitudeTaskFrequency, 'Hz');
        $attitudeFrequency.val(INAV_PID_CONFIG.attitudeTaskFrequency);
        $attitudeFrequency.change(function () {
            INAV_PID_CONFIG.attitudeTaskFrequency = $attitudeFrequency.val();
        });


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

        $('#3ddeadbandlow').val(_3D.deadband3d_low);
        $('#3ddeadbandhigh').val(_3D.deadband3d_high);
        $('#3dneutral').val(_3D.neutral3d);
        if (semver.lt(CONFIG.apiVersion, "1.17.0")) {
            $('#3ddeadbandthrottle').val(_3D.deadband3d_throttle);
        } else {
            $('#deadband-3d-throttle-container').remove();
        }

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

            _3D.deadband3d_low = parseInt($('#3ddeadbandlow').val());
            _3D.deadband3d_high = parseInt($('#3ddeadbandhigh').val());
            _3D.neutral3d = parseInt($('#3dneutral').val());
            if (semver.lt(CONFIG.apiVersion, "1.17.0")) {
                _3D.deadband3d_throttle = ($('#3ddeadbandthrottle').val());
            }


            SENSOR_ALIGNMENT.align_gyro = parseInt(orientation_gyro_e.val());
            SENSOR_ALIGNMENT.align_acc = parseInt(orientation_acc_e.val());
            SENSOR_ALIGNMENT.align_mag = parseInt(orientation_mag_e.val());

            craftName = $('input[name="craft_name"]').val();

            // track feature usage
            if ($('#rxType').val() == 'RX_SERIAL') {
                googleAnalytics.sendEvent('Setting', 'SerialRxProvider', $('#serial-rx-protocol').find(':selected').text());
            }

            // track feature usage
            if ($('#rxType').val() == 'RX_SPI') {
                googleAnalytics.sendEvent('Setting', 'nrf24Protocol', FC.getSPIProtocolTypes()[RX_CONFIG.spirx_protocol]);
            }

            if (FC.isFeatureEnabled('GPS', features)) {
                googleAnalytics.sendEvent('Setting', 'GpsProtocol', gpsProtocols[MISC.gps_type]);
                googleAnalytics.sendEvent('Setting', 'GpsSbas', gpsSbas[MISC.gps_ubx_sbas]);
            }
            
            googleAnalytics.sendEvent('Setting', 'ReceiverMode', $('#rxType').val());
            googleAnalytics.sendEvent('Setting', 'Looptime', FC_CONFIG.loopTime);

            /*
             * send gyro LPF and async_mode tracking
             */
            googleAnalytics.sendEvent('Setting', 'GyroLpf', FC.getGyroLpfValues()[INAV_PID_CONFIG.gyroscopeLpf].label);
            googleAnalytics.sendEvent('Setting', 'AsyncMode', FC.getAsyncModes()[INAV_PID_CONFIG.asynchronousMode]);

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