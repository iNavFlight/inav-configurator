'use strict';

const MSPCodes = require('./msp/MSPCodes')
const mspQueue = require('./serial_queue');
const eventFrequencyAnalyzer = require('./eventFrequencyAnalyzer');
const timeout = require('./timeouts');

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
    callbacks:                  [],
    packet_error:               0,
    unsupported:                0,

    ledDirectionLetters:        ['n', 'e', 's', 'w', 'u', 'd'],        // in LSB bit order
    ledFunctionLetters:         ['i', 'w', 'f', 'a', 't', 'r', 'c', 'g', 's', 'b', 'l'], // in LSB bit order
    ledBaseFunctionLetters:     ['c', 'f', 'a', 'l', 's', 'g', 'r', 'h'], // in LSB bit
    ledOverlayLetters:          ['t', 'o', 'b', 'n', 'i', 'w', 'e'], // in LSB bit

    last_received_timestamp:   null,
    analog_last_received_timestamp: null,

    lastFrameReceivedMs: 0,

    processData: null,

    init() {
        mspQueue.setPutCallback(this.putCallback);
        mspQueue.setremoveCallback(this.removeCallback);
    },

    setProcessData(cb) {
        this.processData = cb;
    },

    read: function (readInfo) {
        var data = new Uint8Array(readInfo.data);

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
                    // Ignored for now
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
                    this.message_checksum = this._crc8_dvb_s2(this.message_checksum, 0); // flag
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
        if (this.message_checksum == expected_checksum) {
            // message received, process
            this.processData(this);
            this.lastFrameReceivedMs = Date.now();
        } else {
            console.log('code: ' + this.code + ' - crc failed');
            this.packet_error++;
            $('span.packet-error').html(this.packet_error);
        }

        /*
         * Free port
         */
        timeout.add('delayedFreeHardLock', function() {
            mspQueue.freeHardLock();
        }, 10);

        // Reset variables
        this.message_length_received = 0;
        this.state = this.decoder_states.IDLE;
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

        mspQueue.put(message);

        return true;
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

        this.callbacks_cleanup();
    },
    isReceiving: function () {
        return Date.now() - this.lastFrameReceivedMs < 5000;
    },
    wasEverReceiving: function () {
        return this.lastFrameReceivedMs > 0;
    }
};

module.exports = MSP;
