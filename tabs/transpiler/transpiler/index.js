/**
 * INAV Transpiler Main Entry Point
 * 
 * Location: tabs/programming/transpiler/transpiler/index.js
 * 
 * Coordinates parsing, semantic analysis, optimization, and code generation.
 */

'use strict';

const { JavaScriptParser } = require('./parser.js');
const { INAVCodeGenerator } = require('./codegen.js');
const { Optimizer } = require('./optimizer.js');
const { SemanticAnalyzer } = require('./analyzer.js');
const { INAV_CONSTANTS } = require('./constants.js');

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
   * Transpile JavaScript code to INAV CLI commands
   * @param {string} code - JavaScript source code
   * @returns {Object} Result with commands and metadata
   */
  transpile(code) {
    try {
      // Validate input
      if (!code || typeof code !== 'string') {
        throw new Error(INAV_CONSTANTS.ERROR_MESSAGES.INVALID_INPUT_TYPE());
      }
      
      if (code.trim().length === 0) {
        throw new Error(INAV_CONSTANTS.ERROR_MESSAGES.EMPTY_INPUT());
      }
      
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
      const commands = this.codegen.generate(optimized);
      
      // Combine all warnings
      const allWarnings = [
        ...parserWarnings,
        ...analyzed.warnings,
        ...this.getLogicConditionWarnings()
      ];
      
      return {
        success: true,
        commands,
        logicConditionCount: this.codegen.lcIndex,
        warnings: this.categorizeWarnings(allWarnings),
        optimizations: this.optimizer.getStats(),
        stats: {
          statements: ast.statements.length,
          logicConditions: this.codegen.lcIndex,
          optimizationsApplied: this.optimizer.getStats().total || 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: this.formatError(error, code),
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
      
      return {
        success: true,
        errors: [],
        warnings: allWarnings,
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
      
      return {
        success: false,
        errors,
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
   * @param {string} originalCode - Original source code
   * @returns {string} Formatted error message
   */
  formatError(error, originalCode) {
    let message = error.message;
    
    // Extract line number from error message if present
    const lineMatch = message.match(/line (\d+)/);
    const line = lineMatch ? parseInt(lineMatch[1]) : null;
    
    // Add code context if line number available
    if (line && originalCode) {
      const lines = originalCode.split('\n');
      const errorLine = lines[line - 1];
      
      if (errorLine) {
        const lineNumStr = line.toString();
        const padding = ' '.repeat(lineNumStr.length + 1);
        
        message += '\n\n';
        
        // Show previous line for context
        if (line > 1) {
          message += `  ${line - 1} | ${lines[line - 2]}\n`;
        }
        
        // Show error line
        message += `  ${line} | ${errorLine}\n`;
        
        // Extract column number if present
        const colMatch = error.message.match(/column (\d+)/);
        if (colMatch) {
          const col = parseInt(colMatch[1]);
          message += `  ${padding}| ${' '.repeat(col)}^\n`;
        }
        
        // Show next line for context
        if (line < lines.length) {
          message += `  ${line + 1} | ${lines[line]}\n`;
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
   * @returns {string} Formatted CLI output
   */
  formatOutput(commands, warnings = null, optimizations = null) {
    let output = '# INAV Logic Conditions\n';
    output += '# Generated by INAV JavaScript Transpiler\n';
    output += '#\n';
    output += `# Logic Conditions Used: ${this.codegen.lcIndex}/${INAV_CONSTANTS.MAX_LOGIC_CONDITIONS}\n`;
    
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

module.exports = { Transpiler };
