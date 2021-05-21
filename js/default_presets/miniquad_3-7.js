module.exports = {
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
            key: "gyro_main_lpf_hz",
            value: 110
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
            key: "airmode_type",
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
};