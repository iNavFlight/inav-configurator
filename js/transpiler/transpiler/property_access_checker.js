/**
 * Property Access Checker Helper
 *
 * Location: js/transpiler/transpiler/property_access_checker.js
 *
 * Validates property access in JavaScript code (gvar, rc, API objects).
 * Extracted from analyzer.js to improve modularity.
 */

'use strict';

import apiDefinitions from '../api/definitions/index.js';

/**
 * Helper class for checking property access validity
 */
class PropertyAccessChecker {
  /**
   * @param {Object} context - Context object containing dependencies
   * @param {Object} context.inavAPI - INAV API definitions (processed structure)
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

    // For category-only access (e.g., "flight"), error that it needs a property
    if (parts.length === startIndex) {
      if (apiObj.properties.length > 0 || Object.keys(apiObj.nested).length > 0) {
        // Build helpful error message with available properties
        const availableProps = [
          ...apiObj.properties.slice(0, 3).map(p => `inav.${apiCategory}.${p}`),
          ...Object.keys(apiObj.nested).slice(0, 2).map(p => `inav.${apiCategory}.${p}.*`)
        ].join(', ');
        this.addError(
          `Cannot use 'inav.${propPath}' - it's an object, not a property. Examples: ${availableProps}`,
          line
        );
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
        // Must have a nested property - can't use intermediate object directly
        if (parts.length === startIndex + 1) {
          // Accessing intermediate object without going deeper
          const nestedProps = apiObj.nested[propertyPart];
          const suggestions = nestedProps.slice(0, 3).map(p => `inav.${apiCategory}.${propertyPart}.${p}`).join(', ');
          this.addError(
            `Cannot use 'inav.${propPath}' - it's an object, not a property. ` +
            `Available properties: ${suggestions}${nestedProps.length > 3 ? ', ...' : ''}`,
            line
          );
          return;
        }

        // Check nested property if present
        if (parts.length > startIndex + 1) {
          const nestedPart = parts[startIndex + 1];
          const nestedProps = apiObj.nested[propertyPart];

          // Check if nested part is ALSO an object (3-level nesting like override.flightAxis.yaw)
          // Need to check the API definition to see if this is a leaf or another object
          if (!nestedProps.includes(nestedPart)) {
            this.addError(`Unknown property '${nestedPart}' in 'inav.${propPath}'. Available: ${nestedProps.join(', ')}`, line);
            return;
          }

          // Check if we stopped at a nested object (e.g., override.flightAxis.yaw instead of override.flightAxis.yaw.angle)
          if (parts.length === startIndex + 2) {
            // Need to check if nestedPart is itself an object
            // This requires checking the actual API definition structure
            const isNestedObject = this.isPropertyAnObject(apiCategory, propertyPart, nestedPart);
            if (isNestedObject) {
              const deeperProps = this.getNestedObjectProperties(apiCategory, propertyPart, nestedPart);
              if (deeperProps && deeperProps.length > 0) {
                const suggestions = deeperProps.slice(0, 3).map(p => `inav.${apiCategory}.${propertyPart}.${nestedPart}.${p}`).join(', ');
                this.addError(
                  `Cannot use 'inav.${propPath}' - it's an object, not a property. ` +
                  `Available properties: ${suggestions}${deeperProps.length > 3 ? ', ...' : ''}`,
                  line
                );
                return;
              }
            }
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
    // Normalize target (strip 'inav.' prefix if present for backward compatibility)
    const normalizedTarget = target.startsWith('inav.') ? target.substring(5) : target;

    // Dispatch table for writable properties
    const writableHandlers = {
      'gvar[': () => true,
      'rc[': () => true,
      'override.': () => this.checkWritableOverride(normalizedTarget)
    };

    // Find and execute matching handler
    for (const [prefix, handler] of Object.entries(writableHandlers)) {
      if (normalizedTarget.startsWith(prefix)) {
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
    // parts = ['override', 'throttle'] or ['override', 'vtx', 'power'] or ['override', 'flightAxis', 'yaw', 'angle']

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

    // Check nested properties (e.g., override.vtx.power or override.flightAxis.yaw.angle)
    if (parts.length >= 3 && apiObj.nested && apiObj.nested[parts[1]]) {
      // Verify the property exists in the nested list
      if (!apiObj.nested[parts[1]].includes(parts[2])) {
        return false;
      }

      // For 3-level paths, need to check if parts[2] is itself an object (intermediate)
      // If it has deeper nesting (like flightAxis.yaw.angle), the 3-level path is incomplete
      if (parts.length === 3) {
        // Check if this property is an intermediate object using the helper method
        const isObject = this.isPropertyAnObject('override', parts[1], parts[2]);
        if (isObject) {
          // It's an intermediate object - need to go deeper (e.g., yaw.angle or yaw.rate)
          return false;
        }
        // It's a leaf property - writable
        return true;
      }

      // For 4+ level paths (e.g., override.flightAxis.yaw.angle), verify all levels exist
      // This is handled by the broader validation in checkApiPropertyAccess
      return true;
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

  /**
   * Check if a property is itself an object (not a leaf value)
   * Used to detect 3-level nested objects like override.flightAxis.yaw
   * @param {string} category - API category (e.g., 'override')
   * @param {string} parentProp - Parent property (e.g., 'flightAxis')
   * @param {string} childProp - Child property (e.g., 'yaw')
   * @returns {boolean} True if childProp is an object with more properties
   * @private
   */
  isPropertyAnObject(category, parentProp, childProp) {
    try {
      // Use raw API definitions to preserve nested structure
      const categoryDef = apiDefinitions[category];
      if (!categoryDef) return false;

      const parentDef = categoryDef[parentProp];
      if (!parentDef || !parentDef.properties) return false;

      const childDef = parentDef.properties[childProp];
      if (!childDef) return false;

      // Simple check: typeof object with properties
      return childDef.type === 'object' && childDef.properties && Object.keys(childDef.properties).length > 0;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get properties of a nested object
   * @param {string} category - API category (e.g., 'override')
   * @param {string} parentProp - Parent property (e.g., 'flightAxis')
   * @param {string} childProp - Child property (e.g., 'yaw')
   * @returns {string[]|null} Array of property names or null
   * @private
   */
  getNestedObjectProperties(category, parentProp, childProp) {
    try {
      // Use raw API definitions
      const categoryDef = apiDefinitions[category];
      if (!categoryDef) return null;

      const parentDef = categoryDef[parentProp];
      if (!parentDef || !parentDef.properties) return null;

      const childDef = parentDef.properties[childProp];
      if (!childDef || !childDef.properties) return null;

      return Object.keys(childDef.properties);
    } catch (error) {
      return null;
    }
  }
}

export { PropertyAccessChecker };
