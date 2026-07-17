/**
 * Logic Condition Active Highlighting Module
 *
 * Provides visual feedback in the Monaco editor showing which Logic Conditions
 * are currently TRUE (green checkmarks) or FALSE (gray circles).
 */

'use strict';

/**
 * Categorize Logic Conditions by their current status (TRUE/FALSE)
 *
 * @param {Array<number>} lcStatus - Array of LC status values (0=FALSE, non-zero=TRUE)
 * @param {Array<Object>} lcConditions - Array of LC condition objects
 * @param {Object} lcToLineMapping - Map of LC index to editor line number
 * @returns {Object} { trueLCs: number[], falseLCs: number[] }
 */
export function categorizeLCsByStatus(lcStatus, lcConditions, lcToLineMapping) {
    const trueLCs = [];
    const falseLCs = [];

    for (let lcIndex = 0; lcIndex < lcStatus.length; lcIndex++) {
        const status = lcStatus[lcIndex];
        const condition = lcConditions[lcIndex];

        // Only process enabled LCs that are in our mapping (i.e., visible in the editor)
        if (condition && condition.getEnabled && condition.getEnabled() !== 0 && lcToLineMapping[lcIndex] !== undefined) {
            if (status !== 0) {
                trueLCs.push(lcIndex);
            } else {
                falseLCs.push(lcIndex);
            }
        }
    }

    return { trueLCs, falseLCs };
}

/**
 * Map LC indices to editor line numbers with their combined status
 *
 * Handles cases where multiple LCs map to the same line (shows "mixed" if both TRUE and FALSE exist)
 *
 * @param {number[]} trueLCs - Array of TRUE LC indices
 * @param {number[]} falseLCs - Array of FALSE LC indices
 * @param {Object} lcToLineMapping - Map of LC index to editor line number
 * @returns {Object} Map of line number to status ('true'|'false'|'mixed')
 */
export function mapLCsToLines(trueLCs, falseLCs, lcToLineMapping) {
    const lineStatus = {}; // { lineNum: 'true'|'false'|'mixed' }

    // Process TRUE LCs
    for (const lcIndex of trueLCs) {
        const line = lcToLineMapping[lcIndex];
        if (line !== undefined) {
            if (lineStatus[line] === 'false') {
                lineStatus[line] = 'mixed'; // Both true and false LCs on same line
            } else if (lineStatus[line] !== 'mixed') {
                lineStatus[line] = 'true';
            }
        }
    }

    // Process FALSE LCs
    for (const lcIndex of falseLCs) {
        const line = lcToLineMapping[lcIndex];
        if (line !== undefined) {
            if (lineStatus[line] === 'true') {
                lineStatus[line] = 'mixed'; // Both true and false LCs on same line
            } else if (lineStatus[line] !== 'mixed') {
                lineStatus[line] = 'false';
            }
        }
    }

    return lineStatus;
}

/**
 * Create Monaco editor decorations from line status
 *
 * @param {Object} lineStatus - Map of line number to status ('true'|'false'|'mixed')
 * @param {Object} monaco - Monaco editor instance (passed from caller)
 * @returns {Array<Object>} Array of Monaco decoration objects
 */
export function createMonacoDecorations(lineStatus, monaco) {
    return Object.entries(lineStatus).map(([lineNum, status]) => {
        // For mixed status, show green checkmark (at least one condition is true)
        const className = (status === 'true' || status === 'mixed') ? 'lc-active-true' : 'lc-active-false';
        const message = status === 'mixed'
            ? 'Multiple logic conditions: at least one is TRUE'
            : (status === 'true' ? 'Logic condition is TRUE' : 'Logic condition is FALSE');

        return {
            range: new monaco.Range(parseInt(lineNum), 1, parseInt(lineNum), 1),
            options: {
                glyphMarginClassName: className,
                glyphMarginHoverMessage: {
                    value: message
                }
            }
        };
    });
}

/**
 * Apply decorations to Monaco editor
 *
 * @param {Object} editor - Monaco editor instance
 * @param {Array<Object>} currentDecorations - Current decoration IDs
 * @param {Array<Object>} newDecorations - New decorations to apply
 * @returns {Array<Object>} Updated decoration IDs
 */
export function applyDecorations(editor, currentDecorations, newDecorations) {
    if (!editor || !editor.deltaDecorations) {
        return currentDecorations || [];
    }

    return editor.deltaDecorations(
        currentDecorations || [],
        newDecorations
    );
}

/**
 * Clear all decorations from Monaco editor
 *
 * @param {Object} editor - Monaco editor instance
 * @param {Array<Object>} currentDecorations - Current decoration IDs to clear
 * @returns {Array<Object>} Empty array (no decorations)
 */
export function clearDecorations(editor, currentDecorations) {
    if (!editor || !editor.deltaDecorations || !currentDecorations) {
        return [];
    }

    return editor.deltaDecorations(currentDecorations, []);
}
