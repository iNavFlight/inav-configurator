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

  test('should synthesize >= as NOT(LOWER_THAN)', () => {
    const code = `
      if (flight.altitude >= 100) {
        gvar[0] = 1;
      }
    `;

    const result = transpile(code);
    expect(result.success).toBe(true);
    expect(result.commands.length).toBeGreaterThanOrEqual(2);

    // First command should be LOWER_THAN (3): altitude < 100
    const ltCommand = result.commands[0];
    expect(ltCommand.operation).toBe(3); // LOWER_THAN

    // Second command should be NOT (12) referencing the first LC
    const notCommand = result.commands[1];
    expect(notCommand.operation).toBe(12); // NOT
    expect(notCommand.operandAType).toBe(4); // LC reference
    expect(notCommand.operandAValue).toBe(0); // References LC 0
  });

  test('should synthesize <= as NOT(GREATER_THAN)', () => {
    const code = `
      if (flight.altitude <= 500) {
        gvar[0] = 1;
      }
    `;

    const result = transpile(code);
    expect(result.success).toBe(true);
    expect(result.commands.length).toBeGreaterThanOrEqual(2);

    // First command should be GREATER_THAN (2): altitude > 500
    const gtCommand = result.commands[0];
    expect(gtCommand.operation).toBe(2); // GREATER_THAN

    // Second command should be NOT (12) referencing the first LC
    const notCommand = result.commands[1];
    expect(notCommand.operation).toBe(12); // NOT
    expect(notCommand.operandAType).toBe(4); // LC reference
    expect(notCommand.operandAValue).toBe(0); // References LC 0
  });

  test('should synthesize != as NOT(EQUAL)', () => {
    const code = `
      if (flight.gpsSats != 0) {
        gvar[0] = 1;
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
      if (gvar[0] !== 42) {
        gvar[1] = 1;
      }
    `;

    const result = transpile(code);
    expect(result.success).toBe(true);
    expect(result.commands.length).toBeGreaterThanOrEqual(2);

    // First command should be EQUAL (1): gvar[0] == 42
    const eqCommand = result.commands[0];
    expect(eqCommand.operation).toBe(1); // EQUAL

    // Second command should be NOT (12) referencing the first LC
    const notCommand = result.commands[1];
    expect(notCommand.operation).toBe(12); // NOT
  });

  test('should handle >= with variable operands', () => {
    const code = `
      if (gvar[0] >= gvar[1]) {
        gvar[2] = 1;
      }
    `;

    const result = transpile(code);
    expect(result.success).toBe(true);

    // First command: gvar[0] < gvar[1]
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

  test('should handle <= with RC channel', () => {
    const code = `
      if (rc[5] <= 1500) {
        gvar[0] = 1;
      }
    `;

    const result = transpile(code);
    expect(result.success).toBe(true);

    // First command: rc[5] > 1500
    const gtCommand = result.commands[0];
    expect(gtCommand.operation).toBe(2); // GREATER_THAN
    expect(gtCommand.operandAType).toBe(1); // RC_CHANNEL
    expect(gtCommand.operandAValue).toBe(5);

    // Second command: NOT(LC 0)
    const notCommand = result.commands[1];
    expect(notCommand.operation).toBe(12); // NOT
  });

});

module.exports = { loadModules };
