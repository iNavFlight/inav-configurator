'use strict';

var helper = helper || {};

helper.presets = (function () {

    let publicScope = {},
        privateScope = {};

    let data = [
        {
            id: 1,
            type: "filter",
            name: "5\" Default",
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

    return publicScope;
})();