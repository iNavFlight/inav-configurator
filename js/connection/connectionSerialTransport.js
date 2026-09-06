"use strict";

import ConnectionDesktopSerial from "./connectionSerial";
import ConnectionWebSerial from "./connectionWebSerial";

// The renderer API remains a Connection subclass. Desktop keeps its IPC-backed
// serialport transport; a browser bundle selects Web Serial without any MSP or
// caller changes.
const isBrowserBuild =
  typeof globalThis !== "undefined" &&
  globalThis.__INAV_BROWSER_BUILD__ === true;

const ConnectionSerial = isBrowserBuild
  ? ConnectionWebSerial
  : ConnectionDesktopSerial;

export default ConnectionSerial;
