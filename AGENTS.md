# AGENTS.md - Guide for AI Agents Working with INAV Configurator

## Project Overview

**INAV Configurator** is a cross-platform Electron desktop application for configuring INAV flight controller firmware. It supports multirotors, fixed-wing aircraft, rovers, and boats.

### Key Characteristics
- **Type**: Desktop GUI application (Electron)
- **Language**: JavaScript (ES6 modules)
- **Tech Stack**: Electron + Vite (via Electron Forge) + jQuery + i18next
- **Package Manager**: `yarn` (see `yarn.lock`)
- **License**: GNU GPL v3
- **Version**: see the `version` field in `package.json` for the current version — don't hardcode it here, it drifts every release

## Architecture and Structure

### Data Flow

```
User → GUI Tab → MSP.send_message() → Serial Queue → Connection → Flight Controller
                                                                         ↓
User ← GUI Update ← FC state object ← MSP.decode() ← Serial Data ←──────┘
```

### Directory Structure

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
│   ├── connection/              # Connection layer (factory pattern)
│   │   ├── connectionSerial.js     # Serial port
│   │   ├── connectionTcp.js        # TCP/IP (SITL)
│   │   └── connectionBle.js        # Bluetooth LE
│   ├── msp/                     # MSP protocol helpers
│   │   ├── MSPCodes.js             # Command codes
│   │   └── MSPHelper.js            # Serialization/deserialization
│   └── transpiler/              # JavaScript Programming feature (see js/transpiler/CLAUDE.md)
├── tabs/                   # Per-tab controllers + HTML templates
├── src/css/                # Stylesheets
│   └── tabs/                    # Per-tab styles
├── locale/                 # i18n translations, one directory per locale
├── resources/              # 3D models, OSD fonts, SITL binaries
├── tests/                  # Test suite (node --test + transpiler-specific runners)
├── docs/development/       # Developer documentation (parallel to inav/docs/development/)
├── index.html              # Single-page app entry
├── forge.config.js         # Electron Forge build config
└── vite.*.config.js        # Vite build configs
```

### Key Subsystems

1. **Connection Layer** (`js/connection/`): Factory pattern abstracts serial, TCP, UDP, BLE
2. **MSP Protocol** (`js/msp/`): Binary protocol for FC communication (V1/V2 variants)
3. **FC State** (`js/fc.js`): Central state object (CONFIG, PID, SENSOR_DATA, GPS_DATA, etc.)
4. **Tab System** (`js/gui.js`): Tabs load dynamically; separate tabs for connected vs disconnected states
5. **Transpiler** (`js/transpiler/`): Compiles a JavaScript subset to INAV Logic Conditions — has its own `CLAUDE.md` with pipeline details; don't duplicate that here

## Coding Conventions

### Code Patterns

- **jQuery** for DOM manipulation
- **Callbacks** for async (some Promises) — see [`docs/development/patterns/msp-async-data-access.md`](docs/development/patterns/msp-async-data-access.md) for the async-data-race pattern to avoid
- **i18next** via `data-i18n` attributes: `<span data-i18n="key"></span>`
- **ES6 modules** throughout (`import`/`export`)

### MSP Request Pattern

```javascript
MSP.send_message(MSPCodes.MSP_SOME_CODE, payload, false, () => {
    // FC state already updated, refresh UI here
    updateUIFromState(FC.SOME_DATA);
});
```

Never read the corresponding `FC.*` property synchronously right after firing the request — only inside the callback.

### CSS

Prefer letting the browser calculate natural sizes (`fit-content`, flexbox/grid, relative units like `em`) over forcing fixed pixel widths/font-sizes — fixed sizing has repeatedly caused cramped layouts and broken scaling in this codebase. Only force exact dimensions for things like images/icons that genuinely need it.

## Build System

```bash
yarn install    # Install dependencies
yarn start      # Run in development mode (hot reload)
yarn make       # Build distributable packages
```

| Platform | Command | Output |
|----------|---------|--------|
| Windows  | `yarn make --platform win32` | MSI installer |
| macOS    | `yarn make --platform darwin` | DMG |
| Linux    | `yarn make --platform linux` | DEB, RPM |

### Debugging

`js/main/main.js` has two independent, separately-gated debugging behaviors:

- Any dev run (`yarn start`, i.e. whenever `!app.isPackaged`) automatically opens a Chrome DevTools Protocol port (`CDP_PORT` env var, default 9222) — this happens regardless of `NODE_ENV`.
- `NODE_ENV=development` separately gates whether DevTools auto-opens on launch (`openDevTools()` on `ready-to-show`).

```bash
NODE_ENV=development yarn start   # Dev mode; also opens DevTools automatically on launch
# Press Ctrl+Shift+I for DevTools manually
```

If DevTools opens unexpectedly on what should be a packaged build, check whether `NODE_ENV=development` is set somewhere in the environment (e.g. a persisted system/user environment variable) rather than assuming it's a code bug — the check itself (`process.env.NODE_ENV === 'development'`) is a plain string comparison with no packaging-awareness of its own.

## Adding a New Tab

1. Create tab JS file with `initialize()` and `cleanup()` functions
2. Add the tab name to `defaultAllowedTabsWhenConnected`/`defaultAllowedTabsWhenDisconnected` in `js/gui.js`, and add a `case` for it in the tab-loading switch in `js/configurator_main.js`
3. Add CSS in `src/css/tabs/`
4. Add HTML link in `index.html` (mode-connected or mode-disconnected list)
5. Add translation keys to `locale/en/messages.json`

## Adding New MSP Commands

1. Add command code to `js/msp/MSPCodes.js`
2. Add serialize/deserialize logic to `js/msp/MSPHelper.js`
3. Add state property to `js/fc.js`
4. Use in relevant tab
5. If the corresponding firmware side needs changes too, that's a separate PR against `iNavFlight/inav` — MSP command codes and payload layouts must match on both sides

## Development Workflow

### Branching Strategy

Same model as firmware (`iNavFlight/inav`):

- **`maintenance-X.x`**: Current version development (e.g., `maintenance-9.x`)
- **`maintenance-Y.x`**: Next major version (e.g., `maintenance-10.x`)
- **`master`**: Not a development branch — don't branch from it or target it with a PR. Maintainers periodically merge the current maintenance branch into it (e.g. "Maintenance 9.x to master") to keep it as a lagging mirror, mainly as a safety net for anyone who clones the repo without knowing this branch model.

### Pull Request Guidelines

1. Target the current maintenance branch for bug fixes/backward-compatible features, the next major version's maintenance branch for breaking changes
2. Keep PRs focused — one feature/fix per PR
3. Follow existing code style; test on real hardware/SITL when possible
4. Clear, descriptive commit messages

## Testing

```bash
yarn test    # runs tests/transpiler/run_all_tests.cjs plus node --test over tests/*.test.mjs and tests/transpiler/*.test.mjs
```

See `tests/transpiler/TESTING_GUIDE.md` for the transpiler test suite specifically.

## Key Files by Importance

| File | Purpose |
|------|---------|
| `js/msp/MSPHelper.js` | MSP serialization/deserialization |
| `js/fc.js` | Flight controller state model |
| `js/serial_backend.js` | Connection management |
| `js/gui.js` | Tab switching, UI state |
| `js/configurator_main.js` | Application initialization |
| `tabs/osd.js` / `tabs/mission_control.js` | Largest individual tab controllers |

## Development Documentation

`docs/development/` is the canonical source for contributor-facing technical
docs on this repo — check it before assuming something isn't documented:

- `patterns/msp-async-data-access.md` - Avoiding MSP async data races

## AI Agent Guidelines

### When Adding Features

1. Check for a similar existing tab/pattern first, for consistency
2. If it touches MSP, check whether the firmware side (`iNavFlight/inav`) needs a matching change
3. Add translation keys — don't hardcode user-facing strings
4. Update documentation in `docs/development/` if you're introducing a new cross-file pattern

### When Fixing Bugs

1. Review recent git history for related modifications
2. For UI bugs, reproduce in dev mode (`yarn start`) before assuming the fix works
3. Check whether the bug is configurator-side or a firmware MSP response issue

### Common Pitfalls to Avoid

1. **Don't access `FC.*` data synchronously right after firing an MSP request** — only inside its callback (see `docs/development/patterns/msp-async-data-access.md`)
2. **Don't force fixed pixel sizes in CSS** — let the browser compute layout
3. **Don't target `master`** — target the current or next maintenance branch
4. **Don't assume firmware and configurator are always in lockstep** — check the corresponding firmware behavior/version when in doubt

## Resources

- **Main Repository**: https://github.com/iNavFlight/inav
- **This Repository**: https://github.com/iNavFlight/inav-configurator
- **Discord**: https://discord.gg/peg2hhbYwN
- **Documentation**: https://github.com/iNavFlight/inav/wiki

If you're an AI agent and want more context on how INAV development sessions
are commonly structured, see [`sensei-hacker/inav-claude`](https://github.com/sensei-hacker/inav-claude),
a multi-agent Claude Code framework built around this codebase and `iNavFlight/inav`.

## Version Information

As the project evolves, some details in this document may change. Always refer to the latest documentation and code for authoritative information.

---

**Remember**: this application configures aircraft that people build and fly. Correctness in MSP encoding/decoding and settings handling matters — a wrong value silently sent to the flight controller can affect flight safety.
