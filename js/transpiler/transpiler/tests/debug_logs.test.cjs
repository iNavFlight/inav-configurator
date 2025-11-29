/**
 * Debug Logs Tests
 *
 * Tests that debug console.log statements are removed or gated.
 * Bug #24: Multiple console.log("finished transpile() step N") statements
 * spam the console during normal operation.
 */

'use strict';

require('./simple_test_runner.cjs');

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../index.js');
let indexContent;

async function loadModules() {
  indexContent = fs.readFileSync(indexPath, 'utf8');
}

describe('Debug Logs', () => {

  test('transpile() should not have debug step logging', () => {
    // Find debug statements like: console.log("finished transpile() step N")
    const debugStepLogs = indexContent.match(/console\.log\s*\(\s*["']finished transpile/g);

    // Should have zero such debug logs
    const count = debugStepLogs ? debugStepLogs.length : 0;
    expect(count).toBe(0);
  });

  test('production code should not have excessive console.log calls', () => {
    // Count console.log calls in the file
    const allLogs = indexContent.match(/console\.log\s*\(/g) || [];

    // Allow some logging, but not excessive (e.g., more than 5)
    // Debug step logs (4) + maybe a few legitimate ones
    expect(allLogs.length).toBeLessThan(5);
  });

});

module.exports = { loadModules };
