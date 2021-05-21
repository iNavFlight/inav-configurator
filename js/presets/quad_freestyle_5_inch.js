module.exports = {
    name: '5" Freestyle Quadcopter, 2208 2450kV motors',
    description: "Overpowered freestyle quad. 5\", 3 bladed propellers like HQProp S4, Nepal N1, 2208 2450KV motors, 4S, DSHOT600 ESC protocol.<br>Optimized for smooth, freestyle or acrobatic flight.",
    features: ["DSHOT600", "4k mode", "Matrix Filter", "Improved mechanics", "Optimized filtering", "Optimized rates"],
    applyDefaults: ["INAV_PID_CONFIG", "RC_tuning", "PID_ADVANCED", "FILTER_CONFIG"],
    settingsMSP: [],
    settings: [
        {
            key: "platform_type",
            value: "MULTIROTOR"
        },
        {
            key: "motor_pwm_protocol",
            value: "DSHOT600"
        },
        {
            key: "gyro_hardware_lpf",
            value: "256HZ"
        },
        {
            key: "looptime",
            value: 250
        },
        {
            key: "gyro_main_lpf_hz",
            value: 115
        },
        {
            key: "gyro_main_lpf_type",
            value: "PT1"
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
            key: "mc_iterm_relax",
            value: "RP"
        },
        {
            key: "d_boost_factor",
            value: 1.5
        },
        {
            key: "d_boost_max_at_acceleration",
            value: 7500.000
        },
        {
            key: "d_boost_gyro_delta_lpf_hz",
            value: 80
        },
        {
            key: "antigravity_gain",
            value: 2
        },
        {
            key: "antigravity_accelerator",
            value: 5
        },
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
            value: 85
        },
        {
            key: "pitch_rate",
            value: 85
        },
        {
            key: "yaw_rate",
            value: 75
        },
        {
            key: "mc_p_pitch",
            value: 26
        },
        {
            key: "mc_i_pitch",
            value: 60
        },
        {
            key: "mc_d_pitch",
            value: 28
        },
        {
            key: "mc_p_roll",
            value: 22
        },
        {
            key: "mc_i_roll",
            value: 50
        },
        {
            key: "mc_d_roll",
            value: 24
        },
        {
            key: "mc_p_yaw",
            value: 44
        },
        {
            key: "mc_i_yaw",
            value: 70
        },
        {
            key: "airmode_type",
            value: "THROTTLE_THRESHOLD"
        },
        {
            key: "dynamic_gyro_notch_enabled",
            value: "ON"
        },
        {
            key: "dynamic_gyro_notch_q",
            value: 200
        },
        {
            key: "dynamic_gyro_notch_min_hz",
            value: 140
        },
        {
            key: "min_check",
            value: 1050
        },
        {
            key: "throttle_idle",
            value: 12
        }
    ],
    type: 'multirotor'
};