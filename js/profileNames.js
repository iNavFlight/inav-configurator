'use strict';

// Decoder for MSP2_INAV_PROFILE_NAMES: the user-defined names of every
// control, battery and mixer profile slot in one reply.
//
//   uint8  maxNameLength          (MAX_PROFILE_NAME_LENGTH in the firmware)
//   uint8  controlProfileCount, then per slot: uint8 length + that many bytes
//   uint8  batteryProfileCount, then per slot as above
//   uint8  mixerProfileCount,   then per slot as above
//
// An unnamed slot has length 0 and decodes to an empty string.

function readNameList(data, cursor) {
    if (cursor.offset >= data.byteLength) {
        return null;
    }

    const count = data.getUint8(cursor.offset++);
    const names = [];

    for (let i = 0; i < count; i++) {
        if (cursor.offset >= data.byteLength) {
            return null;
        }
        const length = data.getUint8(cursor.offset++);
        if (cursor.offset + length > data.byteLength) {
            return null;
        }
        let name = '';
        for (let c = 0; c < length; c++) {
            name += String.fromCodePoint(data.getUint8(cursor.offset++));
        }
        names.push(name);
    }

    return names;
}

/**
 * @param {DataView} data payload of an MSP2_INAV_PROFILE_NAMES reply
 * @returns {{maxLength: number, control: string[], battery: string[], mixer: string[]}|null}
 *          null when the payload is truncated or malformed
 */
export function parseProfileNames(data) {
    if (!data || data.byteLength < 4) {
        return null;
    }

    const cursor = { offset: 0 };
    const maxLength = data.getUint8(cursor.offset++);
    const control = readNameList(data, cursor);
    const battery = readNameList(data, cursor);
    const mixer = readNameList(data, cursor);

    if (control === null || battery === null || mixer === null || cursor.offset !== data.byteLength) {
        return null;
    }

    return { maxLength: maxLength, control: control, battery: battery, mixer: mixer };
}

/**
 * Label for a profile selector entry: the translated base label, plus the
 * user's name when the slot has one.
 */
export function profileOptionLabel(baseLabel, name) {
    return name ? baseLabel + ': ' + name : baseLabel;
}
