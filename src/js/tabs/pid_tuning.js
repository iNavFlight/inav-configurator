/*global chrome,helper,mspHelper*/
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
        mspHelper.loadFilterConfig,
        mspHelper.loadBfConfig
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
        GUI.load("./tabs/pid_tuning.html", Settings.processHtml(process_html));
    }

    function pid_and_rc_to_form() {

        // Fill in the data from PIDs array
        var pidNames = FC.getPidNames();

        $('[data-pid-bank-position]').each(function () {
            var $this = $(this),
                bankPosition = $this.data('pid-bank-position');

            if (pidNames[bankPosition]) {
                $this.find('td:first').text(pidNames[bankPosition]);

                $this.find('input').each(function (index) {
                $(this).val(PIDs[bankPosition][index]);
                });
            }
        });

        // Fill in data from RC_tuning object
        $('#rate-roll').val(RC_tuning.roll_rate);
        $('#rate-pitch').val(RC_tuning.pitch_rate);
        $('#rate-yaw').val(RC_tuning.yaw_rate);

        $('#rate-manual-roll').val(RC_tuning.manual_roll_rate);
        $('#rate-manual-pitch').val(RC_tuning.manual_pitch_rate);
        $('#rate-manual-yaw').val(RC_tuning.manual_yaw_rate);

        $('#tpa').val(RC_tuning.dynamic_THR_PID);
        $('#tpa-breakpoint').val(RC_tuning.dynamic_THR_breakpoint);
    }

    function form_to_pid_and_rc() {

        $('[data-pid-bank-position]').each(function () {
            var $this = $(this),
                bankPosition = $this.data('pid-bank-position');

            if (PIDs[bankPosition]) {
                $this.find('input').each(function (index) {
                    PIDs[bankPosition][index] = parseFloat($(this).val());
                });
            }
        });

        // catch RC_tuning changes
        RC_tuning.roll_rate = parseFloat($('#rate-roll').val());
        RC_tuning.pitch_rate = parseFloat($('#rate-pitch').val());
        RC_tuning.yaw_rate = parseFloat($('#rate-yaw').val());

        RC_tuning.dynamic_THR_PID = parseInt($('#tpa').val());
        RC_tuning.dynamic_THR_breakpoint = parseInt($('#tpa-breakpoint').val());

        RC_tuning.manual_roll_rate = $('#rate-manual-roll').val();
        RC_tuning.manual_pitch_rate = $('#rate-manual-pitch').val();
        RC_tuning.manual_yaw_rate = $('#rate-manual-yaw').val();
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

        if (FC.isCdComponentUsed()) {
            $('th.feedforward').html(chrome.i18n.getMessage('pidTuningControlDerivative'));
            $('th.feedforward').attr('title', chrome.i18n.getMessage('pidTuningControlDerivative'));
        }

        if (semver.gte(CONFIG.flightControllerVersion, "2.4.0")) {
            $('.requires-v2_4').show();
        } else {
            $('.requires-v2_4').hide();
        }

        if (semver.gte(CONFIG.flightControllerVersion, "2.5.0")) {
            $('.requires-v2_5').show();
            $('.hides-v2_5').hide();
        } else {
            $('.requires-v2_5').hide();
            $('.hides-v2_5').show();
        }

        if (semver.gte(CONFIG.flightControllerVersion, "2.6.0")) {
            $('.requires-v2_6').show();
            $('.hides-v2_6').hide();
        } else {
            $('.requires-v2_6').hide();
            $('.hides-v2_6').show();
        }

        helper.tabs.init($('.tab-pid_tuning'));
        helper.features.updateUI($('.tab-pid_tuning'), BF_CONFIG.features);

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
            $gyroSoftLpfHz                  = $('#gyroSoftLpfHz'),
            $accSoftLpfHz                   = $('#accSoftLpfHz'),
            $dtermLpfHz                     = $('#dtermLpfHz'),
            $yawLpfHz                       = $('#yawLpfHz');

        $magHoldYawRate.val(INAV_PID_CONFIG.magHoldRateLimit);
        $gyroSoftLpfHz.val(FILTER_CONFIG.gyroSoftLpfHz);
        $accSoftLpfHz.val(INAV_PID_CONFIG.accSoftLpfHz);
        $dtermLpfHz.val(FILTER_CONFIG.dtermLpfHz);
        $yawLpfHz.val(FILTER_CONFIG.yawLpfHz);

        $magHoldYawRate.change(function () {
            INAV_PID_CONFIG.magHoldRateLimit = parseInt($magHoldYawRate.val(), 10);
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

            helper.features.reset();
            helper.features.fromUI($('.tab-pid_tuning'));
            helper.features.execute(function () {
                mspHelper.savePidData(send_rc_tuning_changes);    
            });
        });

        GUI.content_ready(callback);
    }
};

TABS.pid_tuning.cleanup = function (callback) {
    if (callback) {
        callback();
    }
};
