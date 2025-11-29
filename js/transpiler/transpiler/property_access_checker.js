/**
 * Property Access Checker Helper
 *
 * Location: js/transpiler/transpiler/property_access_checker.js
 *
 * Validates property access in JavaScript code (gvar, rc, API objects).
 * Extracted from analyzer.js to improve modularity.
 */

'use strict';

/**
 * Helper class for checking property access validity
 */
class PropertyAccessChecker {
  /**
   * @param {Object} context - Context object containing dependencies
   * @param {Object} context.inavAPI - INAV API definitions
   * @param {Function} context.getVariableHandler - Getter for variable handler instance
   * @param {Function} context.addError - Function to add errors
   * @param {Function} context.addWarning - Function to add warnings
   * @param {number} context.gvarCount - Number of available gvars
   */
  constructor(context) {
    this.inavAPI = context.inavAPI;
    this.getVariableHandler = context.getVariableHandler;
    this.addError = context.addError;
    this.addWarning = context.addWarning;
    this.gvarCount = context.gvarCount;
  }

  /**
   * Check if property access is valid
   * @param {string} propPath - Property path (e.g., "flight.altitude", "gvar[0]", "rc[1].low")
   * @param {number} line - Line number for error reporting
   */
  check(propPath, line) {
    if (!propPath || typeof propPath !== 'string') return;

    // Check if it's a variable (skip validation)
    const variableHandler = this.getVariableHandler();
    if (variableHandler && variableHandler.isVariable(propPath)) {
      return;
    }

    // Handle gvar access
    if (propPath.startsWith('gvar[')) {
      this.checkGvarAccess(propPath, line);
      return;
    }

    // Handle RC channel array access: rc[1].low, rc[2].mid, rc[3].high, rc[N].value (1-based)
    if (propPath.startsWith('rc[')) {
      this.checkRcChannelAccess(propPath, line);
      return;
    }

    // Handle API property access (flight.*, override.*, etc.)
    this.checkApiPropertyAccess(propPath, line);
  }

  /**
   * Check gvar access validity
   * @private
   */
  checkGvarAccess(propPath, line) {
    const index = this.extractGvarIndex(propPath);
    if (index === -1) {
      this.addError(`Invalid gvar syntax: ${propPath}`, line);
    } else if (index >= this.gvarCount) {
      this.addError(`Invalid gvar index ${index}. INAV only has gvar[0] through gvar[${this.gvarCount - 1}]`, line);
    }
  }

  /**
   * Check RC channel access validity
   * Uses 1-based indexing to match INAV firmware (rc[1] through rc[18])
   * @private
   */
  checkRcChannelAccess(propPath, line) {
    const match = propPath.match(/^rc\[(\d+)\](?:\.(\w+))?$/);
    if (!match) {
      this.addError(`Invalid RC channel syntax: '${propPath}'. Expected format: rc[1] through rc[18], optionally with .value, .low, .mid, or .high`, line);
      return;
    }

    const channelIndex = parseInt(match[1]);
    const property = match[2]; // may be undefined for rc[N] alone

    if (channelIndex < 1 || channelIndex > 18) {
      this.addError(`RC channel index ${channelIndex} out of range. INAV supports rc[1] through rc[18]`, line);
      return;
    }

    if (property && !['value', 'low', 'mid', 'high'].includes(property)) {
      this.addError(`Unknown property '${property}' on RC channel. Available: value, low, mid, high`, line);
      return;
    }

    // Valid RC channel access
  }

  /**
   * Check API property access validity (flight.*, override.*, etc.)
   * @private
   */
  checkApiPropertyAccess(propPath, line) {
    const parts = propPath.split('.');

    // Check first level (flight, override, rc, time, etc.)
    if (!this.inavAPI[parts[0]]) {
      this.addError(`Unknown API object '${parts[0]}' in '${propPath}'. Available: ${Object.keys(this.inavAPI).join(', ')}`, line);
      return;
    }

    const apiObj = this.inavAPI[parts[0]];

    // For single-level access (e.g., "flight"), warn that it needs a property
    if (parts.length === 1) {
      if (apiObj.properties.length > 0 || Object.keys(apiObj.nested).length > 0) {
        this.addWarning('incomplete-access', `'${propPath}' needs a property. Did you mean to access a specific property?`, line);
      }
      return;
    }

    // Check second level and beyond
    if (parts.length > 1) {
      const secondPart = parts[1];

      // Check if it's a valid property
      if (apiObj.properties.includes(secondPart)) {
        return; // Valid property
      }

      // Check if it's a nested object
      if (apiObj.nested[secondPart]) {
        // Check third level if present
        if (parts.length > 2) {
          const thirdPart = parts[2];
          const nestedProps = apiObj.nested[secondPart];
          if (!nestedProps.includes(thirdPart)) {
            this.addError(`Unknown property '${thirdPart}' in '${propPath}'. Available: ${nestedProps.join(', ')}`, line);
          }
        }
        return;
      }

      // Property not found
      const available = [
        ...apiObj.properties,
        ...Object.keys(apiObj.nested)
      ];
      this.addError(`Unknown property '${secondPart}' in '${propPath}'. Available: ${available.join(', ')}`, line);
    }
  }

  /**
   * Check if property can be written to
   */
  isValidWritableProperty(target) {
    // Only gvar, rc, and specific override properties can be assigned
    if (target.startsWith('gvar[')) return true;
    if (target.startsWith('rc[')) return true;

    if (target.startsWith('override.')) {
      const parts = target.split('.');
      if (parts.length >= 2) {
        const apiObj = this.inavAPI['override'];

        // Check direct properties
        if (apiObj.targets.includes(parts[1])) {
          return true;
        }

        // Check nested properties (e.g., override.vtx.power)
        if (parts.length >= 3 && apiObj.nested[parts[1]]) {
          return apiObj.nested[parts[1]].includes(parts[2]);
        }
      }
    }

    return false;
  }

  /**
   * Extract gvar index from string
   * @private
   */
  extractGvarIndex(gvarStr) {
    const match = gvarStr.match(/gvar\[(\d+)\]/);
    return match ? parseInt(match[1]) : -1;
  }
}

export { PropertyAccessChecker };
