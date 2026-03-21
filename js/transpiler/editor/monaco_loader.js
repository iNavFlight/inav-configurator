/**
 * Monaco Editor Loader for INAV Configurator
 * 
 * Handles loading Monaco Editor in Electron environment with proper AMD loader support.
 * This module is separate to keep the main javascript_programming.js cleaner.
 * 
 * Location: js/transpiler/editor/monaco_loader.js
 */

'use strict';

import apiDefinitions from '../api/definitions/index.js';
import { generateTypeDefinitions } from '../api/types.js';

/**
 * Initialize Monaco Editor with INAV-specific configuration
 * @param {Object} monaco - Monaco editor instance
 * @param {string} containerId - ID of the container element
 * @param {Object} options - Additional editor options
 * @returns {Object} Created editor instance
 */
function initializeMonacoEditor(monaco, containerId, options = {}) {
    const editorContainer = document.getElementById(containerId);
    if (!editorContainer) {
        throw new Error(`Monaco editor container '${containerId}' not found`);
    }
    
    // Default configuration
    const defaultOptions = {
        value: '// INAV JavaScript Programming\n// Write JavaScript, get INAV logic conditions!\n\nconst { flight, override, rc, gvar, on } = inav;\n\n// Example:\n// if (flight.homeDistance > 100) {\n//   override.vtx.power = 3;\n// }\n',
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        minimap: { enabled: true },
        scrollBeyondLastLine: false,
        fontSize: 14,
        lineNumbers: 'on',
        renderWhitespace: 'selection',
        tabSize: 2,
        insertSpaces: true,
        wordBasedSuggestions: 'off',  // Disable word-based suggestions (use string "off", not boolean)
        suggest: {
            showWords: false,
            showVariables: false  // Don't show local variables in autocomplete (prevents pollution)
        }
    };
    
    // Merge options
    const editorOptions = Object.assign({}, defaultOptions, options);
    
    // Create editor
    const editor = monaco.editor.create(editorContainer, editorOptions);
    
    // Set up TypeScript/JavaScript defaults for IntelliSense
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false
    });
    
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        esModuleInterop: true,
        allowJs: true,
        checkJs: false,
        lib: ['es2020']  // Only ES2020 core library (excludes DOM/browser APIs like navigator)
    });

    console.log('Monaco Editor initialized');

    return editor;
}

/**
 * Add INAV API type definitions to Monaco
 * @param {Object} monaco - Monaco editor instance
 */
function addINAVTypeDefinitions(monaco) {
    try {
        const typeDefinitions = generateTypeDefinitions(apiDefinitions);
        
        monaco.languages.typescript.javascriptDefaults.addExtraLib(
            typeDefinitions,
            'ts:inav.d.ts'
        );
        
        console.log('INAV API type definitions loaded');
        return true;
    } catch (error) {
        console.error('Failed to load INAV type definitions:', error);
        return false;
    }
}

/**
 * Set up real-time linting with debounce
 * @param {Object} editor - Monaco editor instance
 * @param {Function} lintCallback - Function to call for linting
 * @param {number} debounceMs - Debounce delay in milliseconds
 */
function setupLinting(editor, lintCallback, debounceMs = 500) {
    let lintTimeout;
    
    editor.onDidChangeModelContent(() => {
        clearTimeout(lintTimeout);
        lintTimeout = setTimeout(() => {
            if (typeof lintCallback === 'function') {
                lintCallback();
            }
        }, debounceMs);
    });
}

// Export functions
export {
    initializeMonacoEditor,
    addINAVTypeDefinitions,
    setupLinting
};
