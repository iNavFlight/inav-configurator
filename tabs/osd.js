/*global $*/
'use strict';

var SYM = SYM || {};
SYM.VOLT = 0x90;
SYM.RSSI = 0x01;
SYM.AH_RIGHT = 0x02;
SYM.AH_LEFT = 0x03;
SYM.THR = 0x04;
SYM.THR1 = 0x05;
SYM.FLY_M = 0x9C;
SYM.ON_M = 0x9B;
SYM.AH_CENTER_LINE = 0x26;
SYM.AH_CENTER_LINE_RIGHT = 0x27;
SYM.AH_CENTER = 0x7E;
SYM.AH_BAR9_0 = 0x80;
SYM.AH_DECORATION = 0x13;
SYM.AMP = 0x9A;
SYM.MAH = 0x07;
SYM.WH = 0xAB;
SYM.WATT = 0xAE;
SYM.MAH_KM_0 = 157;
SYM.MAH_KM_1 = 158;
SYM.WH_KM_0 = 172;
SYM.WH_KM_1 = 173;
SYM.GPS_SAT1 = 0x1E;
SYM.GPS_SAT2 = 0x1F;
SYM.GPS_HDP1 = 0xBD;
SYM.GPS_HDP2 = 0xBE;
SYM.KMH = 161;
SYM.MPH = 176;
SYM.ALT_M = 177;
SYM.ALT_FT = 179;
SYM.LAT = 0xA6;
SYM.LON = 0xA7;
SYM.AIR = 151;
SYM.DIRECTION = 114;
SYM.DIR_TO_HOME = 0x60;
SYM.SCALE = 175;
SYM.DIST_KM = 182;
SYM.DIST_MI = 184;
SYM.M = 185;
SYM.MI = 187;
SYM.HOME = 191;
SYM.TRIP_DIST = 0x22;
SYM.HEADING1 = 0xA9;
SYM.HEADING2 = 0xA8;
SYM.HEADING_N = 24;
SYM.HEADING_E = 26;
SYM.HEADING_W = 27;
SYM.HEADING_DIVIDED_LINE = 28;
SYM.HEADING_LINE = 29;
SYM.VARIO_UP_2A = 0xA2;
SYM.M_S = 0x9F;
SYM.FT_S = 153;
SYM.CLOCK = 0xBC;
SYM.ZERO_HALF_TRAILING_DOT = 192;
SYM.ZERO_HALF_LEADING_DOT = 208;
SYM.ROLL_LEFT = 0xCC;
SYM.ROLL_LEVEL = 0xCD;
SYM.ROLL_RIGHT = 0xCE;
SYM.PITCH_UP = 0xCF;
SYM.PITCH_DOWN = 0xDF;
SYM.LAST_CHAR = 190;

var FONT = FONT || {};

FONT.initData = function () {
    if (FONT.data) {
        return;
    }
    FONT.data = {
        // default font file name
        loaded_font_file: 'default',
        // array of arry of image bytes ready to upload to fc
        characters_bytes: [],
        // array of array of image bits by character
        characters: [],
        // an array of base64 encoded image strings by character
        character_image_urls: []
    }
};

FONT.constants = {
    SIZES: {
        /** NVM ram size for one font char, actual character bytes **/
        MAX_NVM_FONT_CHAR_SIZE: 54,
        /** NVM ram field size for one font char, last 10 bytes dont matter **/
        MAX_NVM_FONT_CHAR_FIELD_SIZE: 64,
        CHAR_HEIGHT: 18,
        CHAR_WIDTH: 12,
        LINE: 30
    },
    COLORS: {
        // black
        0: 'rgba(0, 0, 0, 1)',
        // also the value 3, could yield transparent according to
        // https://www.sparkfun.com/datasheets/BreakoutBoards/MAX7456.pdf
        1: 'rgba(255, 255, 255, 0)',
        // white
        2: 'rgba(255,255,255, 1)'
    }
};

/**
 * Each line is composed of 8 asci 1 or 0, representing 1 bit each for a total of 1 byte per line
 */
FONT.parseMCMFontFile = function (data) {
    data = data.split("\n");
    // clear local data
    FONT.data.characters.length = 0;
    FONT.data.characters_bytes.length = 0;
    FONT.data.character_image_urls.length = 0;

    // make sure the font file is valid
    if (data.shift().trim() != 'MAX7456') {
        var msg = 'that font file doesnt have the MAX7456 header, giving up';
        console.debug(msg);
        Promise.reject(msg);
    }

    var character_bits = [];
    var character_bytes = [];

    // hexstring is for debugging
    FONT.data.hexstring = [];
    var pushChar = function () {
        FONT.data.characters_bytes.push(character_bytes);
        FONT.data.characters.push(character_bits);
        FONT.draw(FONT.data.characters.length - 1);
        //$log.debug('parsed char ', i, ' as ', character);
        character_bits = [];
        character_bytes = [];
    };

    for (var i = 0; i < data.length; i++) {

        var line = data[i];
        // hexstring is for debugging
        FONT.data.hexstring.push('0x' + parseInt(line, 2).toString(16));

        // every 64 bytes (line) is a char, we're counting chars though, which are 2 bits
        if (character_bits.length == FONT.constants.SIZES.MAX_NVM_FONT_CHAR_FIELD_SIZE * (8 / 2)) {
            pushChar()
        }

        for (var y = 0; y < 8; y = y + 2) {
            var v = parseInt(line.slice(y, y + 2), 2);
            character_bits.push(v);
        }
        character_bytes.push(parseInt(line, 2));

    }

    // push the last char
    pushChar();

    return FONT.data.characters;
};


//noinspection JSUnusedLocalSymbols
FONT.openFontFile = function ($preview) {
    return new Promise(function (resolve) {
        //noinspection JSUnresolvedVariable
        chrome.fileSystem.chooseEntry({type: 'openFile', accepts: [
            {extensions: ['mcm']}
        ]}, function (fileEntry) {
            FONT.data.loaded_font_file = fileEntry.name;
            //noinspection JSUnresolvedVariable
            if (chrome.runtime.lastError) {
                //noinspection JSUnresolvedVariable
                console.error(chrome.runtime.lastError.message);
                return;
            }
            fileEntry.file(function (file) {
                var reader = new FileReader();
                reader.onloadend = function (e) {
                    //noinspection JSUnresolvedVariable
                    if (e.total != 0 && e.total == e.loaded) {
                        FONT.parseMCMFontFile(e.target.result);
                        resolve();
                    }
                    else {
                        console.error('could not load whole font file');
                    }
                };
                reader.readAsText(file);
            });
        });
    });
};

/**
 * returns a canvas image with the character on it
 */
var drawCanvas = function (charAddress) {
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext("2d");

    // TODO: do we want to be able to set pixel size? going to try letting the consumer scale the image.
    var pixelSize = pixelSize || 1;
    var width = pixelSize * FONT.constants.SIZES.CHAR_WIDTH;
    var height = pixelSize * FONT.constants.SIZES.CHAR_HEIGHT;

    canvas.width = width;
    canvas.height = height;

    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            if (!(charAddress in FONT.data.characters)) {
                console.log('charAddress', charAddress, ' is not in ', FONT.data.characters.length);
            }
            var v = FONT.data.characters[charAddress][(y * width) + x];
            ctx.fillStyle = FONT.constants.COLORS[v];
            ctx.fillRect(x, y, pixelSize, pixelSize);
        }
    }
    return canvas;
};

FONT.draw = function (charAddress) {
    var cached = FONT.data.character_image_urls[charAddress];
    if (!cached) {
        cached = FONT.data.character_image_urls[charAddress] = drawCanvas(charAddress).toDataURL('image/png');
    }
    return cached;
};

FONT.msp = {
    encode: function (charAddress) {
        return [charAddress].concat(FONT.data.characters_bytes[charAddress].slice(0, FONT.constants.SIZES.MAX_NVM_FONT_CHAR_SIZE));
    }
};

FONT.upload = function ($progress) {
    return Promise.mapSeries(FONT.data.characters, function (data, i) {
        $progress.val((i / FONT.data.characters.length) * 100);
        return MSP.promise(MSPCodes.MSP_OSD_CHAR_WRITE, FONT.msp.encode(i));
    })
        .then(function () {
            OSD.GUI.jbox.close();
            return MSP.promise(MSPCodes.MSP_SET_REBOOT);
        });
};

FONT.preview = function ($el) {
    $el.empty();
    for (var i = 0; i <= SYM.LAST_CHAR; i++) {
        var url = FONT.data.character_image_urls[i];
        $el.append('<img src="' + url + '" title="0x' + i.toString(16) + '"></img>');
    }
};

FONT.symbol = function (hexVal) {
    return String.fromCharCode(hexVal);
};

FONT.embed_dot = function(str) {
    var zero = '0'.charCodeAt(0);
    var repl = str.replace(/\d.\d/, function(match) {
        var c1 = match.charCodeAt(0) + SYM.ZERO_HALF_TRAILING_DOT - zero;
        var c2 = match.charCodeAt(2) + SYM.ZERO_HALF_LEADING_DOT - zero;
        return FONT.symbol(c1) + FONT.symbol(c2);
    });
    return repl;
}

var OSD = OSD || {};

// common functions for altitude and negative altitude alarms
function altitude_alarm_unit(osd_data) {
    if (OSD.data.preferences.units === 0) {
        return 'ft';
    }
    return 'm';
}

function altitude_alarm_to_display(osd_data, value) {
    if (OSD.data.preferences.units === 0) {
        // meters to feet
        return Math.round(value * 3.28084)
    }
    return value;
}

function altitude_alarm_from_display(osd_data, value) {
    if (OSD.data.preferences.units === 0) {
        // feet to meters
        return Math.round(value / 3.28084);
    }
    return value;
}

// Used to wrap altitude conversion functions for firmwares up
// to 1.7.3, since the altitude alarm used either m or feet
// depending on the OSD display unit used (hence, no conversion)
function altitude_alarm_display_function(fn) {
    return function(osd_data, value) {
        if (semver.gt(CONFIG.flightControllerVersion, '1.7.3')) {
            return fn(osd_data, value)
        }
        return value;
    }
}

// parsed fc output and output to fc, used by to OSD.msp.encode
OSD.initData = function () {
    OSD.data = {
        supported: false,
        preferences: {
            video_system: null,
            main_voltage_decimals: null,
            ahi_reverse_roll: null,
            crosshairs_style: null,
            left_sidebar_scroll: null,
            right_sidebar_scroll: null,
            sidebar_scroll_arrows: null,
            units: null,
            stats_energy_unit: null,
        },
        alarms: {
            rssi: null,
            batt_cap: null,
            fly_minutes: null,
            max_altitude: null,
            dist: null,
            max_neg_altitude: null,
        },
        layouts: [],
        layout_count: 1,
        items: [],
        groups: {},
        display_items: [],
        preview: []
    };
};

OSD.constants = {
    VISIBLE: 0x0800,
    VIDEO_TYPES: [
        'AUTO',
        'PAL',
        'NTSC'
    ],
    VIDEO_LINES: {
        PAL: 16,
        NTSC: 13
    },
    VIDEO_BUFFER_CHARS: {
        PAL: 480,
        NTSC: 390
    },
    UNIT_TYPES: [
        {name: 'osdUnitImperial', value: 0},
        {name: 'osdUnitMetric', value: 1},
        {name: 'osdUnitUK', tip: 'osdUnitUKTip', value: 2, min_version: "1.7.3"},
    ],
    AHISIDEBARWIDTHPOSITION: 7,
    AHISIDEBARHEIGHTPOSITION: 3,

    ALL_ALARMS: [
        {
            name: 'RSSI',
            field: 'rssi',
            unit: '%',
        },
        {
            name: 'BATT_CAP',
            field: 'batt_cap',
            unit: 'mah',
        },
        {
            name: 'FLY_MINUTES',
            field: 'fly_minutes',
            unit: 'minutes',
        },
        {
            name: 'MAX_ALTITUDE',
            field: 'max_altitude',
            unit: altitude_alarm_unit,
            to_display: altitude_alarm_display_function(altitude_alarm_to_display),
            from_display: altitude_alarm_display_function(altitude_alarm_from_display),
        },
        {
            name: 'DIST',
            field: 'dist',
            unit: function(osd_data) {
                if (OSD.data.preferences.units === 0) {
                    return 'mi';
                }
                return 'm';
            },
            to_display: function(osd_data, value) {
                if (OSD.data.preferences.units === 0) {
                    // meters to miles
                    return (value / 1609.34).toFixed(2);
                }
                return value;
            },
            from_display: function(osd_data, value) {
                if (OSD.data.preferences.units === 0) {
                    // miles to meters
                    return Math.round(value * 1609.34);
                }
                return value;
            },
            step: function(osd_data) {
                if (OSD.data.preferences.units === 0) {
                    return 0.01;
                }
                return 1;
            }
        },
        {
            name: 'MAX_NEG_ALTITUDE',
            field: 'mag_neg_altitude',
            unit: altitude_alarm_unit,
            to_display: altitude_alarm_to_display,
            from_display: altitude_alarm_from_display,
        },
    ],

    // All display fields, from every version, do not remove elements, only add!
    ALL_DISPLAY_GROUPS: [
        {
            name: 'osdGroupGeneral',
            items: [
                {
                    name: 'RSSI_VALUE',
                    id: 0,
                    preview: FONT.symbol(SYM.RSSI) + '99'
                },
                {
                    name: 'MAIN_BATT_VOLTAGE',
                    id: 1,
                    preview: FONT.symbol(SYM.VOLT) + FONT.embed_dot('16.8V')
                },
                {
                    name: 'MAIN_BATT_CELL_VOLTAGE',
                    id: 32,
                    min_version: '1.7.4',
                    preview: FONT.symbol(SYM.VOLT) + FONT.embed_dot('3.90V')
                },
                {
                    name: 'MAIN_BATT_REMAINING_PERCENTAGE',
                    id: 38,
                    min_version: '1.8.1',
                    preview: '100%'
                },
                {
                    name: 'THROTTLE_POSITION',
                    id: 9,
                    preview: FONT.symbol(SYM.THR) + FONT.symbol(SYM.THR1) + ' 69'
                },
                {
                    name: 'THROTTLE_POSITION_AUTO_THR',
                    id: 33,
                    min_version: '1.7.4',
                    preview: FONT.symbol(SYM.THR) + FONT.symbol(SYM.THR1) + ' 51'
                },
                {
                    name: 'CRAFT_NAME',
                    id: 8,
                    preview: '[CRAFT_NAME]'
                },
                {
                    name: 'FLYMODE',
                    id: 7,
                    preview: 'ACRO'
                },
                {
                    name: 'MESSAGES',
                    id: 30,
                    min_version: '1.7.4',
                    preview: '       SYSTEM MESSAGE       ', // 28 chars, like OSD_MESSAGE_LENGTH on osd.c
                },
                {
                    name: 'HEADING',
                    id: 24,
                    min_version: '1.6.0',
                    preview: FONT.symbol(SYM.HEADING1) + '175' + FONT.symbol(SYM.HEADING2)
                },
                {
                    name: 'HEADING_GRAPH',
                    id: 34,
                    min_version: '1.7.4',
                    preview: FONT.symbol(SYM.HEADING_W) +
                        FONT.symbol(SYM.HEADING_LINE) +
                        FONT.symbol(SYM.HEADING_DIVIDED_LINE) +
                        FONT.symbol(SYM.HEADING_LINE) +
                        FONT.symbol(SYM.HEADING_N) +
                        FONT.symbol(SYM.HEADING_LINE) +
                        FONT.symbol(SYM.HEADING_DIVIDED_LINE) +
                        FONT.symbol(SYM.HEADING_LINE) +
                        FONT.symbol(SYM.HEADING_E)
                },
                {
                    name: 'AIR_SPEED',
                    id: 27,
                    min_version: '1.7.3',
                    enabled: function() {
                        return SENSOR_CONFIG.pitot != 0;
                    },
                    preview: function(osd_data) {
                        var speed;
                        if (OSD.data.preferences.units === 0) {
                            // Imperial
                            speed = ' 35' + FONT.symbol(SYM.MPH);
                        } else {
                            speed = ' 55' + FONT.symbol(SYM.KMH);
                        }
                        return FONT.symbol(SYM.AIR) + speed;
                    }
                },
                {
                    name: 'RTC_TIME',
                    id: 29,
                    min_version: '1.7.4',
                    preview: FONT.symbol(SYM.CLOCK) + '13:37'
                },
            ]
        },
        {
            name: 'osdGroupAltitude',
            // TODO: Make this disappear when there's no baro and no GPS.
            // Requires not drawing these indicators in INAV even when enabled
            // if there are no sensors to provide their data. Currently they're
            // always drawn as long as BARO or NAV support is compiled in.
            items: [
                {
                    name: 'ALTITUDE',
                    id: 15,
                    preview: function () {
                        if (OSD.data.preferences.units === 0) {
                            // Imperial
                            return FONT.symbol(SYM.ALT_FT) + '118';
                        }
                        return FONT.symbol(SYM.ALT_M) + '399'
                    }
                },
                {
                    name: 'VARIO',
                    id: 25,
                    min_version: '1.6.0',
                    preview: FONT.symbol(SYM.VARIO_UP_2A) + '\n' +
                        FONT.symbol(SYM.VARIO_UP_2A) + '\n' +
                        FONT.symbol(SYM.VARIO_UP_2A) + '\n' +
                        FONT.symbol(SYM.VARIO_UP_2A) + '\n' +
                        FONT.symbol(SYM.VARIO_UP_2A) + '\n'
                },
                {
                    name: 'VARIO_NUM',
                    id: 26,
                    min_version: '1.6.0',
                    preview: function(osd_data) {
                        if (OSD.data.preferences.units === 0) {
                            // Imperial
                            return FONT.embed_dot('-1.6') + FONT.symbol(SYM.FT_S);
                        }
                        return FONT.embed_dot('-0.5') + FONT.symbol(SYM.M_S);
                    }
                }
            ]
        },
        {
            name: 'osdGroupTimers',
            items: [
                {
                    name: 'ONTIME_FLYTIME',
                    id: 28,
                    min_version: '1.7.4',
                    preview: FONT.symbol(SYM.FLY_M) + '04:11'
                },
                {
                    name: 'ONTIME',
                    id: 5,
                    preview: FONT.symbol(SYM.ON_M) + '04:11'
                },
                {
                    name: 'FLYTIME',
                    id: 6,
                    preview: FONT.symbol(SYM.FLY_M) + '04:11'
                },
            ]
        },
        {
            name: 'osdGroupAttitude',
            items: [
                {
                    name: 'CROSSHAIRS',
                    id: 2,
                    positionable: false
                },
                {
                    name: 'ARTIFICIAL_HORIZON',
                    id: 3,
                    positionable: false
                },
                {
                    name: 'HORIZON_SIDEBARS',
                    id: 4,
                    positionable: false
                },
                {
                    name: 'PITCH_ANGLE',
                    id: 41,
                    min_version: '2.0.0',
                    preview: FONT.symbol(SYM.PITCH_UP) + '2'
                },
                {
                    name: 'ROLL_ANGLE',
                    id: 42,
                    min_version: '2.0.0',
                    preview: FONT.symbol(SYM.ROLL_LEFT) + '5'
                },
            ]
        },
        {
            name: 'osdGroupCurrentMeter',
            enabled: function() {
                return FC.isFeatureEnabled('CURRENT_METER');
            },
            items: [
                {
                    name: 'CURRENT_DRAW',
                    id: 11,
                    preview: FONT.symbol(SYM.AMP) + FONT.embed_dot('42.1')
                },
                {
                    name: 'MAH_DRAWN',
                    id: 12,
                    preview: FONT.symbol(SYM.MAH) + '690 ' // 4 chars
                },
                {
                    name: 'WH_DRAWN',
                    id: 36,
                    min_version: '1.8.1',
                    preview: FONT.symbol(SYM.WH) + FONT.embed_dot('1.25')
                },
                {
                    name: 'POWER',
                    id: 19,
                    min_version: '1.6.0',
                    preview: FONT.symbol(SYM.WATT) + '50 ' // 3 chars
                },
                {
                    name: 'MAIN_BATT_REMAINING_CAPACITY',
                    id: 37,
                    min_version: '1.8.1',
                    preview: FONT.symbol(SYM.MAH) + '690 ' // 4 chars
                },
                {
                    name: 'EFFICIENCY_MAH',
                    id: 35,
                    min_version: '1.7.4',
                    preview: "123" + FONT.symbol(SYM.MAH_KM_0) + FONT.symbol(SYM.MAH_KM_1)
                },
                {
                    name: 'EFFICIENCY_WH',
                    id: 39,
                    min_version: '1.8.1',
                    preview: FONT.embed_dot('1.23') + FONT.symbol(SYM.WH_KM_0) + FONT.symbol(SYM.WH_KM_1)
                }
            ]
        },
        {
            name: 'osdGroupGPS',
            enabled: function() {
                return FC.isFeatureEnabled('GPS');
            },
            items: [
                {
                    name: 'GPS_SPEED',
                    id: 13,
                    preview: function(osd_data) {
                        // 3 chars
                        if (OSD.data.preferences.units === 0 || OSD.data.preferences.units === 2) {
                            // Imperial
                            return FONT.embed_dot(' 25') + FONT.symbol(SYM.MPH);
                        }
                        return FONT.embed_dot(' 40') + FONT.symbol(SYM.KMH);
                    }
                },
                {
                    name: 'GPS_SATS',
                    id: 14,
                    preview: FONT.symbol(SYM.GPS_SAT1) + FONT.symbol(SYM.GPS_SAT2) + '14'
                },
                {
                    name: 'LONGITUDE',
                    id: 20,
                    min_version: '1.6.0',
                    preview: FONT.symbol(SYM.LON) + FONT.embed_dot('14.7652134  ') // 11 chars
                },
                {
                    name: 'LATITUDE',
                    id: 21,
                    min_version: '1.6.0',
                    preview: FONT.symbol(SYM.LAT) + FONT.embed_dot('52.9872367  ') // 11 chars
                },
                {
                    name: 'DIRECTION_TO_HOME',
                    id: 22,
                    min_version: '1.6.0',
                    preview: FONT.symbol(SYM.DIR_TO_HOME)
                },
                {
                    name: 'DISTANCE_TO_HOME',
                    id: 23,
                    min_version: '1.6.0',
                    preview: function(osd_data) {
                        if (OSD.data.preferences.units === 0) {
                            // Imperial
                            return FONT.symbol(SYM.HOME) + FONT.symbol(SYM.DIST_MI) + FONT.embed_dot('0.98');
                        }
                        return FONT.symbol(SYM.HOME) + FONT.symbol(SYM.DIST_KM) + FONT.embed_dot('1.73');
                    }
                },
                {
                    name: 'TRIP_DIST',
                    id: 40,
                    min_version: '1.9.1',
                    preview: function(osd_data) {
                        if (OSD.data.preferences.units === 0) {
                            // Imperial
                            return FONT.symbol(SYM.TRIP_DIST) + FONT.symbol(SYM.DIST_MI) + FONT.embed_dot('0.98');
                        }
                        return FONT.symbol(SYM.TRIP_DIST) + FONT.symbol(SYM.DIST_KM) + FONT.embed_dot('1.73');
                    }
                },
                {
                    name: 'GPS_HDOP',
                    id: 31,
                    min_version: '1.7.4',
                    preview: FONT.symbol(SYM.GPS_HDP1) + FONT.symbol(SYM.GPS_HDP2) + FONT.embed_dot('1.8')
                },
            ]
        },
        {
            name: 'osdGroupMapsAndRadars',
            items: [
                {
                    name: 'MAP_NORTH',
                    id: 43,
                    positionable: false,
                },
                {
                    name: 'MAP_TAKEOFF',
                    id: 44,
                    positionable: false,
                },
            ],
        },
        {
            name: 'osdGroupVTX',
            items: [
                {
                    name: 'VTX_CHANNEL',
                    id: 10,
                    positionable: true,
                    preview: 'CH:F7'
                },
            ]
        },
        {
            name: 'osdGroupPIDs',
            min_version: '1.6.0',
            items: [
                {
                    name: 'ROLL_PIDS',
                    id: 16,
                    preview: 'ROL 40 30 23'
                },
                {
                    name: 'PITCH_PIDS',
                    id: 17,
                    preview: 'PIT 40 30 23'
                },
                {
                    name: 'YAW_PIDS',
                    id: 18,
                    preview: 'YAW 85 45 0'
                },
            ]
        }
    ]
};

OSD.get_item = function(item_id) {
    for (var ii = 0; ii < OSD.constants.ALL_DISPLAY_GROUPS.length; ii++) {
        var group = OSD.constants.ALL_DISPLAY_GROUPS[ii];
        for (var jj = 0; jj < group.items.length; jj++) {
            if (group.items[jj].id == item_id) {
                return group.items[jj];
            }
        }
    }
    return null;
};

OSD.is_item_displayed = function(item, group) {
    if (!OSD.data.items[item.id]) {
        // FC has no data about this item, so
        // it doesn't support it.
        return false;
    }
    if (FC.getOsdDisabledFields().indexOf(item.name) != -1) {
        return false;
    }
    if (!group) {
        return false;
    }
    if (typeof group.enabled === 'function' && group.enabled() === false) {
        return false;
    }
    if (item.min_version && !semver.gte(CONFIG.flightControllerVersion, item.min_version)) {
        return false;
    }
    if (typeof item.enabled === 'function' && item.enabled() === false) {
        return false;
    }
    return true;
};

OSD.get_item_preview = function(item) {
    var preview = item.preview;
    if (typeof preview == 'function') {
        return preview();
    }
    return preview;
}

OSD.use_layouts_api = function() {
    return semver.gte(CONFIG.flightControllerVersion, '2.0.0');
};

OSD.reload = function(callback) {
    OSD.initData();
    var done = function() {
        OSD.updateDisplaySize();
        if (callback) {
            callback();
        }
    };
    if (OSD.use_layouts_api()) {
        MSP.promise(MSPCodes.MSP2_INAV_OSD_LAYOUTS).then(function (resp) {

            OSD.msp.decodeLayouts(resp);
            OSD.updateSelectedLayout(OSD.data.selected_layout || 0);

            MSP.promise(MSPCodes.MSP2_INAV_OSD_ALARMS).then(function (resp) {

                OSD.msp.decodeAlarms(resp);

                MSP.promise(MSPCodes.MSP2_INAV_OSD_PREFERENCES).then(function (resp) {

                    OSD.data.supported = true;
                    OSD.msp.decodePreferences(resp);
                    done();
                });
            });
        });
    } else {
        MSP.promise(MSPCodes.MSP_OSD_CONFIG).then(function (data) {
            OSD.msp.decode(data);
            done();
        });
    }
};

OSD.updateSelectedLayout = function(new_layout) {
    OSD.data.selected_layout = new_layout;
    OSD.data.items = OSD.data.layouts[OSD.data.selected_layout];
};

OSD.updateDisplaySize = function () {
    var video_type = OSD.constants.VIDEO_TYPES[OSD.data.preferences.video_system];
    if (video_type == 'AUTO') {
        video_type = 'PAL';
    }
    // compute the size
    OSD.data.display_size = {
        x: FONT.constants.SIZES.LINE,
        y: OSD.constants.VIDEO_LINES[video_type],
        total: null
    };
};

OSD.saveAlarms = function(callback) {
    // Before the layouts API was introduced, config and alarms were saved
    // with the same MSP cmd.
    if (!OSD.use_layouts_api()) {
        return OSD.saveConfig(callback);
    }
    var data = OSD.msp.encodeAlarms();
    return MSP.promise(MSPCodes.MSP2_INAV_OSD_SET_ALARMS, data).then(callback);
}

OSD.saveConfig = function(callback) {
    if (OSD.use_layouts_api()) {
        return OSD.saveAlarms(function () {
            var data = OSD.msp.encodePreferences();
            return MSP.promise(MSPCodes.MSP2_INAV_OSD_SET_PREFERENCES, data).then(callback);
        });
    }
    return MSP.promise(MSPCodes.MSP_SET_OSD_CONFIG, OSD.msp.encodeOther()).then(callback);
};

OSD.saveItem = function(item, callback) {
    var pos = OSD.data.items[item.id];
    if (OSD.use_layouts_api()) {
        var data = OSD.msp.encodeLayoutItem(OSD.data.selected_layout, item, pos);
        return MSP.promise(MSPCodes.MSP2_INAV_OSD_SET_LAYOUT_ITEM, data).then(callback);
    }
    var data = OSD.msp.encodeItem(item.id, pos);
    return MSP.promise(MSPCodes.MSP_SET_OSD_CONFIG, data).then(callback);
};

//noinspection JSUnusedLocalSymbols
OSD.msp = {
    /**
     * Note, unsigned 16 bit int for position ispacked:
     * 0: unused
     * v: visible flag
     * b: blink flag
     * y: y coordinate
     * x: x coordinate
     * 0000 vbyy yyyx xxxx
     */
    helpers: {
        unpack: {
            position: function (bits) {
                var display_item = {};
                // size * y + x
                display_item.position = FONT.constants.SIZES.LINE * ((bits >> 5) & 0x001F) + (bits & 0x001F);
                display_item.isVisible = (bits & OSD.constants.VISIBLE) != 0;
                return display_item;
            }
        },
        pack: {
            position: function (display_item) {
                return (display_item.isVisible ? 0x0800 : 0) | (((display_item.position / FONT.constants.SIZES.LINE) & 0x001F) << 5) | (display_item.position % FONT.constants.SIZES.LINE);
            }
        }
    },

    encodeAlarms: function() {
        var result = [];

        result.push8(OSD.data.alarms.rssi);
        result.push16(OSD.data.alarms.batt_cap);
        result.push16(OSD.data.alarms.fly_minutes);
        result.push16(OSD.data.alarms.max_altitude);
        result.push16(OSD.data.alarms.dist);
        result.push16(OSD.data.alarms.max_neg_altitude);
        return result;
    },

    decodeAlarms: function(resp) {
        var alarms = resp.data;

        OSD.data.alarms.rssi = alarms.readU8();
        OSD.data.alarms.batt_cap = alarms.readU16();
        OSD.data.alarms.fly_minutes = alarms.readU16();
        OSD.data.alarms.max_altitude = alarms.readU16();
        OSD.data.alarms.dist = alarms.readU16();
        OSD.data.alarms.max_neg_altitude = alarms.readU16();
    },

    encodePreferences: function() {
        var result = [];
        var p = OSD.data.preferences;

        result.push8(p.video_system);
        result.push8(p.main_voltage_decimals);
        result.push8(p.ahi_reverse_roll);
        result.push8(p.crosshairs_style);
        result.push8(p.left_sidebar_scroll);
        result.push8(p.right_sidebar_scroll);
        result.push8(p.sidebar_scroll_arrows);
        result.push8(p.units);
        result.push8(p.stats_energy_unit)
        return result;
    },

    decodePreferences: function(resp) {
        var prefs = resp.data;
        var p = OSD.data.preferences;

        p.video_system = prefs.readU8();
        p.main_voltage_decimals = prefs.readU8();
        p.ahi_reverse_roll = prefs.readU8();
        p.crosshairs_style = prefs.readU8();
        p.left_sidebar_scroll = prefs.readU8();
        p.right_sidebar_scroll = prefs.readU8();
        p.sidebar_scroll_arrows = prefs.readU8();
        p.units = prefs.readU8();
        p.stats_energy_unit = prefs.readU8();
    },

    encodeLayoutItem: function(layout, item, pos) {
        var result = [];

        result.push8(layout);
        result.push8(item.id);
        result.push16(this.helpers.pack.position(pos));

        return result;
    },

    decodeLayouts: function(resp) {
        var layouts = resp.data;

        var layout_count = layouts.readU8();
        var item_count = layouts.readU8();

        for (var ii = 0; ii < layout_count; ii++) {
            var items = [];
            for (var jj = 0; jj < item_count; jj++) {
                var bits = layouts.readU16();
                items.push(this.helpers.unpack.position(bits));
            }
            OSD.data.layouts.push(items);
        }

        OSD.data.layout_count = layout_count;
    },

    encodeOther: function () {
        var result = [-1, OSD.data.preferences.video_system];
        result.push8(OSD.data.preferences.units);
        // watch out, order matters! match the firmware
        result.push8(OSD.data.alarms.rssi);
        result.push16(OSD.data.alarms.batt_cap);
        result.push16(OSD.data.alarms.fly_minutes);
        result.push16(OSD.data.alarms.max_altitude);
        // These might be null, since there weren't supported
        // until version 1.8
        if (OSD.data.alarms.dist !== null) {
            result.push16(OSD.data.alarms.dist);
        }
        if (OSD.data.alarms.max_neg_altitude !== null) {
            result.push16(OSD.data.alarms.max_neg_altitude);
        }
        return result;
    },

    encodeItem: function (id, itemData) {
        var buffer = [];
        buffer.push8(id);
        buffer.push16(this.helpers.pack.position(itemData));
        return buffer;
    },

    decode: function (payload) {
        if (payload.length <= 1) {
            return;
        }
        var view = payload.data;
        var d = OSD.data;
        d.supported = view.readU8();
        d.preferences.video_system = view.readU8();
        d.preferences.units = view.readU8();

        d.alarms.rssi = view.readU8();
        d.alarms.batt_cap = view.readU16();
        d.alarms.fly_minutes = view.readU16();
        d.alarms.max_altitude = view.readU16();

        if (semver.gt(CONFIG.flightControllerVersion, '1.7.3')) {
            d.alarms.dist = view.readU16();
            d.alarms.max_neg_altitude = view.readU16();
        }

        d.items = [];
        // start at the offset from the other fields
        while (view.offset < view.byteLength) {
            var bits = view.readU16();
            d.items.push(this.helpers.unpack.position(bits));
        }
    },
};

OSD.GUI = {};
OSD.GUI.preview = {
    onMouseEnter: function () {
        var item = $(this).data('item');
        if (!item) {
            return;
        }
        $('.field-' + item.id).addClass('mouseover');
    },

    onMouseLeave: function () {
        var item = $(this).data('item');
        if (!item) {
            return;
        }
        $('.field-' + item.id).removeClass('mouseover')
    },

    onDragStart: function (e) {
        var ev = e.originalEvent;
        var item = $(ev.target).data('item');
        //noinspection JSUnresolvedVariable
        ev.dataTransfer.setData("text/plain", item.id);
        //noinspection JSUnresolvedVariable
        ev.dataTransfer.setDragImage(item.preview_img, 6, 9);
    },
    onDragOver: function (e) {
        var ev = e.originalEvent;
        ev.preventDefault();
        //noinspection JSUnresolvedVariable
        ev.dataTransfer.dropEffect = "move";
        $(this).css({
            background: 'rgba(0,0,0,.5)'
        });
    },

    onDragLeave: function (e) {
        // brute force unstyling on drag leave
        $(this).removeAttr('style');
    },

    onDrop: function (e) {
        var ev = e.originalEvent;
        var position = $(this).removeAttr('style').data('position');;
        //noinspection JSUnresolvedVariable
        var item_id = parseInt(ev.dataTransfer.getData('text'));
        var item = OSD.get_item(item_id);
        var preview = OSD.get_item_preview(item);
        var line_width = 0;
        var item_width = 0;
        for (var ii = 0; ii < preview.length; ii++) {
            if (preview[ii] == '\n') {
                item_width = Math.max(item_width, line_width);
                line_width = 0;
                continue;
            }
            line_width++;
        }
        item_width = Math.max(item_width, line_width);
        var overflows_line = FONT.constants.SIZES.LINE - ((position % FONT.constants.SIZES.LINE) + item_width);
        if (overflows_line < 0) {
            position += overflows_line;
        }

        $('input.' + item_id + '.position').val(position).change();
    }
};

OSD.GUI.checkAndProcessSymbolPosition = function(pos, charCode) {
    if (typeof OSD.data.preview[pos] === 'object' && OSD.data.preview[pos][0] !== null) {
        // position already in use, always put object item at position
        OSD.data.preview[pos] = [OSD.data.preview[pos][0], charCode, 'red'];
    } else {
        // position not used by an object type, put character at position
        // character types can overwrite character types (e.g. crosshair)
        OSD.data.preview[pos] = charCode;
    }
};

OSD.GUI.updateVideoMode = function() {
    // video mode
    var $videoTypes = $('.video-types').empty();
    for (var i = 0; i < OSD.constants.VIDEO_TYPES.length; i++) {

        $videoTypes.append(
            $('<label/>')
            .append($('<input name="video_system" type="radio"/>' + OSD.constants.VIDEO_TYPES[i] + '</label>')
                .prop('checked', i === OSD.data.preferences.video_system)
                .data('type', i)
            )
        );
    }

    $videoTypes.find(':radio').click(function () {
        OSD.data.preferences.video_system = $(this).data('type');
        OSD.updateDisplaySize();
        OSD.GUI.saveConfig();
    });
};

OSD.GUI.updateUnits = function() {
    // units
    var $unitMode = $('.units select').empty();

    $('.units-container').show();
    $unitMode.empty();
    var $unitTip = $('.units .cf_tip');
    for (var i = 0; i < OSD.constants.UNIT_TYPES.length; i++) {
        var unitType = OSD.constants.UNIT_TYPES[i];
        if (unitType.min_version && semver.lt(CONFIG.flightControllerVersion, unitType.min_version)) {
            continue;
        }
        var name = chrome.i18n.getMessage(unitType.name);
        var $option = $('<option>' + name + '</option>');
        $option.attr('value', name);
        $option.data('type', unitType.value);
        var tip = null;
        if (unitType.tip) {
            tip = chrome.i18n.getMessage(unitType.tip);
        }
        if (OSD.data.preferences.units === unitType.value) {
            $option.prop('selected', true);
            if (unitType.tip) {
                $unitTip.attr('title', chrome.i18n.getMessage(unitType.tip));
                $unitTip.fadeIn();
            } else {
                $unitTip.fadeOut();
            }
        }
        $unitMode.append($option);
    }
    $unitMode.change(function (e) {
        var selected = $(this).find(':selected');
        OSD.data.preferences.units = selected.data('type');
        OSD.GUI.saveConfig();
    });
};

OSD.GUI.updateAlarms = function() {
    // alarms
    $('.alarms-container').show();
    var $alarms = $('.alarms').empty();
    for (var kk = 0; kk < OSD.constants.ALL_ALARMS.length; kk++) {
        var alarm = OSD.constants.ALL_ALARMS[kk];
        var label = chrome.i18n.getMessage('osdAlarm' + alarm.name);
        var value = OSD.data.alarms[alarm.field];
        if (value === undefined) {
            continue;
        }
        if (alarm.unit) {
            var unit = typeof alarm.unit === 'function' ? alarm.unit(OSD.data) : alarm.unit;
            var suffix = chrome.i18n.getMessage(unit) || unit;
            label += ' (' + suffix + ')';
        }
        var step = 1;
        if (typeof alarm.step === 'function') {
            step = alarm.step(OSD.data)
        }
        var alarmInput = $('<input name="alarm" type="number" step="' + step + '"/>' + label + '</label>');
        alarmInput.data('alarm', alarm);
        if (typeof alarm.to_display === 'function') {
            value = alarm.to_display(OSD.data, value);
        }
        alarmInput.val(value);
        alarmInput.blur(function (e) {
            var $alarm = $(this);
            var val = $alarm.val();
            var alarm = $alarm.data('alarm');
            if (typeof alarm.from_display === 'function') {
                val = alarm.from_display(OSD.data, val);
            }
            OSD.data.alarms[alarm.field] = val;
            // We just need to save the config. The field is already
            // up to date, since it's where the value was changed
            // by the user.
            OSD.saveAlarms();
        });
        var $input = $('<label/>');
        var help = chrome.i18n.getMessage('osdAlarm' + alarm.name + '_HELP');
        if (help) {
            $('<div class="helpicon cf_tip"></div>')
                .css('margin-top', '1px')
                .attr('title', help)
                .appendTo($input)
                .jBox('Tooltip', {
                    delayOpen: 100,
                    delayClose: 100,
                    position: {
                        x: 'right',
                        y: 'center'
                    },
                    outside: 'x'
                });
        }
        $input.append(alarmInput);
        $alarms.append($input);
    }
};

OSD.GUI.updateFields = function() {
    // display fields on/off and position
    var $tmpl = $('#osd_group_template').hide();
    // Clear previous groups, if any
    $('.osd_group').remove();
    for (var ii = 0; ii < OSD.constants.ALL_DISPLAY_GROUPS.length; ii++) {
        var group = OSD.constants.ALL_DISPLAY_GROUPS[ii];
        var groupItems = [];
        for (var jj = 0; jj < group.items.length; jj++) {
            var item = group.items[jj];
            if (!OSD.is_item_displayed(item, group)) {
                continue;
            }
            OSD.data.groups[item.id] = group;
            groupItems.push(item);
        }
        if (groupItems.length == 0) {
            continue;
        }
        var groupContainer = $tmpl.clone().addClass('osd_group').show();
        var groupTitleContainer = groupContainer.find('.spacer_box_title');
        var groupTitle = chrome.i18n.getMessage(group.name);
        groupTitleContainer.text(groupTitle);
        var groupHelp = chrome.i18n.getMessage(group.name + '_HELP');
        if (groupHelp) {
            $('<div class="helpicon cf_tip"></div>')
                .css('margin-top', '1px')
                .attr('title', groupHelp)
                .appendTo(groupTitleContainer)
                .jBox('Tooltip', {
                    delayOpen: 100,
                    delayClose: 100,
                    position: {
                        x: 'right',
                        y: 'center'
                    },
                    outside: 'x'
                });
        }
        var $displayFields = groupContainer.find('.display-fields');
        for (var jj = 0; jj < groupItems.length; jj++) {
            var item = groupItems[jj];
            var itemData = OSD.data.items[item.id];
            var checked = itemData.isVisible ? 'checked' : '';
            var $field = $('<div class="display-field field-' + item.id + '"/>');
            var name = item.name;
            var nameKey = 'osdElement_' + name;
            var nameMessage = chrome.i18n.getMessage(nameKey);
            if (nameMessage) {
                name = nameMessage;
            } else {
                name = inflection.titleize(name);
            }
            var help = chrome.i18n.getMessage(nameKey + '_HELP');
            if (help) {
                $('<div class="helpicon cf_tip"></div>')
                    .css('margin-top', '1px')
                    .attr('title', help)
                    .appendTo($field)
                    .jBox('Tooltip', {
                        delayOpen: 100,
                        delayClose: 100,
                        position: {
                            x: 'right',
                            y: 'center'
                        },
                        outside: 'x'
                    });
            }
            $field.append(
                $('<input type="checkbox" name="' + item.name + '" class="togglesmall"></input>')
                    .data('item', item)
                    .attr('checked', itemData.isVisible)
                    .change(function () {
                        var item = $(this).data('item');
                        var itemData = OSD.data.items[item.id];
                        var $position = $(this).parent().find('.position.' + item.name);
                        itemData.isVisible = !itemData.isVisible;

                        if (itemData.isVisible) {
                            $position.show();
                        } else {
                            $position.hide();
                        }

                        OSD.GUI.saveItem(item);
                    })
            );

            $field.append('<label for="' + item.name + '" class="char-label">' + name + '</label>');
            if (item.positionable !== false) {
                $field.append(
                    $('<input type="number" class="' + item.id + ' position"></input>')
                        .data('item', item)
                        .val(itemData.position)
                        .change($.debounce(250, function (e) {
                            var item = $(this).data('item');
                            var itemData = OSD.data.items[item.id];
                            itemData.position = parseInt($(this).val());
                            OSD.GUI.saveItem(item);
                        }))
                );
            }
            $displayFields.append($field);
        }
        $tmpl.parent().append(groupContainer);
    }
    // TODO: If we add more switches somewhere else, this
    // needs to be called after all of them have been set up
    GUI.switchery();
};

OSD.GUI.updateMapPreview = function(centerishPosition, name, symbol) {
    if ($('input[name="' + name + '"]').prop('checked')) {
        var mapInitialX = OSD.data.display_size.x - 2;
        OSD.GUI.checkAndProcessSymbolPosition(mapInitialX, SYM.DIRECTION);
        OSD.GUI.checkAndProcessSymbolPosition(mapInitialX + OSD.data.display_size.x, symbol.charCodeAt(0));
        OSD.GUI.checkAndProcessSymbolPosition(centerishPosition, SYM.HOME);
        var scalePos = 1 + OSD.data.display_size.x * (OSD.data.display_size.y - 2);
        OSD.GUI.checkAndProcessSymbolPosition(scalePos, SYM.SCALE);
        var scale;
        if (OSD.data.preferences.units === 0) {
            scale = FONT.embed_dot("0.10") + FONT.symbol(SYM.MI);
        } else {
            scale = "100" + FONT.symbol(SYM.M);
        }
        for (var ii = 0; ii < scale.length; ii++) {
            OSD.GUI.checkAndProcessSymbolPosition(scalePos + ii + 1, scale.charCodeAt(ii));
        }
    }
};

OSD.GUI.updatePreviews = function() {
    // buffer the preview;
    OSD.data.preview = [];
    OSD.data.display_size.total = OSD.data.display_size.x * OSD.data.display_size.y;
    for (var ii = 0; ii < OSD.data.display_items.length; ii++) {
        var field = OSD.data.display_items[ii];
        // reset fields that somehow end up off the screen
        if (field.position > OSD.data.display_size.total) {
            field.position = 0;
        }
    }

    // clear the buffer
    for (i = 0; i < OSD.data.display_size.total; i++) {
        OSD.data.preview.push([null, ' '.charCodeAt(0)]);
    };

    // draw all the displayed items and the drag and drop preview images
    for (var ii = 0; ii < OSD.data.items.length; ii++) {
        var item = OSD.get_item(ii);
        if (!item || !OSD.is_item_displayed(item, OSD.data.groups[item.id])) {
            continue;
        }
        var itemData = OSD.data.items[ii];
        if (!itemData.isVisible) {
            continue;
        }
        var j = (itemData.position >= 0) ? itemData.position : itemData.position + OSD.data.display_size.total;
        // create the preview image
        item.preview_img = new Image();
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext("2d");
        // fill the screen buffer
        var preview = OSD.get_item_preview(item);
        if (!preview) {
            continue;
        }
        var x = 0;
        var y = 0;
        for (i = 0; i < preview.length; i++) {
            var charCode = preview.charCodeAt(i);
            if (charCode == '\n'.charCodeAt(0)) {
                x = 0;
                y++;
                continue;
            }
            // test if this position already has a character placed
            if (OSD.data.preview[j+x+(y*OSD.data.display_size.x)][0] !== null) {
                // if so set background color to red to show user double usage of position
                OSD.data.preview[j+x+(y*OSD.data.display_size.x)] = [item, charCode, 'red'];
            } else {
                OSD.data.preview[j+x+(y*OSD.data.display_size.x)] = [item, charCode];
            }
            // draw the preview
            var img = new Image();
            img.src = FONT.draw(charCode);
            ctx.drawImage(img, x*FONT.constants.SIZES.CHAR_WIDTH, y*FONT.constants.SIZES.CHAR_HEIGHT);
            x++;
        }
        item.preview_img.src = canvas.toDataURL('image/png');
        // Required for NW.js - Otherwise the <img /> will
        // consume drag/drop events.
        item.preview_img.style.pointerEvents = 'none';
    }
    var centerishPosition = 225;

    // artificial horizon
    if ($('input[name="ARTIFICIAL_HORIZON"]').prop('checked')) {
        for (i = 0; i < 9; i++) {
            OSD.GUI.checkAndProcessSymbolPosition(centerishPosition - 4 + i, SYM.AH_BAR9_0 + 4);
        }
    }

    // crosshairs
    if ($('input[name="CROSSHAIRS"]').prop('checked')) {
        OSD.GUI.checkAndProcessSymbolPosition(centerishPosition - 1, SYM.AH_CENTER_LINE);
        OSD.GUI.checkAndProcessSymbolPosition(centerishPosition + 1, SYM.AH_CENTER_LINE_RIGHT);
        OSD.GUI.checkAndProcessSymbolPosition(centerishPosition, SYM.AH_CENTER);
    }

    // sidebars
    if ($('input[name="HORIZON_SIDEBARS"]').prop('checked')) {
        var hudwidth = OSD.constants.AHISIDEBARWIDTHPOSITION;
        var hudheight = OSD.constants.AHISIDEBARHEIGHTPOSITION;
        for (i = -hudheight; i <= hudheight; i++) {
            OSD.GUI.checkAndProcessSymbolPosition(centerishPosition - hudwidth + (i * FONT.constants.SIZES.LINE), SYM.AH_DECORATION);
            OSD.GUI.checkAndProcessSymbolPosition(centerishPosition + hudwidth + (i * FONT.constants.SIZES.LINE), SYM.AH_DECORATION);
        }
        // AH level indicators
        OSD.GUI.checkAndProcessSymbolPosition(centerishPosition - hudwidth + 1, SYM.AH_LEFT);
        OSD.GUI.checkAndProcessSymbolPosition(centerishPosition + hudwidth - 1, SYM.AH_RIGHT);
    }

    OSD.GUI.updateMapPreview(centerishPosition, 'MAP_NORTH', 'N');
    OSD.GUI.updateMapPreview(centerishPosition, 'MAP_TAKEOFF', 'T');

    // render
    var $preview = $('.display-layout .preview').empty();
    var $row = $('<div class="row"/>');
    for (i = 0; i < OSD.data.display_size.total;) {
        var charCode = OSD.data.preview[i];
        var colorStyle = '';

        if (typeof charCode === 'object') {
            var item = OSD.data.preview[i][0];
            charCode = OSD.data.preview[i][1];
            if (OSD.data.preview[i][2] !== undefined) {
                // if third field is set it contains a background color
                colorStyle = 'style="background-color: ' + OSD.data.preview[i][2] + ';"';
            }
        }
        var $img = $('<div class="char"' + colorStyle + '><img src=' + FONT.draw(charCode) + '></img></div>')
            .on('mouseenter', OSD.GUI.preview.onMouseEnter)
            .on('mouseleave', OSD.GUI.preview.onMouseLeave)
            .on('dragover', OSD.GUI.preview.onDragOver)
            .on('dragleave', OSD.GUI.preview.onDragLeave)
            .on('drop', OSD.GUI.preview.onDrop)
            .data('item', item)
            .data('position', i);
        // Required for NW.js - Otherwise the <img /> will
        // consume drag/drop events.
        $img.find('img').css('pointer-events', 'none');
        if (item && item.positionable !== false) {
            $img.addClass('field-' + item.id)
                .data('item', item)
                .prop('draggable', true)
                .on('dragstart', OSD.GUI.preview.onDragStart);
        }

        $row.append($img);
        if (++i % OSD.data.display_size.x == 0) {
            $preview.append($row);
            $row = $('<div class="row"/>');
        }
    }
};

OSD.GUI.updateAll = function() {
    if (!OSD.data.supported) {
        $('.unsupported').fadeIn();
        return;
    }
    var layouts = $('.osd_layouts');
    if (OSD.data.layout_count > 1) {
        layouts.empty();
        for (var ii = 0; ii < OSD.data.layout_count; ii++) {
            var name = ii > 0 ? chrome.i18n.getMessage('osdLayoutAlternative', [ii]) : chrome.i18n.getMessage('osdLayoutDefault');
            var opt = $('<option/>').val(ii).text(name).appendTo(layouts);
        }
        layouts.val(OSD.data.selected_layout);
        layouts.show();
        layouts.on('change', function() {
            OSD.updateSelectedLayout(parseInt(layouts.val()));
            OSD.GUI.updateFields();
            OSD.GUI.updatePreviews();
        });
    } else {
        layouts.hide();
        layouts.off('change');
    }
    $('.supported').fadeIn();
    OSD.GUI.updateVideoMode();
    OSD.GUI.updateUnits();
    OSD.GUI.updateAlarms();
    OSD.GUI.updateFields();
    OSD.GUI.updatePreviews();
};

OSD.GUI.update = function() {
    OSD.reload(function() {
        OSD.GUI.updateAll();
    });
};

OSD.GUI.saveItem = function(item) {
    OSD.saveItem(item, function() {
        OSD.GUI.updatePreviews();
    });
};

OSD.GUI.saveConfig = function() {
    OSD.saveConfig(function() {
        OSD.GUI.updatePreviews();
        OSD.GUI.updateAlarms();
    });
};

TABS.osd = {};
TABS.osd.initialize = function (callback) {

    if (GUI.active_tab != 'osd') {
        GUI.active_tab = 'osd';
    }

    $('#content').load("./tabs/osd.html", function () {
        // translate to user-selected language
        localize();

        // Open modal window
        OSD.GUI.jbox = new jBox('Modal', {
            width: 600,
            height: 240,
            closeButton: 'title',
            animation: false,
            attach: $('#fontmanager'),
            title: 'OSD Font Manager',
            content: $('#fontmanagercontent')
        });


        $('a.save').click(function () {
            var self = this;
            MSP.promise(MSPCodes.MSP_EEPROM_WRITE);
            GUI.log('OSD settings saved');
            var oldText = $(this).text();
            $(this).html("Saved");
            setTimeout(function () {
                $(self).html(oldText);
            }, 2000);
        });

        // font preview window
        var $preview = $('.font-preview');

        //  init structs once, also clears current font
        FONT.initData();

        var $fontPicker = $('.fontbuttons button');
        $fontPicker.click(function (e) {
            if (!$(this).data('font-file')) {
                return;
            }
            $fontPicker.removeClass('active');
            $(this).addClass('active');
            $.get('/resources/osd/' + $(this).data('font-file') + '.mcm', function (data) {
                FONT.parseMCMFontFile(data);
                FONT.preview($preview);
                OSD.GUI.update();
            });
        });

        // load the first font when we change tabs
        $fontPicker.first().click();

        $('button.load_font_file').click(function () {
            $fontPicker.removeClass('active');
            FONT.openFontFile().then(function () {
                FONT.preview($preview);
                OSD.GUI.update();
            });
        });

        // font upload
        $('a.flash_font').click(function () {
            if (!GUI.connect_lock) { // button disabled while flashing is in progress
                $('.progressLabel').text('Uploading...');
                FONT.upload($('.progress').val(0)).then(function () {
                    var msg = 'Uploaded all ' + FONT.data.characters.length + ' characters';
                    $('.progressLabel').text(msg);
                });
            }
        });

        $(document).on('click', 'span.progressLabel a.save_font', function () {
            //noinspection JSUnresolvedVariable
            chrome.fileSystem.chooseEntry({type: 'saveFile', suggestedName: 'baseflight', accepts: [
                {extensions: ['mcm']}
            ]}, function (fileEntry) {
                //noinspection JSUnresolvedVariable
                if (chrome.runtime.lastError) {
                    //noinspection JSUnresolvedVariable
                    console.error(chrome.runtime.lastError.message);
                    return;
                }

                //noinspection JSUnresolvedVariable
                chrome.fileSystem.getDisplayPath(fileEntry, function (path) {
                    console.log('Saving firmware to: ' + path);

                    // check if file is writable
                    //noinspection JSUnresolvedVariable
                    chrome.fileSystem.isWritableEntry(fileEntry, function (isWritable) {
                        if (isWritable) {
                            var blob = new Blob([intel_hex], {type: 'text/plain'});

                            fileEntry.createWriter(function (writer) {
                                var truncated = false;

                                writer.onerror = function (e) {
                                    console.error(e);
                                };

                                writer.onwriteend = function () {
                                    if (!truncated) {
                                        // onwriteend will be fired again when truncation is finished
                                        truncated = true;
                                        writer.truncate(blob.size);

                                        return;
                                    }
                                };

                                writer.write(blob);
                            }, function (e) {
                                console.error(e);
                            });
                        } else {
                            console.log('You don\'t have write permissions for this file, sorry.');
                            GUI.log('You don\'t have <span style="color: red">write permissions</span> for this file');
                        }
                    });
                });
            });
        });

        $(document).keypress(function (e) {
            if (e.which == 13) { // enter
                // Trigger regular Flashing sequence
                $('a.flash_font').click();
            }
        });

        // Update SENSOR_CONFIG, used to detect
        // OSD_AIR_SPEED
        mspHelper.loadSensorConfig(function () {
            GUI.content_ready(callback);
        });
    });
};

TABS.osd.cleanup = function (callback) {
    PortHandler.flush_callbacks();

    // unbind "global" events
    $(document).unbind('keypress');
    $(document).off('click', 'span.progressLabel a');

    if (callback) callback();
};
