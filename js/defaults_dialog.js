/*global mspHelper,$,GUI,MSP,chrome*/
'use strict';

var helper = helper || {};
var savingDefaultsModal;

helper.defaultsDialog = (function () {

    let publicScope = {},
        privateScope = {};

    let $container;

    let data = [
    {
        "title": 'Mini Quad with 3" propellers',
        "id": 6,
        "notRecommended": false,
        "reboot": true,
        "mixerToApply": 3,
        "settings": [
            {
                key: "model_preview_type",
                value: 3
            },
            /*
            System
            */
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "looptime",
                value: 500
            },
            {
                key: "motor_pwm_protocol",
                value: "DSHOT300"
            },
            /*
            Filtering
            */
            {
                key: "gyro_main_lpf_hz",
                value: 90
            },
            {
                key: "gyro_main_lpf_type",
                value: "PT1"
            },
            {
                key: "dterm_lpf_hz",
                value: 85
            },
            {
                key: "dterm_lpf_type",
                value: "PT3"
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON"
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 250
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 70
            },
            {
                key: "setpoint_kalman_enabled",
                value: "ON"
            },
            {
                key: "setpoint_kalman_q",
                value: 200
            },
            {
                key: "smith_predictor_delay",   // Enable Smith Predictor 
                value: 1.5
            },   
            /*
            Mechanics
            */
            {
                key: "airmode_type",
                value: "THROTTLE_THRESHOLD"
            },
            {
                key: "airmode_throttle_threshold",
                value: 1150
            },
            {
                key: "mc_iterm_relax",
                value: "RP"
            },
            {
                key: "d_boost_min",
                value: 1.0
            },
            {
                key: "d_boost_max",
                value: 1.0
            },
            {
                key: "antigravity_gain",
                value: 2
            },
            {
                key: "antigravity_accelerator",
                value: 5
            },
            /*
            Rates
            */
            {
                key: "rc_yaw_expo",
                value: 75
            },
            {
                key: "rc_expo",
                value: 75
            },
            {
                key: "roll_rate",
                value: 70
            },
            {
                key: "pitch_rate",
                value: 70
            },
            {
                key: "yaw_rate",
                value: 60
            },
            /*
            PIDs
            */
            {
                key: "mc_p_pitch",
                value: 32
            },
            {
                key: "mc_i_pitch",
                value: 90
            },
            {
                key: "mc_d_pitch",
                value: 25
            },
            {
                key: "mc_p_roll",
                value: 28
            },
            {
                key: "mc_i_roll",
                value: 80
            },
            {
                key: "mc_d_roll",
                value: 23
            },
            {
                key: "mc_p_yaw",
                value: 30
            },
            {
                key: "mc_i_yaw",
                value: 80
            },
            /*
                * TPA
                */
            {
                key: "tpa_rate",
                value: 20
            },
            {
                key: "tpa_breakpoint",
                value: 1200
            },
            {
                key: "platform_type",
                value: "MULTIROTOR"
            },
            {
                key: "applied_defaults",
                value: 6
            },
            {
                key: "failsafe_procedure",
                value: "DROP"
            },
            // Ez Tune
            {
                key: "ez_filter_hz",
                value: 90
            }
        ]
    },
    {
        "title": 'Mini Quad with 5" propellers',
        "id": 2,
        "notRecommended": false,
        "reboot": true,
        "mixerToApply": 3,
        "settings": [
            {
                key: "model_preview_type",
                value: 3
            },
            /*
            System
            */
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "looptime",
                value: 500
            },
            {
                key: "motor_pwm_protocol",
                value: "DSHOT300"
            },
            /*
            Filtering
            */
            {
                key: "gyro_main_lpf_hz",
                value: 110
            },
            {
                key: "gyro_main_lpf_type",
                value: "PT1"
            },
            /*
            Dynamic gyro LPF
            */
            {
                key: "gyro_use_dyn_lpf",
                value: "ON"
            },
            {
                key: "gyro_dyn_lpf_min_hz",
                value: 85
            },
            {
                key: "gyro_dyn_lpf_max_hz",
                value: 300
            },
            {
                key: "gyro_dyn_lpf_curve_expo",
                value: 3
            },
            /*
            D-term
            */
            {
                key: "dterm_lpf_hz",
                value: 110
            },
            {
                key: "dterm_lpf_type",
                value: "PT3"
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON"
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 250
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 100
            },
            {
                key: "setpoint_kalman_enabled",
                value: "ON"
            },
            {
                key: "setpoint_kalman_q",
                value: 200
            },
            {
                key: "smith_predictor_delay",   // Enable Smith Predictor 
                value: 1.5
            },   
            /*
            Mechanics
            */
            {
                key: "airmode_type",
                value: "THROTTLE_THRESHOLD"
            },
            {
                key: "airmode_throttle_threshold",
                value: 1150
            },
            {
                key: "mc_iterm_relax",
                value: "RP"
            },
            {
                key: "d_boost_min",
                value: 1.0
            },
            {
                key: "d_boost_max",
                value: 1.0
            },
            {
                key: "antigravity_gain",
                value: 2
            },
            {
                key: "antigravity_accelerator",
                value: 5
            },
            /*
            Rates
            */
            {
                key: "rc_yaw_expo",
                value: 75
            },
            {
                key: "rc_expo",
                value: 75
            },
            {
                key: "roll_rate",
                value: 70
            },
            {
                key: "pitch_rate",
                value: 70
            },
            {
                key: "yaw_rate",
                value: 60
            },
            /*
            PIDs
            */
            {
                key: "mc_p_pitch",
                value: 40
            },
            {
                key: "mc_i_pitch",
                value: 90
            },
            {
                key: "mc_d_pitch",
                value: 27
            },
            {
                key: "mc_p_roll",
                value: 36
            },
            {
                key: "mc_i_roll",
                value: 80
            },
            {
                key: "mc_d_roll",
                value: 25
            },
            {
                key: "mc_p_yaw",
                value: 35
            },
            {
                key: "mc_i_yaw",
                value: 80
            },
            /*
             * TPA
             */
            {
                key: "tpa_rate",
                value: 20
            },
            {
                key: "tpa_breakpoint",
                value: 1200
            },
            {
                key: "platform_type",
                value: "MULTIROTOR"
            },
            {
                key: "applied_defaults",
                value: 2
            },
            {
                key: "failsafe_procedure",
                value: "DROP"
            },
            // Ez Tune
            {
                key: "ez_filter_hz",
                value: 110
            }
        ]
    },
    {
        "title": 'Mini Quad with 7" propellers',
        "id": 5,
        "notRecommended": false,
        "reboot": true,
        "mixerToApply": 3,
        "settings": [
            {
                key: "model_preview_type",
                value: 3
            },
            /*
            System
            */
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "looptime",
                value: 500
            },
            {
                key: "motor_pwm_protocol",
                value: "DSHOT300"
            },
            /*
            Filtering
            */
            {
                key: "gyro_main_lpf_hz",
                value: 90
            },
            {
                key: "gyro_main_lpf_type",
                value: "PT1"
            },
            {
                key: "dterm_lpf_hz",
                value: 80
            },
            {
                key: "dterm_lpf_type",
                value: "PT3"
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON"
            },
            {
                key: "dynamic_gyro_notch_mode",
                value: "3D"
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 250
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 60
            },
            {
                key: "setpoint_kalman_enabled",
                value: "ON"
            },
            {
                key: "setpoint_kalman_q",
                value: 200
            },
            {
                key: "smith_predictor_delay",   // Enable Smith Predictor 
                value: 1.5
            },   
            /*
            Mechanics
            */
            {
                key: "airmode_type",
                value: "THROTTLE_THRESHOLD"
            },
            {
                key: "airmode_throttle_threshold",
                value: 1150
            },
            {
                key: "mc_iterm_relax",
                value: "RPY"
            },
            {
                key: "d_boost_min",
                value: 0.8
            },
            {
                key: "d_boost_max",
                value: 1.2
            },
            {
                key: "antigravity_gain",
                value: 2
            },
            {
                key: "antigravity_accelerator",
                value: 5
            },
            /*
            Rates
            */
            {
                key: "rc_yaw_expo",
                value: 75
            },
            {
                key: "rc_expo",
                value: 75
            },
            {
                key: "roll_rate",
                value: 70
            },
            {
                key: "pitch_rate",
                value: 70
            },
            {
                key: "yaw_rate",
                value: 60
            },
            /*
            PIDs
            */
            {
                key: "mc_p_pitch",
                value: 44
            },
            {
                key: "mc_i_pitch",
                value: 85
            },
            {
                key: "mc_d_pitch",
                value: 28
            },
            {
                key: "mc_p_roll",
                value: 40
            },
            {
                key: "mc_i_roll",
                value: 75
            },
            {
                key: "mc_d_roll",
                value: 26
            },
            {
                key: "mc_p_yaw",
                value: 40
            },
            {
                key: "mc_i_yaw",
                value: 80
            },
            /*
             * TPA
             */
            {
                key: "tpa_rate",
                value: 20
            },
            {
                key: "tpa_breakpoint",
                value: 1200
            },
            {
                key: "platform_type",
                value: "MULTIROTOR"
            },
            {
                key: "applied_defaults",
                value: 5
            },
            {
                key: "failsafe_procedure",
                value: "DROP"
            },
            // Ez Tune
            {
                key: "ez_filter_hz",
                value: 90
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
                value: 14
            },
            {
                key: "platform_type",
                value: "AIRPLANE"
            },
            {
                key: "applied_defaults",
                value: 3
            },
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "gyro_main_lpf_hz",
                value: 25
            },
            {
                key: "dterm_lpf_hz",
                value: 10
            },
            {
                key: "d_boost_min",
                value: 1
            },
            {
                key: "d_boost_max",
                value: 1
            },
            {
                key: "gyro_main_lpf_type",
                value: "BIQUAD"
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON"
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 250
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 30
            },
            {
                key: "motor_pwm_protocol",
                value: "STANDARD"
            },
            {
                key: "ahrs_inertia_comp_method",
                value: "ADAPTIVE"
            },
            {
                key: "throttle_idle",
                value: 5.0
            },
            {
                key: "rc_yaw_expo",
                value: 30
            },
            {
                key: "rc_expo",
                value: 30
            },
            {
                key: "roll_rate",
                value: 18
            },
            {
                key: "pitch_rate",
                value: 9
            },
            {
                key: "yaw_rate",
                value: 3
            },
            {
                key: "nav_fw_pos_z_p",
                value: 25
            },
            {
                key: "nav_fw_pos_z_i",
                value: 5
            },
            {
                key: "nav_fw_pos_z_d",
                value: 8
            },
            {
                key: "nav_fw_pos_xy_p",
                value: 55
            },
            {
                key: "fw_turn_assist_pitch_gain",
                value: 0.4
            },
            {
                key: "max_angle_inclination_rll",
                value: 450
            },
            {
                key: "nav_fw_bank_angle",
                value: 35
            },
            {
                key: "fw_p_pitch",
                value: 15
            },
            {
                key: "fw_i_pitch",
                value: 5
            },
            {
                key: "fw_d_pitch",
                value: 5
            },
            {
                key: "fw_ff_pitch",
                value: 80
            },
            {
                key: "fw_p_roll",
                value: 15
            },
            {
                key: "fw_i_roll",
                value: 3
            },
            {
                key: "fw_d_roll",
                value: 7
            },
            {
                key: "fw_ff_roll",
                value: 50
            },
            {
                key: "fw_p_yaw",
                value: 50
            },
            {
                key: "fw_i_yaw",
                value: 0
            },
            {
                key: "fw_d_yaw",
                value: 20
            },
            {
                key: "fw_ff_yaw",
                value: 255
            },
            {
                key: "airmode_type",
                value: "STICK_CENTER_ONCE"
            },
            {
                key: "small_angle",
                value: 180
            },
            {
                key: "nav_fw_control_smoothness",
                value: 2
            },
            {
                key: "nav_rth_allow_landing",
                value: "FS_ONLY"
            },
            {
                key: "nav_rth_altitude",
                value: 5000
            },
            {
                key: "nav_wp_radius",
                value: 5000
            },
            {
                key: "nav_wp_max_safe_distance",
                value: 500
            },
            {
                key: "nav_fw_launch_max_angle",
                value: 45
            },
            {
                key: "nav_fw_launch_motor_delay",
                value: 100
            },
            {
                key: "nav_fw_launch_max_altitude",
                value: 5000
            },
            {
                key: "nav_fw_launch_climb_angle",
                value: 25
            },
        ],
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
                value: 8
            },
            {
                key: "platform_type",
                value: "AIRPLANE"
            },
            {
                key: "applied_defaults",
                value: 4
            },
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "gyro_main_lpf_hz",
                value: 25
            },
            {
                key: "dterm_lpf_hz",
                value: 10
            },
            {
                key: "d_boost_min",
                value: 1
            },
            {
                key: "d_boost_max",
                value: 1
            },
            {
                key: "gyro_main_lpf_type",
                value: "BIQUAD"
            },
            {
                key: "dynamic_gyro_notch_enabled",
                value: "ON"
            },
            {
                key: "dynamic_gyro_notch_q",
                value: 250
            },
            {
                key: "dynamic_gyro_notch_min_hz",
                value: 30
            },
            {
                key: "motor_pwm_protocol",
                value: "STANDARD"
            },
            {
                key: "ahrs_inertia_comp_method",
                value: "ADAPTIVE"
            },
            {
                key: "throttle_idle",
                value: 5.0
            },
            {
                key: "rc_yaw_expo",
                value: 30
            },
            {
                key: "rc_expo",
                value: 30
            },
            {
                key: "roll_rate",
                value: 18
            },
            {
                key: "pitch_rate",
                value: 9
            },
            {
                key: "yaw_rate",
                value: 3
            },
            {
                key: "nav_fw_pos_z_p",
                value: 35
            },
            {
                key: "nav_fw_pos_z_i",
                value: 5
            },
            {
                key: "nav_fw_pos_z_d",
                value: 10
            },
            {
                key: "nav_fw_pos_xy_p",
                value: 70
            },
            {
                key: "fw_turn_assist_pitch_gain",
                value: 0.3
            },
            {
                key: "max_angle_inclination_rll",
                value: 550
            },
            {
                key: "nav_fw_bank_angle",
                value: 45
            },
            {
                key: "fw_p_pitch",
                value: 15
            },
            {
                key: "fw_i_pitch",
                value: 5
            },
                        {
                key: "fw_d_pitch",
                value: 5
            },
            {
                key: "fw_ff_pitch",
                value: 70
            },
            {
                key: "fw_p_roll",
                value: 15
            },
            {
                key: "fw_i_roll",
                value: 3
            },
            {
                key: "fw_d_roll",
                value: 7
            },
            {
                key: "fw_ff_roll",
                value: 50
            },
            {
                key: "fw_p_yaw",
                value: 20
            },
            {
                key: "fw_i_yaw",
                value: 0
            },
            {
                key: "fw_d_yaw",
                value: 0
            },
            {
                key: "fw_ff_yaw",
                value: 100
            },
            {
                key: "airmode_type",
                value: "STICK_CENTER_ONCE"
            },
            {
                key: "small_angle",
                value: 180
            },
            {
                key: "nav_fw_control_smoothness",
                value: 2
            },
            {
                key: "nav_rth_allow_landing",
                value: "FS_ONLY"
            },
            {
                key: "nav_rth_altitude",
                value: 5000
            },
            {
                key: "nav_wp_radius",
                value: 5000
            },
            {
                key: "nav_wp_max_safe_distance",
                value: 500
            },
            {
                key: "nav_fw_launch_max_angle",
                value: 75
            },
            {
                key: "nav_fw_launch_motor_delay",
                value: 100
            },
            {
                key: "nav_fw_launch_max_altitude",
                value: 5000
            },
            {
                key: "nav_fw_launch_climb_angle",
                value: 25
            },
        ],
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
                value: 31
            },
            {
                key: "gyro_hardware_lpf",
                value: "256HZ"
            },
            {
                key: "gyro_main_lpf_hz",
                value: 10
            },
            {
                key: "gyro_main_lpf_type",
                value: "BIQUAD"
            },
            {
                key: "motor_pwm_protocol",
                value: "STANDARD"
            },
            {
                key: "applied_defaults",
                value: 1
            },
            {
                key: "failsafe_procedure",
                value: "DROP"
            },
            {
                key: "platform_type",
                value: "ROVER"
            },
            {
                key: "nav_wp_max_safe_distance",
                value: 500
            },
            {
                key: "nav_fw_loiter_radius",
                value: 100
            },
            {
                key: "nav_fw_yaw_deadband",
                value: 5
            },
            {
                key: "pidsum_limit_yaw",
                value: 500
            },
            {
                key: "nav_fw_pos_hdg_p",
                value: 60
            },
            {
                key: "nav_fw_pos_hdg_i",
                value: 2
            },
            {
                key: "nav_fw_pos_hdg_d",
                value: 0
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
                value: 1
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
                        if (typeof savingDefaultsModal !== 'undefined') {
                            savingDefaultsModal.close();
                        }
                        GUI.log(chrome.i18n.getMessage('deviceRebooting'));
                        GUI.handleReconnect();
                    });
                });
            }
        });
    };

    privateScope.setSettings = function (selectedDefaultPreset) {
        var currentControlProfile = parseInt($("#profilechange").val());
        var currentBatteryProfile = parseInt($("#batteryprofilechange").val());

        var controlProfileSettings = [];
        var batterySettings = [];
        var miscSettings = [];

        selectedDefaultPreset.settings.forEach(input => {
            if (FC.isControlProfileParameter(input.key)) {
                controlProfileSettings.push(input);
            } else if (FC.isBatteryProfileParameter(input.key)) {
                batterySettings.push(input);
            } else {
                miscSettings.push(input);
            }
        });

        //Save analytics
        googleAnalytics.sendEvent('Setting', 'Defaults', selectedDefaultPreset.title); 
        
        var settingsChainer = MSPChainerClass();
        var chain = [];

        miscSettings.forEach(input => {
            chain.push(function (callback) {
                mspHelper.setSetting(input.key, input.value, callback);
            });
        });

        for (var i = 0; i < 3; i++ ) {
            chain.push(function (callback) {
                MSP.send_message(MSPCodes.MSP_SELECT_SETTING, [i], false, callback);
            });
            controlProfileSettings.forEach(input => {
                chain.push(function (callback) {
                    mspHelper.setSetting(input.key, input.value, callback);
                });
            });
        }

        for (var i = 0; i < 3; i++ ) {
            chain.push(function (callback) {
                MSP.send_message(MSPCodes.MSP2_INAV_SELECT_BATTERY_PROFILE, [i], false, callback);
            });
            batterySettings.forEach(input => {
                chain.push(function (callback) {
                    mspHelper.setSetting(input.key, input.value, callback);
                });
            });
        }
        
        // Set Mixers
        if (selectedDefaultPreset.mixerToApply) {
            let currentMixerPreset = helper.mixer.getById(selectedDefaultPreset.mixerToApply);

            helper.mixer.loadServoRules(currentMixerPreset);
            helper.mixer.loadMotorRules(currentMixerPreset);
            
            MIXER_CONFIG.platformType = currentMixerPreset.platform;
            MIXER_CONFIG.appliedMixerPreset = selectedDefaultPreset.mixerToApply;
            MIXER_CONFIG.motorStopOnLow = (currentMixerPreset.motorStopOnLow === true) ? true : false;
            MIXER_CONFIG.hasFlaps = (currentMixerPreset.hasFlaps === true) ? true : false;

            SERVO_RULES.cleanup();
            SERVO_RULES.inflate();
            MOTOR_RULES.cleanup();
            MOTOR_RULES.inflate();
            
            chain = chain.concat([
                mspHelper.saveMixerConfig,
                mspHelper.sendServoMixer,
                mspHelper.sendMotorMixer
            ]);
        }
            
        chain.push(function (callback) {
            MSP.send_message(MSPCodes.MSP_SELECT_SETTING, [currentControlProfile], false, callback);
        });
            
        chain.push(function (callback) {
            MSP.send_message(MSPCodes.MSP2_INAV_SELECT_BATTERY_PROFILE, [currentBatteryProfile], false, callback);
        });
        
        settingsChainer.setChain(chain);
        settingsChainer.setExitPoint(function () {
            privateScope.finalize(selectedDefaultPreset);
        });
        
        settingsChainer.execute();        
    }

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
