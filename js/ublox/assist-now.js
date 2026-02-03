#!/usr/bin/env node
// ======================================================================
// assist-now.js – Node.js port of u-blox assistnow_example_v1.1.1.py
// ======================================================================
// Copyright 2025 u-blox AG (original Python)
// Ported to JavaScript / Node.js – Feb 2026 DHaacke, Updated: xx-xx-xxxx
// SPDX-License-Identifier: Apache-2.0
//  
// Author: Doug Haacke <dhaacke@gmail.com>
//   This serves as a replacement for the ublox.js file. It has be written to be allowed to run either as a standalone script from the command line or 
//   be imported as a module into another script on INAV Configurator. See notes below on how to run as a standalone, which is handy for testing.
//
// Purpose:
//   Enables Zero Touch Provisioning (ZTP) + AssistNow Online/Live orbit download and injection into a u-blox GNSS receiver.
//
// Prerequisites:
//   1. A u-blox GNSS receiver connected via UART to TTL serial adapter to your computer directly for standalone use
//      or a USB connection to your Flight Controller (e.g., u-blox Matel M10Q series) for use through INAV Configurator.
//   2. INAV configurator repo installed on your computer (for standalone use).
//   3. A valid ZTP token for AssistNow services. See https://developer.thingstream.io/guides/location-services/assistnow-user-guide to 
//      create a device profile and obtain a required ZTP token. This token should then be entered in INAV Configurator settings for AssistNow or
//      provided as a command line argument when running this script standalone.
//
// Code functionality:
//   1. Poll UBX-SEC-UNIQID and UBX-MON-VER to get GNSS information and u-blox verification
//   2. Perform ZTP to get authorization chipcode for AssistNow data download
//   3. Download AssistNow Online Predictive orbits based on user selection
//   4. Inject MGA messages in GNSS device and wait for MGA-ACKs
//   5. Cold-reset receiver
//   6. Measure TTFF (time to first fix)
//
// Code Dependencies:
//   - serialport                      serial communication
//   - @serialport/parser-byte-length  (optional helper, custom used here)
//   - uuid                            UUID validation
//   - node-fetch                      (only if running < Node 18)
//
// Standalone Usage examples:
//   node <path>/assistnow.js -P /dev/ttyUSB0 -z 123e4567-e89b-12d3-a456-426614174000 -p
//   node <path>/assistnow.js -P /dev/cu.SLAB_USBtoUART -B 115200 -z your-token-here -p
//   node <path>/assistnow.js -P COM3 -B 9600 -z your-token-here
// ======================================================================

"use strict";

import { SerialPort } from "serialport";
import { parseArgs } from "node:util";
import { Buffer } from "node:buffer";
import { URLSearchParams } from "node:url";
import fetch from "node-fetch";

const { assistNow, parseArguments, VERSION } = (function () {
  // ─────────────────────────────────────────────────────────────────────────────
  // Constants
  // ─────────────────────────────────────────────────────────────────────────────

  const VERSION = "v0.1.1-inav";

  const ZTP_ENDPOINT = "https://api.thingstream.io/ztp/assistnow/credentials";

  const SERIAL_TIMEOUT_MS = 5000;
  const HTTP_TIMEOUT_MS = 5000;

  // UBX poll commands (binary, do not alter)
  const CMD_POLL_UNIQID = Buffer.from([
    0xb5, 0x62, 0x27, 0x03, 0x00, 0x00, 0x2a, 0xa5,
  ]);
  const CMD_POLL_MONVER = Buffer.from([
    0xb5, 0x62, 0x0a, 0x04, 0x00, 0x00, 0x0e, 0x34,
  ]);
  const CMD_POLL_NAV_STATUS = Buffer.from([
    0xb5, 0x62, 0x01, 0x03, 0x00, 0x00, 0x04, 0x0d,
  ]);
  const CMD_RESET = Buffer.from([
    0xb5, 0x62, 0x06, 0x04, 0x04, 0x00, 0xff, 0xff, 0x02, 0x00, 0x0e, 0x61,
  ]);

  // Enable CFG-NAVSPG-ACKAIDING in RAM layer (allows MGA-ACK)
  const CFG_RAM_ACKAIDING = Buffer.from([
    0xb5,
    0x62,
    0x06,
    0x8a,
    0x09,
    0x00,
    0x00,
    0x01,
    0x00,
    0x00, // transaction & layers
    0x25,
    0x00,
    0x11,
    0x10,
    0x01, // key CFG-NAVSPG-ACKAIDING = 1
    0xe1,
    0x3e,
  ]);

  // ─────────────────────────────────────────────────────────────────────────────
  // Utility – UBX message validation & splitting
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Validate whether bytes starting at offset 0 form a valid UBX message.
   * Returns length of valid message or:
   *   0  → invalid / not UBX
   *  -1  → not enough bytes yet
   */
  function validateUbxMessage(buf) {
    if (!buf || buf.length < 8) return -1;
    if (buf[0] !== 0xb5 || buf[1] !== 0x62) return 0;

    const payloadLen = buf.readUInt16LE(4);
    const expectedTotal = payloadLen + 8;

    if (buf.length < expectedTotal) return -1;

    // Compute checksum (CK_A, CK_B)
    let ckA = 0,
      ckB = 0;
    for (let i = 2; i < expectedTotal - 2; i++) {
      ckA = (ckA + buf[i]) & 0xff;
      ckB = (ckB + ckA) & 0xff;
    }

    if (ckA !== buf[expectedTotal - 2] || ckB !== buf[expectedTotal - 1]) {
      console.error("Checksum mismatch");
      return 0;
    }

    return expectedTotal;
  }

  /**
   * Split a buffer containing concatenated valid UBX messages.
   * Yields one message at a time.
   */
  function* splitUbxMessages(data) {
    let offset = 0;
    while (offset < data.length) {
      const len = validateUbxMessage(data.subarray(offset));
      if (len <= 0) {
        // Skip 1 byte on invalid → simple recovery
        offset += 1;
        continue;
      }
      yield data.subarray(offset, offset + len);
      offset += len;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // UBXReceiver – handles serial I/O, message parsing, ACK waiting
  // ─────────────────────────────────────────────────────────────────────────────

  class UBXReceiver {
    constructor(portPath, baudRate = 38400) {
      this.port = new SerialPort({ path: portPath, baudRate, autoOpen: true });
      this.buffer = Buffer.alloc(0);
      this.messageQueue = []; // array as simple queue
      this.expectedPrefix = null;
      this.running = true;

      this.port.on("data", (chunk) => this._onData(chunk));
      this.port.on("error", (err) => console.error("Serial error:", err));
    }

    _onData(chunk) {
      this.buffer = Buffer.concat([this.buffer, chunk]);

      // Discard until we find possible UBX preamble
      let start = this.buffer.indexOf(0xb5);
      if (start === -1) {
        this.buffer = Buffer.alloc(0);
        return;
      }
      if (start > 0) this.buffer = this.buffer.subarray(start);

      // Process all complete messages we can find
      while (this.buffer.length >= 8) {
        const len = validateUbxMessage(this.buffer);
        if (len === -1) break; // wait for more data
        if (len === 0) {
          // Invalid → skip first byte
          this.buffer = this.buffer.subarray(1);
          continue;
        }

        const msg = this.buffer.subarray(0, len);
        this.buffer = this.buffer.subarray(len);

        // If we are waiting for a specific prefix, queue only matching messages
        if (
          this.expectedPrefix &&
          msg
            .subarray(0, this.expectedPrefix.length)
            .equals(this.expectedPrefix)
        ) {
          this.messageQueue.push(msg);
        }
      }
    }

    async send(msg) {
      console.log(`Send     msg: ${msg.toString("hex")}`);
      return new Promise((resolve, reject) => {
        this.port.write(msg, (err) => (err ? reject(err) : resolve()));
      });
    }

    /**
     * Send message and wait for first matching response (by prefix)
     */
    async sendAndWait(msg, prefix, timeoutMs = SERIAL_TIMEOUT_MS) {
      this.expectedPrefix = prefix;
      this.messageQueue = []; // clear old messages

      await this.send(msg);

      return new Promise((resolve) => {
        const start = Date.now();
        const interval = setInterval(() => {
          if (this.messageQueue.length > 0) {
            clearInterval(interval);
            resolve(this.messageQueue.shift());
          }
          if (Date.now() - start > timeoutMs) {
            clearInterval(interval);
            console.warn("Timeout waiting for response");
            resolve(null);
          }
        }, 50);
      });
    }

    async pollUbxMessage(pollCmd) {
      const expected = pollCmd.subarray(0, 4); // class + id
      return this.sendAndWait(pollCmd, expected);
    }

    async sendAcked(msg, timeoutMs = SERIAL_TIMEOUT_MS) {
      const ackPrefix = Buffer.from([0xb5, 0x62, 0x05]); // ACK/NAK
      const reply = await this.sendAndWait(msg, ackPrefix, timeoutMs);
      if (!reply) return false;
      // msgId == 1 → ACK, 0 → NAK
      return reply[3] === 1;
    }

    /**
     * Send multiple MGA messages (AssistNow data) and wait for all MGA-ACKs
     * Returns [totalSent, unacknowledged, unacked_ANO_count]
     */
    async sendAssistNowData(data) {
      this.expectedPrefix = Buffer.from([0xb5, 0x62, 0x13, 0x60]); // MGA-ACK
      this.messageQueue = [];

      const messages = [...splitUbxMessages(data)];
      console.log(
        `Sending ${messages.length} MGA messages (${data.length} bytes)`,
      );

      // Send all first
      for (const msg of messages) {
        await this.send(msg);
      }

      // Map message identifier for ACK matching (msgId + first 4 payload bytes)
      const pending = new Map();
      for (const msg of messages) {
        const key = Buffer.concat([msg.subarray(3, 4), msg.subarray(6, 10)]);
        pending.set(key.toString("hex"), msg);
      }

      let tries = 0;
      while (pending.size > 0 && tries < 3) {
        const ack = await new Promise((r) => {
          const iv = setInterval(() => {
            if (this.messageQueue.length > 0) {
              clearInterval(iv);
              r(this.messageQueue.shift());
            }
          }, 50);
          setTimeout(() => {
            clearInterval(iv);
            r(null);
          }, SERIAL_TIMEOUT_MS);
        });

        if (!ack) {
          tries++;
          console.warn(
            `Timeout – resending ${pending.size} unacked messages (try ${tries})`,
          );
          for (const msg of pending.values()) await this.send(msg);
          continue;
        }

        // MGA-ACK payload starts after header+length → offset 6
        const key = ack.subarray(6 + 3, 6 + 8).toString("hex");
        pending.delete(key);
      }

      const unackedAno = [...pending.keys()].filter((k) =>
        k.startsWith("20"),
      ).length;

      return [messages.length, pending.size, unackedAno];
    }

    close() {
      this.running = false;
      this.port.close();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Main logic – port of run_assistnow()
  // ─────────────────────────────────────────────────────────────────────────────

  async function runAssistNow(args) {
    const gnss = new UBXReceiver(args.port, args.baudRate);

    try {
      let assistData = Buffer.alloc(0);

      console.log("Polling UBX-SEC-UNIQID...");
      const uniqid = await gnss.pollUbxMessage(CMD_POLL_UNIQID);
      if (!uniqid) throw new Error("Failed to get UBX-SEC-UNIQID");
      console.log(`UBX-SEC-UNIQID: ${uniqid.subarray(10, 16).toString("hex")}`);

      console.log("Polling UBX-MON-VER...");
      const monver = await gnss.pollUbxMessage(CMD_POLL_MONVER);
      if (!monver) throw new Error("Failed to get UBX-MON-VER");

      // Decode version string (null-terminated fields)
      const verStr = monver
        .subarray(6, -2)
        .toString("utf-8")
        .replace(/\0+$/, "");
      console.log("UBX-MON-VER:");
      verStr
        .split("\0")
        .filter(Boolean)
        .forEach((line) => console.log(`  ${line}`));

      if (args.useAssist) {
        // ── ZTP request ───────────────────────────────────────────────────────
        console.log("Requesting ZTP chipcode...");
        const ztpPayload = {
          token: args.ztpToken,
          messages: {
            "UBX-SEC-UNIQID": uniqid.toString("hex"),
            "UBX-MON-VER": monver.toString("hex"),
          },
        };

        const ztpRes = await fetch(ZTP_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(ztpPayload),
          signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
        });

        if (!ztpRes.ok) {
          throw new Error(
            `ZTP failed: ${ztpRes.status} ${await ztpRes.text()}`,
          );
        }

        const ztpJson = await ztpRes.json();
        if (!ztpJson.chipcode) throw new Error("No chipcode in ZTP response");

        console.log("ZTP successful, chipcode received!");
        // console.log(`Allowed data types: ${ztpJson.allowedData?.join(', ') ?? 'n/a'}`);

        // ── Request AssistNow data ───────────────────────────────────────────
        let dataTypes;
        if (args.live) {
          dataTypes = "ulorb_l1,ukion,usvht,ualm"; // live orbits + almanac
          console.log("Requesting LIVE orbits + almanac");
        } else {
          dataTypes = "uporb_3,ualm"; // predictive + almanac
          console.log("Requesting PREDICTIVE orbits + almanac");
        }

        const params = new URLSearchParams({
          chipcode: ztpJson.chipcode,
          data: dataTypes,
          gnss: "gps,gal,glo,bds,qzss",
        });

        const anRes = await fetch(`${ztpJson.serviceUrl}?${params}`, {
          signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
        });

        if (!anRes.ok) {
          throw new Error(
            `AssistNow failed: ${anRes.status} ${await anRes.text()}`,
          );
        }

        assistData = Buffer.from(await anRes.arrayBuffer());
        console.log(`Received ${assistData.length} bytes of AssistNow data`);
      }

      // ── Cold reset ─────────────────────────────────────────────────────────
      console.log("Cold-resetting receiver...");
      await gnss.send(CMD_RESET);

      const resetTime = Date.now();

      // Wait until receiver responds again
      console.log("Waiting for receiver to respond after reset...");
      let ready = false;
      for (let i = 0; i < 10; i++) {
        if (await gnss.pollUbxMessage(CMD_POLL_UNIQID)) {
          ready = true;
          break;
        }
        await new Promise((r) => setTimeout(r, 800));
      }
      if (!ready) throw new Error("Receiver not responding after reset");

      if (args.useAssist) {
        console.log("Enabling CFG-NAVSPG-ACKAIDING...");
        if (!(await gnss.sendAcked(CFG_RAM_ACKAIDING, 1500))) {
          throw new Error("Failed to enable MGA-ACKs");
        }

        const [sent, unacked, unackedAno] =
          await gnss.sendAssistNowData(assistData);

        if (unacked > 0) {
          console.warn(`${unacked}/${sent} MGA messages not acknowledged`);
          if (unackedAno > 0) {
            console.error(
              `${unackedAno} predictive orbit (ANO) messages unacked`,
            );
            console.error(
              "  → receiver may not support predictive orbits? Try --live",
            );
          }
        } else {
          console.log("All MGA messages acknowledged");
        }
      }

      const mgaEndTime = Date.now();
      const mgaDurationMs = mgaEndTime - resetTime;

      // ── Wait for TTFF ──────────────────────────────────────────────────────
      console.log("Waiting for UBX-NAV-STATUS (TTFF)...");
      const ttffStart = Date.now();
      while (Date.now() - ttffStart < 60000) {
        const nav = await gnss.pollUbxMessage(CMD_POLL_NAV_STATUS);
        if (!nav) {
          console.warn("Failed to poll NAV-STATUS");
          break;
        }

        // TTFF field = uint32 @ payload offset 8
        const ttff = nav.readUInt32LE(6 + 8);
        if (ttff > 0) {
          if (args.useAssist) {
            console.log(`Time to inject AssistNow data : ${mgaDurationMs} ms`);
          }
          console.log(`Time from reset to first fix (TTFF): ${ttff} ms`);
          break;
        }
        await new Promise((r) => setTimeout(r, 1000));
      }

      if (Date.now() - ttffStart >= 60000) {
        console.warn("No fix within 60 seconds – check antenna / sky view");
      }
    } catch (err) {
      console.error("Error:", err.message);
    } finally {
      gnss.close();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // CLI argument parsing
  // ─────────────────────────────────────────────────────────────────────────────

  function parseArguments() {
    const options = {
      port: { type: "string", short: "P" },
      baudRate: { type: "string", short: "B", default: "38400" },
      ztpToken: { type: "string", short: "z" },
      predictive: { type: "boolean", short: "p", default: false },
      live: { type: "boolean", short: "l", default: false },
      noAssist: { type: "boolean", short: "n", default: false },
      version: { type: "boolean", short: "v", default: false },
    };

    const { values, positionals } = parseArgs({
      args: process.argv.slice(2),
      options,
      allowPositionals: true,
    });

    if (values.version) {
      console.log(`assistnow.js ${VERSION}`);
      process.exit(0);
    }

    if (!values.port || !values.ztpToken) {
      console.error("Missing required arguments: -P <port> -z <ZTP token>");
      console.error("Run with --help for usage");
      process.exit(1);
    }

    // Mutually exclusive assist mode
    let useAssist = true;
    if (values.noAssist) useAssist = false;
    else if (values.predictive)
      useAssist = true; // default anyway
    else if (values.live) useAssist = true;

    return {
      port: values.port,
      baudRate: parseInt(values.baudRate, 10),
      ztpToken: values.ztpToken,
      live: !!values.live,
      useAssist,
    };
  }

  return {
    assistNow: runAssistNow,
    parseArguments,
    VERSION,
  };
})();

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArguments();

  console.log(`assistnow.js ${VERSION} – u-blox AssistNow using (ZTP)`);
  console.log(`Port: ${args.port} @ ${args.baudRate} baud`);
  console.log(
    `Mode: ${args.useAssist ? (args.live ? "LIVE" : "PREDICTIVE") : "NO ASSIST"}`,
  );

  assistNow(args).catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}

export default assistNow;

// export { runAssistNow, parseArguments, UBXReceiver };

// ======================================================================
// Example command lines (to be run in terminal):

// node /Users/doug/Development/inav-configurator/js/ublox/assist-now.js -P /dev/cu.usbmodem0DAC28A114C41 -B 115200 -z <token> -p
// node /Users/doug/Development/inav-configurator/js/ublox/assist-now.js -P /dev/cu.SLAB_USBtoUART  -B 9600 -z <token>>
// ======================================================================