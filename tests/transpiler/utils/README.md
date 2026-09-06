# Test Utilities

This directory contains utilities for analyzing and testing the transpiler.

## Utilities

### compare_original_vs_roundtrip.mjs
Performs detailed comparison between original LCs and recompiled LCs after round-trip compilation (decompile → recompile).

**Usage:**
```bash
node js/transpiler/transpiler/tests/utils/compare_original_vs_roundtrip.mjs
```

**What it does:**
- Compares LC count
- Finds missing/extra operations
- Shows side-by-side comparison of all LCs
- Useful for identifying where optimizations occur

**Note:** This script uses the test file `../test-data/vtol-transistion-lcs.txt`. To analyze different LC sets, either replace this file or update the path in the script.

### functional_comparison.mjs
Checks functional equivalence between original and recompiled LCs by comparing actual outputs (RC overrides).

**Usage:**
```bash
node js/transpiler/transpiler/tests/utils/functional_comparison.mjs
```

**What it does:**
- Compares RC_OVERRIDE operations (actual outputs)
- Verifies all override values match
- Identifies eliminated optimizations
- Returns exit code 0 if functionally equivalent

**Use case:** Regression testing to ensure optimizations don't change behavior.

### find_unhoist_duplicates.mjs
Analyzes duplicate patterns in original LCs to identify optimization opportunities.

**Usage:**
```bash
node js/transpiler/transpiler/tests/utils/find_unhoist_duplicates.mjs
```

**What it does:**
- Finds duplicate operation patterns (ignoring activators)
- Shows which LCs share the same operation+operands
- Lists const variables in decompiled code
- Helps identify what should be hoisted

### analyze_remaining_gap.mjs
Analyzes the remaining LC gap between original and recompiled to identify optimization opportunities.

**Usage:**
```bash
node js/transpiler/transpiler/tests/utils/analyze_remaining_gap.mjs
```

**What it does:**
- Counts and compares operation types
- Identifies which operations are duplicated
- Shows which LCs contribute to the gap
- Useful for finding next optimization target

## Adding Your Own Test LCs

To test with different LC sets, you can:
1. Replace `../test-data/vtol-transistion-lcs.txt` with your own test data
2. Or update the file path in the scripts:

```javascript
const originalText = readFileSync(new URL('../test-data/your-lcs.txt', import.meta.url), 'utf-8');
```

The LC file format is standard INAV logic condition output:
```
logic 0 1 -1 1 2 31 0 1 0
logic 1 1 0 14 2 11 0 0 0
...
```

## Integration with CI/CD

These utilities can be integrated into automated testing:

```bash
# Run functional comparison and fail if not equivalent
node js/transpiler/transpiler/tests/utils/functional_comparison.mjs || exit 1
```
