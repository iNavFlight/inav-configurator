/**
 * INAV Transpiler Diagnostics Provider
 * 
 * Location: tabs/programming/transpiler/editor/diagnostics.js
 * 
 * Provides real-time error detection and helpful suggestions for unsupported code.
 * Integrates with Monaco Editor to show errors, warnings, and hints inline.
 */

'use strict';

// TODO: getDefinition and isWritable functions don't exist in api/definitions/index.js
// This import may need to be fixed or these functions implemented
import apiDefinitions from '../api/definitions/index.js';

/**
 * Severity levels for diagnostics
 */
const DiagnosticSeverity = {
  Error: 8,      // Red squiggly - code won't transpile
  Warning: 4,    // Yellow squiggly - might not work as expected
  Info: 2,       // Blue squiggly - suggestion
  Hint: 1        // Subtle hint
};

/**
 * Create Monaco diagnostics provider
 * @param {Object} monaco - Monaco editor instance
 * @returns {Object} Diagnostics provider
 */
function createDiagnosticsProvider(monaco) {
  return {
    /**
     * Validate code and return diagnostics
     * @param {Object} model - Monaco text model
     * @returns {Array} Array of diagnostic markers
     */
    validate(model) {
      const code = model.getValue();
      const diagnostics = [];
      
      // Parse code into simple AST (using regex for prototype, proper parser later)
      const lines = code.split('\n');
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNumber = i + 1;
        
        // Check for unsupported features
        diagnostics.push(...checkUnsupportedFeatures(line, lineNumber, monaco));
        
        // Check for invalid API usage
        diagnostics.push(...checkAPIUsage(line, lineNumber, monaco));
        
        // Check for common mistakes
        diagnostics.push(...checkCommonMistakes(line, lineNumber, monaco));
        
        // Check for INAV-specific constraints
        diagnostics.push(...checkINAVConstraints(line, lineNumber, monaco));
      }
      
      return diagnostics;
    },
    
    /**
     * Provide code actions (quick fixes)
     * @param {Object} model - Monaco text model
     * @param {Object} range - Text range
     * @param {Object} context - Code action context
     * @returns {Array} Array of code actions
     */
    provideCodeActions(model, range, context) {
      const actions = [];
      
      for (const marker of context.markers) {
        if (marker.code) {
          actions.push(...getQuickFixesForCode(marker.code, model, range));
        }
      }
      
      return { actions, dispose: () => {} };
    }
  };
}

/**
 * Check for unsupported JavaScript features
 */
function checkUnsupportedFeatures(line, lineNumber, monaco) {
  const diagnostics = [];
  
  // Unsupported: async/await
  if (line.match(/\basync\b|\bawait\b/)) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('async') >= 0 ? line.indexOf('async') : line.indexOf('await'),
      5,
      'Async/await is not supported. INAV logic conditions execute synchronously.',
      DiagnosticSeverity.Error,
      'UNSUPPORTED_ASYNC'
    ));
  }
  
  // Unsupported: Promises
  if (line.match(/new Promise|\.then\(|\.catch\(/)) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('Promise') >= 0 ? line.indexOf('Promise') : line.indexOf('.then'),
      7,
      'Promises are not supported. Use synchronous code only.',
      DiagnosticSeverity.Error,
      'UNSUPPORTED_PROMISE'
    ));
  }
  
  // Unsupported: setTimeout/setInterval
  if (line.match(/setTimeout|setInterval/)) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('set'),
      10,
      'setTimeout/setInterval not supported. Use inav.timer() or inav.delay() instead.',
      DiagnosticSeverity.Error,
      'UNSUPPORTED_TIMER',
      'Use inav.timer() for repeated execution'
    ));
  }
  
  // Unsupported: Classes
  if (line.match(/\bclass\b/)) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('class'),
      5,
      'Classes are not supported. Use simple functions and objects.',
      DiagnosticSeverity.Error,
      'UNSUPPORTED_CLASS'
    ));
  }
  
  // Unsupported: for loops (transpiler limitation)
  if (line.match(/\bfor\s*\(/)) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('for'),
      3,
      'For loops are not directly supported. Consider using array methods or unrolling the loop.',
      DiagnosticSeverity.Warning,
      'UNSUPPORTED_LOOP'
    ));
  }
  
  // Unsupported: while loops
  if (line.match(/\bwhile\s*\(/)) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('while'),
      5,
      'While loops are not supported. INAV logic conditions are evaluated once per cycle.',
      DiagnosticSeverity.Error,
      'UNSUPPORTED_LOOP'
    ));
  }
  
  // Unsupported: try/catch
  if (line.match(/\btry\b|\bcatch\b/)) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('try') >= 0 ? line.indexOf('try') : line.indexOf('catch'),
      3,
      'Try/catch is not supported. All operations are assumed to succeed.',
      DiagnosticSeverity.Warning,
      'UNSUPPORTED_TRYCATCH'
    ));
  }
  
  // Unsupported: Regular expressions
  if (line.match(/\/.*\/[gimsuy]|\bnew RegExp/)) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('/'),
      5,
      'Regular expressions are not supported.',
      DiagnosticSeverity.Error,
      'UNSUPPORTED_REGEX'
    ));
  }
  
  // Unsupported: Floating point (INAV uses integers only)
  const floatMatch = line.match(/\b\d+\.\d+\b/);
  if (floatMatch) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf(floatMatch[0]),
      floatMatch[0].length,
      'INAV uses integer math only. Decimals will be truncated. Consider scaling (e.g., use cm instead of m).',
      DiagnosticSeverity.Warning,
      'INTEGER_MATH'
    ));
  }

  // Unsupported: Array methods
  if (line.match(/\.(map|filter|forEach|reduce|find|some|every|includes)\s*\(/)) {
    const match = line.match(/\.(map|filter|forEach|reduce|find|some|every|includes)/);
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf(match[0]),
      match[0].length,
      `Array method .${match[1]}() is not supported. INAV logic conditions cannot iterate over arrays.`,
      DiagnosticSeverity.Error,
      'UNSUPPORTED_ARRAY_METHOD'
    ));
  }

  // Unsupported: String methods
  if (line.match(/\.(substring|substr|indexOf|charAt|split|replace|trim|toUpperCase|toLowerCase)\s*\(/)) {
    const match = line.match(/\.(substring|substr|indexOf|charAt|split|replace|trim|toUpperCase|toLowerCase)/);
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf(match[0]),
      match[0].length,
      `String method .${match[1]}() is not supported. INAV works with numbers, not strings.`,
      DiagnosticSeverity.Error,
      'UNSUPPORTED_STRING_METHOD'
    ));
  }

  // Unsupported: Template literals
  if (line.match(/`[^`]*\${/)) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('`'),
      line.lastIndexOf('`') - line.indexOf('`') + 1,
      'Template literals are not supported. INAV logic conditions work with numbers only.',
      DiagnosticSeverity.Error,
      'UNSUPPORTED_TEMPLATE_LITERAL'
    ));
  }

  // Unsupported: console.log
  if (line.match(/console\.(log|error|warn|info|debug)/)) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('console'),
      7,
      'console.log() is not supported. INAV logic conditions cannot output to console. Use global variables (gvar) for debugging.',
      DiagnosticSeverity.Warning,
      'UNSUPPORTED_CONSOLE',
      'Use gvar[0] = value to track values'
    ));
  }

  // Unsupported: Ternary operator (may or may not work - conservative warning)
  if (line.match(/\?[^:]*:/)) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('?'),
      1,
      'Ternary operator (? :) support is limited. Use if/else statements for reliability.',
      DiagnosticSeverity.Warning,
      'TERNARY_OPERATOR'
    ));
  }

  // Unsupported: Switch statements
  if (line.match(/\bswitch\s*\(/)) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('switch'),
      6,
      'Switch statements are not supported. Use if/else if/else instead.',
      DiagnosticSeverity.Error,
      'UNSUPPORTED_SWITCH'
    ));
  }

  // Unsupported: typeof operator
  if (line.match(/\btypeof\b/)) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('typeof'),
      6,
      'typeof operator is not supported. INAV logic conditions work only with numbers.',
      DiagnosticSeverity.Error,
      'UNSUPPORTED_TYPEOF'
    ));
  }

  // Unsupported: Math methods (except supported ones)
  // Supported: Math.abs, Math.min, Math.max, Math.sin, Math.cos, Math.tan
  if (line.match(/Math\.(floor|ceil|round|sqrt|pow|random|log|exp|atan|asin|acos|atan2)\s*\(/)) {
    const match = line.match(/Math\.(floor|ceil|round|sqrt|pow|random|log|exp|atan|asin|acos|atan2)/);
    const method = match[1];
    let message = `Math.${method}() is not supported.`;

    // Provide alternatives for some methods
    if (method === 'floor' || method === 'ceil' || method === 'round') {
      message += ' Integer division (/) automatically truncates.';
    } else if (method === 'sqrt') {
      message += ' No square root available.';
    } else if (method === 'pow') {
      message += ' Use repeated multiplication.';
    }

    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf(match[0]),
      match[0].length,
      message,
      DiagnosticSeverity.Warning,
      'UNSUPPORTED_MATH_METHOD'
    ));
  }

  // Warn about compound assignment operators
  if (line.match(/[+\-*/%]=/) && !line.match(/[<>!=]=/) && !line.match(/===|!==|==|!=/)) {
    const match = line.match(/([+\-*/%])=/);
    if (match) {
      diagnostics.push(createDiagnostic(
        monaco,
        lineNumber,
        line.indexOf(match[0]),
        match[0].length,
        `Compound assignment ${match[0]} may not be supported. Use 'x = x ${match[1]} value' instead.`,
        DiagnosticSeverity.Info,
        'COMPOUND_ASSIGNMENT'
      ));
    }
  }

  // Unsupported: return statement
  if (line.match(/\breturn\b/)) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('return'),
      6,
      'return statement is not needed. Logic conditions execute as actions, not functions.',
      DiagnosticSeverity.Warning,
      'UNNECESSARY_RETURN'
    ));
  }

  // Unsupported: function declarations (suggest arrow functions)
  if (line.match(/\bfunction\s+\w+\s*\(/)) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('function'),
      8,
      'Function declarations are not supported. Use arrow functions for event handlers (e.g., on.arm(() => {...})).',
      DiagnosticSeverity.Error,
      'UNSUPPORTED_FUNCTION_DECLARATION'
    ));
  }

  // Unsupported: new operator
  if (line.match(/\bnew\s+\w+/)) {
    const match = line.match(/\bnew\s+(\w+)/);
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('new'),
      3,
      `'new ${match[1]}' is not supported. INAV logic conditions cannot create objects.`,
      DiagnosticSeverity.Error,
      'UNSUPPORTED_NEW_OPERATOR'
    ));
  }

  // Unsupported: this keyword
  if (line.match(/\bthis\./)) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('this'),
      4,
      "'this' keyword is not supported. Use global variables (gvar) or direct property access instead.",
      DiagnosticSeverity.Error,
      'UNSUPPORTED_THIS'
    ));
  }

  // Helpful: Suggest using edge() for state change detection
  if (line.match(/flight\.armed/) && !line.match(/edge\(/)) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('flight.armed'),
      12,
      'Consider using edge(flight.armed) to detect arming/disarming events rather than checking current state.',
      DiagnosticSeverity.Info,
      'SUGGEST_EDGE'
    ));
  }

  return diagnostics;
}

/**
 * Check for invalid API usage
 */
function checkAPIUsage(line, lineNumber, monaco) {
  const diagnostics = [];
  
  // Check for reads from write-only properties
  const writeAttempts = line.matchAll(/(\w+(?:\.\w+)*)\s*=/g);
  for (const match of writeAttempts) {
    const path = match[1];
    if (path.startsWith('flight.') || path.startsWith('waypoint.')) {
      diagnostics.push(createDiagnostic(
        monaco,
        lineNumber,
        match.index,
        path.length,
        `Cannot write to read-only property '${path}'. Flight parameters are read-only.`,
        DiagnosticSeverity.Error,
        'READONLY_WRITE'
      ));
    }
  }
  
  // TODO: Check for undefined API properties
  // Disabled: getDefinition() function not yet implemented
  // See api/definitions/index.js for future implementation
  // const propertyAccess = line.matchAll(/inav\.(\w+)\.(\w+)/g);
  // for (const match of propertyAccess) {
  //   const [full, category, property] = match;
  //   const path = `${category}.${property}`;
  //   const def = getDefinition(path);
  //
  //   if (!def) {
  //     diagnostics.push(createDiagnostic(
  //       monaco,
  //       lineNumber,
  //       match.index,
  //       full.length,
  //       `Unknown property '${path}'. Check API documentation for valid properties.`,
  //       DiagnosticSeverity.Error,
  //       'UNKNOWN_PROPERTY',
  //       'Did you mean one of the available properties?'
  //     ));
  //   }
  // }

  // Warn about rc[0] - INAV uses 1-based RC channel indexing
  if (line.match(/rc\[0\]/)) {
    const match = line.match(/rc\[0\]/);
    if (match) {
      diagnostics.push(createDiagnostic(
        monaco,
        lineNumber,
        line.indexOf(match[0]),
        match[0].length,
        'RC channels use 1-based indexing. rc[0] is invalid - use rc[1] for the first channel.',
        DiagnosticSeverity.Error,
        'INVALID_RC_ZERO',
        'INAV RC channels are numbered 1-18, not 0-17'
      ));
    }
  }

  return diagnostics;
}

/**
 * Check for common mistakes
 */
function checkCommonMistakes(line, lineNumber, monaco) {
  const diagnostics = [];
  
  // Missing inav destructuring
  if (line.match(/\b(flight|override|on)\b/) && 
      !line.includes('inav') && 
      !line.includes('const {') && 
      lineNumber < 5) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      0,
      line.length,
      'Missing API destructuring. Add: const { flight, override, on } = inav;',
      DiagnosticSeverity.Info,
      'MISSING_DESTRUCTURE'
    ));
  }
  
  // Using == instead of ===
  if (line.match(/[^=!<>]==[^=]/) && !line.includes('===')) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf('=='),
      2,
      'Use === for strict equality instead of ==',
      DiagnosticSeverity.Info,
      'USE_STRICT_EQUALITY'
    ));
  }
  
  return diagnostics;
}

/**
 * Check INAV-specific constraints
 */
function checkINAVConstraints(line, lineNumber, monaco) {
  const diagnostics = [];
  
  // Check VTX power range (0-4)
  const vtxPower = line.match(/vtx\.power\s*=\s*(\d+)/);
  if (vtxPower) {
    const power = parseInt(vtxPower[1]);
    if (power < 0 || power > 4) {
      diagnostics.push(createDiagnostic(
        monaco,
        lineNumber,
        line.indexOf(vtxPower[1]),
        vtxPower[1].length,
        'VTX power must be 0-4',
        DiagnosticSeverity.Error,
        'INVALID_RANGE'
      ));
    }
  }
  
  // Check throttleScale range (0-100)
  const throttleScale = line.match(/throttleScale\s*=\s*(\d+)/);
  if (throttleScale) {
    const scale = parseInt(throttleScale[1]);
    if (scale < 0 || scale > 100) {
      diagnostics.push(createDiagnostic(
        monaco,
        lineNumber,
        line.indexOf(throttleScale[1]),
        throttleScale[1].length,
        'Throttle scale must be 0-100%',
        DiagnosticSeverity.Error,
        'INVALID_RANGE'
      ));
    }
  }
  
  // Check GVAR index (0-7)
  const gvarAccess = line.match(/gvar\[(\d+)\]/);
  if (gvarAccess) {
    const index = parseInt(gvarAccess[1]);
    if (index < 0 || index > 7) {
      diagnostics.push(createDiagnostic(
        monaco,
        lineNumber,
        line.indexOf(gvarAccess[1]),
        gvarAccess[1].length,
        'GVAR index must be 0-7',
        DiagnosticSeverity.Error,
        'INVALID_GVAR_INDEX'
      ));
    }
  }
  
  // Warn about large numbers (may overflow)
  const largeNumber = line.match(/\b([1-9]\d{5,})\b/);
  if (largeNumber && !line.includes('//')) {
    diagnostics.push(createDiagnostic(
      monaco,
      lineNumber,
      line.indexOf(largeNumber[1]),
      largeNumber[1].length,
      'Large numbers may overflow. INAV uses 32-bit integers (-2147483648 to 2147483647).',
      DiagnosticSeverity.Warning,
      'POTENTIAL_OVERFLOW'
    ));
  }
  
  return diagnostics;
}

/**
 * Create diagnostic marker
 */
function createDiagnostic(monaco, lineNumber, column, length, message, severity, code, hint) {
  return {
    severity,
    message,
    code,
    source: 'INAV Transpiler',
    startLineNumber: lineNumber,
    startColumn: column + 1,
    endLineNumber: lineNumber,
    endColumn: column + length + 1,
    relatedInformation: hint ? [{
      message: hint,
      startLineNumber: lineNumber,
      startColumn: column + 1,
      endLineNumber: lineNumber,
      endColumn: column + length + 1
    }] : undefined
  };
}

/**
 * Get quick fixes for specific error codes
 */
function getQuickFixesForCode(code, model, range) {
  const actions = [];
  
  switch (code) {
    case 'UNSUPPORTED_TIMER':
      actions.push({
        title: 'Replace with inav.timer()',
        kind: 'quickfix',
        edit: {
          edits: [{
            resource: model.uri,
            edit: {
              range,
              text: 'inav.timer(1000, 0, () => {\n  // Your code here\n});'
            }
          }]
        }
      });
      break;
      
    case 'MISSING_DESTRUCTURE':
      actions.push({
        title: 'Add INAV API destructuring',
        kind: 'quickfix',
        edit: {
          edits: [{
            resource: model.uri,
            edit: {
              range: { startLineNumber: 1, startColumn: 1, endLineNumber: 1, endColumn: 1 },
              text: 'const { flight, rc, override, waypoint, gvar, on } = inav;\n\n'
            }
          }]
        }
      });
      break;
      
    case 'USE_STRICT_EQUALITY':
      actions.push({
        title: 'Replace == with ===',
        kind: 'quickfix',
        edit: {
          edits: [{
            resource: model.uri,
            edit: {
              range,
              text: model.getValueInRange(range).replace('==', '===')
            }
          }]
        }
      });
      break;
  }
  
  return actions;
}

/**
 * Set up diagnostics for Monaco editor
 * @param {Object} monaco - Monaco editor instance
 * @param {Object} editor - Monaco editor instance
 */
function setupDiagnostics(monaco, editor) {
  const diagnosticsProvider = createDiagnosticsProvider(monaco);
  
  // Validate on content change
  editor.onDidChangeModelContent(() => {
    const model = editor.getModel();
    const diagnostics = diagnosticsProvider.validate(model);
    monaco.editor.setModelMarkers(model, 'inav-transpiler', diagnostics);
  });
  
  // Provide code actions (quick fixes)
  monaco.languages.registerCodeActionProvider('javascript', {
    provideCodeActions: diagnosticsProvider.provideCodeActions
  });
  
  // Initial validation
  const model = editor.getModel();
  const diagnostics = diagnosticsProvider.validate(model);
  monaco.editor.setModelMarkers(model, 'inav-transpiler', diagnostics);
}

export {
  DiagnosticSeverity,
  createDiagnosticsProvider,
  setupDiagnostics
};
