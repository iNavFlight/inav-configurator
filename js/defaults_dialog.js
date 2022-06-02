/*global mspHelper,$,GUI,MSP,chrome*/
'use strict';

var helper = helper || {};
var savingDefaultsModal;

helper.defaultsDialog = (function () {

    let publicScope = {},
        privateScope = {};

    let $container;

    let data = [{
        "title": 'Mini Quad with 3"-7" propellers',
        "id": 2,
        "notRecommended": false,
        "reboot": true,
        "mixerToApply": 3,
        "settings": [
            {
                key: "model_preview_type",
                value: 3, 
                allow_reset: true
            },
            /*
            System
            */
            {
                key: "gyro_hardware_lpf",
                value: "256HZ", 
                allow_reset: true
            },
            {
                key: "looptime",
                value: 500, 
                allow_reset: true
            },
            {
                key: "motor_pwm_protocol",
                value: "DSHOT300", 
                allow_reset: false
            },
            /*
            Filtering
            */
            {
                key: "gyro_main_lpf_hz",
                value: 110, 
                allow_reset: true
            },
            {
                key: "gyro_main_lpf_type",
                value: "PT1", 
                allow_reset: true
            },
            {
                key: "dterm_lpf_hz",
                value: 110, 
                allow_reset: true
            },
            {
                key: "dterm_lpf_type",
                value: "PT3", 
                allow_reset: true
            },
            {
                key: "dterm_lpf2_hz",
                value: 0, 
                allow_reset: true
            },
            {
                key: "dterm_lpf2_type",
                value: "PT1", 
                allow_reset: true
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON", 
                allow_reset: true
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 250, 
                allow_reset: true
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 120, 
                allow_reset: true
            },
            {
                key: "setpoint_kalman_enabled",
                value: "ON", 
                allow_reset: true
            },
            {
                key: "setpoint_kalman_q",
                value: 200, 
                allow_reset: true
            },
            {
                key: "smith_predictor_delay",   // Enable Smith Predictor 
                value: 1.5, 
                allow_reset: true
            },   
            /*
            Mechanics
            */
            {
                key: "airmode_type",
                value: "THROTTLE_THRESHOLD", 
                allow_reset: true
            },
            {
                key: "airmode_throttle_threshold",
                value: 1150, 
                allow_reset: true
            },
            {
                key: "mc_iterm_relax",
                value: "RP", 
                allow_reset: true
            },
            {
                key: "d_boost_min",
                value: 0.8, 
                allow_reset: true
            },
            {
                key: "d_boost_max",
                value: 1.2, 
                allow_reset: true
            },
            {
                key: "antigravity_gain",
                value: 2, 
                allow_reset: true
            },
            {
                key: "antigravity_accelerator",
                value: 5, 
                allow_reset: true
            },
            /*
            Rates
            */
            {
                key: "rc_yaw_expo",
                value: 75, 
                allow_reset: true
            },
            {
                key: "rc_expo",
                value: 75, 
                allow_reset: true
            },
            {
                key: "roll_rate",
                value: 70, 
                allow_reset: true
            },
            {
                key: "pitch_rate",
                value: 70, 
                allow_reset: true
            },
            {
                key: "yaw_rate",
                value: 60, 
                allow_reset: true
            },
            /*
            PIDs
            */
            {
                key: "mc_p_pitch",
                value: 44, 
                allow_reset: true,
                pid_axis: 1, 
                pid_bank: 0
            },
            {
                key: "mc_i_pitch",
                value: 75, 
                allow_reset: true,
                pid_axis: 1, 
                pid_bank: 1
            },
            {
                key: "mc_d_pitch",
                value: 25, 
                allow_reset: true,
                pid_axis: 1, 
                pid_bank: 2
            },
            {
                key: "mc_p_roll",
                value: 40, 
                allow_reset: true,
                pid_axis: 0, 
                pid_bank: 0
            },
            {
                key: "mc_i_roll",
                value: 60, 
                allow_reset: true,
                pid_axis: 0, 
                pid_bank: 1
            },
            {
                key: "mc_d_roll",
                value: 23, 
                allow_reset: true,
                pid_axis: 0, 
                pid_bank: 2
            },
            {
                key: "mc_p_yaw",
                value: 35, 
                allow_reset: true,
                pid_axis: 2, 
                pid_bank: 0
            },
            {
                key: "mc_i_yaw",
                value: 80, 
                allow_reset: true,
                pid_axis: 2, 
                pid_bank: 1
            },
            /*
             * TPA
             */
            {
                key: "tpa_rate",
                value: 20, 
                allow_reset: true
            },
            {
                key: "tpa_breakpoint",
                value: 1200, 
                allow_reset: true
            },
            {
                key: "platform_type",
                value: "MULTIROTOR", 
                allow_reset: false
            },
            {
                key: "applied_defaults",
                value: 2, 
                allow_reset: false
            },
            {
                key: "failsafe_procedure",
                value: "DROP", 
                allow_reset: false
            }
        ]
    },
    {
        "title": 'Airplane with a Tail',
        "notRecommended": false,
        "id": 3,
        "reboot": true,
        "mixerToApply": 14,
        "settings": [
            {
                key: "model_preview_type",
                value: 14, 
                allow_reset: false
            },
            {
                key: "platform_type",
                value: "AIRPLANE", 
                allow_reset: false
            },
            {
                key: "applied_defaults",
                value: 3, 
                allow_reset: false
            },
            {
                key: "gyro_hardware_lpf",
                value: "256HZ", 
                allow_reset: true
            },
            {
                key: "gyro_main_lpf_hz",
                value: 25, 
                allow_reset: true
            },
            {
                key: "dterm_lpf_hz",
                value: 10, 
                allow_reset: true
            },
            {
                key: "d_boost_min",
                value: 1, 
                allow_reset: true
            },
            {
                key: "d_boost_max",
                value: 1, 
                allow_reset: true
            },
            {
                key: "gyro_main_lpf_type",
                value: "BIQUAD", 
                allow_reset: true
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON", 
                allow_reset: true
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 250, 
                allow_reset: true
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 30, 
                allow_reset: true
            },
            {
                key: "motor_pwm_protocol",
                value: "STANDARD", 
                allow_reset: false
            },
            {
                key: "throttle_idle",
                value: 5.0, 
                allow_reset: false
            },
            {
                key: "rc_yaw_expo",
                value: 30, 
                allow_reset: false
            },
            {
                key: "rc_expo",
                value: 30, 
                allow_reset: false
            },
            {
                key: "roll_rate",
                value: 18, 
                allow_reset: true
            },
            {
                key: "pitch_rate",
                value: 9, 
                allow_reset: true
            },
            {
                key: "yaw_rate",
                value: 3, 
                allow_reset: true
            },
            {
                key: "nav_fw_pos_z_p",
                value: 15, 
                allow_reset: true,
                pid_axis: 3, 
                pid_bank: 0
            },
            {
                key: "nav_fw_pos_z_d",
                value: 5, 
                allow_reset: true,
                pid_axis: 3, 
                pid_bank: 2
            },
            {
                key: "nav_fw_pos_xy_p",
                value: 60, 
                allow_reset: true,
                pid_axis: 8, 
                pid_bank: 0
            },
            {
                key: "fw_turn_assist_pitch_gain",
                value: 0.5, 
                allow_reset: true
            },
            {
                key: "max_angle_inclination_rll",
                value: 450, 
                allow_reset: true
            },
            {
                key: "nav_fw_bank_angle",
                value: 35, 
                allow_reset: true
            },
            {
                key: "fw_p_pitch",
                value: 15, 
                allow_reset: true,
                pid_axis: 1, 
                pid_bank: 0
            },
            {
                key: "fw_i_pitch",
                value: 5, 
                allow_reset: true,
                pid_axis: 1, 
                pid_bank: 1
            },
            {
                key: "fw_d_pitch",
                value: 5, 
                allow_reset: true,
                pid_axis: 1, 
                pid_bank: 2
            },
            {
                key: "fw_ff_pitch",
                value: 80, 
                allow_reset: true,
                pid_axis: 1, 
                pid_bank: 3
            },
            {
                key: "fw_p_roll",
                value: 15, 
                allow_reset: true,
                pid_axis: 0, 
                pid_bank: 0
            },
            {
                key: "fw_i_roll",
                value: 3, 
                allow_reset: true,
                pid_axis: 0, 
                pid_bank: 1
            },
            {
                key: "fw_d_roll",
                value: 7, 
                allow_reset: true,
                pid_axis: 0, 
                pid_bank: 2
            },
            {
                key: "fw_ff_roll",
                value: 50, 
                allow_reset: true,
                pid_axis: 0, 
                pid_bank: 3
            },
            {
                key: "fw_p_yaw",
                value: 20, 
                allow_reset: true,
                pid_axis: 2, 
                pid_bank: 0
            },
            {
                key: "fw_i_yaw",
                value: 0, 
                allow_reset: true,
                pid_axis: 2, 
                pid_bank: 1
            },
            {
                key: "fw_d_yaw",
                value: 0, 
                allow_reset: true,
                pid_axis: 2, 
                pid_bank: 2
            },
            {
                key: "fw_ff_yaw",
                value: 100, 
                allow_reset: true,
                pid_axis: 2, 
                pid_bank: 3
            },
            {
                key: "imu_acc_ignore_rate",
                value: 9, 
                allow_reset: true
            },
            {
                key: "imu_acc_ignore_slope",
                value: 5, 
                allow_reset: true
            },
            {
                key: "airmode_type",
                value: "STICK_CENTER_ONCE", 
                allow_reset: true
            },
            {
                key: "small_angle",
                value: 180, 
                allow_reset: true
            },
            {
                key: "nav_fw_control_smoothness",
                value: 2, 
                allow_reset: true
            },
            {
                key: "nav_rth_allow_landing",
                value: "FS_ONLY", 
                allow_reset: false
            },
            {
                key: "nav_rth_altitude",
                value: 5000, 
                allow_reset: false
            },
            {
                key: "failsafe_mission",
                value: "ON", 
                allow_reset: false
            },
            {
                key: "nav_wp_radius",
                value: 5000, 
                allow_reset: false
            },
        ],
        "features": [
            {
                bit: 4, // Enable MOTOR_STOP
                state: true
            }
        ]
    },
    {
        "title": 'Airplane without a Tail (Wing, Delta, etc)',
        "notRecommended": false,
        "id": 4,
        "reboot": true,
        "mixerToApply": 8,
        "settings": [
            {
                key: "model_preview_type",
                value: 8, 
                allow_reset: false
            },
            {
                key: "platform_type",
                value: "AIRPLANE", 
                allow_reset: false
            },
            {
                key: "applied_defaults",
                value: 4, 
                allow_reset: false
            },
            {
                key: "gyro_hardware_lpf",
                value: "256HZ", 
                allow_reset: true
            },
            {
                key: "gyro_main_lpf_hz",
                value: 25, 
                allow_reset: true
            },
            {
                key: "dterm_lpf_hz",
                value: 10, 
                allow_reset: true
            },
            {
                key: "d_boost_min",
                value: 1, 
                allow_reset: true
            },
            {
                key: "d_boost_max",
                value: 1, 
                allow_reset: true
            },
            {
                key: "gyro_main_lpf_type",
                value: "BIQUAD", 
                allow_reset: true
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON", 
                allow_reset: true
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 250, 
                allow_reset: true
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 30, 
                allow_reset: true
            },
            {
                key: "motor_pwm_protocol",
                value: "STANDARD", 
                allow_reset: false
            },
            {
                key: "throttle_idle",
                value: 5.0, 
                allow_reset: false
            },
            {
                key: "rc_yaw_expo",
                value: 30, 
                allow_reset: false
            },
            {
                key: "rc_expo",
                value: 30, 
                allow_reset: false
            },
            {
                key: "roll_rate",
                value: 18, 
                allow_reset: true
            },
            {
                key: "pitch_rate",
                value: 9, 
                allow_reset: true
            },
            {
                key: "yaw_rate",
                value: 3, 
                allow_reset: true
            },
            {
                key: "nav_fw_pos_z_p",
                value: 15, 
                allow_reset: true,
                pid_axis: 3, 
                pid_bank: 0
            },
            {
                key: "nav_fw_pos_z_d",
                value: 5, 
                allow_reset: true,
                pid_axis: 3, 
                pid_bank: 2
            },
            {
                key: "nav_fw_pos_xy_p",
                value: 60, 
                allow_reset: true,
                pid_axis: 8, 
                pid_bank: 0
            },
            {
                key: "fw_turn_assist_pitch_gain",
                value: 0.2, 
                allow_reset: true
            },
            {
                key: "max_angle_inclination_rll",
                value: 550, 
                allow_reset: true
            },
            {
                key: "nav_fw_bank_angle",
                value: 45, 
                allow_reset: true
            },
            {
                key: "fw_p_pitch",
                value: 15, 
                allow_reset: true,
                pid_axis: 1, 
                pid_bank: 0
            },
            {
                key: "fw_i_pitch",
                value: 5, 
                allow_reset: true,
                pid_axis: 1, 
                pid_bank: 1
            },
            {
                key: "fw_d_pitch",
                value: 5, 
                allow_reset: true,
                pid_axis: 1, 
                pid_bank: 2
            },
            {
                key: "fw_ff_pitch",
                value: 70, 
                allow_reset: true,
                pid_axis: 1, 
                pid_bank: 3
            },
            {
                key: "fw_p_roll",
                value: 15, 
                allow_reset: true,
                pid_axis: 0, 
                pid_bank: 0
            },
            {
                key: "fw_i_roll",
                value: 3, 
                allow_reset: true,
                pid_axis: 0, 
                pid_bank: 1
            },
            {
                key: "fw_d_roll",
                value: 7, 
                allow_reset: true,
                pid_axis: 0, 
                pid_bank: 2
            },
            {
                key: "fw_ff_roll",
                value: 50, 
                allow_reset: true,
                pid_axis: 0, 
                pid_bank: 3
            },
            {
                key: "fw_p_yaw",
                value: 20, 
                allow_reset: true,
                pid_axis: 2, 
                pid_bank: 0
            },
            {
                key: "fw_i_yaw",
                value: 0, 
                allow_reset: true,
                pid_axis: 2, 
                pid_bank: 1
            },
            {
                key: "fw_d_yaw",
                value: 0, 
                allow_reset: true,
                pid_axis: 2, 
                pid_bank: 2
            },
            {
                key: "fw_ff_yaw",
                value: 100, 
                allow_reset: true,
                pid_axis: 2, 
                pid_bank: 3
            },
            {
                key: "imu_acc_ignore_rate",
                value: 9, 
                allow_reset: true
            },
            {
                key: "imu_acc_ignore_slope",
                value: 5, 
                allow_reset: true
            },
            {
                key: "airmode_type",
                value: "STICK_CENTER_ONCE", 
                allow_reset: true
            },
            {
                key: "small_angle",
                value: 180, 
                allow_reset: true
            },
            {
                key: "nav_fw_control_smoothness",
                value: 2, 
                allow_reset: true
            },
            {
                key: "nav_rth_allow_landing",
                value: "FS_ONLY", 
                allow_reset: false
            },
            {
                key: "nav_rth_altitude",
                value: 5000, 
                allow_reset: false
            },
            {
                key: "failsafe_mission",
                value: "ON", 
                allow_reset: false
            },
            {
                key: "nav_wp_radius",
                value: 5000, 
                allow_reset: false
            },
        ],
        "features": [
            {
                bit: 4, // Enable MOTOR_STOP
                state: true
            }
        ]
    },
    {
        "title": 'Rovers & Boats',
        "id": 1,
        "notRecommended": false,
        "reboot": true,
        "mixerToApply": 31,
        "settings": [
            {
                key: "model_preview_type",
                value: 31, 
                allow_reset: false
            },
            {
                key: "gyro_hardware_lpf",
                value: "256HZ", 
                allow_reset: true
            },
            {
                key: "gyro_main_lpf_hz",
                value: 10, 
                allow_reset: true
            },
            {
                key: "gyro_main_lpf_type",
                value: "BIQUAD", 
                allow_reset: true
            },
            {
                key: "motor_pwm_protocol",
                value: "STANDARD", 
                allow_reset: false
            },
            {
                key: "applied_defaults",
                value: 1, 
                allow_reset: false
            },
            {
                key: "failsafe_procedure",
                value: "DROP", 
                allow_reset: false
            },
            {
                key: "platform_type",
                value: "ROVER", 
                allow_reset: false
            },
            {
                key: "nav_wp_safe_distance",
                value: 50000, 
                allow_reset: false
            },
            {
                key: "nav_fw_loiter_radius",
                value: 100, 
                allow_reset: false
            },
            {
                key: "nav_fw_yaw_deadband",
                value: 5, 
                allow_reset: true
            },
            {
                key: "pidsum_limit_yaw",
                value: 500, 
                allow_reset: true
            },
            {
                key: "nav_fw_pos_hdg_p",
                value: 60, 
                allow_reset: true
            },
            {
                key: "nav_fw_pos_hdg_i",
                value: 2, 
                allow_reset: true
            },
            {
                key: "nav_fw_pos_hdg_d",
                value: 0, 
                allow_reset: true
            }
        ]
    },
    {
        "title": 'Keep current settings (Not recommended)',
        "id": 0,
        "notRecommended": true,
        "reboot": false,
        "settings": [
            {
                key: "applied_defaults",
                value: 1, 
                allow_reset: false
            }
        ]
    }
    ]

    publicScope.init = function () {
        mspHelper.getSetting("applied_defaults").then(privateScope.onInitSettingReturned);
        $container = $("#defaults-wrapper");
    };

    privateScope.setFeaturesBits = function (selectedDefaultPreset) {

        if (selectedDefaultPreset.features && selectedDefaultPreset.features.length > 0) {
            helper.features.reset();

            for (const feature of selectedDefaultPreset.features) {
                if (feature.state) {
                    helper.features.set(feature.bit);
                } else {
                    helper.features.unset(feature.bit);
                }
            }

            helper.features.execute(function () {
                privateScope.setSettings(selectedDefaultPreset);
            });
        } else {
            privateScope.setSettings(selectedDefaultPreset);
        }
    };

    privateScope.finalize = function (selectedDefaultPreset) {
        mspHelper.saveToEeprom(function () {
            //noinspection JSUnresolvedVariable
            GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));

            if (selectedDefaultPreset.reboot) {
                GUI.tab_switch_cleanup(function () {
                    MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function () {
                        //noinspection JSUnresolvedVariable
                        if (savingDefaultsModal) {
                            savingDefaultsModal.close();
                        }
                        if (resettingPIDsModal) {
                            resettingPIDsModal.close();
                        }
                        GUI.log(chrome.i18n.getMessage('deviceRebooting'));
                        GUI.handleReconnect();
                    });
                });
            }
        });
    };

    privateScope.setSettings = function (selectedDefaultPreset) {
        //Save analytics
        googleAnalytics.sendEvent('Setting', 'Defaults', selectedDefaultPreset.title);
        Promise.mapSeries(selectedDefaultPreset.settings, function (input, ii) {
            return mspHelper.getSetting(input.key);
        }).then(function () {
            Promise.mapSeries(selectedDefaultPreset.settings, function (input, ii) {
                return privateScope.setSetting(input.key, input.value);
            }).then(function () {
                // If default preset is associated to a mixer, apply the mixer as well
                if (selectedDefaultPreset.mixerToApply) {
                    let currentMixerPreset = helper.mixer.getById(selectedDefaultPreset.mixerToApply);

                    helper.mixer.loadServoRules(currentMixerPreset);
                    helper.mixer.loadMotorRules(currentMixerPreset);

                    SERVO_RULES.cleanup();
                    SERVO_RULES.inflate();
                    MOTOR_RULES.cleanup();
                    MOTOR_RULES.inflate();

                    mspHelper.sendServoMixer(function () {
                        mspHelper.sendMotorMixer(function () {
                            MSP.send_message(MSPCodes.MSP_SELECT_SETTING, [0], false, privateScope.finalize(selectedDefaultPreset));
                        })
                    });
                } else {
                    MSP.send_message(MSPCodes.MSP_SELECT_SETTING, [0], false, privateScope.finalize(selectedDefaultPreset));
                }
            })
        });
    };

    publicScope.resetSettings = function () {
        mspHelper.getSetting("applied_defaults").then(function(aD){
            let selectedDefaultPreset = privateScope.getDefaults(aD.value);
            
            if (selectedDefaultPreset && selectedDefaultPreset.settings) {
                Promise.mapSeries(selectedDefaultPreset.settings, function (input) {
                    if (input.allow_reset) {
                        let logStr = "Setting " + input.key + " ...";
                        if ( 'pid_axis' in input && 'pid_bank' in input) {
                            logStr += " <span style='color:orange;'>Current PIDs[" + input.pid_axis + "][" + input.pid_bank + "] = " + PIDs[input.pid_axis][input.pid_bank] + "</span> |";
                            PIDs[input.pid_axis][input.pid_bank] = input.value;
                            logStr += " <span style='color:green;'>Setting PIDs[" + input.pid_axis + "][" + input.pid_bank + "] = " + input.value + "</span> |";
                        }
                        logStr += " <span style='color:cyan;'>set " + input.key + " = " + input.value + "<span>";
                        privateScope.setSetting(input.key, input.value);

                        GUI.log(logStr);
                    }
                    return;
                }).then(function () {
                    //MSP.savePidData(
                        //privateScope.finalize(selectedDefaultPreset);
                    //);
                });
            }
        });
        return false;
    };

    privateScope.setSetting = function (key, value) {
        MSP.send_message(MSPCodes.MSP_SELECT_SETTING, [0], false, function () {
            mspHelper.setSetting(key, value, function() {
                MSP.send_message(MSPCodes.MSP_SELECT_SETTING, [1], false, function () {
                    mspHelper.setSetting(key, value, function() {
                        MSP.send_message(MSPCodes.MSP_SELECT_SETTING, [2], false, function () {
                            mspHelper.setSetting(key, value).then();
                        });
                    });
                });
            });
        });
        return;
    };

    privateScope.getDefaults = function(defaultsID) {
        let defaults = null; 
        data.forEach(function(dataSetting) {
            if (dataSetting.id == defaultsID) {
                defaults = dataSetting;
            }
        });

        return defaults;
    };

    privateScope.onPresetClick = function (event) {
        savingDefaultsModal = new jBox('Modal', {
            width: 400,
            height: 100,
            animation: false,
            closeOnClick: false,
            closeOnEsc: false,
            content: $('#modal-saving-defaults')
        }).open();

        $container.hide();

        let selectedDefaultPreset = data[$(event.currentTarget).data("index")];
        if (selectedDefaultPreset && selectedDefaultPreset.settings) {

            if (selectedDefaultPreset.id == 0) {
                // Close applying preset dialog if keeping current settings.
                savingDefaultsModal.close(); 
            }

            mspHelper.loadFeatures(function () {
                privateScope.setFeaturesBits(selectedDefaultPreset)
            });
        } else {
            savingDefaultsModal.close(); 
        }
    };

    privateScope.render = function () {
        let $place = $container.find('.defaults-dialog__options');
        $place.html("");
        for (let i in data) {
            if (data.hasOwnProperty(i)) {
                let preset = data[i];
                let $element = $("<div class='default_btn defaults_btn'>\
                        <a class='confirm' href='#'></a>\
                    </div>")

                if (preset.notRecommended) {
                    $element.addClass("defaults_btn--not-recommended");
                }

                $element.find("a").html(preset.title);
                $element.data("index", i).click(privateScope.onPresetClick)
                $element.appendTo($place);
            }
        }
    }

    privateScope.onInitSettingReturned = function (promise) {
        if (promise.value > 0) {
            return; //Defaults were applied, we can just ignore
        }

        privateScope.render();
        $container.show();
    }

    return publicScope;
})();
