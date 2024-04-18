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

    var loadChain = [
        mspHelper.loadPidNames,
        mspHelper.loadPidData,
        mspHelper.loadINAVPidConfig,
        mspHelper.loadPidAdvanced,
        mspHelper.loadFilterConfig,
        mspHelper.loadFeatures,
        mspHelper.loadRateDynamics,
        mspHelper.loadEzTune
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

        FC.RC_tuning.dynamic_THR_PID = parseInt($('#tpa').val());
        FC.RC_tuning.dynamic_THR_breakpoint = parseInt($('#tpa-breakpoint').val());

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
    function hideUnusedPids(sensors_detected) {
      $('.tab-pid_tuning table.pid_tuning').hide();
      $('#pid_main').show();

      if (SerialBackend.have_sensor(sensors_detected, 'acc')) {
        $('#pid_accel').show();
      }
      if (SerialBackend.have_sensor(sensors_detected, 'baro')) {
        $('#pid_baro').show();
      }
      if (SerialBackend.have_sensor(sensors_detected, 'mag')) {
        $('#pid_mag').show();
      }
      if (BitHelper.bit_check(FC.FEATURES, 7)) {
        $('#pid_gps').show();
      }
      if (SerialBackend.have_sensor(sensors_detected, 'sonar')) {
        $('#pid_baro').show();
      }
    }
    function process_html() {
        // translate to user-selected language

        if (FC.EZ_TUNE.enabled) {
            $("#tuning-wrapper").remove();
            $("#tuning-footer").remove();
            $('#note-wrapper').show();
        } else {
            $("#note-wrapper").remove();
        }

       i18n.localize();;

        tabs.init($('.tab-pid_tuning'));
        features.updateUI($('.tab-pid_tuning'), FC.FEATURES);

        hideUnusedPids(FC.CONFIG.activeSensors);

        $('#showAllPids').on('click', function(){
          if($(this).text() == "Show all PIDs") {
            $('.tab-pid_tuning table.pid_tuning').show();
            $(this).text('Hide unused PIDs');
            $('.show').addClass('unusedPIDsHidden');
          } else {
            hideUnusedPids(FC.CONFIG.activeSensors);
            $(this).text('Show all PIDs');
            $('.show').removeClass('unusedPIDsHidden');
          }
        });

        $('#resetPIDs').on('click', function() {

            if (confirm(i18n.getMessage('confirm_reset_pid'))) {
                MSP.send_message(MSPCodes.MSP_SET_RESET_CURR_PID, false, false, false);
                GUI.updateActivatedTab();
            }
        });

        $('#resetDefaults').on('click', function() {

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

        let $theOtherPids = $('#the-other-pids');
        let $showAdvancedPids = $('#show-advanced-pids');
        
        if (store.get('showOtherPids', false) ) {
            $theOtherPids.removeClass("is-hidden");
            $showAdvancedPids.prop('checked', true);
        } else {
            $theOtherPids.addClass("is-hidden");
            $showAdvancedPids.prop('checked', false);
        }
        $showAdvancedPids.trigger('change');
        

        $showAdvancedPids.on('change', function() {
            if ($showAdvancedPids.is(':checked')) {
                $theOtherPids.removeClass("is-hidden");
                store.set('showOtherPids', true);
            } else {
                $theOtherPids.addClass("is-hidden");
                store.set('showOtherPids', false);
            }
        });

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

            function send_rc_tuning_changes() {
                MSP.send_message(MSPCodes.MSPV2_INAV_SET_RATE_PROFILE, mspHelper.crunch(MSPCodes.MSPV2_INAV_SET_RATE_PROFILE), false, saveINAVPidConfig);
            }

            function saveINAVPidConfig() {
                MSP.send_message(MSPCodes.MSP_SET_INAV_PID, mspHelper.crunch(MSPCodes.MSP_SET_INAV_PID), false, savePidAdvanced);
            }

            function savePidAdvanced() {
                MSP.send_message(MSPCodes.MSP_SET_PID_ADVANCED, mspHelper.crunch(MSPCodes.MSP_SET_PID_ADVANCED), false, saveFilterConfig);
            }

            function saveFilterConfig() {
                MSP.send_message(MSPCodes.MSP_SET_FILTER_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_FILTER_CONFIG), false, saveRateDynamics);
            }

            function saveRateDynamics() {
                mspHelper.saveRateDynamics(saveSettings);
            }

            function saveSettings() {
                Settings.saveInputs().then(save_to_eeprom);
            }

            function save_to_eeprom() {
                MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, function () {
                    GUI.log(i18n.getMessage('pidTuningEepromSaved'));
                });
            }

            features.reset();
            features.fromUI($('.tab-pid_tuning'));
            features.execute(function () {
                mspHelper.savePidData(send_rc_tuning_changes);    
            });
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
