'use strict';

var MSPCodes = {
    MSP_API_VERSION:            1,
    MSP_FC_VARIANT:             2,
    MSP_FC_VERSION:             3,
    MSP_BOARD_INFO:             4,
    MSP_BUILD_INFO:             5,

    MSP_INAV_PID:               6,
    MSP_SET_INAV_PID:           7,

    MSP_NAME:                   10,
    MSP_SET_NAME:               11,

    MSP_NAV_POSHOLD:            12,
    MSP_SET_NAV_POSHOLD:        13,
    MSP_CALIBRATION_DATA:       14,
    MSP_SET_CALIBRATION_DATA:   15,

    MSP_WP_MISSION_LOAD: 18,
    MSP_WP_MISSION_SAVE: 19,
    MSP_WP_GETINFO: 20,
    MSP_RTH_AND_LAND_CONFIG:     21,
    MSP_SET_RTH_AND_LAND_CONFIG: 22,
    MSP_FW_CONFIG:              23,
    MSP_SET_FW_CONFIG:          24,

    // MSP commands for Cleanflight original features
    MSP_MODE_RANGES:            34,
    MSP_SET_MODE_RANGE:         35,
    MSP_FEATURE:                36,
    MSP_SET_FEATURE:            37,
    MSP_BOARD_ALIGNMENT:        38,
    MSP_SET_BOARD_ALIGNMENT:    39,
    MSP_CURRENT_METER_CONFIG:   40,
    MSP_SET_CURRENT_METER_CONFIG: 41,
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
    MSP_DATAFLASH_SUMMARY:      70,
    MSP_DATAFLASH_READ:         71,
    MSP_DATAFLASH_ERASE:        72,
    MSP_LOOP_TIME:              73,
    MSP_SET_LOOP_TIME:          74,
    MSP_FAILSAFE_CONFIG:        75,
    MSP_SET_FAILSAFE_CONFIG:    76,
    MSP_SDCARD_SUMMARY:         79,
    MSP_BLACKBOX_CONFIG:        80,
    MSP_SET_BLACKBOX_CONFIG:    81,
    MSP_OSD_CHAR_READ:          86,
    MSP_OSD_CHAR_WRITE:         87,
    MSP_VTX_CONFIG:             88,
    MSP_SET_VTX_CONFIG:         89,
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
    MSP_RC_TUNING:          111,
    MSP_PID:                112,
    MSP_ACTIVEBOXES:        113,
    MSP_MOTOR_PINS:         115,
    MSP_PIDNAMES:           117,
    MSP_WP:                 118,
    MSP_BOXIDS:             119,
    MSP_SERVO_CONFIGURATIONS: 120,
    MSP_3D:                 124,
    MSP_RC_DEADBAND:        125,
    MSP_SENSOR_ALIGNMENT:   126,
    MSP_LED_STRIP_MODECOLOR:127,
    MSP_STATUS_EX:          150,    // Deprecated, do not use.
    MSP_SENSOR_STATUS:      151,

    MSP_SET_RAW_RC:         200,
    MSP_SET_RAW_GPS:        201,
    MSP_SET_PID:            202,
    MSP_SET_BOX:            203,
    MSP_SET_RC_TUNING:      204,
    MSP_ACC_CALIBRATION:    205,
    MSP_MAG_CALIBRATION:    206,
    MSP_RESET_CONF:         208,
    MSP_SET_WP:             209,
    MSP_SELECT_SETTING:     210,
    MSP_SET_HEAD:           211,
    MSP_SET_MOTOR:          214,
    MSP_SET_3D:             217,
    MSP_SET_RC_DEADBAND:    218,
    MSP_SET_RESET_CURR_PID: 219,
    MSP_SET_SENSOR_ALIGNMENT: 220,
    MSP_SET_LED_STRIP_MODECOLOR:221,

    // MSP_BIND:               240,

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
    MSP_BF_CONFIG:             66, // Depreciated
    MSP_SET_BF_CONFIG:         67, // Depreciated
    MSP_SET_REBOOT:         68, // reboot settings
    MSP_BF_BUILD_INFO:          69,  // Depreciated

    // INAV specific codes
    MSPV2_SETTING:                      0x1003,
    MSPV2_SET_SETTING:                  0x1004,

    MSP2_COMMON_MOTOR_MIXER:            0x1005,
    MSP2_COMMON_SET_MOTOR_MIXER:        0x1006,

    MSP2_COMMON_SETTING_INFO:           0x1007,
    MSP2_COMMON_PG_LIST:                0x1008,

    MSP2_CF_SERIAL_CONFIG:              0x1009,
    MSP2_SET_CF_SERIAL_CONFIG:          0x100A,

    MSPV2_INAV_STATUS:                  0x2000,
    MSPV2_INAV_OPTICAL_FLOW:            0x2001,
    MSPV2_INAV_ANALOG:                  0x2002,
    MSPV2_INAV_MISC:                    0x2003,
    MSPV2_INAV_SET_MISC:                0x2004,
    MSPV2_INAV_BATTERY_CONFIG:          0x2005,
    MSPV2_INAV_SET_BATTERY_CONFIG:      0x2006,
    MSPV2_INAV_RATE_PROFILE:            0x2007,
    MSPV2_INAV_SET_RATE_PROFILE:        0x2008,
    MSPV2_INAV_AIR_SPEED:               0x2009,
    MSPV2_INAV_OUTPUT_MAPPING:          0x200A,
    MSP2_INAV_MC_BRAKING:               0x200B,
    MSP2_INAV_SET_MC_BRAKING:           0x200C,
    MSPV2_INAV_OUTPUT_MAPPING_EXT:      0x200D,
    MSPV2_INAV_OUTPUT_MAPPING_EXT2:     0x210D,
    MSP2_INAV_TIMER_OUTPUT_MODE:        0x200E,
    MSP2_INAV_SET_TIMER_OUTPUT_MODE:    0x200F,

    MSP2_INAV_MIXER:                    0x2010,
    MSP2_INAV_SET_MIXER:                0x2011,

    MSP2_INAV_OSD_LAYOUTS:              0x2012,
    MSP2_INAV_OSD_SET_LAYOUT_ITEM:      0x2013,
    MSP2_INAV_OSD_ALARMS:               0x2014,
    MSP2_INAV_OSD_SET_ALARMS:           0x2015,
    MSP2_INAV_OSD_PREFERENCES:          0x2016,
    MSP2_INAV_OSD_SET_PREFERENCES:      0x2017,

    MSP2_INAV_SELECT_BATTERY_PROFILE:   0x2018,

    MSP2_INAV_DEBUG:                    0x2019,

    MSP2_BLACKBOX_CONFIG:               0x201A,
    MSP2_SET_BLACKBOX_CONFIG:           0x201B,

    MSP2_INAV_TEMP_SENSOR_CONFIG:       0x201C,
    MSP2_INAV_SET_TEMP_SENSOR_CONFIG:   0x201D,
    MSP2_INAV_TEMPERATURES:             0x201E,

    MSP2_INAV_SERVO_MIXER:              0x2020,
    MSP2_INAV_SET_SERVO_MIXER:          0x2021,
    MSP2_INAV_LOGIC_CONDITIONS:         0x2022,
    MSP2_INAV_SET_LOGIC_CONDITIONS:     0x2023,
    MSP2_INAV_GLOBAL_FUNCTIONS:         0x2024,
    MSP2_INAV_SET_GLOBAL_FUNCTIONS:     0x2025,
    MSP2_INAV_LOGIC_CONDITIONS_STATUS:  0x2026,
    MSP2_INAV_GVAR_STATUS:              0x2027,
    MSP2_INAV_PROGRAMMING_PID:          0x2028,
    MSP2_INAV_SET_PROGRAMMING_PID:      0x2029,
    MSP2_INAV_PROGRAMMING_PID_STATUS:   0x202A,


    MSP2_PID:                           0x2030,
    MSP2_SET_PID:                       0x2031,

    MSP2_INAV_OPFLOW_CALIBRATION:       0x2032,
    
    MSP2_INAV_FWUPDT_PREPARE:           0x2033,
    MSP2_INAV_FWUPDT_STORE:             0x2034,
    MSP2_INAV_FWUPDT_EXEC:              0x2035,
    MSP2_INAV_FWUPDT_ROLLBACK_PREPARE:  0x2036,
    MSP2_INAV_FWUPDT_ROLLBACK_EXEC:     0x2037,
    
    MSP2_INAV_SAFEHOME:                 0x2038,
    MSP2_INAV_SET_SAFEHOME:             0x2039,
    
    MSP2_INAV_LOGIC_CONDITIONS_SINGLE:  0x203B,

    MSP2_INAV_LED_STRIP_CONFIG_EX:      0x2048,
    MSP2_INAV_SET_LED_STRIP_CONFIG_EX:  0x2049,

    MSP2_INAV_FW_APPROACH:              0x204A,
    MSP2_INAV_SET_FW_APPROACH:          0x204B,

    MSP2_INAV_GPS_UBLOX_COMMAND:        0x2050,

    MSP2_INAV_RATE_DYNAMICS:            0x2060,
    MSP2_INAV_SET_RATE_DYNAMICS:        0x2061,

    MSP2_INAV_EZ_TUNE:                  0x2070,
    MSP2_INAV_EZ_TUNE_SET:              0x2071,

    MSP2_INAV_SELECT_MIXER_PROFILE:     0x2080,
    
    MSP2_ADSB_VEHICLE_LIST:             0x2090,

    MSP2_INAV_CUSTOM_OSD_ELEMENTS:      0x2100,
    MSP2_INAV_CUSTOM_OSD_ELEMENT:       0x2101,
    MSP2_INAV_SET_CUSTOM_OSD_ELEMENTS:  0x2102,

    MSP2_INAV_SERVO_CONFIG:             0x2200,
    MSP2_INAV_SET_SERVO_CONFIG:         0x2201,

    MSP2_INAV_GEOZONE:                 0x2210,
    MSP2_INAV_SET_GEOZONE:             0x2211,
    MSP2_INAV_GEOZONE_VERTEX:        0x2212,
    MSP2_INAV_SET_GEOZONE_VERTICE:    0x2213

};

module.exports = MSPCodes;