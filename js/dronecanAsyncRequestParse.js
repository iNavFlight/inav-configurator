'use strict';

// Parses an MSP2_INAV_DRONECAN_ASYNC_REQUEST response into a fresh object
// every time (never mutates/extends a previous result) -- dronecanAsyncPoll()
// in tabs/dronecan.js reads status/seq immediately to decide whether to keep
// polling and what seq to expect, so carrying over a stale value from an
// earlier, longer response here would cause it to match against the wrong
// request. Accepts anything with a DataView-like getUint8()/byteLength
// interface.
export function parseDronecanAsyncRequestResponse(data) {
    const result = { status: undefined, seq: undefined };
    if (data.byteLength >= 1) {
        result.status = data.getUint8(0);
    }
    if (data.byteLength >= 2) {
        result.seq = data.getUint8(1);
    }
    return result;
}
