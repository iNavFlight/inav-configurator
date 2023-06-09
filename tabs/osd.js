/*global $,nwdialog*/
'use strict';

var SYM = SYM || {};
SYM.LAST_CHAR = 225; // For drawing the font preview
SYM.BLANK = 0x20;
SYM.MILLIOHM = 0x62;
SYM.BATT = 0x63;
SYM.RSSI = 0x01;
SYM.AH_RIGHT = 0x12D;
SYM.AH_LEFT = 0x12C;
SYM.THR = 0x95;
SYM.VOLT = 0x1F;
SYM.AH_DECORATION_UP = 0x15;
SYM.WIND_SPEED_HORIZONTAL = 0x86;
SYM.WIND_SPEED_VERTICAL = 0x87;
SYM.FLY_M = 0x9F;
SYM.ON_M = 0x9E;
SYM.AH_CENTER_LINE = 0x13A;
SYM.AH_CENTER_LINE_RIGHT = 0x13B;
SYM.AH_BAR9_0 = 0x14C;
SYM.AZIMUTH = 0x05;
SYM.AH_DECORATION = 0x131;
SYM.AMP = 0x6A;
SYM.MAH = 0x99;
SYM.WH = 0x6D;
SYM.WATT = 0x71;
SYM.MAH_KM_0 = 0x6B;
SYM.MAH_KM_1 = 0x6C;
SYM.MAH_MI_0 = 0x93;
SYM.MAH_MI_1 = 0x94;
SYM.AH_V_FT_0 = 0xD6;
SYM.AH_V_FT_1 = 0xD7;
SYM.AH_V_M_0 = 0xD8;
SYM.AH_V_M_1 = 0xD9;
SYM.WH_KM = 0x6E;
SYM.WH_MI = 0x6F;
SYM.GPS_SAT1 = 0x08;
SYM.GPS_SAT2 = 0x09;
SYM.GPS_HDP1 = 0x0E;
SYM.GPS_HDP2 = 0x0F;
SYM.KM = 0x83;
SYM.KMH = 0x90;
SYM.KMH_3D = 0x88;
SYM.MPH = 0x91;
SYM.MPH_3D = 0x89;
SYM.ALT_M = 0x76;
SYM.ALT_FT = 0x78;
SYM.LAT = 0x03;
SYM.LON = 0x04;
SYM.AIR = 0x8C;
SYM.DIRECTION = 0x17;
SYM.DIR_TO_HOME = 0x13C;
SYM.SCALE = 0x0D;
SYM.DIST_KM = 0x7E;
SYM.DIST_MI = 0x80;
SYM.M = 0x82;
SYM.MI = 0x84;
SYM.HOME = 0x10;
SYM.TRIP_DIST = 0x75;
SYM.HEADING = 0x0C;
SYM.DEGREES = 0x0B;
SYM.HEADING_N = 0xC8;
SYM.HEADING_E = 0xCA;
SYM.HEADING_W = 0xCB;
SYM.HEADING_DIVIDED_LINE = 0xCC;
SYM.HEADING_LINE = 0xCD;
SYM.VARIO_UP_2A = 0x155;
SYM.M_S = 0x8F;
SYM.FT_S = 0x8D;
SYM.CLOCK = 0xA0;
SYM.ZERO_HALF_TRAILING_DOT = 0xA1;
SYM.ZERO_HALF_LEADING_DOT = 0xB1;
SYM.ROLL_LEFT = 0xAD;
SYM.ROLL_LEVEL = 0xAE;
SYM.ROLL_RIGHT = 0xAF;
SYM.PITCH_UP = 0xB0;
SYM.PITCH_DOWN = 0xBB;
SYM.TEMP_C = 0x97;
SYM.TEMP_F = 0x96;
SYM.BARO_TEMP = 0xC0;
SYM.IMU_TEMP = 0xC1;
SYM.TEMP = 0xC2;
SYM.GFORCE = 0xBC;
SYM.GFORCE_X = 0xBD;
SYM.GFORCE_Y = 0xBE;
SYM.GFORCE_Z = 0xBF;
SYM.RPM = 0x8B;
SYM.ESC_TEMPERATURE = 0xC3;
SYM.RSS2 = 0x11;
SYM.DB = 0x12;
SYM.DBM = 0x13;
SYM.MW = 0x72;
SYM.SNR = 0x14;
SYM.LQ = 0x02;
SYM.GLIDESLOPE = 0x9C;
SYM.DIST_NM = 0x81;
SYM.NM = 0x85;
SYM.KT_3D = 0x8A;
SYM.KT = 0x92;
SYM.HUND_FTM = 0x8E;
SYM.MAH_NM_0 = 0x60;
SYM.MAH_NM_1 = 0x61;
SYM.AH_NM = 0x3F;
SYM.WH_NM = 0x70;
SYM.VTX_POWER = 0x27;
SYM.MAX = 0xCE;
SYM.PROFILE = 0xCF;
SYM.SWITCH_INDICATOR_HIGH = 0xD2;
SYM.GLIDE_MINS = 0xD5;
SYM.GLIDE_RANGE = 0xD4;
SYM.FLIGHT_MINS_REMAINING = 0xDA;
SYM.FLIGHT_DIST_REMAINING = 0x167;
SYM.GROUND_COURSE = 0xDC;
SYM.CROSS_TRACK_ERROR = 0xFC;
SYM.PAN_SERVO_IS_OFFSET_L = 0x1C7;

SYM.AH_AIRCRAFT0 = 0x1A2;
SYM.AH_AIRCRAFT1 = 0x1A3;
SYM.AH_AIRCRAFT2 = 0x1A4;
SYM.AH_AIRCRAFT3 = 0x1A5;
SYM.AH_AIRCRAFT4 = 0x1A6;

SYM.AH_CROSSHAIRS = new Array(0x166, 0x1A4, new Array(0x190, 0x191, 0x192), new Array(0x193, 0x194, 0x195), new Array(0x196, 0x197, 0x198), new Array(0x199, 0x19A, 0x19B), new Array (0x19C, 0x19D, 0x19E), new Array (0x19F, 0x1A0, 0x1A1));

var useESCTelemetry = false;
var useBaro         = false;
var useCRSFRx       = false;
var usePitot        = false;

var video_type = null;
var isGuidesChecked = false;
var FONT = FONT || {};

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
        var msg = 'that font file doesn\'t have the MAX7456 header, giving up';
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

        nwdialog.setContext(document);
        nwdialog.openFileDialog('.mcm', function(filename) {
            const fs = require('fs');
            const fontData = fs.readFileSync(filename, {flag: "r"});
            FONT.parseMCMFontFile(fontData.toString());
            resolve();
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

// Returns the font data for a blank character
FONT.blank = function() {
    var size = FONT.constants.SIZES.MAX_NVM_FONT_CHAR_SIZE;
    return Array.apply(null, {length: size}).map(function() { return SYM.BLANK; });
};

FONT.msp = {
    encode: function (charAddress) {
        var addr = [];
        if (charAddress > 255) {
            addr.push16(charAddress);
        } else {
            addr.push8(charAddress);
        }
        var data = FONT.data.characters_bytes[charAddress];
        if (!data) {
            data = FONT.blank();
        }
        return addr.concat(data.slice(0, FONT.constants.SIZES.MAX_NVM_FONT_CHAR_SIZE));
    }
};

FONT.upload = function (callback) {
    // Always upload 512 characters, using extra blanks if the font
    // has less characters. This ensures we overwrite the 2nd page
    // when uploading a 1-page font over a 2-page one.
    var count = 512;
    var addrs = [];
    for (var ii = 0; ii < count; ii++) {
        // Upload 2nd page first, so chips supporting just one page
        // overwrite page 2 with page 1. Note that this works fine with
        // INAV < 2.1 because it will write invalid character data over
        // the first pass, but then it will be ovewritten by the first
        // 256 characters.
        var charIndex = ii < 256 ? ii + 256 : ii - 256;
        addrs.push(charIndex);
    }
    addrs.reduce(function(p, next, idx) {
        return p.then(function() {
            if (callback) {
                callback(idx, count, (idx / count) * 100);
            }
            // Force usage of V1/V2 protocol to workaround the 64 byte write bug
            // on F3 when the configurator is running on macOS
            var proto = next <= 255 ? MSP.constants.PROTOCOL_V1 : MSP.constants.PROTOCOL_V2;
            var data = FONT.msp.encode(next);
            return MSP.promise(MSPCodes.MSP_OSD_CHAR_WRITE, data, proto);
        });
    }, Promise.resolve()).then(function() {
        OSD.GUI.jbox.close();
        return MSP.promise(MSPCodes.MSP_SET_REBOOT);
    });
};

FONT.preview = function ($el) {
    $el.empty();
    for (var i = 1; i <= SYM.LAST_CHAR; i++) {
        var url = FONT.data.character_image_urls[i];
        $el.append('<img src="' + url + '" title="0x' + i.toString(16) + '"></img> ');
    }
};

FONT.symbol = function (hexVal) {
    return String.fromCharCode(hexVal);
};

FONT.embed_dot = function(str) {
    var zero = '0'.charCodeAt(0);
    var repl = str.replace(/\d\.\d/, function(match) {
        var c1 = match.charCodeAt(0) + SYM.ZERO_HALF_TRAILING_DOT - zero;
        var c2 = match.charCodeAt(2) + SYM.ZERO_HALF_LEADING_DOT - zero;
        return FONT.symbol(c1) + FONT.symbol(c2);
    });
    return repl;
}

var OSD = OSD || {};

// common functions for altitude and negative altitude alarms
function altitude_alarm_unit(osd_data) {
    switch (OSD.data.preferences.units) {
        case 0: // Imperial
        case 3: // UK
        case 4: // GA
            return 'ft';
        default: // Metric
            return 'm';
    }
}

function altitude_alarm_to_display(osd_data, value) {
    switch (OSD.data.preferences.units) {
        case 0: // Imperial
        case 3: // UK
        case 4: // GA
            // feet to meters
            return Math.round(value * 3.28084)
        default: // Metric
            return value;
    }
}

function altitude_alarm_from_display(osd_data, value) {
    switch (OSD.data.preferences.units) {
        case 0: // Imperial
        case 3: // UK
        case 4: // GA
            // feet to meters
            return Math.round(value / 3.28084);
        default: // Metric
            return value;
    }
}

function altitude_alarm_max(osd_data, value) {
    var meters_max = 10000;
    switch (OSD.data.preferences.units) {
        case 0: // Imperial
        case 3: // UK
        case 4: // GA
            // meters max to feet max
            return Math.trunc(meters_max * 3.28084);
        default: // Metric
            return meters_max;
    }
}

// Used to wrap altitude conversion functions for firmwares up
// to 1.7.3, since the altitude alarm used either m or feet
// depending on the OSD display unit used (hence, no conversion)
function altitude_alarm_display_function(fn) {
    return function(osd_data, value) {
        return fn(osd_data, value)
    }
}

function osdMainBatteryPreview() {
    var s = '16.8';
    if (Settings.getInputValue('osd_main_voltage_decimals') == 2) {
        s += '3';
    }

    s += FONT.symbol(SYM.VOLT);
    return FONT.symbol(SYM.BATT) + FONT.embed_dot(s);
}

function osdmAhdrawnPreview() {
    let precision = Settings.getInputValue('osd_mah_used_precision');
    let preview = "1215075".substring(0, precision);

    return preview + FONT.symbol(SYM.MAH);
}

function osdCoordinatePreview(symbol, coordinate) {
    return function() {
        var digits = Settings.getInputValue('osd_coordinate_digits');
        if (!digits) {
            // Setting doesn't exist in the FC. Use 11, which
            // will make it look close to how it looked before 2.0
            digits = 11;
        }
        var integerLength = ('' + parseInt(coordinate)).length;
        return FONT.symbol(symbol) + FONT.embed_dot(coordinate.toFixed(digits - integerLength));
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
            gforce: null,
            gforce_axis_min: null,
            gforce_axis_max: null,
            current: null,
            imu_temp_alarm_min: null,
            imu_temp_alarm_max: null,
            baro_temp_alarm_min: null,
            baro_temp_alarm_max: null,
        },
        layouts: [],
        layout_count: 1, // This needs to be 1 for compatibility with < 2.0
        item_count: 0,
        items: [],
        groups: {},
        preview: [],
        isDjiHdFpv: false,
        isMspDisplay: false
    };
};

OSD.DjiElements =  {
    supported: [
        "RSSI_VALUE",
        "MAIN_BATT_VOLTAGE",
        "MAIN_BATT_CELL_VOLTAGE",
        "CRAFT_NAME",
        "FLYMODE",
        "ESC_TEMPERATURE",
        "ALTITUDE",
        "VARIO_NUM",
        "CROSSHAIRS",
        "HORIZON_SIDEBARS",
        "PITCH_ANGLE",
        "ROLL_ANGLE",
        "CURRENT_DRAW",
        "MAH_DRAWN",
        "GPS_SPEED",
        "GPS_SATS",
        "LONGITUDE",
        "LATITUDE",
        "DIRECTION_TO_HOME",
        "DISTANCE_TO_HOME"
    ],
    emptyGroups: [
        "MapsAndRadars",
        "GForce",
        "Timers",
        "VTX",
        "CRSF",
        "SwitchIndicators",
        "GVars",
        "PIDs",
        "PIDOutputs",
        "PowerLimits"
    ],
    supportedSettings: [
        "craft_name",
        "units"
    ],
    supportedAlarms: [
        "rssi_alarm",
        "osd_alt_alarm"
    ],
    craftNameElements: [
        "MESSAGES",
        "THROTTLE_POSITION",
        "SCALED_THROTTLE_POSITION",
        "3D_SPEED",
        "EFFICIENCY_MAH",
        "TRIP_DIST"
    ]
};

OSD.constants = {
    VISIBLE: 0x2000,
    VIDEO_TYPES: [
        'AUTO',
        'PAL',
        'NTSC',
        'HDZERO',
        'DJIWTF',
        'AVATAR',
        'BF43COMPAT',
        'BFHDCOMPAT'
    ],
    VIDEO_LINES: {
        PAL: 16,
        NTSC: 13,
        HDZERO: 18,
        DJIWTF: 22,
        AVATAR: 20,
        BF43COMPAT: 16,
        BFHDCOMPAT: 20
    },
    VIDEO_COLS: {
        PAL: 30,
        NTSC: 30,
        HDZERO: 50,
        DJIWTF: 60,
        AVATAR: 53,
        BF43COMPAT: 30,
        BFHDCOMPAT: 53
    },
    VIDEO_BUFFER_CHARS: {
        PAL: 480,
        NTSC: 390,
        HDZERO: 900,
        DJIWTF: 1320,
        AVATAR: 1060,
        BF43COMPAT: 480,
        BFHDCOMPAT: 1060
    },
    UNIT_TYPES: [
        {name: 'osdUnitImperial', value: 0},
        {name: 'osdUnitMetric', value: 1},
        {name: 'osdUnitMetricMPH', tip: 'osdUnitMetricMPHTip', value: 2},
        {name: 'osdUnitUK', tip: 'osdUnitUKTip', value: 3},
        {name: 'osdUnitGA', tip: 'osdUnitGATip', value: 4},
    ],
    AHISIDEBARWIDTHPOSITION: 7,
    AHISIDEBARHEIGHTPOSITION: 3,

    ALL_ALARMS: [
        {
            name: 'RSSI',
            field: 'rssi',
            unit: '%',
            min: 0,
            max: 100
        },
        {
            name: 'BATT_CAP',
            field: 'batt_cap',
            unit: 'mah',
            min: 0,
            max: 4294967295
        },
        {
            name: 'FLY_MINUTES',
            field: 'fly_minutes',
            unit: 'minutes',
            min: 0,
            max: 600
        },
        {
            name: 'MAX_ALTITUDE',
            field: 'max_altitude',
            unit: altitude_alarm_unit,
            to_display: altitude_alarm_display_function(altitude_alarm_to_display),
            from_display: altitude_alarm_display_function(altitude_alarm_from_display),
            min: 0,
            max: altitude_alarm_max
        },
        {
            name: 'MAX_NEG_ALTITUDE',
            field: 'max_neg_altitude',
            unit: altitude_alarm_unit,
            to_display: altitude_alarm_to_display,
            from_display: altitude_alarm_from_display,
            min: 0,
            max: altitude_alarm_max
        },
        {
            name: 'DIST',
            field: 'dist',
            unit: function(osd_data) {
                switch (OSD.data.preferences.units) {
                    case 0: // Imperial
                    case 3: // UK
                        return 'mi';
                    case 4: // GA
                        return 'NM';
                    default: // Metric
                        return 'm';
                }
            },
            to_display: function(osd_data, value) {
                switch (OSD.data.preferences.units) {
                    case 0: // Imperial
                    case 3: // UK
                        // meters to miles
                        return (value / 1609.344).toFixed(2);
                    case 4: // GA
                        // metres to nautical miles
                        return (value / 1852.001).toFixed(2);
                    default: // Metric
                        return value;
                }
            },
            from_display: function(osd_data, value) {
                switch (OSD.data.preferences.units) {
                    case 0: // Imperial
                    case 3: // UK
                        // miles to meters
                        return Math.round(value * 1609.344);
                    case 4: // GA
                        return Math.round(value * 1852.001);
                    default: // Metric
                        return value;
                }
            },
            step: function(osd_data) {
                switch (OSD.data.preferences.units) {
                    case 0: // Imperial
                    case 3: // UK
                    case 4: // GA
                        return 0.01;
                    default: // Metric
                        return 1;
                }
            },
            min: 0,
            max: function(osd_data) {
                var meters_max = 50000;
                switch (OSD.data.preferences.units) {
                    case 0: // Imperial
                    case 3: // UK
                        // Meters max to miles max
                        return Math.trunc(meters_max / 1609.344);
                    case 4: // GA
                        // Meters max to nautical miles max
                        return Math.trunc(meters_max / 1852.001);
                    default: // Metric
                        return meters_max;
                }
            }
        },
        {
            name: 'GFORCE',
            field: 'gforce',
            min_version: '2.2.0',
            step: 0.1,
            unit: 'g',
            to_display: function(osd_data, value) { return value / 1000 },
            from_display: function(osd_data, value) { return value * 1000 },
            min: 0,
            max: 20
        },
        {
            name: 'GFORCE_AXIS_MIN',
            field: 'gforce_axis_min',
            min_version: '2.2.0',
            step: 0.1,
            unit: 'g',
            to_display: function(osd_data, value) { return value / 1000 },
            from_display: function(osd_data, value) { return value * 1000 },
            min: -20,
            max: 20
        },
        {
            name: 'GFORCE_AXIS_MAX',
            field: 'gforce_axis_max',
            min_version: '2.2.0',
            step: 0.1,
            unit: 'g',
            to_display: function(osd_data, value) { return value / 1000 },
            from_display: function(osd_data, value) { return value * 1000 },
            min: -20,
            max: 20
        },
        {
            name: 'CURRENT',
            field: 'current',
            min_version: '2.2.0',
            step: 1,
            unit: 'A',
            min: 0,
            max: 255
        },
        {
            name: 'IMU_TEMPERATURE_MIN',
            field: 'imu_temp_alarm_min',
            unit: '°C',
            step: 0.5,
            to_display: function(osd_data, value) { return value / 10 },
            from_display: function(osd_data, value) { return value * 10 },
            min: -55,
            max: 125
        },
        {
            name: 'IMU_TEMPERATURE_MAX',
            field: 'imu_temp_alarm_max',
            step: 0.5,
            unit: '°C',
            to_display: function(osd_data, value) { return value / 10 },
            from_display: function(osd_data, value) { return value * 10 },
            min: -55,
            max: 125
        },
        {
            name: 'BARO_TEMPERATURE_MIN',
            field: 'baro_temp_alarm_min',
            step: 0.5,
            unit: '°C',
            to_display: function(osd_data, value) { return value / 10 },
            from_display: function(osd_data, value) { return value * 10 },
            min: -55,
            max: 125
        },
        {
            name: 'BARO_TEMPERATURE_MAX',
            field: 'baro_temp_alarm_max',
            step: 0.5,
            unit: '°C',
            to_display: function(osd_data, value) { return value / 10 },
            from_display: function(osd_data, value) { return value * 10 },
            min: -55,
            max: 125
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
                    preview: osdMainBatteryPreview,
                },
                {
                    name: 'SAG_COMP_MAIN_BATT_VOLTAGE',
                    id: 53,
                    preview: osdMainBatteryPreview,
                },
                {
                    name: 'MAIN_BATT_CELL_VOLTAGE',
                    id: 32,
                    preview: FONT.symbol(SYM.BATT) + FONT.embed_dot('3.90') + FONT.symbol(SYM.VOLT)
                },
                {
                    name: 'SAG_COMP_MAIN_BATT_CELL_VOLTAGE',
                    id: 54,
                    preview: FONT.symbol(SYM.BATT) + FONT.embed_dot('4.18') + FONT.symbol(SYM.VOLT)
                },
                {
                    name: 'POWER_SUPPLY_IMPEDANCE',
                    id: 55,
                    preview: ' 23' + FONT.symbol(SYM.MILLIOHM)
                },
                {
                    name: 'MAIN_BATT_REMAINING_PERCENTAGE',
                    id: 38,
                    preview: FONT.symbol(SYM.BATT) + '100%'
                },
                {
                    name: 'REMAINING_FLIGHT_TIME',
                    id: 48,
                    preview: FONT.symbol(SYM.FLIGHT_MINS_REMAINING) + '10:35'
                },
                {
                    name: 'REMAINING_FLIGHT_DISTANCE',
                    id: 49,
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 3: // UK
                                return FONT.symbol(SYM.FLIGHT_DIST_REMAINING) + FONT.embed_dot('0.98') + FONT.symbol(SYM.DIST_MI);
                            case 4: // GA
                                return FONT.symbol(SYM.FLIGHT_DIST_REMAINING) + FONT.embed_dot('0.85') + FONT.symbol(SYM.DIST_NM);
                            default: // Metric
                                return FONT.symbol(SYM.FLIGHT_DIST_REMAINING) + FONT.embed_dot('1.73') + FONT.symbol(SYM.DIST_KM);
                        }
                    }
                },
                {
                    name: 'THROTTLE_POSITION',
                    id: 9,

                    preview: ' ' + FONT.symbol(SYM.THR) + ' 69'
                },
                {
                    name: 'SCALED_THROTTLE_POSITION',
                    id: 33,
                    preview: FONT.symbol(SYM.SCALE) + FONT.symbol(SYM.THR) + ' 51'
                },
                {
                    name: 'CRAFT_NAME',
                    id: 8,
                    preview: '[CRAFT_NAME]'
                },
                {
                    name: 'PILOT_NAME',
                    id: 142,
                    preview: '[PILOT_NAME]'
                },
                {
                    name: 'FLYMODE',
                    id: 7,
                    preview: 'ACRO'
                },
                {
                    name: 'MESSAGES',
                    id: 30,
                    preview: '       SYSTEM MESSAGE       ', // 28 chars, like OSD_MESSAGE_LENGTH on osd.c
                },
                {
                    name: 'HEADING',
                    id: 24,
                    preview: FONT.symbol(SYM.HEADING) + '175' + FONT.symbol(SYM.DEGREES)
                },
                {
                    name: 'HEADING_GRAPH',
                    id: 34,
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
                    enabled: function() {
                        return usePitot;
                    },
                    preview: function(osd_data) {
                        var speed;
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 2: // Metric + MPH
                            case 3: // UK
                                speed = '115' + FONT.symbol(SYM.MPH);
                                break;
                            case 4: // GA
                                speed = '100' + FONT.symbol(SYM.KT);
                                break;
                            default: // Metric
                                speed = '185' + FONT.symbol(SYM.KMH);
                                break;
                        }

                        return FONT.symbol(SYM.AIR) + speed;
                    }
                },
                {
                    name: 'AIR_MAX_SPEED',
                    id: 127,
                    enabled: function() {
                        return usePitot;
                    },
                    preview: function(osd_data) {
                        // 3 chars
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 2: // Metric + MPH
                            case 3: // UK
                                return FONT.symbol(SYM.MAX) + FONT.symbol(SYM.AIR) + FONT.embed_dot('135') + FONT.symbol(SYM.MPH);
                            case 4: // GA
                                return FONT.symbol(SYM.MAX) + FONT.symbol(SYM.AIR) + FONT.embed_dot('177') + FONT.symbol(SYM.KT);
                            default: // Metric
                                return FONT.symbol(SYM.MAX) + FONT.symbol(SYM.AIR) + FONT.embed_dot('217') + FONT.symbol(SYM.KMH);
                        }
                    }
                },
                {
                    name: 'RTC_TIME',
                    id: 29,
                    preview: FONT.symbol(SYM.CLOCK) + '13:37:25'
                },
                {
                    name: 'RC_SOURCE',
                    id: 104,
                    preview: 'MSP'
                },
                {
                    name: 'ESC_RPM',
                    id: 106,
                    min_version: '2.3.0',
                    enabled: function() {
                        return useESCTelemetry;
                    },
                    preview: function(){
                        let rpmPreview = '112974'.substr((6 - parseInt(Settings.getInputValue('osd_esc_rpm_precision'))));
                        return FONT.symbol(SYM.RPM) + rpmPreview;
                    }
                },
                {
                    name: 'GLIDESLOPE',
                    id: 124,
                    min_version: '3.0.0',
                    preview: FONT.symbol(SYM.GLIDESLOPE) + FONT.embed_dot('12.3'),
                },
                {
                    name: 'GLIDE_TIME',
                    id: 136,
                    min_version: '5.0.0',
                    preview: FONT.symbol(SYM.GLIDE_MINS) + '02:34',
                },
                {
                    name: 'GLIDE_RANGE',
                    id: 137,
                    min_version: '5.0.0',
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 3: // UK
                                return FONT.symbol(SYM.GLIDE_RANGE) + FONT.embed_dot(' 12') + FONT.symbol(SYM.MI);
                            case 4: // GA
                                return FONT.symbol(SYM.GLIDE_RANGE) + FONT.embed_dot(' 11') + FONT.symbol(SYM.NM);
                            default: // Metric & Metric + MPH
                                return FONT.symbol(SYM.GLIDE_RANGE) + FONT.embed_dot(' 21') + FONT.symbol(SYM.KM);
                        }
                    }
                },
                {
                    name: 'PAN_SERVO_CENTRED',
                    id: 143,
                    min_version: '6.0.0',
                    preview: FONT.symbol(SYM.PAN_SERVO_IS_OFFSET_L) + '120' + FONT.symbol(SYM.DEGREES)
                },
                {
                    name: 'MISSION INFO',
                    id: 129,
                    min_version: '4.0.0',
                    preview: 'M1/6>101WP'
                },
                {
                    name: 'VERSION',
                    id: 119,
                    min_version: '3.0.0',
                    preview: 'INAV 2.7.0'
                }
            ]
        },
        {
            name: 'osdGroupTemperature',
            items: [
                {
                    name: 'IMU_TEMPERATURE',
                    id: 86,
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                                return FONT.symbol(SYM.IMU_TEMP) + ' 90' + FONT.symbol(SYM.TEMP_F);
                            default: // Metric
                                return FONT.symbol(SYM.IMU_TEMP) + ' 32' + FONT.symbol(SYM.TEMP_C);
                        }
                    }
                },
                {
                    name: 'BARO_TEMPERATURE',
                    id: 87,
                    enabled: function() {
                        return useBaro;
                    },
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                                return FONT.symbol(SYM.BARO_TEMP) + ' 90' + FONT.symbol(SYM.TEMP_F);
                            default: // Metric
                                return FONT.symbol(SYM.BARO_TEMP) + ' 32' + FONT.symbol(SYM.TEMP_C);
                        }
                    }
                },
                {
                    name: 'ESC_TEMPERATURE',
                    id: 107,
                    min_version: '2.5.0',
                    enabled: function() {
                        return useESCTelemetry;
                    },
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                                return FONT.symbol(SYM.ESC_TEMPERATURE) + ' 98' + FONT.symbol(SYM.TEMP_F);
                            default: // Metric
                                return FONT.symbol(SYM.ESC_TEMPERATURE) + ' 38' + FONT.symbol(SYM.TEMP_C);
                        }
                    }
                },
                {
                    name: 'SENSOR1_TEMPERATURE',
                    id: 88,
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                                return ' 90' + FONT.symbol(SYM.TEMP_F);
                            default: // Metric
                                return ' 32' + FONT.symbol(SYM.TEMP_C);
                        }
                    }
                },
                {
                    name: 'SENSOR2_TEMPERATURE',
                    id: 89,
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                                return ' 90' + FONT.symbol(SYM.TEMP_F);
                            default: // Metric
                                return ' 32' + FONT.symbol(SYM.TEMP_C);
                        }
                    }
                },
                {
                    name: 'SENSOR3_TEMPERATURE',
                    id: 90,
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                                return ' 90' + FONT.symbol(SYM.TEMP_F);
                            default: // Metric
                                return ' 32' + FONT.symbol(SYM.TEMP_C);
                        }
                    }
                },
                {
                    name: 'SENSOR4_TEMPERATURE',
                    id: 91,
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                                return ' 90' + FONT.symbol(SYM.TEMP_F);
                            default: // Metric
                                return ' 32' + FONT.symbol(SYM.TEMP_C);
                        }
                    }
                },
                {
                    name: 'SENSOR5_TEMPERATURE',
                    id: 92,
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                                return ' 90' + FONT.symbol(SYM.TEMP_F);
                            default: // Metric
                                return ' 32' + FONT.symbol(SYM.TEMP_C);
                        }
                    }
                },
                {
                    name: 'SENSOR6_TEMPERATURE',
                    id: 93,
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                                return ' 90' + FONT.symbol(SYM.TEMP_F);
                            default: // Metric
                                return ' 32' + FONT.symbol(SYM.TEMP_C);
                        }
                    }
                },
                {
                    name: 'SENSOR7_TEMPERATURE',
                    id: 94,
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                                return ' 90' + FONT.symbol(SYM.TEMP_F);
                            default: // Metric
                                return ' 32' + FONT.symbol(SYM.TEMP_C);
                        }
                    }
                },
                {
                    name: 'SENSOR8_TEMPERATURE',
                    id: 95,
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                                return ' 90' + FONT.symbol(SYM.TEMP_F);
                            default: // Metric
                                return ' 32' + FONT.symbol(SYM.TEMP_C);
                        }
                    }
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
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 3: // UK
                            case 4: // GA
                                return ' 375' + FONT.symbol(SYM.ALT_FT);
                            default: // Metric
                                return ' 114' + FONT.symbol(SYM.ALT_M);
                        }
                    }
                },
                {
                    name: 'VARIO',
                    id: 25,
                    preview: FONT.symbol(SYM.VARIO_UP_2A) + '\n' +
                        FONT.symbol(SYM.VARIO_UP_2A) + '\n' +
                        FONT.symbol(SYM.VARIO_UP_2A) + '\n' +
                        FONT.symbol(SYM.VARIO_UP_2A) + '\n' +
                        FONT.symbol(SYM.VARIO_UP_2A) + '\n'
                },
                {
                    name: 'VARIO_NUM',
                    id: 26,
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 3: // UK
                                return FONT.embed_dot('-1.6') + FONT.symbol(SYM.FT_S);
                            case 4: // GA
                                return FONT.embed_dot('-2.6') + FONT.symbol(SYM.HUND_FTM);
                            default: // Metric
                                return FONT.embed_dot('-0.5') + FONT.symbol(SYM.M_S);
                        }
                    }
                },
                {
                    name: 'OSD_RANGEFINDER',
                    id: 120,
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 3: // UK
                                return FONT.embed_dot('15.9') + FONT.symbol(SYM.DIST_MI);
                            case 4: // GA
                                return FONT.embed_dot('13.8') + FONT.symbol(SYM.DIST_NM);
                            default: // Metric
                                return FONT.embed_dot('25.6') + FONT.symbol(SYM.DIST_KM);
                        }
                    }
                }
            ]
        },
        {
            name: 'osdGroupGForce',
            items: [
                {
                    name: 'G_FORCE',
                    id: 100,
                    min_version: '2.2.0',
                    preview: FONT.symbol(SYM.GFORCE) + FONT.embed_dot('1.00')
                },
                {
                    name: 'G_FORCE_X',
                    id: 101,
                    min_version: '2.2.0',
                    preview: FONT.symbol(SYM.GFORCE_X) + FONT.embed_dot('-0.10')
                },
                {
                    name: 'G_FORCE_Y',
                    id: 102,
                    min_version: '2.2.0',
                    preview: FONT.symbol(SYM.GFORCE_Y) + FONT.embed_dot('-0.20')
                },
                {
                    name: 'G_FORCE_Z',
                    id: 103,
                    min_version: '2.2.0',
                    preview: FONT.symbol(SYM.GFORCE_Z) + FONT.embed_dot('-0.30')
                },
            ]
        },
        {
            name: 'osdGroupTimers',
            items: [
                {
                    name: 'ONTIME_FLYTIME',
                    id: 28,
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
                    preview: function () {
                        return FONT.symbol(SYM.PITCH_UP) + FONT.embed_dot(' 1.5');
                    },
                },
                {
                    name: 'ROLL_ANGLE',
                    id: 42,
                    preview: function () {
                        return FONT.symbol(SYM.ROLL_LEFT) + FONT.embed_dot('31.4');
                    },
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
                    preview: function() {
                        return FONT.embed_dot('42.1') + FONT.symbol(SYM.AMP);
                    }
                },
                {
                    name: 'MAH_DRAWN',
                    id: 12,
                    preview: function() {
                        return osdmAhdrawnPreview();
                    }
                },
                {
                    name: 'WH_DRAWN',
                    id: 36,
                    preview: function() {
                        return FONT.embed_dot('1.25') + FONT.symbol(SYM.WH);
                    }
                },
                {
                    name: 'POWER',
                    id: 19,
                    preview: function() {
                        return ' 69' + FONT.symbol(SYM.WATT); // 3 chars
                    }
                },
                {
                    name: 'MAIN_BATT_REMAINING_CAPACITY',
                    id: 37,
                    preview: function() {
                        return '1276' + FONT.symbol(SYM.MAH); // 4 chars
                    }
                },
                {
                    name: 'EFFICIENCY_MAH',
                    id: 35,
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 3: // UK
                                return '116' + FONT.symbol(SYM.MAH_MI_0) + FONT.symbol(SYM.MAH_MI_1);
                            case 4: // GA
                                return '101' + FONT.symbol(SYM.MAH_NM_0) + FONT.symbol(SYM.MAH_NM_1);
                            default: // Metric
                                return '187' + FONT.symbol(SYM.MAH_KM_0) + FONT.symbol(SYM.MAH_KM_1);
                        }
                    }
                },
                {
                    name: 'EFFICIENCY_WH',
                    id: 39,
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 3: // UK
                                return FONT.embed_dot('0.76') + FONT.symbol(SYM.WH_MI);
                            case 4: // GA
                                return FONT.embed_dot('0.66') + FONT.symbol(SYM.WH_NM);
                            default: // Metric
                                return FONT.embed_dot('1.23') + FONT.symbol(SYM.WH_KM);
                        }
                    }
                },
                {
                    name: 'CLIMB_EFFICIENCY',
                    id: 138,
                    min_version: '5.0.0',
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 3: // UK
                            case 4: // GA
                                return FONT.embed_dot('0.76') + FONT.symbol(SYM.AH_V_FT_0) + FONT.symbol(SYM.AH_V_FT_1);
                            default: // Metric & Metric + MPH
                                return FONT.embed_dot('1.23') + FONT.symbol(SYM.AH_V_M_0) + FONT.symbol(SYM.AH_V_M_1);
                        }
                    }
                },
            ]
        },
        {
            name: 'osdGroupPowerLimits',
            items: [
                {
                    name: 'PLIMIT_REMAINING_BURST_TIME',
                    id: 121,
                    preview: FONT.embed_dot('10.0S')
                },
                {
                    name: 'PLIMIT_ACTIVE_CURRENT_LIMIT',
                    id: 122,
                    preview: FONT.embed_dot('42.1') + FONT.symbol(SYM.AMP)
                },
                {
                    name: 'PLIMIT_ACTIVE_POWER_LIMIT',
                    id: 123,
                    preview: '500' + FONT.symbol(SYM.WATT)
                },
            ]
        },
        {
            name: 'osdGroupGPS',
            enabled: function() {
                return FC.isFeatureEnabled('GPS');
            },
            items: [
                {
                    name: 'MSL_ALTITUDE',
                    id: 96,
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 3: // UK
                            case 4: // GA
                                return ' 375' + FONT.symbol(SYM.ALT_FT);
                            default: // Metric
                                return ' 114' + FONT.symbol(SYM.ALT_M);
                        }
                    },
                },
                {
                    name: 'GPS_SPEED',
                    id: 13,
                    preview: function(osd_data) {
                        // 3 chars
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 2: // Metric + MPH
                            case 3: // UK
                                return FONT.embed_dot('115') + FONT.symbol(SYM.MPH);
                            case 4: // GA
                                return FONT.embed_dot('100') + FONT.symbol(SYM.KT);
                            default: // Metric
                                return FONT.embed_dot('185') + FONT.symbol(SYM.KMH);
                        }
                    }
                },
                {
                    name: '3D_SPEED',
                    id: 85,
                    preview: function(osd_data) {
                        // 3 chars
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 2: // Metric + MPH
                            case 3: // UK
                                return FONT.embed_dot('127') + FONT.symbol(SYM.MPH_3D);
                            case 4: // GA
                                return FONT.embed_dot('110') + FONT.symbol(SYM.KT_3D);
                            default: // Metric
                                return FONT.embed_dot('204') + FONT.symbol(SYM.KMH_3D);
                        }
                    }
                },
                {
                    name: 'GPS_MAX_SPEED',
                    id: 125,
                    preview: function(osd_data) {
                        // 3 chars
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 2: // Metric + MPH
                            case 3: // UK
                                return FONT.symbol(SYM.MAX) + FONT.embed_dot('138') + FONT.symbol(SYM.MPH);
                            case 4: // GA
                                return FONT.symbol(SYM.MAX) + FONT.embed_dot('120') + FONT.symbol(SYM.KT);
                            default: // Metric
                                return FONT.symbol(SYM.MAX) + FONT.embed_dot('222') + FONT.symbol(SYM.KMH);
                        }
                    }
                },
                {
                    name: '3D_MAX_SPEED',
                    id: 126,
                    preview: function(osd_data) {
                        // 3 chars
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 2: // Metric + MPH
                            case 3: // UK
                                return FONT.symbol(SYM.MAX) + FONT.embed_dot('150') + FONT.symbol(SYM.MPH_3D);
                            case 4: // GA
                                return FONT.symbol(SYM.MAX) + FONT.embed_dot('130') + FONT.symbol(SYM.KT_3D);
                            default: // Metric
                                return FONT.symbol(SYM.MAX) + FONT.embed_dot('241') + FONT.symbol(SYM.KMH_3D);
                        }
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
                    preview: osdCoordinatePreview(SYM.LON, -114.7652134),
                },
                {
                    name: 'LATITUDE',
                    id: 21,
                    preview: osdCoordinatePreview(SYM.LAT, 52.9872367),
                },
                {
                    name: 'PLUS_CODE',
                    id: 97,
                    preview: function() {
                        let digits = parseInt(Settings.getInputValue('osd_plus_code_digits')) + 1;
                        let digitsRemoved = parseInt(Settings.getInputValue('osd_plus_code_short')) * 2;
                        console.log("DITIS", digits);
                        return '9547X6PM+VWCCC'.substr(digitsRemoved, digits-digitsRemoved);
                    }
                },
                {
                    name: 'DIRECTION_TO_HOME',
                    id: 22,
                    preview: FONT.symbol(SYM.DIR_TO_HOME)
                },
                {
                    name: 'HOME_HEADING_ERROR',
                    id: 50,
                    preview: FONT.symbol(SYM.HOME) + FONT.symbol(SYM.HEADING) + ' -10' + FONT.symbol(SYM.DEGREES)
                },
                {
                    name: 'AZIMUTH',
                    id: 108,
                    preview: FONT.symbol(SYM.AZIMUTH) + '120' + FONT.symbol(SYM.DEGREES)
                },
                {
                    name: 'DISTANCE_TO_HOME',
                    id: 23,
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 3: // UK
                                return FONT.symbol(SYM.HOME) + FONT.embed_dot('0.98') + FONT.symbol(SYM.DIST_MI);
                            case 4: // GA
                                return FONT.symbol(SYM.HOME) + FONT.embed_dot('0.85') + FONT.symbol(SYM.DIST_NM);
                            default: // Metric
                                return FONT.symbol(SYM.HOME) + FONT.embed_dot('1.57') + FONT.symbol(SYM.DIST_KM);
                        }
                    }
                },
                {
                    name: 'TRIP_DIST',
                    id: 40,
                    min_version: '1.9.1',
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 3: // UK
                                return FONT.symbol(SYM.TRIP_DIST) + FONT.embed_dot('0.98') + FONT.symbol(SYM.DIST_MI);
                            case 4: // GA
                                return FONT.symbol(SYM.TRIP_DIST) + FONT.embed_dot('0.85') + FONT.symbol(SYM.DIST_NM);
                            default: // Metric
                                return FONT.symbol(SYM.TRIP_DIST) + FONT.embed_dot('1.57') + FONT.symbol(SYM.DIST_KM);
                        }
                    }
                },
                {
                    name: 'GPS_HDOP',
                    id: 31,
                    preview: FONT.symbol(SYM.GPS_HDP1) + FONT.symbol(SYM.GPS_HDP2) + FONT.embed_dot('1.8')
                },
                {
                    name: 'WIND_SPEED_HORIZONTAL',
                    id: 46,
                    preview: function(osd_data) {
                        // 6 chars
                        var p = FONT.symbol(SYM.WIND_SPEED_HORIZONTAL) + FONT.symbol(SYM.DIRECTION + 1);
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 2: // Metric + MPH
                            case 3: // UK
                                p += FONT.embed_dot('3.27') + FONT.symbol(SYM.MPH);
                                break;
                            case 4: // GA
                                p += FONT.embed_dot('2.84') + FONT.symbol(SYM.KT);
                                break;
                            default: // Metric
                                p += FONT.embed_dot('5.26') + FONT.symbol(SYM.KMH);
                                break;
                        }
                        return p;
                    }
                },
                {
                    name: 'WIND_SPEED_VERTICAL',
                    id: 47,
                    preview: function(osd_data) {
                        // 6 chars
                        var p = FONT.symbol(SYM.WIND_SPEED_VERTICAL) + FONT.symbol(SYM.AH_DECORATION_UP);
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 2: // Metric + MPH
                            case 3: // UK
                                p += FONT.embed_dot('1.03') + FONT.symbol(SYM.MPH);
                                break;
                            case 4: // GA
                                p += FONT.embed_dot('0.90') + FONT.symbol(SYM.KT);
                                break;
                            default: // Metric
                                p += FONT.embed_dot('1.66') + FONT.symbol(SYM.KMH);
                                break;
                        }
                        return p;
                    }
                },
                {
                    name: 'COURSE_HOLD_ERROR',
                    id: 51,
                    preview: FONT.symbol(SYM.HEADING) + '  5' + FONT.symbol(SYM.DEGREES)
                },
                {
                    name: 'COURSE_HOLD_ADJUSTMENT',
                    id: 52,
                    preview: FONT.symbol(SYM.HEADING) + ' -90' + FONT.symbol(SYM.DEGREES)
                },
                {
                    name: 'GROUND COURSE',
                    id: 140,
                    min_version: '6.0.0',
                    preview: FONT.symbol(SYM.GROUND_COURSE) + '245' + FONT.symbol(SYM.DEGREES)
                },
                {
                    name: 'CROSS TRACK ERROR',
                    id: 141,
                    min_version: '6.0.0',
                    preview: function(osd_data) {
                        switch (OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 3: // UK
                                return FONT.symbol(SYM.CROSS_TRACK_ERROR) + FONT.embed_dot('0.98') + FONT.symbol(SYM.DIST_MI);
                            case 4: // GA
                                return FONT.symbol(SYM.CROSS_TRACK_ERROR) + FONT.embed_dot('0.85') + FONT.symbol(SYM.DIST_NM);
                            default: // Metric
                                return FONT.symbol(SYM.CROSS_TRACK_ERROR) + FONT.embed_dot('1.57') + FONT.symbol(SYM.DIST_KM);
                        }
                    }
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
                {
                    name: 'RADAR',
                    id: 45,
                    positionable: false,
                },
                {
                    name: 'MAP_SCALE',
                    id: 98,
                    preview: function(osd_data) {
                        var scale;
                        switch(OSD.data.preferences.units) {
                            case 0: // Imperial
                            case 3: // UK
                                scale = FONT.embed_dot("0.10") + FONT.symbol(SYM.MI);
                                break;
                            case 4: // GA
                                scale = FONT.embed_dot("0.08") + FONT.symbol(SYM.NM);
                                break;
                            default: // Metric
                                scale = "100" + FONT.symbol(SYM.M);
                                break;
                        }
                        return FONT.symbol(SYM.SCALE) + scale;
                    },
                },
                {
                    name: 'MAP_REFERENCE',
                    id: 99,
                    preview: FONT.symbol(SYM.DIRECTION) + '\nN',
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
                    preview: function(osd_data) {
                        return 'CH:F7:1';
                    },
                },
                {
                    name: 'VTX_POWER',
                    id: 105,
                    preview: FONT.symbol(SYM.VTX_POWER) + '1'
                },
            ]
        },
        {
            name: 'osdGroupCRSF',
            enabled: function() {
                return useCRSFRx;
            },
            items: [
                {
                    name: 'CRSF_RSSI_DBM',
                    id: 109,
                    positionable: true,
                    preview: FONT.symbol(SYM.RSSI) + '-100' + FONT.symbol(SYM.DBM)
                },
                {
                    name: 'CRSF_LQ',
                    id: 110,
                    positionable: true,
                    preview: function(osd_data) {
                        var crsflqformat;
                        if (Settings.getInputValue('osd_crsf_lq_format') == 0) {
                            crsflqformat = FONT.symbol(SYM.LQ) + '100';
                        } else if (Settings.getInputValue('osd_crsf_lq_format') == 1){
                            crsflqformat = FONT.symbol(SYM.LQ) + '2:100';
                        } else {
                            crsflqformat = FONT.symbol(SYM.LQ) + '300';
                        }
                        return crsflqformat;
                    }
                },
                {
                    name: 'CRSF_SNR_DB',
                    id: 111,
                    positionable: true,
                    preview: FONT.symbol(SYM.SNR) + '-12' + FONT.symbol(SYM.DB)
                },
                {
                    name: 'CRSF_TX_POWER',
                    id: 112,
                    positionable: true,
                    preview: '  10' + FONT.symbol(SYM.MW)
                },
            ]
        },
        {
            name: 'osdGroupSwitchIndicators',
            items: [
                {
                    name: 'SWITCH_INDICATOR_0',
                    id: 130,
                    positionable: true,
                    preview: 'SWI1' + FONT.symbol(SYM.SWITCH_INDICATOR_HIGH)
                },
                {
                    name: 'SWITCH_INDICATOR_1',
                    id: 131,
                    positionable: true,
                    preview: 'SWI2' + FONT.symbol(SYM.SWITCH_INDICATOR_HIGH)
                },
                {
                    name: 'SWITCH_INDICATOR_2',
                    id: 132,
                    positionable: true,
                    preview: 'SWI3' + FONT.symbol(SYM.SWITCH_INDICATOR_HIGH)
                },
                {
                    name: 'SWITCH_INDICATOR_3',
                    id: 133,
                    positionable: true,
                    preview: 'SWI4' + FONT.symbol(SYM.SWITCH_INDICATOR_HIGH)
                }
            ]
        },
        {
            name: 'osdGroupGVars',
            items: [
                {
                    name: 'GVAR_0',
                    id: 113,
                    positionable: true,
                    preview: 'G0:01337'
                },
                {
                    name: 'GVAR_1',
                    id: 114,
                    positionable: true,
                    preview: 'G1:31415'
                },
                {
                    name: 'GVAR_2',
                    id: 115,
                    positionable: true,
                    preview: 'G2:01611'
                },
                {
                    name: 'GVAR_3',
                    id: 116,
                    positionable: true,
                    preview: 'G3:30126'
                }
            ]
        },
        {
            name: 'osdGroupPIDs',
            items: [
                {
                    name: 'ACTIVE_PROFILE',
                    id: 128,
                    preview:  function(osd_data) {
                        return FONT.symbol(SYM.PROFILE) + '1';
                    }
                },
                {
                    name: 'ROLL_PIDS',
                    id: 16,
                    preview: 'ROL  40  30  20  23'
                },
                {
                    name: 'PITCH_PIDS',
                    id: 17,
                    preview: 'PIT  40  30  20  23'
                },
                {
                    name: 'YAW_PIDS',
                    id: 18,
                    preview: 'YAW  85  45   0  20'
                },
                {
                    name: 'LEVEL_PIDS',
                    id: 56,
                    preview: 'LEV  20  15  80'
                },
                {
                    name: 'POS_XY_PIDS',
                    id: 57,
                    preview: 'PXY  20  15  80'
                },
                {
                    name: 'POS_Z_PIDS',
                    id: 58,
                    preview: 'PZ   20  15  80'
                },
                {
                    name: 'VEL_XY_PIDS',
                    id: 59,
                    preview: 'VXY  20  15  80'
                },
                {
                    name: 'VEL_Z_PIDS',
                    id: 60,
                    preview: 'VZ   20  15  80'
                },
                {
                    name: 'HEADING_P',
                    id: 61,
                    preview: 'HP  20'
                },
                {
                    name: 'BOARD_ALIGNMENT_ROLL',
                    id: 62,
                    preview: 'AR    0'
                },
                {
                    name: 'BOARD_ALIGNMENT_PITCH',
                    id: 63,
                    preview: 'AP   ' + FONT.embed_dot('1.0')
                },
                {
                    name: 'THROTTLE_EXPO',
                    id: 66,
                    preview: 'TEX   0'
                },
                {
                    name: 'STABILIZED_RC_EXPO',
                    id: 64,
                    preview: 'EXP  20'
                },
                {
                    name: 'STABILIZED_RC_YAW_EXPO',
                    id: 65,
                    preview: 'YEX  20'
                },
                {
                    name: 'STABILIZED_PITCH_RATE',
                    id: 67,
                    preview: 'SPR  20'
                },
                {
                    name: 'STABILIZED_ROLL_RATE',
                    id: 68,
                    preview: 'SRR  20'
                },
                {
                    name: 'STABILIZED_YAW_RATE',
                    id: 69,
                    preview: 'SYR  20'
                },
                {
                    name: 'MANUAL_RC_EXPO',
                    id: 70,
                    preview: 'MEX  20'
                },
                {
                    name: 'MANUAL_RC_YAW_EXPO',
                    id: 71,
                    preview: 'MYX  20'
                },
                {
                    name: 'MANUAL_PITCH_RATE',
                    id: 72,
                    preview: 'MPR  20'
                },
                {
                    name: 'MANUAL_ROLL_RATE',
                    id: 73,
                    preview: 'MRR  20'
                },
                {
                    name: 'MANUAL_YAW_RATE',
                    id: 74,
                    preview: 'MYR  20'
                },
                {
                    name: 'NAV_FW_CRUISE_THROTTLE',
                    id: 75,
                    preview: 'CRS 1500'
                },
                {
                    name: 'NAV_FW_PITCH_TO_THROTTLE',
                    id: 76,
                    preview: 'P2T  10'
                },
                {
                    name: 'FW_MIN_THROTTLE_DOWN_PITCH_ANGLE',
                    id: 77,
                    preview: '0TP  ' + FONT.embed_dot('4.5')
                },
                {
                    name: 'THRUST_PID_ATTENUATION',
                    id: 117,
                    preview: 'TPA    0\nBP  1500'
                },
                {
                    name: 'CONTROL_SMOOTHNESS',
                    id: 118,
                    preview: 'CTL S 3'
                },
                {
                    name: 'TPA_TIME_CONSTANT',
                    id: 134,
                    preview: 'TPA TC   10'
                },
                {
                    name: 'FW_LEVEL_TRIM',
                    id: 135,
                    preview: 'LEVEL  ' + FONT.embed_dot('5.4')
                },
                {
                    name: 'MISSION_INDEX',
                    id: 139,
                    preview: 'WP NO 7'
                },
            ]
        },
        {
            name: 'osdGroupPIDOutputs',
            items: [
                {
                    name: 'FW_ALT_PID_OUTPUTS',
                    id: 79,
                    preview: 'PZO  ' + FONT.embed_dot('  1.2') + ' ' + FONT.embed_dot('  0.1') + ' ' + FONT.embed_dot('  0.0') + ' ' + FONT.embed_dot('  1.3')
                },
                {
                    name: 'FW_POS_PID_OUTPUTS',
                    id: 80,
                    preview: 'PXYO ' + FONT.embed_dot('  1.2') + ' ' + FONT.embed_dot('  0.1') + ' ' + FONT.embed_dot('  0.0') + ' ' + FONT.embed_dot('  1.3')
                },
                {
                    name: 'MC_VEL_X_PID_OUTPUTS',
                    id: 81,
                    preview: 'VXO  ' + FONT.embed_dot('  1.2') + ' ' + FONT.embed_dot('  0.1') + ' ' + FONT.embed_dot('  0.0') + ' ' + FONT.embed_dot('  1.3')
                },
                {
                    name: 'MC_VEL_Y_PID_OUTPUTS',
                    id: 82,
                    preview: 'VYO  ' + FONT.embed_dot('  1.2') + ' ' + FONT.embed_dot('  0.1') + ' ' + FONT.embed_dot('  0.0') + ' ' + FONT.embed_dot('  1.3')
                },
                {
                    name: 'MC_VEL_Z_PID_OUTPUTS',
                    id: 83,
                    preview: 'VZO  ' + FONT.embed_dot('  1.2') + ' ' + FONT.embed_dot('  0.1') + ' ' + FONT.embed_dot('  0.0') + ' ' + FONT.embed_dot('  1.3')
                },
                {
                    name: 'MC_POS_XYZ_P_OUTPUTS',
                    id: 84,
                    preview: 'POSO ' + FONT.embed_dot('  1.2') + ' ' + FONT.embed_dot('  0.1') + ' ' + FONT.embed_dot('  0.0')
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

OSD.reload = function(callback) {
    OSD.initData();
    var done = function() {
        OSD.updateDisplaySize();
        if (callback) {
            callback();
        }
    };

    MSP.promise(MSPCodes.MSP2_CF_SERIAL_CONFIG).then(function (resp) {
        $.each(SERIAL_CONFIG.ports, function(index, port){
            if(port.functions.includes('DJI_FPV')) {
                OSD.data.isDjiHdFpv = true;
            }
            if(port.functions.includes('MSP_DISPLAYPORT')) {
                OSD.data.isMspDisplay = true;
            }
        });
    });

    MSP.promise(MSPCodes.MSP2_INAV_OSD_LAYOUTS).then(function (resp) {

        OSD.msp.decodeLayoutCounts(resp);
        // Get data for all layouts
        var ids = Array.apply(null, {length: OSD.data.layout_count}).map(Number.call, Number);
        var layouts = Promise.mapSeries(ids, function (layoutIndex, ii) {
            var data = [];
            data.push8(layoutIndex);
            return MSP.promise(MSPCodes.MSP2_INAV_OSD_LAYOUTS, data).then(function (resp) {
                OSD.msp.decodeLayout(layoutIndex, resp);
            });
        });
        layouts.then(function () {
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
    });
};

OSD.updateSelectedLayout = function(new_layout) {
    OSD.data.selected_layout = new_layout;
    OSD.data.items = OSD.data.layouts[OSD.data.selected_layout];
};

OSD.updateDisplaySize = function () {
    video_type = OSD.constants.VIDEO_TYPES[OSD.data.preferences.video_system];
    if (video_type == 'AUTO') {
        video_type = 'PAL';
    }

    // save the original OSD element positions for all layouts
    var osdLayouts = [];
    for (var ii = 0; ii < OSD.data.layout_count; ii++) {
        var items = OSD.data.layouts[ii];
        var origPos = [];
        for (var jj = 0; jj < OSD.data.items.length; jj++) {
            origPos.push(OSD.msp.helpers.pack.position(items[jj]));
        }
        osdLayouts.push(origPos);
    }

    // set the new video type and cols per line
    FONT.constants.SIZES.LINE = OSD.constants.VIDEO_COLS[video_type];

    // set the new display size
    OSD.data.display_size = {
        x: FONT.constants.SIZES.LINE,
        y: OSD.constants.VIDEO_LINES[video_type],
        total: OSD.constants.VIDEO_BUFFER_CHARS[video_type]
    };

    // re-calculate the OSD element positions for each layout
    for (var ii = 0; ii < OSD.data.layout_count; ii++) {
        var origPos = osdLayouts[ii];
        var items = OSD.data.layouts[ii];
        for (var jj = 0; jj < OSD.data.item_count; jj++) {
            var item = OSD.msp.helpers.unpack.position(origPos[jj]);
            // leave element alone if outside of screen (enable and disable element to relocate to 0,0)
            if (item.x < OSD.data.display_size.x && item.y < OSD.data.display_size.y) {
                items[jj] = item;
            }
        }
    }

    // set the preview size based on the video type
    // -- AVATAR
    $('.third_left').toggleClass('preview_avatar_side', (video_type == 'AVATAR'))
    $('.preview').toggleClass('preview_avatar cut43_left', (video_type == 'AVATAR'))
    $('.third_right').toggleClass('preview_avatar_side', (video_type == 'AVATAR'))
    // -- DJI WTF
    $('.third_left').toggleClass('preview_dji_hd_side', video_type == 'DJIWTF')
    $('.preview').toggleClass('preview_dji_hd cut43_left', video_type == 'DJIWTF')
    $('.third_right').toggleClass('preview_dji_hd_side', video_type == 'DJIWTF')
    // -- HD ZERO
    $('.third_left').toggleClass('preview_hdzero_side', (video_type == 'HDZERO'))
    $('.preview').toggleClass('preview_hdzero cut43_left', (video_type == 'HDZERO'))
    $('.third_right').toggleClass('preview_hdzero_side', (video_type == 'HDZERO'))
    // -- BFHDCOMPAT
    $('.third_left').toggleClass('preview_bfhdcompat_side', (video_type == 'BFHDCOMPAT'))
    $('.preview').toggleClass('preview_bfhdcompat cut43_left', (video_type == 'BFHDCOMPAT'))
    $('.third_right').toggleClass('preview_bfhdcompat_side', (video_type == 'BFHDCOMPAT'))
    
    OSD.GUI.updateGuidesView($('#videoGuides').find('input').is(':checked'));
};

OSD.saveAlarms = function(callback) {
    let data = OSD.msp.encodeAlarms();
    return MSP.promise(MSPCodes.MSP2_INAV_OSD_SET_ALARMS, data).then(callback);
}

OSD.saveConfig = function(callback) {
    return OSD.saveAlarms(function () {
        var data = OSD.msp.encodePreferences();
        return MSP.promise(MSPCodes.MSP2_INAV_OSD_SET_PREFERENCES, data).then(callback);
    });
};

OSD.saveItem = function(item, callback) {
    let pos = OSD.data.items[item.id];
    let data = OSD.msp.encodeLayoutItem(OSD.data.selected_layout, item, pos);
    return MSP.promise(MSPCodes.MSP2_INAV_OSD_SET_LAYOUT_ITEM, data).then(callback);
};

//noinspection JSUnusedLocalSymbols
OSD.msp = {
    /**
     * Unsigned 16 bit int for position is packed:
     * 0: unused
     * v: visible flag
     * b: blink flag
     * y: y coordinate
     * x: x coordinate
     * 00vb yyyy yyxx xxxx
     */
    helpers: {
        unpack: {
            position: function (bits) {
                var display_item = {};
                display_item.x = bits & 0x3F;
				display_item.y = (bits >> 6) & 0x3F;
                display_item.position = (display_item.y) * FONT.constants.SIZES.LINE + (display_item.x);
                display_item.isVisible = (bits & OSD.constants.VISIBLE) != 0;
                return display_item;
            }
        },
        calculate: {
        	coords: function(display_item) {
        		display_item.x = (display_item.position % FONT.constants.SIZES.LINE) & 0x3F;
        		display_item.y = (display_item.position / FONT.constants.SIZES.LINE) & 0x3F;
        		return display_item;
        	}
        },
        pack: {
            position: function (display_item) {
                return (display_item.isVisible ? OSD.constants.VISIBLE : 0)
                	| ((display_item.y & 0x3F) << 6) | (display_item.x & 0x3F);
            }
        }
    },

    encodeAlarms: function() {
        var result = [];

        result.push8(OSD.data.alarms.rssi);
        result.push16(OSD.data.alarms.fly_minutes);
        result.push16(OSD.data.alarms.max_altitude);
        result.push16(OSD.data.alarms.dist);
        result.push16(OSD.data.alarms.max_neg_altitude);
        result.push16(OSD.data.alarms.gforce);
        result.push16(OSD.data.alarms.gforce_axis_min);
        result.push16(OSD.data.alarms.gforce_axis_max);
        result.push8(OSD.data.alarms.current);
        result.push16(OSD.data.alarms.imu_temp_alarm_min);
        result.push16(OSD.data.alarms.imu_temp_alarm_max);
        result.push16(OSD.data.alarms.baro_temp_alarm_min);
        result.push16(OSD.data.alarms.baro_temp_alarm_max);
        return result;
    },

    decodeAlarms: function(resp) {
        var alarms = resp.data;

        OSD.data.alarms.rssi = alarms.readU8();
        OSD.data.alarms.fly_minutes = alarms.readU16();
        OSD.data.alarms.max_altitude = alarms.readU16();
        OSD.data.alarms.dist = alarms.readU16();
        OSD.data.alarms.max_neg_altitude = alarms.readU16();
        OSD.data.alarms.gforce = alarms.readU16();
        OSD.data.alarms.gforce_axis_min = alarms.read16();
        OSD.data.alarms.gforce_axis_max = alarms.read16();
        OSD.data.alarms.current = alarms.readU8();
        OSD.data.alarms.imu_temp_alarm_min = alarms.read16();
        OSD.data.alarms.imu_temp_alarm_max = alarms.read16();
        OSD.data.alarms.baro_temp_alarm_min = alarms.read16();
        OSD.data.alarms.baro_temp_alarm_max = alarms.read16();
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

    decodeLayoutCounts: function(resp) {
        OSD.data.layout_count = resp.data.readU8();
        OSD.data.item_count = resp.data.readU8();
    },

    decodeLayout: function(layoutIndex, resp) {
        var items = [];

        for (var ii = 0; ii < OSD.data.item_count; ii++) {
            var bits = resp.data.readU16();
            items.push(this.helpers.unpack.position(bits));
        }
        OSD.data.layouts[layoutIndex] = items;
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

        d.alarms.dist = view.readU16();
        d.alarms.max_neg_altitude = view.readU16();

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

const mspVideoSystem = [1,3,4,5,6,7];   // indexes of PAL, HDZERO, DJIWTF, AVATAR, BF43COMPAT & BFHDCOMPAT
const analogVideoSystem = [0,1,2];  // indexes of AUTO, PAL, & NTSC

OSD.GUI.updateVideoMode = function() {
    // video mode
    var $videoTypes = $('.video-types').empty();

    if (!OSD.data.isDjiHdFpv) {
        $('#dji_settings').hide();
    }

    if (OSD.data.isMspDisplay) {
        if (mspVideoSystem.includes(OSD.data.preferences.video_system) == false) {
            OSD.data.preferences.video_system = OSD.constants.VIDEO_TYPES.indexOf('HDZERO');
            OSD.updateDisplaySize();
            OSD.GUI.saveConfig();
        }
    } else {
        if (analogVideoSystem.includes(OSD.data.preferences.video_system) == false) {
            OSD.data.preferences.video_system = OSD.constants.VIDEO_TYPES.indexOf('AUTO')
            OSD.updateDisplaySize();
            OSD.GUI.saveConfig();
        }
    }

    if (OSD.data.isMspDisplay) {
        for (var i = 0; i < OSD.constants.VIDEO_TYPES.length; i++) {
            if (mspVideoSystem.includes(i))
            {
                $videoTypes.append(
                    $('<option value="' + OSD.constants.VIDEO_TYPES[i] + '">' + OSD.constants.VIDEO_TYPES[i] + '</option>')
                        .prop('selected', i === OSD.data.preferences.video_system)
                        .data('type', i)
                );
            }
        }
    } else {
        for (var i = 0; i < OSD.constants.VIDEO_TYPES.length; i++) {
            if (analogVideoSystem.includes(i))
            {
                $videoTypes.append(
                    $('<option value="' + OSD.constants.VIDEO_TYPES[i] + '">' + OSD.constants.VIDEO_TYPES[i] + '</option>')
                        .prop('selected', i === OSD.data.preferences.video_system)
                        .data('type', i)
                );
            }
        }
    }

    $videoTypes.change(function () {
        OSD.data.preferences.video_system = $(this).find(':selected').data('type');
        OSD.updateDisplaySize();
        OSD.GUI.saveConfig();
    });
};

OSD.GUI.updateUnits = function() {
    // units
    var $unitMode = $('#unit_mode').empty();
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
        if (OSD.data.preferences.units === unitType.value) {
            $option.prop('selected', true);
        }
        $unitMode.append($option);
    }
    function updateUnitHelp() {
        var unitType = OSD.constants.UNIT_TYPES[OSD.data.preferences.units];
        var tip;
        if (unitType.tip) {
            tip = chrome.i18n.getMessage(unitType.tip);
        }
        if (tip) {
            $unitTip.attr('title', tip);
            $unitTip.fadeIn();
        } else {
            $unitTip.fadeOut();
        }
    }
    updateUnitHelp();
    $unitMode.change(function (e) {
        var selected = $(this).find(':selected');
        OSD.data.preferences.units = selected.data('type');
        globalSettings.osdUnits = OSD.data.preferences.units;
        OSD.GUI.saveConfig();
        updateUnitHelp();
    });
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
        groupContainer.attr('id', group.name);
        var groupTitleContainer = groupContainer.find('.spacer_box_title');
        var groupTitle = chrome.i18n.getMessage(group.name);
        groupTitleContainer.text(groupTitle);
        var groupHelp = chrome.i18n.getMessage(group.name + '_HELP');
        if (groupHelp) {
            $('<div class="helpicon cf_tip"></div>')
                .css('margin-top', '1px')
                .attr('title', groupHelp)
                .appendTo(groupTitleContainer.parent())
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
            var searchTerm = $('.osd_search').val();
            if (searchTerm.length > 0 && !name.toLowerCase().includes(searchTerm.toLowerCase())) {
                continue;
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
                            // Ensure the element is inside the viewport, at least partially.
                            // In that case move it to the very first row/col, otherwise there's
                            // no way to reposition items that are outside the viewport.
                            OSD.msp.helpers.calculate.coords(itemData);
                            if (itemData.x > OSD.data.display_size.x || itemData.y > OSD.data.display_size.y) {
                                itemData.x = itemData.y = itemData.position = 0;
                            }
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
                            OSD.msp.helpers.calculate.coords(itemData);
                            OSD.GUI.saveItem(item);
                        }))
                );
            }
            $displayFields.append($field);
        }
        if (groupContainer.find('.display-fields').children().size() > 0) {
            $tmpl.parent().append(groupContainer);
        }
    }

    if ($('#videoGuidesToggle').length == false) {
        $('#videoGuides').prepend(
            $('<input id="videoGuidesToggle" type="checkbox" class="toggle" />')
            .attr('checked', isGuidesChecked)
            .on('change', function () {
                OSD.GUI.updateGuidesView(this.checked);
                chrome.storage.local.set({'showOSDGuides': this.checked});
                OSD.GUI.updatePreviews();
            })
        );
    }

    if ($('#djiUnsupportedElementsToggle').length == false) {
        $('#djiUnsupportedElements').prepend(
            $('<input id="djiUnsupportedElementsToggle" type="checkbox" class="toggle" />')
            .attr('checked', OSD.data.isDjiHdFpv && !OSD.data.isMspDisplay)
            .on('change', function () {
                OSD.GUI.updateDjiView(this.checked);
                OSD.GUI.updatePreviews();
            })
        );
    }

    // TODO: If we add more switches somewhere else, this
    // needs to be called after all of them have been set up
    GUI.switchery();

    // Update the OSD preview
    refreshOSDSwitchIndicators();
    updatePilotAndCraftNames();
    updatePanServoPreview();
};

OSD.GUI.removeBottomLines = function(){
    // restore
    $('.display-field').removeClass('no-bottom');
    $('.gui_box').each(function(index, gui_box){
        var elements = $(gui_box).find('.display-fields, .settings').children();
        var lastVisible = false;
        elements.each(function(index, element){
            if ($(element).is(':visible')) {
                lastVisible = $(element);
            }
        });
        if (lastVisible) {
            lastVisible.addClass('no-bottom');
        }
    });
};

OSD.GUI.updateDjiMessageElements = function(on) {
    $('.display-field').each(function(index, element) {
        var name = $(element).find('input').attr('name');
        if (OSD.DjiElements.craftNameElements.includes(name)) {
            if (on) {
                $(element)
                    .addClass('blue')
                    .show();
            } else if ($('#djiUnsupportedElements').find('input').is(':checked')) {
                $(element).hide();
            }
        }

        if (!on) {
            $(element).removeClass('blue');
        }
    });
    OSD.GUI.removeBottomLines();
};

OSD.GUI.updateGuidesView = function(on) {
    isHdZero = OSD.constants.VIDEO_TYPES[OSD.data.preferences.video_system] == 'HDZERO';
    $('.hd_43_margin_left').toggleClass('hdzero_43_left', (isHdZero && on))
    $('.hd_43_margin_right').toggleClass('hdzero_43_right', (isHdZero && on))
    $('.hd_3016_box_top').toggleClass('hd_3016_top', (isHdZero && on))
    $('.hd_3016_box_bottom').toggleClass('hd_3016_bottom', (isHdZero && on))
    $('.hd_3016_box_left').toggleClass('hd_3016_left', (isHdZero && on))
    $('.hd_3016_box_right').toggleClass('hd_3016_right', (isHdZero && on))

    isDJIWTF = OSD.constants.VIDEO_TYPES[OSD.data.preferences.video_system] == 'DJIWTF';
    $('.hd_43_margin_left').toggleClass('dji_hd_43_left', (isDJIWTF && on))
    $('.hd_43_margin_right').toggleClass('dji_hd_43_right', (isDJIWTF && on))

    isAvatar = OSD.constants.VIDEO_TYPES[OSD.data.preferences.video_system] == 'AVATAR';
    $('.hd_43_margin_left').toggleClass('hd_avatar_43_left', (isAvatar && on))
    $('.hd_43_margin_right').toggleClass('hd_avatar_43_right', (isAvatar && on))
    $('.hd_avatar_bottom_bar').toggleClass('hd_avatar_bottom', (isAvatar && on))
    $('.hd_avatar_storage_box_top').toggleClass('hd_avatar_storagebox_t', (isAvatar && on))
    $('.hd_avatar_storage_box_bottom').toggleClass('hd_avatar_storagebox_b', (isAvatar && on))
    $('.hd_avatar_storage_box_left').toggleClass('hd_avatar_storagebox_l', (isAvatar && on))
    $('.hd_avatar_storage_box_right').toggleClass('hd_avatar_storagebox_r', (isAvatar && on))

    isBfHdCompat = OSD.constants.VIDEO_TYPES[OSD.data.preferences.video_system] == 'BFHDCOMPAT';
    $('.hd_43_margin_left').toggleClass('hd_bfhdcompat_43_left', (isBfHdCompat && on));
    $('.hd_43_margin_right').toggleClass('hd_bfhdcompat_43_right', (isBfHdCompat && on));
    $('.hd_bfhdcompat_bottom_box').toggleClass('hd_bfhdcompat_bottom', (isBfHdCompat && on));
    $('.hd_bfhdcompat_storage_box').toggleClass('hd_bfhdcompat_storagebox', (isBfHdCompat && on));

    isPAL = OSD.constants.VIDEO_TYPES[OSD.data.preferences.video_system] == 'PAL' || OSD.constants.VIDEO_TYPES[OSD.data.preferences.video_system] == 'AUTO';
    $('.pal_ntsc_box_bottom').toggleClass('ntsc_bottom', (isPAL && on))
};

OSD.GUI.updateDjiView = function(on) {
    if (on) {
        $(OSD.DjiElements.emptyGroups).each(function(index, groupName) {
            $('#osdGroup' + groupName).hide();
        });

        var displayFields = $('.display-field');
        displayFields.each(function(index, element) {
            var name = $(element).find('input').attr('name');
            if (!OSD.DjiElements.supported.includes(name)) {
                $(element).hide();
            }
        });

        var settings = $('.settings-container').find('.settings').children();
        settings.each(function(index, element) {
            var name = $(element).attr('class');
            if (!OSD.DjiElements.supportedSettings.includes(name)) {
                $(element).hide();
            }
        });

        var alarms = $('.alarms-container').find('.settings').children();
        alarms.each(function(index, element) {
            var name = $(element).attr('for');
            if (!OSD.DjiElements.supportedAlarms.includes(name)) {
                $(element).hide();
            }
        });

        $('.switch-indicator-container').hide();
    } else {
        $(OSD.DjiElements.emptyGroups).each(function(index, groupName) {
            $('#osdGroup' + groupName).show();
        });

        $('.display-field')
            .show()
            .removeClass('no-bottom');

        $('.settings-container, .alarms-container').find('.settings').children()
            .show()
            .removeClass('no-bottom');

        $('.switch-indicator-container').show();
    }
    OSD.GUI.updateDjiMessageElements($('#useCraftnameForMessages').is(':checked'));
};

OSD.GUI.updateAlarms = function() {
    $(".osd_use_airspeed_alarm").toggle(usePitot);
    $(".osd_use_baro_temp_alarm").toggle(useBaro);
    $(".osd_use_esc_telemetry").toggle(useESCTelemetry);
    $(".osd_use_crsf").toggle(useCRSFRx);
};

OSD.GUI.updateMapPreview = function(mapCenter, name, directionSymbol, centerSymbol) {
    if ($('input[name="' + name + '"]').prop('checked')) {
        var mapInitialX = OSD.data.display_size.x - 2;
        OSD.GUI.checkAndProcessSymbolPosition(mapCenter, centerSymbol);
    }
};

OSD.GUI.updatePreviews = function() {
    // buffer the preview;
    OSD.data.preview = [];

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

		if (itemData.x >= OSD.data.display_size.x)
		{
			continue;
		}

        // DJI HD FPV: Hide elements that only appear in craft name
        if (OSD.DjiElements.craftNameElements.includes(item.name) &&
        $('#djiUnsupportedElements').find('input').is(':checked')) {
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
            var previewPos = j + x + (y * OSD.data.display_size.x);
            if (previewPos >= OSD.data.preview.length) {
                // Character is outside the viewport
                x++;
                continue;
            }
            // test if this position already has a character placed
            if (OSD.data.preview[previewPos][0] !== null) {
                // if so set background color to red to show user double usage of position
                OSD.data.preview[previewPos] = [item, charCode, 'red'];
            } else {
                OSD.data.preview[previewPos] = [item, charCode];
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


    var centerPosition = (OSD.data.display_size.x * OSD.data.display_size.y / 2);
    if (OSD.data.display_size.y % 2 == 0) {
        centerPosition += Math.floor(OSD.data.display_size.x / 2);
    }

    let hudCenterPosition = centerPosition - (OSD.constants.VIDEO_COLS[video_type] * $('#osd_horizon_offset').val());

    // artificial horizon
    if ($('input[name="ARTIFICIAL_HORIZON"]').prop('checked')) {
        for (i = 0; i < 9; i++) {
            OSD.GUI.checkAndProcessSymbolPosition(hudCenterPosition - 4 + i, SYM.AH_BAR9_0 + 4);
        }
    }

    // crosshairs
    if ($('input[name="CROSSHAIRS"]').prop('checked')) {
        crsHNumber = Settings.getInputValue('osd_crosshairs_style');
       if (crsHNumber == 1) {
            // AIRCRAFT style
            OSD.GUI.checkAndProcessSymbolPosition(hudCenterPosition - 2, SYM.AH_AIRCRAFT0);
            OSD.GUI.checkAndProcessSymbolPosition(hudCenterPosition - 1, SYM.AH_AIRCRAFT1);
            OSD.GUI.checkAndProcessSymbolPosition(hudCenterPosition, SYM.AH_AIRCRAFT2);
            OSD.GUI.checkAndProcessSymbolPosition(hudCenterPosition + 1, SYM.AH_AIRCRAFT3);
            OSD.GUI.checkAndProcessSymbolPosition(hudCenterPosition + 2, SYM.AH_AIRCRAFT4);
        } else if ((crsHNumber > 1) && (crsHNumber < 8)) {
            // TYPES 3 to 8 (zero indexed)
            OSD.GUI.checkAndProcessSymbolPosition(hudCenterPosition - 1, SYM.AH_CROSSHAIRS[crsHNumber][0]);
            OSD.GUI.checkAndProcessSymbolPosition(hudCenterPosition, SYM.AH_CROSSHAIRS[crsHNumber][1]);
            OSD.GUI.checkAndProcessSymbolPosition(hudCenterPosition + 1, SYM.AH_CROSSHAIRS[crsHNumber][2]);
        } else {
            // DEFAULT or unknown style
            OSD.GUI.checkAndProcessSymbolPosition(hudCenterPosition - 1, SYM.AH_CENTER_LINE);
            OSD.GUI.checkAndProcessSymbolPosition(hudCenterPosition, SYM.AH_CROSSHAIRS[crsHNumber]);
            OSD.GUI.checkAndProcessSymbolPosition(hudCenterPosition + 1, SYM.AH_CENTER_LINE_RIGHT);
        }
    }

    // sidebars
    if ($('input[name="HORIZON_SIDEBARS"]').prop('checked')) {
        var hudwidth = OSD.constants.AHISIDEBARWIDTHPOSITION;
        var hudheight = OSD.constants.AHISIDEBARHEIGHTPOSITION;
        for (i = -hudheight; i <= hudheight; i++) {
            OSD.GUI.checkAndProcessSymbolPosition(hudCenterPosition - hudwidth + (i * FONT.constants.SIZES.LINE), SYM.AH_DECORATION);
            OSD.GUI.checkAndProcessSymbolPosition(hudCenterPosition + hudwidth + (i * FONT.constants.SIZES.LINE), SYM.AH_DECORATION);
        }
        // AH level indicators
        OSD.GUI.checkAndProcessSymbolPosition(hudCenterPosition - hudwidth + 1, SYM.AH_LEFT);
        OSD.GUI.checkAndProcessSymbolPosition(hudCenterPosition + hudwidth - 1, SYM.AH_RIGHT);
    }

    OSD.GUI.updateMapPreview(centerPosition, 'MAP_NORTH', 'N', SYM.HOME);
    OSD.GUI.updateMapPreview(centerPosition, 'MAP_TAKEOFF', 'T', SYM.HOME);
    OSD.GUI.updateMapPreview(centerPosition, 'RADAR', null, SYM.DIR_TO_HOME);

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
            var nameKey = 'osdElement_' + item.name;
            var nameMessage = chrome.i18n.getMessage(nameKey);

            if (!nameMessage) {
                nameMessage = inflection.titleize(item.name);
            }

            $img.addClass('field-' + item.id)
                .data('item', item)
                .prop('draggable', true)
                .on('dragstart', OSD.GUI.preview.onDragStart)
                .prop('title', nameMessage);
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
            OSD.GUI.updateGuidesView($('#videoGuides').find('input').is(':checked'));
            OSD.GUI.updateDjiView($('#djiUnsupportedElements').find('input').is(':checked'));
            OSD.GUI.updatePreviews();
        });
    } else {
        layouts.hide();
        layouts.off('change');
    }

    $('.osd_search').on('input', function() {
        OSD.GUI.updateFields();
    });
    $('.supported').fadeIn();
    OSD.GUI.updateVideoMode();
    OSD.GUI.updateUnits();
    OSD.GUI.updateFields();
    OSD.GUI.updatePreviews();
    OSD.GUI.updateGuidesView($('#videoGuides').find('input').is(':checked'));
    OSD.GUI.updateDjiView(OSD.data.isDjiHdFpv && !OSD.data.isMspDisplay);
    OSD.GUI.updateAlarms();
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
    });
};

TABS.osd = {};
TABS.osd.initialize = function (callback) {

    mspHelper.loadServoMixRules();

    if (GUI.active_tab != 'osd') {
        GUI.active_tab = 'osd';
    }

    GUI.load("./tabs/osd.html", Settings.processHtml(function () {
        // translate to user-selected language
        localize();

        // Open modal window
        OSD.GUI.jbox = new jBox('Modal', {
            width: 708,
            height: 240,
            position: {y:'bottom'},
            offset: {y:-50},
            closeButton: 'title',
            animation: false,
            attach: $('#fontmanager'),
            title: 'OSD Font Manager',
            content: $('#fontmanagercontent')
        });

        $('a.save').click(function () {
            Settings.saveInputs().then(function () {
                var self = this;
                MSP.promise(MSPCodes.MSP_EEPROM_WRITE);
                GUI.log(chrome.i18n.getMessage('osdSettingsSaved'));
                var oldText = $(this).text();
                $(this).html("Saved");
                setTimeout(function () {
                    $(self).html(oldText);
                }, 2000);
            });
        });

        // Initialise guides checkbox
        chrome.storage.local.get('showOSDGuides', function (result) {
            if (typeof result.showOSDGuides !== 'undefined') {
                isGuidesChecked = result.showOSDGuides;
            }     
        });

        // Setup switch indicators
        $(".osdSwitchInd_channel option").each(function() {
            $(this).text("Ch " + $(this).text());
        });

        // Function when text for switch indicators change
        $('.osdSwitchIndName').on('keyup', function() {
            // Make sure that the switch hint only contains A to Z
            let testExp = new RegExp('^[A-Za-z0-9]');
            let testText = $(this).val();
            if (testExp.test(testText.slice(-1))) {
                $(this).val(testText.toUpperCase());
            } else {
                $(this).val(testText.slice(0, -1));
            }

            // Update the OSD preview
            refreshOSDSwitchIndicators();
        });

        // Function to update the OSD layout when the switch text alignment changes
        $("#switchIndicators_alignLeft").on('change', function() {
            refreshOSDSwitchIndicators();
        });

        // Functions for when pan servo settings change
        $('#osdPanServoIndicatorShowDegrees').on('change', function() {
            // Update the OSD preview
            updatePanServoPreview();
        });

        $('#panServoOutput').on('change', function() {
            // Update the OSD preview
            updatePanServoPreview();
        });

        // Function for when text for craft name changes
        $('#craft_name').on('keyup', function() {
            // Make sure that the craft name only contains A to Z, 0-9, spaces, and basic ASCII symbols
            let testExp = new RegExp('^[A-Za-z0-9 !_,:;=@#\\%\\&\\-\\*\\^\\(\\)\\.\\+\\<\\>\\[\\]]');
            let testText = $(this).val();
            if (testExp.test(testText.slice(-1))) {
                $(this).val(testText.toUpperCase());
            } else {
                $(this).val(testText.slice(0, -1));
            }

            // Update the OSD preview
            updatePilotAndCraftNames();
        });

        $('#pilot_name').on('keyup', function() {
            // Make sure that the pilot name only contains A to Z, 0-9, spaces, and basic ASCII symbols
            let testExp = new RegExp('^[A-Za-z0-9 !_,:;=@#\\%\\&\\-\\*\\^\\(\\)\\.\\+\\<\\>\\[\\]]');
            let testText = $(this).val();
            if (testExp.test(testText.slice(-1))) {
                $(this).val(testText.toUpperCase());
            } else {
                $(this).val(testText.slice(0, -1));
            }

            // Update the OSD preview
            updatePilotAndCraftNames();
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
            $.get('/resources/osd/analogue/' + $(this).data('font-file') + '.mcm', function (data) {
                FONT.parseMCMFontFile(data);
                FONT.preview($preview);
                OSD.GUI.update();
            });
            chrome.storage.local.set({'osd_font': $(this).data('font-file')});
        });

        // load the last selected font when we change tabs
        chrome.storage.local.get('osd_font', function (result) {
            if (result.osd_font != undefined) {
                previous_font_button = $('.fontbuttons button[data-font-file="' + result.osd_font + '"]');
                if (previous_font_button.attr('data-font-file') == undefined) previous_font_button = undefined;
            }

            if (typeof previous_font_button == "undefined") {
                $fontPicker.first().click();
            } else {
                previous_font_button.click();
            }
        });

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
                var progressLabel = $('.progressLabel');
                var progressBar = $('.progress');
                var uploading = chrome.i18n.getMessage('uploadingCharacters');
                progressLabel.text(uploading);
                var progressCallback = function(done, total, percentage) {
                    progressBar.val(percentage);
                    if (done == total) {
                        progressLabel.text(chrome.i18n.getMessage('uploadedCharacters'), [total]);
                    } else {
                        progressLabel.text(uploading + ' (' + done + '/' + total + ')');
                    }
                }
                FONT.upload(progressCallback);
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
                            GUI.log(chrome.i18n.getMessage('writePermissionsForFile'));
                        }
                    });
                });
            });
        });

        $('.update_preview').on('change', function () {
            if (OSD.data) {
                // Force an OSD redraw by saving any element
                // with a small delay, to make sure the setting
                // change is performance before the OSD starts
                // the full redraw.
                // This will also update all previews
                setTimeout(function() {
                    OSD.GUI.saveItem({id: 0});
                }, 100);
            }
        });

        $('#useCraftnameForMessages').on('change', function() {
            OSD.GUI.updateDjiMessageElements(this.checked);
        });

        // Update RX data for Crossfire detection
        mspHelper.loadRxConfig(function() {
            useCRSFRx = (RX_CONFIG.serialrx_provider == 6);
        });

        // Get status of ESC Telemetry
        useESCTelemetry = false;
        MSP.send_message(MSPCodes.MSP2_CF_SERIAL_CONFIG, false, false, function() {
            for (var portIndex = 0; portIndex < SERIAL_CONFIG.ports.length; portIndex++) {
                var serialPort = SERIAL_CONFIG.ports[portIndex];
                if (serialPort.functions.indexOf("ESC") >= 0) {
                    useESCTelemetry = true;
                    break;
                }
            }
        });

        // Update SENSOR_CONFIG, used to detect
        // OSD_AIR_SPEED
        mspHelper.loadSensorConfig(function () {
            useBaro  = (SENSOR_CONFIG.barometer != 0);
            usePitot = (SENSOR_CONFIG.pitot != 0);
            GUI.content_ready(callback);
        });
    }));
};

function refreshOSDSwitchIndicators() {
    let group = OSD.constants.ALL_DISPLAY_GROUPS.filter(function(e) {
        return e.name == "osdGroupSwitchIndicators";
      })[0];
    for (let si = 0; si < group.items.length; si++) {
        let item = group.items[si];
        if ($("#osdSwitchInd" + si +"_name").val() != undefined) {
            let switchIndText = $("#osdSwitchInd" + si +"_name").val();
            if (switchIndText == "") {
                item.preview = FONT.symbol(SYM.SWITCH_INDICATOR_HIGH);
            } else {
                if ($("#switchIndicators_alignLeft").prop('checked')) {
                    item.preview = switchIndText + FONT.symbol(SYM.SWITCH_INDICATOR_HIGH);
                } else {
                    item.preview = FONT.symbol(SYM.SWITCH_INDICATOR_HIGH) + switchIndText;
                }
            }
        }
    }

    OSD.GUI.updatePreviews();
};

function updatePilotAndCraftNames() {
    let foundPilotName = ($('#pilot_name').val() == undefined);
    let foundCraftName = ($('#craft_name').val() == undefined);
    
    let generalGroup = OSD.constants.ALL_DISPLAY_GROUPS.filter(function(e) {
        return e.name == "osdGroupGeneral";
    })[0];

    if (($('#craft_name').val() != undefined) || ($('#pilot_name').val() != undefined)) {
        for (let si = 0; si < generalGroup.items.length; si++) {
            if (generalGroup.items[si].name == "CRAFT_NAME") {
                let nameText = $('#craft_name').val();

                if (nameText == "") {
                    generalGroup.items[si].preview = "CRAFT_NAME";
                } else {
                    generalGroup.items[si].preview = nameText;
                }
                foundCraftName = true;
            }

            if (generalGroup.items[si].name == "PILOT_NAME") {
                let nameText = $('#pilot_name').val();

                if (nameText == "") {
                    generalGroup.items[si].preview = "PILOT_NAME";
                } else {
                    generalGroup.items[si].preview = nameText;
                }
                foundPilotName = true;
            }

            if (foundCraftName && foundPilotName) {
                break;
            }
        }
    }

    OSD.GUI.updatePreviews();
};

function updatePanServoPreview() {
    // Show or hide the settings, based on of the feature is active.
    if ($('#panServoOutput').val() === "0") {
        $('#osd_pan_settings').hide();
        $('#panServoOutput').parent().addClass('no-bottom');
    } else {
        $('#osd_pan_settings').show();
        $('#panServoOutput').parent().removeClass('no-bottom');
    }

    // Update the panServoOutput select to be visibly easier to use
    let servoRules = SERVO_RULES;
    $('#panServoOutput option').each(function() {
        let servoIndex = $(this).val();
        
        if (servoIndex === "0") {
            $(this).text("OFF");
        } else {
            let servo = servoRules.getServoMixRuleFromTarget(servoIndex);
            if (servo == null) {
                $(this).remove();
            } else {
                let servoInputIndex = parseInt(servo.getInput());
                $(this).text("Servo " + servoIndex + ": " + FC.getServoMixInputName(servoInputIndex));
            }
        }
    });

    // Update the OSD preview based on settings
    let generalGroup = OSD.constants.ALL_DISPLAY_GROUPS.filter(function(e) {
        return e.name == "osdGroupGeneral";
      })[0];

    for (let si = 0; si < generalGroup.items.length; si++) {
        if (generalGroup.items[si].name == "PAN_SERVO_CENTRED") {
            let craftNameText = $('#craft_name').val();

            if ($('#osdPanServoIndicatorShowDegrees').prop('checked')) {
                generalGroup.items[si].preview = FONT.symbol(SYM.PAN_SERVO_IS_OFFSET_L) + '120' + FONT.symbol(SYM.DEGREES);
            } else {
                generalGroup.items[si].preview = FONT.symbol(SYM.PAN_SERVO_IS_OFFSET_L);
            }
            break;
        }
    }

    OSD.GUI.updatePreviews();
}

TABS.osd.cleanup = function (callback) {
    PortHandler.flush_callbacks();

    // unbind "global" events
    $(document).unbind('keypress');
    $(document).off('click', 'span.progressLabel a');

    delete OSD.GUI.jbox;
    $('.jBox-wrapper').remove();

    if (callback) callback();
};
