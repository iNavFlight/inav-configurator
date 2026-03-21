#!/usr/bin/env node
/**
 * Integration Tests for JavaScript Variable Support (let/var)
 * Tests end-to-end: Parser → Analyzer → Codegen
 */

'use strict';

// Import transpiler components
const { JavaScriptParser } = require('../parser.js');
const { SemanticAnalyzer } = require('../analyzer.js');
const { INAVCodeGenerator } = require('../codegen.js');

describe('Let Variable Integration', () => {
  test('Simple let with constant value', () => {
    const code = `
      
      let maxAlt = 100;

      on.always(() => {
        inav.override.throttle = maxAlt;
      });
    `;

    const parser = new JavaScriptParser();
    const ast = parser.parse(code);

    const analyzer = new SemanticAnalyzer();
    const analyzed = analyzer.analyze(ast);

    const codegen = new INAVCodeGenerator(analyzer.variableHandler);
    const commands = codegen.generate(analyzed.ast);

    // Debug: print commands
    // console.log('Commands:', commands);

    // Should generate inav.override.throttle = 100 (substituted)
    // on.always generates an extra logic condition for the condition
    expect(commands.length).toBeGreaterThan(0);
    expect(commands[commands.length - 1]).toContain('100');
  });

  test('Let with arithmetic expression', () => {
    const code = `
      
      let maxAlt = 50 + 50;

      on.always(() => {
        inav.override.throttle = maxAlt;
      });
    `;

    const parser = new JavaScriptParser();
    const ast = parser.parse(code);

    const analyzer = new SemanticAnalyzer();
    const analyzed = analyzer.analyze(ast);

    const codegen = new INAVCodeGenerator(analyzer.variableHandler);
    const commands = codegen.generate(analyzed.ast);

    // Should inline the expression 50 + 50
    expect(commands.length).toBeGreaterThan(0);
  });

  test('Let with API property reference', () => {
    const code = `
      
      let currentAlt = inav.flight.altitude;

      on.always(() => {
        inav.override.throttle = currentAlt;
      });
    `;

    const parser = new JavaScriptParser();
    const ast = parser.parse(code);

    const analyzer = new SemanticAnalyzer();
    const analyzed = analyzer.analyze(ast);

    const codegen = new INAVCodeGenerator(analyzer.variableHandler);
    const commands = codegen.generate(analyzed.ast);

    // Should substitute with inav.flight.altitude
    expect(commands.length).toBeGreaterThan(0);
  });

  test('Multiple let declarations', () => {
    const code = `
      
      let minAlt = 10;
      let maxAlt = 100;

      on.always(() => {
        inav.override.throttle = maxAlt;
      });
    `;

    const parser = new JavaScriptParser();
    const ast = parser.parse(code);

    const analyzer = new SemanticAnalyzer();
    const analyzed = analyzer.analyze(ast);

    const codegen = new INAVCodeGenerator(analyzer.variableHandler);
    const commands = codegen.generate(analyzed.ast);

    expect(commands.length).toBeGreaterThan(0);
  });

  test('Error: Let reassignment', () => {
    const code = `
      
      let maxAlt = 100;

      on.always(() => {
        maxAlt = 200;  // ERROR: Cannot reassign let
      });
    `;

    const parser = new JavaScriptParser();
    const ast = parser.parse(code);

    const analyzer = new SemanticAnalyzer();

    expect(() => {
      analyzer.analyze(ast);
    }).toThrow(/Cannot reassign 'let' variable/);
  });

  test('Error: Let redeclaration', () => {
    const code = `
      
      let maxAlt = 100;
      let maxAlt = 200;  // ERROR: Redeclaration
    `;

    const parser = new JavaScriptParser();

    // Acorn catches redeclaration during parsing
    expect(() => {
      parser.parse(code);
    }).toThrow(/already been declared/);
  });
});

describe('Var Variable Integration', () => {
  test('Simple var with initialization', () => {
    const code = `
      
      var counter = 0;

      on.always(() => {
        counter = counter + 1;
      });
    `;

    const parser = new JavaScriptParser();
    const ast = parser.parse(code);

    const analyzer = new SemanticAnalyzer();
    const analyzed = analyzer.analyze(ast);

    const codegen = new INAVCodeGenerator(analyzer.variableHandler);
    const commands = codegen.generate(analyzed.ast);

    // Should allocate gvar and generate initialization
    expect(commands.length).toBeGreaterThan(1);

    // First command should be gvar initialization (operation 18 = GVAR_SET)
    expect(commands[0]).toContain('18');
    expect(commands[0]).toContain('0'); // initialization value
  });

  test('Var allocated to available gvar slot', () => {
    const code = `
      
      var myVar = 42;
    `;

    const parser = new JavaScriptParser();
    const ast = parser.parse(code);

    const analyzer = new SemanticAnalyzer();
    analyzer.analyze(ast);

    // Check allocation
    const summary = analyzer.variableHandler.getAllocationSummary();
    expect(summary.varCount).toBe(1);
    expect(summary.allocatedGvars.length).toBe(1);

    // Should allocate from high slots (inav.gvar[7])
    const [varName, gvarIndex] = summary.allocatedGvars[0];
    expect(varName).toBe('myVar');
    expect(gvarIndex).toBe(7);
  });

  test('Multiple var declarations', () => {
    const code = `
      
      var counter1 = 0;
      var counter2 = 10;
      var counter3 = 20;
    `;

    const parser = new JavaScriptParser();
    const ast = parser.parse(code);

    const analyzer = new SemanticAnalyzer();
    analyzer.analyze(ast);

    const summary = analyzer.variableHandler.getAllocationSummary();
    expect(summary.varCount).toBe(3);
    expect(summary.allocatedGvars.length).toBe(3);

    // Should allocate inav.gvar[7], inav.gvar[6], inav.gvar[5]
    const indices = summary.allocatedGvars.map(([_, idx]) => idx).sort((a, b) => b - a);
    expect(indices).toEqual([7, 6, 5]);
  });

  test('Var avoids explicitly used gvar slots', () => {
    const code = `
      
      var myVar = 100;

      on.always(() => {
        inav.gvar[7] = 42;  // Explicitly use inav.gvar[7]
      });
    `;

    const parser = new JavaScriptParser();
    const ast = parser.parse(code);

    const analyzer = new SemanticAnalyzer();
    analyzer.analyze(ast);

    const summary = analyzer.variableHandler.getAllocationSummary();

    // myVar should get inav.gvar[6] (since inav.gvar[7] is explicitly used)
    const [varName, gvarIndex] = summary.allocatedGvars[0];
    expect(varName).toBe('myVar');
    expect(gvarIndex).toBe(6);

    // inav.gvar[7] should be in used list
    expect(summary.usedGvars).toContain(7);
  });

  test('Error: Too many variables (gvar exhaustion)', () => {
    const code = `
      
      var v1 = 1;
      var v2 = 2;
      var v3 = 3;
      var v4 = 4;
      var v5 = 5;
      var v6 = 6;
      var v7 = 7;
      var v8 = 8;
      var v9 = 9;  // ERROR: Only 8 gvars available
    `;

    const parser = new JavaScriptParser();
    const ast = parser.parse(code);

    const analyzer = new SemanticAnalyzer();

    expect(() => {
      analyzer.analyze(ast);
    }).toThrow(/Cannot allocate gvar/);
  });
});

describe('Let Variable Reuse', () => {
  test('Let variable used in multiple locations', () => {
    const code = `
      
      let time = inav.flight.armTimer;

      if (time > 1000) {
        inav.gvar[1] = time;
      }
    `;

    const parser = new JavaScriptParser();
    const ast = parser.parse(code);

    const analyzer = new SemanticAnalyzer();
    const analyzed = analyzer.analyze(ast);

    const codegen = new INAVCodeGenerator(analyzer.variableHandler);
    const commands = codegen.generate(analyzed.ast);

    // Should substitute inav.flight.armTimer in both condition and assignment
    expect(commands.length).toBe(2);

    // Both commands should reference FLIGHT (type 2) ARM_TIMER (value 0)
    expect(commands[0]).toContain('2 0'); // Condition operand
    expect(commands[1]).toContain('2 0'); // Assignment value
  });
});

describe('Let and Var Mixed Usage', () => {
  test('Let for constants, var for mutables', () => {
    const code = `
      
      let maxAlt = 100;       // Constant
      var counter = 0;        // Mutable

      on.always(() => {
        counter = counter + 1;
        inav.override.throttle = maxAlt;
      });
    `;

    const parser = new JavaScriptParser();
    const ast = parser.parse(code);

    const analyzer = new SemanticAnalyzer();
    const analyzed = analyzer.analyze(ast);

    const codegen = new INAVCodeGenerator(analyzer.variableHandler);
    const commands = codegen.generate(analyzed.ast);

    // Should have initialization + logic
    expect(commands.length).toBeGreaterThan(1);

    const summary = analyzer.variableHandler.getAllocationSummary();
    expect(summary.letCount).toBe(1);
    expect(summary.varCount).toBe(1);
  });

  test('Let substitution does not use gvar slots', () => {
    const code = `
      
      let const1 = 10;
      let const2 = 20;
      let const3 = 30;
      let const4 = 40;
      let const5 = 50;
      let const6 = 60;
      let const7 = 70;
      let const8 = 80;
      let const9 = 90;
      let const10 = 100;

      var mutable = 0;  // Should still get inav.gvar[7]
    `;

    const parser = new JavaScriptParser();
    const ast = parser.parse(code);

    const analyzer = new SemanticAnalyzer();
    analyzer.analyze(ast);

    const summary = analyzer.variableHandler.getAllocationSummary();
    expect(summary.letCount).toBe(10);  // 10 let variables
    expect(summary.varCount).toBe(1);   // 1 var variable

    // var should still get inav.gvar[7] (let doesn't use gvars)
    const [varName, gvarIndex] = summary.allocatedGvars[0];
    expect(varName).toBe('mutable');
    expect(gvarIndex).toBe(7);
  });
});
