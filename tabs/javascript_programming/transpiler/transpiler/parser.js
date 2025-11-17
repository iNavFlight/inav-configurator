/**
 * INAV JavaScript Parser
 * 
 * Location: tabs/programming/transpiler/transpiler/parser.js
 * 
 * Simple JavaScript parser for INAV subset.
 * For production, would use Acorn or similar, but this demonstrates the concept.
 */

/**
 * Simple JavaScript Parser for INAV subset
 * Parses JavaScript code into a simple AST
 */
export class JavaScriptParser {
  /**
   * Parse JavaScript code
   * @param {string} code - JavaScript source code
   * @returns {Object} Simple AST
   */
  parse(code) {
    // Remove comments and normalize whitespace
    code = this.removeComments(code);
    
    const statements = [];
    const lines = code.split('\n').filter(line => line.trim());
    
    let i = 0;
    while (i < lines.length) {
      const result = this.parseStatement(lines, i);
      if (result) {
        statements.push(result.statement);
        i = result.nextIndex;
      } else {
        i++;
      }
    }
    
    return { statements };
  }
  
  /**
   * Remove comments from code
   */
  removeComments(code) {
    // Remove single-line comments
    code = code.replace(/\/\/.*$/gm, '');
    // Remove multi-line comments
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    return code;
  }
  
  /**
   * Parse a single statement
   */
  parseStatement(lines, startIndex) {
    const line = lines[startIndex].trim();
    
    // Skip empty lines
    if (!line) {
      return { statement: null, nextIndex: startIndex + 1 };
    }
    
    // Destructuring: const { flight, override } = inav;
    if (line.includes('const {') && line.includes('} = inav')) {
      return { statement: { type: 'Destructuring' }, nextIndex: startIndex + 1 };
    }
    
    // on.arm({ delay: 1 }, () => {
    if (line.startsWith('on.arm(')) {
      return this.parseEventHandler(lines, startIndex, 'on.arm');
    }
    
    // when(() => condition, () => {
    if (line.startsWith('when(')) {
      return this.parseWhenStatement(lines, startIndex);
    }
    
    // Simple assignment: gvar[0] = 100;
    if (line.includes('=') && line.endsWith(';')) {
      return { 
        statement: this.parseAssignment(line), 
        nextIndex: startIndex + 1 
      };
    }
    
    return { statement: null, nextIndex: startIndex + 1 };
  }
  
  /**
   * Parse event handler (on.arm, on.always)
   */
  parseEventHandler(lines, startIndex, handler) {
    const line = lines[startIndex];
    
    // Extract config: on.arm({ delay: 1 }, () => {
    const configMatch = line.match(/\{([^}]+)\}/);
    const config = {};
    
    if (configMatch) {
      const configStr = configMatch[1];
      const delayMatch = configStr.match(/delay:\s*(\d+)/);
      if (delayMatch) {
        config.delay = parseInt(delayMatch[1]);
      }
    }
    
    // Find matching closing brace
    const body = [];
    let braceCount = 1;
    let i = startIndex + 1;
    
    while (i < lines.length && braceCount > 0) {
      const bodyLine = lines[i].trim();
      
      if (bodyLine.includes('{')) braceCount++;
      if (bodyLine.includes('}')) braceCount--;
      
      if (braceCount > 0 && bodyLine && !bodyLine.startsWith('//')) {
        const stmt = this.parseBodyStatement(bodyLine);
        if (stmt) body.push(stmt);
      }
      
      i++;
    }
    
    return {
      statement: {
        type: 'EventHandler',
        handler,
        config,
        body
      },
      nextIndex: i
    };
  }
  
  /**
   * Parse when statement
   */
  parseWhenStatement(lines, startIndex) {
    const line = lines[startIndex];
    
    // Extract condition: when(() => flight.homeDistance > 100, () => {
    const conditionMatch = line.match(/when\(\(\)\s*=>\s*([^,]+),/);
    if (!conditionMatch) {
      return { statement: null, nextIndex: startIndex + 1 };
    }
    
    const conditionStr = conditionMatch[1].trim();
    const condition = this.parseCondition(conditionStr);
    
    // Find body
    const body = [];
    let braceCount = 1;
    let i = startIndex + 1;
    
    while (i < lines.length && braceCount > 0) {
      const bodyLine = lines[i].trim();
      
      if (bodyLine.includes('{')) braceCount++;
      if (bodyLine.includes('}')) braceCount--;
      
      if (braceCount > 0 && bodyLine && !bodyLine.startsWith('//')) {
        const stmt = this.parseBodyStatement(bodyLine);
        if (stmt) body.push(stmt);
      }
      
      i++;
    }
    
    return {
      statement: {
        type: 'EventHandler',
        handler: 'when',
        condition,
        body
      },
      nextIndex: i
    };
  }
  
  /**
   * Parse condition expression
   */
  parseCondition(conditionStr) {
    // Handle logical OR: a || b
    if (conditionStr.includes('||')) {
      const parts = conditionStr.split('||').map(p => p.trim());
      return {
        type: 'LogicalExpression',
        operator: '||',
        left: this.parseCondition(parts[0]),
        right: this.parseCondition(parts[1])
      };
    }
    
    // Handle logical AND: a && b
    if (conditionStr.includes('&&')) {
      const parts = conditionStr.split('&&').map(p => p.trim());
      return {
        type: 'LogicalExpression',
        operator: '&&',
        left: this.parseCondition(parts[0]),
        right: this.parseCondition(parts[1])
      };
    }
    
    // Handle comparison: a > b, a < b, a === b
    const operators = ['===', '==', '>', '<', '>=', '<='];
    for (const op of operators) {
      if (conditionStr.includes(op)) {
        const parts = conditionStr.split(op).map(p => p.trim());
        return {
          type: 'BinaryExpression',
          operator: op,
          left: parts[0],
          right: this.parseValue(parts[1])
        };
      }
    }
    
    // Simple boolean property: flight.mode.failsafe
    return {
      type: 'MemberExpression',
      value: conditionStr
    };
  }
  
  /**
   * Parse statement in event handler body
   */
  parseBodyStatement(line) {
    // Remove trailing semicolon
    line = line.replace(/;$/, '').trim();
    
    // Assignment: gvar[0] = value;
    if (line.includes('=')) {
      return this.parseAssignment(line);
    }
    
    return null;
  }
  
  /**
   * Parse assignment statement
   */
  parseAssignment(line) {
    // Remove semicolon
    line = line.replace(/;$/, '').trim();
    
    const parts = line.split('=').map(p => p.trim());
    if (parts.length !== 2) return null;
    
    const target = parts[0];
    const valueStr = parts[1];
    
    // Check if it's arithmetic: heading = flight.mixerProfile + 180
    const arithmeticOps = ['+', '-', '*', '/', '%'];
    for (const op of arithmeticOps) {
      if (valueStr.includes(op)) {
        const operands = valueStr.split(op).map(p => p.trim());
        return {
          type: 'Assignment',
          target,
          operation: op,
          left: operands[0],
          right: this.parseValue(operands[1])
        };
      }
    }
    
    // Simple assignment
    return {
      type: 'Assignment',
      target,
      value: this.parseValue(valueStr)
    };
  }
  
  /**
   * Parse a value (number, string, or identifier)
   */
  parseValue(str) {
    str = str.trim();
    
    // Number
    if (/^-?\d+$/.test(str)) {
      return parseInt(str);
    }
    
    // Boolean
    if (str === 'true') return true;
    if (str === 'false') return false;
    
    // String (identifier, property access, etc.)
    return str;
  }
}