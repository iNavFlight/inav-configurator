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
   * @param {string} propPath - Property path (e.g., "inav.flight.altitude", "inav.gvar[0]", "inav.rc[1].low")
   * @param {number} line - Line number for error reporting
   */
  check(propPath, line) {
    if (!propPath || typeof propPath !== 'string') return;

    // Check if it's a variable (skip validation)
    const variableHandler = this.getVariableHandler();
    if (variableHandler && variableHandler.isVariable(propPath)) {
      return;
    }

    // Everything in INAV API must be namespaced
    if (propPath.startsWith('inav.')) {
      this.checkInavProperty(propPath, line);
      return;
    }

    // If it's not a variable and not inav.*, it's an error
    this.addError(`Unknown identifier '${propPath}'. INAV properties must start with 'inav.'`, line);
  }

  /**
   * Check INAV-namespaced property access using namespace-based routing
   * @param {string} propPath - Full path including 'inav.' prefix
   * @param {number} line - Line number for error reporting
   * @private
   */
  checkInavProperty(propPath, line) {
    const inavPath = propPath.substring(5); // Strip 'inav.' prefix

    // Extract namespace (part before . or [)
    const namespaceMatch = inavPath.match(/^([a-zA-Z]+)/);
    if (!namespaceMatch) {
      this.addError(`Invalid property path 'inav.${inavPath}'`, line);
      return;
    }

    const namespace = namespaceMatch[1];

    // Special handlers for array-based namespaces (need custom validation)
    const specialHandlers = {
      'gvar': () => this.checkGvarAccess(inavPath, line),
      'rc': () => this.checkRcChannelAccess(inavPath, line),
      'pid': () => this.checkPidAccess(inavPath, line)
    };

    // Route to namespace-specific handler
    if (specialHandlers[namespace]) {
      specialHandlers[namespace]();
    } else {
      // All other namespaces (flight, override, helpers, events, waypoint, etc.)
      // are validated through the generic API property checker
      this.checkApiPropertyAccess(inavPath, line);
    }
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
   * Check PID controller access validity
   * INAV has 4 programming PID controllers (pid[0] through pid[3])
   * Only the output property is readable via logic conditions
   * pid[N] is treated as pid[N].output (similar to rc[N] being rc[N].value)
   * @private
   */
  checkPidAccess(propPath, line) {
    const match = propPath.match(/^pid\[(\d+)\](?:\.(\w+))?$/);
    if (!match) {
      this.addError(`Invalid PID syntax: '${propPath}'. Expected format: pid[0] through pid[3], optionally with .output`, line);
      return;
    }

    const pidIndex = parseInt(match[1]);
    const property = match[2]; // may be undefined for pid[N] alone

    if (pidIndex < 0 || pidIndex > 3) {
      this.addError(`PID controller index ${pidIndex} out of range. INAV supports pid[0] through pid[3]`, line);
      return;
    }

    // Only .output is valid (or no property, which defaults to output)
    if (property && property !== 'output') {
      this.addError(`Unknown property '${property}' on PID controller. Only 'output' is available via logic conditions`, line);
      return;
    }

    // Valid PID access: pid[N] or pid[N].output
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
   * Note: This receives paths WITHOUT 'inav.' prefix (already stripped by caller)
   * @private
   */
  checkApiPropertyAccess(propPath, line) {
    const parts = propPath.split('.');

    if (parts.length < 1) {
      this.addError(`Invalid property path '${propPath}'`, line);
      return;
    }

    const apiCategory = parts[0];
    const startIndex = 1;

    // Check if category exists
    if (!this.inavAPI[apiCategory]) {
      this.addError(`Unknown API category '${apiCategory}' in 'inav.${propPath}'. Available: inav.${Object.keys(this.inavAPI).join(', inav.')}`, line);
      return;
    }

    const apiObj = this.inavAPI[apiCategory];

    // For category-only access (e.g., "flight"), warn that it needs a property
    if (parts.length === startIndex) {
      if (apiObj.properties.length > 0 || Object.keys(apiObj.nested).length > 0) {
        this.addWarning('incomplete-access', `'inav.${propPath}' needs a property. Did you mean to access a specific property?`, line);
      }
      return;
    }

    // Check property level and beyond
    if (parts.length > startIndex) {
      const propertyPart = parts[startIndex];

      // Check if it's a valid property
      if (apiObj.properties.includes(propertyPart)) {
        return; // Valid property
      }

      // Check if it's a nested object
      if (apiObj.nested[propertyPart]) {
        // Check nested property if present
        if (parts.length > startIndex + 1) {
          const nestedPart = parts[startIndex + 1];
          const nestedProps = apiObj.nested[propertyPart];
          if (!nestedProps.includes(nestedPart)) {
            this.addError(`Unknown property '${nestedPart}' in 'inav.${propPath}'. Available: ${nestedProps.join(', ')}`, line);
          }
        }
        return;
      }

      // Property not found
      const available = [
        ...apiObj.properties,
        ...Object.keys(apiObj.nested)
      ];
      this.addError(`Unknown property '${propertyPart}' in 'inav.${propPath}'. Available: ${available.join(', ')}`, line);
    }
  }

  /**
   * Check if property can be written to
   * Uses dispatch table like check() method
   */
  isValidWritableProperty(target) {
    // Must be namespaced
    if (!target.startsWith('inav.')) {
      return false;
    }

    const inavPath = target.substring(5); // Strip 'inav.' prefix

    // Dispatch table for writable properties
    const writableHandlers = {
      'gvar[': () => true,
      'rc[': () => true,
      'override.': () => this.checkWritableOverride(inavPath)
    };

    // Find and execute matching handler
    for (const [prefix, handler] of Object.entries(writableHandlers)) {
      if (inavPath.startsWith(prefix)) {
        return handler();
      }
    }

    return false;
  }

  /**
   * Check if override property is writable
   * @private
   */
  checkWritableOverride(inavPath) {
    const parts = inavPath.split('.');
    // parts = ['override', 'throttle'] or ['override', 'vtx', 'power']

    if (parts.length < 2) {
      return false;
    }

    const apiObj = this.inavAPI['override'];
    if (!apiObj) {
      return false;
    }

    // Check direct properties (e.g., override.throttle)
    if (apiObj.targets && apiObj.targets.includes(parts[1])) {
      return true;
    }

    // Check nested properties (e.g., override.vtx.power)
    if (parts.length >= 3 && apiObj.nested && apiObj.nested[parts[1]]) {
      return apiObj.nested[parts[1]].includes(parts[2]);
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
