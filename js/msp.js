'use strict';

import MSPCodes from './msp/MSPCodes';
import mspQueue from './serial_queue';
import eventFrequencyAnalyzer from './eventFrequencyAnalyzer';
import timeout from './timeouts';
import CONFIGURATOR from './data_storage';

// Every MSP code that changes something on the FC, recognised by name so a write
// added later is covered without maintaining a list here.
const WRITE_CODE_NAMES = Object.keys(MSPCodes)
    .filter(name => /(^|_)SET(_|$)|WRITE|SAVE|ERASE|RESET_|SELECT_/.test(name));

// Writes carrying nothing read off the FC, so an unreadable response cannot poison
// them. Refusing the live ones would be a hazard of its own.
const ALWAYS_ALLOWED_WRITE_NAMES = [
    'MSP_SET_REBOOT',            // stores nothing; the user's way out of a bad session
    'MSP_SET_MOTOR',             // stopMotors() stops a running motor test with this
    'MSP_SET_RAW_RC', 'MSP_SET_RAW_GPS', 'MSP_SET_HEAD', 'MSP_SET_RTC',
    'MSP_EEPROM_WRITE',          // persists what is already on the FC
    'MSP_RESET_CONF', 'MSP_SET_RESET_CURR_PID',
    'MSP_SELECT_SETTING', 'MSP2_INAV_SELECT_BATTERY_PROFILE', 'MSP2_INAV_SELECT_MIXER_PROFILE',
    'MSP_WP_MISSION_SAVE', 'MSP_DATAFLASH_ERASE', 'MSP_OSD_CHAR_WRITE',
    'MSP_SET_BOX',               // legacy, never sent by this Configurator
];

// Writes that do not pair with their read by name alone.
const IRREGULAR_WRITE_SOURCES = {
    MSP_SET_MODE_RANGE:            'MSP_MODE_RANGES',
    MSP_SET_ADJUSTMENT_RANGE:      'MSP_ADJUSTMENT_RANGES',
    MSP2_INAV_OSD_SET_LAYOUT_ITEM: 'MSP2_INAV_OSD_LAYOUTS',
    MSP2_INAV_SET_GEOZONE_VERTICE: 'MSP2_INAV_GEOZONE_VERTEX',
};

const WRITE_CODES = new Set(WRITE_CODE_NAMES.map(name => MSPCodes[name]));
const ALWAYS_ALLOWED_WRITE_CODES = new Set(ALWAYS_ALLOWED_WRITE_NAMES.map(name => MSPCodes[name]));

// write -> the read whose parsed state it hands back, so an unreadable response
// disables only the saves carrying its values instead of every save.
const WRITE_SOURCE_CODES = new Map();
for (const name of WRITE_CODE_NAMES) {
    if (ALWAYS_ALLOWED_WRITE_CODES.has(MSPCodes[name])) {
        continue;
    }
    // MSP2_INAV_EZ_TUNE_SET names its write the other way round.
    const sourceName = IRREGULAR_WRITE_SOURCES[name]
        || (name.endsWith('_SET') ? name.slice(0, -4) : name.replace('SET_', ''));
    if (MSPCodes[sourceName] !== undefined && sourceName !== name) {
        WRITE_SOURCE_CODES.set(MSPCodes[name], MSPCodes[sourceName]);
    }
}

const CODE_NAMES = new Map(Object.keys(MSPCodes).map(name => [MSPCodes[name], name]));

/**
 *
 * @constructor
 */
var MspMessageClass = function () {

    var publicScope = {};

    publicScope.code = null;
    publicScope.messageBody = null;
    publicScope.onFinish = null;
    publicScope.onSend = null;
    publicScope.timer = false;
    publicScope.createdOn = new Date().getTime();
    publicScope.sentOn = null;
    publicScope.retryCounter = 5;

    return publicScope;
};

var MSP = {
    SDCARD_STATE_NOT_PRESENT:   0,
    SDCARD_STATE_FATAL:         1,
    SDCARD_STATE_CARD_INIT:     2,
    SDCARD_STATE_FS_INIT:       3,
    SDCARD_STATE_READY:         4,
        
    symbols: {
        BEGIN: '$'.charCodeAt(0),
        PROTO_V1: 'M'.charCodeAt(0),
        PROTO_V2: 'X'.charCodeAt(0),
        FROM_MWC: '>'.charCodeAt(0),
        TO_MWC: '<'.charCodeAt(0),
        UNSUPPORTED: '!'.charCodeAt(0),
    },
    constants:                  {
        PROTOCOL_V1:                1,
        PROTOCOL_V2:                2,
        JUMBO_FRAME_MIN_SIZE:       255,
    },
    decoder_states:             {
        IDLE:                       0,
        PROTO_IDENTIFIER:           1,
        DIRECTION_V1:               2,
        DIRECTION_V2:               3,
        FLAG_V2:                    4,
        PAYLOAD_LENGTH_V1:          5,
        PAYLOAD_LENGTH_JUMBO_LOW:   6,
        PAYLOAD_LENGTH_JUMBO_HIGH:  7,
        PAYLOAD_LENGTH_V2_LOW:      8,
        PAYLOAD_LENGTH_V2_HIGH:     9,
        CODE_V1:                    10,
        CODE_JUMBO_V1:              11,
        CODE_V2_LOW:                12,
        CODE_V2_HIGH:               13,
        PAYLOAD_V1:                 14,
        PAYLOAD_V2:                 15,
        CHECKSUM_V1:                16,
        CHECKSUM_V2:                17,
    },
    protocolVersion:            2, // this.constants.PROTOCOL_V2
    state:                      0, // this.decoder_states.IDLE
    message_direction:          1,
    code:                       0,
    message_length_expected:    0,
    message_length_received:    0,
    message_buffer:             null,
    message_buffer_uint8_view:  null,
    message_checksum:           0,
    message_flag:               0,
    callbacks:                  [],
    packet_error:               0,
    unsupported:                0,

    ledDirectionLetters:        ['n', 'e', 's', 'w', 'u', 'd'],        // in LSB bit order
    ledFunctionLetters:         ['i', 'w', 'f', 'a', 't', 'r', 'c', 'g', 's', 'b', 'l'], // in LSB bit order
    ledBaseFunctionLetters:     ['c', 'f', 'a', 'l', 's', 'g', 'r', 'h'], // in LSB bit
    ledOverlayLetters:          ['t', 'o', 'b', 'n', 'i', 'w', 'e', 'v'], // in LSB bit

    last_received_timestamp:   null,
    analog_last_received_timestamp: null,

    lastFrameReceivedMs: 0,

    processData: null,

    // Reads whose response failed to parse this session. The FC state they fill is
    // then part fresh and part stale, so the writes handing it back are refused.
    parseFailures: new Set(),

    // Set by MSPHelper; injected because gui.js already imports this module.
    onConfigWriteBlocked: null,

    getCodeName(code) {
        return CODE_NAMES.get(code) || ('0x' + code.toString(16));
    },

    // Which unreadable response makes this write unsafe, or false if it is safe.
    blockedWriteSource(code) {
        if (this.parseFailures.size === 0 || ALWAYS_ALLOWED_WRITE_CODES.has(code)) {
            return false;
        }

        const source = WRITE_SOURCE_CODES.get(code);
        if (source !== undefined) {
            return this.parseFailures.has(source) ? source : false;
        }

        // Unpaired write: refuse rather than guess. Over-blocking costs a refused save,
        // under-blocking puts wrong values into the aircraft.
        return WRITE_CODES.has(code) ? this.parseFailures.values().next().value : false;
    },

    // Reports and refuses a write built from an unreadable response.
    refuseBlockedWrite(code) {
        const blockedBy = this.blockedWriteSource(code);
        if (blockedBy === false) {
            return false;
        }

        console.error('Refusing MSP write ' + this.getCodeName(code) + ': its source ' +
            this.getCodeName(blockedBy) + ' could not be parsed this session');

        // A silent refusal would be worse - the user would believe it was saved.
        if (this.onConfigWriteBlocked) {
            this.onConfigWriteBlocked(code, blockedBy);
        }

        return true;
    },

    init() {
        mspQueue.setPutCallback(this.putCallback);
        mspQueue.setremoveCallback(this.removeCallback);
    },

    setProcessData(cb) {
        this.processData = cb;
    },

    read: function (readInfo) {
        var data;
        try {
            data = new Uint8Array(readInfo.data);
        } catch (e) {
            console.error('MSP read: Failed to create Uint8Array from readInfo.data:', e, 'readInfo:', readInfo);
            return;
        }

        for (var i = 0; i < data.length; i++) {
            switch (this.state) {
                case this.decoder_states.IDLE: // sync char 1
                    if (data[i] == this.symbols.BEGIN) {
                        this.state = this.decoder_states.PROTO_IDENTIFIER;
                    }
                    break;
                case this.decoder_states.PROTO_IDENTIFIER: // sync char 2
                    switch (data[i]) {
                        case this.symbols.PROTO_V1:
                            this.state = this.decoder_states.DIRECTION_V1;
                            break;
                        case this.symbols.PROTO_V2:
                            this.state = this.decoder_states.DIRECTION_V2;
                            break;
                        default:
                            console.log("Unknown protocol char " + String.fromCharCode(data[i]));
                            this.state = this.decoder_states.IDLE;
                    }
                    break;
                case this.decoder_states.DIRECTION_V1: // direction (should be >)
                case this.decoder_states.DIRECTION_V2:
                    this.unsupported = 0;
                    switch (data[i]) {
                        case this.symbols.FROM_MWC:
                            this.message_direction = 1;
                            break;
                        case this.symbols.TO_MWC:
                            this.message_direction = 0;
                            break;
                        case this.symbols.UNSUPPORTED:
                            this.unsupported = 1;
                            break;
                    }
                    this.state = this.state == this.decoder_states.DIRECTION_V1 ?
                         this.decoder_states.PAYLOAD_LENGTH_V1 :
                         this.decoder_states.FLAG_V2;
                    break;
                case this.decoder_states.FLAG_V2:
                    // Store flag for CRC computation
                    this.message_flag = data[i];
                    this.state = this.decoder_states.CODE_V2_LOW;
                    break;
                case this.decoder_states.PAYLOAD_LENGTH_V1:
                    this.message_length_expected = data[i];

                    if (this.message_length_expected == this.constants.JUMBO_FRAME_MIN_SIZE) {
                        this.state = this.decoder_states.CODE_JUMBO_V1;
                    } else {
                        this._initialize_read_buffer();
                        this.state = this.decoder_states.CODE_V1;
                    }

                    break;
                case this.decoder_states.PAYLOAD_LENGTH_V2_LOW:
                    this.message_length_expected = data[i];
                    this.state = this.decoder_states.PAYLOAD_LENGTH_V2_HIGH;
                    break;
                case this.decoder_states.PAYLOAD_LENGTH_V2_HIGH:
                    this.message_length_expected |= data[i] << 8;
                    this._initialize_read_buffer();
                    this.state = this.message_length_expected > 0 ?
                        this.decoder_states.PAYLOAD_V2 :
                        this.state = this.decoder_states.CHECKSUM_V2;
                    break;
                case this.decoder_states.CODE_V1:
                case this.decoder_states.CODE_JUMBO_V1:
                    this.code = data[i];
                    if (this.message_length_expected > 0) {
                        // process payload
                        if (this.state == this.decoder_states.CODE_JUMBO_V1) {
                            this.state = this.decoder_states.PAYLOAD_LENGTH_JUMBO_LOW;
                        } else {
                            this.state = this.decoder_states.PAYLOAD_V1;
                        }
                    } else {
                        // no payload
                        this.state = this.decoder_states.CHECKSUM_V1;
                    }
                    break;
                case this.decoder_states.CODE_V2_LOW:
                    this.code = data[i];
                    this.state = this.decoder_states.CODE_V2_HIGH;
                    break;
                case this.decoder_states.CODE_V2_HIGH:
                    this.code |= data[i] << 8;
                    this.state = this.decoder_states.PAYLOAD_LENGTH_V2_LOW;
                    break;
                case this.decoder_states.PAYLOAD_LENGTH_JUMBO_LOW:
                    this.message_length_expected = data[i];
                    this.state = this.decoder_states.PAYLOAD_LENGTH_JUMBO_HIGH;
                    break;
                case this.decoder_states.PAYLOAD_LENGTH_JUMBO_HIGH:
                    this.message_length_expected |= data[i] << 8;
                    this._initialize_read_buffer();
                    this.state = this.decoder_states.PAYLOAD_V1;
                    break;
                case this.decoder_states.PAYLOAD_V1:
                case this.decoder_states.PAYLOAD_V2:
                    this.message_buffer_uint8_view[this.message_length_received] = data[i];
                    this.message_length_received++;

                    if (this.message_length_received >= this.message_length_expected) {
                        this.state = this.state == this.decoder_states.PAYLOAD_V1 ?
                            this.decoder_states.CHECKSUM_V1 :
                            this.decoder_states.CHECKSUM_V2;
                    }
                    break;
                case this.decoder_states.CHECKSUM_V1:
                    if (this.message_length_expected >= this.constants.JUMBO_FRAME_MIN_SIZE) {
                        this.message_checksum = this.constants.JUMBO_FRAME_MIN_SIZE;
                    } else {
                        this.message_checksum = this.message_length_expected;
                    }
                    this.message_checksum ^= this.code;
                    if (this.message_length_expected >= this.constants.JUMBO_FRAME_MIN_SIZE) {
                        this.message_checksum ^= this.message_length_expected & 0xFF;
                        this.message_checksum ^= (this.message_length_expected & 0xFF00) >> 8;
                    }
                    for (var ii = 0; ii < this.message_length_received; ii++) {
                        this.message_checksum ^= this.message_buffer_uint8_view[ii];
                    }
                    this._dispatch_message(data[i]);
                    break;
                case this.decoder_states.CHECKSUM_V2:
                    this.message_checksum = 0;
                    this.message_checksum = this._crc8_dvb_s2(this.message_checksum, this.message_flag); // flag
                    this.message_checksum = this._crc8_dvb_s2(this.message_checksum, this.code & 0xFF);
                    this.message_checksum = this._crc8_dvb_s2(this.message_checksum, (this.code & 0xFF00) >> 8);
                    this.message_checksum = this._crc8_dvb_s2(this.message_checksum, this.message_length_expected & 0xFF);
                    this.message_checksum = this._crc8_dvb_s2(this.message_checksum, (this.message_length_expected & 0xFF00) >> 8);
                    for (var ii = 0; ii < this.message_length_received; ii++) {
                        this.message_checksum = this._crc8_dvb_s2(this.message_checksum, this.message_buffer_uint8_view[ii]);
                    }
                    this._dispatch_message(data[i]);
                    break;
                default:
                    /*
                     * Free port
                     */
                    mspQueue.freeHardLock();
                    console.log('Unknown state detected: ' + this.state);
            }
        }
        this.last_received_timestamp = Date.now();
    },

    _initialize_read_buffer() {
        this.message_buffer = new ArrayBuffer(this.message_length_expected);
        this.message_buffer_uint8_view = new Uint8Array(this.message_buffer);
    },

    _dispatch_message(expected_checksum) {
        // Use try-finally to ensure state is ALWAYS reset, even if processData throws
        try {
            if (this.message_checksum == expected_checksum) {
                // message received, process
                this.processData(this);
                this.lastFrameReceivedMs = Date.now();
            } else {
                console.log('code: ' + this.code + ' - crc failed');
                this.packet_error++;
                $('span.packet-error').html(this.packet_error);
            }
        } finally {
            /*
             * Free port - processData is pluggable, so this cannot depend on it returning.
             */
            timeout.add('delayedFreeHardLock', function() {
                mspQueue.freeHardLock();
            }, 10);

            // Reset variables - MUST happen even if an exception occurred
            this.message_length_received = 0;
            this.state = this.decoder_states.IDLE;
        }
    },

    /**
     *
     * @param {MSP} mspData
     */
    putCallback(mspData) {
        MSP.callbacks.push(mspData);
    },

    /**
     * @param {number} code
     */
    removeCallback(code) {

        for (var i in this.callbacks) {
            if (MSP.callbacks.hasOwnProperty(i) && this.callbacks[i].code == code) {
                clearTimeout(this.callbacks[i].timer);
                MSP.callbacks.splice(i, 1);
            }
        }
    },

    send_message(code, data, callback_sent, callback_msp, protocolVersion) {
        // No callback on a refusal: save chains ignore its argument, so calling it
        // would run the EEPROM write and reboot as if the settings had been stored.
        if (this.refuseBlockedWrite(code)) {
            return false;
        }

        var payloadLength = data && data.length ? data.length : 0;
        var length;
        var buffer;
        var view;
        var checksum;
        var ii;

        eventFrequencyAnalyzer.put('MPS ' + code);

        if (!protocolVersion) {
            protocolVersion = this.protocolVersion;
        }

        switch (protocolVersion) {
            case this.constants.PROTOCOL_V1:
                // TODO: Error if code is < 255 and MSPv1 is requested
                length = payloadLength + 6;
                buffer = new ArrayBuffer(length);
                view = new Uint8Array(buffer);
                view[0] = this.symbols.BEGIN;
                view[1] = this.symbols.PROTO_V1;
                view[2] = this.symbols.TO_MWC;
                view[3] = payloadLength;
                view[4] = code;

                checksum = view[3] ^ view[4];
                for (let ii = 0; ii < payloadLength; ii++) {
                    view[ii + 5] = data[ii];
                    checksum ^= data[ii];
                }
                view[length-1] = checksum;
                break;
            case this.constants.PROTOCOL_V2:
                length = payloadLength + 9;
                buffer = new ArrayBuffer(length);
                view = new Uint8Array(buffer);
                view[0] = this.symbols.BEGIN;
                view[1] = this.symbols.PROTO_V2;
                view[2] = this.symbols.TO_MWC;
                view[3] = 0; // flag: reserved, set to 0
                view[4] = code & 0xFF;  // code lower byte
                view[5] = (code & 0xFF00) >> 8; // code upper byte
                view[6] = payloadLength & 0xFF; // payloadLength lower byte
                view[7] = (payloadLength & 0xFF00) >> 8; // payloadLength upper byte
                for (let ii = 0; ii < payloadLength; ii++) {
                    view[8+ii] = data[ii];
                }
                checksum = 0;
                for (let ii = 3; ii < length-1; ii++) {
                    checksum = this._crc8_dvb_s2(checksum, view[ii]);
                }
                view[length-1] = checksum;
                break;
            default:
                throw "Invalid MSP protocol version " + protocolVersion;

        }

        var message = new MspMessageClass();
        message.code = code;
        message.messageBody = buffer;
        message.onFinish = callback_msp;
        message.onSend = callback_sent;

        /*
         * In case of MSP_REBOOT special procedure is required
         */
        if (code == MSPCodes.MSP_SET_REBOOT || code == MSPCodes.MSP_EEPROM_WRITE) {
            message.retryCounter = 10;
        }

        this._enqueue(message);

        return true;
    },
    /*
     * Hand a message to the queue. put() can reject it (queue locked, or a
     * request with the same MSP code already pending - the dedup key is the bare
     * code, which collides for the per-setting MSP2_COMMON_SETTING reads). A
     * rejected message would never fire its callback and hang any promise
     * awaiting it, so retry briefly before giving up.
     */
    _enqueue(message) {
        // CONFIGURATOR.cliActive can flip true between retries (each one is a
        // separate setTimeout, well after the original send_message() call).
        // Check it before every attempt, including the first: a successful
        // mspQueue.put() here would land the message in the FC's raw CLI
        // stream instead of being MSP-parsed, regardless of which attempt
        // this is. Give up rather than retry once that's happened - same as
        // exhausting putRetries.
        if (!CONFIGURATOR.cliActive && mspQueue.put(message)) {
            return;
        }
        if (message.putRetries === undefined) {
            message.putRetries = 25;
        }
        if (message.putRetries > 0 && !CONFIGURATOR.cliActive) {
            message.putRetries--;
            setTimeout(() => this._enqueue(message), 150);
        } else if (message.onFinish) {
            // Give up rather than hang forever; let the caller's chain proceed.
            message.onFinish(false);
        }
    },
     _crc8_dvb_s2(crc, ch) {
        crc ^= ch;
        for (var ii = 0; ii < 8; ++ii) {
            if (crc & 0x80) {
                crc = ((crc << 1) & 0xFF) ^ 0xD5;
            } else {
                crc = (crc << 1) & 0xFF;
            }
        }
        return crc;
    },
    promise(code, data, protocolVersion) {
        var self = this;
        return new Promise(function(resolve) {
            self.send_message(code, data, false, function(data) {
                resolve(data);
            }, protocolVersion);
        });
    },
    callbacks_cleanup() {
        for (var i = 0; i < this.callbacks.length; i++) {
            clearInterval(this.callbacks[i].timer);
        }

        this.callbacks = [];
    },
    disconnect_cleanup() {
        this.state = 0; // reset packet state for "clean" initial entry (this is only required if user hot-disconnects)
        this.packet_error = 0; // reset CRC packet error counter for next session
        this.last_received_timestamp = null;
        this.analog_last_received_timestamp = null;
        this.lastFrameReceivedMs = 0;
        this.parseFailures.clear(); // the next session re-reads everything from scratch

        this.callbacks_cleanup();
    },
    isReceiving: function () {
        return Date.now() - this.lastFrameReceivedMs < 5000;
    },
    wasEverReceiving: function () {
        return this.lastFrameReceivedMs > 0;
    }
};

export default MSP;
