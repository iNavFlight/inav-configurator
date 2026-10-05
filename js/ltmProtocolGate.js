'use strict';

// Routes serial bytes to LTM only until a valid MSP frame has been received in
// the current connection. MSP and LTM share the same serial transport, so raw
// MSP payloads must not be allowed to look like LTM after MSP is established.
const createLtmProtocolGate = function ({ ltmDecoder, wasMspReceiving, activateGroundstation }) {
    let mspDetected = false;

    const publicScope = {};

    publicScope.reset = function () {
        mspDetected = false;
        ltmDecoder.reset();
    };

    publicScope.read = function (info) {
        if (mspDetected) {
            return;
        }

        if (wasMspReceiving()) {
            // This transition happens once per connection. Discard any partial
            // LTM candidate that preceded the first valid MSP response.
            mspDetected = true;
            ltmDecoder.reset();
            return;
        }

        ltmDecoder.read(info);
    };

    publicScope.activateGroundstationIfLtmOnly = function () {
        if (!mspDetected && ltmDecoder.isReceiving()) {
            activateGroundstation();
        }
    };

    return publicScope;
};

export default createLtmProtocolGate;
