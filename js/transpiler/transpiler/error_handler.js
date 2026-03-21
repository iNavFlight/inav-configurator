/**
 * INAV Transpiler Error Handler
 *
 * Location: tabs/programming/transpiler/transpiler/error_handler.js
 *
 * Provides error and warning collection utilities for the transpiler.
 * Used by CodeGen to collect errors during generation and throw at the end.
 */

'use strict';

/**
 * Error Handler for Transpiler
 * Collects errors and warnings during code generation
 */
class ErrorHandler {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.currentNode = null; // Track current AST node for line numbers
  }

  /**
   * Reset error and warning collections
   */
  reset() {
    this.errors = [];
    this.warnings = [];
    this.currentNode = null;
  }

  /**
   * Helper to get line number from AST node
   * @param {Object} node - AST node
   * @returns {number|null} Line number or null if unavailable
   */
  getLineNumber(node) {
    if (node && node.loc && node.loc.start) {
      return node.loc.start.line;
    }
    return null;
  }

  /**
   * Add error to collection
   * @param {string} message - Error message
   * @param {Object} node - AST node (optional, uses currentNode if not provided)
   * @param {string} code - Error code (optional)
   * @param {string} suggestion - Helpful suggestion (optional)
   */
  addError(message, node = null, code = null, suggestion = null) {
    this.errors.push({
      message,
      line: this.getLineNumber(node || this.currentNode),
      type: 'error',
      code,
      suggestion
    });
  }

  /**
   * Add warning to collection
   * @param {string} message - Warning message
   * @param {Object} node - AST node (optional, uses currentNode if not provided)
   * @param {string} code - Warning code (optional)
   */
  addWarning(message, node = null, code = null) {
    this.warnings.push({
      message,
      line: this.getLineNumber(node || this.currentNode),
      type: 'warning',
      code
    });
  }

  /**
   * Check if there are any errors
   * @returns {boolean} True if errors exist
   */
  hasErrors() {
    return this.errors.length > 0;
  }

  /**
   * Check if there are any warnings
   * @returns {boolean} True if warnings exist
   */
  hasWarnings() {
    return this.warnings.length > 0;
  }

  /**
   * Get all errors
   * @returns {Array} Array of error objects
   */
  getErrors() {
    return this.errors;
  }

  /**
   * Get all warnings
   * @returns {Array} Array of warning objects
   */
  getWarnings() {
    return this.warnings;
  }

  /**
   * Format errors as a single error message string
   * @returns {string} Formatted error message
   */
  formatErrors() {
    if (this.errors.length === 0) {
      return '';
    }

    const errorMsg = 'Code generation errors:\n' +
      this.errors.map(e => {
        const lineInfo = e.line ? ` (line ${e.line})` : '';
        return `  - ${e.message}${lineInfo}`;
      }).join('\n');

    return errorMsg;
  }

  /**
   * Throw error if any errors exist
   * @throws {Error} If errors are present
   */
  throwIfErrors() {
    if (this.hasErrors()) {
      throw new Error(this.formatErrors());
    }
  }
}

export { ErrorHandler };
