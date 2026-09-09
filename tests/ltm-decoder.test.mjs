import assert from 'node:assert/strict';
import test from 'node:test';

import ltmDecoder from '../js/ltmDecoder.js';
import createLtmProtocolGate from '../js/ltmProtocolGate.js';

test('LTM decoder accepts a valid frame and reset clears its connection state', () => {
    ltmDecoder.reset();

    // $TS followed by seven payload bytes and their XOR checksum.
    const frame = Uint8Array.from([0x24, 0x54, 0x53, 1, 2, 3, 4, 5, 6, 7, 0]);
    ltmDecoder.read({ data: frame.buffer });

    assert.equal(ltmDecoder.isReceiving(), true);
    assert.equal(ltmDecoder.get().voltage, 513);

    ltmDecoder.reset();

    assert.equal(ltmDecoder.isReceiving(), false);
    assert.equal(ltmDecoder.wasEverReceiving(), false);
    assert.equal(ltmDecoder.get().voltage, null);
});

test('a valid MSP frame blocks LTM-shaped bytes from activating Ground Station', () => {
    // $M>, zero payload bytes, command 1, checksum 1.
    const validMspFrame = Uint8Array.from([0x24, 0x4d, 0x3e, 0, 1, 1]);
    // $TS followed by seven payload bytes and their valid XOR checksum.
    const ltmShapedPayload = Uint8Array.from([0x24, 0x54, 0x53, 1, 2, 3, 4, 5, 6, 7, 0]);
    let mspReceived = false;
    let ltmReads = 0;
    let ltmResets = 0;
    let groundstationActivations = 0;

    const decoder = {
        read: function (info) {
            ltmReads++;
            ltmDecoder.read(info);
        },
        reset: function () {
            ltmResets++;
            ltmDecoder.reset();
        },
        isReceiving: function () {
            return ltmDecoder.isReceiving();
        }
    };

    const ltmProtocolGate = createLtmProtocolGate({
        ltmDecoder: decoder,
        wasMspReceiving: function () {
            return mspReceived;
        },
        activateGroundstation: function () {
            groundstationActivations++;
        }
    });

    const receive = function (frame) {
        // read_serial is registered before read_ltm, so a checksum-valid MSP
        // frame has set MSP.wasEverReceiving() before the LTM route runs.
        if (frame[0] === 0x24 && frame[1] === 0x4d && frame[2] === 0x3e) {
            const payloadLength = frame[3];
            let checksum = 0;

            for (let index = 3; index < frame.length - 1; index++) {
                checksum ^= frame[index];
            }

            mspReceived = frame.length === payloadLength + 6 && checksum === frame[frame.length - 1];
        }

        ltmProtocolGate.read({ data: frame.buffer });
        ltmProtocolGate.activateGroundstationIfLtmOnly();
    };

    ltmProtocolGate.reset();
    receive(validMspFrame);
    receive(ltmShapedPayload);
    receive(ltmShapedPayload);

    assert.equal(ltmReads, 0);
    assert.equal(ltmResets, 2, 'the initial reset and the MSP transition reset exactly once each');
    assert.equal(groundstationActivations, 0);
});
