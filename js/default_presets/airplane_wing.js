window.default_preset_airplane_wing = {
    "title": 'Airplane without a Tail (Wing, Delta, etc)',
    "notRecommended": false,
    "id": 3,
    "reboot": true,
    "settings": [
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
            key: "d_boost_factor",
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
            value: 20
        },
        {
            key: "nav_fw_pos_z_d",
            value: 5
        },
        {
            key: "nav_fw_pos_xy_p",
            value: 60
        },
        {
            key: "fw_turn_assist_pitch_gain",
            value: 0.2
        },
        {
            key: "max_angle_inclination_rll",
            value: 450
        },
        {
            key: "nav_fw_bank_angle",
            value: 45
        },
        {
            key: "fw_p_pitch",
            value: 10
        },
        {
            key: "fw_i_pitch",
            value: 15
        },
        {
            key: "fw_ff_pitch",
            value: 70
        },
        {
            key: "fw_p_roll",
            value: 5
        },
        {
            key: "fw_i_roll",
            value: 8
        },
        {
            key: "fw_ff_roll",
            value: 35
        },
        {
            key: "imu_acc_ignore_rate",
            value: 8
        },
        {
            key: "imu_acc_ignore_slope",
            value: 5
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
            key: "failsafe_mission",
            value: "ON"
        },
        {
            key: "nav_wp_radius",
            value: 1500
        },
    ],
    "features": [
        {
            bit: 4, // Enable MOTOR_STOP
            state: true
        }
    ]
};