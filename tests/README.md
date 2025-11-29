# Testing Guide for INAV Configurator

This document describes the testing infrastructure and how to write tests for the INAV Configurator.

## Overview

The test suite includes:

- **Unit Tests**: Fast, isolated tests for individual functions
- **Integration Tests**: Tests using real SITL for MSP protocol validation

## Test Tools

| Layer | Tool | Purpose |
|-------|------|---------|
| Unit/Integration | [Vitest](https://vitest.dev/) | Fast test runner with native ES module support |
| Coverage | @vitest/coverage-v8 | Code coverage reporting |

### Why Vitest over Jest?

- Native ES module support (the project uses `"type": "module"`)
- Vite-native integration (project uses Vite for bundling)
- Faster execution with smart watch mode
- Compatible Jest API for easy migration

## Running Tests

```bash
# Run all unit/integration tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Directory Structure

```
tests/
├── unit/                    # Unit tests
│   ├── helpers.test.js      # Tests for js/helpers.js
│   └── bitHelper.test.js    # Tests for js/bitHelper.js
├── integration/             # Integration tests
│   └── sitl-connection.test.js  # Real SITL MSP protocol tests
└── helpers/                 # Test helpers
    └── sitl.js              # SITL process management
```

## Writing Unit Tests

Unit tests should be fast and isolated. Test one function or module at a time.

### Example

```javascript
// tests/unit/example.test.js
import { describe, it, expect } from 'vitest';
import { myFunction } from '../../js/myModule.js';

describe('myModule', () => {
    describe('myFunction', () => {
        it('returns expected value for valid input', () => {
            expect(myFunction(5)).toBe(10);
        });

        it('handles edge cases', () => {
            expect(myFunction(0)).toBe(0);
            expect(myFunction(-1)).toBe(-2);
        });
    });
});
```

### Best Practices

- Test file names should match source: `helpers.js` → `helpers.test.js`
- Use descriptive test names that explain the expected behavior
- Follow AAA pattern: Arrange, Act, Assert
- Keep tests focused and independent

## Writing Integration Tests

Integration tests verify that multiple components work together correctly.

### Using SITL (Recommended)

For realistic integration testing, use the INAV SITL (Software In The Loop) - a real copy of the firmware running on your machine. This provides accurate MSP protocol behavior without needing hardware.

**Prerequisites:**
```bash
# Build SITL (one-time)
# Assumes inav repo is sibling to inav-configurator
cd ../inav
mkdir -p build && cd build
cmake -DSITL=ON ..
make SITL.elf -j$(nproc)
```

**Using SITL in tests:**
```javascript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import sitlHelper from '../helpers/sitl.js';

describe('SITL Integration', () => {
    beforeAll(async () => {
        await sitlHelper.start();
    }, 15000);

    afterAll(async () => {
        await sitlHelper.stop();
    });

    it('connects to real FC', async () => {
        const isReady = await sitlHelper.isReady();
        expect(isReady).toBe(true);
    });
});
```

The SITL helper (`tests/helpers/sitl.js`) manages starting/stopping the SITL process and provides connection info (localhost:5761).

The helper expects the SITL binary at `../inav/build/bin/SITL.elf` (relative to configurator root).

## Code Coverage

Run coverage report:

```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory:
- `coverage/index.html` - HTML report (open in browser)
- Terminal output shows summary

## Debugging Tests

```bash
# Run specific test file
npx vitest run tests/unit/helpers.test.js

# Run tests matching pattern
npx vitest run -t "constrain"

# Debug mode
npx vitest --inspect-brk
```

## Adding New Tests

1. Create test file in appropriate directory (`unit/`, `integration/`)
2. Import the module under test
3. Write tests following existing patterns
4. Run `npm test` to verify
5. Run `npm run test:coverage` to check coverage impact

## Troubleshooting

### "Cannot find module" errors
- Check import paths are correct
- Ensure `.js` extension is included for ES modules

### SITL tests skipped
- Build SITL binary: see Prerequisites above
- Verify binary exists at `../inav/build/bin/SITL.elf`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/write-tests)
