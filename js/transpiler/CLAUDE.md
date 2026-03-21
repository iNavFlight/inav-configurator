# INAV JavaScript Programming Feature

This document describes the JavaScript Programming feature that allows users to write
JavaScript code instead of manually configuring INAV Logic Conditions.

## What This Feature Does

INAV flight controllers have a "Logic Conditions" system - a low-level programming
feature using numeric operation codes, operand types, and slot indices. It's powerful
but hard to use. This feature provides a JavaScript interface that compiles to Logic
Conditions, making the programming accessible to regular users.

**User writes:**
```javascript
if (flight.cellVoltage < 350) {
  override.throttleScale = 50;
}
```

**Transpiler generates:**
```
logic 0 1 -1 3 2 5 0 350 0    # cellVoltage < 350
logic 1 1 0 23 0 0 0 50 0     # throttleScale = 50 (activated by LC 0)
```

## Directory Structure

```
js/transpiler/
├── index.js              # Module entry point, re-exports Transpiler
├── api/                  # API definitions (what JS properties map to what operands)
│   ├── definitions/      # flight.js, rc.js, waypoint.js, override.js, etc.
│   └── types.js          # TypeScript definitions for Monaco autocomplete
├── editor/               # Monaco editor integration
│   ├── monaco_loader.js  # Editor setup and configuration
│   └── diagnostics.js    # Real-time error highlighting
├── examples/             # Example code snippets shown in UI dropdown
├── scripts/              # Build scripts (generate-constants.js)
└── transpiler/           # Core transpiler logic (see below)

tabs/
├── javascript_programming.js   # Tab controller, UI logic, MSP communication
└── javascript_programming.html # Tab HTML template
```

## Transpiler Pipeline

The transpiler has three main phases:

### 1. Parser (`parser.js`)
- Uses Acorn to parse JavaScript into AST
- Transforms full AST into simplified "INAV AST" with only supported constructs
- Extracts `if` statements, assignments, function calls
- Uses `expression_utils.js` for shared AST-to-string conversion

### 2. Analyzer (`analyzer.js`)
- Validates the simplified AST
- Checks property access (`flight.foobar` → error if not valid)
- Validates operand ranges (`gvar[99]` → error)
- Uses `property_access_checker.js` for validation

### 3. Code Generator (`codegen.js`)
- Converts simplified AST to INAV Logic Condition commands
- Delegates to helper classes:
  - `condition_generator.js` - Generates conditions (`>`, `<`, `===`, `&&`, `||`)
  - `action_generator.js` - Generates actions (`gvar[0] = x`, `override.vtx.power = 3`)
  - `expression_generator.js` - Handles `Math.min`, `Math.max`, arithmetic

### 4. Optimizer (`optimizer.js`)
- Applies Common Subexpression Elimination (CSE)
- Reuses duplicate conditions instead of regenerating them

## Decompiler Pipeline

The decompiler reverses the process - it reads Logic Conditions from the flight
controller and generates readable JavaScript:

### `decompiler.js`
- Main decompiler class
- Builds tree structure from flat LC array (using activator relationships)
- Detects special patterns (sticky, edge, timer)
- Delegates to helpers:
  - `condition_decompiler.js` - Decompiles conditions back to JS expressions
  - `action_decompiler.js` - Decompiles actions back to JS statements

## API Definitions

The `api/definitions/` folder is the **single source of truth** for what JavaScript
properties are available and how they map to INAV operands:

- `flight.js` - Read-only flight data (altitude, speed, voltage, GPS, etc.)
- `rc.js` - RC channel values and states (rc[1].high, rc[1].value)
- `waypoint.js` - Waypoint mission data
- `pid.js` - PID controller outputs
- `override.js` - Writable overrides (throttle, VTX, heading, etc.)
- `helpers.js` - Helper functions (sticky, edge, delay, timer)
- `events.js` - Event handlers (currently unused)

## Key Design Decisions

### String-Based Intermediate Representation
The parser converts AST nodes to strings like `"gvar[0]"` or `"flight.altitude"`.
This simplified IR is passed between parser and codegen. Codegen then parses these
strings to determine operand types. This is intentional - it simplifies the IR.

### Structural Pattern Matching in Decompiler
The decompiler inspects LC operation codes directly rather than string-parsing
decompiled output. For example, `handleNot()` checks if the referenced LC is
`OPERATION.EQUAL` to output `!==` instead of regex-matching `"x === 0"`.

### Activator Chaining for AND
INAV uses "activators" - an LC only evaluates when its activator LC is true.
For `a && b && c`, the transpiler chains: LC0=a, LC1=b (activator=0), LC2=c (activator=1).
This is more efficient than explicit AND operations.

## Testing

Tests are in `transpiler/tests/`. Run with:
```bash
node js/transpiler/transpiler/tests/run_decompiler_tests.cjs
node js/transpiler/transpiler/tests/run_comparison_operators_tests.cjs
# etc.
```

Most changes should start by writing a compile-decompile-compare round-trip test, which will fail at first.
After writing the failing test, write the feature / code. The test should then pass.

## UI Integration

`tabs/javascript_programming.js` integrates everything:
1. Loads Logic Conditions from FC via MSP
2. Decompiles them to JavaScript for editing
3. On "Save", transpiles JavaScript back to Logic Conditions
4. Sends Logic Conditions to FC via MSP


## Important references:
* ../inav/src/main/programming/*
* "../inav/docs/Programming\ Framework.md"

## Update documentation
When updating this code, update as necessary:
- the examples in js/transpiler/examples/
- the docs in ../../../inav/docs/javascript_programming/
- the wiki page at ../../../inavwiki/Javascript‐Programming.md

## Update this file
If your work changes any of the above information, update this file to keep it current.
If prompted to update documentation, update this file as needed - but keep it concise

