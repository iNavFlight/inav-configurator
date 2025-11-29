/**
 * Test const support (alias for let)
 */

'use strict';

// Import transpiler components
const { JavaScriptParser } = require('../parser.js');
const { SemanticAnalyzer } = require('../analyzer.js');
const { INAVCodeGenerator } = require('../codegen.js');

describe('Const Support Tests', () => {

  test('const with constant value treated as let', () => {
    const code = `
      const maxAltitude = 500;

      on.always(() => {
        gvar[0] = maxAltitude;
      });
    `;

    const parser = new JavaScriptParser();
    const ast = parser.parse(code);

    const analyzer = new SemanticAnalyzer();
    const analyzed = analyzer.analyze(ast);

    const codegen = new INAVCodeGenerator(analyzer.variableHandler);
    const commands = codegen.generate(analyzed.ast);

    // Should substitute maxAltitude with 500
    expect(commands.length).toBeGreaterThan(0);
    expect(commands[commands.length - 1]).toContain('500');
  });

  test('const in condition', () => {
    const code = `
      const { flight } = inav;
      const threshold = 1000;

      if (flight.altitude > threshold) {
        gvar[0] = 1;
      }
    `;

    const parser = new JavaScriptParser();
    const ast = parser.parse(code);

    const analyzer = new SemanticAnalyzer();
    const analyzed = analyzer.analyze(ast);

    const codegen = new INAVCodeGenerator(analyzer.variableHandler);
    const commands = codegen.generate(analyzed.ast);

    // Should substitute threshold with 1000
    expect(commands.length).toBe(2);
    // First command is the if condition
    expect(commands[0]).toContain('1000');
  });

  test('const with expression', () => {
    const code = `
      const base = 100;
      const offset = 50;
      const total = base + offset;

      on.always(() => {
        gvar[0] = total;
      });
    `;

    const parser = new JavaScriptParser();
    const ast = parser.parse(code);

    const analyzer = new SemanticAnalyzer();
    const analyzed = analyzer.analyze(ast);

    // Should not throw any errors
    expect(analyzed.ast).toBeDefined();
  });

  test('Error: const redeclaration', () => {
    const code = `
      const altitude = 100;
      const altitude = 200;
    `;

    const parser = new JavaScriptParser();

    // Acorn catches redeclaration at parse time
    expect(() => parser.parse(code)).toThrow(/already been declared/);
  });

  test('Error: const reassignment', () => {
    const code = `
      const altitude = 100;

      on.always(() => {
        altitude = 200;
      });
    `;

    const parser = new JavaScriptParser();
    const ast = parser.parse(code);

    const analyzer = new SemanticAnalyzer();

    // Analyzer should throw error for reassignment
    expect(() => analyzer.analyze(ast)).toThrow(/Cannot reassign/);
  });

  test('const does not use gvar slots', () => {
    const code = `
      const a = 1;
      const b = 2;
      const c = 3;

      on.always(() => {
        gvar[0] = a + b + c;
      });
    `;

    const parser = new JavaScriptParser();
    const ast = parser.parse(code);

    const analyzer = new SemanticAnalyzer();
    const analyzed = analyzer.analyze(ast);

    expect(analyzer.variableHandler).toBeDefined();
    const summary = analyzer.variableHandler.getAllocationSummary();

    expect(summary).toBeDefined();
    // No gvar slots should be allocated for const variables
    expect(summary.allocatedToVars || 0).toBe(0);
  });
});
