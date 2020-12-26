/*global mspHelper,$,GUI,MSP,BF_CONFIG,chrome*/
'use strict';

var helper = helper || {};

helper.defaultsDialog = (function() {

    let publicScope = {},
        privateScope = {};

    let $container;

    let data = [{
            "title": 'Mini Quad with 3"-7" propellers',
            "notRecommended": false,
            "reboot": true,
            "settings": [
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
                    value: "ONESHOT125"
                },
                /*
                Filtering
                */
                {
                    key: "gyro_lpf_hz",
                    value: 110
                },
                {
                    key: "gyro_lpf_type",
                    value: "PT1"
                },
                {
                    key: "gyro_stage2_lowpass_hz",
                    value: 0
                },
                {
                    key: "dterm_lpf_hz",
                    value: 110
                },
                {
                    key: "dterm_lpf_type",
                    value: "PT1"
                },
                {
                    key: "dterm_lpf2_hz",
                    value: 170
                },
                {
                    key: "dterm_lpf2_type",
                    value: "PT1"
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
                    value: 120
                },
                {
                    key: "setpoint_kalman_enabled",
                    value: "ON"
                },
                {
                    key: "setpoint_kalman_q",
                    value: 200
                },
                /*
                Mechanics
                */
                {
                    key: "mc_airmode_type",
                    value: "THROTTLE_THRESHOLD"
                },
                {
                    key: "mc_iterm_relax",
                    value: "RP"
                },
                {
                    key: "d_boost_factor",
                    value: 1.5
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
                    value: 70
                },
                {
                    key: "rc_expo",
                    value: 70
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
                    value: 75
                },
                {
                    key: "mc_d_pitch",
                    value: 25
                },
                {
                    key: "mc_p_roll",
                    value: 40
                },
                {
                    key: "mc_i_roll",
                    value: 60
                },
                {
                    key: "mc_d_roll",
                    value: 23
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
                }
            ]
        },
        {
            "title": 'Airplane',
            "notRecommended": false,
            "id": 3,
            "reboot": true,
            "settings": [
                {
                    key: "gyro_hardware_lpf",
                    value: "256HZ"
                },
                {
                    key: "gyro_lpf_hz",
                    value: 25
                },
                {
                    key: "gyro_lpf_type",
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
                    key: "rc_yaw_expo",
                    value: 30
                },
                {
                    key: "rc_expo",
                    value: 30
                },
                {
                    key: "roll_rate",
                    value: 20
                },
                {
                    key: "pitch_rate",
                    value: 15
                },
                {
                    key: "yaw_rate",
                    value: 9
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
                    key: "failsafe_mission",
                    value: "OFF"
                },
                {
                    key: "nav_wp_radius",
                    value: 3000
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
                    key: "imu_acc_ignore_rate",
                    value: 10
                }
            ],
            "features":[
                {
                    bit: 4, // Enable MOTOR_STOP
                    state: true
                }
            ]
        },
        {
            "title": 'Rovers & Boats',
            "notRecommended": false,
            "reboot": true,
            "settings": [
                {
                    key: "gyro_hardware_lpf",
                    value: "256HZ"
                },
                {
                    key: "gyro_lpf_hz",
                    value: 10
                },
                {
                    key: "gyro_lpf_type",
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
                    key: "nav_wp_safe_distance",
                    value: 50000
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
            "title": 'Custom UAV - INAV legacy defaults (Not recommended)',
            "notRecommended": true,
            "reboot": false,
            "settings": [
                {
                    key: "motor_pwm_protocol",
                    value: "STANDARD"
                },
                {
                    key: "applied_defaults",
                    value: 1
                }
            ]
        },
        {
            "title": 'Keep current settings (Not recommended)',
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

    publicScope.init = function() {
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

    privateScope.setSettings = function (selectedDefaultPreset) {
        //Save analytics
        googleAnalytics.sendEvent('Setting', 'Defaults', selectedDefaultPreset.title);
        Promise.mapSeries(selectedDefaultPreset.settings, function (input, ii) {
            return mspHelper.getSetting(input.key);
        }).then(function () {
            Promise.mapSeries(selectedDefaultPreset.settings, function (input, ii) {
                return mspHelper.setSetting(input.key, input.value);
            }).then(function () {
                mspHelper.saveToEeprom(function () {
                    //noinspection JSUnresolvedVariable
                    GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));
            
                    if (selectedDefaultPreset.reboot) {
                        GUI.tab_switch_cleanup(function() {
                            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function () {
                                //noinspection JSUnresolvedVariable
                                GUI.log(chrome.i18n.getMessage('deviceRebooting'));
                                GUI.handleReconnect();
                            });
                        });
                    }
                });
            })
        });
    };

    privateScope.onPresetClick = function(event) {
        $container.hide();
        let selectedDefaultPreset = data[$(event.currentTarget).data("index")];
        if (selectedDefaultPreset && selectedDefaultPreset.settings) {

            mspHelper.loadBfConfig(function () {
                privateScope.setFeaturesBits(selectedDefaultPreset)   
            });
        }
    };

    privateScope.render = function() {
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

    privateScope.onInitSettingReturned = function(promise) {
        if (promise.value > 0) {
            return; //Defaults were applied, we can just ignore
        }

        privateScope.render();
        $container.show();
    }

    return publicScope;
})();
