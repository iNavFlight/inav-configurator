'use strict';

// generate mixer
const mixerList = [
    {
        name: 'Tricopter',
        model: 'tricopter',
        image: 'tri',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer:  [
            new MotorMixRule(1.0,  0.0,  1.333333,  0.0),     // REAR
            new MotorMixRule(1.0, -1.0, -0.666667,  0.0),     // RIGHT
            new MotorMixRule(1.0,  1.0, -0.666667,  0.0),     // LEFT
        ]
    },            // 1
    {
        name: 'Quad +',
        model: 'quad_x',
        image: 'quad_p',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0,  0.0,  1.0, -1.0),          // REAR
            new MotorMixRule(1.0, -1.0,  0.0,  1.0),          // RIGHT
            new MotorMixRule(1.0,  1.0,  0.0,  1.0),          // LEFT
            new MotorMixRule(1.0,  0.0, -1.0, -1.0),          // FRONT
        ]
    },               // 2
    {
        name: 'Quad X',
        model: 'quad_x',
        image: 'quad_x',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, -1.0,  1.0, -1.0),          // REAR_R
            new MotorMixRule(1.0, -1.0, -1.0,  1.0),          // FRONT_R
            new MotorMixRule(1.0,  1.0,  1.0,  1.0),          // REAR_L
            new MotorMixRule(1.0,  1.0, -1.0, -1.0),          // FRONT_L
        ]
    },               // 3
    {
        name: 'Bicopter',
        model: 'custom',
        image: 'bicopter',
        hasCustomServoMixer: false,
        enabled: false,
        motorMixer: []
    },           // 4
    {
        name: 'Gimbal',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: false,
        enabled: false,
        motorMixer: []
    },               // 5
    {
        name: 'Y6',
        model: 'y6',
        image: 'y6',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0,  0.0,  1.333333,  1.0),     // REAR
            new MotorMixRule(1.0, -1.0, -0.666667, -1.0),     // RIGHT
            new MotorMixRule(1.0,  1.0, -0.666667, -1.0),     // LEFT
            new MotorMixRule(1.0,  0.0,  1.333333, -1.0),     // UNDER_REAR
            new MotorMixRule(1.0, -1.0, -0.666667,  1.0),     // UNDER_RIGHT
            new MotorMixRule(1.0,  1.0, -0.666667,  1.0),     // UNDER_LEFT
        ]
    },                           // 6
    {
        name: 'Hex +',
        model: 'hex_plus',
        image: 'hex_p',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, -0.866025,  0.5,  1.0),     // REAR_R
            new MotorMixRule(1.0, -0.866025, -0.5, -1.0),     // FRONT_R
            new MotorMixRule(1.0,  0.866025,  0.5,  1.0),     // REAR_L
            new MotorMixRule(1.0,  0.866025, -0.5, -1.0),     // FRONT_L
            new MotorMixRule(1.0,  0.0,      -1.0,  1.0),     // FRONT
            new MotorMixRule(1.0,  0.0,       1.0, -1.0),     // REAR
        ]
    },               // 7
    {
        name: 'Flying Wing',
        model: 'custom',
        image: 'flying_wing',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0,  0.0,  0.0, 0.0),
            new MotorMixRule(1.0,  0.0,  0.0, 0.0),
        ]
    },     // 8
    {
        name: 'Y4',
        model: 'y4',
        image: 'y4',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0,  0.0,  1.0, -1.0),          // REAR_TOP CW
            new MotorMixRule(1.0, -1.0, -1.0,  0.0),          // FRONT_R CCW
            new MotorMixRule(1.0,  0.0,  1.0,  1.0),          // REAR_BOTTOM CCW
            new MotorMixRule(1.0,  1.0, -1.0,  0.0),          // FRONT_L CW
        ]
    },                           // 9
    {
        name: 'Hex X',
        model: 'hex_x',
        image: 'hex_x',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, -0.5,  0.866025,  1.0),     // REAR_R
            new MotorMixRule(1.0, -0.5, -0.866025,  1.0),     // FRONT_R
            new MotorMixRule(1.0,  0.5,  0.866025, -1.0),     // REAR_L
            new MotorMixRule(1.0,  0.5, -0.866025, -1.0),     // FRONT_L
            new MotorMixRule(1.0, -1.0,  0.0,      -1.0),     // RIGHT
            new MotorMixRule(1.0,  1.0,  0.0,       1.0),     // LEFT
        ]
    },                  // 10
    {
        name: 'Octo X8',
        model: 'custom',
        image: 'octo_x8',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, -1.0,  1.0, -1.0),          // REAR_R
            new MotorMixRule(1.0, -1.0, -1.0,  1.0),          // FRONT_R
            new MotorMixRule(1.0,  1.0,  1.0,  1.0),          // REAR_L
            new MotorMixRule(1.0,  1.0, -1.0, -1.0),          // FRONT_L
            new MotorMixRule(1.0, -1.0,  1.0,  1.0),          // UNDER_REAR_R
            new MotorMixRule(1.0, -1.0, -1.0, -1.0),          // UNDER_FRONT_R
            new MotorMixRule(1.0,  1.0,  1.0, -1.0),          // UNDER_REAR_L
            new MotorMixRule(1.0,  1.0, -1.0,  1.0),          // UNDER_FRONT_L
        ]
    },             // 11
    {
        name: 'Octo Flat +',
        model: 'custom',
        image: 'octo_flat_p',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0,  0.707107, -0.707107,  1.0),    // FRONT_L
            new MotorMixRule(1.0, -0.707107, -0.707107,  1.0),    // FRONT_R
            new MotorMixRule(1.0, -0.707107,  0.707107,  1.0),    // REAR_R
            new MotorMixRule(1.0,  0.707107,  0.707107,  1.0),    // REAR_L
            new MotorMixRule(1.0,  0.0, -1.0, -1.0),              // FRONT
            new MotorMixRule(1.0, -1.0,  0.0, -1.0),              // RIGHT
            new MotorMixRule(1.0,  0.0,  1.0, -1.0),              // REAR
            new MotorMixRule(1.0,  1.0,  0.0, -1.0),              // LEFT
        ]
    },     // 12
    {
        name: 'Octo Flat X',
        model: 'custom',
        image: 'octo_flat_x',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0,  1.0, -0.414178,  1.0),      // MIDFRONT_L
            new MotorMixRule(1.0, -0.414178, -1.0,  1.0),      // FRONT_R
            new MotorMixRule(1.0, -1.0,  0.414178,  1.0),      // MIDREAR_R
            new MotorMixRule(1.0,  0.414178,  1.0,  1.0),      // REAR_L
            new MotorMixRule(1.0,  0.414178, -1.0, -1.0),      // FRONT_L
            new MotorMixRule(1.0, -1.0, -0.414178, -1.0),      // MIDFRONT_R
            new MotorMixRule(1.0, -0.414178,  1.0, -1.0),      // REAR_R
            new MotorMixRule(1.0,  1.0,  0.414178, -1.0),      // MIDREAR_L
        ]
    },     // 13
    {
        name: 'Airplane',
        model: 'custom',
        image: 'airplane',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0,  0.0,  0.0, 0.0),
            new MotorMixRule(1.0,  0.0,  0.0, 0.0),
        ]
    },           // 14
    {
        name: 'Heli 120',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: false,
        enabled: false,
        motorMixer: []
    },             // 15
    {
        name: 'Heli 90',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: false,
        enabled: false,
        motorMixer: []
    },              // 16
    {
        name: 'V-tail Quad',
        model: 'quad_vtail',
        image: 'vtail_quad',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0,  -0.58,  0.58, 1.0),        // REAR_R
            new MotorMixRule(1.0,  -0.46, -0.39, -0.5),       // FRONT_R
            new MotorMixRule(1.0,  0.58,  0.58, -1.0),        // REAR_L
            new MotorMixRule(1.0,  0.46, -0.39, 0.5),         // FRONT_L
        ]
    },  // 17
    {
        name: 'Hex H',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0, -1.0,  1.0, -1.0),     // REAR_R
            new MotorMixRule(1.0, -1.0, -1.0,  1.0),     // FRONT_R
            new MotorMixRule(1.0,  1.0,  1.0,  1.0),     // REAR_L
            new MotorMixRule(1.0,  1.0, -1.0, -1.0),     // FRONT_L
            new MotorMixRule(1.0,  0.0,  0.0,  0.0),     // RIGHT
            new MotorMixRule(1.0,  0.0,  0.0,  0.0),     // LEFT
        ]
    },                // 18
    {
        name: 'PPM to SERVO',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: false,
        enabled: false,
        motorMixer: []
    },         // 19
    {
        name: 'Dualcopter',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: false,
        enabled: false,
        motorMixer: []
    },           // 20
    {
        name: 'Singlecopter',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: false,
        enabled: false,
        motorMixer: []
    },         // 21
    {
        name: 'A-tail Quad',
        model: 'quad_atail',
        image: 'atail_quad',
        hasCustomServoMixer: false,
        enabled: true,
        motorMixer: [
            new MotorMixRule(1.0,  0.0,  1.0,  1.0),          // REAR_R
            new MotorMixRule(1.0, -1.0, -1.0,  0.0),          // FRONT_R
            new MotorMixRule(1.0,  0.0,  1.0, -1.0),          // REAR_L
            new MotorMixRule(1.0,  1.0, -1.0, -0.0),          // FRONT_L
        ]
    },  // 22
    {
        name: 'Custom',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: true,
        enabled: false,
        motorMixer: []
    },               // 23
    {
        name: 'Custom Airplane',
        model: 'custom',
        image: 'custom',
        hasCustomServoMixer: true,
        enabled: false,
        motorMixer: []
    },      // 24
    {
        name: 'Custom Tricopter', 
        model: 'custom', 
        image: 'custom', 
        hasCustomServoMixer: true,
        enabled: false,
        motorMixer: []
    }      // 25
];