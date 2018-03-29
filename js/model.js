'use strict';

const SERVO_GIMBAL_PITCH = 0,
    SERVO_GIMBAL_ROLL = 1,
    SERVO_ELEVATOR = 2,
    SERVO_FLAPPERON_1 = 3,
    SERVO_FLAPPERON_2 = 4,
    SERVO_RUDDER = 5,
    SERVO_BICOPTER_LEFT = 4,
    SERVO_BICOPTER_RIGHT = 5,
    SERVO_DUALCOPTER_LEFT = 4,
    SERVO_DUALCOPTER_RIGHT = 5,
    SERVO_SINGLECOPTER_1 = 3,
    SERVO_SINGLECOPTER_2 = 4,
    SERVO_SINGLECOPTER_3 = 5,
    SERVO_SINGLECOPTER_4 = 6;

const INPUT_STABILIZED_ROLL = 0,
    INPUT_STABILIZED_PITCH = 1,
    INPUT_STABILIZED_YAW = 2,
    INPUT_STABILIZED_THROTTLE = 3,
    INPUT_RC_ROLL = 4,
    INPUT_RC_PITCH = 5,
    INPUT_RC_YAW = 6,
    INPUT_RC_THROTTLE = 7,
    INPUT_RC_AUX1 = 8,
    INPUT_RC_AUX2 = 9,
    INPUT_RC_AUX3 = 10,
    INPUT_RC_AUX4 = 11,
    INPUT_GIMBAL_PITCH = 12,
    INPUT_GIMBAL_ROLL = 13,
    INPUT_FEATURE_FLAPS = 14;

// generate mixer
const mixerList = [
    {
        name: 'Tricopter',
        model: 'tricopter',
        image: 'tri',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 1.333333, 0.0),     // REAR
            new MotorMixRule(1.0, -1.0, -0.666667, 0.0),   // RIGHT
            new MotorMixRule(1.0, 1.0, -0.666667, 0.0)     // LEFT
        ],
        servoMixer: [
            new ServoMixRule(SERVO_RUDDER, INPUT_STABILIZED_YAW, 100, 0)
        ]
    },            // 1
    {
        name: 'Quad +',
        model: 'quad_x',
        image: 'quad_p',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 1.0, -1.0),          // REAR
            new MotorMixRule(1.0, -1.0, 0.0, 1.0),          // RIGHT
            new MotorMixRule(1.0, 1.0, 0.0, 1.0),          // LEFT
            new MotorMixRule(1.0, 0.0, -1.0, -1.0)          // FRONT
        ],
        servoMixer: []
    },               // 2
    {
        name: 'Quad X',
        model: 'quad_x',
        image: 'quad_x',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, -1.0, 1.0, -1.0),          // REAR_R
            new MotorMixRule(1.0, -1.0, -1.0, 1.0),          // FRONT_R
            new MotorMixRule(1.0, 1.0, 1.0, 1.0),            // REAR_L
            new MotorMixRule(1.0, 1.0, -1.0, -1.0)           // FRONT_L
        ],
        servoMixer: []
    },               // 3
    {
        name: 'Bicopter',
        model: 'custom',
        image: 'bicopter',
        hasCustomServoMixer: false,
        enabled: false,
        motorMixer: [],
        servoMixer: []
    },           // 4
    {
        name: 'Gimbal',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: false,
        enabled: false,
        motorMixer: [],
        servoMixer: []
    },               // 5
    {
        name: 'Y6',
        model: 'y6',
        image: 'y6',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 1.333333, 1.0),     // REAR
            new MotorMixRule(1.0, -1.0, -0.666667, -1.0),     // RIGHT
            new MotorMixRule(1.0, 1.0, -0.666667, -1.0),     // LEFT
            new MotorMixRule(1.0, 0.0, 1.333333, -1.0),     // UNDER_REAR
            new MotorMixRule(1.0, -1.0, -0.666667, 1.0),     // UNDER_RIGHT
            new MotorMixRule(1.0, 1.0, -0.666667, 1.0)     // UNDER_LEFT
        ],
        servoMixer: []
    },                           // 6
    {
        name: 'Hex +',
        model: 'hex_plus',
        image: 'hex_p',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, -0.866025, 0.5, 1.0),     // REAR_R
            new MotorMixRule(1.0, -0.866025, -0.5, -1.0),     // FRONT_R
            new MotorMixRule(1.0, 0.866025, 0.5, 1.0),     // REAR_L
            new MotorMixRule(1.0, 0.866025, -0.5, -1.0),     // FRONT_L
            new MotorMixRule(1.0, 0.0, -1.0, 1.0),     // FRONT
            new MotorMixRule(1.0, 0.0, 1.0, -1.0)     // REAR
        ],
        servoMixer: []
    },               // 7
    {
        name: 'Flying Wing',
        model: 'custom',
        image: 'flying_wing',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 0.0, 0.0),
            new MotorMixRule(1.0, 0.0, 0.0, 0.0),
        ],
        servoMixer: [
            new ServoMixRule(SERVO_FLAPPERON_1, INPUT_STABILIZED_ROLL,  50, 0),
            new ServoMixRule(SERVO_FLAPPERON_1, INPUT_STABILIZED_PITCH, 50, 0),
            new ServoMixRule(SERVO_FLAPPERON_2, INPUT_STABILIZED_ROLL, -50, 0),
            new ServoMixRule(SERVO_FLAPPERON_2, INPUT_STABILIZED_PITCH, 50, 0)
        ]
    },     // 8
    {
        name: 'Y4',
        model: 'y4',
        image: 'y4',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 1.0, -1.0),          // REAR_TOP CW
            new MotorMixRule(1.0, -1.0, -1.0, 0.0),          // FRONT_R CCW
            new MotorMixRule(1.0, 0.0, 1.0, 1.0),          // REAR_BOTTOM CCW
            new MotorMixRule(1.0, 1.0, -1.0, 0.0),          // FRONT_L CW
        ],
        servoMixer: []
    },                           // 9
    {
        name: 'Hex X',
        model: 'hex_x',
        image: 'hex_x',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, -0.5, 0.866025, 1.0),     // REAR_R
            new MotorMixRule(1.0, -0.5, -0.866025, 1.0),     // FRONT_R
            new MotorMixRule(1.0, 0.5, 0.866025, -1.0),     // REAR_L
            new MotorMixRule(1.0, 0.5, -0.866025, -1.0),     // FRONT_L
            new MotorMixRule(1.0, -1.0, 0.0, -1.0),     // RIGHT
            new MotorMixRule(1.0, 1.0, 0.0, 1.0),     // LEFT
        ],
        servoMixer: []
    },                  // 10
    {
        name: 'Octo X8',
        model: 'custom',
        image: 'octo_x8',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, -1.0, 1.0, -1.0),          // REAR_R
            new MotorMixRule(1.0, -1.0, -1.0, 1.0),          // FRONT_R
            new MotorMixRule(1.0, 1.0, 1.0, 1.0),          // REAR_L
            new MotorMixRule(1.0, 1.0, -1.0, -1.0),          // FRONT_L
            new MotorMixRule(1.0, -1.0, 1.0, 1.0),          // UNDER_REAR_R
            new MotorMixRule(1.0, -1.0, -1.0, -1.0),          // UNDER_FRONT_R
            new MotorMixRule(1.0, 1.0, 1.0, -1.0),          // UNDER_REAR_L
            new MotorMixRule(1.0, 1.0, -1.0, 1.0),          // UNDER_FRONT_L
        ],
        servoMixer: []
    },             // 11
    {
        name: 'Octo Flat +',
        model: 'custom',
        image: 'octo_flat_p',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, 0.707107, -0.707107, 1.0),    // FRONT_L
            new MotorMixRule(1.0, -0.707107, -0.707107, 1.0),    // FRONT_R
            new MotorMixRule(1.0, -0.707107, 0.707107, 1.0),    // REAR_R
            new MotorMixRule(1.0, 0.707107, 0.707107, 1.0),    // REAR_L
            new MotorMixRule(1.0, 0.0, -1.0, -1.0),              // FRONT
            new MotorMixRule(1.0, -1.0, 0.0, -1.0),              // RIGHT
            new MotorMixRule(1.0, 0.0, 1.0, -1.0),              // REAR
            new MotorMixRule(1.0, 1.0, 0.0, -1.0),              // LEFT
        ],
        servoMixer: []
    },     // 12
    {
        name: 'Octo Flat X',
        model: 'custom',
        image: 'octo_flat_x',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, 1.0, -0.414178, 1.0),      // MIDFRONT_L
            new MotorMixRule(1.0, -0.414178, -1.0, 1.0),      // FRONT_R
            new MotorMixRule(1.0, -1.0, 0.414178, 1.0),      // MIDREAR_R
            new MotorMixRule(1.0, 0.414178, 1.0, 1.0),      // REAR_L
            new MotorMixRule(1.0, 0.414178, -1.0, -1.0),      // FRONT_L
            new MotorMixRule(1.0, -1.0, -0.414178, -1.0),      // MIDFRONT_R
            new MotorMixRule(1.0, -0.414178, 1.0, -1.0),      // REAR_R
            new MotorMixRule(1.0, 1.0, 0.414178, -1.0),      // MIDREAR_L
        ],
        servoMixer: []
    },     // 13
    {
        name: 'Airplane',
        model: 'custom',
        image: 'airplane',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 0.0, 0.0),
            new MotorMixRule(1.0, 0.0, 0.0, 0.0),
        ],
        servoMixer: [
            new ServoMixRule(SERVO_FLAPPERON_1, INPUT_STABILIZED_ROLL,  100, 0),
            new ServoMixRule(SERVO_FLAPPERON_2, INPUT_STABILIZED_ROLL,  100, 0),
            new ServoMixRule(SERVO_FLAPPERON_1, INPUT_FEATURE_FLAPS,    100, 0),
            new ServoMixRule(SERVO_FLAPPERON_2, INPUT_FEATURE_FLAPS,   -100, 0),
            new ServoMixRule(SERVO_RUDDER,      INPUT_STABILIZED_YAW,   100, 0),
            new ServoMixRule(SERVO_ELEVATOR,    INPUT_STABILIZED_PITCH, 100, 0)
        ]
    },           // 14
    {
        name: 'Heli 120',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: false,
        enabled: false,
        motorMixer: [],
        servoMixer: []
    },             // 15
    {
        name: 'Heli 90',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: false,
        enabled: false,
        motorMixer: [],
        servoMixer: []
    },              // 16
    {
        name: 'V-tail Quad',
        model: 'quad_vtail',
        image: 'vtail_quad',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, -0.58, 0.58, 1.0),        // REAR_R
            new MotorMixRule(1.0, -0.46, -0.39, -0.5),       // FRONT_R
            new MotorMixRule(1.0, 0.58, 0.58, -1.0),        // REAR_L
            new MotorMixRule(1.0, 0.46, -0.39, 0.5),         // FRONT_L
        ],
        servoMixer: []
    },  // 17
    {
        name: 'Hex H',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, -1.0, 1.0, -1.0),     // REAR_R
            new MotorMixRule(1.0, -1.0, -1.0, 1.0),     // FRONT_R
            new MotorMixRule(1.0, 1.0, 1.0, 1.0),     // REAR_L
            new MotorMixRule(1.0, 1.0, -1.0, -1.0),     // FRONT_L
            new MotorMixRule(1.0, 0.0, 0.0, 0.0),     // RIGHT
            new MotorMixRule(1.0, 0.0, 0.0, 0.0),     // LEFT
        ],
        servoMixer: []
    },                // 18
    {
        name: 'PPM to SERVO',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: false,
        enabled: false,
        motorMixer: [],
        servoMixer: []
    },         // 19
    {
        name: 'Dualcopter',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: false,
        enabled: false,
        motorMixer: [],
        servoMixer: []
    },           // 20
    {
        name: 'Singlecopter',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: false,
        enabled: false,
        motorMixer: [],
        servoMixer: []
    },         // 21
    {
        name: 'A-tail Quad',
        model: 'quad_atail',
        image: 'atail_quad',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 1.0, 1.0),          // REAR_R
            new MotorMixRule(1.0, -1.0, -1.0, 0.0),        // FRONT_R
            new MotorMixRule(1.0, 0.0, 1.0, -1.0),         // REAR_L
            new MotorMixRule(1.0, 1.0, -1.0, -0.0),        // FRONT_L
        ],
        servoMixer: []
    },  // 22
    {
        name: 'Custom',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: true,
        enabled: false,
        motorMixer: [],
        servoMixer: []
    },               // 23
    {
        name: 'Custom Airplane',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: true,
        enabled: false,
        motorMixer: [],
        servoMixer: []
    },      // 24
    {
        name: 'Custom Tricopter',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: true,
        enabled: false,
        motorMixer: [],
        servoMixer: []
    }      // 25
];