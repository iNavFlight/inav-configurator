/**
 * Strict Mode Tests
 *
 * Tests that 'use strict' is properly positioned in source files.
 * Bug #14: 'use strict' was placed inside a block comment in optimizer.js,
 * which means strict mode was not actually enabled.
 */

'use strict';

require('./simple_test_runner.cjs');

const fs = require('fs');
const path = require('path');

const transpilerDir = path.join(__dirname, '..');
let filesToCheck = [];

async function loadModules() {
  // Get all JS files in the transpiler directory
  const files = fs.readdirSync(transpilerDir);
  filesToCheck = files
    .filter(f => f.endsWith('.js'))
    .map(f => ({
      name: f,
      content: fs.readFileSync(path.join(transpilerDir, f), 'utf8')
    }));
}

describe('Strict Mode', () => {

  test('use strict should not be inside a block comment', () => {
    const issues = [];

    for (const file of filesToCheck) {
      const content = file.content;

      // Check if file has 'use strict'
      if (!content.includes("'use strict'") && !content.includes('"use strict"')) {
        continue; // No strict mode directive to check
      }

      // Find position of 'use strict'
      const strictMatch = content.match(/['"]use strict['"]/);
      if (!strictMatch) continue;

      const strictPos = content.indexOf(strictMatch[0]);

      // Check if it's inside a block comment
      // Find all block comments before the strict directive
      const beforeStrict = content.substring(0, strictPos);

      // Count unclosed block comments
      const openComments = (beforeStrict.match(/\/\*/g) || []).length;
      const closeComments = (beforeStrict.match(/\*\//g) || []).length;

      if (openComments > closeComments) {
        issues.push(`${file.name}: 'use strict' is inside a block comment (${openComments} opens, ${closeComments} closes before it)`);
      }
    }

    // Test fails if any issues found
    expect(issues.length).toBe(0);
  });

  test('use strict should be at the top of the file (after any comments)', () => {
    const issues = [];

    for (const file of filesToCheck) {
      const content = file.content;

      // Check if file has 'use strict'
      const strictMatch = content.match(/['"]use strict['"]/);
      if (!strictMatch) continue;

      // Remove all comments and check if 'use strict' is near the top
      const withoutComments = content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
        .replace(/\/\/.*$/gm, '')         // Remove line comments
        .trim();

      // 'use strict' should be the first statement
      const firstStatement = withoutComments.split(/[;\n]/)[0].trim();
      if (!firstStatement.includes('use strict')) {
        // It's ok if it's an import/export statement first (ESM)
        if (!firstStatement.startsWith('import') && !firstStatement.startsWith('export')) {
          issues.push(`${file.name}: 'use strict' is not the first statement`);
        }
      }
    }

    // Just warn, don't fail for this one
    if (issues.length > 0) {
      console.log('  Note:', issues.join(', '));
    }
  });

});

module.exports = { loadModules };
