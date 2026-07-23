# Pattern: MSP Async Data Access

## The Problem

Race conditions occur when code accesses MSP-loaded data before the response has been received and processed.

## Key Principle

- **DO** send MSP requests early (improves perceived performance)
- **DON'T** access the returned values until the response callback fires

## Bad Pattern

```javascript
// Tab initialization
mspHelper.loadSomeData();  // Fires async request

// Later in same sync execution...
doSomethingWith(FC.SOME_DATA);  // BUG: Data not loaded yet!
```

## Good Pattern

```javascript
// Tab initialization - fire request early
mspHelper.loadSomeData(function() {
    // Only access data inside the callback
    doSomethingWith(FC.SOME_DATA);
});
```

## Alternative: Centralized Update Function

If multiple pieces of data need to be loaded before UI updates:

```javascript
// Fire requests early, update UI in coordinated callback chain
OSD.reload(function() {
    // OSD.reload handles all MSP loading internally
    // Only called after ALL data is ready
    OSD.GUI.updateAll();  // Safe to access all OSD data here
});
```

## Real Example (`tabs/osd.js`)

`OSD.GUI.update()` is exactly this pattern: `OSD.reload(function() { OSD.GUI.updateAll(); })`.
Everything that depends on OSD/custom-element/logic-condition data being loaded
lives inside that callback or `OSD.reload()`'s own internal promise chain, not in
the tab's synchronous init path:

- `updatePilotAndCraftNames()` runs from inside `OSD.GUI.updateAll()`, so it only
  executes after `OSD.reload()`'s chain has completed. On tab load, `OSD.reload()`
  is itself only called once the async OSD-font load resolves (the font-picker's
  `import(...).then(...)` callback calls `OSD.GUI.update()`, which calls
  `OSD.reload()`) — so `updatePilotAndCraftNames()` executes only after both the
  font load and `OSD.reload()`'s chain have completed, not from tab init directly.
- Inside `OSD.reload()`, custom OSD elements and the Logic Conditions "configured"
  mask (`FC.LOGIC_CONDITIONS_CONFIGURED_MASK`, fetched via
  `MSP2_INAV_LOGIC_CONDITIONS_CONFIGURED`) are loaded in sequence, and
  `createCustomElements()` only runs once both steps have resolved (the LC-mask
  fetch has a `.catch()` fallback so a failure there doesn't block custom
  elements from rendering). `getLCoptions()` reads that same mask when populating
  LC dropdowns, guarded by `if (!mask) return result;` for the case where it
  hasn't loaded yet.

The lesson: when several independent MSP loads feed into the same UI update, chain
them (or gate the final step on all of them) rather than firing them off
separately and hoping they land before something else reads the result.

## How to Identify Similar Issues

1. **Error signature:** `Cannot read properties of undefined (reading 'xxx')`
2. **Location:** Usually in a function that accesses `FC.*` data structures
3. **Timing:** Occurs on tab load, especially with legacy/slower firmware
4. **Pattern:** Look for `mspHelper.load*()` calls without callbacks that are followed by code accessing that data

## Audit Checklist for Other Tabs

```bash
# Find zero-argument, no-callback MSP loads (only catches this narrower case)
grep -n "mspHelper\.load.*();" tabs/*.js

# Find where a specific FC.* property is read/written, scoped to one tab
grep -n "FC\.PROPERTY_NAME" tabs/some_tab.js
```

The first grep only catches loads with no callback at all — it will miss the more
common case in this codebase, where a callback *is* passed but two independent
async chains both end up touching the same data (see the `createCustomElements()`
case above: the bug wasn't a missing callback, it was two load paths racing each
other). There's no reliable grep for that shape; it needs a manual read of the
tab's init function and any `OSD.reload()`/similar aggregator it calls into.

Questions to ask:
1. Is this MSP data accessed before its load callback fires?
2. Is there a race between multiple async chains accessing the same data?
3. Should this function be moved into a callback chain, or into the aggregator
   that already sequences the other loads this data depends on?

## Related

- MSP responses are async - callback fires when response arrives
- JavaScript is single-threaded but async operations interleave
- Legacy firmware may respond slower, making races more likely to manifest
