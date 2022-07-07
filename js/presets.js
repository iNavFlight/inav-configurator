'use strict';

var helper = helper || {};

helper.presets = (function () {

    let publicScope = {},
        privateScope = {};

    let data = [
        {
            id: 1,
            type: "filter",
            name: "Multirotor 5\" Default",
            description: "INAV default filter preset. Works great with 5\" multirotors and similar. Might be suboptimal for light builds and bigger quaads.",
            author: "DzikuVx",
            settings: {
                "gyro_hardware_lpf": "256HZ",
                "gyro_anti_aliasing_lpf_hz": 250,
                "gyro_anti_aliasing_lpf_type": "PT1",
                "gyro_main_lpf_hz": 110,
                "gyro_main_lpf_type": "PT1",
                "dterm_lpf_hz": 110,
                "dterm_lpf_type": "PT3",
                "dterm_lpf2_hz": 0,
                "dterm_lpf2_type": "PT1",
                "dynamic_gyro_notch_enabled": "ON",
                "dynamic_gyro_notch_q": 250,
                "dynamic_gyro_notch_min_hz": 120,
                "setpoint_kalman_enabled": "ON",
                "setpoint_kalman_q": 200,
                "smith_predictor_delay": 1.5
            }
        },
        {
            id: 2,
            type: "filter",
            name: "Multirotor 7\" Freestyle",
            description: "Works great on 7\" multirotors and similar. Might be suboptimal for light builds and smaller quaads.",
            author: "DzikuVx",
            settings: {
                "gyro_hardware_lpf": "256HZ",
                "gyro_anti_aliasing_lpf_hz": 500,
                "gyro_anti_aliasing_lpf_type": "PT1",
                "gyro_main_lpf_hz": 90,
                "gyro_main_lpf_type": "PT1",
                "dterm_lpf_hz": 85,
                "dterm_lpf_type": "PT3",
                "dterm_lpf2_hz": 0,
                "dterm_lpf2_type": "PT1",
                "dynamic_gyro_notch_enabled": "ON",
                "dynamic_gyro_notch_q": 250,
                "dynamic_gyro_notch_min_hz": 70,
                "setpoint_kalman_enabled": "ON",
                "setpoint_kalman_q": 200,
                "smith_predictor_delay": 1.5
            }
        }    
    ];

    //Returns all presets by type   
    publicScope.getByType = function (type) {
        return data.filter(function (preset) {
            return preset.type === type;
        });
    };
    
    //Returns all presets
    publicScope.getAll = function () {
        return data;
    };

    //returns preset by id
    publicScope.getById = function (id) {
        return data.find(function (preset) {
            return preset.id === id;
        });
    };

    publicScope.apply = function (id, callback) {
        let preset = publicScope.getById(id);
        
        if (preset) {

            let settings = Object.keys(preset.settings)
                .map(function(s) { 
                    return { 
                        key: s,
                        value: preset.settings[s]
                    }
                });

            Promise.mapSeries(settings, function (input, ii) {
                return mspHelper.getSetting(input.key);
            }).then(function () {

                Promise.mapSeries(settings, function (input, ii) {
                    return mspHelper.setSetting(input.key, input.value);
                }).then(function () {
                    if (callback && typeof callback === "function") {
                        callback();
                    }
                });

            });
        }

    }

    return publicScope;
})();