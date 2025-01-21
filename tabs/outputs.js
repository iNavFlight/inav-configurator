'use strict';

const path = require('path');

const MSPChainerClass = require('./../js/msp/MSPchainer');
const mspHelper = require('./../js/msp/MSPHelper');
const MSPCodes = require('./../js/msp/MSPCodes');
const mspQueue = require('./../js/serial_queue')
const MSP = require('./../js/msp');
const { GUI, TABS } = require('./../js/gui');
const FC = require('./../js/fc');
const i18n = require('./../js/localization');
const BitHelper = require('../js/bitHelper');
const Settings = require('./../js/settings');
const features = require('./../js/feature_framework');
const { mixer, PLATFORM } = require('./../js/model');
const timeout = require('./../js/timeouts')
const interval = require('./../js/intervals');

TABS.outputs = {
    allowTestMode: false,
    feature3DEnabled: false,
    feature3DSupported: false
};
TABS.outputs.initialize = function (callback) {
    var self = this;

    self.armed = false;
    self.feature3DSupported = false;
    self.allowTestMode = true;

    var $motorsEnableTestMode;

    if (GUI.active_tab !== 'outputs') {
        GUI.active_tab = 'outputs';
    }

    var loadChainer = new MSPChainerClass();

    loadChainer.setChain([
        mspHelper.loadMiscV2,
        mspHelper.loadFeatures,
        mspHelper.load3dConfig,
        mspHelper.loadMotors,
        mspHelper.loadMotorMixRules,
        mspHelper.loadServoMixRules,
        mspHelper.loadMixerConfig,
        mspHelper.loadServoConfiguration,
        mspHelper.loadOutputMappingExt,
        mspHelper.loadRcData,
        mspHelper.loadAdvancedConfig,
        function(callback) {
            mspHelper.getSetting("motor_direction_inverted").then((data)=>{
                self.motorDirectionInverted=data.value;
            }).then(callback)
        }
    ]);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();
    update_arm_status();

    var saveChainer = new MSPChainerClass();

    saveChainer.setChain([
        saveSettings,
        mspHelper.sendServoConfigurations,
        mspHelper.saveAdvancedConfig,
        mspHelper.saveMiscV2,
        mspHelper.save3dConfig,
        mspHelper.saveToEeprom
    ]);
    saveChainer.setExitPoint(function () {
        GUI.log(i18n.getMessage('eeprom_saved_ok'));
        FC.MOTOR_RULES.cleanup();
    });

    function load_html() {
        GUI.load(path.join(__dirname, "outputs.html"), Settings.processHtml(onLoad));
    }

    function saveSettings(onComplete) {
        Settings.saveInputs(onComplete);
    }

    function onLoad() {

        self.feature3DEnabled = BitHelper.bit_check(FC.FEATURES, 12);

        process_motors();
        process_servos();
        processConfiguration();

        finalize();
    }

    function getMotorOutputValue(value) {

        if (!self.feature3DEnabled) {
            let valueNormalized = value - FC.MISC.mincommand;
            let maxThrottleNormalized = FC.MISC.maxthrottle - FC.MISC.mincommand;

            return Math.round(100 * valueNormalized / maxThrottleNormalized) + "%";
        } else {
            return value;
        }
    }

    function processConfiguration() {
        let escProtocols = FC.getEscProtocols(),
            servoRates = FC.getServoRates(),
            $idlePercent = $('#throttle_idle'),
            $idleInfoBox = $("#throttle_idle-info"),
            $motorStopWarningBox = $("#motor-stop-warning"),
            $reversibleMotorBox = $(".for-reversible-motors");

        function handleIdleMessageBox() {
            $idleInfoBox.hide();
            if (FC.ADVANCED_CONFIG.motorPwmProtocol >= 5) {
                $('.hide-for-shot').hide();
                if ($idlePercent.val() > 7.0) {
                    $idleInfoBox.html(i18n.getMessage('throttleIdleDigitalInfo'));
                    $idleInfoBox.addClass('ok-box');
                    $idleInfoBox.show();
                }
            } else {
                $('.hide-for-shot').show();
                if ($idlePercent.val() > 10.0) {
                    $idleInfoBox.html(i18n.getMessage('throttleIdleAnalogInfo'));
                    $idleInfoBox.addClass('ok-box');
                    $idleInfoBox.show();
                }
            }
        }

        let $escProtocol = $('#esc-protocol');
        
        for (let i in escProtocols) {
            if (escProtocols.hasOwnProperty(i)) {
                var protocolData = escProtocols[i];
                $escProtocol.append('<option value="' + i + '">' + protocolData.name + '</option>');
            }
        }

        $escProtocol.val(FC.ADVANCED_CONFIG.motorPwmProtocol);

        $escProtocol.on('change', function () {
            FC.ADVANCED_CONFIG.motorPwmProtocol = $(this).val();
        });

        $idlePercent.on('change', handleIdleMessageBox);
        handleIdleMessageBox();

        $("#esc-protocols").show();

        let $servoRate = $('#servo-rate');

        for (let i in servoRates) {
            if (servoRates.hasOwnProperty(i)) {
                $servoRate.append('<option value="' + i + '">' + servoRates[i] + '</option>');
            }
        }
        /*
         *  If rate from FC is not on the list, add a new entry
         */
        if ($servoRate.find('[value="' + FC.ADVANCED_CONFIG.servoPwmRate + '"]').length == 0) {
            $servoRate.append('<option value="' + FC.ADVANCED_CONFIG.servoPwmRate + '">' + FC.ADVANCED_CONFIG.servoPwmRate + 'Hz</option>');
        }

        $servoRate.val(FC.ADVANCED_CONFIG.servoPwmRate);
        $servoRate.on('change', function () {
            FC.ADVANCED_CONFIG.servoPwmRate = $(this).val();
        });

        $('#servo-rate-container').show();

        features.updateUI($('.tab-motors'), FC.FEATURES);
        GUI.simpleBind();

        let $reversibleMotorCheckbox = $('#feature-12');
        function showHideReversibleMotorInfo() {
            const reversibleMotorEnabled = $reversibleMotorCheckbox.is(':checked');

            console.log(reversibleMotorEnabled);

            if (reversibleMotorEnabled) {
                $reversibleMotorBox.show();
            } else {
                $reversibleMotorBox.hide();
            }
        }
        $reversibleMotorCheckbox.on('change', showHideReversibleMotorInfo);
        showHideReversibleMotorInfo();

        let $motorStopCheckbox = $('#feature-4');
        function showHideMotorStopWarning() {
            const platformNeedsMotorStop = [PLATFORM.AIRPLANE, PLATFORM.ROVER, PLATFORM.BOAT].includes(FC.MIXER_CONFIG.platformType);
            const motorStopEnabled = $motorStopCheckbox.is(':checked');
            if (platformNeedsMotorStop && motorStopEnabled || !platformNeedsMotorStop && !motorStopEnabled) {
                $motorStopWarningBox.hide();
            } else {
                $motorStopWarningBox.show();
            }
        }
        $motorStopCheckbox.on('change', showHideMotorStopWarning);
        showHideMotorStopWarning();

        $('#3ddeadbandlow').val(FC.REVERSIBLE_MOTORS.deadband_low);
        $('#3ddeadbandhigh').val(FC.REVERSIBLE_MOTORS.deadband_high);
        $('#3dneutral').val(FC.REVERSIBLE_MOTORS.neutral);
    }

    function update_arm_status() {
        self.armed = FC.isModeEnabled('ARM');
    }

    function initSensorData() {
        for (var i = 0; i < 3; i++) {
            FC.SENSOR_DATA.accelerometer[i] = 0;
        }
    }

    function initDataArray(length) {
        var data = new Array(length);
        for (var i = 0; i < length; i++) {
            data[i] = [];
            data[i].min = -1;
            data[i].max = 1;
        }
        return data;
    }

    function addSampleToData(data, sampleNumber, sensorData) {
        for (var i = 0; i < data.length; i++) {
            var dataPoint = sensorData[i];
            data[i].push([sampleNumber, dataPoint]);
            if (dataPoint < data[i].min) {
                data[i].min = dataPoint;
            }
            if (dataPoint > data[i].max) {
                data[i].max = dataPoint;
            }
        }
        while (data[0].length > 40) {
            for (let i = 0; i < data.length; i++) {
                data[i].shift();
            }
        }
        return sampleNumber + 1;
    }

    function update_model(val) {
        if (FC.MIXER_CONFIG.appliedMixerPreset == -1) return;

        const isMotorInverted = self.motorDirectionInverted;
        const isReversed = isMotorInverted && (FC.MIXER_CONFIG.platformType == PLATFORM.MULTIROTOR || FC.MIXER_CONFIG.platformType == PLATFORM.TRICOPTER);

        const path = './resources/motor_order/'
            + mixer.getById(val).image + (isReversed ? "_reverse" : "") + '.svg';
        $('.mixerPreview img').attr('src', path);
        labelMotorNumbers();
    }

    function process_servos() {

        let $tabServos = $(".tab-servos"),
            $servoEmptyTableInfo = $('#servoEmptyTableInfo'),
            $servoConfigTableContainer = $('#servo-config-table-container'),
            $servoConfigTable = $('#servo-config-table');

        if (FC.SERVO_CONFIG.length == 0) {
            $tabServos.addClass("is-hidden");
            return;
        }

        function renderServos(name, alternate, obj) {

            $servoConfigTable.append('\
                <tr> \
                    <td class="text-center">' + name + '</td>\
                    <td class="middle"><input type="number" min="500" max="2500" value="' + FC.SERVO_CONFIG[obj].middle + '" /></td>\
                    <td class="min"><input type="number" min="500" max="2500" value="' + FC.SERVO_CONFIG[obj].min + '" /></td>\
                    <td class="max"><input type="number" min="500" max="2500" value="' + FC.SERVO_CONFIG[obj].max + '" /></td>\
                    <td class="text-center rate">\
                    <td class="text-center reverse">\
                    </td>\
                </tr> \
            ');

            let $currentRow = $servoConfigTable.find('tr:last');

            // adding select box and generating options
            $currentRow.find('td.rate').append(
                '<input class="rate-input" type="number" min="' + FC.MIN_SERVO_RATE + '" max="' + FC.MAX_SERVO_RATE + '" value="' + Math.abs(FC.SERVO_CONFIG[obj].rate) + '" />'
            );

            $currentRow.find('td.reverse').append(
                '<input type="checkbox" class="reverse-input togglemedium" ' + (FC.SERVO_CONFIG[obj].rate < 0 ? ' checked ' : '') + '/>'
            );

            $currentRow.data('info', { 'obj': obj });

            $currentRow.append('<td class="text-center output"></td>');

            let output,
                outputString;

            if (FC.MIXER_CONFIG.platformType == PLATFORM.MULTIROTOR || FC.MIXER_CONFIG.platformType == PLATFORM.TRICOPTER) {
                output = FC.OUTPUT_MAPPING.getMrServoOutput(usedServoIndex);
            } else {
                output = FC.OUTPUT_MAPPING.getFwServoOutput(usedServoIndex);
            }

            if (output === null) {
                outputString = "-";
            } else {
                outputString = "S" + output;
            }

            $currentRow.find('.output').html(outputString);
            //For 2.0 and above hide a row when servo is not configured
            if (!FC.SERVO_RULES.isServoConfigured(obj)) {
                $currentRow.hide();
            } else {
                usedServoIndex++;
            }
        }

        function servos_update() {
            $servoConfigTable.find('tr:not(".main")').each(function () {
                var info = $(this).data('info');

                var selection = $('.channel input', this);
                var channelIndex = parseInt(selection.index(selection.filter(':checked')));
                if (channelIndex == -1) {
                    channelIndex = undefined;
                }

                FC.SERVO_CONFIG[info.obj].middle = parseInt($('.middle input', this).val());
                FC.SERVO_CONFIG[info.obj].min = parseInt($('.min input', this).val());
                FC.SERVO_CONFIG[info.obj].max = parseInt($('.max input', this).val());
                var rate = parseInt($('.rate-input', this).val());
                if ($('.reverse-input', this).is(':checked')) {
                    rate = -rate;
                }
                FC.SERVO_CONFIG[info.obj].rate = rate;
            });

            FC.REVERSIBLE_MOTORS.deadband_low = parseInt($('#3ddeadbandlow').val());
            FC.REVERSIBLE_MOTORS.deadband_high = parseInt($('#3ddeadbandhigh').val());
            FC.REVERSIBLE_MOTORS.neutral = parseInt($('#3dneutral').val());

            //Save configuration to FC
            saveChainer.execute();
        }

        // drop previous table
        $servoConfigTable.find('tr:not(:first)').remove();

        let usedServoIndex = 0;

        for (let servoIndex = 0; servoIndex < FC.SERVO_RULES.getServoCount(); servoIndex++) {
            renderServos('Servo ' + servoIndex, '', servoIndex);
        }
        if (usedServoIndex == 0) {
            // No servos configured
            $servoEmptyTableInfo.show();
            $servoConfigTableContainer.hide();
        } else {
            $servoEmptyTableInfo.hide();
            $servoConfigTableContainer.show();
        }

        // UI hooks for dynamically generated elements
        $('table.directions select, table.directions input, #servo-config-table select, #servo-config-table input').on('change', function () {
            if ($('div.live input').is(':checked')) {
                // apply small delay as there seems to be some funky update business going wrong
                timeout.add('servos_update', servos_update, 10);
            }
        });

        $('a.update').on('click', function () {
            features.reset();
            features.fromUI($('.tab-motors'));
            features.execute(servos_update);
        });
        $('a.save').on('click', function () {
            saveChainer.setExitPoint(function () {
                //noinspection JSUnresolvedVariable
                GUI.log(i18n.getMessage('configurationEepromSaved'));

                GUI.tab_switch_cleanup(function () {
                    MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function () {
                        GUI.log(i18n.getMessage('deviceRebooting'));
                        GUI.handleReconnect($('.tab_outputs a'));
                    });
                });
            });
            features.reset();
            features.fromUI($('.tab-motors'));
            features.execute(servos_update);
        });

    }

    function process_motors() {
        $motorsEnableTestMode = $('#motorsEnableTestMode');

        if (self.feature3DEnabled && !self.feature3DSupported) {
            self.allowTestMode = false;
        }

        $motorsEnableTestMode.prop('checked', false);
        $motorsEnableTestMode.prop('disabled', true);

        update_model(FC.MIXER_CONFIG.appliedMixerPreset);

        // Always start with default/empty sensor data array, clean slate all
        initSensorData();

        // Setup variables
        var samples_accel_i = 0,
            accel_data = initDataArray(3),
            accel_max_read = [0, 0, 0],
            accel_offset = [0, 0, 0],
            accel_offset_established = false;

        let $rmsHelper = $(".acc-rms"),
            $currentHelper = $(".current-current"),
            $voltageHelper = $(".current-voltage");

        // timer initialization
        interval.killAll(['motor_and_status_pull', 'global_data_refresh', 'msp-load-update', 'ltm-connection-check']);

        interval.add('IMU_pull', function () {
            MSP.send_message(MSPCodes.MSP_RAW_IMU, false, false, update_accel_graph);
        }, 25, true);

        interval.add('ANALOG_pull', function () {
            $currentHelper.html(FC.ANALOG.amperage.toFixed(2));
            $voltageHelper.html(FC.ANALOG.voltage.toFixed(2));
        }, 100, true);

        function update_accel_graph() {

            if (!accel_offset_established) {
                for (var i = 0; i < 3; i++) {
                    accel_offset[i] = FC.SENSOR_DATA.accelerometer[i] * -1;
                }

                accel_offset_established = true;
            }

            var accel_with_offset = [
                accel_offset[0] + FC.SENSOR_DATA.accelerometer[0],
                accel_offset[1] + FC.SENSOR_DATA.accelerometer[1],
                accel_offset[2] + FC.SENSOR_DATA.accelerometer[2]
            ];

            samples_accel_i = addSampleToData(accel_data, samples_accel_i, accel_with_offset);

            // Compute RMS of acceleration in displayed period of time
            // This is particularly useful for motor balancing as it
            // eliminates the need for external tools
            var sum = 0.0;
            for (var j = 0; j < accel_data.length; j++)
                for (var k = 0; k < accel_data[j].length; k++)
                    sum += accel_data[j][k][1] * accel_data[j][k][1];

            let rms = Math.sqrt(sum / (accel_data[0].length + accel_data[1].length + accel_data[2].length));
            $rmsHelper.text(rms.toFixed(4));

            for (var i = 0; i < 3; i++) {
                if (Math.abs(accel_with_offset[i]) > Math.abs(accel_max_read[i])) accel_max_read[i] = accel_with_offset[i];
            }
        }

        let motors_wrapper = $('.motors .bar-wrapper'),
            servos_wrapper = $('.servos .bar-wrapper'),
            $motorTitles = $('.motor-titles'),
            $motorSliders = $('.motor-sliders'),
            $motorValues = $('.motor-values');

        for (let i = 0; i < FC.MOTOR_RULES.getNumberOfConfiguredMotors(); i++) {
            const motorNumber = i + 1;
            motors_wrapper.append('\
                <div class="m-block motor-' + i + '">\
                    <div class="meter-bar">\
                        <div class="label"></div>\
                        <div class="indicator">\
                            <div class="label">\
                                <div class="label"></div>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            ');
            $motorTitles.append('<li title="Motor - ' + motorNumber + '">' + motorNumber + '</li>');
            $motorSliders.append('<div class="motor-slider-container"><input type="range" min="1000" max="2000" value="1000" disabled="disabled"/></div>');
            $motorValues.append('<li>0%</li>');
        }

        $motorSliders.append('<div class="motor-slider-container"><input type="range" min="1000" max="2000" value="1000" disabled="disabled" class="master"/></div>');
        $motorValues.append('<li style="font-weight: bold" data-i18n="motorsMaster"></li>');

        for (let i = 0; i < FC.SERVO_RULES.getServoCount(); i++) {

            let opacity = "";
            if (!FC.SERVO_RULES.isServoConfigured(15 - i)) {
                opacity = ' style="opacity: 0.2"';
            }

            servos_wrapper.append('\
                <div class="m-block servo-' + (15 - i) + '" ' + opacity + '>\
                    <div class="meter-bar">\
                        <div class="label"></div>\
                        <div class="indicator">\
                            <div class="label">\
                                <div class="label"></div>\
                            </div>\
                        </div>\
                    </div>\
                </div>\
            ');
        }

        var $slidersInput = $('div.sliders input');

        $slidersInput.prop('min', FC.MISC.mincommand);
        $slidersInput.prop('max', FC.MISC.maxthrottle);
        $('div.values li:not(:last)').text(FC.MISC.mincommand);

        if (self.feature3DEnabled && self.feature3DSupported) {
            //Arbitrary sanity checks
            //Note: values may need to be revisited
            if (FC.REVERSIBLE_MOTORS.neutral > 1575 || FC.EVERSIBLE_MOTORS.neutral < 1425)
                FC.REVERSIBLE_MOTORS.neutral = 1500;

            $slidersInput.val(FC.REVERSIBLE_MOTORS.neutral);
        } else {
            $slidersInput.val(FC.MISC.mincommand);
        }

        if (self.allowTestMode) {
            // UI hooks
            var buffering_set_motor = [],
                buffer_delay = false;

            $('div.sliders input:not(.master)').on('input', function () {

                var index = $('div.sliders input:not(.master)').index(this),
                    buffer = [],
                    i;

                $('div.values li').eq(index).text(getMotorOutputValue($(this).val()));

                for (let i = 0; i < 8; i++) {
                    var val = parseInt($('div.sliders input').eq(i).val());

                    buffer.push(BitHelper.lowByte(val));
                    buffer.push(BitHelper.highByte(val));
                }

                buffering_set_motor.push(buffer);

                if (!buffer_delay) {
                    buffer_delay = setTimeout(function () {
                        buffer = buffering_set_motor.pop();

                        MSP.send_message(MSPCodes.MSP_SET_MOTOR, buffer);

                        buffering_set_motor = [];
                        buffer_delay = false;
                    }, 100);
                }
            });
        }

        $('div.sliders input.master').on('input', function () {
            var val = $(this).val();
            $('div.sliders input:not(:disabled, :last)').val(val);
            $('div.values li:not(:last)').slice(0, FC.MOTOR_RULES.getNumberOfConfiguredMotors()).text(getMotorOutputValue(val));
            $('div.sliders input:not(:last):first').trigger('input');
        });

        $motorsEnableTestMode.on('change', function () {
            if ($(this).is(':checked')) {
                $slidersInput.slice(0, FC.MOTOR_RULES.getNumberOfConfiguredMotors()).prop('disabled', false);

                // unlock master slider
                $('div.sliders input:last').prop('disabled', false);
            } else {
                // disable sliders / min max
                $slidersInput.prop('disabled', true);

                // change all values to default
                if (self.feature3DEnabled && self.feature3DSupported) {
                    $slidersInput.val(FC.REVERSIBLE_MOTORS.neutral);
                } else {
                    $slidersInput.val(FC.MISC.mincommand);
                }

                $slidersInput.trigger('input');
            }
        });

        // check if motors are already spinning
        var motors_running = false;

        for (var i = 0; i < FC.MOTOR_RULES.getNumberOfConfiguredMotors(); i++) {
            if (!self.feature3DEnabled) {
                if (FC.MOTOR_DATA[i] > FC.MISC.mincommand) {
                    motors_running = true;
                    break;
                }
            } else {
                if ((FC.MOTOR_DATA[i] < FC.REVERSIBLE_MOTORS.deadband_low) || (FC.MOTOR_DATA[i] > FC.REVERSIBLE_MOTORS.deadband_high)) {
                    motors_running = true;
                    break;
                }
            }
        }

        if (motors_running) {
            if (!self.armed && self.allowTestMode) {
                $motorsEnableTestMode.prop('checked', true);
            }
            // motors are running adjust sliders to current values

            var sliders = $('div.sliders input:not(.master)');

            var master_value = FC.MOTOR_DATA[0];
            for (var i = 0; i < FC.MOTOR_DATA.length; i++) {
                if (FC.MOTOR_DATA[i] > 0) {
                    sliders.eq(i).val(FC.MOTOR_DATA[i]);

                    if (master_value != FC.MOTOR_DATA[i]) {
                        master_value = false;
                    }
                }
            }

            // only fire events when all values are set
            sliders.trigger('input');

            // slide master slider if condition is valid
            if (master_value) {
                $('div.sliders input.master').val(master_value);
                $('div.sliders input.master').trigger('input');
            }
        }

        $motorsEnableTestMode.trigger('change');

        function getPeriodicMotorOutput() {
            MSP.send_message(MSPCodes.MSP_MOTOR, false, false, getPeriodicServoOutput);
        }

        function getPeriodicServoOutput() {
            MSP.send_message(MSPCodes.MSP_SERVO, false, false, update_ui);
        }

        var full_block_scale = FC.MISC.maxthrottle - FC.MISC.mincommand;

        function update_ui() {
            var previousArmState = self.armed,
                block_height = $('div.m-block:first').height(),
                data,
                margin_top,
                height,
                color,
                i;

            for (let i= 0; i < FC.MOTOR_DATA.length; i++) {
                data = FC.MOTOR_DATA[i] - FC.MISC.mincommand;
                margin_top = block_height - (data * (block_height / full_block_scale)).clamp(0, block_height);
                height = (data * (block_height / full_block_scale)).clamp(0, block_height);
                color = parseInt(data * 0.009);

                $('.motor-' + i + ' .label', motors_wrapper).text(getMotorOutputValue(FC.MOTOR_DATA[i]));
                $('.motor-' + i + ' .indicator', motors_wrapper).css({ 'margin-top': margin_top + 'px', 'height': height + 'px', 'background-color': '#37a8db' + color + ')' });
            }

            // servo indicators are still using old (not flexible block scale), it will be changed in the future accordingly
            for (let i= 0; i < FC.SERVO_DATA.length; i++) {
                data = FC.SERVO_DATA[i] - 1000;
                margin_top = block_height - (data * (block_height / 1000)).clamp(0, block_height);
                height = (data * (block_height / 1000)).clamp(0, block_height);
                color = parseInt(data * 0.009);

                $('.servo-' + i + ' .label', servos_wrapper).text(FC.SERVO_DATA[i]);
                $('.servo-' + i + ' .indicator', servos_wrapper).css({ 'margin-top': margin_top + 'px', 'height': height + 'px', 'background-color': '#37a8db' + color + ')' });
            }
            //keep the following here so at least we get a visual cue of our motor setup
            update_arm_status();
            if (!self.allowTestMode) return;

            if (self.armed) {
                $motorsEnableTestMode.prop('disabled', true);
                $motorsEnableTestMode.prop('checked', false);
            } else {
                if (self.allowTestMode) {
                    $motorsEnableTestMode.prop('disabled', false);
                }
            }

            if (previousArmState != self.armed) {
                console.log('arm state change detected');
                $motorsEnableTestMode.trigger('change');
            }
        }

        // enable Status and Motor data pulling
        interval.add('motor_and_status_pull', getPeriodicMotorOutput, 100, true);
    }

    function finalize() {
       i18n.localize();;
        GUI.content_ready(callback);
    }

   function labelMotorNumbers() {

       if (mixer.getById(FC.MIXER_CONFIG.appliedMixerPreset).image != 'quad_x') {
           return;
       }


        let index = 0;
        var rules = FC.MOTOR_RULES.get();

        for (const i in rules) {
            if (rules.hasOwnProperty(i)) {
                const rule = rules[i];
                index++;

                let top_px = 30;
                let left_px = 28;
                if (rule.getRoll() < -0.5) {
                  left_px = $("#motor-mixer-preview-img").width() - 20;
                }

                if (rule.getPitch() > 0.5) {
                  top_px = $("#motor-mixer-preview-img").height() - 20;
                }
                $("#motorNumber"+index).css("left", left_px + "px");
                $("#motorNumber"+index).css("top", top_px + "px");
                $("#motorNumber"+index).css("visibility", "visible");
            }
        }
    }


};

TABS.outputs.cleanup = function (callback) {
    if (callback) callback();
};
