#!/usr/bin/env python3
"""
Test inverse transformation with upside-down board
Verifies that wizard correctly detects 180° roll regardless of initial alignment
"""

import serial
import struct
import time
import math

MSP_HEADER = b'$M<'
MSP_RAW_IMU = 102
MSP_BOARD_ALIGNMENT = 38

def calculate_checksum(size, cmd, data=b''):
    checksum = size ^ cmd
    for byte in data:
        checksum ^= byte
    return checksum

def build_msp_request(cmd, data=b''):
    size = len(data)
    checksum = calculate_checksum(size, cmd, data)
    return MSP_HEADER + struct.pack('BB', size, cmd) + data + struct.pack('B', checksum)

def parse_msp_response(data):
    if len(data) < 6:
        return None
    idx = data.find(b'$M>')
    if idx < 0:
        return None
    if len(data) < idx + 6:
        return None
    size = data[idx + 3]
    cmd = data[idx + 4]
    if len(data) < idx + 5 + size + 1:
        return None
    payload = data[idx + 5 : idx + 5 + size]
    return (cmd, payload)

def read_raw_imu(ser):
    """Read accelerometer from MSP_RAW_IMU, average 5 readings"""
    readings = []
    for _ in range(5):
        ser.reset_input_buffer()
        ser.write(build_msp_request(MSP_RAW_IMU))
        time.sleep(0.02)
        response = ser.read(64)
        result = parse_msp_response(response)
        if result and result[0] == MSP_RAW_IMU:
            payload = result[1]
            if len(payload) >= 18:
                values = struct.unpack('<hhhhhhhhh', payload[:18])
                readings.append([values[0] / 512.0, values[1] / 512.0, values[2] / 512.0])
        time.sleep(0.01)

    if not readings:
        return None

    # Average the readings
    avg = [
        sum(r[0] for r in readings) / len(readings),
        sum(r[1] for r in readings) / len(readings),
        sum(r[2] for r in readings) / len(readings)
    ]
    return avg

def read_board_alignment(ser):
    """Read current board alignment settings"""
    ser.reset_input_buffer()
    ser.write(build_msp_request(MSP_BOARD_ALIGNMENT))
    time.sleep(0.05)
    response = ser.read(64)
    result = parse_msp_response(response)
    if result is None or result[0] != MSP_BOARD_ALIGNMENT:
        return None
    payload = result[1]
    if len(payload) < 6:
        return None
    values = struct.unpack('<HHH', payload[:6])
    def from_u16(val):
        return val if val < 32768 else val - 65536
    return {
        'roll': from_u16(values[0]) / 10.0,
        'pitch': from_u16(values[1]) / 10.0,
        'yaw': from_u16(values[2]) / 10.0
    }

def build_rotation_matrix(roll_deg, pitch_deg, yaw_deg):
    """
    Build rotation matrix matching INAV's rotationMatrixFromAngles()
    Source: inav/src/main/common/maths.c
    """
    roll = math.radians(roll_deg)
    pitch = math.radians(pitch_deg)
    yaw = math.radians(yaw_deg)

    cosx = math.cos(roll)
    sinx = math.sin(roll)
    cosy = math.cos(pitch)
    siny = math.sin(pitch)
    cosz = math.cos(yaw)
    sinz = math.sin(yaw)

    coszcosx = cosz * cosx
    sinzcosx = sinz * cosx
    coszsinx = sinx * cosz
    sinzsinx = sinx * sinz

    # INAV's rotation matrix (matches firmware exactly)
    R = [
        [cosz * cosy,                      -cosy * sinz,                      siny                    ],
        [sinzcosx + (coszsinx * siny),     coszcosx - (sinzsinx * siny),      -sinx * cosy            ],
        [(sinzsinx) - (coszcosx * siny),   (coszsinx) + (sinzcosx * siny),    cosy * cosx             ]
    ]
    return R

def apply_rotation(R, vec):
    """
    Apply rotation matrix to a vector (standard matrix multiplication)

    INAV's rotationMatrixRotateVector uses R^T * vec (columns)
    So: transformed = R^T * raw
    To invert: raw = R * transformed (standard multiplication with rows)
    """
    return [
        R[0][0]*vec[0] + R[0][1]*vec[1] + R[0][2]*vec[2],  # Standard: use rows
        R[1][0]*vec[0] + R[1][1]*vec[1] + R[1][2]*vec[2],
        R[2][0]*vec[0] + R[2][1]*vec[1] + R[2][2]*vec[2]
    ]

def main():
    device = '/dev/ttyACM0'
    baudrate = 115200

    print("=" * 70)
    print("UPSIDE-DOWN BOARD TEST")
    print("=" * 70)
    print("\nConnecting to FC...")

    ser = serial.Serial(device, baudrate, timeout=1)
    time.sleep(0.5)
    print("✓ Connected!\n")

    # Read current board alignment
    print("[1] Reading current board alignment...")
    alignment = read_board_alignment(ser)
    if not alignment:
        print("ERROR: Failed to read alignment")
        return 1

    print(f"    Current alignment: pitch={alignment['pitch']:.1f}°, roll={alignment['roll']:.1f}°, yaw={alignment['yaw']:.1f}°")

    has_alignment = alignment['pitch'] != 0 or alignment['roll'] != 0 or alignment['yaw'] != 0

    # Read accelerometer data
    print("\n[2] Reading accelerometer data (MSP_RAW_IMU)...")
    acc_transformed = read_raw_imu(ser)
    if not acc_transformed:
        print("ERROR: Failed to read IMU")
        return 1

    print(f"    Transformed data: [{acc_transformed[0]:7.3f}, {acc_transformed[1]:7.3f}, {acc_transformed[2]:7.3f}] g")

    # Apply inverse transformation if needed
    print("\n[3] Applying inverse transformation...")
    if has_alignment:
        print(f"    Board has alignment - applying inverse")
        R = build_rotation_matrix(alignment['roll'], alignment['pitch'], alignment['yaw'])
        acc_raw = apply_rotation(R, acc_transformed)
        print(f"    Raw data (inverse): [{acc_raw[0]:7.3f}, {acc_raw[1]:7.3f}, {acc_raw[2]:7.3f}] g")
    else:
        print(f"    No alignment - data is already raw")
        acc_raw = acc_transformed
        print(f"    Raw data: [{acc_raw[0]:7.3f}, {acc_raw[1]:7.3f}, {acc_raw[2]:7.3f}] g")

    # Check gravity magnitude
    mag = math.sqrt(acc_raw[0]**2 + acc_raw[1]**2 + acc_raw[2]**2)
    print(f"\n[4] Gravity magnitude: {mag:.3f}g")

    if mag < 0.85 or mag > 1.15:
        print(f"    ⚠️  WARNING: Magnitude out of range (expected 0.85-1.15g)")
        print(f"    Board may have moved or accelerometer needs calibration")
    else:
        print(f"    ✓ Magnitude OK")

    # Calculate pitch and roll from raw data (matches wizard logic)
    print("\n[5] Calculating orientation from raw data...")

    # This matches the wizard's formulas in accAutoAlignReadFlat()
    roll = math.atan2(acc_raw[1], acc_raw[2]) * 180 / math.pi
    pitch = math.atan2(-acc_raw[0], math.sqrt(acc_raw[1]**2 + acc_raw[2]**2)) * 180 / math.pi

    # Normalize to 0-360
    roll = roll % 360
    pitch = pitch % 360

    print(f"    Calculated pitch: {pitch:.1f}°")
    print(f"    Calculated roll:  {roll:.1f}°")

    # Check if upside down (roll should be ~180°)
    print("\n[6] Orientation detection:")

    # Snap to nearest 45°
    roll_snapped = round(roll / 45) * 45
    pitch_snapped = round(pitch / 45) * 45

    print(f"    Snapped pitch: {pitch_snapped}°")
    print(f"    Snapped roll:  {roll_snapped}°")

    if abs(roll - 180) < 22.5 or abs(roll - 180) > 337.5:
        print(f"\n✓ UPSIDE DOWN DETECTED!")
        print(f"  Roll is {roll:.1f}° (expected ~180° for upside down)")
    else:
        print(f"\n✗ NOT UPSIDE DOWN")
        print(f"  Roll is {roll:.1f}° (expected ~180° for upside down)")
        if abs(roll) < 22.5 or abs(roll - 360) < 22.5:
            print(f"  Board appears to be right-side up")
        else:
            print(f"  Board is at unexpected orientation")

    print("\n" + "=" * 70)
    print("TEST COMPLETE")
    print("=" * 70)

    ser.close()

if __name__ == '__main__':
    main()
