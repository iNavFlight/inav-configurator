/*global chrome*/
'use strict';

TABS.pid_tuning = {

};

TABS.pid_tuning.initialize = function (callback) {

    var loadChainer = new MSPChainerClass();

    var loadChain = [
        mspHelper.loadPidNames,
        mspHelper.loadPidData,
        mspHelper.loadINAVPidConfig,
        mspHelper.loadPidAdvanced,
        mspHelper.loadFilterConfig
    ];
    loadChain.push(mspHelper.loadRateProfileData);

    loadChainer.setChain(loadChain);
    loadChainer.setExitPoint(load_html);
    loadChainer.execute();

    if (GUI.active_tab != 'pid_tuning') {
        GUI.active_tab = 'pid_tuning';
        googleAnalytics.sendAppView('PID Tuning');
    }

    function load_html() {
        $('#content').load("./tabs/pid_tuning.html", Settings.processHtml(process_html));
    }

    function pid_and_rc_to_form() {

        // Fill in the data from PIDs array
        var pidNames = FC.getPidNames();

        $('[data-pid-bank-position]').each(function () {
            var $this = $(this),
                bankPosition = $this.data('pid-bank-position');

            $this.find('td:first').text(pidNames[bankPosition]);

            $this.find('input').each(function (index) {
               $(this).val(PIDs[bankPosition][index]);
            });
        });

        // Fill in data from RC_tuning object
        $('.rate-tpa input[name="roll-pitch"]').val(RC_tuning.roll_pitch_rate.toFixed(2));

        $('.rate-tpa input[name="roll"]').val(RC_tuning.roll_rate);
        $('.rate-tpa input[name="pitch"]').val(RC_tuning.pitch_rate);
        $('.rate-tpa input[name="yaw"]').val(RC_tuning.yaw_rate);

        $('.rate-tpa input[name="manual_roll"]').val(RC_tuning.manual_roll_rate);
        $('.rate-tpa input[name="manual_pitch"]').val(RC_tuning.manual_pitch_rate);
        $('.rate-tpa input[name="manual_yaw"]').val(RC_tuning.manual_yaw_rate);

        $('#tpa').val(RC_tuning.dynamic_THR_PID);
        $('#tpa-breakpoint').val(RC_tuning.dynamic_THR_breakpoint);
    }

    function form_to_pid_and_rc() {

        $('[data-pid-bank-position]').each(function () {
            var $this = $(this),
                bankPosition = $this.data('pid-bank-position');

            $this.find('input').each(function (index) {
                PIDs[bankPosition][index] = parseFloat($(this).val());
            })
        });

        // catch RC_tuning changes
        RC_tuning.roll_pitch_rate = parseFloat($('.rate-tpa input[name="roll-pitch"]').val());
        RC_tuning.roll_rate = parseFloat($('.rate-tpa input[name="roll"]:visible').val());
        RC_tuning.pitch_rate = parseFloat($('.rate-tpa input[name="pitch"]:visible').val());
        RC_tuning.yaw_rate = parseFloat($('.rate-tpa input[name="yaw"]:visible').val());
        RC_tuning.dynamic_THR_PID = parseInt($('#tpa').val());
        RC_tuning.dynamic_THR_breakpoint = parseInt($('#tpa-breakpoint').val());

        RC_tuning.manual_roll_rate = $('.rate-tpa input[name="manual_roll"]:visible').val();
        RC_tuning.manual_pitch_rate = $('.rate-tpa input[name="manual_pitch"]:visible').val();
        RC_tuning.manual_yaw_rate = $('.rate-tpa input[name="manual_yaw"]:visible').val();
    }
    function hideUnusedPids(sensors_detected) {
      $('.tab-pid_tuning table.pid_tuning').hide();
      $('#pid_main').show();

      if (have_sensor(sensors_detected, 'acc')) {
        $('#pid_accel').show();
      }
      if (have_sensor(sensors_detected, 'baro')) {
        $('#pid_baro').show();
      }
      if (have_sensor(sensors_detected, 'mag')) {
        $('#pid_mag').show();
      }
      if (bit_check(BF_CONFIG.features, 7)) {   //This will need to be reworked to remove BF_CONFIG reference eventually
        $('#pid_gps').show();
      }
      if (have_sensor(sensors_detected, 'sonar')) {
        $('#pid_baro').show();
      }
    }
    function process_html() {
        // translate to user-selected language
        localize();

        hideUnusedPids(CONFIG.activeSensors);

        $('#showAllPids').on('click', function(){
          if($(this).text() == "Show all PIDs") {
            $('.tab-pid_tuning table.pid_tuning').show();
            $(this).text('Hide unused PIDs');
          } else {
            hideUnusedPids(CONFIG.activeSensors);
            $(this).text('Show all PIDs');
          }
        });

        $('#resetPIDs').on('click', function(){
            MSP.send_message(MSPCodes.MSP_SET_RESET_CURR_PID, false, false, false);
	        updateActivatedTab();
        });

        pid_and_rc_to_form();

        var $magHoldYawRate                 = $("#magHoldYawRate"),
            $yawJumpPreventionLimit         = $('#yawJumpPreventionLimit'),
            $yawPLimit                      = $('#yawPLimit'),
            $gyroSoftLpfHz                  = $('#gyroSoftLpfHz'),
            $accSoftLpfHz                   = $('#accSoftLpfHz'),
            $dtermLpfHz                     = $('#dtermLpfHz'),
            $yawLpfHz                       = $('#yawLpfHz'),
            $rollPitchItermIgnoreRate       = $('#rollPitchItermIgnoreRate'),
            $yawItermIgnoreRate             = $('#yawItermIgnoreRate'),
            $axisAccelerationLimitRollPitch = $('#axisAccelerationLimitRollPitch'),
            $axisAccelerationLimitYaw       = $('#axisAccelerationLimitYaw');

        $magHoldYawRate.val(INAV_PID_CONFIG.magHoldRateLimit);
        $yawJumpPreventionLimit.val(INAV_PID_CONFIG.yawJumpPreventionLimit);
        $yawPLimit.val(PID_ADVANCED.yawPLimit);
        $gyroSoftLpfHz.val(FILTER_CONFIG.gyroSoftLpfHz);
        $accSoftLpfHz.val(INAV_PID_CONFIG.accSoftLpfHz);
        $dtermLpfHz.val(FILTER_CONFIG.dtermLpfHz);
        $yawLpfHz.val(FILTER_CONFIG.yawLpfHz);
        $rollPitchItermIgnoreRate.val(PID_ADVANCED.rollPitchItermIgnoreRate);
        $yawItermIgnoreRate.val(PID_ADVANCED.yawItermIgnoreRate);
        $axisAccelerationLimitRollPitch.val(PID_ADVANCED.axisAccelerationLimitRollPitch * 10);
        $axisAccelerationLimitYaw.val(PID_ADVANCED.axisAccelerationLimitYaw * 10);

        $magHoldYawRate.change(function () {
            INAV_PID_CONFIG.magHoldRateLimit = parseInt($magHoldYawRate.val(), 10);
        });

        $yawJumpPreventionLimit.change(function () {
            INAV_PID_CONFIG.yawJumpPreventionLimit = parseInt($yawJumpPreventionLimit.val(), 10);
        });

        $yawPLimit.change(function () {
            PID_ADVANCED.yawPLimit = parseInt($yawPLimit.val(), 10);
        });

        $gyroSoftLpfHz.change(function () {
            FILTER_CONFIG.gyroSoftLpfHz = parseInt($gyroSoftLpfHz.val(), 10);
        });

        $accSoftLpfHz.change(function () {
            INAV_PID_CONFIG.accSoftLpfHz = parseInt($accSoftLpfHz.val(), 10);
        });

        $dtermLpfHz.change(function () {
            FILTER_CONFIG.dtermLpfHz = parseInt($dtermLpfHz.val(), 10);
        });

        $yawLpfHz.change(function () {
            FILTER_CONFIG.yawLpfHz = parseInt($yawLpfHz.val(), 10);
        });

        $rollPitchItermIgnoreRate.change(function () {
            PID_ADVANCED.rollPitchItermIgnoreRate = parseInt($rollPitchItermIgnoreRate.val(), 10);
        });

        $yawItermIgnoreRate.change(function () {
            PID_ADVANCED.yawItermIgnoreRate = parseInt($yawItermIgnoreRate.val(), 10);
        });

        $axisAccelerationLimitRollPitch.change(function () {
            PID_ADVANCED.axisAccelerationLimitRollPitch = Math.round(parseInt($axisAccelerationLimitRollPitch.val(), 10) / 10);
        });

        $axisAccelerationLimitYaw.change(function () {
            PID_ADVANCED.axisAccelerationLimitYaw = Math.round(parseInt($axisAccelerationLimitYaw.val(), 10) / 10);
        });

        if (semver.gte(CONFIG.flightControllerVersion, "2.0.0")) {
            $('.deprecated-v2_0').hide();
        } else {
            $('.deprecated-v2_0').show();
        }

        if (semver.gte(CONFIG.flightControllerVersion, "2.1.0")) {
            $('.requires-v2_1').show();
        } else {
            $('.requires-v2_1').hide();
        }

        if (semver.gte(CONFIG.flightControllerVersion, "2.2.0")) {
            $('.requires-v2_2').show();
        } else {
            $('.requires-v2_2').hide();
        }

        if (semver.lt(CONFIG.flightControllerVersion, "2.2.0")) {
            $('[name=ff]').prop('disabled', 'disabled');
        }

        if (!FC.isRpyFfComponentUsed()) {
            $('.rpy_ff').prop('disabled', 'disabled');
        }
        if (!FC.isRpyDComponentUsed()) {
            $('.rpy_d').prop('disabled', 'disabled');
        }

        GUI.simpleBind();

        // UI Hooks

        $('a.refresh').click(function () {
            GUI.tab_switch_cleanup(function () {
                GUI.log(chrome.i18n.getMessage('pidTuningDataRefreshed'));
                TABS.pid_tuning.initialize();
            });
        });

        // update == save.
        $('a.update').click(function () {
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
                MSP.send_message(MSPCodes.MSP_SET_FILTER_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_FILTER_CONFIG), false, saveSettings);
            }

            function saveSettings() {
                Settings.saveInputs().then(save_to_eeprom);
            }

            function save_to_eeprom() {
                MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, function () {
                    GUI.log(chrome.i18n.getMessage('pidTuningEepromSaved'));
                });
            }

            mspHelper.savePidData(send_rc_tuning_changes);
        });

        GUI.content_ready(callback);
    }
};

TABS.pid_tuning.cleanup = function (callback) {
    if (callback) {
        callback();
    }
};
