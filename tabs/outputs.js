'use strict';

import MSPChainerClass from './../js/msp/MSPchainer';
import mspHelper from './../js/msp/MSPHelper';
import MSPCodes from './../js/msp/MSPCodes';
import MSP from './../js/msp';
import GUI from './../js/gui';
import FC from './../js/fc';
import i18n from './../js/localization';
import BitHelper from '../js/bitHelper';
import Settings from './../js/settings';
import features from './../js/feature_framework';
import { mixer, PLATFORM } from './../js/model';
import timeout from './../js/timeouts';
import interval from './../js/intervals';
import { mountEscDirection } from '../js/escDirectionPanel';

/* Phase 0 of the firmware's calibration state machine, which is also how the
 * sequence is called off. Out here because cleanup() needs it too. */
const SRXL2_CAL_OFF = 0;

/* MSP.send_message calls back with false when the request never made it. Reading
 * .data off that throws, and a poller running every 500 ms throws on every tick,
 * so every use of a reply checks it arrived first. */
function srxl2StatusArrived(resp) {
    return Boolean(resp?.data);
}

const outputsTab = {
    allowTestMode: false,
    srxl2Calibrating: false,
    feature3DEnabled: false
};
outputsTab.initialize = function (callback) {
    var self = this;

    self.armed = false;
    self.allowTestMode = true;

    var $motorsEnableTestMode;

    if (GUI.active_tab !== this) {
        GUI.active_tab = this;
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
        /* Needed to count the ports assigned to Spektrum Smart ESC. Without it
         * FC.SERIAL_CONFIG is whatever an earlier tab happened to leave behind -
         * empty on a fresh start - and the tab reports no port assigned however
         * many there are. */
        mspHelper.loadSerialPorts,
        /* One Smart ESC status request before the UI is built. On a board
         * without the driver it comes back as an unsupported command, and that
         * is what stops the tab offering a protocol and a port function the
         * board has no code to perform. */
        function (callback) {
            MSP.send_message(MSPCodes.MSP2_INAV_ESC_SRXL2_STATUS, false, false, function () {
                callback();
            });
        },
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
        import('./outputs.html?raw').then(({default: html}) => GUI.load(html, Settings.processHtml(onLoad)));
    }

    function saveSettings(onComplete) {
        Settings.saveInputs(onComplete);
    }

    function onLoad(settingsPromise) {

        self.feature3DEnabled = BitHelper.bit_check(FC.FEATURES, 12);

        process_motors();
        process_servos();
        processConfiguration(settingsPromise);
        self.disposeEscDirection = mountEscDirection({ MSP, MSPCodes, FC, i18n, interval,
            isArmed: () => self.armed
        });

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

    function processConfiguration(settingsPromise) {
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

        /*
         * SRXL2 is not a timer waveform like every other entry in this list: the
         * ESC hangs off a UART, so the block below only makes sense for it, and a
         * port has to have been assigned in the Ports tab for it to work at all.
         */
        const SRXL2_PROTOCOL = 7;

        /* Offering SRXL2 where the firmware has none is not a cosmetic mistake:
         * saving it leaves the board on a protocol nothing drives, and the
         * motors unwritten. */
        if (!FC.SRXL2_STATUS.supported) {
            delete escProtocols[SRXL2_PROTOCOL];
        }

        const SRXL2_CAL_WAIT_BATTERY = 1, SRXL2_CAL_SETTLE = 2, SRXL2_CAL_LOW = 3;

        /* srxl2CalResult_e in the firmware. The sequence presents full throttle, so
         * it has preconditions, and the operator needs to know which one failed
         * rather than watching a wizard start and immediately finish. */
        const SRXL2_CAL_REFUSED = {
            1: 'srxl2CalibrateRefusedArmed',
            2: 'srxl2CalibrateRefusedNoPort',
            3: 'srxl2CalibrateRefusedBattery',
            4: 'srxl2CalibrateRefusedNoSensor',
        };

        /* Registered with the interval helper rather than setInterval, because
         * GUI.tab_switch_cleanup kills those for us: a poller that outlives its
         * own Abort button would keep asking, and keep writing into content that
         * is no longer on screen. */
        const SRXL2_POLL = 'srxl2_cal_poll';

        /*
         * How many ports the firmware actually opened, and how many motors the
         * mixer wants. Both come from the board rather than being inferred here,
         * because they are exactly the two numbers pwmInitMotors() compares when it
         * decides whether arming is allowed - so the warning cannot disagree with
         * the behaviour it is warning about.
         *
         * Note MSP2_INAV_MIXER does NOT carry the model's motor count: its last two
         * bytes are MAX_SUPPORTED_MOTORS and MAX_SUPPORTED_SERVOS, the compile-time
         * ceilings. Reading numberOfMotors from there reports 12 on any board.
         */
        let srxl2Counts = null;     // {ports, motors}, or null if not yet known

        function srxl2RefreshCounts(done) {
            MSP.send_message(MSPCodes.MSP2_INAV_ESC_SRXL2_STATUS, false, false, function (resp) {
                /* The reply is parsed into FC.SRXL2_STATUS before this runs, so
                 * the numbers come from there rather than being read a second
                 * time out of the buffer. */
                srxl2Counts = srxl2StatusArrived(resp)
                    ? { ports: FC.SRXL2_STATUS.ports, motors: FC.SRXL2_STATUS.motors }
                    : null;
                if (done) {
                    done();
                }
            });
        }

        /* What the Ports tab currently shows, saved or not. Used only to notice an
         * assignment the board has not rebooted into yet. */
        function srxl2PortsAssignedInUi() {
            if (!FC.SERIAL_CONFIG?.ports) {
                return 0;
            }
            let n = 0;
            for (const port of FC.SERIAL_CONFIG.ports) {
                if (port.functions.includes('ESC_SRXL2')) {
                    n++;
                }
            }
            return n;
        }

        function srxl2CalStop() {
            interval.remove(SRXL2_POLL);
            outputsTab.srxl2Calibrating = false;
            $('#srxl2-cal-abort').hide();
            $('#srxl2-cal-start').show();
            $('#srxl2-cal-ack').prop('checked', false);
            $('#srxl2-cal-start').addClass('disabled');
        }

        function srxl2CalShow(messageId) {
            $('#srxl2-cal-status').html(i18n.getMessage(messageId)).show();
        }

        function srxl2CalPoll() {
            MSP.send_message(MSPCodes.MSP2_INAV_ESC_SRXL2_STATUS, false, false, function (resp) {
                if (!srxl2StatusArrived(resp)) {
                    return;     /* one lost poll; the next one in 500 ms decides */
                }
                switch (FC.SRXL2_STATUS.phase) {
                case SRXL2_CAL_WAIT_BATTERY: srxl2CalShow('srxl2CalibrateConnect'); break;
                case SRXL2_CAL_SETTLE:       srxl2CalShow('srxl2CalibrateHeard');   break;
                case SRXL2_CAL_LOW:          srxl2CalShow('srxl2CalibrateLow');     break;
                default:
                    /* The firmware ends every phase on its own, so reaching OFF is
                     * the normal finish as well as the result of an abort. */
                    srxl2CalShow('srxl2CalibrateDone');
                    srxl2CalStop();
                    break;
                }
            });
        }

        function srxl2UpdateVisibility() {
            const isSrxl2 = Number.parseInt(FC.ADVANCED_CONFIG.motorPwmProtocol, 10) === SRXL2_PROTOCOL;
            $('#srxl2-esc').toggle(isSrxl2);

            /*
             * Reversible motors is the centre-zero throttle arrangement, which is a
             * different kind of ESC. A Smart ESC reverses on a switch and goes on
             * reading the throttle normally, so enabling it would hand the ESC
             * roughly half throttle where the pilot expects the motor stopped. The
             * firmware clears the feature for this protocol at startup; hiding the
             * control keeps the tab from offering what the board will undo.
             */
            $('#feature-12').closest('.checkbox').toggle(!isSrxl2);

            /*
             * Assigning the port and choosing the protocol are two settings, and
             * doing only the first is the easy mistake: the block below is hidden
             * until the protocol is SRXL2, so without this the tab says nothing at
             * all to someone who has configured the port and is wondering why
             * nothing happened.
             */
            $('#srxl2-protocol-hint')
                .toggle(!isSrxl2 && srxl2PortsAssignedInUi() > 0)
                .html(i18n.getMessage('srxl2ProtocolNotSet'));

            if (isSrxl2) {
                const assigned = srxl2PortsAssignedInUi();
                const $warn = $('#srxl2-no-port');
                const $info = $('#srxl2-port-count');

                if (!srxl2Counts) {
                    /* The board has not been asked yet, or does not answer - say
                     * only what is certain rather than inventing a motor count. */
                    $warn.toggle(assigned === 0).html(i18n.getMessage('srxl2NoPort'));
                    $info.html(i18n.getMessage('srxl2PortCount', [assigned]));
                    return;
                }

                const ports = srxl2Counts.ports;
                const motors = srxl2Counts.motors;

                if (assigned === 0 && ports === 0) {
                    $warn.html(i18n.getMessage('srxl2NoPort')).show();
                } else if (ports === 0) {
                    /* Assigned in the tab but not yet opened by the board: the ports
                     * are opened at startup, so this needs a reboot rather than
                     * another port. */
                    $warn.html(i18n.getMessage('srxl2PortNeedsReboot', [assigned])).show();
                } else if (ports < motors) {
                    $warn.html(i18n.getMessage('srxl2TooFewPorts', [motors, ports])).show();
                } else {
                    $warn.hide();
                }

                /* A board with no mixer preset applied reports no motors, which is
                 * a normal starting state and not worth phrasing as "for 0 motors". */
                $info.html(motors > 0
                    ? i18n.getMessage('srxl2PortCountOpen', [ports, motors])
                    : i18n.getMessage('srxl2PortCountOpenNoMixer', [ports]));
            } else {
                srxl2CalStop();
            }
        }

        /*
         * Reverse is off when the channel is 0, which is how the firmware stores it,
         * but a bare number field gives no hint that zero is the off switch. The
         * checkbox is that switch; the channel only appears once it is on.
         *
         * SRXL2_REVERSE_DEFAULT is what Spektrum ship, so turning it on lands
         * somewhere sensible rather than on a channel the ESC never watches.
         */
        const SRXL2_REVERSE_DEFAULT = 7;
        const $reverseEnable = $('#srxl2-reverse-enable');
        const $reverseChannel = $('#esc_srxl2_reverse_channel');
        const $reverseRow = $('#srxl2-reverse-channel-row');

        function srxl2ReverseSync() {
            const on = $reverseEnable.is(':checked');
            $reverseRow.toggle(on);
            if (on && Number.parseInt($reverseChannel.val(), 10) === 0) {
                $reverseChannel.val(SRXL2_REVERSE_DEFAULT).trigger('change');
            } else if (!on) {
                $reverseChannel.val(0).trigger('change');
            }
        }

        $reverseEnable.on('change', srxl2ReverseSync);

        $('#srxl2-cal-ack').on('change', function () {
            $('#srxl2-cal-start').toggleClass('disabled', !$(this).is(':checked'));
        });

        $('#srxl2-cal-start').on('click', function () {
            if ($(this).hasClass('disabled')) {
                return;
            }
            const data = [SRXL2_CAL_WAIT_BATTERY];
            MSP.send_message(MSPCodes.MSP2_INAV_ESC_SRXL2_CALIBRATE, data, false, function () {
                /*
                 * The callback fires whether or not the firmware accepted: this is
                 * an MSP IN command, so a refusal comes back as an error with no
                 * payload to explain it. Read the status instead and let that
                 * decide - otherwise the wizard announces "connect the battery" for
                 * a sequence that never started, then reports it finished.
                 */
                MSP.send_message(MSPCodes.MSP2_INAV_ESC_SRXL2_STATUS, false, false, function (resp) {
                    if (!srxl2StatusArrived(resp)) {
                        srxl2CalShow('srxl2CalibrateRefused');
                        $('#srxl2-cal-ack').prop('checked', false);
                        $('#srxl2-cal-start').addClass('disabled');
                        return;
                    }
                    if (FC.SRXL2_STATUS.phase === SRXL2_CAL_OFF) {
                        const why = FC.SRXL2_STATUS.lastResult;
                        srxl2CalShow(SRXL2_CAL_REFUSED[why] || 'srxl2CalibrateRefused');
                        $('#srxl2-cal-ack').prop('checked', false);
                        $('#srxl2-cal-start').addClass('disabled');
                        return;
                    }

                    $('#srxl2-cal-start').hide();
                    $('#srxl2-cal-abort').show();
                    srxl2CalShow('srxl2CalibrateConnect');
                    outputsTab.srxl2Calibrating = true;
                    interval.add(SRXL2_POLL, srxl2CalPoll, 500);
                });
            });
        });

        $('#srxl2-cal-abort').on('click', function () {
            MSP.send_message(MSPCodes.MSP2_INAV_ESC_SRXL2_CALIBRATE, [SRXL2_CAL_OFF], false, function () {
                srxl2CalShow('srxl2CalibrateAborted');
                srxl2CalStop();
            });
        });

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
            srxl2UpdateVisibility();
        });

        $idlePercent.on('change', handleIdleMessageBox);
        handleIdleMessageBox();

        /*
         * Waited for on purpose. Settings.processHtml() starts configureInputs()
         * and then calls this back immediately, by design, so the data-setting
         * inputs are still empty here - reading the reverse channel now returns
         * nothing and the switch would come up off every time, saved value or not.
         */
        function srxl2ReverseInit() {
            $reverseEnable.prop('checked', Number.parseInt($reverseChannel.val(), 10) > 0);
            $reverseRow.toggle($reverseEnable.is(':checked'));
        }

        if (settingsPromise && typeof settingsPromise.then === 'function') {
            settingsPromise.then(srxl2ReverseInit);
        } else {
            srxl2ReverseInit();
        }

        $("#esc-protocols").show();
        srxl2UpdateVisibility();
        /* Asked once: both counts are settled at startup and cannot change without
         * a reboot. Refreshes the block when the answer arrives. */
        srxl2RefreshCounts(srxl2UpdateVisibility);

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

        import(`./../resources/motor_order/${mixer.getById(val).image}${isReversed ? "_reverse" : ""}.svg`).then(({default: path}) => {
            $('.mixerPreview img').attr('src', path);
        });
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
            renderServos('Servo ' + (servoIndex), '', servoIndex);
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

        let servoCount = FC.SERVO_RULES.getServoCount();
        for (let i = 0; i < servoCount; i++) {

            let opacity = "";
            if (!FC.SERVO_RULES.isServoConfigured(servoCount - i)) {
                opacity = ' style="opacity: 0.2"';
            }

            servos_wrapper.append('\
                <div class="m-block servo-' + (servoCount - i) + '" ' + opacity + '>\
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

        if (self.feature3DEnabled) {
            // Clamp neutral to safe range around midpoint (1500us); values outside indicate corrupt config
            if (FC.REVERSIBLE_MOTORS.neutral > 1575 || FC.REVERSIBLE_MOTORS.neutral < 1425)
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
                if (self.feature3DEnabled) {
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

outputsTab.cleanup = function (callback) {
    this.disposeEscDirection?.();
    /*
     * Leaving the tab takes the Abort button with it, so the sequence it would
     * have stopped is called off here instead. The firmware is holding full
     * throttle on the wire while it waits for the battery, and a control that
     * has gone off screen is not a reason to leave it holding.
     */
    if (outputsTab.srxl2Calibrating) {
        outputsTab.srxl2Calibrating = false;
        MSP.send_message(MSPCodes.MSP2_INAV_ESC_SRXL2_CALIBRATE, [SRXL2_CAL_OFF], false, function () {
            if (callback) callback();
        });
        return;
    }
    if (callback) callback();
};

export default outputsTab;
