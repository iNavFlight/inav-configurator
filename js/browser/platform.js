"use strict";

const WEB_VERSION =
  typeof __INAV_WEB_VERSION__ !== "undefined"
    ? __INAV_WEB_VERSION__
    : "web-dev";

const fileHandles = new Map();
let nextFileHandleId = 1;

function fileId(file) {
  const id = `browser-file-${nextFileHandleId++}-${file.name}`;
  fileHandles.set(id, file);
  return id;
}

function selectFile(options = {}) {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = (options.filters || [])
      .flatMap((filter) => filter.extensions || [])
      .filter((extension) => extension !== "*")
      .map((extension) => `.${extension}`)
      .join(",");

    // Native <input type=file> fires no event on cancel, so without this
    // an awaited showOpenDialog() would hang forever. The "cancel" event
    // (Chromium/Firefox) fires reliably right after the dialog closes;
    // "change" is still handled in case a browser fires only that.
    const settle = () => {
      const filePaths = Array.from(input.files || [], fileId);
      resolve({ canceled: filePaths.length === 0, filePaths });
    };
    input.addEventListener("change", settle, { once: true });
    input.addEventListener("cancel", settle, { once: true });
    input.click();
  });
}

function download(filename, data) {
  const blob = data instanceof Blob ? data : new Blob([data]);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download =
    filename.replace(/^browser-download:/, "") || "inav-download";
  anchor.click();
  URL.revokeObjectURL(url);
}

// logging.js/onboard_logging.js call appendFile() once per poll tick,
// matching Electron's real fs.appendFile. Buffer chunks per filename and
// flush as a single download once the caller goes quiet (there's no
// explicit close call to hook, so idle is the "stopped" signal). Real
// fs.appendFile appends to one continuous file, so this must not split
// a session into multiple downloads - only idle/pagehide ever flush it.
const appendStreams = new Map();
const APPEND_FLUSH_IDLE_MS = 3000;

function flushAppendStream(filename) {
  const stream = appendStreams.get(filename);
  if (!stream || stream.chunks.length === 0) return;
  clearTimeout(stream.idleTimer);
  appendStreams.delete(filename);
  download(filename, new Blob(stream.chunks));
}

function appendToStream(filename, data) {
  let stream = appendStreams.get(filename);
  if (!stream) {
    stream = { chunks: [], idleTimer: null };
    appendStreams.set(filename, stream);
  }
  stream.chunks.push(data);

  clearTimeout(stream.idleTimer);
  stream.idleTimer = setTimeout(
    () => flushAppendStream(filename),
    APPEND_FLUSH_IDLE_MS,
  );
}

// download() is synchronous, so this flush actually completes before pagehide finishes.
window.addEventListener("pagehide", () => {
  for (const filename of Array.from(appendStreams.keys())) {
    flushAppendStream(filename);
  }
});

/**
 * Provides only browser-safe equivalents for the Electron preload API.
 * Unsupported desktop-only features deliberately fail with an explanatory
 * error rather than silently attempting native behavior in a browser.
 */
export function installBrowserPlatform() {
  if (globalThis.electronAPI) {
    return;
  }

  globalThis.__INAV_BROWSER_BUILD__ = true;

  globalThis.electronAPI = {
    storeGet(key, defaultValue) {
      const value = localStorage.getItem(`inav:${key}`);
      if (value === null) return defaultValue;
      try {
        return JSON.parse(value);
      } catch (_) {
        return defaultValue;
      }
    },
    storeSet(key, value) {
      localStorage.setItem(`inav:${key}`, JSON.stringify(value));
    },
    storeDelete(key) {
      localStorage.removeItem(`inav:${key}`);
    },
    appGetVersion: () => WEB_VERSION,
    appGetLocale: () => navigator.language || "en",
    appGetPath: () => "",
    showOpenDialog: selectFile,
    async showSaveDialog(options = {}) {
      const defaultPath = options.defaultPath || "inav-download";
      return {
        canceled: false,
        filePath: `browser-download:${defaultPath.split("/").pop()}`,
      };
    },
    alertDialog: (message) => alert(message),
    confirmDialog: async (message) => confirm(message),
    async readFile(id, encoding = "utf8") {
      const file = fileHandles.get(id);
      if (!file)
        return {
          error: new Error("The selected browser file is no longer available."),
        };
      return {
        error: false,
        data: encoding === null ? await file.arrayBuffer() : await file.text(),
      };
    },
    async writeFile(filename, data) {
      download(filename, data);
      return false;
    },
    async appendFile(filename, data) {
      appendToStream(filename, data);
      return false;
    },
    async getBackupDir() {
      return "browser-download:";
    },
    async openBackupDir() {
      alert("Browser downloads are managed by your browser.");
    },
    async listBackups() {
      return [];
    },
    async rm() {
      return false;
    },
    async chmod() {
      return false;
    },
    // TCP, UDP, and local SITL cannot run directly in a browser.
    tcpConnect: unsupported("Raw TCP"),
    tcpClose: () => {},
    tcpSend: unsupported("Raw TCP"),
    udpConnect: unsupported("Raw UDP"),
    udpClose: () => {},
    udpSend: unsupported("Raw UDP"),
    startChildProcess: unsupported("Local SITL"),
    killChildProcess: () => {},
    onChildProcessStdout: () => () => {},
    onChildProcessStderr: () => () => {},
    onChildProcessError: () => () => {},
  };
}

function unsupported(feature) {
  return async () => ({
    error: true,
    msg: `${feature} is unavailable in the browser build.`,
  });
}
