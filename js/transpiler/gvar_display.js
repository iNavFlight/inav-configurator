/**
 * Global Variable Display Module
 *
 * Provides inline display of non-zero global variable values in the Monaco editor.
 * Shows values as subtle hints (e.g., "// = 150") next to gvar references in code.
 * Uses Monaco Content Widgets for inline text display.
 */

'use strict';

/**
 * Find all gvar references in editor content
 * @param {string} code - Editor content
 * @returns {Array} Array of {index, line, column} objects
 */
export function findGvarReferences(code) {
    const references = [];
    const gvarRegex = /inav\.gvar\[(\d+)\]/g;
    const lines = code.split('\n');

    lines.forEach((line, lineIndex) => {
        let match;
        gvarRegex.lastIndex = 0;

        while ((match = gvarRegex.exec(line)) !== null) {
            const gvarIndex = parseInt(match[1], 10);
            references.push({
                index: gvarIndex,
                line: lineIndex + 1,  // Monaco uses 1-based line numbers
                column: line.length + 3  // Position at end of line with extra space
            });
        }
    });

    return references;
}

/**
 * GvarHintWidget - Monaco Content Widget for displaying gvar values inline
 */
class GvarHintWidget {
    constructor(editor, line, column, gvarIndex, value, widgetId) {
        this.editor = editor;
        this.line = line;
        this.column = column;
        this.gvarIndex = gvarIndex;
        this.value = value;
        this._id = widgetId;
        this._domNode = null;
    }

    getId() {
        return this._id;
    }

    getDomNode() {
        if (!this._domNode) {
            this._domNode = document.createElement('span');
            this._domNode.className = 'gvar-hint';
            this._domNode.textContent = ` // gvar[${this.gvarIndex}] = ${this.value}`;
        }
        return this._domNode;
    }

    getPosition() {
        return {
            position: {
                lineNumber: this.line,
                column: this.column
            },
            preference: [0] // EXACT
        };
    }
}

/**
 * Create Monaco content widgets for non-zero gvar values
 * Only creates widget for first occurrence of each gvar index
 * @param {object} editor - Monaco editor instance
 * @param {Array} gvarRefs - Array of gvar references from findGvarReferences()
 * @param {Array} gvarValues - Array of current gvar values from FC
 * @returns {Array} Array of widget instances
 */
export function createGvarWidgets(editor, gvarRefs, gvarValues) {
    const widgets = [];
    const seenGvars = new Set();

    if (!editor || !Array.isArray(gvarValues)) {
        return widgets;
    }

    gvarRefs.forEach((ref, index) => {
        // Skip if we've already shown this gvar
        if (seenGvars.has(ref.index)) {
            return;
        }

        const value = gvarValues[ref.index];

        if (value !== undefined && value !== 0) {
            seenGvars.add(ref.index);
            const widgetId = `gvar-hint-${ref.line}-${ref.column}-${index}`;
            const widget = new GvarHintWidget(editor, ref.line, ref.column, ref.index, value, widgetId);
            widgets.push(widget);
        }
    });

    return widgets;
}

/**
 * Apply gvar widgets to editor
 * @param {object} editor - Monaco editor instance
 * @param {Array} oldWidgets - Previous widgets to remove
 * @param {Array} newWidgets - New widgets to add
 * @returns {Array} New widget instances
 */
export function applyWidgets(editor, oldWidgets, newWidgets) {
    if (!editor) return [];

    // Remove old widgets
    if (oldWidgets && oldWidgets.length > 0) {
        oldWidgets.forEach(widget => {
            editor.removeContentWidget(widget);
        });
    }

    // Add new widgets
    if (newWidgets && newWidgets.length > 0) {
        newWidgets.forEach(widget => {
            editor.addContentWidget(widget);
        });
    }

    return newWidgets;
}

/**
 * Clear all gvar widgets
 * @param {object} editor - Monaco editor instance
 * @param {Array} widgets - Widgets to remove
 * @returns {Array} Empty widget array
 */
export function clearWidgets(editor, widgets) {
    if (!editor) return [];

    if (widgets && widgets.length > 0) {
        widgets.forEach(widget => {
            editor.removeContentWidget(widget);
        });
    }

    return [];
}
