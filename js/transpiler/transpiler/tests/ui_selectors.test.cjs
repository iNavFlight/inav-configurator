/**
 * UI Selector Tests
 *
 * Tests that JavaScript selectors match the HTML element IDs.
 * Bug #25: The change event was bound to #js-example-select (container div)
 * instead of #examples-select (the actual select element).
 */

'use strict';

require('./simple_test_runner.cjs');

const fs = require('fs');
const path = require('path');

// Read the files
const jsPath = path.join(__dirname, '../../../../tabs/javascript_programming.js');
const htmlPath = path.join(__dirname, '../../../../tabs/javascript_programming.html');

let jsContent;
let htmlContent;

async function loadModules() {
  jsContent = fs.readFileSync(jsPath, 'utf8');
  htmlContent = fs.readFileSync(htmlPath, 'utf8');
}

describe('UI Selectors', () => {

  test('example dropdown change handler should bind to select element, not container', () => {
    // Find the .change() handler for example selector
    const changeHandlerMatch = jsContent.match(/\$\(['"]#([^'"]+)['"]\)\.change\s*\(\s*function/g);

    expect(changeHandlerMatch).not.toBeNull();

    // Extract the selector ID from the change handler
    const selectorMatch = jsContent.match(/\$\(['"]#([^'"]+)['"]\)\.change\s*\(\s*function/);
    const selectorId = selectorMatch[1];

    // Check what type of element this ID refers to in HTML
    const htmlElementMatch = htmlContent.match(new RegExp(`id="${selectorId}"[^>]*>`));

    expect(htmlElementMatch).not.toBeNull();

    // The element should be a <select>, not a <div>
    const isSelectElement = htmlContent.includes(`<select id="${selectorId}"`);
    const isDivElement = htmlContent.includes(`<div`) && htmlContent.includes(`id="${selectorId}"`);

    // This test should FAIL if change handler is bound to div instead of select
    expect(isSelectElement).toBe(true);
  });

  test('loadExamples should use same selector as change handler', () => {
    // Find the selector used in the change handler
    const changeMatch = jsContent.match(/\$\(['"]#([^'"]+)['"]\)\.change/);
    const changeSelectorId = changeMatch ? changeMatch[1] : null;

    // Find the selector used in loadExamples
    const loadExamplesMatch = jsContent.match(/loadExamples[\s\S]*?\$\(['"]#([^'"]+)['"]\)/);
    const loadExamplesSelectorId = loadExamplesMatch ? loadExamplesMatch[1] : null;

    expect(changeSelectorId).not.toBeNull();
    expect(loadExamplesSelectorId).not.toBeNull();

    // Both should reference the same element (the actual select)
    // Currently this fails because change uses #js-example-select and loadExamples uses #examples-select
    expect(changeSelectorId).toBe(loadExamplesSelectorId);
  });

});

module.exports = { loadModules };
