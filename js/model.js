'use strict';

// generate mixer
var mixerList = [
    {name: 'Tricopter', model: 'tricopter', image: 'tri', hasCustomServoMixer: false},            // 1
    {name: 'Quad +', model: 'quad_x', image: 'quad_p', hasCustomServoMixer: false},               // 2
    {name: 'Quad X', model: 'quad_x', image: 'quad_x', hasCustomServoMixer: false},               // 3
    {name: 'Bicopter', model: 'custom', image: 'bicopter', hasCustomServoMixer: false},           // 4
    {name: 'Gimbal', model: 'custom', image: 'custom', hasCustomServoMixer: false},               // 5
    {name: 'Y6', model: 'y6', image: 'y6', hasCustomServoMixer: false},                           // 6
    {name: 'Hex +', model: 'hex_plus', image: 'hex_p', hasCustomServoMixer: false},               // 7
    {name: 'Flying Wing', model: 'custom', image: 'flying_wing', hasCustomServoMixer: false},     // 8
    {name: 'Y4', model: 'y4', image: 'y4', hasCustomServoMixer: false},                           // 9
    {name: 'Hex X', model: 'hex_x', image: 'hex_x', hasCustomServoMixer: false},                  // 10
    {name: 'Octo X8', model: 'custom', image: 'octo_x8', hasCustomServoMixer: false},             // 11
    {name: 'Octo Flat +', model: 'custom', image: 'octo_flat_p', hasCustomServoMixer: false},     // 12
    {name: 'Octo Flat X', model: 'custom', image: 'octo_flat_x', hasCustomServoMixer: false},     // 13
    {name: 'Airplane', model: 'custom', image: 'airplane', hasCustomServoMixer: false},           // 14
    {name: 'Heli 120', model: 'custom', image: 'custom', hasCustomServoMixer: false},             // 15
    {name: 'Heli 90', model: 'custom', image: 'custom', hasCustomServoMixer: false},              // 16
    {name: 'V-tail Quad', model: 'quad_vtail', image: 'vtail_quad', hasCustomServoMixer: false},  // 17
    {name: 'Hex H', model: 'custom', image: 'custom', hasCustomServoMixer: false},                // 18
    {name: 'PPM to SERVO', model: 'custom', image: 'custom', hasCustomServoMixer: false},         // 19
    {name: 'Dualcopter', model: 'custom', image: 'custom', hasCustomServoMixer: false},           // 20
    {name: 'Singlecopter', model: 'custom', image: 'custom', hasCustomServoMixer: false},         // 21
    {name: 'A-tail Quad', model: 'quad_atail', image: 'atail_quad', hasCustomServoMixer: false},  // 22
    {name: 'Custom', model: 'custom', image: 'custom', hasCustomServoMixer: true},               // 23
    {name: 'Custom Airplane', model: 'custom', image: 'custom', hasCustomServoMixer: true},      // 24
    {name: 'Custom Tricopter', model: 'custom', image: 'custom', hasCustomServoMixer: true}      // 25
];
