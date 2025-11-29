/**
 * Variable Map Test Cases
 *
 * Location: js/transpiler/transpiler/tests/variable_map.test.cjs
 *
 * Tests variable map building for preservation between sessions.
 * Tests the buildVariableMap() and astToExpressionString() methods in codegen.
 */

'use strict';

const { INAVCodeGenerator } = require('../codegen.js');
const { VariableHandler } = require('../variable_handler.js');

describe('Variable Map Building', () => {
  let codegen;
  let variableHandler;

  beforeEach(() => {
    variableHandler = new VariableHandler();
    codegen = new INAVCodeGenerator(variableHandler);
  });

  describe('buildVariableMap', () => {
    test('should return empty map when no variables', () => {
      const map = codegen.buildVariableMap();

      expect(map).toEqual({
        let_variables: {},
        var_variables: {}
      });
    });

    test('should return empty map when variableHandler is null', () => {
      codegen.variableHandler = null;
      const map = codegen.buildVariableMap();

      expect(map).toEqual({
        let_variables: {},
        var_variables: {}
      });
    });

    test('should extract let variable with literal value', () => {
      variableHandler.addLetVariable('maxAlt', { type: 'Literal', value: 500 }, { start: { line: 1 } });

      const map = codegen.buildVariableMap();

      expect(map.let_variables).toHaveProperty('maxAlt');
      expect(map.let_variables.maxAlt.expression).toBe('500');
      expect(map.let_variables.maxAlt.type).toBe('let');
    });

    test('should extract let variable with member expression', () => {
      variableHandler.addLetVariable('alt', { type: 'MemberExpression', value: 'flight.altitude' }, { start: { line: 1 } });

      const map = codegen.buildVariableMap();

      expect(map.let_variables).toHaveProperty('alt');
      expect(map.let_variables.alt.expression).toBe('flight.altitude');
    });

    test('should extract var variable with gvar index', () => {
      variableHandler.addVarVariable('counter', { type: 'Literal', value: 0 }, { start: { line: 1 } });
      variableHandler.allocateGvarSlots();

      const map = codegen.buildVariableMap();

      expect(map.var_variables).toHaveProperty('counter');
      expect(map.var_variables.counter.gvar).toBe(7); // Allocated from high to low
      expect(map.var_variables.counter.expression).toBe('0');
    });

    test('should handle mixed let and var variables', () => {
      variableHandler.addLetVariable('threshold', { type: 'Literal', value: 100 }, { start: { line: 1 } });
      variableHandler.addVarVariable('count', { type: 'Literal', value: 0 }, { start: { line: 2 } });
      variableHandler.addLetVariable('maxSpeed', { type: 'MemberExpression', value: 'flight.groundSpeed' }, { start: { line: 3 } });
      variableHandler.addVarVariable('state', { type: 'Literal', value: 1 }, { start: { line: 4 } });
      variableHandler.allocateGvarSlots();

      const map = codegen.buildVariableMap();

      expect(Object.keys(map.let_variables)).toHaveLength(2);
      expect(Object.keys(map.var_variables)).toHaveLength(2);

      expect(map.let_variables.threshold.expression).toBe('100');
      expect(map.let_variables.maxSpeed.expression).toBe('flight.groundSpeed');
      expect(map.var_variables.count.gvar).toBe(7);
      expect(map.var_variables.state.gvar).toBe(6);
    });
  });

  describe('astToExpressionString', () => {
    test('should convert null to "0"', () => {
      expect(codegen.astToExpressionString(null)).toBe('0');
    });

    test('should convert undefined to "0"', () => {
      expect(codegen.astToExpressionString(undefined)).toBe('0');
    });

    test('should pass through strings', () => {
      expect(codegen.astToExpressionString('flight.altitude')).toBe('flight.altitude');
    });

    test('should convert numbers to strings', () => {
      expect(codegen.astToExpressionString(42)).toBe('42');
      expect(codegen.astToExpressionString(0)).toBe('0');
      expect(codegen.astToExpressionString(-10)).toBe('-10');
    });

    test('should convert booleans to strings', () => {
      expect(codegen.astToExpressionString(true)).toBe('true');
      expect(codegen.astToExpressionString(false)).toBe('false');
    });

    test('should handle Literal AST nodes', () => {
      expect(codegen.astToExpressionString({ type: 'Literal', value: 100 })).toBe('100');
      expect(codegen.astToExpressionString({ type: 'Literal', value: 'hello' })).toBe('"hello"');
    });

    test('should handle Identifier AST nodes', () => {
      expect(codegen.astToExpressionString({ type: 'Identifier', name: 'foo' })).toBe('foo');
    });

    test('should handle MemberExpression with value property', () => {
      expect(codegen.astToExpressionString({ type: 'MemberExpression', value: 'flight.altitude' })).toBe('flight.altitude');
    });

    test('should handle BinaryExpression AST nodes', () => {
      const ast = {
        type: 'BinaryExpression',
        operator: '+',
        left: { type: 'Literal', value: 5 },
        right: { type: 'Literal', value: 10 }
      };

      expect(codegen.astToExpressionString(ast)).toBe('(5 + 10)');
    });

    test('should handle nested BinaryExpression', () => {
      const ast = {
        type: 'BinaryExpression',
        operator: '*',
        left: {
          type: 'BinaryExpression',
          operator: '+',
          left: { type: 'Literal', value: 1 },
          right: { type: 'Literal', value: 2 }
        },
        right: { type: 'Literal', value: 3 }
      };

      expect(codegen.astToExpressionString(ast)).toBe('((1 + 2) * 3)');
    });

    test('should handle UnaryExpression AST nodes', () => {
      const ast = {
        type: 'UnaryExpression',
        operator: '-',
        argument: { type: 'Literal', value: 5 }
      };

      expect(codegen.astToExpressionString(ast)).toBe('-5');
    });

    test('should handle CallExpression AST nodes', () => {
      const ast = {
        type: 'CallExpression',
        callee: { type: 'Identifier', name: 'Math.abs' },
        arguments: [{ type: 'Literal', value: -5 }]
      };

      expect(codegen.astToExpressionString(ast)).toBe('Math.abs(-5)');
    });

    test('should handle unknown AST types with value property', () => {
      const ast = {
        type: 'SomeUnknownType',
        value: 'fallback_value'
      };

      expect(codegen.astToExpressionString(ast)).toBe('fallback_value');
    });

    test('should handle unknown AST types without value property', () => {
      const ast = {
        type: 'SomeUnknownType'
      };

      expect(codegen.astToExpressionString(ast)).toContain('unknown');
    });
  });

  describe('Variable Map Serialization', () => {
    test('should produce JSON-serializable output', () => {
      variableHandler.addLetVariable('alt', { type: 'MemberExpression', value: 'flight.altitude' }, { start: { line: 1 } });
      variableHandler.addVarVariable('counter', { type: 'Literal', value: 0 }, { start: { line: 2 } });
      variableHandler.allocateGvarSlots();

      const map = codegen.buildVariableMap();

      // Should not throw
      const json = JSON.stringify(map);
      const parsed = JSON.parse(json);

      expect(parsed.let_variables.alt.expression).toBe('flight.altitude');
      expect(parsed.var_variables.counter.gvar).toBe(7);
    });
  });
});

describe('Variable Map with Decompiler Integration', () => {
  test('should build map that can be used for variable name lookup', () => {
    const variableHandler = new VariableHandler();
    const codegen = new INAVCodeGenerator(variableHandler);

    variableHandler.addVarVariable('altitude_offset', { type: 'Literal', value: 100 }, { start: { line: 1 } });
    variableHandler.addVarVariable('speed_limit', { type: 'Literal', value: 50 }, { start: { line: 2 } });
    variableHandler.allocateGvarSlots();

    const map = codegen.buildVariableMap();

    // Simulate what decompiler would do to find variable name for gvar index
    function getVarNameForGvar(gvarIndex, variableMap) {
      if (!variableMap || !variableMap.var_variables) return null;
      for (const [name, info] of Object.entries(variableMap.var_variables)) {
        if (info.gvar === gvarIndex) return name;
      }
      return null;
    }

    expect(getVarNameForGvar(7, map)).toBe('altitude_offset');
    expect(getVarNameForGvar(6, map)).toBe('speed_limit');
    expect(getVarNameForGvar(0, map)).toBeNull();
  });

  test('should build map that can reconstruct let declarations', () => {
    const variableHandler = new VariableHandler();
    const codegen = new INAVCodeGenerator(variableHandler);

    variableHandler.addLetVariable('threshold', { type: 'Literal', value: 100 }, { start: { line: 1 } });
    variableHandler.addLetVariable('current_alt', { type: 'MemberExpression', value: 'flight.altitude' }, { start: { line: 2 } });

    const map = codegen.buildVariableMap();

    // Simulate what decompiler would do to reconstruct let declarations
    function reconstructLetVariables(variableMap) {
      const declarations = [];
      if (!variableMap || !variableMap.let_variables) return declarations;
      for (const [name, info] of Object.entries(variableMap.let_variables)) {
        const type = info.type || 'let';
        declarations.push(`${type} ${name} = ${info.expression};`);
      }
      return declarations;
    }

    const declarations = reconstructLetVariables(map);

    expect(declarations).toContain('let threshold = 100;');
    expect(declarations).toContain('let current_alt = flight.altitude;');
  });
});
