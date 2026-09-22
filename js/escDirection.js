// DShot configuration has no direction readback. This is operation status only.
export function parseEscDirection(data) {
    if (!data || data.byteLength === 0 || !((data.getUint8(0) === 1 && [6, 7].includes(data.byteLength)) || (data.getUint8(0) === 2 && data.byteLength === 10))) return null;
    const [count, phase, motor, reverse, token] = [1, 2, 3, 4, 5].map(i => data.getUint8(i));
    if (phase > 6 || reverse > 1 || (phase > 0 && (motor >= count || token === 0))) return null;
    if (data.byteLength >= 7 && data.getUint8(6) > 1) return null;
    const supportsTest = data.getUint8(0) === 2;
    const testMotor = supportsTest ? data.getUint8(7) : 0;
    const testActive = supportsTest && data.getUint8(8) === 1;
    const testToken = supportsTest ? data.getUint8(9) : 0;
    if (supportsTest && (data.getUint8(8) > 1 || (testActive && (testMotor >= count || testToken === 0 || (phase > 0 && phase < 6))))) return null;
    return { count, phase, motor, reverse, token, simulated: data.byteLength >= 7 && data.getUint8(6) === 1,
        supportsTest, testMotor, testActive, testToken };
}

export function canSetEscDirection({ status, acknowledged, armed, testing, busy, fresh, motor }) {
    return Boolean(status && status.count > 0 && (status.phase === 0 || status.phase === 6)
        && !status.testActive && acknowledged && !armed && !testing && !busy && fresh
        && Number.isInteger(motor) && motor >= 0 && motor < status.count);
}

export function escDirectionPayload(status, motor, reverse) {
    if (!status || !Number.isInteger(motor) || motor < 0 || motor >= status.count || (reverse !== 0 && reverse !== 1)) {
        throw new Error('Invalid ESC direction request');
    }
    return [motor, reverse, (status.token % 255) + 1];
}
