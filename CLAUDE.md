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
├── locale/                 # i18n translations (en, ja, ru, uk, zh_CN)
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

---

## SITL Simulation

### Native SITL (Electron) - `js/sitl.js`
Spawns native INAV SITL executable based on OS:
- **Windows:** `resources/windows/inav_SITL.exe`
- **Linux:** `resources/linux/inav_SITL`
- **macOS:** `resources/macos/inav_SITL`

**Key Functions:**
```javascript
SITLProcess.start(eepromFile, sim, useIMU, simIp, simPort, channelMap, serialOptions, callback)
SITLProcess.stop()
```

### WebAssembly SITL (Web/PWA) - `js/web/SITL-Webassembly.js`

Runs INAV SITL compiled to WebAssembly (Emscripten) in the browser. Allows browser-based simulation without native executables.

**API:**

```javascript
import SITLWebAssembly from './web/SITL-Webassembly.js';

// Initialize WASM module (loads .wasm binary)
await SITLWebAssembly.init({
    onRuntimeInitialized: () => console.log('Ready!')
}, (err, module) => {
    if (!err) console.log('WASM SITL ready');
});

// Start simulation with options
SITLWebAssembly.start({
    eepromFile: 'sitl.eeprom',
    sim: 'realflight',           // realflight, xplane, etc.
    useIMU: false,
    simIp: '127.0.0.1',
    simPort: 49000,
    channelMap: '',
    serialPort: 'COM1',
    serialBaudRate: 115200,
    serialStopBits: 'One',
    serialParity: 'None',
    protocol: 'Flight Controller Proxy'
}, (err, commandString) => {
    if (!err) console.log('Started:', commandString);
});

// Stop simulation
SITLWebAssembly.stop(() => console.log('Stopped'));

// Access the Module object directly
const module = SITLWebAssembly.getModule();

// Call exported C functions
const result = SITLWebAssembly.callCFunction('getState', 'number', [], []);

// Read WASM memory
const memData = SITLWebAssembly.readMemory(0x1000, 256);

// Check status
if (SITLWebAssembly.isRunning()) { ... }
if (SITLWebAssembly.isLoading()) { ... }

// Reset WASM state
SITLWebAssembly.reset();
```

**Module Accessibility:**
The WASM `Module` object is also exported for direct access:
```javascript
import { WASMModule } from './web/SITL-Webassembly.js';

// Direct access to exported functions and memory
if (WASMModule) {
    const result = WASMModule.ccall('myFunction', 'number', [], []);
    const ptr = WASMModule._malloc(256);
    // ... use HEAP8, HEAP32, etc.
}
```

**Command Line Arguments (mirrored from native SITL):**
- `--path=FILE` - EEPROM file path
- `--sim=TYPE` - Simulator (realflight, xplane)
- `--useimu` - Use IMU simulation
- `--simip=IP` - Simulator IP
- `--simport=PORT` - Simulator port
- `--chanmap=MAP` - Channel mapping
- `--serialport=PORT` - Serial port for RX
- `--baudrate=RATE` - Serial baud rate
- `--stopbits=BITS` - Stop bits (One, Two)
- `--parity=PAR` - Parity (None, Even, Odd)
- `--fcproxy` - Use Flight Controller Proxy
- `--serialuart=N` - UART index for serial

---

## Code Patterns

- **jQuery** for DOM manipulation
- **Callbacks** for async (some Promises)
- **i18next** via `data-i18n` attributes: `<span data-i18n="key"></span>`
- **ES6 modules** throughout (`import`/`export`)

## Debugging

```bash
NODE_ENV=development yarn start   # Dev mode (Electron)
# Press Ctrl+Shift+I for DevTools
```

---

## Progressive Web App (PWA) Migration

### Current Status
The project is transitioning from **Electron-only desktop application** to a **dual-mode application** supporting both:
1. **Electron Desktop** - Native Windows/macOS/Linux application
2. **Web/PWA** - Progressive Web App running in modern browsers

**Branch:** `PWA` | **PR:** [#2448 Configurator as Web APP (PWA)](https://github.com/iNavFlight/inav-configurator/pull/2448) | **Status:** Work in Progress

### Key PWA Features Implemented

#### 1. **Bridge Pattern** (`js/bridge.js`)
Abstraction layer that detects runtime (Electron vs Browser) and provides unified API:

```javascript
bridge.isElectron  // boolean: true if running in Electron
bridge.serialEvents  // EventTarget for serial data events
```

**Abstracts:**
- Serial communication (Web Serial API vs Electron IPC)
- File I/O (File System Access API vs Electron `readFile`/`writeFile`)
- Storage (localStorage vs Electron `electron-store`)
- App version/locale info
- CORS proxy handling

#### 2. **Vite + Vite-PWA** (`vite.config.js`)
Replaces Webpack with **Vite** for faster development:
- **Hot module replacement (HMR)** for instant reload
- **Service Worker** auto-generation via `vite-plugin-pwa`
- Offline support with workbox
- App manifest with PWA icons (192px, 512px)
- 10MB max file size caching

```bash
yarn pwa:dev      # Start dev server (localhost:8001)
yarn pwa:build    # Production build (./dist)
yarn pwa:preview  # Preview production build
```

#### 3. **Web APIs Integration**

| Feature | Electron | Web/PWA |
|---------|----------|---------|
| Serial | `window.electronAPI.serialConnect()` | `navigator.serial.requestPort()` |
| Files | `window.electronAPI.readFile()` | File System Access API or `<input type="file">` |
| Storage | `electron-store` | `localStorage` / Bridge layer |
| USB DFU | IPC to main process | WebUSB API |
| Dialogs | `electron.dialog.showOpenDialog()` | `window.showOpenFilePicker()` |

#### 4. **Conditional Tab Loading**
All tabs now use **ES6 imports** instead of dynamic loading via promises:

```javascript
// OLD (dynamic):
import('./../tabs/firmware_flasher').then(() => TABS.firmware_flasher.initialize(callback))

// NEW (pre-imported):
import firmwareFlasherTab from './../tabs/firmware_flasher.js'
firmwareFlasherTab.initialize(callback)
```

Each tab exports itself as default:
```javascript
// tabs/cli.js
const cliTab = { ... }
cliTab.initialize = function(callback) { ... }
export default cliTab
```

#### 5. **CORS Proxy**
For PWA, firmware downloads use **Cloudflare Worker proxy** to bypass CORS:
```javascript
// OLD: Direct GitHub raw.githubusercontent.com URL
// NEW: bridge.proxy(url) → https://proxy.inav.workers.dev/?url=...
```

### Known Limitations & TODO

| Feature | Status | Notes |
|---------|--------|-------|
| **MSP Serial** | ✅ Working | WebSerial API |
| **DFU Flashing** | ✅ Working | WebUSB API |
| **File Load/Save** | ✅ Working | File API with chunks (1MB for web) |
| **Tabs** | ✅ Mostly | All major tabs converted |
| **SITL** | ❌ Limited | TCP/UDP not supported in browsers. WebAssembly SITL in development |
| **Demo Mode** | ✅ Partial | Function-call based simulation |
| **Update Notifications** | ⚠️ Disabled | Only for Electron |
| **Logging** | ⚠️ Partial | Web version chunks files to 1MB |
| **App Updater** | ❌ N/A | Web version auto-updates via SW |

### Architecture Changes for PWA

#### GUI Global Changes (`js/gui.js`)
- **Before:** `export { GUI, TABS }` + dynamic imports
- **After:** `export default GUI` + static imports in `configurator_main.js`
- `TABS` object removed; tabs are now objects with `.initialize()` and `.cleanup()` methods

#### Localization (`js/localization.js`)
```javascript
// Uses bridge to detect app locale
const locale = bridge.getAppLocale()  // Electron: app.getLocale() | Web: navigator.language
```

#### Storage Pattern (`js/*.js`)
All storage now routes through **bridge**:
```javascript
// OLD: store.get('key', default)
// NEW: bridge.storeGet('key', default)
//      → Electron: electron-store
//      → Web: localStorage

bridge.storeSet(key, value)      // Write
bridge.storeGet(key, default)    // Read
bridge.storeDelete(key)          // Delete
```

### Connection Layer Changes

#### Serial Connection (`js/connection/connectionSerial.js`)
```javascript
// OLD: window.electronAPI.onSerialData(callback)
// NEW: bridge.serialEvents.addEventListener('data', callback)
//      → Electron: IPC listener wrapped in CustomEvent
//      → Web: Direct WebSerial event forwarding
```

#### Dialog/File API (`js/dialog.js`)
```javascript
// showOpenDialog now abstracts:
// Electron → window.electronAPI.showOpenDialog()
// Web → window.showOpenFilePicker()
//       Returns: { canceled, files[], error }
```

### Build & Deployment

#### Development
```bash
# Electron desktop mode
yarn start

# Web/PWA mode  
yarn pwa:dev  # http://localhost:8001
```

#### Production
```bash
# Make desktop installers (MSI, DMG, DEB, RPM)
yarn make

# Build PWA
yarn pwa:build  # Creates ./dist with SW

# Deploy PWA (using gh-pages)
yarn pwa:deploy  # Pushes to github.com/iNavFlight/inav-configurator/gh-pages
```

### Testing the PWA

1. **Local Testing:**
   ```bash
   yarn pwa:dev
   # Open http://localhost:8001
   # DevTools → App → Service Workers → check "offline"
   ```

2. **Production Preview:**
   ```bash
   yarn pwa:preview  # http://localhost:8081
   ```

3. **HTTPS Requirement:**
   - Service Workers only work on `https://` (or `localhost`)
   - Live PWA: https://scavanger.github.io/inav-configurator/

### Known Issues & Workarounds

| Issue | Workaround |
|-------|-----------|
| TCP/UDP not available in web | Use SITL WebAssembly or demo mode |
| File append operations | Web version chunks to 1MB max per file |
| Firmware download CORS | Use Cloudflare proxy in `bridge.proxy()` |
| Update checks | Disabled in PWA; relies on Service Worker auto-update |
| BLE (Bluetooth) | Works in web with `navigator.bluetooth` |

### Code Migration Checklist

When converting Electron-only code to PWA-compatible:

- [ ] Replace `window.electronAPI.*` calls with `bridge.*`
- [ ] Replace `import store from './store'` with `import bridge from './bridge'`
- [ ] Replace `import { GUI, TABS } from './gui'` with `import GUI from './gui'`
- [ ] Update dynamic tab imports to static imports
- [ ] Add `.js` extension to all ES6 imports
- [ ] Test in both Electron and browser modes
- [ ] Ensure proper error handling for unsupported APIs

---

## SITL WebAssembly Implementation

### File: `js/web/SITL-Webassembly.js`

Complete WASM SITL management module with full API for starting/stopping simulator and accessing exported C functions.

**Key Features:**
- ✅ Initialize WASM module from `js/web/SITL/inav_WASM.js`
- ✅ Start/stop simulator with command-line arguments
- ✅ Support for custom logging (onLog callback)
- ✅ Direct access to WASM Module object (ccall, memory, etc.)
- ✅ Memory read operations (readMemory)
- ✅ Full argument compatibility with native SITL

**API Reference:**

```javascript
import SITLWebAssembly from './web/SITL-Webassembly.js';

// 1. Initialize
await SITLWebAssembly.init(moduleConfig, callback)
// moduleConfig: { locateFile, onRuntimeInitialized, ... }

// 2. Start simulation
SITLWebAssembly.start(options, callback)
// options: { eepromFile, sim, simIp, simPort, serialPort, protocol, ... }

// 3. Stop simulation
SITLWebAssembly.stop(callback)

// 4. Access Module and C functions
const module = SITLWebAssembly.getModule()
const result = SITLWebAssembly.callCFunction(funcName, returnType, argTypes, args)

// 5. Read WASM memory
const data = SITLWebAssembly.readMemory(address, length)

// 6. Status checks
if (SITLWebAssembly.isRunning()) { ... }
if (SITLWebAssembly.isLoading()) { ... }

// 7. Reset state
SITLWebAssembly.reset()
```

**Example Usage:**
```javascript
// Initialize and start with options matching native SITL
await SITLWebAssembly.init({}, (err) => {
    if (!err) {
        SITLWebAssembly.start({
            eepromFile: 'sitl.eeprom',
            sim: 'realflight',
            useIMU: false,
            simIp: '127.0.0.1',
            simPort: 49000,
            proxyPort: 8081
        }, (err, cmd) => {
            if (!err) console.log('Started:', cmd);
        });
    }
});

// Set custom logging
SITLWebAssembly.onLog = (text) => {
    document.getElementById('log').textContent += text + '\n';
};

// Call exported C function
const result = SITLWebAssembly.callCFunction('getSensorValue', 'number', ['number'], [0]);

// Stop when done
SITLWebAssembly.stop(() => console.log('Stopped'));
```

**Module Export:**
The `Module` object is exported for direct access to Emscripten-exposed functions:
```javascript
import { WASMModule } from './web/SITL-Webassembly.js';

if (WASMModule && WASMModule.ccall) {
    const val = WASMModule.ccall('function', 'number', [], []);
}
```

**Build Configuration:** (vite.config.js)
```javascript
// Included in assetsInclude
assetsInclude: ['**/*.wasm']

// Copy WASM files to dist
copy({
  targets: [
    { src: "js/web/SITL/**/*", dest: "dist/js/web/SITL" },
  ]
})

// Include in Service Worker cache
globPatterns: ['**/*.{js,css,wasm,...}']
```

**See Also:**
- [Examples](js/web/SITL-Webassembly.examples.js) - 8 detailed usage examples
- [Native SITL](js/sitl.js) - Reference implementation (Electron)
- [WASM Module](js/web/SITL/inav_WASM.js) - Generated Emscripten code

---

## Resources

- [INAV Firmware](https://github.com/iNavFlight/inav)
- [INAV Wiki](https://github.com/iNavFlight/inav/wiki)
- [INAV Discord](https://discord.gg/peg2hhbYwN)
- [Electron Docs](https://www.electronjs.org/docs)
- **PWA:**
  - [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API)
  - [WebUSB API](https://developer.mozilla.org/en-US/docs/Web/API/WebUSB_API)
  - [Vite PWA](https://vite-pwa-org.netlify.app/)
  - [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- **WebAssembly:**
  - [Emscripten Docs](https://emscripten.org/docs/)
  - [Emscripten API](https://emscripten.org/docs/api_reference/index.html)
  - [WebAssembly Spec](https://webassembly.org/)
- **Active PR:** https://github.com/iNavFlight/inav-configurator/pull/2448
