'use strict';

const ltmDecoder = (function () {

    let TELEMETRY = {
        //A frame
        pitch: null,
        roll: null,
        heading: null,

        //S frame
        voltage: null,
        currectDrawn: null,
        rssi: null,
        airspeed: null,
        flightmode: null,
        flightmodeName: null,

        armed: null,
        failsafe: null,

        //G frame
        latitude: null,
        longitude: null,
        altitude: null,
        groundSpeed: null,
        gpsFix: null,
        gpsSats: null,
        
        
        //X frame
        hdop: null,
        sensorStatus: null,
        frameCounter: null,
        disarmReason: null,
        disarmReasonName: null

    };

    let publicScope = {},
        privateScope = {};

    const LTM_TIMEOUT_MS = 5000;
    const LTM_FRAME_TIMEOUT_MS = 700;
    const LTM_HEADER_START_1 = '$';
    const LTM_HEADER_START_2 = 'T';
    const LTM_FRAMELENGTH = {
        'G': 18,
        'A': 10,
        'S': 11,
        'O': 18,
        'N': 10,
        'X': 10
    };

    const LTM_FLIGHT_MODE_NAMES = [
        "MANUAL",
        "RATE",
        "ANGLE",
        "HORIZON",
        "ACRO",
        "STABALIZED1",
        "STABALIZED2",
        "STABILIZED3",
        "ALTHOLD",
        "GPSHOLD",
        "WAYPOINTS",
        "HEADHOLD",
        "CIRCLE",
        "RTH",
        "FOLLOWME",
        "LAND",
        "FLYBYWIRE1",
        "FLYBYWIRE2",
        "CRUISE",
        "UNKNOWN",
        "LAUNCH",
        "AUTOTUNE"
    ];

    const LTM_DISARM_REASON_NAMES = [
        "NONE",
        "TIMEOUT",
        "STICKS",
        "SWITCH_3D",
        "SWITCH",
        "KILLSWITCH",
        "FAILSAFE",
        "NAVIGATION",
        "LANDING"
    ];

    const LTM_STATE_IDLE = 0;
    const LTM_STATE_HEADER_START_1 = 1;
    const LTM_STATE_HEADER_START_2 = 2;
    const LTM_STATE_MSGTYPE = 3;

    privateScope.protocolState = LTM_STATE_IDLE;
    privateScope.lastFrameReceivedMs = null;
    privateScope.frameType = null;
    privateScope.frameLength = null;
    privateScope.receiverIndex = 0;
    privateScope.serialBuffer = [];
    privateScope.frameProcessingStartedAtMs = 0;

    privateScope.readByte = function (offset) {
        return privateScope.serialBuffer[offset];
    };
      
    privateScope.readInt = function (offset) {
        return privateScope.serialBuffer[offset] + (privateScope.serialBuffer[offset + 1] << 8);
    }
      
    privateScope.readInt32 = function (offset) {
        return privateScope.serialBuffer[offset] + (privateScope.serialBuffer[offset + 1] << 8) + (privateScope.serialBuffer[offset + 2] << 16) + (privateScope.serialBuffer[offset + 3] << 24);
    }

    privateScope.push = function (data) {
        let charCode = String.fromCharCode(data);
        
        //If frame is processed for too long, reset protocol state
        if (privateScope.protocolState != LTM_STATE_IDLE && new Date().getTime() - privateScope.frameProcessingStartedAtMs > LTM_FRAME_TIMEOUT_MS) {
            privateScope.protocolState = LTM_STATE_IDLE;
            privateScope.frameProcessingStartedAtMs = new Date().getTime();
            console.log('LTM privateScope.protocolState: TIMEOUT, forcing into IDLE, processed frame: ' + privateScope.frameType);
        }

        if (privateScope.protocolState == LTM_STATE_IDLE) {
            if (charCode == LTM_HEADER_START_1) {
                privateScope.protocolState = LTM_STATE_HEADER_START_1;
                privateScope.frameProcessingStartedAtMs = new Date().getTime();
            }
            return;
        } else if (privateScope.protocolState == LTM_STATE_HEADER_START_1) {
            if (charCode == LTM_HEADER_START_2) {
                privateScope.protocolState = LTM_STATE_HEADER_START_2;
            } else {
                privateScope.protocolState = LTM_STATE_IDLE;
            }
            return;
        } else if (privateScope.protocolState == LTM_STATE_HEADER_START_2) {

            //Check if incoming frame type is a known one
            if (LTM_FRAMELENGTH[charCode] == undefined) {
                //Unknown frame type, reset protocol state
                privateScope.protocolState = LTM_STATE_IDLE;
                console.log('Unknown frame type, reset protocol state');
            } else {
                //Known frame type, store it and move to next state
                privateScope.frameType = charCode;
                privateScope.frameLength = LTM_FRAMELENGTH[charCode];
                privateScope.receiverIndex = 0;
                privateScope.serialBuffer = [];
                privateScope.protocolState = LTM_STATE_MSGTYPE;
                console.log('protocolState: LTM_STATE_MSGTYPE', 'will expext frame ' + privateScope.frameType, 'expected length: ' + privateScope.frameLength);
            }
            return;
      
        } else if (privateScope.protocolState == LTM_STATE_MSGTYPE) {
      
            /*
             * Check if last payload byte has been received.
             */
            if (privateScope.receiverIndex == privateScope.frameLength - 4) {
                /*
                * If YES, check checksum and execute data processing
                */

                let checksum = 0;
                for (let i = 0; i < privateScope.serialBuffer.length; i++) {
                    checksum ^= privateScope.serialBuffer[i];
                }

                if (checksum != data) {
                    console.log('LTM checksum error, frame type: ' + privateScope.frameType + ' rejected');
                    privateScope.protocolState = LTM_STATE_IDLE;
                    privateScope.serialBuffer = [];
                    privateScope.receiverIndex = 0;
                    return;
                }

                if (privateScope.frameType == 'A') {
                    TELEMETRY.pitch = privateScope.readInt(0);
                    TELEMETRY.roll = privateScope.readInt(2);
                    TELEMETRY.heading = privateScope.readInt(4);
                }
        
                if (privateScope.frameType == 'S') {
                    TELEMETRY.voltage = privateScope.readInt(0);
                    TELEMETRY.currectDrawn = privateScope.readInt(2);
                    TELEMETRY.rssi = privateScope.readByte(4);
        
                    TELEMETRY.airspeed = privateScope.readByte(5);

                    let fm = privateScope.readByte(6);
                    TELEMETRY.flightmode = fm >> 2;
                    TELEMETRY.flightmodeName = LTM_FLIGHT_MODE_NAMES[TELEMETRY.flightmode];

                    TELEMETRY.armed = (fm & 0x02) >> 1;
                    TELEMETRY.failsafe = fm & 0x01;
                }
        
                if (privateScope.frameType == 'G') {
                    TELEMETRY.latitude = privateScope.readInt32(0);
                    TELEMETRY.longitude = privateScope.readInt32(4);
                    TELEMETRY.groundSpeed = privateScope.readByte(8);
                    TELEMETRY.altitude = privateScope.readInt32(9);
        
                    let raw = privateScope.readByte(13);
                    TELEMETRY.gpsSats = raw >> 2;
                    TELEMETRY.gpsFix = raw & 0x03;
                }
        
                if (privateScope.frameType == 'X') {
                    TELEMETRY.hdop = privateScope.readInt(0);
                    TELEMETRY.sensorStatus = privateScope.readByte(2);
                    TELEMETRY.frameCounter = privateScope.readByte(3);
                    TELEMETRY.disarmReason = privateScope.readByte(4);
                    TELEMETRY.disarmReasonName = LTM_DISARM_REASON_NAMES[TELEMETRY.disarmReason];
                }

                privateScope.protocolState = LTM_STATE_IDLE;
                privateScope.serialBuffer = [];
                privateScope.lastFrameReceivedMs = new Date().getTime();
                privateScope.receiverIndex = 0;
      
            } else {
                /*
                * If no, put data into buffer
                */
                privateScope.serialBuffer.push(data);
                privateScope.receiverIndex++;
            }
        }
    }

    publicScope.read = function (readInfo) {
        var data = new Uint8Array(readInfo.data);

        for (var i = 0; i < data.length; i++) {
            privateScope.push(data[i]);
        }
    };

    publicScope.isReceiving = function () {
        return privateScope.lastFrameReceivedMs !== null && (new Date().getTime() - privateScope.lastFrameReceivedMs) < LTM_TIMEOUT_MS;
    };

    publicScope.wasEverReceiving = function () {
        return privateScope.lastFrameReceivedMs !== null;
    };

    publicScope.get = function () {
        return TELEMETRY;
    };

    return publicScope;
})();

module.exports = ltmDecoder;