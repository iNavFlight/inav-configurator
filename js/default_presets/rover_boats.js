module.exports = {
    "title": 'Rovers & Boats',
    "notRecommended": false,
    "reboot": true,
    "settings": [
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
};