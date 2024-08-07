'use strict';

const MotorMixRule = require('./motorMixRule');
const ServoMixRule = require('./servoMixRule');

const SERVO = {
    GIMBAL_PITCH: 0,
    GIMBAL_ROLL: 1,
    ELEVATOR: 1,
    ELEVON_1: 1,
    ELEVON_2: 2,
    FLAPPERON_1: 2,
    FLAPPERON_2: 3,
    RUDDER: 4,
    BICOPTER_LEFT: 4,
    BICOPTER_RIGHT: 5,
    DUALCOPTER_LEFT: 4,
    DUALCOPTER_RIGHT: 5,
    SINGLECOPTER_1: 3,
    SINGLECOPTER_2: 4,
    SINGLECOPTER_3: 5,
    SINGLECOPTER_4: 6
}

const INPUT = {
    STABILIZED_ROLL: 0,
    STABILIZED_PITCH: 1,
    STABILIZED_YAW: 2,
    STABILIZED_THROTTLE: 3,
    RC_ROLL: 4,
    RC_PITCH: 5,
    RC_YAW: 6,
    RC_THROTTLE: 7,
    RC_AUX1: 8,
    RC_AUX2: 9,
    RC_AUX3: 10,
    RC_AUX4: 11,
    GIMBAL_PITCH: 12,
    GIMBAL_ROLL: 13,
    FEATURE_FLAPS: 14
} 
    
 const STABILIZED = {
    ROLL_POSITIVE: 23,
    ROLL_NEGATIVE: 24,
    PITCH_POSITIVE: 25,
    PITCH_NEGATIVE: 26,
    YAW_POSITIVE: 27,
    YAW_NEGATIVE: 28
 }

const PLATFORM = {
    MULTIROTOR: 0,
    AIRPLANE:   1,
    HELICOPTER: 2,
    TRICOPTER:  3,
    ROVER:      4,
    BOAT:       5
}

// generate mixer
const mixerList = [
    // ** Multirotor
    {
        id: 1,
        name: 'Tricopter',
        model: 'tricopter',
        image: 'tri',
        enabled: true,
        legacy: true,
        platform: PLATFORM.TRICOPTER,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 1.333333, 0.0),     // REAR
            new MotorMixRule(1.0, -1.0, -0.666667, 0.0),   // RIGHT
            new MotorMixRule(1.0, 1.0, -0.666667, 0.0),    // LEFT
        ],
        servoMixer: [
            new ServoMixRule(SERVO.RUDDER, INPUT.STABILIZED_YAW, 100, 0),
        ]
    }, // 1
    {
        id: 3,
        name: 'Quad X',
        model: 'quad_x',
        image: 'quad_x',
        enabled: true,
        legacy: true,
        platform: PLATFORM.MULTIROTOR,
        motorMixer: [
            new MotorMixRule(1.0, -1.0, 1.0, -1.0),          // REAR_R
            new MotorMixRule(1.0, -1.0, -1.0, 1.0),          // FRONT_R
            new MotorMixRule(1.0, 1.0, 1.0, 1.0),            // REAR_L
            new MotorMixRule(1.0, 1.0, -1.0, -1.0),          // FRONT_L
        ],
        servoMixer: []
    }, // 3
    {
        id: 2,
        name: 'Quad +',
        model: 'quad_x',
        image: 'quad_p',
        enabled: true,
        legacy: true,
        platform: PLATFORM.MULTIROTOR,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 1.0, -1.0),          // REAR
            new MotorMixRule(1.0, -1.0, 0.0, 1.0),          // RIGHT
            new MotorMixRule(1.0, 1.0, 0.0, 1.0),           // LEFT
            new MotorMixRule(1.0, 0.0, -1.0, -1.0),         // FRONT
        ],
        servoMixer: []
    }, // 2
    {
        id: 4,
        name: 'Bicopter',
        model: 'custom',
        image: 'bicopter',
        enabled: false,
        legacy: true,
        platform: PLATFORM.MULTIROTOR,
        motorMixer: [],
        servoMixer: []
    }, // 4
    {
        id: 6,
        name: 'Y6',
        model: 'y6',
        image: 'y6',
        enabled: true,
        legacy: true,
        platform: PLATFORM.MULTIROTOR,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 1.333333, 1.0),      // REAR
            new MotorMixRule(1.0, -1.0, -0.666667, -1.0),   // RIGHT
            new MotorMixRule(1.0, 1.0, -0.666667, -1.0),    // LEFT
            new MotorMixRule(1.0, 0.0, 1.333333, -1.0),     // UNDER_REAR
            new MotorMixRule(1.0, -1.0, -0.666667, 1.0),    // UNDER_RIGHT
            new MotorMixRule(1.0, 1.0, -0.666667, 1.0),     // UNDER_LEFT
        ],
        servoMixer: []
    }, // 6
    {
        id: 7,
        name: 'Hex +',
        model: 'hex_plus',
        image: 'hex_p',
        enabled: true,
        legacy: true,
        platform: PLATFORM.MULTIROTOR,
        motorMixer: [
            new MotorMixRule(1.0, -0.866025, 0.5, 1.0),     // REAR_R
            new MotorMixRule(1.0, -0.866025, -0.5, -1.0),   // FRONT_R
            new MotorMixRule(1.0, 0.866025, 0.5, 1.0),      // REAR_L
            new MotorMixRule(1.0, 0.866025, -0.5, -1.0),    // FRONT_L
            new MotorMixRule(1.0, 0.0, -1.0, 1.0),          // FRONT
            new MotorMixRule(1.0, 0.0, 1.0, -1.0),          // REAR
        ],
        servoMixer: []
    }, // 7
    {
        id: 9,
        name: 'Y4',
        model: 'y4',
        image: 'y4',
        enabled: true,
        legacy: true,
        platform: PLATFORM.MULTIROTOR,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 1.0, -1.0),          // REAR_TOP CW
            new MotorMixRule(1.0, -1.0, -1.0, 0.0),          // FRONT_R CCW
            new MotorMixRule(1.0, 0.0, 1.0, 1.0),          // REAR_BOTTOM CCW
            new MotorMixRule(1.0, 1.0, -1.0, 0.0),          // FRONT_L CW
        ],
        servoMixer: []
    }, // 9
    {
        id: 10,
        name: 'Hex X',
        model: 'hex_x',
        image: 'hex_x',
        enabled: true,
        legacy: true,
        platform: PLATFORM.MULTIROTOR,
        motorMixer: [
            new MotorMixRule(1.0, -0.5, 0.866025, 1.0),     // REAR_R
            new MotorMixRule(1.0, -0.5, -0.866025, 1.0),     // FRONT_R
            new MotorMixRule(1.0, 0.5, 0.866025, -1.0),     // REAR_L
            new MotorMixRule(1.0, 0.5, -0.866025, -1.0),     // FRONT_L
            new MotorMixRule(1.0, -1.0, 0.0, -1.0),     // RIGHT
            new MotorMixRule(1.0, 1.0, 0.0, 1.0),     // LEFT
        ],
        servoMixer: []
    }, // 10
    {
        id: 11,
        name: 'Octo X8',
        model: 'custom',
        image: 'octo_x8',
        enabled: true,
        legacy: true,
        platform: PLATFORM.MULTIROTOR,
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
    }, // 11
    {
        id: 12,
        name: 'Octo Flat +',
        model: 'custom',
        image: 'octo_flat_p',
        enabled: true,
        legacy: true,
        platform: PLATFORM.MULTIROTOR,
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
    }, // 12
    {
        id: 13,
        name: 'Octo Flat X',
        model: 'custom',
        image: 'octo_flat_x',
        enabled: true,
        legacy: true,
        platform: PLATFORM.MULTIROTOR,
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
    }, // 13
    {
        id: 17,
        name: 'V-tail Quad',
        model: 'quad_vtail',
        image: 'vtail_quad',
        enabled: true,
        legacy: true,
        platform: PLATFORM.MULTIROTOR,
        motorMixer: [
            new MotorMixRule(1.0, -0.58, 0.58, 1.0),        // REAR_R
            new MotorMixRule(1.0, -0.46, -0.39, -0.5),       // FRONT_R
            new MotorMixRule(1.0, 0.58, 0.58, -1.0),        // REAR_L
            new MotorMixRule(1.0, 0.46, -0.39, 0.5),         // FRONT_L
        ],
        servoMixer: []
    },  // 17
    {
        id: 18,
        name: 'Hex H',
        model: 'custom',
        image: 'custom',
        enabled: true,
        legacy: true,
        platform: PLATFORM.MULTIROTOR,
        motorMixer: [
            new MotorMixRule(1.0, -1.0, 1.0, -1.0),     // REAR_R
            new MotorMixRule(1.0, -1.0, -1.0, 1.0),     // FRONT_R
            new MotorMixRule(1.0, 1.0, 1.0, 1.0),     // REAR_L
            new MotorMixRule(1.0, 1.0, -1.0, -1.0),     // FRONT_L
            new MotorMixRule(1.0, 0.0, 0.0, 0.0),     // RIGHT
            new MotorMixRule(1.0, 0.0, 0.0, 0.0),     // LEFT
        ],
        servoMixer: []
    }, // 18
    {
        id: 20,
        name: 'Dualcopter',
        model: 'custom',
        image: 'custom',
        enabled: false,
        legacy: true,
        platform: PLATFORM.MULTIROTOR,
        motorMixer: [],
        servoMixer: []
    }, // 20
    {
        id: 21,
        name: 'Singlecopter',
        model: 'custom',
        image: 'custom',
        enabled: false,
        legacy: true,
        platform: PLATFORM.MULTIROTOR,
        motorMixer: [],
        servoMixer: []
    }, // 21
    {
        id: 22,
        name: 'A-tail Quad',
        model: 'quad_atail',
        image: 'atail_quad',
        enabled: true,
        legacy: true,
        platform: PLATFORM.MULTIROTOR,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 1.0, 1.0),          // REAR_R
            new MotorMixRule(1.0, -1.0, -1.0, 0.0),        // FRONT_R
            new MotorMixRule(1.0, 0.0, 1.0, -1.0),         // REAR_L
            new MotorMixRule(1.0, 1.0, -1.0, -0.0),        // FRONT_L
        ],
        servoMixer: []
    },  // 22
    {
        id: 23,
        name: 'Custom',
        model: 'custom',
        image: 'custom',
        enabled: false,
        legacy: true,
        platform: PLATFORM.MULTIROTOR,
        motorMixer: [],
        servoMixer: []
    }, // 23
    {
        id: 25,
        name: 'Custom Tricopter',
        model: 'custom',
        image: 'custom',
        enabled: false,
        legacy: true,
        platform: PLATFORM.TRICOPTER,
        motorMixer: [],
        servoMixer: []
    }, // 25

    // ** Fixed Wing ** 
    {
        id: 8,
        name: 'Flying Wing',
        model: 'flying_wing',
        image: 'flying_wing',
        imageOutputsNumbers: [
            {input: INPUT.STABILIZED_ROLL, top: 123, left: 18, colour: "#ff0000"},
            {input: INPUT.STABILIZED_ROLL, top: 123, left: 134, colour: "#00e000"},
            {input: INPUT.STABILIZED_THROTTLE, top:93, left:71, colour: "#000000"},
        ],
        enabled: true,
        legacy: true,
        platform: PLATFORM.AIRPLANE,
        motorStopOnLow: true,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 0.0, 0.0),
        ],
        servoMixer: [
            new ServoMixRule(SERVO.ELEVON_1, INPUT.STABILIZED_ROLL,  50, 0),
            new ServoMixRule(SERVO.ELEVON_1, INPUT.STABILIZED_PITCH, 50, 0),
            new ServoMixRule(SERVO.ELEVON_2, INPUT.STABILIZED_ROLL, -50, 0),
            new ServoMixRule(SERVO.ELEVON_2, INPUT.STABILIZED_PITCH, 50, 0),
        ]
    }, // 8
    {
        id: 27,
        name: 'Flying Wing with differential thrust',
        model: 'flying_wing',
        image: 'flying_wing',
        imageOutputsNumbers: [
            {input: INPUT.STABILIZED_ROLL, top: 123, left: 18, colour: "#ff0000"},
            {input: INPUT.STABILIZED_ROLL, top: 123, left: 134, colour: "#00e000"},
            {input: INPUT.STABILIZED_THROTTLE, top:93, left:71, colour: "#000000"},
        ],
        enabled: true,
        legacy: false,
        platform: PLATFORM.AIRPLANE,
        motorStopOnLow: true,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 0.0, 0.1),
            new MotorMixRule(1.0, 0.0, 0.0, -0.1)
        ],
        servoMixer: [
            new ServoMixRule(SERVO.ELEVON_1, INPUT.STABILIZED_ROLL,  50, 0),
            new ServoMixRule(SERVO.ELEVON_1, INPUT.STABILIZED_PITCH, 50, 0),
            new ServoMixRule(SERVO.ELEVON_2, INPUT.STABILIZED_ROLL, -50, 0),
            new ServoMixRule(SERVO.ELEVON_2, INPUT.STABILIZED_PITCH, 50, 0),
        ]
    }, // 27
    {
        id: 14,
        name: 'Airplane',
        model: 'twin_plane',
        image: 'airplane',
        imageOutputsNumbers: [
            {input: INPUT.STABILIZED_PITCH, top: 151, left: 126, colour: "#ff7f00"},
            {input: INPUT.STABILIZED_ROLL, top: 96, left: 18, colour: "#ff0000"},
            {input: INPUT.STABILIZED_ROLL, top: 96, left: 134, colour: "#00e000"},
            {input: INPUT.STABILIZED_YAW, top: 126, left: 52, colour: "#00a6ff"},
            {input: INPUT.STABILIZED_THROTTLE, top:5, left:71, colour: "#000000"},
        ],
        enabled: true,
        legacy: true,
        platform: PLATFORM.AIRPLANE,
        motorStopOnLow: true,
        hasFlaps: true,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 0.0, 0.0),
        ],
        servoMixer: [
            new ServoMixRule(SERVO.ELEVATOR,    INPUT.STABILIZED_PITCH, 100, 0),
            new ServoMixRule(SERVO.FLAPPERON_1, INPUT.STABILIZED_ROLL,  100, 0),
            /*new ServoMixRule(SERVO.FLAPPERON_1, INPUT.FEATURE_FLAPS,    100, 0),*/
            new ServoMixRule(SERVO.FLAPPERON_2, INPUT.STABILIZED_ROLL,  100, 0),
            /*new ServoMixRule(SERVO.FLAPPERON_2, INPUT.FEATURE_FLAPS,   -100, 0),*/
            new ServoMixRule(SERVO.RUDDER,      INPUT.STABILIZED_YAW,   100, 0),
        ]
    }, // 14
    {
        id: 26,
        name: 'Airplane with differential thrust',
        model: 'twin_plane',
        image: 'airplane',
        imageOutputsNumbers: [
            {input: INPUT.STABILIZED_PITCH, top: 151, left: 126, colour: "#ff7f00"},
            {input: INPUT.STABILIZED_ROLL, top: 96, left: 18, colour: "#ff0000"},
            {input: INPUT.STABILIZED_ROLL, top: 96, left: 134, colour: "#00e000"},
            {input: INPUT.STABILIZED_YAW, top: 126, left: 52, colour: "#00a6ff"},
            {input: INPUT.STABILIZED_THROTTLE, top:5, left:71, colour: "#000000"},
        ],
        enabled: true,
        legacy: false,
        platform: PLATFORM.AIRPLANE,
        motorStopOnLow: true,
        hasFlaps: true,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 0.0, 0.3),
            new MotorMixRule(1.0, 0.0, 0.0, -0.3)
        ],
        servoMixer: [
            new ServoMixRule(SERVO.ELEVATOR,    INPUT.STABILIZED_PITCH, 100, 0),
            new ServoMixRule(SERVO.FLAPPERON_1, INPUT.STABILIZED_ROLL,  100, 0),
            /*new ServoMixRule(SERVO.FLAPPERON_1, INPUT.FEATURE_FLAPS,    100, 0),*/
            new ServoMixRule(SERVO.FLAPPERON_2, INPUT.STABILIZED_ROLL,  100, 0),
            /*new ServoMixRule(SERVO.FLAPPERON_2, INPUT.FEATURE_FLAPS,   -100, 0),*/
            new ServoMixRule(SERVO.RUDDER,      INPUT.STABILIZED_YAW,   100, 0),
        ]
    }, // 26
    {
        id: 28,
        name: 'Airplane V-tail',
        model: 'vtail_plane',
        image: 'airplane_vtail',
        imageOutputsNumbers: [
            {input: INPUT.STABILIZED_ROLL, top: 96, left: 18, colour: "#ff0000"},
            {input: INPUT.STABILIZED_ROLL, top: 96, left: 134, colour: "#00e000"},
            {input: INPUT.STABILIZED_PITCH, top: 154, left: 20, colour: "#ff7f00"},
            {input: INPUT.STABILIZED_PITCH, top: 154, left: 132, colour: "#00a6ff"},
            {input: INPUT.STABILIZED_THROTTLE, top:5, left:71, colour: "#000000"},
        ],
        enabled: true,
        legacy: false,
        platform: PLATFORM.AIRPLANE,
        motorStopOnLow: true,
        hasFlaps: true,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 0.0, 0.0),
        ],
        servoMixer: [
            new ServoMixRule(1, INPUT.STABILIZED_ROLL,  100, 0),
            /*new ServoMixRule(1, INPUT.FEATURE_FLAPS,    100, 0),*/
            new ServoMixRule(2, INPUT.STABILIZED_ROLL,  100, 0),
            /*new ServoMixRule(2, INPUT.FEATURE_FLAPS,    100, 0),*/
            new ServoMixRule(3, INPUT.STABILIZED_PITCH, 50, 0),
            new ServoMixRule(3, INPUT.STABILIZED_YAW,   -50, 0),
            new ServoMixRule(4, INPUT.STABILIZED_PITCH, -50, 0),
            new ServoMixRule(4, INPUT.STABILIZED_YAW,   -50, 0)
        ]
    }, // 28
    {
        id: 34,
        name: 'Airplane V-tail with differential thrust',
        model: 'vtail_plane',
        image: 'airplane_vtail',
        imageOutputsNumbers: [
            {input: INPUT.STABILIZED_ROLL, top: 96, left: 18, colour: "#ff0000"},
            {input: INPUT.STABILIZED_ROLL, top: 96, left: 134, colour: "#00e000"},
            {input: INPUT.STABILIZED_PITCH, top: 154, left: 20, colour: "#ff7f00"},
            {input: INPUT.STABILIZED_PITCH, top: 154, left: 132, colour: "#00a6ff"},
            {input: INPUT.STABILIZED_THROTTLE, top:5, left:71, colour: "#000000"},
        ],
        enabled: true,
        legacy: false,
        platform: PLATFORM.AIRPLANE,
        motorStopOnLow: true,
        hasFlaps: true,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 0.0, 0.3),
            new MotorMixRule(1.0, 0.0, 0.0, -0.3)
        ],
        servoMixer: [
            new ServoMixRule(1, INPUT.STABILIZED_ROLL,  100, 0),
            /*new ServoMixRule(1, INPUT.FEATURE_FLAPS,    100, 0),*/
            new ServoMixRule(2, INPUT.STABILIZED_ROLL,  100, 0),
            /*new ServoMixRule(2, INPUT.FEATURE_FLAPS,    100, 0),*/
            new ServoMixRule(3, INPUT.STABILIZED_PITCH, 50, 0),
            new ServoMixRule(3, INPUT.STABILIZED_YAW,   -50, 0),
            new ServoMixRule(4, INPUT.STABILIZED_PITCH, -50, 0),
            new ServoMixRule(4, INPUT.STABILIZED_YAW,   -50, 0)
        ]
    }, // 34
    {
        id: 29,
        name: 'Airplane V-tail (single aileron servo)',
        model: 'vtail_single_servo_plane',
        image: 'airplane_vtail_single',
        imageOutputsNumbers: [
            {input: INPUT.STABILIZED_ROLL, top: 96, left: 18, colour: "#ff7f00"},
            {input: INPUT.STABILIZED_PITCH, top: 154, left: 20, colour: "#ff0000"},
            {input: INPUT.STABILIZED_PITCH, top: 154, left: 132, colour: "#00e000"},
            {input: INPUT.STABILIZED_THROTTLE, top:5, left:71, colour: "#000000"},
        ],
        enabled: true,
        legacy: false,
        platform: PLATFORM.AIRPLANE,
        motorStopOnLow: true,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 0.0, 0.0),
        ],
        servoMixer: [
            new ServoMixRule(1, INPUT.STABILIZED_ROLL,  100, 0),
            new ServoMixRule(2, INPUT.STABILIZED_PITCH, 50, 0),
            new ServoMixRule(2, INPUT.STABILIZED_YAW,   -50, 0),
            new ServoMixRule(3, INPUT.STABILIZED_PITCH, -50, 0),
            new ServoMixRule(3, INPUT.STABILIZED_YAW,   -50, 0),
        ]
    }, //29
    {
        id: 30,
        name: 'Airplane without rudder',
        model: 'rudderless_plane',
        image: 'airplane_norudder',
        imageOutputsNumbers: [
            {input: INPUT.STABILIZED_PITCH, top: 151, left: 126, colour: "#ff7f00"},
            {input: INPUT.STABILIZED_ROLL, top: 96, left: 18, colour: "#ff0000"},
            {input: INPUT.STABILIZED_ROLL, top: 96, left: 134, colour: "#00e000"},
            {input: INPUT.STABILIZED_THROTTLE, top:5, left:71, colour: "#000000"},
        ],
        enabled: true,
        legacy: false,
        platform: PLATFORM.AIRPLANE,
        hasFlaps: true,
        motorStopOnLow: true,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 0.0, 0.0),
        ],
        servoMixer: [
            new ServoMixRule(SERVO.ELEVATOR,    INPUT.STABILIZED_PITCH, 100, 0),
            new ServoMixRule(SERVO.FLAPPERON_1, INPUT.STABILIZED_ROLL,  100, 0),
            /*new ServoMixRule(SERVO.FLAPPERON_1, INPUT.FEATURE_FLAPS,    100, 0),*/
            new ServoMixRule(SERVO.FLAPPERON_2, INPUT.STABILIZED_ROLL,  100, 0),
            /*new ServoMixRule(SERVO.FLAPPERON_2, INPUT.FEATURE_FLAPS,    100, 0),*/
        ]
    }, // 30
    {
        id: 24,
        name: 'Custom Airplane',
        model: 'twin_plane',
        image: 'airplane',
        imageOutputsNumbers: [
            {input: INPUT.STABILIZED_PITCH, top: 151, left: 126, colour: "#ff7f00"},
            {input: INPUT.STABILIZED_ROLL, top: 96, left: 18, colour: "#ff0000"},
            {input: INPUT.STABILIZED_ROLL, top: 96, left: 134, colour: "#00e000"},
            {input: INPUT.STABILIZED_YAW, top: 126, left: 52, colour: "#00a6ff"},
            {input: INPUT.STABILIZED_THROTTLE, top:5, left:71, colour: "#000000"},
        ],
        enabled: false,
        legacy: true,
        platform: PLATFORM.AIRPLANE,
        motorStopOnLow: true,
        motorMixer: [],
        servoMixer: []
    }, // 24

    // ** Helicopter **
    {
        id: 15,
        name: 'Heli 120',
        model: 'custom',
        image: 'custom',
        enabled: false,
        legacy: true,
        platform: PLATFORM.HELICOPTER,
        motorMixer: [],
        servoMixer: []
    }, // 15
    {
        id: 16,
        name: 'Heli 90',
        model: 'custom',
        image: 'custom',
        enabled: false,
        legacy: true,
        platform: PLATFORM.HELICOPTER,
        motorMixer: [],
        servoMixer: []
    }, // 16

    // ** Other platforms **
    {
        id: 31,
        name: 'Rover',
        model: 'custom',
        image: 'custom',
        enabled: true,
        legacy: false,
        platform: PLATFORM.ROVER,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 0.0, 0.0),
        ],
        servoMixer: [
            new ServoMixRule(3, INPUT.STABILIZED_YAW,  100, 0),
        ]
    },
    {
        id: 32,
        name: 'Boat',
        model: 'custom',
        image: 'custom',
        enabled: true,
        legacy: false,
        platform: PLATFORM.BOAT,
        motorMixer: [
            new MotorMixRule(1.0, 0.0, 0.0, 0.0),
        ],
        servoMixer: [
            new ServoMixRule(3, INPUT.STABILIZED_YAW,  100, 0),
        ]
    },
];

const platformList = [
    {
        id: 0,
        name: "Multirotor",
        enabled: true,
        flapsPossible: false
    },
    {
        id: 1,
        name: "Airplane",
        enabled: true,
        flapsPossible: true
    },
    {
        id: 2,
        name: "Helicopter",
        enabled: false,
        flapsPossible: false
    },
    {
        id: 3,
        name: "Tricopter",
        enabled: true,
        flapsPossible: false
    },
    {
        id: 4,
        name: "Rover",
        enabled: true,
        flapsPossible: false
    },
    {
        id: 5,
        name: "Boat",
        enabled: true,
        flapsPossible: false
    }
];

 var mixer = (function (mixerList) {
    let publicScope = {},
        privateScope = {};

    publicScope.getLegacyList = function () {
        let retVal = [];
        for (const i in mixerList) {
            if (mixerList.hasOwnProperty(i)) {
                let element = mixerList[i];
                if (element.legacy) {
                    retVal.push(element);
                }
            }
        }
        return retVal;
    };

    publicScope.getList = function () {
        let retVal = [];
        for (const i in mixerList) {
            if (mixerList.hasOwnProperty(i)) {
                let element = mixerList[i];
                if (element.enabled) {
                    retVal.push(element);
                }
            }
        }
        return retVal;
    };

    publicScope.getById = function (id) {
        for (const i in mixerList) {
            if (mixerList.hasOwnProperty(i)) {
                let element = mixerList[i];
                if (element.id === id) {
                    return element;
                }
            }
        }
        return false;
    }

    publicScope.getByPlatform = function (platform) {
        let retVal = [];
        for (const i in mixerList) {
            if (mixerList.hasOwnProperty(i)) {
                let element = mixerList[i];
                if (element.platform === platform && element.enabled) {
                    retVal.push(element);
                }
            }
        }
        return retVal;
    };

    publicScope.loadServoRules = function (FC, mixer) {
        FC.SERVO_RULES.flush();

        for (const i in mixer.servoMixer) {
            if (mixer.servoMixer.hasOwnProperty(i)) {
                const r = mixer.servoMixer[i];
                FC.SERVO_RULES.put(
                    new ServoMixRule(
                        r.getTarget(),
                        r.getInput(),
                        r.getRate(),
                        r.getSpeed()
                    )
                );
            }
        }
    }

    publicScope.loadMotorRules = function (FC, mixer) {
        FC.MOTOR_RULES.flush();

        for (const i in mixer.motorMixer) {
            if (mixer.motorMixer.hasOwnProperty(i)) {
                const r = mixer.motorMixer[i];
                FC.MOTOR_RULES.put(
                    new MotorMixRule(
                        r.getThrottle(),
                        r.getRoll(),
                        r.getPitch(),
                        r.getYaw()
                    )
                );
            }
        }
    }

    publicScope.countSurfaceType = function(mixer, surface) {
        let count = 0;

        for (const i in mixer.servoMixer) {
            if (mixer.servoMixer.hasOwnProperty(i)) {
                const s = mixer.servoMixer[i];

                if (s.getInput() === surface) {
                    count++;
                }
            }
        }

        return count;
    }

    return publicScope;
})(mixerList);

var platform = (function (platforms) {
    let publicScope = {},
        privateScope = {};

    publicScope.getList = function () {
        let retVal = [];
        for (const i in platforms) {
            if (platforms.hasOwnProperty(i)) {
                let element = platforms[i];
                if (element.enabled) {
                    retVal.push(element);
                }
            }
        }
        return retVal;
    };

    publicScope.getById = function (id) {
        for (const i in platforms) {
            if (platforms.hasOwnProperty(i)) {
                let element = platforms[i];
                if (element.id === id) {
                    return element;
                }
            }
        }
        return false;
    }

    return publicScope;
})(platformList);

module.exports = { mixer, platform, PLATFORM, SERVO, INPUT, STABILIZED };
