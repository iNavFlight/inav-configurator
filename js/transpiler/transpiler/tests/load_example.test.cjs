/**
 * Load Example Tests
 *
 * Tests for the loadExample function behavior.
 * Bug #19: loadExample() doesn't check isDirty before overwriting user's code.
 */

'use strict';

require('./simple_test_runner.cjs');

const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, '../../../../tabs/javascript_programming.js');
let jsContent;

async function loadModules() {
  jsContent = fs.readFileSync(jsPath, 'utf8');
}

describe('Load Example', () => {

  test('loadExample should check isDirty before overwriting editor content', () => {
    // Find the loadExample function
    const loadExampleMatch = jsContent.match(/loadExample:\s*function\s*\([^)]*\)\s*\{([\s\S]*?)(?=\n    \w+:\s*function|\n    cleanup:|\n\};)/);

    expect(loadExampleMatch).not.toBeNull();

    const loadExampleBody = loadExampleMatch[1];

    // Must CHECK isDirty (read it), not just SET it
    // Pattern: if (... isDirty ...) or if (self.isDirty) etc.
    const checksIsDirty = loadExampleBody.match(/if\s*\([^)]*isDirty/);

    // Check if it has a confirm dialog (which implies checking something)
    const hasConfirm = loadExampleBody.includes('confirm(');

    // Should check isDirty AND have a confirm dialog to warn user
    const hasProtection = checksIsDirty && hasConfirm;

    expect(hasProtection).toBe(true);
  });

});

module.exports = { loadModules };
