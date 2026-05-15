/**
 * Diagnostics Tests
 *
 * Tests for the Monaco diagnostics provider.
 * Bug #27: getDefinition() function is called but not defined, causing crashes.
 */

'use strict';

require('./simple_test_runner.cjs');

const fs = require('fs');
const path = require('path');

const diagnosticsPath = path.join(__dirname, '../../editor/diagnostics.js');
let diagnosticsContent;

async function loadModules() {
  diagnosticsContent = fs.readFileSync(diagnosticsPath, 'utf8');
}

describe('Diagnostics', () => {

  test('getDefinition should be defined before use', () => {
    // Check if getDefinition is called
    const usesGetDefinition = diagnosticsContent.includes('getDefinition(');

    if (usesGetDefinition) {
      // If it's used, it should be defined or imported
      const isDefinedAsFunction = diagnosticsContent.match(/function\s+getDefinition\s*\(/);
      const isDefinedAsConst = diagnosticsContent.match(/const\s+getDefinition\s*=/);
      const isDefinedAsLet = diagnosticsContent.match(/let\s+getDefinition\s*=/);
      const isImported = diagnosticsContent.match(/import\s+.*getDefinition/);
      const isCommentedOut = diagnosticsContent.match(/\/\/.*getDefinition\(/);

      // Count calls vs commented references
      const allCalls = diagnosticsContent.match(/getDefinition\(/g) || [];
      const commentedCalls = diagnosticsContent.match(/\/\/.*getDefinition\(/g) || [];

      const activeCalls = allCalls.length - commentedCalls.length;

      const isDefined = isDefinedAsFunction || isDefinedAsConst || isDefinedAsLet || isImported;

      // If there are active (non-commented) calls, it must be defined
      if (activeCalls > 0) {
        expect(isDefined).toBe(true);
      }
    }
  });

  test('isWritable should be defined before use', () => {
    // Check if isWritable is called
    const usesIsWritable = diagnosticsContent.includes('isWritable(');

    if (usesIsWritable) {
      // If it's used, it should be defined or imported
      const isDefinedAsFunction = diagnosticsContent.match(/function\s+isWritable\s*\(/);
      const isDefinedAsConst = diagnosticsContent.match(/const\s+isWritable\s*=/);
      const isDefinedAsLet = diagnosticsContent.match(/let\s+isWritable\s*=/);
      const isImported = diagnosticsContent.match(/import\s+.*isWritable/);

      // Count calls vs commented references
      const allCalls = diagnosticsContent.match(/isWritable\(/g) || [];
      const commentedCalls = diagnosticsContent.match(/\/\/.*isWritable\(/g) || [];

      const activeCalls = allCalls.length - commentedCalls.length;

      const isDefined = isDefinedAsFunction || isDefinedAsConst || isDefinedAsLet || isImported;

      // If there are active (non-commented) calls, it must be defined
      if (activeCalls > 0) {
        expect(isDefined).toBe(true);
      }
    }
  });

});

module.exports = { loadModules };
