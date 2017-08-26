'use strict';

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

/**
 * @typedef {{state: number, message_direction: number, code: number, message_length_expected: number, message_length_received: number, message_buffer: null, message_buffer_uint8_view: null, message_checksum: number, callbacks: Array, packet_error: number, unsupported: number, ledDirectionLetters: [*], ledFunctionLetters: [*], ledBaseFunctionLetters: [*], ledOverlayLetters: [*], last_received_timestamp: null, analog_last_received_timestamp: number, read: MSP.read, send_message: MSP.send_message, promise: MSP.promise, callbacks_cleanup: MSP.callbacks_cleanup, disconnect_cleanup: MSP.disconnect_cleanup}} MSP
 */
var MSP = {
    symbols: {
        BEGIN: '$'.charCodeAt(0),
        PROTO_V1: 'M'.charCodeAt(0),
        PROTO_V2: 'X'.charCodeAt(0),
        FROM_MWC: '>'.charCodeAt(0),
        TO_MWC: '<'.charCodeAt(0),
        UNSUPPORTED: '!'.charCodeAt(0),
    },
    constants:                  {
        JUMBO_FRAME_MIN_SIZE:       255,
    },
    decoder_states:             {
        IDLE:                       0,
        PROTO_IDENTIFIER:           1,
        DIRECTION_V1:               2,
        DIRECTION_V2:               3,
        PAYLOAD_LENGTH_V1:          4,
        PAYLOAD_LENGTH_JUMBO_LOW:   5,
        PAYLOAD_LENGTH_JUMBO_HIGH:  6,
        PAYLOAD_LENGTH_V2_LOW:      7,
        PAYLOAD_LENGTH_V2_HIGH:     8,
        CODE_V1:                    9,
        CODE_JUMBO_V1:              10,
        CODE_V2_LOW:                11,
        CODE_V2_HIGH:               12,
        PAYLOAD_V1:                 13,
        PAYLOAD_V2:                 14,
        CHECKSUM_V1:                15,
        CHECKSUM_V2:                16,
    },
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
    ledBaseFunctionLetters:     ['c', 'f', 'a', 'l', 's', 'g', 'r'], // in LSB bit
    ledOverlayLetters:          ['t', 'o', 'b', 'n', 'i', 'w'], // in LSB bit

    last_received_timestamp:   null,
    analog_last_received_timestamp: null,

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
                            // eventually, MSPv2
                        default:
                            this.state = this.decoder_states.IDLE;
                    }
                    break;
                case this.decoder_states.DIRECTION_V1: // direction (should be >)
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
                    this.state = this.decoder_states.PAYLOAD_LENGTH_V1;
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
                    this.message_buffer_uint8_view[this.message_length_received] = data[i];
                    this.message_length_received++;

                    if (this.message_length_received >= this.message_length_expected) {
                        this.state = this.decoder_states.CHECKSUM_V1;
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
                    if (this.message_checksum == data[i]) {
                        // message received, process
                        mspHelper.processData(this);
                    } else {
                        console.log('code: ' + this.code + ' - crc failed');

                        this.packet_error++;
                        $('span.packet-error').html(this.packet_error);
                    }

                    /*
                     * Free port
                     */
                    helper.mspQueue.freeHardLock();

                    // Reset variables
                    this.message_length_received = 0;
                    this.state = this.decoder_states.IDLE;
                    break;

                default:
                    /*
                     * Free port
                     */
                    helper.mspQueue.freeHardLock();
                    console.log('Unknown state detected: ' + this.state);
            }
        }
        this.last_received_timestamp = Date.now();
    },

    _initialize_read_buffer: function() {
        this.message_buffer = new ArrayBuffer(this.message_length_expected);
        this.message_buffer_uint8_view = new Uint8Array(this.message_buffer);
    },

    /**
     *
     * @param {MSP} mspData
     */
    putCallback: function (mspData) {
        MSP.callbacks.push(mspData);
    },

    /**
     * @param {number} code
     */
    removeCallback: function (code) {

        for (var i in this.callbacks) {
            if (this.callbacks.hasOwnProperty(i) && this.callbacks[i].code == code) {
                clearTimeout(this.callbacks[i].timer);
                this.callbacks.splice(i, 1);
            }
        }
    },

    send_message: function (code, data, callback_sent, callback_msp) {
        var bufferOut,
            bufView,
            i;

        // always reserve 6 bytes for protocol overhead !
        if (data) {
            var size = data.length + 6,
                checksum;

            bufferOut = new ArrayBuffer(size);
            bufView = new Uint8Array(bufferOut);

            bufView[0] = 36; // $
            bufView[1] = 77; // M
            bufView[2] = 60; // <
            bufView[3] = data.length;
            bufView[4] = code;

            checksum = bufView[3] ^ bufView[4];

            for (i = 0; i < data.length; i++) {
                bufView[i + 5] = data[i];

                checksum ^= bufView[i + 5];
            }

            bufView[5 + data.length] = checksum;
        } else {
            bufferOut = new ArrayBuffer(6);
            bufView = new Uint8Array(bufferOut);

            bufView[0] = 36; // $
            bufView[1] = 77; // M
            bufView[2] = 60; // <
            bufView[3] = 0; // data length
            bufView[4] = code; // code
            bufView[5] = bufView[3] ^ bufView[4]; // checksum
        }

        var message = new MspMessageClass();
        message.code = code;
        message.messageBody = bufferOut;
        message.onFinish = callback_msp;
        message.onSend = callback_sent;

        /*
         * In case of MSP_REBOOT special procedure is required
         */
        if (code == MSPCodes.MSP_SET_REBOOT || code == MSPCodes.MSP_EEPROM_WRITE) {
            message.retryCounter = 10;
        }

        helper.mspQueue.put(message);

        return true;
    },
    promise: function(code, data) {
        var self = this;
        return new Promise(function(resolve) {
            self.send_message(code, data, false, function(data) {
                resolve(data);
            });
        });
    },
    callbacks_cleanup: function () {
        for (var i = 0; i < this.callbacks.length; i++) {
            clearInterval(this.callbacks[i].timer);
        }

        this.callbacks = [];
    },
    disconnect_cleanup: function () {
        this.state = 0; // reset packet state for "clean" initial entry (this is only required if user hot-disconnects)
        this.packet_error = 0; // reset CRC packet error counter for next session

        this.callbacks_cleanup();
    }
};

MSP.SDCARD_STATE_NOT_PRESENT = 0;
MSP.SDCARD_STATE_FATAL       = 1;
MSP.SDCARD_STATE_CARD_INIT   = 2;
MSP.SDCARD_STATE_FS_INIT     = 3;
MSP.SDCARD_STATE_READY       = 4;
