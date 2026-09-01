"use strict";

import GUI from "./../gui";
import { ConnectionType, Connection } from "./connection";
import i18n from "./../localization";

/**
 * Browser serial transport.
 *
 * This deliberately implements the same `Connection` subclass contract as
 * `connectionSerial.js`; the MSP layer receives the same ArrayBuffer payloads
 * and does not know whether its bytes came from serialport or Web Serial.
 */
class ConnectionWebSerial extends Connection {
  static _portsById = new Map();
  // The browser returns the same SerialPort object (by ===) for a
  // previously-granted device across repeated getPorts() calls in a page's
  // lifetime, so this WeakMap lets each device keep the ID it was first
  // assigned. Without it, an index-based ID would shift for every port
  // whenever an earlier-granted device is removed, and port_handler.js's
  // array-diff would read that shift as the removal of a *different*,
  // still-connected device.
  static _portObjectIds = new WeakMap();
  static _nextPortIndex = 0;
  static _nextConnectionId = 1;
  static CHOOSE_PORT_ID = "webserial-choose-port";

  constructor() {
    super();
    this._type = ConnectionType.Serial;
    this._port = null;
    this._reader = null;
    this._writer = null;
    this._readTask = null;
    this._readLoopActive = false;
    this._disconnectHandler = null;
  }

  static isSupported() {
    return typeof navigator !== "undefined" && "serial" in navigator;
  }

  static portId(port) {
    let id = ConnectionWebSerial._portObjectIds.get(port);
    if (!id) {
      const info = port.getInfo();
      const vendor = info.usbVendorId?.toString(16).padStart(4, "0");
      const product = info.usbProductId?.toString(16).padStart(4, "0");
      const index = ConnectionWebSerial._nextPortIndex++;
      id =
        vendor && product
          ? `webserial-${vendor}-${product}-${index}`
          : `webserial-granted-${index}`;
      ConnectionWebSerial._portObjectIds.set(port, id);
    }
    return id;
  }

  static async getDevices() {
    if (!ConnectionWebSerial.isSupported()) {
      return [];
    }

    const ports = await navigator.serial.getPorts();
    ConnectionWebSerial._portsById.clear();
    ports.forEach((port) => {
      ConnectionWebSerial._portsById.set(
        ConnectionWebSerial.portId(port),
        port,
      );
    });

    // A chooser entry is always available so a first-time user can grant a port.
    return [
      ...ConnectionWebSerial._portsById.keys(),
      ConnectionWebSerial.CHOOSE_PORT_ID,
    ];
  }

  async connectImplementation(portId, options, callback) {
    if (!ConnectionWebSerial.isSupported()) {
      GUI.log(
        "Web Serial is not supported by this browser. Use a Chromium-based browser over HTTPS or localhost.",
      );
      callback(false);
      return;
    }

    try {
      // requestPort is called from the existing Connect click handler, satisfying
      // the browser user-activation requirement for first-time permissions.
      this._port =
        ConnectionWebSerial._portsById.get(portId) ||
        (await navigator.serial.requestPort());
      await this._port.open({ baudRate: options.bitrate });
      // Hold a single writer for the whole connection. Acquiring a writer per
      // send fails whenever sends are queued back-to-back: the callback of the
      // first send starts the next one before the first lock is released.
      this._writer = this._port.writable.getWriter();
      this.installDisconnectListener();

      const label =
        portId === ConnectionWebSerial.CHOOSE_PORT_ID
          ? "Web Serial port"
          : portId;
      GUI.log(
        i18n.getMessage("connectionConnected", [
          `${label} @ ${options.bitrate} baud`,
        ]),
      );
      callback({
        bitrate: options.bitrate,
        connectionId: ConnectionWebSerial._nextConnectionId++,
      });
      this._readLoopActive = true;
      this._readTask = this.readLoop();
    } catch (error) {
      try {
        this._writer?.releaseLock();
      } catch (_) {
        // ignore cleanup errors
      }
      this._writer = null;
      this._port = null;
      GUI.log(`Web Serial connection error: ${error.message}`);
      callback(false);
    }
  }

  installDisconnectListener() {
    this._disconnectHandler = (event) => {
      if (event.target !== this._port || !this._readLoopActive) {
        return;
      }
      GUI.log("Web Serial device disconnected.");
      this.handleReceiveError(new Error("Serial device disconnected."));
      this.abort();
    };
    navigator.serial.addEventListener("disconnect", this._disconnectHandler);
  }

  removeDisconnectListener() {
    if (this._disconnectHandler && ConnectionWebSerial.isSupported()) {
      navigator.serial.removeEventListener(
        "disconnect",
        this._disconnectHandler,
      );
    }
    this._disconnectHandler = null;
  }

  async readLoop() {
    // Per the Web Serial spec, a non-fatal read error (parity/framing/buffer
    // overrun) errors the current readable; the port then exposes a fresh
    // readable that must be re-acquired. Only a null readable is fatal.
    while (this._readLoopActive && this._port?.readable) {
      this._reader = this._port.readable.getReader();
      try {
        while (this._readLoopActive) {
          const { value, done } = await this._reader.read();
          if (done) {
            return;
          }
          if (value?.byteLength) {
            // Slice to an ArrayBuffer, matching the Electron IPC transport.
            const data = value.buffer.slice(
              value.byteOffset,
              value.byteOffset + value.byteLength,
            );
            this._onReceiveListeners.forEach((listener) =>
              listener({
                connectionId: this._connectionId,
                data,
              }),
            );
          }
        }
      } catch (error) {
        if (!this._readLoopActive) {
          return;
        }
        console.warn(`Web Serial transient read error: ${error.message}`);
      } finally {
        this._reader.releaseLock();
        this._reader = null;
      }
    }

    if (this._readLoopActive) {
      // The readable is gone for good (device lost) while still connected.
      GUI.log("Web Serial read error: the serial device stopped responding.");
      this.handleReceiveError(new Error("Serial device lost."));
      this._readTask = null;
      this.abort();
    }
  }

  handleReceiveError(error) {
    this._onReceiveErrorListeners.forEach((listener) => listener(error));
  }

  async disconnectImplementation(callback) {
    this._readLoopActive = false;
    this.removeDisconnectListener();

    try {
      if (this._reader) {
        await this._reader.cancel();
      }
      await this._readTask;
      if (this._writer) {
        this._writer.releaseLock();
        this._writer = null;
      }
      if (this._port) {
        await this._port.close();
      }
      this._port = null;
      callback(true);
    } catch (error) {
      console.log(`Web Serial close error: ${error.message}`);
      this._writer = null;
      this._port = null;
      callback(false);
    }
  }

  async sendImplementation(data, callback) {
    if (!this._writer) {
      callback({ bytesSent: 0, resultCode: 1 });
      return;
    }

    const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
    try {
      await this._writer.write(bytes);
      callback({ bytesSent: bytes.byteLength, resultCode: 0 });
    } catch (error) {
      console.log(`Web Serial write error: ${error.message}`);
      this.handleReceiveError(error);
      callback({ bytesSent: 0, resultCode: 1 });
    }
  }

  addOnReceiveCallback(callback) {
    this._onReceiveListeners.push(callback);
  }

  removeOnReceiveCallback(callback) {
    this._onReceiveListeners = this._onReceiveListeners.filter(
      (listener) => listener !== callback,
    );
  }

  addOnReceiveErrorCallback(callback) {
    this._onReceiveErrorListeners.push(callback);
  }

  removeOnReceiveErrorCallback(callback) {
    this._onReceiveErrorListeners = this._onReceiveErrorListeners.filter(
      (listener) => listener !== callback,
    );
  }
}

export default ConnectionWebSerial;
