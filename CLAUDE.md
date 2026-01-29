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


## Code Patterns

- **jQuery** for DOM manipulation
- **Callbacks** for async (some Promises)
- **i18next** via `data-i18n` attributes: `<span data-i18n="key"></span>`
- **ES6 modules** throughout (`import`/`export`)

## CSS Best Practices - CRITICAL

**Core Principle: Let the Browser Do Its Job**

Adding CSS to force specific sizes consistently causes problems. Removing that CSS and letting the browser calculate natural dimensions consistently produces better results.

### ❌ Don't Do This

```css
/* Don't force widths on containers */
.controls { width: 285px; }

/* Don't force button widths */
.button { width: 49%; }

/* Don't use pixels for font sizes */
.text { font-size: 16px; }
```

**Problems caused:**
- Fixed widths create cramped layouts, overlaps, and wasted space
- Forced button widths look unnatural
- Pixel font sizes don't scale across different display densities (200 DPI vs 800 DPI)
- Breaks user font size preferences and accessibility

### ✅ Do This Instead

```css
/* Let containers size naturally */
.controls { width: fit-content; }
/* Or just don't set width at all */

/* Let buttons size based on content */
/* Don't set width on buttons */

/* Use relative units for fonts */
.text { font-size: 1.2em; }
/* Or don't set font-size and use defaults */
```

**Results:**
- Layouts adapt naturally to content
- Elements look properly proportioned
- Text scales correctly across devices
- Respects user preferences

### The Pattern to Recognize

If you're writing CSS to force dimensions and encountering layout problems:

1. **Stop adding more CSS** to "fix" it
2. **Remove the size constraints** causing the problem
3. **Let the browser calculate** natural dimensions
4. **Only add back** minimal constraints if absolutely required

**Most of the time, removing CSS produces better results than adding more CSS.**

### When to Set Sizes

Only force sizes when there's a genuine need:
- Images/icons requiring exact dimensions
- `max-width` for text readability (e.g., `max-width: 80ch`)
- Specific design requirements (but question if they're necessary)

Use modern layout tools:
- **Flexbox** for flexible layouts with `gap`, `justify-content`, `align-items`
- **Grid** for two-dimensional layouts with `grid-template-columns`, `gap`
- **fit-content**, **auto**, **%** instead of fixed pixels

### Real Examples from LED Strip Redesign (2026-01-28)

All three of these problems were fixed by **removing CSS**, not adding more:

1. `.controls { width: 285px; }` → cramped step progress bar → **removed width rule**
2. `.button { width: 49%; }` → unnaturally wide buttons → **removed width rule**
3. `.step { font-size: 16px; }` → doesn't scale → **changed to font-size: 1.5em**

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
