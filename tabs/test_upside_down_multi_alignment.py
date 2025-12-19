#!/usr/bin/env python3
"""
Test upside-down detection with multiple initial board alignments
Verifies that wizard correctly detects 180° roll REGARDLESS of initial settings
"""

import serial
import struct
import time
import math
import sys

MSP_HEADER = b'$M<'
MSP_RAW_IMU = 102
MSP_BOARD_ALIGNMENT = 38
MSP_SET_BOARD_ALIGNMENT = 39
MSP_EEPROM_WRITE = 250
MSP_REBOOT = 68

# Test with these initial alignments
TEST_ALIGNMENTS = [
    {'pitch': 0, 'roll': 0, 'yaw': 0, 'name': 'No alignment (0,0,0)'},
    {'pitch': 0, 'roll': 0, 'yaw': 90, 'name': 'Yaw 90°'},
    {'pitch': 0, 'roll': 0, 'yaw': 45, 'name': 'Yaw 45°'},
    {'pitch': 0, 'roll': 90, 'yaw': 0, 'name': 'Roll 90° (wrong)'},
]

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

def set_board_alignment(ser, pitch, roll, yaw):
    """Set board alignment (in degrees)"""
    pitch_dd = int(pitch * 10)
    roll_dd = int(roll * 10)
    yaw_dd = int(yaw * 10)

    def to_u16(val):
        return val if val >= 0 else 65536 + val

    data = struct.pack('<HHH', to_u16(roll_dd), to_u16(pitch_dd), to_u16(yaw_dd))
    ser.reset_input_buffer()
    ser.write(build_msp_request(MSP_SET_BOARD_ALIGNMENT, data))
    time.sleep(0.1)
    response = ser.read(64)
    return not (b'$M!' in response)

def save_eeprom(ser):
    """Save settings to EEPROM"""
    ser.reset_input_buffer()
    ser.write(build_msp_request(MSP_EEPROM_WRITE))
    time.sleep(1.0)
    response = ser.read(64)
    return not (b'$M!' in response)

def reboot_fc(ser):
    """Reboot the FC via MSP"""
    ser.reset_input_buffer()
    ser.write(build_msp_request(MSP_REBOOT))
    time.sleep(0.1)
    return True

def build_rotation_matrix(roll_deg, pitch_deg, yaw_deg):
    """Build rotation matrix matching INAV's rotationMatrixFromAngles()"""
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

    R = [
        [cosz * cosy,                      -cosy * sinz,                      siny                    ],
        [sinzcosx + (coszsinx * siny),     coszcosx - (sinzsinx * siny),      -sinx * cosy            ],
        [(sinzsinx) - (coszcosx * siny),   (coszsinx) + (sinzcosx * siny),    cosy * cosx             ]
    ]
    return R

def apply_rotation(R, vec):
    """Apply rotation matrix to a vector"""
    return [
        R[0][0]*vec[0] + R[0][1]*vec[1] + R[0][2]*vec[2],
        R[1][0]*vec[0] + R[1][1]*vec[1] + R[1][2]*vec[2],
        R[2][0]*vec[0] + R[2][1]*vec[1] + R[2][2]*vec[2]
    ]

def test_alignment(ser, alignment_config):
    """Test upside-down detection with given alignment"""

    print(f"\n{'='*70}")
    print(f"Testing: {alignment_config['name']}")
    print(f"{'='*70}")

    # Read accelerometer data
    print("Reading accelerometer...")
    acc_transformed = read_raw_imu(ser)
    if not acc_transformed:
        print("  ERROR: Failed to read IMU")
        return False

    print(f"  Transformed: [{acc_transformed[0]:7.3f}, {acc_transformed[1]:7.3f}, {acc_transformed[2]:7.3f}] g")

    # Get current alignment
    alignment = read_board_alignment(ser)
    if not alignment:
        print("  ERROR: Failed to read alignment")
        return False

    has_alignment = alignment['pitch'] != 0 or alignment['roll'] != 0 or alignment['yaw'] != 0

    # Apply inverse transformation if needed
    if has_alignment:
        print(f"  Applying inverse (current: pitch={alignment['pitch']:.0f}°, roll={alignment['roll']:.0f}°, yaw={alignment['yaw']:.0f}°)")
        R = build_rotation_matrix(alignment['roll'], alignment['pitch'], alignment['yaw'])
        acc_raw = apply_rotation(R, acc_transformed)
    else:
        print(f"  No alignment - data is raw")
        acc_raw = acc_transformed

    print(f"  Raw: [{acc_raw[0]:7.3f}, {acc_raw[1]:7.3f}, {acc_raw[2]:7.3f}] g")

    # Check magnitude
    mag = math.sqrt(acc_raw[0]**2 + acc_raw[1]**2 + acc_raw[2]**2)
    print(f"  Magnitude: {mag:.3f}g", end='')
    if mag < 0.85 or mag > 1.15:
        print(" ⚠️ OUT OF RANGE")
    else:
        print(" ✓")

    # Calculate orientation
    roll = math.atan2(acc_raw[1], acc_raw[2]) * 180 / math.pi
    pitch = math.atan2(-acc_raw[0], math.sqrt(acc_raw[1]**2 + acc_raw[2]**2)) * 180 / math.pi

    # Normalize
    roll = roll % 360
    pitch = pitch % 360

    print(f"  Calculated: pitch={pitch:.1f}°, roll={roll:.1f}°")

    # Check if upside down
    # Roll should be ~180° for upside down
    roll_diff = min(abs(roll - 180), abs(roll - 180 - 360), abs(roll - 180 + 360))

    if roll_diff < 22.5:  # Within 22.5° of 180°
        print(f"  ✓ UPSIDE DOWN DETECTED (roll={roll:.1f}°)")
        return True
    else:
        print(f"  ✗ FAILED - roll={roll:.1f}° (expected ~180°)")
        return False

def main():
    device = '/dev/ttyACM0'
    baudrate = 115200

    print("=" * 70)
    print("UPSIDE-DOWN DETECTION TEST - MULTIPLE ALIGNMENTS")
    print("=" * 70)
    print(f"\nTesting {len(TEST_ALIGNMENTS)} different initial alignments")
    print("Board must be UPSIDE DOWN for all tests")
    print("\nStarting in 3 seconds...")
    time.sleep(3)

    ser = serial.Serial(device, baudrate, timeout=1)
    time.sleep(0.5)

    # Save original alignment
    print("\n[0] Saving original alignment...")
    original = read_board_alignment(ser)
    if not original:
        print("ERROR: Failed to read alignment")
        return 1
    print(f"    Original: pitch={original['pitch']:.0f}°, roll={original['roll']:.0f}°, yaw={original['yaw']:.0f}°")

    results = []

    # Test each alignment
    for i, test_align in enumerate(TEST_ALIGNMENTS):
        print(f"\n[{i+1}/{len(TEST_ALIGNMENTS)}] Setting alignment: pitch={test_align['pitch']}°, roll={test_align['roll']}°, yaw={test_align['yaw']}°")

        if not set_board_alignment(ser, test_align['pitch'], test_align['roll'], test_align['yaw']):
            print("    ERROR: Set alignment failed")
            continue

        if not save_eeprom(ser):
            print("    ERROR: Save failed")
            continue

        print("    Rebooting...")
        reboot_fc(ser)
        ser.close()

        # Wait for reboot
        time.sleep(5)

        ser = serial.Serial(device, baudrate, timeout=1)
        time.sleep(1)

        # Test detection
        passed = test_alignment(ser, test_align)
        results.append({
            'name': test_align['name'],
            'passed': passed
        })

    # Restore original
    print(f"\n[RESTORE] Restoring original alignment...")
    set_board_alignment(ser, original['pitch'], original['roll'], original['yaw'])
    save_eeprom(ser)
    print("    Rebooting...")
    reboot_fc(ser)
    time.sleep(2)

    # Summary
    print("\n" + "=" * 70)
    print("RESULTS SUMMARY")
    print("=" * 70)

    passed_count = sum(1 for r in results if r['passed'])
    total_count = len(results)

    for result in results:
        status = "✓ PASS" if result['passed'] else "✗ FAIL"
        print(f"{status}  {result['name']}")

    print(f"\nPassed: {passed_count}/{total_count}")

    if passed_count == total_count:
        print("\n✓ ALL TESTS PASSED!")
        print("Inverse transformation correctly detects upside-down")
        print("regardless of initial board alignment!")
    else:
        print(f"\n✗ {total_count - passed_count} TEST(S) FAILED")

    print("=" * 70)

    ser.close()
    return 0 if passed_count == total_count else 1

if __name__ == '__main__':
    sys.exit(main())
