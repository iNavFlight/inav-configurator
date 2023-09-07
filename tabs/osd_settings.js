/*global $,nwdialog*/
'use strict';

var useESCTelemetry = false;
var useBaro         = false;
var useCRSFRx       = false;
var usePitot        = false;

var video_type = null;
var isGuidesChecked = false;

var OSD_SETTINGS = OSD_SETTINGS || {};

// common functions for altitude and negative altitude alarms
function altitude_alarm_unit(osd_data) {
    switch (OSD_SETTINGS.data.preferences.units) {
        case 0: // Imperial
        case 3: // UK
        case 4: // GA
            return 'ft';
        default: // Metric
            return 'm';
    }
}

function altitude_alarm_to_display(osd_data, value) {
    switch (OSD_SETTINGS.data.preferences.units) {
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
    switch (OSD_SETTINGS.data.preferences.units) {
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
    switch (OSD_SETTINGS.data.preferences.units) {
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
// depending on the OSD_SETTINGS display unit used (hence, no conversion)
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

// parsed fc output and output to fc, used by to OSD_SETTINGS.msp.encode
OSD_SETTINGS.initData = function () {
    OSD_SETTINGS.data = {
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

OSD_SETTINGS.constants = {
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
                switch (OSD_SETTINGS.data.preferences.units) {
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
                switch (OSD_SETTINGS.data.preferences.units) {
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
                switch (OSD_SETTINGS.data.preferences.units) {
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
                switch (OSD_SETTINGS.data.preferences.units) {
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
                switch (OSD_SETTINGS.data.preferences.units) {
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
    ]
};

OSD_SETTINGS.reload = function(callback) {
    OSD_SETTINGS.initData();
    var done = function() {
        OSD_SETTINGS.updateDisplaySize();
        if (callback) {
            callback();
        }
    };

    MSP.promise(MSPCodes.MSP2_CF_SERIAL_CONFIG).then(function (resp) {
        $.each(SERIAL_CONFIG.ports, function(index, port){
            if(port.functions.includes('DJI_FPV')) {
                OSD_SETTINGS.data.isDjiHdFpv = true;
            }
            if(port.functions.includes('MSP_DISPLAYPORT')) {
                OSD_SETTINGS.data.isMspDisplay = true;
            }
        });
    });

    /*
    MSP.promise(MSPCodes.MSP2_INAV_OSD_SETTINGS_LAYOUTS).then(function (resp) {

        OSD_SETTINGS.msp.decodeLayoutCounts(resp);
        // Get data for all layouts
        var ids = Array.apply(null, {length: OSD_SETTINGS.data.layout_count}).map(Number.call, Number);
        var layouts = Promise.mapSeries(ids, function (layoutIndex, ii) {
            var data = [];
            data.push8(layoutIndex);
            return MSP.promise(MSPCodes.MSP2_INAV_OSD_SETTINGS_LAYOUTS, data).then(function (resp) {
                OSD_SETTINGS.msp.decodeLayout(layoutIndex, resp);
            });
        });
        layouts.then(function () {
            OSD_SETTINGS.updateSelectedLayout(OSD_SETTINGS.data.selected_layout || 0);

            MSP.promise(MSPCodes.MSP2_INAV_OSD_SETTINGS_ALARMS).then(function (resp) {
                OSD_SETTINGS.msp.decodeAlarms(resp);

                MSP.promise(MSPCodes.MSP2_INAV_OSD_SETTINGS_PREFERENCES).then(function (resp) {
                    OSD_SETTINGS.data.supported = true;
                    OSD_SETTINGS.msp.decodePreferences(resp);
                    done();
                });
            });
        });
    });
    */
        layouts.then(function () {
            //OSD_SETTINGS.updateSelectedLayout(OSD_SETTINGS.data.selected_layout || 0);

            MSP.promise(MSPCodes.MSP2_INAV_OSD_SETTINGS_ALARMS).then(function (resp) {
                OSD_SETTINGS.msp.decodeAlarms(resp);

                MSP.promise(MSPCodes.MSP2_INAV_OSD_SETTINGS_PREFERENCES).then(function (resp) {
                    OSD_SETTINGS.data.supported = true;
                    OSD_SETTINGS.msp.decodePreferences(resp);
                    done();
                });
            });
        });

};

OSD_SETTINGS.saveAlarms = function(callback) {
    let data = OSD_SETTINGS.msp.encodeAlarms();
    return MSP.promise(MSPCodes.MSP2_INAV_OSD_SETTINGS_SET_ALARMS, data).then(callback);
}

OSD_SETTINGS.saveConfig = function(callback) {
    return OSD_SETTINGS.saveAlarms(function () {
        var data = OSD_SETTINGS.msp.encodePreferences();
        return MSP.promise(MSPCodes.MSP2_INAV_OSD_SETTINGS_SET_PREFERENCES, data).then(callback);
    });
};

OSD_SETTINGS.saveItem = function(item, callback) {
    let pos = OSD_SETTINGS.data.items[item.id];
    let data = OSD_SETTINGS.msp.encodeLayoutItem(OSD_SETTINGS.data.selected_layout, item, pos);
    return MSP.promise(MSPCodes.MSP2_INAV_OSD_SETTINGS_SET_LAYOUT_ITEM, data).then(callback);
};

//noinspection JSUnusedLocalSymbols
OSD_SETTINGS.msp = {
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
                display_item.isVisible = (bits & OSD_SETTINGS.constants.VISIBLE) != 0;
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
                return (display_item.isVisible ? OSD_SETTINGS.constants.VISIBLE : 0)
                	| ((display_item.y & 0x3F) << 6) | (display_item.x & 0x3F);
            }
        }
    },

    encodeAlarms: function() {
        var result = [];

        result.push8(OSD_SETTINGS.data.alarms.rssi);
        result.push16(OSD_SETTINGS.data.alarms.fly_minutes);
        result.push16(OSD_SETTINGS.data.alarms.max_altitude);
        result.push16(OSD_SETTINGS.data.alarms.dist);
        result.push16(OSD_SETTINGS.data.alarms.max_neg_altitude);
        result.push16(OSD_SETTINGS.data.alarms.gforce);
        result.push16(OSD_SETTINGS.data.alarms.gforce_axis_min);
        result.push16(OSD_SETTINGS.data.alarms.gforce_axis_max);
        result.push8(OSD_SETTINGS.data.alarms.current);
        result.push16(OSD_SETTINGS.data.alarms.imu_temp_alarm_min);
        result.push16(OSD_SETTINGS.data.alarms.imu_temp_alarm_max);
        result.push16(OSD_SETTINGS.data.alarms.baro_temp_alarm_min);
        result.push16(OSD_SETTINGS.data.alarms.baro_temp_alarm_max);
        return result;
    },

    decodeAlarms: function(resp) {
        var alarms = resp.data;

        OSD_SETTINGS.data.alarms.rssi = alarms.readU8();
        OSD_SETTINGS.data.alarms.fly_minutes = alarms.readU16();
        OSD_SETTINGS.data.alarms.max_altitude = alarms.readU16();
        OSD_SETTINGS.data.alarms.dist = alarms.readU16();
        OSD_SETTINGS.data.alarms.max_neg_altitude = alarms.readU16();
        OSD_SETTINGS.data.alarms.gforce = alarms.readU16();
        OSD_SETTINGS.data.alarms.gforce_axis_min = alarms.read16();
        OSD_SETTINGS.data.alarms.gforce_axis_max = alarms.read16();
        OSD_SETTINGS.data.alarms.current = alarms.readU8();
        OSD_SETTINGS.data.alarms.imu_temp_alarm_min = alarms.read16();
        OSD_SETTINGS.data.alarms.imu_temp_alarm_max = alarms.read16();
        OSD_SETTINGS.data.alarms.baro_temp_alarm_min = alarms.read16();
        OSD_SETTINGS.data.alarms.baro_temp_alarm_max = alarms.read16();
    },

    encodePreferences: function() {
        var result = [];
        var p = OSD_SETTINGS.data.preferences;

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
        var p = OSD_SETTINGS.data.preferences;

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
        OSD_SETTINGS.data.layout_count = resp.data.readU8();
        OSD_SETTINGS.data.item_count = resp.data.readU8();
    },

    decodeLayout: function(layoutIndex, resp) {
        var items = [];

        for (var ii = 0; ii < OSD_SETTINGS.data.item_count; ii++) {
            var bits = resp.data.readU16();
            items.push(this.helpers.unpack.position(bits));
        }
        OSD_SETTINGS.data.layouts[layoutIndex] = items;
    },

    encodeOther: function () {
        var result = [-1, OSD_SETTINGS.data.preferences.video_system];
        result.push8(OSD_SETTINGS.data.preferences.units);
        // watch out, order matters! match the firmware
        result.push8(OSD_SETTINGS.data.alarms.rssi);
        result.push16(OSD_SETTINGS.data.alarms.batt_cap);
        result.push16(OSD_SETTINGS.data.alarms.fly_minutes);
        result.push16(OSD_SETTINGS.data.alarms.max_altitude);
        // These might be null, since there weren't supported
        // until version 1.8
        if (OSD_SETTINGS.data.alarms.dist !== null) {
            result.push16(OSD_SETTINGS.data.alarms.dist);
        }
        if (OSD_SETTINGS.data.alarms.max_neg_altitude !== null) {
            result.push16(OSD_SETTINGS.data.alarms.max_neg_altitude);
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
        var d = OSD_SETTINGS.data;
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

OSD_SETTINGS.GUI = {};
OSD_SETTINGS.GUI.preview = {
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
        var item = OSD_SETTINGS.get_item(item_id);
        var preview = OSD_SETTINGS.get_item_preview(item);
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

OSD_SETTINGS.GUI.checkAndProcessSymbolPosition = function(pos, charCode) {
    if (typeof OSD_SETTINGS.data.preview[pos] === 'object' && OSD_SETTINGS.data.preview[pos][0] !== null) {
        // position already in use, always put object item at position
        OSD_SETTINGS.data.preview[pos] = [OSD_SETTINGS.data.preview[pos][0], charCode, 'red'];
    } else {
        // position not used by an object type, put character at position
        // character types can overwrite character types (e.g. crosshair)
        OSD_SETTINGS.data.preview[pos] = charCode;
    }
};


OSD_SETTINGS.GUI.updateVideoMode = function() {
    // video mode
    var $videoTypes = $('.video-types').empty();

    if (!OSD_SETTINGS.data.isDjiHdFpv) {
        $('#dji_settings').hide();
    }

    if (OSD_SETTINGS.data.isMspDisplay) {
        if (mspVideoSystem.includes(OSD_SETTINGS.data.preferences.video_system) == false) {
            OSD_SETTINGS.data.preferences.video_system = OSD_SETTINGS.constants.VIDEO_TYPES.indexOf('HDZERO');
            OSD_SETTINGS.updateDisplaySize();
            OSD_SETTINGS.GUI.saveConfig();
        }
    } else {
        if (analogVideoSystem.includes(OSD_SETTINGS.data.preferences.video_system) == false) {
            OSD_SETTINGS.data.preferences.video_system = OSD_SETTINGS.constants.VIDEO_TYPES.indexOf('AUTO')
            OSD_SETTINGS.updateDisplaySize();
            OSD_SETTINGS.GUI.saveConfig();
        }
    }

    if (OSD_SETTINGS.data.isMspDisplay) {
        for (var i = 0; i < OSD_SETTINGS.constants.VIDEO_TYPES.length; i++) {
            if (mspVideoSystem.includes(i))
            {
                $videoTypes.append(
                    $('<option value="' + OSD_SETTINGS.constants.VIDEO_TYPES[i] + '">' + OSD_SETTINGS.constants.VIDEO_TYPES[i] + '</option>')
                        .prop('selected', i === OSD_SETTINGS.data.preferences.video_system)
                        .data('type', i)
                );
            }
        }
    } else {
        for (var i = 0; i < OSD_SETTINGS.constants.VIDEO_TYPES.length; i++) {
            if (analogVideoSystem.includes(i))
            {
                $videoTypes.append(
                    $('<option value="' + OSD_SETTINGS.constants.VIDEO_TYPES[i] + '">' + OSD_SETTINGS.constants.VIDEO_TYPES[i] + '</option>')
                        .prop('selected', i === OSD_SETTINGS.data.preferences.video_system)
                        .data('type', i)
                );
            }
        }
    }

    $videoTypes.change(function () {
        OSD_SETTINGS.data.preferences.video_system = $(this).find(':selected').data('type');
        OSD_SETTINGS.updateDisplaySize();
        OSD_SETTINGS.GUI.saveConfig();
    });
};

OSD_SETTINGS.GUI.updateUnits = function() {
    // units
    var $unitMode = $('#unit_mode').empty();
    var $unitTip = $('.units .cf_tip');

    for (var i = 0; i < OSD_SETTINGS.constants.UNIT_TYPES.length; i++) {
        var unitType = OSD_SETTINGS.constants.UNIT_TYPES[i];
        if (unitType.min_version && semver.lt(CONFIG.flightControllerVersion, unitType.min_version)) {
            continue;
        }
        var name = chrome.i18n.getMessage(unitType.name);
        var $option = $('<option>' + name + '</option>');
        $option.attr('value', name);
        $option.data('type', unitType.value);
        if (OSD_SETTINGS.data.preferences.units === unitType.value) {
            $option.prop('selected', true);
        }
        $unitMode.append($option);
    }
    function updateUnitHelp() {
        var unitType = OSD_SETTINGS.constants.UNIT_TYPES[OSD_SETTINGS.data.preferences.units];
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
        OSD_SETTINGS.data.preferences.units = selected.data('type');
        globalSettings.osdUnits = OSD_SETTINGS.data.preferences.units;
        OSD_SETTINGS.GUI.saveConfig();
        updateUnitHelp();
    });
};

OSD_SETTINGS.GUI.updateFields = function() {
    // display fields on/off and position
    var $tmpl = $('#osd_group_template').hide();
    // Clear previous groups, if any
    $('.osd_group').remove();
    for (var ii = 0; ii < OSD_SETTINGS.constants.ALL_DISPLAY_GROUPS.length; ii++) {
        var group = OSD_SETTINGS.constants.ALL_DISPLAY_GROUPS[ii];
        var groupItems = [];
        for (var jj = 0; jj < group.items.length; jj++) {
            var item = group.items[jj];
            if (!OSD_SETTINGS.is_item_displayed(item, group)) {
                continue;
            }
            OSD_SETTINGS.data.groups[item.id] = group;
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
            var itemData = OSD_SETTINGS.data.items[item.id];
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
                        var itemData = OSD_SETTINGS.data.items[item.id];
                        var $position = $(this).parent().find('.position.' + item.name);
                        itemData.isVisible = !itemData.isVisible;

                        if (itemData.isVisible) {
                            // Ensure the element is inside the viewport, at least partially.
                            // In that case move it to the very first row/col, otherwise there's
                            // no way to reposition items that are outside the viewport.
                            OSD_SETTINGS.msp.helpers.calculate.coords(itemData);
                            if (itemData.x > OSD_SETTINGS.data.display_size.x || itemData.y > OSD_SETTINGS.data.display_size.y) {
                                itemData.x = itemData.y = itemData.position = 0;
                            }
                            $position.show();
                        } else {
                            $position.hide();
                        }

                        OSD_SETTINGS.GUI.saveItem(item);
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
                            var itemData = OSD_SETTINGS.data.items[item.id];
                            itemData.position = parseInt($(this).val());
                            OSD_SETTINGS.msp.helpers.calculate.coords(itemData);
                            OSD_SETTINGS.GUI.saveItem(item);
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
                OSD_SETTINGS.GUI.updateGuidesView(this.checked);
                chrome.storage.local.set({'showOSD_SETTINGSGuides': this.checked});
                OSD_SETTINGS.GUI.updatePreviews();
            })
        );
    }

    if ($('#djiUnsupportedElementsToggle').length == false) {
        $('#djiUnsupportedElements').prepend(
            $('<input id="djiUnsupportedElementsToggle" type="checkbox" class="toggle" />')
            .attr('checked', OSD_SETTINGS.data.isDjiHdFpv && !OSD_SETTINGS.data.isMspDisplay)
            .on('change', function () {
                OSD_SETTINGS.GUI.updateDjiView(this.checked);
                OSD_SETTINGS.GUI.updatePreviews();
            })
        );
    }

    // TODO: If we add more switches somewhere else, this
    // needs to be called after all of them have been set up
    GUI.switchery();

    // Update the OSD_SETTINGS preview
    refreshOSD_SETTINGSSwitchIndicators();
    updatePilotAndCraftNames();
    updatePanServoPreview();
};

OSD_SETTINGS.GUI.removeBottomLines = function(){
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

OSD_SETTINGS.GUI.updateDjiMessageElements = function(on) {
    $('.display-field').each(function(index, element) {
        var name = $(element).find('input').attr('name');
        if (OSD_SETTINGS.DjiElements.craftNameElements.includes(name)) {
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
    OSD_SETTINGS.GUI.removeBottomLines();
};

OSD_SETTINGS.GUI.updateGuidesView = function(on) {
    isHdZero = OSD_SETTINGS.constants.VIDEO_TYPES[OSD_SETTINGS.data.preferences.video_system] == 'HDZERO';
    $('.hd_43_margin_left').toggleClass('hdzero_43_left', (isHdZero && on))
    $('.hd_43_margin_right').toggleClass('hdzero_43_right', (isHdZero && on))
    $('.hd_3016_box_top').toggleClass('hd_3016_top', (isHdZero && on))
    $('.hd_3016_box_bottom').toggleClass('hd_3016_bottom', (isHdZero && on))
    $('.hd_3016_box_left').toggleClass('hd_3016_left', (isHdZero && on))
    $('.hd_3016_box_right').toggleClass('hd_3016_right', (isHdZero && on))

    isDJIWTF = OSD_SETTINGS.constants.VIDEO_TYPES[OSD_SETTINGS.data.preferences.video_system] == 'DJIWTF';
    $('.hd_43_margin_left').toggleClass('dji_hd_43_left', (isDJIWTF && on))
    $('.hd_43_margin_right').toggleClass('dji_hd_43_right', (isDJIWTF && on))

    isAvatar = OSD_SETTINGS.constants.VIDEO_TYPES[OSD_SETTINGS.data.preferences.video_system] == 'AVATAR';
    $('.hd_43_margin_left').toggleClass('hd_avatar_43_left', (isAvatar && on))
    $('.hd_43_margin_right').toggleClass('hd_avatar_43_right', (isAvatar && on))
    $('.hd_avatar_bottom_bar').toggleClass('hd_avatar_bottom', (isAvatar && on))
    $('.hd_avatar_storage_box_top').toggleClass('hd_avatar_storagebox_t', (isAvatar && on))
    $('.hd_avatar_storage_box_bottom').toggleClass('hd_avatar_storagebox_b', (isAvatar && on))
    $('.hd_avatar_storage_box_left').toggleClass('hd_avatar_storagebox_l', (isAvatar && on))
    $('.hd_avatar_storage_box_right').toggleClass('hd_avatar_storagebox_r', (isAvatar && on))

    isBfHdCompat = OSD_SETTINGS.constants.VIDEO_TYPES[OSD_SETTINGS.data.preferences.video_system] == 'BFHDCOMPAT';
    $('.hd_43_margin_left').toggleClass('hd_bfhdcompat_43_left', (isBfHdCompat && on));
    $('.hd_43_margin_right').toggleClass('hd_bfhdcompat_43_right', (isBfHdCompat && on));
    $('.hd_bfhdcompat_bottom_box').toggleClass('hd_bfhdcompat_bottom', (isBfHdCompat && on));
    $('.hd_bfhdcompat_storage_box').toggleClass('hd_bfhdcompat_storagebox', (isBfHdCompat && on));

    isPAL = OSD_SETTINGS.constants.VIDEO_TYPES[OSD_SETTINGS.data.preferences.video_system] == 'PAL' || OSD_SETTINGS.constants.VIDEO_TYPES[OSD_SETTINGS.data.preferences.video_system] == 'AUTO';
    $('.pal_ntsc_box_bottom').toggleClass('ntsc_bottom', (isPAL && on))
};

OSD_SETTINGS.GUI.updateDjiView = function(on) {
    if (on) {
        $(OSD_SETTINGS.DjiElements.emptyGroups).each(function(index, groupName) {
            $('#osdGroup' + groupName).hide();
        });

        var displayFields = $('.display-field');
        displayFields.each(function(index, element) {
            var name = $(element).find('input').attr('name');
            if (!OSD_SETTINGS.DjiElements.supported.includes(name)) {
                $(element).hide();
            }
        });

        var settings = $('.settings-container').find('.settings').children();
        settings.each(function(index, element) {
            var name = $(element).attr('class');
            if (!OSD_SETTINGS.DjiElements.supportedSettings.includes(name)) {
                $(element).hide();
            }
        });

        var alarms = $('.alarms-container').find('.settings').children();
        alarms.each(function(index, element) {
            var name = $(element).attr('for');
            if (!OSD_SETTINGS.DjiElements.supportedAlarms.includes(name)) {
                $(element).hide();
            }
        });

        $('.switch-indicator-container').hide();
    } else {
        $(OSD_SETTINGS.DjiElements.emptyGroups).each(function(index, groupName) {
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
    OSD_SETTINGS.GUI.updateDjiMessageElements($('#useCraftnameForMessages').is(':checked'));
};

OSD_SETTINGS.GUI.updateAlarms = function() {
    $(".osd_use_airspeed_alarm").toggle(usePitot);
    $(".osd_use_baro_temp_alarm").toggle(useBaro);
    $(".osd_use_esc_telemetry").toggle(useESCTelemetry);
    $(".osd_use_crsf").toggle(useCRSFRx);
};

OSD_SETTINGS.GUI.updateMapPreview = function(mapCenter, name, directionSymbol, centerSymbol) {
    if ($('input[name="' + name + '"]').prop('checked')) {
        var mapInitialX = OSD_SETTINGS.data.display_size.x - 2;
        OSD_SETTINGS.GUI.checkAndProcessSymbolPosition(mapCenter, centerSymbol);
    }
};

OSD_SETTINGS.GUI.updatePreviews = function() {
    // buffer the preview;
    OSD_SETTINGS.data.preview = [];

    // clear the buffer
    for (i = 0; i < OSD_SETTINGS.data.display_size.total; i++) {
        OSD_SETTINGS.data.preview.push([null, ' '.charCodeAt(0)]);
    };

    // draw all the displayed items and the drag and drop preview images
    for (var ii = 0; ii < OSD_SETTINGS.data.items.length; ii++) {
        var item = OSD_SETTINGS.get_item(ii);
        if (!item || !OSD_SETTINGS.is_item_displayed(item, OSD_SETTINGS.data.groups[item.id])) {
            continue;
        }
        var itemData = OSD_SETTINGS.data.items[ii];
        if (!itemData.isVisible) {
            continue;
        }

		if (itemData.x >= OSD_SETTINGS.data.display_size.x)
		{
			continue;
		}

        // DJI HD FPV: Hide elements that only appear in craft name
        if (OSD_SETTINGS.DjiElements.craftNameElements.includes(item.name) &&
        $('#djiUnsupportedElements').find('input').is(':checked')) {
            continue;
        }
        var j = (itemData.position >= 0) ? itemData.position : itemData.position + OSD_SETTINGS.data.display_size.total;
        // create the preview image
        item.preview_img = new Image();
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext("2d");
        // fill the screen buffer
        var preview = OSD_SETTINGS.get_item_preview(item);
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
            var previewPos = j + x + (y * OSD_SETTINGS.data.display_size.x);
            if (previewPos >= OSD_SETTINGS.data.preview.length) {
                // Character is outside the viewport
                x++;
                continue;
            }
            // test if this position already has a character placed
            if (OSD_SETTINGS.data.preview[previewPos][0] !== null) {
                // if so set background color to red to show user double usage of position
                OSD_SETTINGS.data.preview[previewPos] = [item, charCode, 'red'];
            } else {
                OSD_SETTINGS.data.preview[previewPos] = [item, charCode];
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


    var centerPosition = (OSD_SETTINGS.data.display_size.x * OSD_SETTINGS.data.display_size.y / 2);
    if (OSD_SETTINGS.data.display_size.y % 2 == 0) {
        centerPosition += Math.floor(OSD_SETTINGS.data.display_size.x / 2);
    }

    let hudCenterPosition = centerPosition - (OSD_SETTINGS.constants.VIDEO_COLS[video_type] * $('#osd_horizon_offset').val());

    // artificial horizon
    if ($('input[name="ARTIFICIAL_HORIZON"]').prop('checked')) {
        for (i = 0; i < 9; i++) {
            OSD_SETTINGS.GUI.checkAndProcessSymbolPosition(hudCenterPosition - 4 + i, SYM.AH_BAR9_0 + 4);
        }
    }

    // crosshairs
    if ($('input[name="CROSSHAIRS"]').prop('checked')) {
        crsHNumber = Settings.getInputValue('osd_crosshairs_style');
       if (crsHNumber == 1) {
            // AIRCRAFT style
            OSD_SETTINGS.GUI.checkAndProcessSymbolPosition(hudCenterPosition - 2, SYM.AH_AIRCRAFT0);
            OSD_SETTINGS.GUI.checkAndProcessSymbolPosition(hudCenterPosition - 1, SYM.AH_AIRCRAFT1);
            OSD_SETTINGS.GUI.checkAndProcessSymbolPosition(hudCenterPosition, SYM.AH_AIRCRAFT2);
            OSD_SETTINGS.GUI.checkAndProcessSymbolPosition(hudCenterPosition + 1, SYM.AH_AIRCRAFT3);
            OSD_SETTINGS.GUI.checkAndProcessSymbolPosition(hudCenterPosition + 2, SYM.AH_AIRCRAFT4);
        } else if ((crsHNumber > 1) && (crsHNumber < 8)) {
            // TYPES 3 to 8 (zero indexed)
            OSD_SETTINGS.GUI.checkAndProcessSymbolPosition(hudCenterPosition - 1, SYM.AH_CROSSHAIRS[crsHNumber][0]);
            OSD_SETTINGS.GUI.checkAndProcessSymbolPosition(hudCenterPosition, SYM.AH_CROSSHAIRS[crsHNumber][1]);
            OSD_SETTINGS.GUI.checkAndProcessSymbolPosition(hudCenterPosition + 1, SYM.AH_CROSSHAIRS[crsHNumber][2]);
        } else {
            // DEFAULT or unknown style
            OSD_SETTINGS.GUI.checkAndProcessSymbolPosition(hudCenterPosition - 1, SYM.AH_CENTER_LINE);
            OSD_SETTINGS.GUI.checkAndProcessSymbolPosition(hudCenterPosition, SYM.AH_CROSSHAIRS[crsHNumber]);
            OSD_SETTINGS.GUI.checkAndProcessSymbolPosition(hudCenterPosition + 1, SYM.AH_CENTER_LINE_RIGHT);
        }
    }

    // sidebars
    if ($('input[name="HORIZON_SIDEBARS"]').prop('checked')) {
        var hudwidth = OSD_SETTINGS.constants.AHISIDEBARWIDTHPOSITION;
        var hudheight = OSD_SETTINGS.constants.AHISIDEBARHEIGHTPOSITION;
        for (i = -hudheight; i <= hudheight; i++) {
            OSD_SETTINGS.GUI.checkAndProcessSymbolPosition(hudCenterPosition - hudwidth + (i * FONT.constants.SIZES.LINE), SYM.AH_DECORATION);
            OSD_SETTINGS.GUI.checkAndProcessSymbolPosition(hudCenterPosition + hudwidth + (i * FONT.constants.SIZES.LINE), SYM.AH_DECORATION);
        }
        // AH level indicators
        OSD_SETTINGS.GUI.checkAndProcessSymbolPosition(hudCenterPosition - hudwidth + 1, SYM.AH_LEFT);
        OSD_SETTINGS.GUI.checkAndProcessSymbolPosition(hudCenterPosition + hudwidth - 1, SYM.AH_RIGHT);
    }

    OSD_SETTINGS.GUI.updateMapPreview(centerPosition, 'MAP_NORTH', 'N', SYM.HOME);
    OSD_SETTINGS.GUI.updateMapPreview(centerPosition, 'MAP_TAKEOFF', 'T', SYM.HOME);
    OSD_SETTINGS.GUI.updateMapPreview(centerPosition, 'RADAR', null, SYM.DIR_TO_HOME);

    // render
    var $preview = $('.display-layout .preview').empty();
    var $row = $('<div class="row"/>');
    for (i = 0; i < OSD_SETTINGS.data.display_size.total;) {
        var charCode = OSD_SETTINGS.data.preview[i];
        var colorStyle = '';

        if (typeof charCode === 'object') {
            var item = OSD_SETTINGS.data.preview[i][0];
            charCode = OSD_SETTINGS.data.preview[i][1];
            if (OSD_SETTINGS.data.preview[i][2] !== undefined) {
                // if third field is set it contains a background color
                colorStyle = 'style="background-color: ' + OSD_SETTINGS.data.preview[i][2] + ';"';
            }
        }
        var $img = $('<div class="char"' + colorStyle + '><img src=' + FONT.draw(charCode) + '></img></div>')
            .on('mouseenter', OSD_SETTINGS.GUI.preview.onMouseEnter)
            .on('mouseleave', OSD_SETTINGS.GUI.preview.onMouseLeave)
            .on('dragover', OSD_SETTINGS.GUI.preview.onDragOver)
            .on('dragleave', OSD_SETTINGS.GUI.preview.onDragLeave)
            .on('drop', OSD_SETTINGS.GUI.preview.onDrop)
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
                .on('dragstart', OSD_SETTINGS.GUI.preview.onDragStart)
                .prop('title', nameMessage);
        }

        $row.append($img);
        if (++i % OSD_SETTINGS.data.display_size.x == 0) {
            $preview.append($row);
            $row = $('<div class="row"/>');
        }
    }
};

OSD_SETTINGS.GUI.updateAll = function() {
    if (!OSD_SETTINGS.data.supported) {
        $('.unsupported').fadeIn();
        return;
    }
    var layouts = $('.osd_layouts');
    if (OSD_SETTINGS.data.layout_count > 1) {
        layouts.empty();
        for (var ii = 0; ii < OSD_SETTINGS.data.layout_count; ii++) {
            var name = ii > 0 ? chrome.i18n.getMessage('osdLayoutAlternative', [ii]) : chrome.i18n.getMessage('osdLayoutDefault');
            var opt = $('<option/>').val(ii).text(name).appendTo(layouts);
        }
        layouts.val(OSD_SETTINGS.data.selected_layout);
        layouts.show();
        layouts.on('change', function() {
            OSD_SETTINGS.updateSelectedLayout(parseInt(layouts.val()));
            OSD_SETTINGS.GUI.updateFields();
            OSD_SETTINGS.GUI.updateGuidesView($('#videoGuides').find('input').is(':checked'));
            OSD_SETTINGS.GUI.updateDjiView($('#djiUnsupportedElements').find('input').is(':checked'));
            OSD_SETTINGS.GUI.updatePreviews();
        });
    } else {
        layouts.hide();
        layouts.off('change');
    }

    $('.osd_search').on('input', function() {
        OSD_SETTINGS.GUI.updateFields();
    });
    $('.supported').fadeIn();
    OSD_SETTINGS.GUI.updateVideoMode();
    OSD_SETTINGS.GUI.updateUnits();
    OSD_SETTINGS.GUI.updateFields();
    OSD_SETTINGS.GUI.updatePreviews();
    OSD_SETTINGS.GUI.updateGuidesView($('#videoGuides').find('input').is(':checked'));
    OSD_SETTINGS.GUI.updateDjiView(OSD_SETTINGS.data.isDjiHdFpv && !OSD_SETTINGS.data.isMspDisplay);
    OSD_SETTINGS.GUI.updateAlarms();
};

OSD_SETTINGS.GUI.update = function() {
    OSD_SETTINGS.reload(function() {
        OSD_SETTINGS.GUI.updateAll();
    });
};

OSD_SETTINGS.GUI.saveItem = function(item) {
    OSD_SETTINGS.saveItem(item, function() {
        OSD_SETTINGS.GUI.updatePreviews();
    });
};

OSD_SETTINGS.GUI.saveConfig = function() {
    OSD_SETTINGS.saveConfig(function() {
        OSD_SETTINGS.GUI.updatePreviews();
    });
};

TABS.osd_settings = {};
TABS.osd_settings.initialize = function (callback) {

    mspHelper.loadServoMixRules();

    if (GUI.active_tab != 'osd_settings') {
        GUI.active_tab = 'osd_settings';
    }

    GUI.load("./tabs/osd_settings.html", Settings.processHtml(function () {
        // translate to user-selected language
        localize();

        // Open modal window
        OSD_SETTINGS.GUI.jbox = new jBox('Modal', {
            width: 708,
            height: 240,
            position: {y:'bottom'},
            offset: {y:-50},
            closeButton: 'title',
            animation: false,
            attach: $('#fontmanager'),
            title: 'OSD_SETTINGS Font Manager',
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
        chrome.storage.local.get('showOSD_SETTINGSGuides', function (result) {
            if (typeof result.showOSD_SETTINGSGuides !== 'undefined') {
                isGuidesChecked = result.showOSD_SETTINGSGuides;
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

            // Update the OSD_SETTINGS preview
            refreshOSD_SETTINGSSwitchIndicators();
        });

        // Function to update the OSD_SETTINGS layout when the switch text alignment changes
        $("#switchIndicators_alignLeft").on('change', function() {
            refreshOSD_SETTINGSSwitchIndicators();
        });

        // Functions for when pan servo settings change
        $('#osdPanServoIndicatorShowDegrees').on('change', function() {
            // Update the OSD_SETTINGS preview
            updatePanServoPreview();
        });

        $('#panServoOutput').on('change', function() {
            // Update the OSD_SETTINGS preview
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

            // Update the OSD_SETTINGS preview
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

            // Update the OSD_SETTINGS preview
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
                OSD_SETTINGS.GUI.update();
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
                OSD_SETTINGS.GUI.update();
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
            if (OSD_SETTINGS.data) {
                // Force an OSD_SETTINGS redraw by saving any element
                // with a small delay, to make sure the setting
                // change is performance before the OSD_SETTINGS starts
                // the full redraw.
                // This will also update all previews
                setTimeout(function() {
                    OSD_SETTINGS.GUI.saveItem({id: 0});
                }, 100);
            }
        });

        $('#useCraftnameForMessages').on('change', function() {
            OSD_SETTINGS.GUI.updateDjiMessageElements(this.checked);
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
        // OSD_SETTINGS_AIR_SPEED
        mspHelper.loadSensorConfig(function () {
            useBaro  = (SENSOR_CONFIG.barometer != 0);
            usePitot = (SENSOR_CONFIG.pitot != 0);
            GUI.content_ready(callback);
        });
    }));
};

function refreshOSD_SETTINGSSwitchIndicators() {
    let group = OSD_SETTINGS.constants.ALL_DISPLAY_GROUPS.filter(function(e) {
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

    OSD_SETTINGS.GUI.updatePreviews();
};

function updatePilotAndCraftNames() {
    let foundPilotName = ($('#pilot_name').val() == undefined);
    let foundCraftName = ($('#craft_name').val() == undefined);
    
    let generalGroup = OSD_SETTINGS.constants.ALL_DISPLAY_GROUPS.filter(function(e) {
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

    OSD_SETTINGS.GUI.updatePreviews();
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

    // Update the OSD_SETTINGS preview based on settings
    let generalGroup = OSD_SETTINGS.constants.ALL_DISPLAY_GROUPS.filter(function(e) {
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

    OSD_SETTINGS.GUI.updatePreviews();
}

TABS.osd_settings.cleanup = function (callback) {
    PortHandler.flush_callbacks();

    // unbind "global" events
    $(document).unbind('keypress');
    $(document).off('click', 'span.progressLabel a');

    delete OSD_SETTINGS.GUI.jbox;
    $('.jBox-wrapper').remove();

    if (callback) callback();
};
