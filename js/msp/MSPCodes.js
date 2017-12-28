'use strict';

var MSPCodes = {
    MSP_API_VERSION:            1,
    MSP_FC_VARIANT:             2,
    MSP_FC_VERSION:             3,
    MSP_BOARD_INFO:             4,
    MSP_BUILD_INFO:             5,

    MSP_INAV_PID:               6,
    MSP_SET_INAV_PID:           7,

    MSP_NAV_POSHOLD:            12,
    MSP_SET_NAV_POSHOLD:        13,
    MSP_CALIBRATION_DATA:       14,
    MSP_SET_CALIBRATION_DATA:   15,

    MSP_POSITION_ESTIMATION_CONFIG: 16,
    MSP_SET_POSITION_ESTIMATION_CONFIG: 17,

    MSP_RTH_AND_LAND_CONFIG:     21,
    MSP_SET_RTH_AND_LAND_CONFIG: 22,
    MSP_FW_CONFIG:              23,
    MSP_SET_FW_CONFIG:          24,

    // MSP commands for Cleanflight original features
    MSP_CHANNEL_FORWARDING:     32,
    MSP_SET_CHANNEL_FORWARDING: 33,
    MSP_MODE_RANGES:            34,
    MSP_SET_MODE_RANGE:         35,
    MSP_RX_CONFIG:              44,
    MSP_SET_RX_CONFIG:          45,
    MSP_LED_COLORS:             46,
    MSP_SET_LED_COLORS:         47,
    MSP_LED_STRIP_CONFIG:       48,
    MSP_SET_LED_STRIP_CONFIG:   49,
    MSP_ADJUSTMENT_RANGES:      52,
    MSP_SET_ADJUSTMENT_RANGE:   53,
    MSP_CF_SERIAL_CONFIG:       54,
    MSP_SET_CF_SERIAL_CONFIG:   55,
    MSP_SONAR:                  58,
    MSP_PID_CONTROLLER:         59,
    MSP_SET_PID_CONTROLLER:     60,
    MSP_ARMING_CONFIG:          61,
    MSP_SET_ARMING_CONFIG:      62,
    MSP_DATAFLASH_SUMMARY:      70,
    MSP_DATAFLASH_READ:         71,
    MSP_DATAFLASH_ERASE:        72,
    MSP_LOOP_TIME:              73,
    MSP_SET_LOOP_TIME:          74,
    MSP_FAILSAFE_CONFIG:        75,
    MSP_SET_FAILSAFE_CONFIG:    76,
    MSP_RXFAIL_CONFIG:          77,
    MSP_SET_RXFAIL_CONFIG:      78,
    MSP_SDCARD_SUMMARY:         79,
    MSP_BLACKBOX_CONFIG:        80,
    MSP_SET_BLACKBOX_CONFIG:    81,
    MSP_TRANSPONDER_CONFIG:     82,
    MSP_SET_TRANSPONDER_CONFIG: 83,
    MSP_OSD_CONFIG:             84,
    MSP_SET_OSD_CONFIG:         85,
    MSP_OSD_CHAR_READ:          86,
    MSP_OSD_CHAR_WRITE:         87,
    MSP_ADVANCED_CONFIG:        90,
    MSP_SET_ADVANCED_CONFIG:    91,
    MSP_FILTER_CONFIG:          92,
    MSP_SET_FILTER_CONFIG:      93,
    MSP_PID_ADVANCED:           94,
    MSP_SET_PID_ADVANCED:       95,
    MSP_SENSOR_CONFIG:          96,
    MSP_SET_SENSOR_CONFIG:      97,

    // Multiwii MSP commands
    MSP_IDENT:              100, //deprecated, do not use
    MSP_STATUS:             101,
    MSP_RAW_IMU:            102,
    MSP_SERVO:              103,
    MSP_MOTOR:              104,
    MSP_RC:                 105,
    MSP_RAW_GPS:            106,
    MSP_COMP_GPS:           107,
    MSP_ATTITUDE:           108,
    MSP_ALTITUDE:           109,
    MSP_ANALOG:             110,
    MSP_RC_TUNING:          111,
    MSP_PID:                112,
    MSP_ACTIVEBOXES:        113,
    MSP_MISC:               114,
    MSP_MOTOR_PINS:         115,
    MSP_BOXNAMES:           116,
    MSP_PIDNAMES:           117,
    MSP_WP:                 118,
    MSP_BOXIDS:             119,
    MSP_SERVO_CONFIGURATIONS: 120,
    MSP_3D:                 124,
    MSP_RC_DEADBAND:        125,
    MSP_SENSOR_ALIGNMENT:   126,
    MSP_LED_STRIP_MODECOLOR:127,
    MSP_STATUS_EX:          150,
    MSP_SENSOR_STATUS:      151,

    MSP_SET_RAW_RC:         200,
    MSP_SET_RAW_GPS:        201,
    MSP_SET_PID:            202,
    MSP_SET_BOX:            203,
    MSP_SET_RC_TUNING:      204,
    MSP_ACC_CALIBRATION:    205,
    MSP_MAG_CALIBRATION:    206,
    MSP_SET_MISC:           207,
    MSP_RESET_CONF:         208,
    MSP_SET_WP:             209,
    MSP_SELECT_SETTING:     210,
    MSP_SET_HEAD:           211,
    MSP_SET_SERVO_CONFIGURATION: 212,
    MSP_SET_MOTOR:          214,
    MSP_SET_3D:             217,
    MSP_SET_RC_DEADBAND:    218,
    MSP_SET_RESET_CURR_PID: 219,
    MSP_SET_SENSOR_ALIGNMENT: 220,
    MSP_SET_LED_STRIP_MODECOLOR:221,

    // MSP_BIND:               240,

    MSP_SERVO_MIX_RULES:    241,
    MSP_SET_SERVO_MIX_RULE: 242,

    MSP_RTC:                246,
    MSP_SET_RTC:            247,

    MSP_EEPROM_WRITE:       250,

    MSP_DEBUGMSG:           253,
    MSP_DEBUG:              254,

    // Additional baseflight commands that are not compatible with MultiWii
    MSP_UID:                160, // Unique device ID
    MSP_ACC_TRIM:           240, // get acc angle trim values
    MSP_SET_ACC_TRIM:       239, // set acc angle trim values
    MSP_GPS_SV_INFO:        164, // get Signal Strength
    MSP_GPSSTATISTICS:      166, // GPS statistics

    // Additional private MSP for baseflight configurator (yes thats us \o/)
    MSP_RX_MAP:              64, // get channel map (also returns number of channels total)
    MSP_SET_RX_MAP:          65, // set rc map, numchannels to set comes from MSP_RX_MAP
    MSP_BF_CONFIG:             66, // baseflight-specific settings that aren't covered elsewhere
    MSP_SET_BF_CONFIG:         67, // baseflight-specific settings save
    MSP_SET_REBOOT:         68, // reboot settings
    MSP_BF_BUILD_INFO:          69,  // build date as well as some space for future expansion

    // INAV specific codes
    MSPV2_SETTING:          0x1003,
    MSPV2_SET_SETTING:      0x1004,
};
