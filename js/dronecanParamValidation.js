'use strict';

// DroneCAN param.GetSet transmits INT values as a signed int64 and FLOAT
// values as an IEEE-754 float32; both must be checked before encoding
// (js/../tabs/dronecan.js's encodeParamValueBytes() truncates/reinterprets
// without range-checking, so a value that fails these checks would
// otherwise silently wrap or encode a non-finite bit pattern).
const INT64_MIN = -(2n ** 63n);
const INT64_MAX = 2n ** 63n - 1n;

// Also rejects a failed BigInt conversion upstream (convertParamValue()
// returns Number.NaN, not a bigint, when the input can't be parsed as one).
export function isValidIntParamValue(value) {
    return typeof value === 'bigint' && value >= INT64_MIN && value <= INT64_MAX;
}

// Number.parseFloat("Infinity") is a real, valid-looking parse result, not a
// NaN -- Number.isFinite() is required to catch it (and -Infinity).
export function isValidFloatParamValue(value) {
    return typeof value === 'number' && Number.isFinite(value);
}
