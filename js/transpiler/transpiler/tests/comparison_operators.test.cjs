/**
 * Comparison Operators Test Suite
 *
 * Tests that >= <= != operators are correctly synthesized using NOT
 * since INAV Logic Conditions don't have native support for these.
 *
 * Expected synthesis:
 *   a >= b  →  NOT(a < b)
 *   a <= b  →  NOT(a > b)
 *   a != b  →  NOT(a == b)
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

function transpile(code) {
  const parser = new JavaScriptParser();
  const analyzer = new SemanticAnalyzer();

  const ast = parser.parse(code);
  const analyzed = analyzer.analyze(ast);
  const codegen = new INAVCodeGenerator(analyzer.variableHandler);
  const commands = codegen.generate(analyzed.ast);

  // Parse CLI commands into structured objects for easier testing
  const parsed = commands.map(cmd => {
    // Parse: "logic 0 1 0 3 2 12 0 100 0"
    // Format: logic <id> <enabled> <activator> <operation> <operandAType> <operandAValue> <operandBType> <operandBValue> <flags>
    const parts = cmd.split(' ');
    return {
      id: parseInt(parts[1]),
      enabled: parseInt(parts[2]),
      activator: parseInt(parts[3]),
      operation: parseInt(parts[4]),
      operandAType: parseInt(parts[5]),
      operandAValue: parseInt(parts[6]),
      operandBType: parseInt(parts[7]),
      operandBValue: parseInt(parts[8]),
      flags: parseInt(parts[9]) || 0
    };
  });

  return {
    success: true,
    commands: parsed,
    rawCommands: commands
  };
}

describe('Comparison Operators Synthesis', () => {

  test('should normalize >= constant to > (constant-1)', () => {
    const code = `
      if (inav.flight.altitude >= 100) {
        inav.gvar[0] = 1;
      }
    `;

    const result = transpile(code);
    expect(result.success).toBe(true);
    // Normalized: altitude >= 100 becomes altitude > 99 (saves 1 LC)
    expect(result.commands.length).toBe(2); // condition + action

    // First command should be GREATER_THAN (2): altitude > 99
    const gtCommand = result.commands[0];
    expect(gtCommand.operation).toBe(2); // GREATER_THAN
    expect(gtCommand.operandBValue).toBe(99); // 100 - 1
  });

  test('should normalize <= constant to < (constant+1)', () => {
    const code = `
      if (inav.flight.altitude <= 500) {
        inav.gvar[0] = 1;
      }
    `;

    const result = transpile(code);
    expect(result.success).toBe(true);
    // Normalized: altitude <= 500 becomes altitude < 501 (saves 1 LC)
    expect(result.commands.length).toBe(2); // condition + action

    // First command should be LOWER_THAN (3): altitude < 501
    const ltCommand = result.commands[0];
    expect(ltCommand.operation).toBe(3); // LOWER_THAN
    expect(ltCommand.operandBValue).toBe(501); // 500 + 1
  });

  test('should synthesize != as NOT(EQUAL)', () => {
    const code = `
      if (inav.flight.gpsSats != 0) {
        inav.gvar[0] = 1;
      }
    `;

    const result = transpile(code);
    expect(result.success).toBe(true);
    expect(result.commands.length).toBeGreaterThanOrEqual(2);

    // First command should be EQUAL (1): gpsSats == 0
    const eqCommand = result.commands[0];
    expect(eqCommand.operation).toBe(1); // EQUAL

    // Second command should be NOT (12) referencing the first LC
    const notCommand = result.commands[1];
    expect(notCommand.operation).toBe(12); // NOT
    expect(notCommand.operandAType).toBe(4); // LC reference
    expect(notCommand.operandAValue).toBe(0); // References LC 0
  });

  test('should synthesize !== as NOT(EQUAL)', () => {
    const code = `
      if (inav.gvar[0] !== 42) {
        inav.gvar[1] = 1;
      }
    `;

    const result = transpile(code);
    expect(result.success).toBe(true);
    expect(result.commands.length).toBeGreaterThanOrEqual(2);

    // First command should be EQUAL (1): inav.gvar[0] == 42
    const eqCommand = result.commands[0];
    expect(eqCommand.operation).toBe(1); // EQUAL

    // Second command should be NOT (12) referencing the first LC
    const notCommand = result.commands[1];
    expect(notCommand.operation).toBe(12); // NOT
  });

  test('should handle >= with variable operands', () => {
    const code = `
      if (inav.gvar[0] >= inav.gvar[1]) {
        inav.gvar[2] = 1;
      }
    `;

    const result = transpile(code);
    expect(result.success).toBe(true);

    // First command: inav.gvar[0] < inav.gvar[1]
    const ltCommand = result.commands[0];
    expect(ltCommand.operation).toBe(3); // LOWER_THAN
    expect(ltCommand.operandAType).toBe(5); // GVAR
    expect(ltCommand.operandAValue).toBe(0);
    expect(ltCommand.operandBType).toBe(5); // GVAR
    expect(ltCommand.operandBValue).toBe(1);

    // Second command: NOT(LC 0)
    const notCommand = result.commands[1];
    expect(notCommand.operation).toBe(12); // NOT
  });

  test('should normalize <= with RC channel constant', () => {
    const code = `
      if (inav.rc[5] <= 1500) {
        inav.gvar[0] = 1;
      }
    `;

    const result = transpile(code);
    expect(result.success).toBe(true);
    // Normalized: inav.rc[5] <= 1500 becomes inav.rc[5] < 1501 (saves 1 LC)
    expect(result.commands.length).toBe(2); // condition + action

    // First command: inav.rc[5] < 1501
    const ltCommand = result.commands[0];
    expect(ltCommand.operation).toBe(3); // LOWER_THAN
    expect(ltCommand.operandAType).toBe(1); // RC_CHANNEL
    expect(ltCommand.operandAValue).toBe(5);
    expect(ltCommand.operandBValue).toBe(1501); // 1500 + 1
  });

});

module.exports = { loadModules };
