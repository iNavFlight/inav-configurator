/**
 * INAV JavaScript Programming Tab
 * 
 * Integrates Monaco Editor with INAV transpiler and MSP communication.
 */

'use strict';

const { GUI, TABS } = require('./../js/gui');
const path = require('path');
const i18n = require('./../js/localization');
// import { Transpiler } from './transpiler/index.js';
const Transpiler = require('./transpiler/index.js');

TABS.javascript_programming = {

    currentProgrammingPIDProfile: null,
    isDirty: false,
    editor: null,
    transpiler: null,
    currentCode: '',
    
    analyticsChanges: {},
    
    initialize: function (callback) {
        const self = this;
        
        if (GUI.active_tab !== 'javascript_programming') {
            GUI.active_tab = 'javascript_programming';
        }
        
        // Load HTML
        $('#content').load("./tabs/javascript_programming.html", function () {
            
            // Initialize transpiler
            self.initTranspiler();
            
            // Load Monaco Editor
            self.loadMonacoEditor(function() {
                
                // Set up UI event handlers
                self.setupEventHandlers();
                
                // Load examples dropdown
                self.loadExamples();
                
                // Load initial code from FC
                self.loadFromFC(function() {
                    
                    // Mark as clean
                    self.isDirty = false;
                    
                    GUI.content_ready(callback);
                });
            });
        });
    },
    
    /**
     * Initialize the transpiler
     */
    initTranspiler: function() {
        // In production, import the transpiler module
        // For now, assume it's available globally
        if (typeof Transpiler !== 'undefined') {
            this.transpiler = new Transpiler();
        } else {
            console.error('Transpiler not loaded');
            GUI.log('JavaScript transpiler not available');
        }
    },
    
    /**
     * Load Monaco Editor
     */
    loadMonacoEditor: function(callback) {
        const loader = require('@monaco-editor/loader');
        const monaco = require('monaco-editor');
        const self = this;

        if (typeof monaco !== 'undefined') {
            self.setupMonaco();
            callback();
        }
    },

/**
 * Load Monaco Editor from CDN
 */
    // Ray TODO - Remvoe this function if we load it locally
    loadMonacoEditorCDN: function(callback) {
        const self = this;
        
        // Check if Monaco is already loaded
        if (typeof monaco !== 'undefined') {
            self.setupMonaco();
            callback();
            return;
        }
        
        // Save Node.js require
        const nodeRequire = window.require;
        
        // Load Monaco Editor loader script
        const loaderScript = document.createElement('script');
        loaderScript.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
        
        loaderScript.onload = function() {
            // Now window.require is RequireJS's require (AMD)
            window.require.config({ 
                paths: { 
                    'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' 
                }
            });
            
            // Load Monaco editor main module
            window.require(['vs/editor/editor.main'], function() {
                // Restore Node.js require after Monaco loads
                window.require = nodeRequire;
                
                self.setupMonaco();
                callback();
            });
        };
        
        loaderScript.onerror = function() {
            console.error('Failed to load Monaco Editor');
            GUI.log('Failed to load Monaco Editor from CDN');
            
            // Restore Node.js require even on error
            window.require = nodeRequire;
            
            // Fallback: show a basic textarea
            self.createFallbackEditor();
            callback();
        };
        
        document.head.appendChild(loaderScript);
    },

    /**
     * Set up Monaco Editor with INAV JavaScript support
     */
    setupMonaco: function() {
        const self = this;
        
        // Configure JavaScript defaults
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false
        });
        
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true
        });
        
        // Add INAV API type definitions
        this.addINAVTypeDefinitions();
        
        // Create editor
        this.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
            value: this.getDefaultCode(),
            language: 'javascript',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 13,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            lineNumbers: 'on',
            glyphMargin: true,
            folding: true,
            renderLineHighlight: 'all',
            scrollbar: {
                vertical: 'visible',
                horizontal: 'visible'
            }
        });
        
        // Track changes
        this.editor.onDidChangeModelContent(() => {
            self.isDirty = true;
            self.currentCode = self.editor.getValue();
        });
        
        // Auto-transpile on Ctrl+S
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
            self.transpileCode();
        });
    },

    /**
     * Create a fallback basic editor if Monaco fails to load
     */
    createFallbackEditor: function() {
        const container = document.getElementById('monaco-editor');
        container.innerHTML = '';
        
        const textarea = document.createElement('textarea');
        textarea.style.width = '100%';
        textarea.style.height = '100%';
        textarea.style.fontFamily = 'monospace';
        textarea.style.fontSize = '13px';
        textarea.style.border = 'none';
        textarea.style.outline = 'none';
        textarea.style.padding = '10px';
        textarea.style.backgroundColor = '#1e1e1e';
        textarea.style.color = '#d4d4d4';
        textarea.value = this.getDefaultCode();
        
        container.appendChild(textarea);
        
        // Create a simple editor interface
        const self = this;
        this.editor = {
            getValue: () => textarea.value,
            setValue: (value) => { textarea.value = value; },
            onDidChangeModelContent: (cb) => { textarea.addEventListener('input', cb); },
            addCommand: () => {},
            dispose: () => {}
        };
        
        textarea.addEventListener('input', function() {
            self.isDirty = true;
            self.currentCode = textarea.value;
        });
        
        GUI.log('Using fallback text editor (Monaco failed to load)');
    },
    
    /**
     * Add INAV API type definitions for autocomplete
     */
    addINAVTypeDefinitions: function() {
        // Type definitions for INAV API
        const inavTypes = `
declare namespace inav {
    interface Flight {
        readonly armTimer: number;
        readonly homeDistance: number;
        readonly tripDistance: number;
        readonly rssi: number;
        readonly vbat: number;
        readonly cellVoltage: number;
        readonly current: number;
        readonly mahDrawn: number;
        readonly gpsSats: number;
        readonly gpsValid: boolean;
        readonly groundSpeed: number;
        readonly altitude: number;
        readonly verticalSpeed: number;
        readonly throttlePos: number;
        readonly roll: number;
        readonly pitch: number;
        readonly yaw: number;
        readonly isArmed: boolean;
        readonly isFailsafe: boolean;
        readonly mode: {
            readonly failsafe: boolean;
            readonly manual: boolean;
            readonly rth: boolean;
            readonly poshold: boolean;
            readonly althold: boolean;
        };
    }
    
    interface RCChannel {
        readonly value: number;
        readonly low: boolean;
        readonly mid: boolean;
        readonly high: boolean;
    }
    
    interface Override {
        throttleScale: number;
        vtx: {
            power: number;
            band: number;
            channel: number;
        };
        roll: { angle: number; rate: number; };
        pitch: { angle: number; rate: number; };
        yaw: { angle: number; rate: number; };
        rcChannel: number[];
    }
    
    const flight: Flight;
    const rc: RCChannel[];
    const override: Override;
    const gvar: number[];
    
    namespace on {
        function arm(config: { delay: number }, callback: () => void): void;
    }
    
    function when(condition: () => boolean, action: () => void): void;
}

declare const inav: typeof inav;
`;
        
        monaco.languages.typescript.javascriptDefaults.addExtraLib(
            inavTypes,
            'ts:inav.d.ts'
        );
    },
    
    /**
     * Get default starter code
     */
    getDefaultCode: function() {
        return `// INAV JavaScript Programming
// Write JavaScript, get INAV logic conditions!

const { flight, override, when } = inav;

// Example: Increase VTX power when far from home
when(() => flight.homeDistance > 100, () => {
  override.vtx.power = 3;
});

// Add your code here...
`;
    },
    
    /**
     * Set up UI event handlers
     */
    setupEventHandlers: function() {
        const self = this;
        
        // Transpile button
        $('.tab-programming .transpile').click(function() {
            self.transpileCode();
        });
        
        // Load from FC button
        $('.tab-programming .load').click(function() {
            self.loadFromFC();
        });
        
        // Save to FC button
        $('.tab-programming .save').click(function() {
            self.saveToFC();
        });
        
        // Clear button
        $('.tab-programming .clear').click(function() {
            if (confirm('Clear editor? This cannot be undone.')) {
                self.editor.setValue(self.getDefaultCode());
                self.isDirty = false;
            }
        });
        
        // Example selector
        $('#js-example-select').change(function() {
            const exampleId = $(this).val();
            if (exampleId) {
                self.loadExample(exampleId);
                $(this).val(''); // Reset selector
            }
        });
        
        // API Reference toggle
        $('#api-reference-toggle').click(function(e) {
            e.preventDefault();
            const content = $('#api-reference-content');
            const toggle = $(this);
            
            if (content.is(':visible')) {
                content.slideUp();
                toggle.text('▶ API Reference & Examples');
            } else {
                content.slideDown();
                toggle.text('▼ API Reference & Examples');
            }
        });
    },
    
    /**
     * Load examples into dropdown
     */
    loadExamples: function() {
        const examples = [
            { id: 'vtx-distance', name: 'VTX Power by Distance' },
            { id: 'battery-protection', name: 'Battery Protection' },
            { id: 'auto-rth', name: 'Auto RTH on Signal Loss' },
            { id: 'heading-storage', name: 'Store Heading on Arm' },
            { id: 'emergency-level', name: 'Emergency Stabilization' }
        ];
        
        const select = $('#js-example-select');
        examples.forEach(ex => {
            select.append($('<option>', {
                value: ex.id,
                text: ex.name
            }));
        });
    },
    
    /**
     * Load an example into the editor
     */
    loadExample: function(exampleId) {
        // Example code (in production, import from examples/index.js)
        const examples = {
            'vtx-distance': `// Auto VTX power based on distance
const { flight, override, when } = inav;

when(() => flight.homeDistance > 100, () => {
  override.vtx.power = 3;
});

when(() => flight.homeDistance > 500, () => {
  override.vtx.power = 4;
});`,
            
            'battery-protection': `// Throttle limit on low battery
const { flight, override, when } = inav;

when(() => flight.cellVoltage < 350, () => {
  override.throttleScale = 50;
});

when(() => flight.cellVoltage < 330, () => {
  override.throttleScale = 25;
});`,
            
            'auto-rth': `// Emergency RTH on signal loss
const { flight, override, when } = inav;

when(() => flight.rssi < 20, () => {
  override.rcChannel[8] = 2000;
});`,
            
            'heading-storage': `// Store heading after arming
const { flight, gvar, on } = inav;

on.arm({ delay: 1 }, () => {
  let heading = flight.yaw + 180;
  heading = heading % 360;
  gvar[0] = heading;
});`,
            
            'emergency-level': `// Emergency stabilization
const { flight, rc, override, gvar, when, on } = inav;

on.arm({ delay: 1 }, () => {
  gvar[0] = flight.yaw;
});

when(() => flight.mode.failsafe || rc[5].high, () => {
  override.yaw.angle = gvar[0];
  override.pitch.angle = 2;
  override.roll.angle = 0;
});`
        };
        
        if (examples[exampleId]) {
            this.editor.setValue(examples[exampleId]);
            this.isDirty = true;
        }
    },
    
    /**
     * Transpile JavaScript to INAV logic conditions
     */
    transpileCode: function() {
        const self = this;
        const code = this.editor.getValue();
        
        if (!this.transpiler) {
            GUI.log('Transpiler not available');
            return;
        }
        
        GUI.log('Transpiling JavaScript...');
        
        try {
            const result = this.transpiler.transpile(code);
            
            if (result.success) {
                // Display output
                const formattedOutput = this.transpiler.formatOutput(
                    result.commands,
                    result.optimizations
                );
                $('#transpiler-output').val(formattedOutput);
                
                // Update LC count
                this.updateLCCount(result.logicConditionCount);
                
                // Show optimization stats
                if (result.optimizations && result.optimizations.total > 0) {
                    $('#optimization-details').text(result.optimizations.report);
                    $('#optimization-stats').show();
                } else {
                    $('#optimization-stats').hide();
                }
                
                // Clear warnings
                $('#transpiler-warnings').hide();
                
                GUI.log(`Transpiled successfully: ${result.logicConditionCount}/64 logic conditions`);
                
            } else {
                // Show error
                this.showError(result.error);
                GUI.log('Transpilation failed: ' + result.error);
            }
            
        } catch (error) {
            this.showError(error.message);
            console.error('Transpilation error:', error);
        }
    },
    
    /**
     * Update LC count display
     */
    updateLCCount: function(count) {
        const el = $('#lc-count');
        el.text(`${count}/64 LCs`);
        
        // Color code based on usage
        el.removeClass('warning error');
        if (count > 64) {
            el.addClass('error');
        } else if (count > 50) {
            el.addClass('warning');
        }
    },
    
    /**
     * Show transpilation error
     */
    showError: function(message) {
        const warningsDiv = $('#transpiler-warnings');
        warningsDiv.html(`
            <div class="note error">
                <div class="note_spacer">
                    <strong>Transpilation Error:</strong><br>
                    ${message}
                </div>
            </div>
        `);
        warningsDiv.show();
    },
    
    /**
     * Load logic conditions from FC and decompile to JavaScript
     */
    loadFromFC: function(callback) {
        const self = this;
        
        GUI.log('Loading logic conditions from flight controller...');
        
        // Request logic conditions from FC (same as programming.js)
        MSP.send_message(MSPCodes.MSP_LOGIC_CONDITIONS, false, false, function() {
            
            // For now, just clear the editor as decompiler isn't implemented
            // In production, would decompile LOGIC_CONDITIONS to JavaScript
            
            if (LOGIC_CONDITIONS.getLogicConditionsCount() === 0) {
                GUI.log('No logic conditions found on FC');
                self.editor.setValue(self.getDefaultCode());
            } else {
                GUI.log(`Loaded ${LOGIC_CONDITIONS.getLogicConditionsCount()} logic conditions`);
                
                // TODO: Implement decompiler
                // For now, show a message
                const message = `// ${LOGIC_CONDITIONS.getLogicConditionsCount()} logic conditions found on FC
// JavaScript decompiler not yet implemented
// Please write your JavaScript code manually

${self.getDefaultCode()}`;
                
                self.editor.setValue(message);
            }
            
            self.isDirty = false;
            
            if (callback) callback();
        });
    },
    
    /**
     * Save transpiled logic conditions to FC
     */
    saveToFC: function() {
        const self = this;
        const code = this.editor.getValue();
        
        if (!this.transpiler) {
            GUI.log('Transpiler not available');
            return;
        }
        
        // First transpile
        GUI.log('Transpiling before save...');
        const result = this.transpiler.transpile(code);
        
        if (!result.success) {
            this.showError('Cannot save: Transpilation failed - ' + result.error);
            return;
        }
        
        if (result.logicConditionCount > 64) {
            this.showError('Cannot save: Too many logic conditions (' + result.logicConditionCount + '/64)');
            return;
        }
        
        // Confirm save
        if (!confirm(`Save ${result.logicConditionCount} logic conditions to flight controller?`)) {
            return;
        }
        
        GUI.log('Saving to flight controller...');
        
        // Clear existing logic conditions
        LOGIC_CONDITIONS.flush();
        
        // Parse and load transpiled commands
        // Commands are in format: logic <index> <enabled> <activator> <operation> ...
        for (const cmd of result.commands) {
            if (cmd.startsWith('logic ')) {
                const parts = cmd.split(' ');
                if (parts.length >= 9) {
                    const lc = {
                        index: parseInt(parts[1]),
                        enabled: parseInt(parts[2]),
                        activatorId: parseInt(parts[3]),
                        operation: parseInt(parts[4]),
                        operandAType: parseInt(parts[5]),
                        operandAValue: parseInt(parts[6]),
                        operandBType: parseInt(parts[7]),
                        operandBValue: parseInt(parts[8]),
                        flags: parts[9] ? parseInt(parts[9]) : 0
                    };
                    
                    LOGIC_CONDITIONS.put(lc);
                }
            }
        }
        
        // Send to FC (same as programming.js)
        LOGIC_CONDITIONS.sendLogicConditions(function() {
            
            // Save configuration
            MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, function() {
                GUI.log('Logic conditions saved successfully');
                self.isDirty = false;
                
                GUI.log('Rebooting...');
                GUI.tab_switch_cleanup(function() {
                    MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function() {
                        GUI.log('Reboot complete');
                        reinitialize();
                    });
                });
            });
        });
    },
    
    cleanup: function (callback) {
        const self = this;
        
        // Check for unsaved changes
        if (this.isDirty) {
            if (!confirm('You have unsaved changes. Leave anyway?')) {
                // Cancel navigation
                return;
            }
        }
        
        // Dispose Monaco editor
        if (this.editor) {
            this.editor.dispose();
            this.editor = null;
        }
        
        if (callback) callback();
    }
};

TABS.javascript_programming.initialize();
