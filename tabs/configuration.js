'use strict';

TABS.configuration = {};

TABS.configuration.initialize = function (callback, scrollPosition) {

    if (GUI.active_tab != 'configuration') {
        GUI.active_tab = 'configuration';
        googleAnalytics.sendAppView('Configuration');
    }

    function load_config() {
        MSP.send_message(MSPCodes.MSP_BF_CONFIG, false, false, load_misc);
    }

    function load_misc() {
        MSP.send_message(MSPCodes.MSP_MISC, false, false, load_arming_config);
    }

    function load_arming_config() {
        MSP.send_message(MSPCodes.MSP_ARMING_CONFIG, false, false, load_loop_time);
    }

    function load_loop_time() {
        MSP.send_message(MSPCodes.MSP_LOOP_TIME, false, false, load_rx_config);
    }

<<<<<<< HEAD
    function load_arming_config() {
        var next_callback = load_loop_time;
        if (semver.gte(CONFIG.apiVersion, "1.8.0")) {
            MSP.send_message(MSP_codes.MSP_ARMING_CONFIG, false, false, next_callback);
=======
    function load_rx_config() {
        var next_callback = load_3d;
        if (semver.gte(CONFIG.apiVersion, "1.21.0")) {
            MSP.send_message(MSPCodes.MSP_RX_CONFIG, false, false, next_callback);
>>>>>>> master
        } else {
            next_callback();
        }
    }

<<<<<<< HEAD
    function load_loop_time() {
        var next_callback = load_3d;
        if (semver.gte(CONFIG.apiVersion, "1.8.0")) {
            MSP.send_message(MSP_codes.MSP_LOOP_TIME, false, false, next_callback);
=======
    function load_3d() {
        MSP.send_message(MSPCodes.MSP_3D, false, false, load_sensor_alignment);
    }

    function load_sensor_alignment() {
        MSP.send_message(MSPCodes.MSP_SENSOR_ALIGNMENT, false, false, loadAdvancedConfig);
    }

    function loadAdvancedConfig() {
        var next_callback = loadINAVPidConfig;
        if (semver.gte(CONFIG.flightControllerVersion, "1.3.0")) {
            MSP.send_message(MSPCodes.MSP_ADVANCED_CONFIG, false, false, next_callback);
>>>>>>> master
        } else {
            next_callback();
        }
    }

    function loadINAVPidConfig() {
        var next_callback = loadSensorConfig;
        if (semver.gt(CONFIG.flightControllerVersion, "1.3.0")) {
            MSP.send_message(MSPCodes.MSP_INAV_PID, false, false, next_callback);
        } else {
            next_callback();
        }
    }

<<<<<<< HEAD
    function load_sensor_alignment() {
=======
    function loadSensorConfig() {
>>>>>>> master
        var next_callback = load_html;
        if (semver.gte(CONFIG.flightControllerVersion, "1.5.0")) {
            MSP.send_message(MSPCodes.MSP_SENSOR_CONFIG, false, false, next_callback);
        } else {
            next_callback();
        }
    }

    //Update Analog/Battery Data
    function load_analog() {
        MSP.send_message(MSPCodes.MSP_ANALOG, false, false, function () {
	        $('#batteryvoltage').val([ANALOG.voltage.toFixed(1)]);
	        $('#batterycurrent').val([ANALOG.amperage.toFixed(2)]);
        });
    }

    function load_html() {
        $('#content').load("./tabs/configuration.html", process_html);
    }

    MSP.send_message(MSPCodes.MSP_IDENT, false, false, load_config);

<<<<<<< HEAD
    function recalculate_cycles_sec() {
        var looptime = $('input[name="looptime"]').val();

        var message = 'Max';
        if (looptime > 0) {
            message = parseFloat((1 / looptime) * 1000 * 1000).toFixed(0);
        }

        $('input[name="looptimehz"]').val(message);
    }

    function process_html() {

=======
    function process_html() {

        var i;

>>>>>>> master
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

        // generate features
<<<<<<< HEAD
        var features = [
            {bit: 0, group: 'rxMode', mode: 'group', name: 'RX_PPM'},
            {bit: 1, group: 'batteryVoltage', name: 'VBAT'},
            {bit: 2, group: 'other', name: 'INFLIGHT_ACC_CAL'},
            {bit: 3, group: 'rxMode', mode: 'group', name: 'RX_SERIAL'},
            {bit: 4, group: 'esc', name: 'MOTOR_STOP'},
            {bit: 5, group: 'other', name: 'SERVO_TILT'},
            {bit: 6, group: 'other', name: 'SOFTSERIAL', haveTip: true},
            {bit: 7, group: 'gps', name: 'GPS', haveTip: true},
            {bit: 8, group: 'rxFailsafe', name: 'FAILSAFE'},
            {bit: 9, group: 'other', name: 'SONAR'},
            {bit: 10, group: 'other', name: 'TELEMETRY'},
            {bit: 11, group: 'batteryCurrent', name: 'CURRENT_METER'},
            {bit: 12, group: 'other', name: '3D'},
            {bit: 13, group: 'rxMode', mode: 'group', name: 'RX_PARALLEL_PWM'},
            {bit: 14, group: 'rxMode', mode: 'group', name: 'RX_MSP'},
            {bit: 15, group: 'rssi', name: 'RSSI_ADC'},
            {bit: 16, group: 'other', name: 'LED_STRIP'},
            {bit: 17, group: 'other', name: 'DISPLAY'},
            {bit: 18, group: 'esc', name: 'ONESHOT125', haveTip: true},
            {bit: 19, group: 'other', name: 'BLACKBOX', haveTip: true}
        ];

        if (semver.gte(CONFIG.apiVersion, "1.12.0")) {
            features.push(
                {bit: 20, group: 'other', name: 'CHANNEL_FORWARDING'}
            );
        }
=======
        var features = FC.getFeatures();
>>>>>>> master

        var radioGroups = [];

        var features_e = $('.features');
        for (i = 0; i < features.length; i++) {
            var row_e,
                tips = [],
                feature_tip_html = '';

            if (features[i].showNameInTip) {
                tips.push(chrome.i18n.getMessage("manualEnablingTemplate").replace("{name}", features[i].name));
            }

<<<<<<< HEAD
        var radioGroups = [];

        var features_e = $('.features');
        for (var i = 0; i < features.length; i++) {
            var row_e;

            var feature_tip_html = '';
=======
>>>>>>> master
            if (features[i].haveTip) {
                tips.push(chrome.i18n.getMessage("feature" + features[i].name + "Tip"));
            }

<<<<<<< HEAD
            if (features[i].mode === 'group') {
                row_e = $('<tr><td style="width: 15px;"><input style="width: 13px;" class="feature" id="feature-'
                        + i
                        + '" value="'
                        + features[i].bit
                        + '" title="'
                        + features[i].name
                        + '" type="radio" name="'
                        + features[i].group
                        + '" /></td><td><label for="feature-'
                        + i
                        + '">'
                        + features[i].name
                        + '</label></td><td><span i18n="feature' + features[i].name + '"></span>'
                        + feature_tip_html + '</td></tr>');
                radioGroups.push(features[i].group);
            } else {
                row_e = $('<tr><td><input class="feature toggle"'
                        + i
                        + '" name="'
                        + features[i].name
                        + '" title="'
                        + features[i].name
                        + '" type="checkbox"/></td><td><label for="feature-'
                        + i
                        + '">'
                        + features[i].name
                        + '</label></td><td><span i18n="feature' + features[i].name + '"></span>'
                        + feature_tip_html + '</td></tr>');
=======
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
>>>>>>> master

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


<<<<<<< HEAD
        var alignments = [
            'CW 0°',
            'CW 90°',
            'CW 180°',
            'CW 270°',
            'CW 0° flip',
            'CW 90° flip',
            'CW 180° flip',
            'CW 270° flip'
        ];
=======
        var alignments = FC.getSensorAlignments();
>>>>>>> master

        var orientation_gyro_e = $('select.gyroalign');
        var orientation_acc_e = $('select.accalign');
        var orientation_mag_e = $('select.magalign');

        for (i = 0; i < alignments.length; i++) {
            orientation_gyro_e.append('<option value="' + (i+1) + '">'+ alignments[i] + '</option>');
            orientation_acc_e.append('<option value="' + (i+1) + '">'+ alignments[i] + '</option>');
            orientation_mag_e.append('<option value="' + (i+1) + '">'+ alignments[i] + '</option>');
        }
<<<<<<< HEAD

=======
        orientation_gyro_e.val(SENSOR_ALIGNMENT.align_gyro);
        orientation_acc_e.val(SENSOR_ALIGNMENT.align_acc);
        orientation_mag_e.val(SENSOR_ALIGNMENT.align_mag);
>>>>>>> master

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

<<<<<<< HEAD

        var gps_baudrate_e = $('select.gps_baudrate');
        for (var i = 0; i < gpsBaudRates.length; i++) {
            gps_baudrate_e.append('<option value="' + gpsBaudRates[i] + '">' + gpsBaudRates[i] + '</option>');
        }

        if (semver.lt(CONFIG.apiVersion, "1.6.0")) {
            gps_baudrate_e.change(function () {
                SERIAL_CONFIG.gpsBaudRate = parseInt($(this).val());
            });
            gps_baudrate_e.val(SERIAL_CONFIG.gpsBaudRate);
        } else {
            gps_baudrate_e.prop("disabled", true);
            gps_baudrate_e.parent().hide();
        }

        var gps_ubx_sbas_e = $('select.gps_ubx_sbas');
        for (var i = 0; i < gpsSbas.length; i++) {
=======
        var gps_ubx_sbas_e = $('#gps_ubx_sbas');
        for (i = 0; i < gpsSbas.length; i++) {
>>>>>>> master
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

        var nrf24Protocol_e = $('#nrf24-protocol');
        GUI.fillSelect(nrf24Protocol_e, FC.getNrf24ProtocolTypes());

        nrf24Protocol_e.change(function () {
            RX_CONFIG.nrf24rx_protocol = parseInt($(this).val());
            RX_CONFIG.nrf24rx_id = 0;
        });

        // select current nrf24 protocol
        nrf24Protocol_e.val(RX_CONFIG.nrf24rx_protocol);

        // fill board alignment
        $('input[name="board_align_roll"]').val((BF_CONFIG.board_align_roll / 10.0).toFixed(1));
        $('input[name="board_align_pitch"]').val((BF_CONFIG.board_align_pitch / 10.0).toFixed(1));
        $('input[name="board_align_yaw"]').val((BF_CONFIG.board_align_yaw / 10.0).toFixed(1));

        // fill magnetometer
<<<<<<< HEAD
        $('input[name="mag_declination"]').val(MISC.mag_declination);

        //fill motor disarm params and FC loop time
        if(semver.gte(CONFIG.apiVersion, "1.8.0")) {
            $('input[name="autodisarmdelay"]').val(ARMING_CONFIG.auto_disarm_delay);
            $('input[name="disarmkillswitch"]').prop('checked', ARMING_CONFIG.disarm_kill_switch);
            $('div.disarm').show();
            if(bit_check(BF_CONFIG.features, 4))//MOTOR_STOP
                $('div.disarmdelay').show();
            else
                $('div.disarmdelay').hide();

            // fill FC loop time
            $('input[name="looptime"]').val(FC_CONFIG.loopTime);

            recalculate_cycles_sec();

            $('div.cycles').show();
        }

        // fill throttle
        $('input[name="minthrottle"]').val(MISC.minthrottle);
        $('input[name="midthrottle"]').val(MISC.midrc);
        $('input[name="maxthrottle"]').val(MISC.maxthrottle);
        $('input[name="mincommand"]').val(MISC.mincommand);
=======
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
>>>>>>> master

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
                $sensorPitot = $('#sensor-pitot');

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

            $(".requires-v1_5").show();
        } else {
            $(".requires-v1_5").hide();
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

<<<<<<< HEAD
            MISC.mag_declination = parseFloat($('input[name="mag_declination"]').val());

            // motor disarm
            if(semver.gte(CONFIG.apiVersion, "1.8.0")) {
                ARMING_CONFIG.auto_disarm_delay = parseInt($('input[name="autodisarmdelay"]').val());
                ARMING_CONFIG.disarm_kill_switch = ~~$('input[name="disarmkillswitch"]').is(':checked'); // ~~ boolean to decimal conversion
                FC_CONFIG.loopTime = parseInt($('input[name="looptime"]').val());
            }

            MISC.minthrottle = parseInt($('input[name="minthrottle"]').val());
            MISC.midrc = parseInt($('input[name="midthrottle"]').val());
            MISC.maxthrottle = parseInt($('input[name="maxthrottle"]').val());
            MISC.mincommand = parseInt($('input[name="mincommand"]').val());

            MISC.vbatmincellvoltage = parseFloat($('input[name="mincellvoltage"]').val());
            MISC.vbatmaxcellvoltage = parseFloat($('input[name="maxcellvoltage"]').val());
            MISC.vbatwarningcellvoltage = parseFloat($('input[name="warningcellvoltage"]').val());
            MISC.vbatscale = parseInt($('input[name="voltagescale"]').val());

            BF_CONFIG.currentscale = parseInt($('input[name="currentscale"]').val());
            BF_CONFIG.currentoffset = parseInt($('input[name="currentoffset"]').val());
            MISC.multiwiicurrentoutput = ~~$('input[name="multiwiicurrentoutput"]').is(':checked'); // ~~ boolean to decimal conversion

            _3D.deadband3d_low = parseInt($('input[name="3ddeadbandlow"]').val());
            _3D.deadband3d_high = parseInt($('input[name="3ddeadbandhigh"]').val());
            _3D.neutral3d = parseInt($('input[name="3dneutral"]').val());
=======
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
>>>>>>> master
            if (semver.lt(CONFIG.apiVersion, "1.17.0")) {
                _3D.deadband3d_throttle = ($('#3ddeadbandthrottle').val());
            }


            SENSOR_ALIGNMENT.align_gyro = parseInt(orientation_gyro_e.val());
            SENSOR_ALIGNMENT.align_acc = parseInt(orientation_acc_e.val());
            SENSOR_ALIGNMENT.align_mag = parseInt(orientation_mag_e.val());

            // track feature usage
            if (FC.isFeatureEnabled('RX_SERIAL', features)) {
                googleAnalytics.sendEvent('Setting', 'SerialRxProvider', serialRxTypes[RX_CONFIG.serialrx_provider]);
            }

<<<<<<< HEAD
            for (var i = 0; i < features.length; i++) {
                var featureName = features[i].name;
                if (isFeatureEnabled(featureName)) {
                    googleAnalytics.sendEvent('Setting', 'Feature', featureName);
                }
=======
            // track feature usage
            if (FC.isFeatureEnabled('RX_NRF24', features)) {
                googleAnalytics.sendEvent('Setting', 'nrf24Protocol', FC.getNrf24ProtocolTypes()[RX_CONFIG.nrf24rx_protocol]);
>>>>>>> master
            }

            if (FC.isFeatureEnabled('GPS', features)) {
                googleAnalytics.sendEvent('Setting', 'GpsProtocol', gpsProtocols[MISC.gps_type]);
                googleAnalytics.sendEvent('Setting', 'GpsSbas', gpsSbas[MISC.gps_ubx_sbas]);
            }

            googleAnalytics.sendEvent('Setting', 'Mixer', mixerList[BF_CONFIG.mixerConfiguration - 1].name);
            googleAnalytics.sendEvent('Setting', 'ReceiverMode', $("input[name='rxMode']:checked").closest('tr').find('label').text());
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

            function save_misc() {
                MSP.send_message(MSPCodes.MSP_SET_MISC, mspHelper.crunch(MSPCodes.MSP_SET_MISC), false, save_3d);
            }

            function save_3d() {
<<<<<<< HEAD
                var next_callback = save_sensor_alignment;
                if(semver.gte(CONFIG.apiVersion, "1.14.0")) {
                   MSP.send_message(MSP_codes.MSP_SET_3D, MSP.crunch(MSP_codes.MSP_SET_3D), false, next_callback);
                } else {
                   next_callback();
                }
            }

            function save_sensor_alignment() {
                var next_callback = save_acc_trim;
                if(semver.gte(CONFIG.apiVersion, "1.15.0")) {
                   MSP.send_message(MSP_codes.MSP_SET_SENSOR_ALIGNMENT, MSP.crunch(MSP_codes.MSP_SET_SENSOR_ALIGNMENT), false, next_callback);
                } else {
                   next_callback();
                }
=======
               MSP.send_message(MSPCodes.MSP_SET_3D, mspHelper.crunch(MSPCodes.MSP_SET_3D), false, save_sensor_alignment);
            }

            function save_sensor_alignment() {
               MSP.send_message(MSPCodes.MSP_SET_SENSOR_ALIGNMENT, mspHelper.crunch(MSPCodes.MSP_SET_SENSOR_ALIGNMENT), false, save_acc_trim);
>>>>>>> master
            }

            function save_acc_trim() {
                MSP.send_message(MSPCodes.MSP_SET_ACC_TRIM, mspHelper.crunch(MSPCodes.MSP_SET_ACC_TRIM), false, save_arming_config);
            }

            function save_arming_config() {
                MSP.send_message(MSPCodes.MSP_SET_ARMING_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_ARMING_CONFIG), false, save_looptime_config);
            }

            function save_looptime_config() {
                MSP.send_message(MSPCodes.MSP_SET_LOOP_TIME, mspHelper.crunch(MSPCodes.MSP_SET_LOOP_TIME), false, save_rx_config);
            }

            function save_rx_config() {
                var next_callback = saveAdvancedConfig;
                if(semver.gte(CONFIG.apiVersion, "1.21.0")) {
                   MSP.send_message(MSPCodes.MSP_SET_RX_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_RX_CONFIG), false, next_callback);
                } else {
                   next_callback();
                }
            }

            function saveAdvancedConfig() {
                var next_callback = saveINAVPidConfig;
                if(semver.gte(CONFIG.flightControllerVersion, "1.3.0")) {
                   MSP.send_message(MSPCodes.MSP_SET_ADVANCED_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_ADVANCED_CONFIG), false, next_callback);
                } else {
                   next_callback();
                }
            }

            function saveINAVPidConfig() {
                var next_callback = saveSensorConfig;
                if(semver.gt(CONFIG.flightControllerVersion, "1.3.0")) {
                   MSP.send_message(MSPCodes.MSP_SET_INAV_PID, mspHelper.crunch(MSPCodes.MSP_SET_INAV_PID), false, next_callback);
                } else {
                   next_callback();
                }
            }

            function saveSensorConfig() {
                var next_callback = save_to_eeprom;
                if(semver.gte(CONFIG.flightControllerVersion, "1.5.0")) {
                    MSP.send_message(MSPCodes.MSP_SET_SENSOR_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_SENSOR_CONFIG), false, next_callback);
                } else {
                    next_callback();
                }
            }

            function save_to_eeprom() {
                MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, reboot);
            }

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

            MSP.send_message(MSPCodes.MSP_SET_BF_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_BF_CONFIG), false, save_misc);
        });

        // status data pulled via separate timer with static speed
        GUI.interval_add('status_pull', function status_pull() {
            MSP.send_message(MSPCodes.MSP_STATUS);
            
            if (semver.gte(CONFIG.flightControllerVersion, "1.5.0")) {
                MSP.send_message(MSPCodes.MSP_SENSOR_STATUS);
            }
        }, 250, true);
        GUI.interval_add('config_load_analog', load_analog, 250, true); // 4 fps
        GUI.content_ready(callback);
    }
};

TABS.configuration.cleanup = function (callback) {
    if (callback) callback();
};
