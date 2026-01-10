/**
 * INAV Transpiler Main Entry Point
 * 
 * Location: tabs/programming/transpiler/transpiler/index.js
 * 
 * Coordinates parsing, semantic analysis, optimization, and code generation.
 */

'use strict';

import { JavaScriptParser } from './parser.js';
import { INAVCodeGenerator } from './codegen.js';
import { Optimizer } from './optimizer.js';
import { SemanticAnalyzer } from './analyzer.js';
import { OPERAND_TYPE, OPERATION } from './inav_constants.js';
import { INAV_CONSTANTS } from './constants.js';

/**
 * Main Transpiler Class
 * Converts JavaScript to INAV CLI commands
 */
class Transpiler {
  constructor() {
    this.parser = new JavaScriptParser();
    this.codegen = new INAVCodeGenerator();
    this.optimizer = new Optimizer();
    this.analyzer = new SemanticAnalyzer();
  }

  /**
   * Checks if code contains an INAV module import statement
   * Matches various import syntaxes:
   * - import * as inav from 'inav'
   * - import { flight } from 'inav'
   * - import inav from 'inav'
   * - const inav = require('inav')
   * - const { flight, ... } = inav  (destructuring)
   *
   * @param {string} code - JavaScript source code
   * @returns {boolean} True if INAV import exists
   */
  hasInavImport(code) {
    // Pattern matches ESM imports, CommonJS requires, and destructuring from 'inav'
    // (?:...) = non-capturing group
    // \s+ = one or more whitespace
    // ['"] = single or double quotes
    const pattern = /(?:import\s+(?:\*\s+as\s+)?\w+|import\s*{[^}]*})\s+from\s+['"]inav['"]|const\s+\w+\s*=\s*require\(['"]inav['"]\)|const\s*{[^}]*}\s*=\s*inav/;
    return pattern.test(code);
  }

  /**
   * Prepends INAV import to code if missing
   * Auto-inserts: import * as inav from 'inav';
   *
   * This is transparent to the user - the import is added only for transpilation,
   * not saved to their code or visible in the editor.
   *
   * @param {string} code - JavaScript source code
   * @returns {Object} Object with modified code and flag indicating if import was added
   */
  ensureInavImport(code) {
    if (!this.hasInavImport(code)) {
      // Prepend import with blank line for readability
      return {
        code: "import * as inav from 'inav';\n\n" + code,
        importAdded: true,
        lineOffset: 2  // Two lines were prepended
      };
    }
    return {
      code: code,
      importAdded: false,
      lineOffset: 0
    };
  }

  /**
   * Transpile JavaScript code to INAV CLI commands
   * @param {string} code - JavaScript source code
   * @returns {Object} Result with commands and metadata
   */
  transpile(code) {
    let lineOffset = 0; // Track line offset for error reporting
    try {
      // Validate input
      if (!code || typeof code !== 'string') {
        throw new Error(INAV_CONSTANTS.ERROR_MESSAGES.INVALID_INPUT_TYPE());
      }

      if (code.trim().length === 0) {
        throw new Error(INAV_CONSTANTS.ERROR_MESSAGES.EMPTY_INPUT());
      }

      // Auto-insert INAV import if missing (transparent to user)
      const importResult = this.ensureInavImport(code);
      code = importResult.code;
      lineOffset = importResult.lineOffset;

      // Step 1: Parse JavaScript to AST
      const parseResult = this.parser.parse(code);
      const ast = parseResult.statements ? parseResult : { statements: parseResult };
      
      // Validate AST structure
      if (!ast || !ast.statements || !Array.isArray(ast.statements)) {
        throw new Error(INAV_CONSTANTS.ERROR_MESSAGES.INVALID_AST());
      }
      
      // Collect parser warnings
      const parserWarnings = parseResult.warnings || [];

      // Step 2: Semantic analysis
      const analyzed = this.analyze(ast);

      // Step 3: Optimize
      const optimized = this.optimize(analyzed.ast);

      // Step 4: Generate INAV CLI commands
      // Pass the analyzer's variableHandler to codegen
      this.codegen.variableHandler = this.analyzer.variableHandler;
      const commands = this.codegen.generate(optimized);

      // Combine all warnings
      const allWarnings = [
        ...parserWarnings,
        ...analyzed.warnings,
        ...this.getLogicConditionWarnings(),
        ...this.getGvarUsageWarnings()
      ];

      // Adjust line numbers if import was auto-added
      const adjustedWarnings = this.adjustLineNumbers(allWarnings, lineOffset);

      // Categorize warnings to check for errors
      const categorized = this.categorizeWarnings(adjustedWarnings);

      // If there are parser errors (type='error'), fail the transpilation
      if (categorized.errors && categorized.errors.length > 0) {
        const errorMessages = categorized.errors.map(e =>
          `  - ${e.message}${e.line ? ` (line ${e.line})` : ''}`
        ).join('\n');
        throw new Error(`Parse errors:\n${errorMessages}`);
      }

      // Get gvar allocation summary
      const gvarSummary = this.analyzer.variableHandler ?
        this.analyzer.variableHandler.getAllocationSummary() :
        { totalUsed: 0, explicitlyUsed: 0, allocatedToVars: 0, available: 8, allocations: [] };

      // Build variable map for preservation between sessions
      const variableMap = this.codegen.buildVariableMap();

      return {
        success: true,
        commands,
        logicConditionCount: this.codegen.lcIndex,
        warnings: categorized,
        optimizations: this.optimizer.getStats(),
        gvarUsage: gvarSummary,
        variableMap,
        stats: {
          statements: ast.statements.length,
          logicConditions: this.codegen.lcIndex,
          optimizationsApplied: this.optimizer.getStats().total || 0,
          gvarSlotsUsed: gvarSummary.totalUsed,
          gvarSlotsAvailable: gvarSummary.available
        }
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error, code, lineOffset),
        commands: [],
        warnings: { errors: [], warnings: [], info: [] }
      };
    }
  }
  
  /**
   * Lint code without generating output
   * Faster than full transpilation, useful for real-time feedback
   * @param {string} code - JavaScript source code
   * @returns {Object} Lint results with errors and warnings
   */
  lint(code) {
    let lineOffset = 0; // Track line offset for error reporting
    try {
      // Validate input
      if (!code || typeof code !== 'string') {
        throw new Error(INAV_CONSTANTS.ERROR_MESSAGES.INVALID_INPUT_TYPE());
      }

      if (code.trim().length === 0) {
        return {
          success: true,
          errors: [],
          warnings: [],
          stats: { statements: 0, estimatedLogicConditions: 0 }
        };
      }

      // Auto-insert INAV import if missing (transparent to user)
      const importResult = this.ensureInavImport(code);
      code = importResult.code;
      lineOffset = importResult.lineOffset;

      // Parse
      const parseResult = this.parser.parse(code);
      const ast = parseResult.statements ? parseResult : { statements: parseResult };

      // Validate AST
      if (!ast || !ast.statements || !Array.isArray(ast.statements)) {
        throw new Error(INAV_CONSTANTS.ERROR_MESSAGES.INVALID_AST());
      }

      // Analyze
      const analyzed = this.analyzer.analyze(ast);

      // Collect all warnings
      const allWarnings = [
        ...(parseResult.warnings || []),
        ...analyzed.warnings
      ];

      // Adjust line numbers if import was auto-added
      const adjustedWarnings = this.adjustLineNumbers(allWarnings, lineOffset);

      return {
        success: true,
        errors: [],
        warnings: adjustedWarnings,
        stats: {
          statements: ast.statements.length,
          estimatedLogicConditions: this.estimateLogicConditions(ast)
        }
      };
    } catch (error) {
      // Parse error messages to extract structured errors
      const errors = error.message.includes('Semantic errors:') ?
        error.message.split('\n').slice(1).map(e => e.trim().replace(/^- /, '')) :
        [error.message];

      // Adjust line numbers in error messages
      const adjustedErrors = errors.map(err => this.adjustLineNumbersInString(err, lineOffset));

      return {
        success: false,
        errors: adjustedErrors,
        warnings: [],
        stats: { statements: 0, estimatedLogicConditions: 0 }
      };
    }
  }
  
  /**
   * Estimate logic condition count from AST
   * @param {Object} ast - Abstract syntax tree
   * @returns {number} Estimated logic condition count
   */
  estimateLogicConditions(ast) {
    let count = 0;
    for (const stmt of ast.statements) {
      if (stmt && stmt.type === 'EventHandler') {
        count++; // Handler activation condition
        if (stmt.body && Array.isArray(stmt.body)) {
          count += stmt.body.length; // Each body statement
        }
      }
    }
    return count;
  }
  
  /**
   * Perform semantic analysis
   * Includes:
   * - Variable scope checking
   * - Property validation
   * - Dead code detection
   * - Conflict detection
   * - Range validation
   * - Uninitialized variable detection
   */
  analyze(ast) {
    return this.analyzer.analyze(ast);
  }
  
  /**
   * Optimize analyzed code
   */
  optimize(ast) {
    return this.optimizer.optimize(ast);
  }
  
  /**
   * Get logic condition warnings
   */
  getLogicConditionWarnings() {
    const warnings = [];
    const count = this.codegen.lcIndex;
    const max = INAV_CONSTANTS.MAX_LOGIC_CONDITIONS;
    
    if (count > max) {
      warnings.push({
        type: 'error',
        message: INAV_CONSTANTS.ERROR_MESSAGES.TOO_MANY_LC(count, max),
        line: 0
      });
    } else if (count > INAV_CONSTANTS.WARNING_THRESHOLD) {
      warnings.push({
        type: 'warning',
        message: INAV_CONSTANTS.WARNING_MESSAGES.HIGH_LC_USAGE(count, max),
        line: 0
      });
    }
    
    return warnings;
  }

  /**
   * Get gvar usage warnings
   */
  getGvarUsageWarnings() {
    const warnings = [];

    if (!this.analyzer.variableHandler) {
      return warnings;
    }

    const summary = this.analyzer.variableHandler.getAllocationSummary();
    const totalUsed = summary.totalUsed;
    const maxGvars = 8;

    // Error if all slots used
    if (totalUsed >= maxGvars) {
      warnings.push({
        type: 'warning',
        message: `All ${maxGvars} gvar slots are in use (${summary.explicitlyUsed} explicit + ${summary.allocatedToVars} variables). Consider using 'let' for constants to free up slots.`,
        line: 0
      });
    }
    // Warning if high usage (6+ slots)
    else if (totalUsed >= 6) {
      warnings.push({
        type: 'info',
        message: `High gvar usage: ${totalUsed} of ${maxGvars} slots used (${summary.explicitlyUsed} explicit + ${summary.allocatedToVars} variables). ${summary.available} slots remaining.`,
        line: 0
      });
    }
    // Info if any vars allocated
    else if (summary.allocatedToVars > 0) {
      warnings.push({
        type: 'info',
        message: `Gvar usage: ${totalUsed} of ${maxGvars} slots used (${summary.explicitlyUsed} explicit + ${summary.allocatedToVars} variables). ${summary.available} slots remaining.`,
        line: 0
      });
    }

    return warnings;
  }

  /**
   * Adjust line numbers in warnings to account for auto-added import
   * @param {Array} warnings - Array of warning objects
   * @param {number} lineOffset - Number of lines to subtract from each warning
   * @returns {Array} Warnings with adjusted line numbers
   */
  adjustLineNumbers(warnings, lineOffset) {
    if (lineOffset === 0) {
      return warnings;
    }

    return warnings.map(warning => {
      if (typeof warning.line === 'number') {
        return {
          ...warning,
          line: Math.max(1, warning.line - lineOffset)
        };
      }
      return warning;
    });
  }

  /**
   * Adjust line numbers in error/warning message strings
   * @param {string} message - Error or warning message
   * @param {number} lineOffset - Number of lines to subtract
   * @returns {string} Message with adjusted line numbers
   */
  adjustLineNumbersInString(message, lineOffset) {
    if (lineOffset === 0 || !message) {
      return message;
    }

    // Replace "line X" with adjusted line number
    return message.replace(/line (\d+)/g, (match, lineNum) => {
      const adjustedLine = Math.max(1, parseInt(lineNum) - lineOffset);
      return `line ${adjustedLine}`;
    });
  }

  /**
   * Categorize warnings by severity
   * @param {Array} warnings - Array of warning objects
   * @returns {Object} Categorized warnings
   */
  categorizeWarnings(warnings) {
    const categorized = {
      errors: [],
      warnings: [],
      info: []
    };
    
    for (const warning of warnings) {
      const category = this.getWarningCategory(warning.type);
      categorized[category].push(warning);
    }
    
    return categorized;
  }
  
  /**
   * Get warning category from type
   * @param {string} type - Warning type
   * @returns {string} Category: 'errors', 'warnings', or 'info'
   */
  getWarningCategory(type) {
    const errorTypes = ['error', 'semantic', 'syntax', 'parse-error'];
    const infoTypes = ['optimization', 'info'];
    
    if (errorTypes.includes(type)) return 'errors';
    if (infoTypes.includes(type)) return 'info';
    return 'warnings';
  }
  
  /**
   * Format error with code context
   * @param {Error} error - Error object
   * @param {string} originalCode - Original source code (with auto-added import if applicable)
   * @param {number} lineOffset - Number of lines to subtract for user-facing display (default: 0)
   * @returns {string} Formatted error message
   */
  formatError(error, originalCode, lineOffset = 0) {
    let message = error.message;

    // Adjust line numbers in the message
    message = this.adjustLineNumbersInString(message, lineOffset);

    // Extract line number from error message if present (now adjusted)
    const lineMatch = message.match(/line (\d+)/);
    const userLine = lineMatch ? parseInt(lineMatch[1]) : null;

    // Calculate the actual line in the code (which includes the import)
    const codeLine = userLine ? userLine + lineOffset : null;

    // Add code context if line number available
    if (codeLine && originalCode) {
      const lines = originalCode.split('\n');
      const errorLine = lines[codeLine - 1];

      if (errorLine) {
        const lineNumStr = userLine.toString();
        const padding = ' '.repeat(lineNumStr.length + 1);

        message += '\n\n';

        // Show previous line for context
        if (codeLine > 1) {
          message += `  ${userLine - 1} | ${lines[codeLine - 2]}\n`;
        }

        // Show error line (display with user-facing line number)
        message += `  ${userLine} | ${errorLine}\n`;

        // Extract column number if present
        const colMatch = error.message.match(/column (\d+)/);
        if (colMatch) {
          const col = parseInt(colMatch[1]);
          message += `  ${padding}| ${' '.repeat(col)}^\n`;
        }

        // Show next line for context
        if (codeLine < lines.length) {
          message += `  ${userLine + 1} | ${lines[codeLine]}\n`;
        }
      }
    }
    
    return message;
  }
  
  /**
   * Format output as CLI commands
   * @param {string[]} commands - Array of command strings
   * @param {Object} warnings - Categorized warnings
   * @param {Object} optimizations - Optimization stats
   * @param {Object} gvarUsage - Gvar usage summary
   * @returns {string} Formatted CLI output
   */
  formatOutput(commands, warnings = null, optimizations = null, gvarUsage = null) {
    let output = '# INAV Logic Conditions\n';
    output += '# Generated by INAV JavaScript Transpiler\n';
    output += '#\n';
    output += `# Logic Conditions Used: ${this.codegen.lcIndex}/${INAV_CONSTANTS.MAX_LOGIC_CONDITIONS}\n`;

    // Add gvar usage info
    if (gvarUsage && gvarUsage.totalUsed > 0) {
      output += `# Gvar Slots Used: ${gvarUsage.totalUsed}/8`;
      if (gvarUsage.allocatedToVars > 0) {
        output += ` (${gvarUsage.explicitlyUsed} explicit + ${gvarUsage.allocatedToVars} variables)`;
      }
      output += '\n';

      // Show variable allocations
      if (gvarUsage.allocations && gvarUsage.allocations.length > 0) {
        output += '#   Variables: ';
        output += gvarUsage.allocations.map(a => `${a.name}=gvar[${a.gvarIndex}]`).join(', ');
        output += '\n';
      }
    }

    // Add optimization info
    if (optimizations && optimizations.total > 0) {
      output += '#\n';
      output += '# Optimizations Applied:\n';
      if (optimizations.report) {
        output += optimizations.report + '\n';
      }
      output += `# Total Optimizations: ${optimizations.total}\n`;
    }
    
    // Add warnings
    if (warnings) {
      if (warnings.errors && warnings.errors.length > 0) {
        output += '#\n';
        output += '# Errors:\n';
        for (const warning of warnings.errors) {
          const line = warning.line ? ` (line ${warning.line})` : '';
          output += `# [ERROR]${line} ${warning.message}\n`;
        }
      }
      
      if (warnings.warnings && warnings.warnings.length > 0) {
        output += '#\n';
        output += '# Warnings:\n';
        for (const warning of warnings.warnings) {
          const line = warning.line ? ` (line ${warning.line})` : '';
          output += `# [WARNING]${line} ${warning.message}\n`;
        }
      }
      
      if (warnings.info && warnings.info.length > 0) {
        output += '#\n';
        output += '# Info:\n';
        for (const warning of warnings.info) {
          const line = warning.line ? ` (line ${warning.line})` : '';
          output += `# [INFO]${line} ${warning.message}\n`;
        }
      }
    }
    
    output += '#\n';
    output += '# Paste these commands into INAV Configurator CLI\n';
    output += '# then type: save\n';
    output += '\n';
    
    output += commands.join('\n');
    output += '\n\nsave\n';
    
    return output;
  }
}

export { Transpiler };
