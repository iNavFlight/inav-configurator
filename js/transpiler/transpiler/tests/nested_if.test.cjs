/**
 * Nested If Statement Tests
 *
 * Tests for parser handling of nested if statements inside if bodies.
 * Bug: nested if statements were being discarded (returning null).
 */

'use strict';

require('./simple_test_runner.cjs');

let JavaScriptParser;
let SemanticAnalyzer;
let INAVCodeGenerator;

async function loadModules() {
  const parserModule = await import('../parser.js');
  JavaScriptParser = parserModule.JavaScriptParser;

  const analyzerModule = await import('../analyzer.js');
  SemanticAnalyzer = analyzerModule.SemanticAnalyzer;

  const codegenModule = await import('../codegen.js');
  INAVCodeGenerator = codegenModule.INAVCodeGenerator;
}

describe('Nested If Statements', () => {
  let parser;
  let analyzer;

  beforeEach(() => {
    parser = new JavaScriptParser();
    analyzer = new SemanticAnalyzer();
  });

  test('should handle nested if inside if body', () => {
    const code = `
      

      if (inav.flight.isArmed === 1) {
        if (inav.flight.altitude > 100) {
          inav.gvar[0] = 1;
        }
      }
    `;

    const ast = parser.parse(code);
    const analyzed = analyzer.analyze(ast);
    const codegen = new INAVCodeGenerator(analyzer.variableHandler);
    const commands = codegen.generate(analyzed.ast);

    // Should generate at least 2 logic conditions:
    // 1. outer condition (isArmed === 1)
    // 2. inner condition (altitude > 100) with activator pointing to outer
    // 3. action (inav.gvar[0] = 1)
    expect(commands.length).toBeGreaterThanOrEqual(2);

    // Should contain both conditions
    const commandsStr = commands.join('\n');
    expect(commandsStr).toContain('17'); // isArmed field
    expect(commandsStr).toContain('12'); // altitude field
  });

  test('should handle deeply nested if statements (3 levels)', () => {
    const code = `
      

      if (inav.flight.isArmed === 1) {
        if (inav.flight.altitude > 100) {
          if (inav.flight.groundSpeed > 500) {
            inav.gvar[0] = 1;
          }
        }
      }
    `;

    const ast = parser.parse(code);
    const analyzed = analyzer.analyze(ast);
    const codegen = new INAVCodeGenerator(analyzer.variableHandler);
    const commands = codegen.generate(analyzed.ast);

    // Should generate 3 conditions + 1 action
    expect(commands.length).toBeGreaterThanOrEqual(3);

    // Should contain all three conditions
    const commandsStr = commands.join('\n');
    expect(commandsStr).toContain('17'); // isArmed
    expect(commandsStr).toContain('12'); // altitude
    expect(commandsStr).toContain('9');  // groundSpeed
  });

  test('should handle nested if with else', () => {
    const code = `
      

      if (inav.flight.isArmed === 1) {
        if (inav.flight.altitude > 100) {
          inav.gvar[0] = 1;
        } else {
          inav.gvar[0] = 0;
        }
      }
    `;

    const ast = parser.parse(code);
    const analyzed = analyzer.analyze(ast);
    const codegen = new INAVCodeGenerator(analyzer.variableHandler);
    const commands = codegen.generate(analyzed.ast);

    // Should generate conditions for both branches
    expect(commands.length).toBeGreaterThanOrEqual(3);
  });

  test('should handle multiple nested ifs in sequence', () => {
    const code = `
      

      if (inav.flight.isArmed === 1) {
        if (inav.flight.altitude > 100) {
          inav.gvar[0] = 1;
        }
        if (inav.flight.groundSpeed > 500) {
          inav.gvar[1] = 1;
        }
      }
    `;

    const ast = parser.parse(code);
    const analyzed = analyzer.analyze(ast);
    const codegen = new INAVCodeGenerator(analyzer.variableHandler);
    const commands = codegen.generate(analyzed.ast);

    // Should handle both nested ifs
    expect(commands.length).toBeGreaterThanOrEqual(4);
  });
});

module.exports = { loadModules };
