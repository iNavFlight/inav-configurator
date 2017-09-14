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
SYM.METRE = 0xC;
SYM.FEET = 0xF;
SYM.GPS_SAT1 = 0x1E;
SYM.GPS_SAT2 = 0x1F;
SYM.GPS_SPEED = 0xA1;
SYM.ALT = 0xAA;
SYM.LAT = 0xA6;
SYM.LON = 0xA7;
SYM.DIR_TO_HOME = 0x60;
SYM.DIST_TO_HOME = 0xA0;
SYM.HEADING1 = 0xA9;
SYM.HEADING2 = 0xA8;
SYM.VARIO = 0x9F;
SYM.LAST_CHAR = 188;

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

var OSD = OSD || {};

// parsed fc output and output to fc, used by to OSD.msp.encode
OSD.initData = function () {
    OSD.data = {
        video_system: null,
        unit_mode: null,
        alarms: [],
        display_items: [],
        last_positions: {},
        preview: []
    };
};
OSD.initData();

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

    // All display fields, from every version, do not remove elements, only add!
    ALL_DISPLAY_FIELDS: {
        MAIN_BATT_VOLTAGE: {
            name: 'MAIN_BATT_VOLTAGE',
            default_position: -29,
            positionable: true,
            preview: FONT.symbol(SYM.VOLT) + '16.8V'
        },
        RSSI_VALUE: {
            name: 'RSSI_VALUE',
            default_position: -59,
            positionable: true,
            preview: FONT.symbol(SYM.RSSI) + '99'
        },
        TIMER: {
            name: 'TIMER',
            default_position: -39,
            positionable: true,
            preview: FONT.symbol(SYM.ON_M) + ' 11:11'
        },
        THROTTLE_POSITION: {
            name: 'THROTTLE_POSITION',
            default_position: -9,
            positionable: true,
            preview: FONT.symbol(SYM.THR) + FONT.symbol(SYM.THR1) + ' 69'
        },
        CPU_LOAD: {
            name: 'CPU_LOAD',
            default_position: 26,
            positionable: true,
            preview: '15'
        },
        VTX_CHANNEL: {
            name: 'VTX_CHANNEL',
            default_position: 1,
            positionable: true,
            preview: 'CH:1'
        },
        VOLTAGE_WARNING: {
            name: 'VOLTAGE_WARNING',
            default_position: -80,
            positionable: true,
            preview: 'LOW VOLTAGE'
        },
        ARMED: {
            name: 'ARMED',
            default_position: -107,
            positionable: true,
            preview: 'ARMED'
        },
        DISARMED: {
            name: 'DISARMED',
            default_position: -109,
            positionable: true,
            preview: 'DISARMED'
        },
        CROSSHAIRS: {
            name: 'CROSSHAIRS',
            default_position: -1,
            positionable: false
        },
        ARTIFICIAL_HORIZON: {
            name: 'ARTIFICIAL_HORIZON',
            default_position: -1,
            positionable: false
        },
        HORIZON_SIDEBARS: {
            name: 'HORIZON_SIDEBARS',
            default_position: -1,
            positionable: false
        },
        CURRENT_DRAW: {
            name: 'CURRENT_DRAW',
            default_position: -23,
            positionable: true,
            preview: FONT.symbol(SYM.AMP) + '42.0'
        },
        MAH_DRAWN: {
            name: 'MAH_DRAWN',
            default_position: -18,
            positionable: true,
            preview: FONT.symbol(SYM.MAH) + '690'
        },
        CRAFT_NAME: {
            name: 'CRAFT_NAME',
            default_position: -77,
            positionable: true,
            preview: '[CRAFT_NAME]'
        },
        ALTITUDE: {
            name: 'ALTITUDE',
            default_position: 62,
            positionable: true,
            preview: function (osd_data) {
                return FONT.symbol(SYM.ALT) + '399.7' + FONT.symbol(osd_data.unit_mode === 0 ? SYM.FEET : SYM.METRE)
            }
        },
        ONTIME: {
            name: 'ONTIME',
            default_position: -1,
            positionable: true,
            preview: FONT.symbol(SYM.ON_M) + '  4:11'
        },
        FLYTIME: {
            name: 'FLYTIME',
            default_position: -1,
            positionable: true,
            preview: FONT.symbol(SYM.FLY_M) + '  4:11'
        },
        FLYMODE: {
            name: 'FLYMODE',
            default_position: -1,
            positionable: true,
            preview: 'STAB'
        },
        GPS_SPEED: {
            name: 'GPS_SPEED',
            default_position: -1,
            positionable: true,
            preview: '40' + FONT.symbol(SYM.GPS_SPEED)
        },
        GPS_SATS: {
            name: 'GPS_SATS',
            default_position: -1,
            positionable: true,
            preview: FONT.symbol(SYM.GPS_SAT1) + FONT.symbol(SYM.GPS_SAT2) + '14'
        },
        ROLL_PIDS: {
            name: 'ROLL_PIDS',
            default_position: -1,
            positionable: true,
            preview: 'ROL 40 30 23'
        },
        PITCH_PIDS: {
            name: 'PITCH_PIDS',
            default_position: -1,
            positionable: true,
            preview: 'PIT 40 30 23'
        },
        YAW_PIDS: {
            name: 'YAW_PIDS',
            default_position: -1,
            positionable: true,
            preview: 'YAW 85 45 0'
        },
        POWER: {
            name: 'POWER',
            default_position: -1,
            positionable: true,
            preview: '50W'
        },
        GPS_LON: {
            name: 'LONGITUDE',
            default_position: -1,
            positionable: true,
            preview: FONT.symbol(SYM.LON) + '14.76521'
        },
        GPS_LAT: {
            name: 'LATITUDE',
            default_position: -1,
            positionable: true,
            preview: FONT.symbol(SYM.LAT) + '52.98723'
        },
        HOME_DIR: {
            name: 'DIRECTION_TO_HOME',
            default_position: -1,
            positionable: true,
            preview: FONT.symbol(SYM.DIR_TO_HOME)
        },
        HOME_DIST: {
            name: 'DISTANCE_TO_HOME',
            default_position: -1,
            positionable: true,
            preview:  FONT.symbol(SYM.DIST_TO_HOME) + '300' +  FONT.symbol(SYM.METRE)
        },
        HEADING: {
            name: 'HEADING',
            default_position: -1,
            positionable: true,
            preview: FONT.symbol(SYM.HEADING1) + '175' + FONT.symbol(SYM.HEADING2)
        },
        VARIO: {
            name: 'VARIO',
            default_position: -1,
            positionable: true,
            preview: '-'
        },
        VARIO_NUM: {
            name: 'VARIO_NUM',
            default_position: -1,
            positionable: true,
            preview: '-0.5' + FONT.symbol(SYM.VARIO)
        },
        AIR_SPEED: {
            name: 'AIR_SPEED',
            default_position: -1,
            positionable: true,
            preview: '55' + FONT.symbol(SYM.GPS_SPEED)
        }
    }
};

// Pick display fields by version, order matters, so these are going in an array... pry could iterate the example map instead
OSD.chooseFields = function () {
    var F = OSD.constants.ALL_DISPLAY_FIELDS;
    OSD.constants.DISPLAY_FIELDS = [
        F.RSSI_VALUE,
        F.MAIN_BATT_VOLTAGE,
        F.CROSSHAIRS,
        F.ARTIFICIAL_HORIZON,
        F.HORIZON_SIDEBARS,
        F.ONTIME,
        F.FLYTIME,
        F.FLYMODE,
        F.CRAFT_NAME,
        F.THROTTLE_POSITION,
        F.VTX_CHANNEL,
        F.CURRENT_DRAW,
        F.MAH_DRAWN,
        F.GPS_SPEED,
        F.GPS_SATS,
        F.ALTITUDE
    ];

    if (semver.gte(CONFIG.flightControllerVersion, "1.6.0")) {
        OSD.constants.DISPLAY_FIELDS.push(F.ROLL_PIDS);
        OSD.constants.DISPLAY_FIELDS.push(F.PITCH_PIDS);
        OSD.constants.DISPLAY_FIELDS.push(F.YAW_PIDS);
        OSD.constants.DISPLAY_FIELDS.push(F.POWER);

        OSD.constants.DISPLAY_FIELDS.push(F.GPS_LON);
        OSD.constants.DISPLAY_FIELDS.push(F.GPS_LAT);
        OSD.constants.DISPLAY_FIELDS.push(F.HOME_DIR);
        OSD.constants.DISPLAY_FIELDS.push(F.HOME_DIST);
        OSD.constants.DISPLAY_FIELDS.push(F.HEADING);       
        OSD.constants.DISPLAY_FIELDS.push(F.VARIO);
        OSD.constants.DISPLAY_FIELDS.push(F.VARIO_NUM);        
    }

    if (semver.gte(CONFIG.flightControllerVersion, "1.7.3")) {
        OSD.constants.DISPLAY_FIELDS.push(F.AIR_SPEED);
    }

};

OSD.updateDisplaySize = function () {
    var video_type = OSD.constants.VIDEO_TYPES[OSD.data.video_system];
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
            position: function (bits, c) {
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

    encodeOther: function () {
        var result = [-1, OSD.data.video_system];
        result.push8(OSD.data.unit_mode);
        // watch out, order matters! match the firmware
        result.push8(OSD.data.alarms.rssi.value);
        result.push16(OSD.data.alarms.cap.value);
        result.push16(OSD.data.alarms.time.value);
        result.push16(OSD.data.alarms.alt.value);
        return result;
    },

    encode: function (display_item) {
        var buffer = [];
        buffer.push8(display_item.index);
        buffer.push16(this.helpers.pack.position(display_item));
        return buffer;
    },

    /*
     * Currently only parses MSP_MAX_OSD responses, add a switch on payload.code if more codes are handled
     */
    decode: function (payload) {
        var view = payload.data;
        var d = OSD.data;
        d.compiled_in = view.readU8();
        d.video_system = view.readU8();

        d.unit_mode = view.readU8();
        d.alarms = {};
        d.alarms['rssi'] = { display_name: 'Rssi', value: view.readU8() };
        d.alarms['cap'] = { display_name: 'Capacity', value: view.readU16() };
        d.alarms['time'] = { display_name: 'Minutes', value: view.readU16() };
        d.alarms['alt'] = { display_name: 'Altitude', value: view.readU16() };

        d.display_items = [];
        // start at the offset from the other fields
        while (view.offset < view.byteLength) {
            var v = null;
            v = view.readU16();

            var j = d.display_items.length;
            var c = OSD.constants.DISPLAY_FIELDS[j];

            if (c) {
                d.display_items.push($.extend({
                    name: c.name,
                    index: j,
                    positionable: c.positionable,
                    preview: typeof(c.preview) === 'function' ? c.preview(d) : c.preview
                }, this.helpers.unpack.position(v, c)));
            }
        }
        OSD.updateDisplaySize();
    }
};

OSD.GUI = {};
OSD.GUI.preview = {
    onMouseEnter: function () {
        if (!$(this).data('field')) {
            return;
        }
        $('.field-' + $(this).data('field').index).addClass('mouseover')
    },

    onMouseLeave: function () {
        if (!$(this).data('field')) {
            return;
        }
        $('.field-' + $(this).data('field').index).removeClass('mouseover')
    },

    onDragStart: function (e) {
        var ev = e.originalEvent;
        //noinspection JSUnresolvedVariable
        ev.dataTransfer.setData("text/plain", $(ev.target).data('field').index);
        //noinspection JSUnresolvedVariable
        ev.dataTransfer.setDragImage($(this).data('field').preview_img, 6, 9);
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
        var position = $(this).removeAttr('style').data('position');
        //noinspection JSUnresolvedVariable
        var field_id = parseInt(ev.dataTransfer.getData('text'));
        var display_item = OSD.data.display_items[field_id];
        var overflows_line = FONT.constants.SIZES.LINE - ((position % FONT.constants.SIZES.LINE) + display_item.preview.length);

        if (overflows_line < 0) {
            position += overflows_line;
        }

        $('input.' + field_id + '.position').val(position).change();
    }
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

        var $unitMode = $('.units select').empty();

        $unitMode.change(function (e) {
            var selected = $(this).find(':selected');
            OSD.data.unit_mode = selected.data('type');
            MSP.promise(MSPCodes.MSP_SET_OSD_CONFIG, OSD.msp.encodeOther())
                .then(function () {
                    updateOsdView();
                });
        });

        // 2 way binding... sorta
        function updateOsdView() {

            // ask for the OSD config data
            MSP.promise(MSPCodes.MSP_OSD_CONFIG)
                .then(function (info) {

                    var i,
                        type;

                    OSD.chooseFields();
                    if (info.length <= 1) {
                        $('.unsupported').fadeIn();
                        return;
                    }

                    $('.supported').fadeIn();
                    OSD.msp.decode(info);

                    // video mode
                    var $videoTypes = $('.video-types').empty();
                    for (i = 0; i < OSD.constants.VIDEO_TYPES.length; i++) {

                        $videoTypes.append(
                            $('<label/>')
                                .append($('<input name="video_system" type="radio"/>' + OSD.constants.VIDEO_TYPES[i] + '</label>')
                                    .prop('checked', i === OSD.data.video_system)
                                    .data('type', i)
                            )
                        );

                    }

                    $videoTypes.find(':radio').click(function () {
                        OSD.data.video_system = $(this).data('type');
                        MSP.promise(MSPCodes.MSP_SET_OSD_CONFIG, OSD.msp.encodeOther())
                            .then(function () {
                                updateOsdView();
                            });
                    });

                    // units
                    $('.units-container').show();
                    $unitMode.empty();
                    var $unitTip = $('.units .cf_tip');
                    for (i = 0; i < OSD.constants.UNIT_TYPES.length; i++) {
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
                        if (OSD.data.unit_mode === unitType.value) {
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

                    // alarms
                    $('.alarms-container').show();
                    var $alarms = $('.alarms').empty();
                    for (var k in OSD.data.alarms) {
                        var alarm = OSD.data.alarms[k];
                        var alarmInput = $('<input name="alarm" type="number" id="' + k + '"/>' + alarm.display_name + '</label>');
                        alarmInput.val(alarm.value);
                        alarmInput.blur(function (e) {
                            OSD.data.alarms[$(this)[0].id].value = $(this)[0].value;
                            MSP.promise(MSPCodes.MSP_SET_OSD_CONFIG, OSD.msp.encodeOther())
                                .then(function () {
                                    updateOsdView();
                                });
                        });
                        var $input = $('<label/>').append(alarmInput);
                        $alarms.append($input);
                    }

                    // display fields on/off and position
                    var $displayFields = $('.display-fields').empty();
                    for (var ii = 0; ii < OSD.data.display_items.length; ii++) {
                        var field = OSD.data.display_items[ii];
                        // versioning related, if the field doesn't exist at the current flight controller version, just skip it
                        if (!field.name) {
                            continue;
                        }

                        var checked = field.isVisible ? 'checked' : '';
                        var $field = $('<div class="display-field field-' + field.index + '"/>');
                        if (FC.getOsdDisabledFields().indexOf(field.name) != -1) {
                            $field.hide();
                        }
                        $field.append(
                            $('<input type="checkbox" name="' + field.name + '" class="togglesmall"></input>')
                                .data('field', field)
                                .attr('checked', field.isVisible)
                                .change(function () {
                                    var field = $(this).data('field');
                                    var $position = $(this).parent().find('.position.' + field.name);
                                    field.isVisible = !field.isVisible;

                                    if (field.isVisible) {
                                        $position.show();
                                    } else {
                                        $position.hide();
                                    }

                                    MSP.promise(MSPCodes.MSP_SET_OSD_CONFIG, OSD.msp.encode(field))
                                        .then(function () {
                                            updateOsdView();
                                        });
                                })
                        );

                        $field.append('<label for="' + field.name + '" class="char-label">' + inflection.titleize(field.name) + '</label>');
                        if (field.positionable && field.isVisible) {
                            $field.append(
                                $('<input type="number" class="' + field.index + ' position"></input>')
                                    .data('field', field)
                                    .val(field.position)
                                    .change($.debounce(250, function (e) {
                                        var field = $(this).data('field');
                                        field.position = parseInt($(this).val());
                                        MSP.promise(MSPCodes.MSP_SET_OSD_CONFIG, OSD.msp.encode(field))
                                            .then(function () {
                                                updateOsdView();
                                            });
                                    }))
                            );
                        }
                        $displayFields.append($field);
                    }
                    GUI.switchery();

                    // buffer the preview
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
                    }

                    // draw all the displayed items and the drag and drop preview images
                    for (var ii = 0; ii < OSD.data.display_items.length; ii++) {
                        var field = OSD.data.display_items[ii];
                        if (!field.preview || !field.isVisible) {
                            continue;
                        }
                        var j = (field.position >= 0) ? field.position : field.position + OSD.data.display_size.total;
                        // create the preview image
                        field.preview_img = new Image();
                        var canvas = document.createElement('canvas');
                        var ctx = canvas.getContext("2d");
                        // fill the screen buffer
                        for (i = 0; i < field.preview.length; i++) {
                            var charCode = field.preview.charCodeAt(i);
                            OSD.data.preview[j++] = [field, charCode];
                            // draw the preview
                            var img = new Image();
                            img.src = FONT.draw(charCode);
                            ctx.drawImage(img, i * 12, 0);
                        }
                        field.preview_img.src = canvas.toDataURL('image/png');
                        // Required for NW.js - Otherwise the <img /> will
                        // consume drag/drop events.
                        field.preview_img.style.pointerEvents = 'none';
                    }
                    var centerishPosition = 225;

                    // artificial horizon
                    if ($('input[name="ARTIFICIAL_HORIZON"]').prop('checked')) {
                        for (i = 0; i < 9; i++) {
                            OSD.data.preview[centerishPosition - 4 + i] = SYM.AH_BAR9_0 + 4;
                        }
                    }

                    // crosshairs
                    if ($('input[name="CROSSHAIRS"]').prop('checked')) {
                        OSD.data.preview[centerishPosition - 1] = SYM.AH_CENTER_LINE;
                        OSD.data.preview[centerishPosition + 1] = SYM.AH_CENTER_LINE_RIGHT;
                        OSD.data.preview[centerishPosition] = SYM.AH_CENTER;
                    }

                    // sidebars
                    if ($('input[name="HORIZON_SIDEBARS"]').prop('checked')) {
                        var hudwidth = OSD.constants.AHISIDEBARWIDTHPOSITION;
                        var hudheight = OSD.constants.AHISIDEBARHEIGHTPOSITION;
                        for (i = -hudheight; i <= hudheight; i++) {
                            OSD.data.preview[centerishPosition - hudwidth + (i * FONT.constants.SIZES.LINE)] = SYM.AH_DECORATION;
                            OSD.data.preview[centerishPosition + hudwidth + (i * FONT.constants.SIZES.LINE)] = SYM.AH_DECORATION;
                        }
                        // AH level indicators
                        OSD.data.preview[centerishPosition - hudwidth + 1] = SYM.AH_LEFT;
                        OSD.data.preview[centerishPosition + hudwidth - 1] = SYM.AH_RIGHT;
                    }

                    // render
                    var $preview = $('.display-layout .preview').empty();
                    var $row = $('<div class="row"/>');
                    for (i = 0; i < OSD.data.display_size.total;) {
                        var charCode = OSD.data.preview[i];
                        if (typeof charCode === 'object') {
                            var field = OSD.data.preview[i][0];
                            charCode = OSD.data.preview[i][1];
                        }
                        var $img = $('<div class="char"><img src=' + FONT.draw(charCode) + '></img></div>')
                            .on('mouseenter', OSD.GUI.preview.onMouseEnter)
                            .on('mouseleave', OSD.GUI.preview.onMouseLeave)
                            .on('dragover', OSD.GUI.preview.onDragOver)
                            .on('dragleave', OSD.GUI.preview.onDragLeave)
                            .on('drop', OSD.GUI.preview.onDrop)
                            .data('field', field)
                            .data('position', i);
                        // Required for NW.js - Otherwise the <img /> will
                        // consume drag/drop events.
                        $img.find('img').css('pointer-events', 'none');
                        if (field && field.positionable) {
                            $img
                                .addClass('field-' + field.index)
                                .data('field', field)
                                .prop('draggable', true)
                                .on('dragstart', OSD.GUI.preview.onDragStart);
                        }

                        $row.append($img);
                        if (++i % OSD.data.display_size.x == 0) {
                            $preview.append($row);
                            $row = $('<div class="row"/>');
                        }
                    }
                });
        }

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
                updateOsdView();
            });
        });

        // load the first font when we change tabs
        $fontPicker.first().click();

        $('button.load_font_file').click(function () {
            $fontPicker.removeClass('active');
            FONT.openFontFile().then(function () {
                FONT.preview($preview);
                updateOsdView();
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

        GUI.content_ready(callback);
    });
};

TABS.osd.cleanup = function (callback) {
    PortHandler.flush_callbacks();

    // unbind "global" events
    $(document).unbind('keypress');
    $(document).off('click', 'span.progressLabel a');

    if (callback) callback();
};
