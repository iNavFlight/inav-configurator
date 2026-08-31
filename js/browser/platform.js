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
    input.addEventListener(
      "change",
      () => {
        const filePaths = Array.from(input.files || [], fileId);
        resolve({ canceled: filePaths.length === 0, filePaths });
      },
      { once: true },
    );
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

// appendFile() is called many times in a row (once per polling tick) by
// tabs/logging.js and tabs/onboard_logging.js to stream data as it arrives,
// the same way Electron's real fs.appendFile does on disk. A browser can't
// append to an arbitrary file, so each stream's chunks are buffered here and
// flushed as a single download either once enough has accumulated or once
// the caller goes quiet for a bit (which is what "logging stopped" looks
// like from here, since there's no explicit close/finalize call in either
// tab today).
const appendStreams = new Map();
const APPEND_FLUSH_BYTES = 1024 * 1024; // 1MB
const APPEND_FLUSH_IDLE_MS = 3000;

function byteLength(chunk) {
  return chunk instanceof Uint8Array ? chunk.byteLength : chunk.length;
}

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
    stream = { chunks: [], size: 0, idleTimer: null };
    appendStreams.set(filename, stream);
  }
  stream.chunks.push(data);
  stream.size += byteLength(data);

  clearTimeout(stream.idleTimer);
  if (stream.size >= APPEND_FLUSH_BYTES) {
    flushAppendStream(filename);
  } else {
    stream.idleTimer = setTimeout(
      () => flushAppendStream(filename),
      APPEND_FLUSH_IDLE_MS,
    );
  }
}

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

  // One-time migration: an earlier browser build force-disabled the CLI
  // auto-complete preference. Clear that stale value once so the default
  // applies again, while preserving any choice the user makes afterwards.
  if (!localStorage.getItem("inav:web_migration_cli_autocomplete")) {
    localStorage.removeItem("inav:cli_autocomplete");
    localStorage.setItem("inav:web_migration_cli_autocomplete", "1");
  }

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
