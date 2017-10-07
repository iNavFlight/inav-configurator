/*global chrome*/
'use strict';

TABS.configuration = {};

TABS.configuration.initialize = function (callback, scrollPosition) {

    if (GUI.active_tab != 'configuration') {
        GUI.active_tab = 'configuration';
        googleAnalytics.sendAppView('Configuration');
    }

    var loadChainer = new MSPChainerClass();

    loadChainer.setChain([
        mspHelper.loadBfConfig,
        mspHelper.loadMisc,
        mspHelper.loadArmingConfig,
        mspHelper.loadLoopTime,
        mspHelper.loadRxConfig,
        mspHelper.load3dConfig,
        mspHelper.loadSensorAlignment,
        mspHelper.loadAdvancedConfig,
        mspHelper.loadINAVPidConfig,
        mspHelper.loadSensorConfig
    ]);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    var saveChainer = new MSPChainerClass();

    saveChainer.setChain([
        mspHelper.saveBfConfig,
        mspHelper.saveMisc,
        mspHelper.save3dConfig,
        mspHelper.saveSensorAlignment,
        mspHelper.saveAccTrim,
        mspHelper.saveArmingConfig,
        mspHelper.saveLooptimeConfig,
        mspHelper.saveRxConfig,
        mspHelper.saveAdvancedConfig,
        mspHelper.saveINAVPidConfig,
        mspHelper.saveSensorConfig,
        mspHelper.saveToEeprom
    ]);
    saveChainer.setExitPoint(reboot);

    function reboot() {
        //noinspection JSUnresolvedVariable
        GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));

        GUI.tab_switch_cleanup(function() {
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

        var i;

        var mixer_list_e = $('select.mixerList');
        for (i = 0; i < mixerList.length; i++) {
            mixer_list_e.append('<option value="' + (i + 1) + '">' + mixerList[i].name + '</option>');
        }

        mixer_list_e.change(function () {
            var val = parseInt($(this).val(), 10);

            BF_CONFIG.mixerConfiguration = val;

            $('.mixerPreview img').attr('src', './resources/motor_order/' + mixerList[val - 1].image + '.svg');
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

        var updateRxOptions = function(animated) {
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

        var radioGroups = [];

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

            if (features[i].mode === 'group') {

                row_e = $('<div class="radio">'
                    + '<input type="radio" class="feature" name="' + features[i].group + '" title="' + features[i].name + '"'
                    + ' value="' + features[i].bit + '"'
                    + ' id="feature-' + features[i].bit + '" '
                    + '>'
                    + '<label for="feature-' + features[i].bit + '">'
                    + '<span data-i18n="feature' + features[i].name + '"></span>'
                    + '</label>'
                    + feature_tip_html
                    + '</div>');

                radioGroups.push(features[i].group);
            } else {

                row_e = $('<div class="checkbox">'
                    + '<input type="checkbox" class="feature toggle" name="' + features[i].name + '" title="' + features[i].name + '"'
                    + ' id="feature-' + features[i].bit + '" '
                    + '>'
                    + '<label for="feature-' + features[i].bit + '">'
                    + '<span data-i18n="feature' + features[i].name + '"></span>'
                    + '</label>'
                    + feature_tip_html
                    + '</div>');

                var feature_e = row_e.find('input.feature');

                feature_e.prop('checked', bit_check(BF_CONFIG.features, features[i].bit));
                feature_e.data('bit', features[i].bit);
            }

            features_e.each(function () {
                if ($(this).hasClass(features[i].group)) {
                    $(this).after(row_e);
                }
            });
        }

        // translate to user-selected language
        localize();

        for (i = 0; i < radioGroups.length; i++) {
            var group = radioGroups[i];
            var controls_e = $('input[name="' + group + '"].feature');


            controls_e.each(function() {
                var bit = parseInt($(this).attr('value'));
                var state = bit_check(BF_CONFIG.features, bit);

                $(this).prop('checked', state);
            });
        }


        var alignments = FC.getSensorAlignments();

        var orientation_gyro_e = $('select.gyroalign');
        var orientation_acc_e = $('select.accalign');
        var orientation_mag_e = $('select.magalign');

        for (i = 0; i < alignments.length; i++) {
            orientation_gyro_e.append('<option value="' + (i+1) + '">'+ alignments[i] + '</option>');
            orientation_acc_e.append('<option value="' + (i+1) + '">'+ alignments[i] + '</option>');
            orientation_mag_e.append('<option value="' + (i+1) + '">'+ alignments[i] + '</option>');
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

        //fill motor disarm params and FC loop time
        $('input[name="autodisarmdelay"]').val(ARMING_CONFIG.auto_disarm_delay);
        $('input[name="disarmkillswitch"]').prop('checked', ARMING_CONFIG.disarm_kill_switch);
        $('div.disarm').show();
        if(bit_check(BF_CONFIG.features, 4)) {//MOTOR_STOP
            $('div.disarmdelay').show();
        } else {
            $('div.disarmdelay').hide();
        }

        // fill throttle
        $('#minthrottle').val(MISC.minthrottle);
        $('#midthrottle').val(MISC.midrc);
        $('#maxthrottle').val(MISC.maxthrottle);
        $('#mincommand').val(MISC.mincommand);

        // fill battery
        $('#mincellvoltage').val(MISC.vbatmincellvoltage);
        $('#maxcellvoltage').val(MISC.vbatmaxcellvoltage);
        $('#warningcellvoltage').val(MISC.vbatwarningcellvoltage);
        $('#voltagescale').val(MISC.vbatscale);

        // fill current
        $('#currentscale').val(BF_CONFIG.currentscale);
        $('#currentoffset').val(BF_CONFIG.currentoffset);
        $('#multiwiicurrentoutput').prop('checked', MISC.multiwiicurrentoutput);

        var escProtocols = FC.getEscProtocols();
        var servoRates = FC.getServoRates();

        function buildMotorRates() {
            var protocolData = escProtocols[ADVANCED_CONFIG.motorPwmProtocol];

            $escRate.find('option').remove();

            for (var i in protocolData.rates) {
                if (protocolData.rates.hasOwnProperty(i)) {
                    $escRate.append('<option value="' + i + '">' + protocolData.rates[i] + '</option>');
                }
            }

            /*
             *  If rate from FC is not on the list, add a new entry
             */
            if ($escRate.find('[value="' + ADVANCED_CONFIG.motorPwmRate + '"]').length == 0) {
                $escRate.append('<option value="' + ADVANCED_CONFIG.motorPwmRate + '">' + ADVANCED_CONFIG.motorPwmRate + 'Hz</option>');
            }

        }

        if (semver.gte(CONFIG.flightControllerVersion, "1.3.0")) {

            var $escProtocol = $('#esc-protocol');
            var $escRate = $('#esc-rate');
            for (i in escProtocols) {
                if (escProtocols.hasOwnProperty(i)) {
                    var protocolData = escProtocols[i];
                    $escProtocol.append('<option value="' + i + '">' + protocolData.name + '</option>');
                }
            }

            buildMotorRates();
            $escProtocol.val(ADVANCED_CONFIG.motorPwmProtocol);
            $escRate.val(ADVANCED_CONFIG.motorPwmRate);

            $escProtocol.change(function () {
                ADVANCED_CONFIG.motorPwmProtocol = $(this).val();
                buildMotorRates();
                ADVANCED_CONFIG.motorPwmRate = escProtocols[ADVANCED_CONFIG.motorPwmProtocol].defaultRate;
                $escRate.val(ADVANCED_CONFIG.motorPwmRate);
            });

            $escRate.change(function () {
                ADVANCED_CONFIG.motorPwmRate = $(this).val();
            });

            $("#esc-protocols").show();

            var $servoRate = $('#servo-rate');

            for (i in servoRates) {
                if (servoRates.hasOwnProperty(i)) {
                    $servoRate.append('<option value="' + i + '">' + servoRates[i] + '</option>');
                }
            }
            /*
             *  If rate from FC is not on the list, add a new entry
             */
            if ($servoRate.find('[value="' + ADVANCED_CONFIG.servoPwmRate + '"]').length == 0) {
                $servoRate.append('<option value="' + ADVANCED_CONFIG.servoPwmRate + '">' + ADVANCED_CONFIG.servoPwmRate + 'Hz</option>');
            }

            $servoRate.val(ADVANCED_CONFIG.servoPwmRate);
            $servoRate.change(function () {
                ADVANCED_CONFIG.servoPwmRate = $(this).val();
            });

            $('#servo-rate-container').show();
        }

        var $looptime = $("#looptime");

        if (semver.gte(CONFIG.flightControllerVersion, "1.4.0")) {
            $(".requires-v1_4").show();

            var $gyroLpf = $("#gyro-lpf"),
                $gyroSync = $("#gyro-sync-checkbox"),
                $asyncMode = $('#async-mode'),
                $gyroFrequency = $('#gyro-frequency'),
                $accelerometerFrequency = $('#accelerometer-frequency'),
                $attitudeFrequency = $('#attitude-frequency');

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
            });

            $gyroLpf.change();

            $looptime.val(FC_CONFIG.loopTime);
            $looptime.change(function () {
                FC_CONFIG.loopTime = $(this).val();

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

        } else {
            GUI.fillSelect($looptime, FC.getLooptimes()[125].looptimes, FC_CONFIG.loopTime, 'Hz');

            $looptime.val(FC_CONFIG.loopTime);
            $looptime.change(function () {
                FC_CONFIG.loopTime = $(this).val();
            });

            $(".requires-v1_4").hide();
        }

        if (semver.gte(CONFIG.flightControllerVersion, "1.5.0")) {

            var $sensorAcc = $('#sensor-acc'),
                $sensorMag = $('#sensor-mag'),
                $sensorBaro = $('#sensor-baro'),
                $sensorPitot = $('#sensor-pitot'),
                $sensorRangefinder = $('#sensor-rangefinder');

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

            $(".requires-v1_5").show();
        } else {
            $(".requires-v1_5").hide();
        }

        if (semver.gte(CONFIG.flightControllerVersion, "1.7.0")) {
            $(".requires-v1_7").show();
        } else {
            $(".requires-v1_7").hide();
        }

        $('#3ddeadbandlow').val(_3D.deadband3d_low);
        $('#3ddeadbandhigh').val(_3D.deadband3d_high);
        $('#3dneutral').val(_3D.neutral3d);
        if (semver.lt(CONFIG.apiVersion, "1.17.0")) {
            $('#3ddeadbandthrottle').val(_3D.deadband3d_throttle);
        } else {
            $('#deadband-3d-throttle-container').remove();
        }

        $('input[type="checkbox"].feature').change(function () {

            var element = $(this),
                index = element.data('bit'),
                state = element.is(':checked');

            if (state) {
                BF_CONFIG.features = bit_set(BF_CONFIG.features, index);
                if(element.attr('name') === 'MOTOR_STOP')
                    $('div.disarmdelay').show();
            } else {
                BF_CONFIG.features = bit_clear(BF_CONFIG.features, index);
                if(element.attr('name') === 'MOTOR_STOP')
                    $('div.disarmdelay').hide();
            }
        });

        // UI hooks
        $('input[type="radio"].feature').change(function () {
            var element = $(this),
                group = element.attr('name');

            var controls_e = $('input[name="' + group + '"]');
            var selected_bit = controls_e.filter(':checked').val();

            controls_e.each(function() {
                var bit = $(this).attr('value');

                var selected = (selected_bit == bit);
                if (selected) {
                    BF_CONFIG.features = bit_set(BF_CONFIG.features, bit);
                } else {
                    BF_CONFIG.features = bit_clear(BF_CONFIG.features, bit);
                }

            });
        });


        $('a.save').click(function () {
            // gather data that doesn't have automatic change event bound
            BF_CONFIG.board_align_roll = Math.round(parseFloat($('input[name="board_align_roll"]').val()) * 10);
            BF_CONFIG.board_align_pitch = Math.round(parseFloat($('input[name="board_align_pitch"]').val()) * 10);
            BF_CONFIG.board_align_yaw = Math.round(parseFloat($('input[name="board_align_yaw"]').val()) * 10);

            MISC.mag_declination = parseFloat($('#mag_declination').val());

            ARMING_CONFIG.auto_disarm_delay = parseInt($('input[name="autodisarmdelay"]').val());
            ARMING_CONFIG.disarm_kill_switch = ~~$('input[name="disarmkillswitch"]').is(':checked'); // ~~ boolean to decimal conversion

            MISC.minthrottle = parseInt($('#minthrottle').val());
            MISC.midrc = parseInt($('#midthrottle').val());
            MISC.maxthrottle = parseInt($('#maxthrottle').val());
            MISC.mincommand = parseInt($('#mincommand').val());

            MISC.vbatmincellvoltage = parseFloat($('#mincellvoltage').val());
            MISC.vbatmaxcellvoltage = parseFloat($('#maxcellvoltage').val());
            MISC.vbatwarningcellvoltage = parseFloat($('#warningcellvoltage').val());
            MISC.vbatscale = parseInt($('#voltagescale').val());

            BF_CONFIG.currentscale = parseInt($('#currentscale').val());
            BF_CONFIG.currentoffset = parseInt($('#currentoffset').val());
            MISC.multiwiicurrentoutput = ~~$('#multiwiicurrentoutput').is(':checked'); // ~~ boolean to decimal conversion

            _3D.deadband3d_low = parseInt($('#3ddeadbandlow').val());
            _3D.deadband3d_high = parseInt($('#3ddeadbandhigh').val());
            _3D.neutral3d = parseInt($('#3dneutral').val());
            if (semver.lt(CONFIG.apiVersion, "1.17.0")) {
                _3D.deadband3d_throttle = ($('#3ddeadbandthrottle').val());
            }


            SENSOR_ALIGNMENT.align_gyro = parseInt(orientation_gyro_e.val());
            SENSOR_ALIGNMENT.align_acc = parseInt(orientation_acc_e.val());
            SENSOR_ALIGNMENT.align_mag = parseInt(orientation_mag_e.val());

            var rxTypes = FC.getRxTypes();

            function is_using_rx_type(name) {
                for (var ii = 0; ii < rxTypes.length; ii++) {
                    if (rxTypes[ii].name == name) {
                        return FC.isRxTypeEnabled(rxTypes[ii]);
                    }
                }
                return false;
            }

            // track feature usage
            if (is_using_rx_type('RX_SERIAL')) {
                googleAnalytics.sendEvent('Setting', 'SerialRxProvider', serialRxTypes[RX_CONFIG.serialrx_provider]);
            }

            // track feature usage
            if (is_using_rx_type('RX_SPI')) {
                googleAnalytics.sendEvent('Setting', 'nrf24Protocol', FC.getSPIProtocolTypes()[RX_CONFIG.spirx_protocol]);
            }

            if (FC.isFeatureEnabled('GPS', features)) {
                googleAnalytics.sendEvent('Setting', 'GpsProtocol', gpsProtocols[MISC.gps_type]);
                googleAnalytics.sendEvent('Setting', 'GpsSbas', gpsSbas[MISC.gps_ubx_sbas]);
            }

            googleAnalytics.sendEvent('Setting', 'Mixer', mixerList[BF_CONFIG.mixerConfiguration - 1].name);
            googleAnalytics.sendEvent('Setting', 'ReceiverMode', $("input[name='rxMode']:checked").closest('.radio').find('label').text());
            googleAnalytics.sendEvent('Setting', 'Looptime', FC_CONFIG.loopTime);

            /*
             * send gyro LPF and async_mode tracking
             */
            if(semver.gte(CONFIG.flightControllerVersion, "1.5.0")) {
                googleAnalytics.sendEvent('Setting', 'GyroLpf', FC.getGyroLpfValues()[INAV_PID_CONFIG.gyroscopeLpf].label);
                googleAnalytics.sendEvent('Setting', 'AsyncMode', FC.getAsyncModes()[INAV_PID_CONFIG.asynchronousMode]);

                googleAnalytics.sendEvent('Board', 'Accelerometer', FC.getAccelerometerNames()[SENSOR_CONFIG.accelerometer]);
                googleAnalytics.sendEvent('Board', 'Magnetometer', FC.getMagnetometerNames()[SENSOR_CONFIG.magnetometer]);
                googleAnalytics.sendEvent('Board', 'Barometer', FC.getBarometerNames()[SENSOR_CONFIG.barometer]);
                googleAnalytics.sendEvent('Board', 'Pitot', FC.getPitotNames()[SENSOR_CONFIG.pitot]);
            }

            for (var i = 0; i < features.length; i++) {
                var featureName = features[i].name;
                if (FC.isFeatureEnabled(featureName, features)) {
                    googleAnalytics.sendEvent('Setting', 'Feature', featureName);
                }
            }

            saveChainer.execute();
        });

        helper.interval.add('config_load_analog', function () {
            $('#batteryvoltage').val([ANALOG.voltage.toFixed(1)]);
            $('#batterycurrent').val([ANALOG.amperage.toFixed(2)]);
        }, 100, true); // 10 fps
        GUI.content_ready(callback);
    }
};

TABS.configuration.cleanup = function (callback) {
    if (callback) callback();
};
