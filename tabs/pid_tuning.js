'use strict';

const path = require('path');
const Store = require('electron-store');
const store = new Store()

const MSPChainerClass = require('./../js/msp/MSPchainer');
const mspHelper = require('./../js/msp/MSPHelper');
const MSPCodes = require('./../js/msp/MSPCodes');
const MSP = require('./../js/msp');
const { GUI, TABS } = require('./../js/gui');
const features = require('./../js/feature_framework');
const tabs = require('./../js/tabs');
const FC = require('./../js/fc');
const Settings = require('./../js/settings');
const i18n = require('./../js/localization');
const { scaleRangeInt } = require('./../js/helpers');
const SerialBackend = require('./../js/serial_backend');
const BitHelper = require('./../js/bitHelper');

TABS.pid_tuning = {

};

TABS.pid_tuning.initialize = function (callback) {

    var loadChainer = new MSPChainerClass();

    let EZ_TUNE_PID_RP_DEFAULT = [40, 75, 23, 100];
    let EZ_TUNE_PID_YAW_DEFAULT = [45, 80, 0, 100];

    var loadChain = [
        mspHelper.loadPidData,
        mspHelper.loadRateDynamics,
        mspHelper.loadEzTune,
        mspHelper.loadMixerConfig,
    ];
    loadChain.push(mspHelper.loadRateProfileData);

    loadChainer.setChain(loadChain);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    if (GUI.active_tab != 'pid_tuning') {
        GUI.active_tab = 'pid_tuning';
    }

    function load_html() {
        GUI.load(path.join(__dirname, "pid_tuning.html"), Settings.processHtml(process_html));
    }

    function pid_and_rc_to_form() {

        // Fill in the data from FC.PIDs array
        var pidNames = FC.getPidNames();

        $('[data-pid-bank-position]').each(function () {
            var $this = $(this),
                bankPosition = $this.data('pid-bank-position');

            if (pidNames[bankPosition]) {
                $this.find('td:first').text(pidNames[bankPosition]);

                $this.find('input').each(function (index) {
                $(this).val(FC.PIDs[bankPosition][index]);
                });
            }
        });

        // Fill in data from FC.RC_tuning object
        $('#rate-roll').val(FC.RC_tuning.roll_rate);
        $('#rate-pitch').val(FC.RC_tuning.pitch_rate);
        $('#rate-yaw').val(FC.RC_tuning.yaw_rate);

        $('#rate-manual-roll').val(FC.RC_tuning.manual_roll_rate);
        $('#rate-manual-pitch').val(FC.RC_tuning.manual_pitch_rate);
        $('#rate-manual-yaw').val(FC.RC_tuning.manual_yaw_rate);

        $('#tpa').val(FC.RC_tuning.dynamic_THR_PID);
        $('#tpa-breakpoint').val(FC.RC_tuning.dynamic_THR_breakpoint);
    }

    function form_to_pid_and_rc() {

        $('[data-pid-bank-position]').each(function () {
            
            var $this = $(this),
                bankPosition = $this.data('pid-bank-position');

            if ($this.hasClass('is-hidden')) {
                return;
            }

            if (FC.PIDs[bankPosition]) {
                $this.find('input').each(function (index) {
                    FC.PIDs[bankPosition][index] = parseFloat($(this).val());
                });
            }
        });

        // catch FC.RC_tuning changes
        FC.RC_tuning.roll_rate = parseFloat($('#rate-roll').val());
        FC.RC_tuning.pitch_rate = parseFloat($('#rate-pitch').val());
        FC.RC_tuning.yaw_rate = parseFloat($('#rate-yaw').val());

        FC.RC_tuning.dynamic_THR_PID = parseInt($('#tpaRate').val());
        FC.RC_tuning.dynamic_THR_breakpoint = parseInt($('#tpaBreakpoint').val());

        FC.RC_tuning.manual_roll_rate = $('#rate-manual-roll').val();
        FC.RC_tuning.manual_pitch_rate = $('#rate-manual-pitch').val();
        FC.RC_tuning.manual_yaw_rate = $('#rate-manual-yaw').val();

        // Rate Dynamics
        FC.RATE_DYNAMICS.sensitivityCenter = parseInt($('#rate_dynamics_center_sensitivity').val());
        FC.RATE_DYNAMICS.sensitivityEnd = parseInt($('#rate_dynamics_end_sensitivity').val());
        FC.RATE_DYNAMICS.correctionCenter = parseInt($('#rate_dynamics_center_correction').val());
        FC.RATE_DYNAMICS.correctionEnd = parseInt($('#rate_dynamics_end_correction').val());
        FC.RATE_DYNAMICS.weightCenter = parseInt($('#rate_dynamics_center_weight').val());
        FC.RATE_DYNAMICS.weightEnd = parseInt($('#rate_dynamics_end_weight').val());

    }
    
    function getYawPidScale(input) {
        const normalized = (input - 100) * 0.01;
    
        return 1.0 + (normalized * 0.5); 
    }

    function scaleRange(x, srcMin, srcMax, destMin, destMax) {
        let a = (destMax - destMin) * (x - srcMin);
        let b = srcMax - srcMin;
        return ((a / b) + destMin);
    }

    function updatePreview() {

        let axisRatio = $('#ez_tune_axis_ratio').val() / 100;
        let response = $('#ez_tune_response').val();
        let damping = $('#ez_tune_damping').val();
        let stability = $('#ez_tune_stability').val();
        let aggressiveness = $('#ez_tune_aggressiveness').val();
        let rate = $('#ez_tune_rate').val();
        let expo = $('#ez_tune_expo').val();

        $('#preview-roll-p').html(Math.floor(EZ_TUNE_PID_RP_DEFAULT[0] * response / 100));
        $('#preview-roll-i').html(Math.floor(EZ_TUNE_PID_RP_DEFAULT[1] * stability / 100));
        $('#preview-roll-d').html(Math.floor(EZ_TUNE_PID_RP_DEFAULT[2] * damping / 100));
        $('#preview-roll-ff').html(Math.floor(EZ_TUNE_PID_RP_DEFAULT[3] * aggressiveness / 100));

        $('#preview-pitch-p').html(Math.floor(axisRatio * EZ_TUNE_PID_RP_DEFAULT[0] * response / 100));
        $('#preview-pitch-i').html(Math.floor(axisRatio * EZ_TUNE_PID_RP_DEFAULT[1] * stability / 100));
        $('#preview-pitch-d').html(Math.floor(axisRatio * EZ_TUNE_PID_RP_DEFAULT[2] * damping / 100));
        $('#preview-pitch-ff').html(Math.floor(axisRatio * EZ_TUNE_PID_RP_DEFAULT[3] * aggressiveness / 100));

        $('#preview-yaw-p').html(Math.floor(EZ_TUNE_PID_YAW_DEFAULT[0] * getYawPidScale(response)));
        $('#preview-yaw-i').html(Math.floor(EZ_TUNE_PID_YAW_DEFAULT[1] * getYawPidScale(stability)));
        $('#preview-yaw-d').html(Math.floor(EZ_TUNE_PID_YAW_DEFAULT[2] * getYawPidScale(damping)));
        $('#preview-yaw-ff').html(Math.floor(EZ_TUNE_PID_YAW_DEFAULT[3] * getYawPidScale(aggressiveness)));

        $('#preview-roll-rate').html(Math.floor(scaleRange(rate, 0, 200, 30, 90)) * 10 + " dps");
        $('#preview-pitch-rate').html(Math.floor(scaleRange(rate, 0, 200, 30, 90)) * 10 + " dps");
        $('#preview-yaw-rate').html((Math.floor(scaleRange(rate, 0, 200, 30, 90)) - 10) * 10 + " dps");

        $('#preview-roll-expo').html(Math.floor(scaleRange(expo, 0, 200, 40, 100)) + "%");
        $('#preview-pitch-expo').html(Math.floor(scaleRange(expo, 0, 200, 40, 100)) + "%");
        $('#preview-yaw-expo').html(Math.floor(scaleRange(expo, 0, 200, 40, 100)) + "%");

    }

    function process_html() {
        // translate to user-selected language
        i18n.localize();

        $('#ez_tune_enabled').on('change', function () {
            if ($(this).is(":checked")) {
                FC.EZ_TUNE.enabled = 1;
            } else {
                FC.EZ_TUNE.enabled = 0;
            }

            if (FC.EZ_TUNE.enabled) {
                $('.for-ez-tune').show();
                $('.not-for-ez-tune').hide();
            } else {
                $('.for-ez-tune').hide();
                $('.not-for-ez-tune').show();
            }
        });

        if (!FC.isMultirotor()) {
            $('#ez-tune-switch').hide();
        }

        $("#ez_tune_enabled").prop('checked', FC.EZ_TUNE.enabled).trigger('change');

        GUI.sliderize($('#ez_tune_filter_hz'), FC.EZ_TUNE.filterHz, 10, 300);
        GUI.sliderize($('#ez_tune_axis_ratio'), FC.EZ_TUNE.axisRatio, 25, 175);
        GUI.sliderize($('#ez_tune_response'), FC.EZ_TUNE.response, 0, 200);
        GUI.sliderize($('#ez_tune_damping'), FC.EZ_TUNE.damping, 0, 200);
        GUI.sliderize($('#ez_tune_stability'), FC.EZ_TUNE.stability, 0, 200);
        GUI.sliderize($('#ez_tune_aggressiveness'), FC.EZ_TUNE.aggressiveness, 0, 200);

        GUI.sliderize($('#ez_tune_rate'), FC.EZ_TUNE.rate, 0, 200);
        GUI.sliderize($('#ez_tune_expo'), FC.EZ_TUNE.expo, 0, 200);

        GUI.sliderize($('#ez_tune_snappiness'), FC.EZ_TUNE.snappiness, 0, 100);

        $('.ez-element').on('updated', function () {
            updatePreview();
        });

        updatePreview();

        tabs.init($('.tab-pid_tuning'));

        $('.action-resetPIDs').on('click', function() {

            if (confirm(i18n.getMessage('confirm_reset_pid'))) {
                MSP.send_message(MSPCodes.MSP_SET_RESET_CURR_PID, false, false, false);
                GUI.updateActivatedTab();
            }
        });

        $('.action-resetDefaults').on('click', function() {

            if (confirm(i18n.getMessage('confirm_select_defaults'))) {
                mspHelper.setSetting("applied_defaults", 0, function() { 
                    mspHelper.saveToEeprom( function () {
                        GUI.log(i18n.getMessage('configurationEepromSaved'));
    
                        GUI.tab_switch_cleanup(function () {
                            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function () {
                                GUI.log(i18n.getMessage('deviceRebooting'));
                                GUI.handleReconnect();
                            });
                        });
                    });
                });
            }
        });

        pid_and_rc_to_form();

        $(".pid-slider-row [name='value-slider']").on('input', function () {
            let val = $(this).val();
            let normalMax = parseInt($(this).data('normal-max'));

            if (val <= 800) {
                val = scaleRangeInt(val, 0, 800, 0, normalMax);
            } else {
                val = scaleRangeInt(val, 801, 1000, normalMax + 1, 255);
            }

            $(this).parent().find('input[name="value-input"]').val(val);
            FC.PIDs[$(this).parent().data('axis')][$(this).parent().data('bank')] = val;
        });

        $(".pid-slider-row [name='value-input']").on('change', function () {
            let val = $(this).val();
            let newVal;
            let normalMax = parseInt($(this).parent().find('input[name="value-slider"]').data('normal-max'));

            if (val <= 110) {
                newVal = scaleRangeInt(val, 0, normalMax, 0, 800);
            } else {
                newVal = scaleRangeInt(val, normalMax + 1, 255, 801, 1000);
            }

            $(this).parent().find('input[name="value-slider"]').val(newVal);
            FC.PIDs[$(this).parent().data('axis')][$(this).parent().data('bank')] = $(this).val();
        });

        let axis = 0;
        $('#pid-sliders').find('.pid-sliders-axis').each(function () {
        
            let $this = $(this);
            let bank = 0;

            $this.find('.pid-slider-row').each(function () {
                let $this = $(this);
                $this.data('axis', axis);
                $this.data('bank', bank);
                $this.find('input[name="value-input"]').val(FC.PIDs[axis][bank]).trigger('change');
                bank++;
            });
        
            axis++;
        });

        GUI.sliderize($('#rate_dynamics_center_sensitivity'), FC.RATE_DYNAMICS.sensitivityCenter, 25, 175);
        GUI.sliderize($('#rate_dynamics_end_sensitivity'), FC.RATE_DYNAMICS.sensitivityEnd, 25, 175);

        GUI.sliderize($('#rate_dynamics_center_correction'), FC.RATE_DYNAMICS.correctionCenter, 10, 95);
        GUI.sliderize($('#rate_dynamics_end_correction'), FC.RATE_DYNAMICS.correctionEnd, 10, 95);

        GUI.sliderize($('#rate_dynamics_center_weight'), FC.RATE_DYNAMICS.weightCenter, 0, 95);
        GUI.sliderize($('#rate_dynamics_end_weight'), FC.RATE_DYNAMICS.weightEnd, 0, 95);

        if (!FC.isRpyFfComponentUsed()) {
            $('.rpy_ff').prop('disabled', 'disabled');
        }
        if (!FC.isRpyDComponentUsed()) {
            $('.rpy_d').prop('disabled', 'disabled');
        }

        GUI.simpleBind();

        // UI Hooks

        $('a.refresh').on('click', function () {
            $("#content-watermark").remove();
            $(".tab-pid_tuning").remove();

            GUI.tab_switch_cleanup(function () {
                GUI.log(i18n.getMessage('pidTuningDataRefreshed'));
                TABS.pid_tuning.initialize();
            });
        });

        // update == save.
        $('a.update').on('click', function () {
            form_to_pid_and_rc();

            if ($("#ez_tune_enabled").is(":checked")) {
                FC.EZ_TUNE.enabled = 1;
            } else {
                FC.EZ_TUNE.enabled = 0;
            }

            FC.EZ_TUNE.filterHz = $('#ez_tune_filter_hz').val();
            FC.EZ_TUNE.axisRatio = $('#ez_tune_axis_ratio').val();
            FC.EZ_TUNE.response = $('#ez_tune_response').val();
            FC.EZ_TUNE.damping = $('#ez_tune_damping').val();
            FC.EZ_TUNE.stability = $('#ez_tune_stability').val();
            FC.EZ_TUNE.aggressiveness = $('#ez_tune_aggressiveness').val();
            FC.EZ_TUNE.rate = $('#ez_tune_rate').val();
            FC.EZ_TUNE.expo = $('#ez_tune_expo').val();
            FC.EZ_TUNE.snappiness = $('#ez_tune_snappiness').val();

            function send_rc_tuning_changes() {
                MSP.send_message(MSPCodes.MSPV2_INAV_SET_RATE_PROFILE, mspHelper.crunch(MSPCodes.MSPV2_INAV_SET_RATE_PROFILE), false, saveRateDynamics);
            }

            function saveRateDynamics() {
                mspHelper.saveRateDynamics(saveEzTune);
            }

            function saveEzTune() {
                mspHelper.saveEzTune(saveSettings)
            }

            function saveSettings() {
                Settings.saveInputs(save_to_eeprom);
            }

            function save_to_eeprom() {
                MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, function () {
                    GUI.log(i18n.getMessage('pidTuningEepromSaved'));
                });
            }

            mspHelper.savePidData(send_rc_tuning_changes); 
        });

        $('#gyro_use_dyn_lpf').on('change', function () {

            if ($(this).is(':checked')) {
                $('.for_dynamic_gyro_lpf').show();
                $('.for_static_gyro_lpf').hide();
            } else {
                $('.for_dynamic_gyro_lpf').hide();
                $('.for_static_gyro_lpf').show();
            }

        }).trigger('change');

        GUI.content_ready(callback);
    }
};

TABS.pid_tuning.cleanup = function (callback) {
    if (callback) {
        callback();
    }
};
