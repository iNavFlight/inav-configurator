'use strict';

var FLIGHT_MODES = [
    {
        boxId: 0,
        boxName: "ARM",
        permanentId: 0
    },
    {
        boxId: 1,
        boxName: "ANGLE",
        permanentId: 1
    },
    {
        boxId: 2,
        boxName: "HORIZON",
        permanentId: 2
    },
    {
        boxId: 3,
        boxName: "NAV ALTHOLD",
        permanentId: 3
    },
    {
        boxId: 4,
        boxName: "HEADING HOLD",
        permanentId: 5
    },
    {
        boxId: 5,
        boxName: "HEADFREE",
        permanentId: 6
    },
    {
        boxId: 6,
        boxName: "HEADADJ",
        permanentId: 7
    },
    {
        boxId: 7,
        boxName: "CAMSTAB",
        permanentId: 8
    },
    {
        boxId: 8,
        boxName: "NAV RTH",
        permanentId: 10
    },
    {
        boxId: 9,
        boxName: "NAV POSHOLD",
        permanentId: 11
    },
    {
        boxId: 10,
        boxName: "MANUAL",
        permanentId: 12
    },
    {
        boxId: 11,
        boxName: "BEEPER",
        permanentId: 13
    },
    {
        boxId: 12,
        boxName: "LEDS OFF",
        permanentId: 15
    },
    {
        boxId: 13,
        boxName: "LIGHTS",
        permanentId: 16
    },
    {
        boxId: 15,
        boxName: "OSD OFF",
        permanentId: 19
    },
    {
        boxId: 16,
        boxName: "TELEMETRY",
        permanentId: 20
    },
    {
        boxId: 28,
        boxName: "AUTO TUNE",
        permanentId: 21
    },
    {
        boxId: 17,
        boxName: "BLACKBOX",
        permanentId: 26
    },
    {
        boxId: 18,
        boxName: "FAILSAFE",
        permanentId: 27
    },
    {
        boxId: 19,
        boxName: "NAV WP",
        permanentId: 28
    },
    {
        boxId: 20,
        boxName: "AIR MODE",
        permanentId: 29
    },
    {
        boxId: 21,
        boxName: "HOME RESET",
        permanentId: 30
    },
    {
        boxId: 22,
        boxName: "GCS NAV",
        permanentId: 31
    },
    {
        boxId: 39,
        boxName: "FPV ANGLE MIX",
        permanentId: 32
    },
    {
        boxId: 24,
        boxName: "SURFACE",
        permanentId: 33
    },
    {
        boxId: 25,
        boxName: "FLAPERON",
        permanentId: 34
    },
    {
        boxId: 26,
        boxName: "TURN ASSIST",
        permanentId: 35
    },
    {
        boxId: 14,
        boxName: "NAV LAUNCH",
        permanentId: 36
    },
    {
        boxId: 27,
        boxName: "SERVO AUTOTRIM",
        permanentId: 37
    },
    {
        boxId: 23,
        boxName: "KILLSWITCH",
        permanentId: 38
    },
    {
        boxId: 29,
        boxName: "CAMERA CONTROL 1",
        permanentId: 39
    },
    {
        boxId: 30,
        boxName: "CAMERA CONTROL 2",
        permanentId: 40
    },
    {
        boxId: 31,
        boxName: "CAMERA CONTROL 3",
        permanentId: 41
    },
    {
        boxId: 32,
        boxName: "OSD ALT 1",
        permanentId: 42
    },
    {
        boxId: 33,
        boxName: "OSD ALT 2",
        permanentId: 43
    },
    {
        boxId: 34,
        boxName: "OSD ALT 3",
        permanentId: 44
    },
    {
        boxId: 35,
        boxName: "NAV COURSE HOLD",
        permanentId: 45
    },
    {
        boxId: 36,
        boxName: "MC BRAKING",
        permanentId: 46
    },
    {
        boxId: 37,
        boxName: "USER1",
        permanentId: 47
    },
    {
        boxId: 38,
        boxName: "USER2",
        permanentId: 48
    },
    {
        boxId: 48,
        boxName: "USER3",
        permanentId: 57
    },
    {
        boxId: 49,
        boxName: "USER4",
        permanentId: 58
    },
    {
        boxId: 40,
        boxName: "LOITER CHANGE",
        permanentId: 49
    },
    {
        boxId: 41,
        boxName: "MSP RC OVERRIDE",
        permanentId: 50
    },
    {
        boxId: 42,
        boxName: "PREARM",
        permanentId: 51
    },
    {
        boxId: 43,
        boxName: "TURTLE",
        permanentId: 52
    },
    {
        boxId: 44,
        boxName: "NAV CRUISE",
        permanentId: 53
    },
    {
        boxId: 45,
        boxName: "AUTO LEVEL TRIM",
        permanentId: 54
    },
    {
        boxId: 46,
        boxName: "WP PLANNER",
        permanentId: 55
    },
    {
        boxId: 47,
        boxName: "SOARING",
        permanentId: 56
    },
    {
        boxId: 50,
        boxName: "MISSION CHANGE",
        permanentId: 59
    },
    {
        boxId: 51,
        boxName: "BEEPER MUTE",
        permanentId: 60
    },
    {
        boxId: 52,
        boxName: "MULTI FUNCTION",
        permanentId: 61
    },
    {
        boxId: 53,
        boxName: "MIXER PROFILE 2",
        permanentId: 62
    },
    {
        boxId: 54,
        boxName: "MIXER TRANSITION",
        permanentId: 63
    },
    {
        boxId: 55,
        boxName: "ANGLE HOLD",
        permanentId: 64
    },
    {
        boxId: 56,
        boxName: "GIMBAL LEVEL TILT",
        permanentId: 65,
    },
    {
        boxId: 57,
        boxName: "GIMBAL LEVEL ROLL",
        permanentId: 66
    },
    {
        boxId: 58,
        boxName: "GIMBAL CENTER",
        permanentId: 67
    },
    {
        boxId: 59,
        boxName: "GIMBAL HEADTRACKER",
        permanentId: 68
    }
];

module.exports = {FLIGHT_MODES};