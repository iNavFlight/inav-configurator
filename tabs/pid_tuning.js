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
        mspHelper.loadFeatures
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
      if (bit_check(FEATURES, 7)) {
        $('#pid_gps').show();
      }
      if (have_sensor(sensors_detected, 'sonar')) {
        $('#pid_baro').show();
      }
    }
    function process_html() {
        // translate to user-selected language
        localize();

        helper.tabs.init($('.tab-pid_tuning'));
        helper.features.updateUI($('.tab-pid_tuning'), FEATURES);

        hideUnusedPids(CONFIG.activeSensors);

        $('#showAllPids').on('click', function(){
          if($(this).text() == "Show all PIDs") {
            $('.tab-pid_tuning table.pid_tuning').show();
            $(this).text('Hide unused PIDs');
            $('.show').addClass('unusedPIDsHidden');
          } else {
            hideUnusedPids(CONFIG.activeSensors);
            $(this).text('Show all PIDs');
            $('.show').removeClass('unusedPIDsHidden');
          }
        });

        $('#resetPIDs').on('click', function() {

            if (confirm(chrome.i18n.getMessage('confirm_reset_pid'))) {
                MSP.send_message(MSPCodes.MSP_SET_RESET_CURR_PID, false, false, false);
                updateActivatedTab();
            }
        });

        $('#resetDefaults').on('click', function() {

            if (confirm(chrome.i18n.getMessage('confirm_select_defaults'))) {
                mspHelper.setSetting("applied_defaults", 0, function() { 
                    mspHelper.saveToEeprom( function () {
                        GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));
    
                        GUI.tab_switch_cleanup(function () {
                            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function () {
                                GUI.log(chrome.i18n.getMessage('deviceRebooting'));
                                GUI.handleReconnect();
                            });
                        });
                    });
                });
            }
        });

        pid_and_rc_to_form();

        let $magHoldYawRate                 = $("#magHoldYawRate");

        $magHoldYawRate.val(INAV_PID_CONFIG.magHoldRateLimit);

        $magHoldYawRate.change(function () {
            INAV_PID_CONFIG.magHoldRateLimit = parseInt($magHoldYawRate.val(), 10);
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
            $("#content-watermark").remove();
            $(".tab-pid_tuning").remove();

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
