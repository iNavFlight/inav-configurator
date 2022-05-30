var helper = helper || {};

helper.defaultsDialogData = [{
    "title": 'Mini Quad with 3"-7" propellers',
    "id": 2,
    "notRecommended": false,
    "reboot": true,
    "mixerToApply": 3,
    "wizardPages": ['receiver', 'outputs', 'gps', 'filters', 'pids'],
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
        {
            key: "dterm_lpf_hz",
            value: 110
        },
        {
            key: "dterm_lpf_type",
            value: "PT3"
        },
        {
            key: "dterm_lpf2_hz",
            value: 0
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
        },
        {
            key: "failsafe_procedure",
            value: "DROP"
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
            value: 15
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
            value: 0.5
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
            key: "imu_acc_ignore_rate",
            value: 9
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
            value: 5000
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
    "id": 3,
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
            value: 15
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
            key: "imu_acc_ignore_rate",
            value: 9
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
            value: 5000
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
];