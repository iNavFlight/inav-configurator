/**
 * Integration tests using real SITL (Software In The Loop)
 *
 * These tests connect to a real INAV firmware running in SITL mode,
 * providing accurate MSP protocol testing without hardware.
 *
 * Prerequisites:
 * - SITL binary built at ../inav/build/bin/SITL.elf (relative to configurator root)
 * - Build with: cd ../inav && mkdir -p build && cd build && cmake -DSITL=ON .. && make SITL.elf
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import net from 'node:net';
import fs from 'node:fs';
import sitlHelper, { SITL_PORT, SITL_BINARY } from '../helpers/sitl.js';

// Check if SITL binary exists
const SITL_AVAILABLE = fs.existsSync(SITL_BINARY);

describe.skipIf(!SITL_AVAILABLE)('SITL Integration', () => {
    beforeAll(async () => {
        await sitlHelper.start();
        // Wait a bit more for SITL to fully initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
    }, 15000); // 15 second timeout for startup

    afterAll(async () => {
        await sitlHelper.stop();
    });

    describe('Connection', () => {
        it('SITL is running and accepting connections', async () => {
            const isReady = await sitlHelper.isReady();
            expect(isReady).toBe(true);
        });

        it('can establish TCP connection to SITL port', async () => {
            const { host, port } = sitlHelper.getConnectionInfo();

            const connected = await new Promise((resolve) => {
                const socket = new net.Socket();
                socket.setTimeout(2000);

                socket.on('connect', () => {
                    socket.destroy();
                    resolve(true);
                });

                socket.on('error', () => resolve(false));
                socket.on('timeout', () => {
                    socket.destroy();
                    resolve(false);
                });

                socket.connect(port, host);
            });

            expect(connected).toBe(true);
        });
    });

    describe('MSP Protocol', () => {
        it('receives response to MSP_API_VERSION request', async () => {
            const { host, port } = sitlHelper.getConnectionInfo();

            const response = await new Promise((resolve, reject) => {
                const socket = new net.Socket();
                socket.setTimeout(5000);
                const chunks = [];

                socket.on('connect', () => {
                    // Send MSP_API_VERSION request (MSP v2 format)
                    // $X< flag=0 code=1 size=0 crc
                    const msg = buildMSPv2Request(1); // MSP_API_VERSION = 1
                    socket.write(msg);
                });

                socket.on('data', (data) => {
                    chunks.push(data);
                    // Check if we have a complete response
                    const combined = Buffer.concat(chunks);
                    if (combined.length >= 9) { // Minimum MSPv2 response size
                        socket.destroy();
                        resolve(combined);
                    }
                });

                socket.on('error', reject);
                socket.on('timeout', () => {
                    socket.destroy();
                    reject(new Error('Timeout waiting for MSP response'));
                });

                socket.connect(port, host);
            });

            // Verify we got a response starting with $X
            expect(response[0]).toBe(0x24); // '$'
            expect(response[1]).toBe(0x58); // 'X'
        });

        it('receives valid MSP_FC_VARIANT response', async () => {
            const { host, port } = sitlHelper.getConnectionInfo();

            const response = await new Promise((resolve, reject) => {
                const socket = new net.Socket();
                socket.setTimeout(5000);
                const chunks = [];

                socket.on('connect', () => {
                    // MSP_FC_VARIANT = 2
                    const msg = buildMSPv2Request(2);
                    socket.write(msg);
                });

                socket.on('data', (data) => {
                    chunks.push(data);
                    const combined = Buffer.concat(chunks);
                    // FC_VARIANT response should have 4-byte payload (INAV)
                    if (combined.length >= 13) {
                        socket.destroy();
                        resolve(combined);
                    }
                });

                socket.on('error', reject);
                socket.on('timeout', () => {
                    socket.destroy();
                    reject(new Error('Timeout'));
                });

                socket.connect(port, host);
            });

            // Parse the FC variant from response
            // MSPv2: $X> flag code(2) size(2) payload crc
            if (response.length >= 13) {
                const payload = response.slice(8, 12);
                const variant = payload.toString('ascii');
                expect(variant).toBe('INAV');
            }
        });

        it('receives valid MSP_FC_VERSION response', async () => {
            const { host, port } = sitlHelper.getConnectionInfo();

            const response = await new Promise((resolve, reject) => {
                const socket = new net.Socket();
                socket.setTimeout(5000);
                const chunks = [];

                socket.on('connect', () => {
                    // MSP_FC_VERSION = 3
                    const msg = buildMSPv2Request(3);
                    socket.write(msg);
                });

                socket.on('data', (data) => {
                    chunks.push(data);
                    const combined = Buffer.concat(chunks);
                    if (combined.length >= 11) { // header + 3 byte version + crc
                        socket.destroy();
                        resolve(combined);
                    }
                });

                socket.on('error', reject);
                socket.on('timeout', () => {
                    socket.destroy();
                    reject(new Error('Timeout'));
                });

                socket.connect(port, host);
            });

            // Verify response structure
            expect(response[0]).toBe(0x24); // '$'
            expect(response[1]).toBe(0x58); // 'X'
            expect(response[2]).toBe(0x3E); // '>' (from FC)

            // Extract version bytes from payload
            if (response.length >= 11) {
                const major = response[8];
                const minor = response[9];
                const patch = response[10];

                // Version should be reasonable (e.g., 7.x.x, 8.x.x, 9.x.x)
                expect(major).toBeGreaterThanOrEqual(7);
                expect(major).toBeLessThanOrEqual(10);
                expect(minor).toBeGreaterThanOrEqual(0);
                expect(patch).toBeGreaterThanOrEqual(0);
            }
        });
    });
});

/**
 * Build an MSP v2 request message
 * Format: $X< flag(1) code(2) size(2) [payload] crc(1)
 */
function buildMSPv2Request(code, payload = []) {
    const size = payload.length;
    const buffer = Buffer.alloc(8 + size);

    buffer[0] = 0x24; // '$'
    buffer[1] = 0x58; // 'X'
    buffer[2] = 0x3C; // '<' (to FC)
    buffer[3] = 0x00; // flag
    buffer.writeUInt16LE(code, 4); // code
    buffer.writeUInt16LE(size, 6); // size

    // Add payload if any
    for (let i = 0; i < size; i++) {
        buffer[8 + i] = payload[i];
    }

    // Calculate CRC8 DVB-S2
    let crc = 0;
    for (let i = 3; i < 8 + size; i++) {
        crc = crc8DvbS2(crc, buffer[i]);
    }

    // Append CRC
    const finalBuffer = Buffer.alloc(9 + size);
    buffer.copy(finalBuffer);
    finalBuffer[8 + size] = crc;

    return finalBuffer;
}

/**
 * CRC8 DVB-S2 calculation
 */
function crc8DvbS2(crc, byte) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
        if (crc & 0x80) {
            crc = ((crc << 1) ^ 0xD5) & 0xFF;
        } else {
            crc = (crc << 1) & 0xFF;
        }
    }
    return crc;
}
