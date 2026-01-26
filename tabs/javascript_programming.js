/**
 * INAV JavaScript Programming Tab
 *
 * Integrates Monaco Editor with INAV transpiler and MSP communication.
 */

'use strict';

import MSPChainerClass from './../js/msp/MSPchainer.js';
import mspHelper from './../js/msp/MSPHelper.js';
import { GUI, TABS } from './../js/gui.js';
import FC from './../js/fc.js';
import i18n from './../js/localization.js';
import interval from './../js/intervals.js';
import { Transpiler } from './../js/transpiler/index.js';
import { Decompiler } from './../js/transpiler/transpiler/decompiler.js';
import * as MonacoLoader from './../js/transpiler/editor/monaco_loader.js';
import examples from './../js/transpiler/examples/index.js';
import settingsCache from './../js/settingsCache.js';
import * as monaco from 'monaco-editor';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

self.MonacoEnvironment = {
  getWorker(_, label) {
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}

TABS.javascript_programming = {

    currentProgrammingPIDProfile: null,
    isDirty: false,
    editor: null,
    transpiler: null,
    decompiler: null,
    currentCode: '',

    // Active LC highlighting state
    lcToLineMapping: {},
    activeDecorations: [],
    statusChainer: null,

    analyticsChanges: {},

    initialize: function (callback) {
        const self = this;

        if (GUI.active_tab !== 'javascript_programming') {
            GUI.active_tab = 'javascript_programming';
        }

        import('./javascript_programming.html?raw').then(({default: html}) => {
            GUI.load(html, () => {
                try {
                    self.initTranspiler();

                    // Initialize editor with INAV configuration
                    self.editor = MonacoLoader.initializeMonacoEditor(monaco, 'monaco-editor');

                    // Add INAV type definitions
                    MonacoLoader.addINAVTypeDefinitions(monaco);

                    // Set up linting
                    MonacoLoader.setupLinting(self.editor, function() {
                        if (self.lintCode) {
                            self.lintCode();
                        }
                    });

                    // Continue with initialization
                    self.setupEventHandlers();
                    self.loadExamples();

                    self.loadFromFC(function() {
                        self.isDirty = false;

                        // Set up dirty tracking AFTER initial load to avoid marking as dirty during decompilation
                        self.editor.onDidChangeModelContent(function() {
                            if (!self.isDirty) {
                                console.log('[JavaScript Programming] Editor marked as dirty (unsaved changes)');
                            }
                            self.isDirty = true;
                        });

                        // Set up LC status polling for active highlighting
                        self.setupActiveHighlighting();

                        // Localize i18n strings
                        i18n.localize();

                        GUI.content_ready(callback);
                    }); 
                } catch (error) {
                    console.error('Failed to load Monaco Editor:', error);
                    // Localize i18n strings even on error
                    i18n.localize();
                    GUI.content_ready(callback);
                }

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
     * Get default starter code
     */
    getDefaultCode: function() {
    return `// INAV JavaScript Programming
// Write JavaScript, get INAV logic conditions!

// Example: Increase VTX power when far from home
if (inav.flight.homeDistance > 100) {
  inav.override.vtx.power = 3;
}

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

        // Example selector - bind to the actual select element, not the container div
        $('#examples-select').change(function() {
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

    /*
    **
     * Load a specific example into the editor
     * @param {string} exampleId - The ID of the example to load
     */
    loadExample: function(exampleId) {
        const self = this;

        try {
            // examples imported at top
            if (!examples[exampleId]) {
                console.error('Example not found:', exampleId);
                return;
            }

            // Check for unsaved changes before loading example
            if (self.isDirty) {
                const confirmMsg = i18n.getMessage('loadExampleConfirm') ||
                    'You have unsaved changes. Load example anyway?';
                if (!confirm(confirmMsg)) {
                    return; // User cancelled
                }
            }

            const example = examples[exampleId];

            // Set the code in the editor
            if (self.editor && self.editor.setValue) {
                self.editor.setValue(example.code);
                console.log('Loaded example:', example.name);
            } else {
                console.error('Editor not initialized');
            }

            // Mark as dirty since we changed the code
            self.isDirty = true;

        } catch (error) {
            console.error('Failed to load example:', error);
        }
    },

    /**
     * Load and populate the examples dropdown
     */
    loadExamples: function() {
        const self = this;

        try {
            // examples imported at top
            const $examplesSelect = $('#examples-select');

            if (!$examplesSelect.length) {
                console.warn('Examples dropdown not found');
                return;
            }

            // Clear existing options
            $examplesSelect.empty();

            // Add default option
            $examplesSelect.append('<option value="">-- Select Example --</option>');

            // Group examples by category
            const categories = {};
            for (const [id, example] of Object.entries(examples)) {
                const category = example.category || 'Other';
                if (!categories[category]) {
                    categories[category] = [];
                }
                categories[category].push({ id, ...example });
            }

            // Add examples grouped by category
            for (const [category, exampleList] of Object.entries(categories)) {
                const $optgroup = $('<optgroup>').attr('label', category);

                for (const example of exampleList) {
                    $optgroup.append(
                        $('<option>')
                            .attr('value', example.id)
                            .text(example.name)
                            .attr('title', example.description)
                    );
                }

                $examplesSelect.append($optgroup);
            }

            // Set up change handler
            $examplesSelect.off('change').on('change', function() {
                const exampleId = $(this).val();
                if (exampleId) {
                    self.loadExample(exampleId);
                }
            });

            console.log('Examples dropdown populated with', Object.keys(examples).length, 'examples');

        } catch (error) {
            console.error('Failed to load examples:', error);
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

        // Track which slots were occupied before we modify them
        // This is used when saving to clear stale conditions
        self.previouslyOccupiedSlots = new Set();
        const conditions = FC.LOGIC_CONDITIONS.get();
        for (let i = 0; i < conditions.length; i++) {
            if (conditions[i].getEnabled() !== 0) {
                self.previouslyOccupiedSlots.add(i);
            }
        }

        // Retrieve variable map for name preservation
        const variableMap = settingsCache.get('javascript_variables') || {
            let_variables: {},
            var_variables: {}
        };
        console.log('Variable map retrieved:', variableMap);

        // Decompile to JavaScript
        try {
            const result = self.decompiler.decompile(logicConditions, variableMap);

            if (result.success) {
                // Set the decompiled code
                self.editor.setValue(result.code);

                // Store LC-to-line mapping for active highlighting
                self.lcToLineMapping = result.lcToLineMapping || {};
                console.log('[JavaScript Programming] Stored LC-to-line mapping:', self.lcToLineMapping);

                // Show stats
                if (result.stats) {
                    GUI.log(
                        `Decompiled ${result.stats.enabled}/${result.stats.total} ` +
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
            const lc = FC.LOGIC_CONDITIONS.get()[i];
            if (lc) {
                conditions.push({
                    index: i,
                    enabled: lc.getEnabled(),
                    activatorId: lc.getActivatorId(),
                    operation: lc.getOperation(),
                    operandAType: lc.getOperandAType(),
                    operandAValue: lc.getOperandAValue(),
                    operandBType: lc.getOperandBType(),
                    operandBValue: lc.getOperandBValue(),
                    flags: lc.getFlags()
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

        // Store variable map for preservation between sessions
        if (result.variableMap) {
            settingsCache.set('javascript_variables', result.variableMap);
            console.log('Variable map stored:', result.variableMap);
        }

        // Clear existing logic conditions
        FC.LOGIC_CONDITIONS.flush();

        // Create empty condition factory function
        const createEmptyCondition = () => ({
            enabled: 0,
            activatorId: -1,
            operation: 0,
            operandAType: 0,
            operandAValue: 0,
            operandBType: 0,
            operandBValue: 0,
            flags: 0,

            getEnabled: function() { return this.enabled; },
            getActivatorId: function() { return this.activatorId; },
            getOperation: function() { return this.operation; },
            getOperandAType: function() { return this.operandAType; },
            getOperandAValue: function() { return this.operandAValue; },
            getOperandBType: function() { return this.operandBType; },
            getOperandBValue: function() { return this.operandBValue; },
            getFlags: function() { return this.flags; }
        });

        // Build a map of slot index -> condition from transpiler output
        const conditionMap = new Map();

        // Parse transpiled commands and build the condition map
        for (const cmd of result.commands) {
            if (cmd.startsWith('logic ')) {
                const parts = cmd.split(' ');
                if (parts.length >= 9) {
                    const slotIndex = parseInt(parts[1], 10);
                    const lc = {
                        enabled: parseInt(parts[2], 10),
                        activatorId: parseInt(parts[3], 10),
                        operation: parseInt(parts[4], 10),
                        operandAType: parseInt(parts[5], 10),
                        operandAValue: parseInt(parts[6], 10),
                        operandBType: parseInt(parts[7], 10),
                        operandBValue: parseInt(parts[8], 10),
                        flags: parts[9] ? parseInt(parts[9], 10) : 0,

                        getEnabled: function() { return this.enabled; },
                        getActivatorId: function() { return this.activatorId; },
                        getOperation: function() { return this.operation; },
                        getOperandAType: function() { return this.operandAType; },
                        getOperandAValue: function() { return this.operandAValue; },
                        getOperandBType: function() { return this.operandBType; },
                        getOperandBValue: function() { return this.operandBValue; },
                        getFlags: function() { return this.flags; }
                    };

                    conditionMap.set(slotIndex, lc);
                }
            }
        }

        // Add empty conditions for previously-occupied slots that aren't in the new script
        if (self.previouslyOccupiedSlots) {
            for (const oldSlot of self.previouslyOccupiedSlots) {
                if (!conditionMap.has(oldSlot)) {
                    // This slot was occupied before but isn't in new script - clear it
                    conditionMap.set(oldSlot, createEmptyCondition());
                }
            }
        }

        // Sort by slot index and add to FC.LOGIC_CONDITIONS in order
        const sortedSlots = Array.from(conditionMap.keys()).sort((a, b) => a - b);
        for (const slotIndex of sortedSlots) {
            FC.LOGIC_CONDITIONS.put(conditionMap.get(slotIndex));
        }

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

    /**
     * Set up active LC highlighting with status polling
     */
    setupActiveHighlighting: function() {
        const self = this;

        // Create MSP chainer for polling LC status
        self.statusChainer = new MSPChainerClass();
        self.statusChainer.setChain([
            mspHelper.loadLogicConditionsStatus
        ]);
        self.statusChainer.setExitPoint(function() {
            self.updateActiveHighlighting();
        });

        // Start 100ms polling interval
        interval.add('js_programming_lc_highlight', function() {
            if (self.statusChainer) {
                self.statusChainer.execute();
            }
        }, 100);

        console.log('[JavaScript Programming] Active highlighting polling started');
    },

    /**
     * Update active LC highlighting based on current status
     */
    updateActiveHighlighting: function() {
        const self = this;

        // Don't highlight if code has been modified
        if (self.isDirty) {
            self.clearActiveHighlighting();
            return;
        }

        // Don't highlight if no mapping available
        if (!self.lcToLineMapping || Object.keys(self.lcToLineMapping).length === 0) {
            return;
        }

        // Check if FC data is available
        if (!FC.LOGIC_CONDITIONS_STATUS || !FC.LOGIC_CONDITIONS) {
            return;
        }

        const lcStatus = FC.LOGIC_CONDITIONS_STATUS.get();
        const lcConditions = FC.LOGIC_CONDITIONS.get();

        // Verify data is loaded (not null)
        if (!lcStatus || !lcConditions) {
            return;
        }

        // Find all LCs with true/non-zero status
        const trueLCs = [];

        for (let lcIndex = 0; lcIndex < lcStatus.length; lcIndex++) {
            const status = lcStatus[lcIndex];
            const condition = lcConditions[lcIndex];

            // Check if LC is enabled and has non-zero status (true)
            if (condition && condition.getEnabled && condition.getEnabled() !== 0 && status !== 0) {
                trueLCs.push(lcIndex);
            }
        }

        // Map LC indices to line numbers
        const linesToHighlight = trueLCs
            .map(lcIndex => self.lcToLineMapping[lcIndex])
            .filter(line => line !== undefined);

        // Remove duplicates (multiple LCs on same line)
        const uniqueLines = [...new Set(linesToHighlight)];

        // Create Monaco decorations
        const decorations = uniqueLines.map(lineNum => ({
            range: new monaco.Range(lineNum, 1, lineNum, 1),
            options: {
                glyphMarginClassName: 'lc-active-true',
                glyphMarginHoverMessage: {
                    value: 'Logic condition is TRUE'
                }
            }
        }));

        // Apply decorations (Monaco efficiently handles diff)
        if (self.editor && self.editor.deltaDecorations) {
            self.activeDecorations = self.editor.deltaDecorations(
                self.activeDecorations || [],
                decorations
            );
        }
    },

    /**
     * Clear all active LC highlighting
     */
    clearActiveHighlighting: function() {
        const self = this;

        if (self.editor && self.editor.deltaDecorations && self.activeDecorations) {
            self.activeDecorations = self.editor.deltaDecorations(
                self.activeDecorations,
                []
            );
        }
    },

    cleanup: function (callback) {
        console.log('[JavaScript Programming] cleanup() - disposing editor');

        // Stop LC status polling
        interval.remove('js_programming_lc_highlight');

        // Clear active highlighting
        this.clearActiveHighlighting();

        // Clear status chainer
        this.statusChainer = null;

        // Dispose Monaco editor
        // Note: Unsaved changes are checked BEFORE cleanup() is called:
        // - For disconnect: in serial_backend.js
        // - For tab switch: in configurator_main.js
        if (this.editor && this.editor.dispose) {
            this.editor.dispose();
            this.editor = null;
        }

        if (callback) callback();
    }
};
