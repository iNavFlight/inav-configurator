# INAV Configurator - Developer Guide

> **Maintainers:** Update this file when making architectural changes or adding major features.

## Overview

INAV Configurator is a cross-platform Electron desktop application for configuring INAV flight controllers. It supports multirotors, fixed-wing aircraft, rovers, and boats.

**Tech Stack:** Electron + Vite + jQuery + i18next

## Quick Start

```bash
yarn install    # Install dependencies
yarn start      # Run in development mode (hot reload)
yarn make       # Build distributable packages
```

## Directory Structure

```
inav-configurator/
├── js/                     # Main application source
│   ├── configurator_main.js    # Renderer entry point (initializes UI)
│   ├── fc.js                   # Flight controller state model
│   ├── gui.js                  # Tab switching & UI management
│   ├── msp.js                  # MSP protocol encoder/decoder
│   ├── serial_backend.js       # Connection orchestration
│   ├── main/                   # Electron main process
│   │   ├── main.js                 # Main process entry
│   │   └── preload.js              # IPC bridge (renderer↔main)
│   ├── connection/             # Connection layer (factory pattern)
│   │   ├── connectionSerial.js     # Serial port
│   │   ├── connectionTcp.js        # TCP/IP (SITL)
│   │   └── connectionBle.js        # Bluetooth LE
│   ├── msp/                    # MSP protocol helpers
│   │   ├── MSPCodes.js             # Command codes
│   │   └── MSPHelper.js            # Serialization (largest file)
│   └── transpiler/             # Logic conditions compiler
├── src/css/                # Stylesheets
│   └── tabs/                   # Per-tab styles
├── locale/                 # i18n translations (en, ja, uk, zh_CN)
├── resources/              # 3D models, OSD fonts, SITL binaries
├── index.html              # Single-page app entry
├── forge.config.js         # Electron Forge build config
└── vite.*.config.js        # Vite build configs
```

## Architecture

### Data Flow

```
User → GUI Tab → MSP.send_message() → Serial Queue → Connection → Flight Controller
                                                                         ↓
User ← GUI Update ← FC state object ← MSP.decode() ← Serial Data ←──────┘
```

### Key Subsystems

1. **Connection Layer** (`js/connection/`): Factory pattern abstracts serial, TCP, UDP, BLE
2. **MSP Protocol** (`js/msp/`): Binary protocol for FC communication (V1/V2 variants)
3. **FC State** (`js/fc.js`): Central state object (CONFIG, PID, SENSOR_DATA, GPS_DATA, etc.)
4. **Tab System** (`js/gui.js`): Tabs load dynamically; separate tabs for connected vs disconnected states

### MSP Request Pattern

```javascript
MSP.send_message(MSPCodes.MSP_SOME_CODE, payload, false, () => {
    // FC state already updated, refresh UI here
    updateUIFromState(FC.SOME_DATA);
});
```

## Adding a New Tab

1. Create tab JS file with `initialize()` and `cleanup()` functions
2. Register in `TABS` object
3. Add CSS in `src/css/tabs/`
4. Add HTML link in `index.html` (mode-connected or mode-disconnected list)
5. Add translation keys to `locale/en/messages.json`

## Adding New MSP Commands

1. Add command code to `js/msp/MSPCodes.js`
2. Add serialize/deserialize logic to `js/msp/MSPHelper.js`
3. Add state property to `js/fc.js`
4. Use in relevant tab

## Build Targets

| Platform | Command | Output |
|----------|---------|--------|
| Windows  | `yarn make --platform win32` | MSI installer |
| macOS    | `yarn make --platform darwin` | DMG |
| Linux    | `yarn make --platform linux` | DEB, RPM |

## Key Files by Importance

| File | Purpose |
|------|---------|
| `js/msp/MSPHelper.js` | All MSP serialization (159KB - largest file) |
| `js/fc.js` | Flight controller state model |
| `js/serial_backend.js` | Connection management |
| `js/gui.js` | Tab switching, UI state |
| `js/configurator_main.js` | Application initialization |


## Code Patterns

- **jQuery** for DOM manipulation
- **Callbacks** for async (some Promises)
- **i18next** via `data-i18n` attributes: `<span data-i18n="key"></span>`
- **ES6 modules** throughout (`import`/`export`)

## Debugging

```bash
NODE_ENV=development yarn start   # Dev mode
# Press Ctrl+Shift+I for DevTools
```

## Resources

- [INAV Firmware](https://github.com/iNavFlight/inav)
- [INAV Wiki](https://github.com/iNavFlight/inav/wiki)
- [INAV Discord](https://discord.gg/peg2hhbYwN)
- [Electron Docs](https://www.electronjs.org/docs)
