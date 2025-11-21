/**
 * INAV JavaScript Programming Tab
 * 
 * Integrates Monaco Editor with INAV transpiler and MSP communication.
 */

'use strict';

const MSPChainerClass = require('./../js/msp/MSPchainer');
const mspHelper = require('./../js/msp/MSPHelper');
const { GUI, TABS } = require('./../js/gui');
const FC = require('./../js/fc');
const path = require('path');
const i18n = require('./../js/localization');
const { Transpiler } = require('./transpiler/index.js');
const { Decompiler } = require('./transpiler/decompiler.js');

TABS.javascript_programming = {

    currentProgrammingPIDProfile: null,
    isDirty: false,
    editor: null,
    transpiler: null,
    decompiler: null,
    currentCode: '',
    
    analyticsChanges: {},

    initialize: function (callback) {
        const self = this;
        
        if (GUI.active_tab !== 'javascript_programming') {
            GUI.active_tab = 'javascript_programming';
        }

        // Load HTML
        $('#content').load("./tabs/javascript_programming.html", function () {
            
            // Initialize transpiler and decompiler
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
     * Initialize transpiler and decompiler
     */
    initTranspiler: function() {
        if (typeof Transpiler !== 'undefined') {
            this.transpiler = new Transpiler();
        } else {
            console.error('Transpiler not loaded');
            GUI.log(i18n.getMessage('transpilerNotAvailable') || 'JavaScript transpiler not available');
        }
    
        if (typeof Decompiler !== 'undefined') {
            this.decompiler = new Decompiler();
        } else {
            console.error('Decompiler not loaded');
            GUI.log(i18n.getMessage('decompilerNotAvailable') || 'JavaScript decompiler not available');
        }
    },

    /**
     * Load Monaco Editor
     */
    loadMonacoEditor: function(callback) {
        const self = this;

        // Try to load Monaco Editor
        try {
            const monaco = window.monaco || require('monaco-editor');
            
            if (monaco) {
                self.setupMonaco(monaco);
                callback();
            } else {
                throw new Error('Monaco not found');
            }
        } catch (error) {
            console.error('Failed to load Monaco Editor:', error);
            self.createFallbackEditor();
            callback();
        }
    },

    /**
     * Set up Monaco Editor with INAV JavaScript support
     */
    setupMonaco: function(monaco) {
        const self = this;
        
        // Store monaco reference
        window.monacoInstance = monaco;
        
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
        this.addINAVTypeDefinitions(monaco);
        
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
    addINAVTypeDefinitions: function(monaco) {
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
        function always(callback: () => void): void;
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
            GUI.log(i18n.getMessage('transpilerNotAvailable') || 'Transpiler not available');
            return;
        }
        
        GUI.log(i18n.getMessage('transpiling') || 'Transpiling JavaScript...');
        
        try {
            const result = this.transpiler.transpile(code);
            
            if (result.success) {
                // Display output
                const formattedOutput = this.transpiler.formatOutput(
                    result.commands,
                    result.warnings,
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
                
                // Show warnings if any
                if (result.warnings && (result.warnings.errors.length > 0 || 
                    result.warnings.warnings.length > 0)) {
                    this.showWarnings(result.warnings);
                } else {
                    $('#transpiler-warnings').hide();
                }
                
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
                    ${this.escapeHtml(message)}
                </div>
            </div>
        `);
        warningsDiv.show();
    },
    
    /**
     * Show transpilation/decompilation warnings
     */
    showWarnings: function(warnings) {
        const warningsDiv = $('#transpiler-warnings');
        let html = '';
        
        if (warnings.errors && warnings.errors.length > 0) {
            html += '<div class="note error"><div class="note_spacer">';
            html += '<strong>Errors:</strong><ul style="margin: 5px 0; padding-left: 20px;">';
            warnings.errors.forEach(w => {
                html += `<li>${this.escapeHtml(w.message)} ${w.line ? `(line ${w.line})` : ''}</li>`;
            });
            html += '</ul></div></div>';
        }
        
        if (warnings.warnings && warnings.warnings.length > 0) {
            html += '<div class="note warning"><div class="note_spacer">';
            html += '<strong>Warnings:</strong><ul style="margin: 5px 0; padding-left: 20px;">';
            warnings.warnings.forEach(w => {
                html += `<li>${this.escapeHtml(w.message)} ${w.line ? `(line ${w.line})` : ''}</li>`;
            });
            html += '</ul></div></div>';
        }
        
        warningsDiv.html(html);
        warningsDiv.show();
    },
    
    /**
     * Show decompiler warnings
     */
    showDecompilerWarnings: function(warnings) {
        const warningsDiv = $('#transpiler-warnings');
        
        let html = '<div class="note warning"><div class="note_spacer">';
        html += '<strong>Decompilation Warnings:</strong><br>';
        html += '<ul style="margin: 5px 0; padding-left: 20px;">';
        
        for (const warning of warnings) {
            html += `<li>${this.escapeHtml(warning)}</li>`;
        }
        
        html += '</ul>';
        html += '<p style="margin-top: 10px;"><em>Please review the generated code carefully and test before using.</em></p>';
        html += '</div></div>';
        
        warningsDiv.html(html);
        warningsDiv.show();
    },
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml: function(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    /**
     * Load logic conditions from FC and decompile to JavaScript
     * Uses MSP chaining pattern from programming.js
     */
    loadFromFC: function(callback) {
        const self = this;
        
        if (!this.decompiler) {
            GUI.log(i18n.getMessage('decompilerNotAvailable') || 'Decompiler not available');
            if (callback) callback();
            return;
        }
        
        GUI.log(i18n.getMessage('loadingFromFC') || 'Loading logic conditions from flight controller...');
        
        // Create MSP chainer for loading logic conditions
        const loadChainer = new MSPChainerClass();
        
        loadChainer.setChain([
            mspHelper.loadLogicConditions
        ]);
        
        loadChainer.setExitPoint(function() {
            self.onLogicConditionsLoaded(callback);
        });
        
        loadChainer.execute();
    },
    
    /**
     * Called after logic conditions are loaded from FC
     */
    onLogicConditionsLoaded: function(callback) {
        const self = this;
        
        // Get logic conditions from FC object
        const logicConditions = self.getLogicConditionsArray();
        
        if (!logicConditions || logicConditions.length === 0) {
            GUI.log(i18n.getMessage('noLogicConditions') || 'No logic conditions found on FC');
            self.editor.setValue(self.getDefaultCode());
            self.isDirty = false;
            if (callback) callback();
            return;
        }
        
        GUI.log(`Found ${logicConditions.length} logic conditions, decompiling...`);
        
        // Decompile to JavaScript
        try {
            const result = self.decompiler.decompile(logicConditions);
            
            if (result.success) {
                // Set the decompiled code
                self.editor.setValue(result.code);
                
                // Show stats
                if (result.stats) {
                    GUI.log(
                        `Decompiled ${result.stats.enabledConditions}/${result.stats.totalConditions} ` +
                        `logic conditions into ${result.stats.groups} handler(s)`
                    );
                }
                
                // Show warnings if any
                if (result.warnings && result.warnings.length > 0) {
                    self.showDecompilerWarnings(result.warnings);
                } else {
                    $('#transpiler-warnings').hide();
                }
                
                self.isDirty = false;
            } else {
                // Decompilation failed
                GUI.log('Decompilation failed: ' + result.error);
                self.showError('Decompilation failed: ' + result.error);
                self.editor.setValue(result.code || self.getDefaultCode());
                self.isDirty = false;
            }
            
        } catch (error) {
            console.error('Decompilation error:', error);
            GUI.log('Decompilation error: ' + error.message);
            self.showError('Decompilation error: ' + error.message);
            self.editor.setValue(self.getDefaultCode());
            self.isDirty = false;
        }
        
        if (callback) callback();
    },
    
    /**
     * Get logic conditions array from FC.LOGIC_CONDITIONS
     */
    getLogicConditionsArray: function() {
        const conditions = [];
        
        // FC.LOGIC_CONDITIONS stores logic conditions
        if (!FC.LOGIC_CONDITIONS || !FC.LOGIC_CONDITIONS.get) {
            console.error('FC.LOGIC_CONDITIONS not available');
            return conditions;
        }
        
        // Get count of logic conditions
        const count = FC.LOGIC_CONDITIONS.getCount ? 
            FC.LOGIC_CONDITIONS.getCount() : 64; // Max 64 logic conditions
        
        for (let i = 0; i < count; i++) {
            const lc = FC.LOGIC_CONDITIONS.get(i);
            if (lc) {
                conditions.push({
                    index: i,
                    enabled: lc.enabled,
                    activatorId: lc.activatorId,
                    operation: lc.operation,
                    operandAType: lc.operandAType,
                    operandAValue: lc.operandAValue,
                    operandBType: lc.operandBType,
                    operandBValue: lc.operandBValue,
                    flags: lc.flags || 0
                });
            }
        }
        
        return conditions;
    },
    
    /**
     * Save transpiled logic conditions to FC
     * Uses MSP chaining pattern from programming.js
     */
    saveToFC: function() {
        const self = this;
        const code = this.editor.getValue();
        
        if (!this.transpiler) {
            GUI.log(i18n.getMessage('transpilerNotAvailable') || 'Transpiler not available');
            return;
        }
        
        // First transpile
        GUI.log(i18n.getMessage('transpilingBeforeSave') || 'Transpiling before save...');
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
        const confirmMsg = i18n.getMessage('confirmSaveLogicConditions') || 
            `Save ${result.logicConditionCount} logic conditions to flight controller?`;
        if (!confirm(confirmMsg)) {
            return;
        }
        
        GUI.log(i18n.getMessage('savingToFC') || 'Saving to flight controller...');
        
        // Clear existing logic conditions
        FC.LOGIC_CONDITIONS.flush();
        
        // Parse and load transpiled commands
        for (const cmd of result.commands) {
            if (cmd.startsWith('logic ')) {
                const parts = cmd.split(' ');
                if (parts.length >= 9) {
                    const lc = {
                        enabled: parseInt(parts[2]),
                        activatorId: parseInt(parts[3]),
                        operation: parseInt(parts[4]),
                        operandAType: parseInt(parts[5]),
                        operandAValue: parseInt(parts[6]),
                        operandBType: parseInt(parts[7]),
                        operandBValue: parseInt(parts[8]),
                        flags: parts[9] ? parseInt(parts[9]) : 0
                    };
                    
                    FC.LOGIC_CONDITIONS.put(lc);
                }
            }
        }
        
        // Create save chainer (same pattern as programming.js)
        const saveChainer = new MSPChainerClass();
        
        saveChainer.setChain([
            mspHelper.sendLogicConditions,
            mspHelper.saveToEeprom
        ]);
        
        saveChainer.setExitPoint(function() {
            GUI.log(i18n.getMessage('logicConditionsSaved') || 'Logic conditions saved successfully');
            self.isDirty = false;
            
            // Optionally reboot (commented out for safety - user can reboot manually)
            // const shouldReboot = confirm('Reboot flight controller to apply changes?');
            // if (shouldReboot) {
            //     self.rebootFC();
            // }
        });
        
        saveChainer.execute();
    },
    
    /**
     * Reboot flight controller
     */
    rebootFC: function() {
        GUI.log(i18n.getMessage('rebooting') || 'Rebooting...');
        
        GUI.tab_switch_cleanup(function() {
            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, function() {
                GUI.log(i18n.getMessage('rebootComplete') || 'Reboot complete');
            });
        });
    },
    
    cleanup: function (callback) {
        const self = this;
        
        // Check for unsaved changes
        if (this.isDirty) {
            const confirmMsg = i18n.getMessage('unsavedChanges') || 
                'You have unsaved changes. Leave anyway?';
            if (!confirm(confirmMsg)) {
                // Cancel navigation
                return;
            }
        }
        
        // Dispose Monaco editor
        if (this.editor && this.editor.dispose) {
            this.editor.dispose();
            this.editor = null;
        }
        
        if (callback) callback();
    }
};

module.exports = TABS.javascript_programming;