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
 * Load Monaco Editor
 * @returns {Promise<Object>} Promise that resolves with monaco object
 */
function loadMonacoEditor() {
    return new Promise((resolve, reject) => {
        try {
            // Check if already loaded
            if (window.monaco) {
                resolve(window.monaco);
                return;
            }

            // In Vite/browser environment, use relative path to node_modules
            // Vite will handle module resolution
            const monacoBasePath = '/node_modules/monaco-editor';

            // Use the min build which includes everything
            const vsPath = monacoBasePath + '/min/vs';

            console.log('Loading Monaco from:', vsPath);

            // Monaco requires AMD loader, so use that directly
            loadMonacoViaAMD(vsPath, resolve, reject);
            
        } catch (error) {
            console.error('Failed to load Monaco Editor:', error);
            reject(error);
        }
    });
}

/**
 * Load Monaco via AMD loader (fallback method)
 * @param {string} vsPath - Path to Monaco's vs directory
 * @param {Function} resolve - Promise resolve function
 * @param {Function} reject - Promise reject function
 */
function loadMonacoViaAMD(vsPath, resolve, reject) {
    // Set global MonacoEnvironment before loading
    window.MonacoEnvironment = {
        getWorkerUrl: function(workerId, label) {
            return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
                self.MonacoEnvironment = {
                    baseUrl: '${vsPath}'
                };
                importScripts('${vsPath}/base/worker/workerMain.js');
            `)}`;
        }
    };

    const loaderScript = document.createElement('script');
    loaderScript.src = vsPath + '/loader.js';
    
    loaderScript.onerror = () => {
        reject(new Error('Failed to load Monaco loader.js'));
    };
    
    loaderScript.onload = () => {
        try {
            // Configure the loader
            window.require.config({
                paths: {
                    'vs': vsPath
                },
                'vs/nls': {
                    availableLanguages: {}
                }
            });
            
            // Load the editor
            window.require(['vs/editor/editor.main'], function() {
                // Monaco is now available as a global
                const monaco = window.monaco;
                
                if (!monaco || !monaco.editor) {
                    console.error('Monaco object not properly initialized');
                    reject(new Error('Monaco editor object not found'));
                    return;
                }
                
                console.log('Monaco loaded via AMD');
                resolve(monaco);
            }, function(err) {
                console.error('AMD require error:', err);
                reject(err);
            });
        } catch (err) {
            reject(err);
        }
    };
    
    document.head.appendChild(loaderScript);
}

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
        insertSpaces: true
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
        checkJs: false
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
    loadMonacoEditor,
    initializeMonacoEditor,
    addINAVTypeDefinitions,
    setupLinting
};
