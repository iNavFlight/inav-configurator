"use strict";

import $ from "jquery";

// This module is the shared HTML entry point for both builds. Electron has a
// preload-provided API; the web build installs browser-safe equivalents first.
if (!globalThis.electronAPI) {
  const { installBrowserPlatform } = await import("./browser/platform");
  installBrowserPlatform();
}

// jquery-ui is a legacy global plugin, so establish its expected globals before
// dynamically loading the existing renderer entry point.
globalThis.$ ??= $;
globalThis.jQuery ??= $;

await import("./configurator_main");
