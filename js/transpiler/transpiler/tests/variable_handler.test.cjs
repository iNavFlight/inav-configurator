/**
 * VariableHandler Test Cases
 *
 * Location: js/transpiler/transpiler/tests/variable_handler.test.js
 *
 * Tests variable declaration handling, symbol table management, and gvar allocation.
 */

'use strict';

const { VariableHandler } = require('../variable_handler.js');

describe('VariableHandler', () => {
  let handler;

  beforeEach(() => {
    handler = new VariableHandler();
  });

  describe('extractVariableDeclaration', () => {
    test('should extract let declaration', () => {
      const node = {
        type: 'VariableDeclaration',
        kind: 'let',
        declarations: [{
          id: { type: 'Identifier', name: 'foo' },
          init: { type: 'Literal', value: 5 }
        }],
        loc: { start: { line: 1 } }
      };

      const result = handler.extractVariableDeclaration(node);

      expect(result).not.toBeNull();
      expect(result.type).toBe('LetDeclaration');
      expect(result.name).toBe('foo');
      expect(result.initExpr).toEqual({ type: 'Literal', value: 5 });
    });

    test('should extract var declaration', () => {
      const node = {
        type: 'VariableDeclaration',
        kind: 'var',
        declarations: [{
          id: { type: 'Identifier', name: 'bar' },
          init: null
        }],
        loc: { start: { line: 2 } }
      };

      const result = handler.extractVariableDeclaration(node);

      expect(result).not.toBeNull();
      expect(result.type).toBe('VarDeclaration');
      expect(result.name).toBe('bar');
      expect(result.initExpr).toBeNull();
    });

    test('should return null for non-variable declaration', () => {
      const node = {
        type: 'ExpressionStatement'
      };

      const result = handler.extractVariableDeclaration(node);

      expect(result).toBeNull();
    });

    test('should return null for invalid declaration structure', () => {
      const node = {
        type: 'VariableDeclaration',
        kind: 'let',
        declarations: []
      };

      const result = handler.extractVariableDeclaration(node);

      expect(result).toBeNull();
    });
  });

  describe('addLetVariable', () => {
    test('should add let variable with constant value', () => {
      handler.addLetVariable('foo', { type: 'Literal', value: 5 }, { start: { line: 1 } });

      const symbol = handler.getSymbol('foo');
      expect(symbol).toBeDefined();
      expect(symbol.kind).toBe('let');
      expect(symbol.expressionAST).toEqual({ type: 'Literal', value: 5 });
      expect(symbol.gvarIndex).toBeNull();
    });

    test('should add let variable with expression', () => {
      const expr = {
        type: 'BinaryExpression',
        operator: '+',
        left: { type: 'Literal', value: 5 },
        right: { type: 'Literal', value: 10 }
      };

      handler.addLetVariable('bar', expr, { start: { line: 2 } });

      const symbol = handler.getSymbol('bar');
      expect(symbol).toBeDefined();
      expect(symbol.kind).toBe('let');
      expect(symbol.expressionAST).toEqual(expr);
    });

    test('should error on let redeclaration', () => {
      handler.addLetVariable('foo', { type: 'Literal', value: 5 }, { start: { line: 1 } });
      handler.addLetVariable('foo', { type: 'Literal', value: 10 }, { start: { line: 2 } });

      const errors = handler.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('already declared');
      expect(errors[0].code).toBe('redeclaration');
    });
  });

  describe('addVarVariable', () => {
    test('should add var variable with initial value', () => {
      handler.addVarVariable('counter', { type: 'Literal', value: 0 }, { start: { line: 1 } });

      const symbol = handler.getSymbol('counter');
      expect(symbol).toBeDefined();
      expect(symbol.kind).toBe('var');
      expect(symbol.expressionAST).toEqual({ type: 'Literal', value: 0 });
      expect(symbol.gvarIndex).toBeNull();  // Not allocated yet
    });

    test('should add var variable without initial value', () => {
      handler.addVarVariable('counter', null, { start: { line: 1 } });

      const symbol = handler.getSymbol('counter');
      expect(symbol).toBeDefined();
      expect(symbol.expressionAST).toBeNull();
    });

    test('should error on var redeclaration', () => {
      handler.addVarVariable('counter', { type: 'Literal', value: 0 }, { start: { line: 1 } });
      handler.addVarVariable('counter', { type: 'Literal', value: 5 }, { start: { line: 2 } });

      const errors = handler.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('already declared');
    });

    test('should error on var/let name collision', () => {
      handler.addLetVariable('foo', { type: 'Literal', value: 5 }, { start: { line: 1 } });
      handler.addVarVariable('foo', { type: 'Literal', value: 10 }, { start: { line: 2 } });

      const errors = handler.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('already declared');
    });
  });

  describe('detectUsedGvars', () => {
    test('should detect gvar in assignment target', () => {
      const ast = {
        statements: [
          {
            type: 'Assignment',
            target: 'gvar[0]',
            value: 5
          }
        ]
      };

      handler.detectUsedGvars(ast);

      expect(handler.usedGvars.has(0)).toBe(true);
    });

    test('should detect gvar in assignment value', () => {
      const ast = {
        statements: [
          {
            type: 'Assignment',
            target: 'gvar[1]',
            value: 'gvar[0]'
          }
        ]
      };

      handler.detectUsedGvars(ast);

      expect(handler.usedGvars.has(0)).toBe(true);
      expect(handler.usedGvars.has(1)).toBe(true);
    });

    test('should detect gvar in arithmetic operations', () => {
      const ast = {
        statements: [
          {
            type: 'Assignment',
            target: 'gvar[0]',
            operation: '+',
            left: 'gvar[1]',
            right: 'gvar[2]'
          }
        ]
      };

      handler.detectUsedGvars(ast);

      expect(handler.usedGvars.has(0)).toBe(true);
      expect(handler.usedGvars.has(1)).toBe(true);
      expect(handler.usedGvars.has(2)).toBe(true);
    });

    test('should detect multiple gvar references', () => {
      const ast = {
        statements: [
          {
            type: 'Assignment',
            target: 'gvar[0]',
            value: 5
          },
          {
            type: 'Assignment',
            target: 'gvar[3]',
            value: 10
          },
          {
            type: 'Assignment',
            target: 'gvar[7]',
            value: 'gvar[0]'
          }
        ]
      };

      handler.detectUsedGvars(ast);

      expect(handler.usedGvars.has(0)).toBe(true);
      expect(handler.usedGvars.has(3)).toBe(true);
      expect(handler.usedGvars.has(7)).toBe(true);
      expect(handler.usedGvars.size).toBe(3);
    });

    test('should not detect non-gvar identifiers', () => {
      const ast = {
        statements: [
          {
            type: 'Assignment',
            target: 'override.throttle',
            value: 1500
          }
        ]
      };

      handler.detectUsedGvars(ast);

      expect(handler.usedGvars.size).toBe(0);
    });
  });

  describe('allocateGvarSlots', () => {
    test('should allocate gvar slots from high to low', () => {
      handler.addVarVariable('var1', null, { start: { line: 1 } });
      handler.addVarVariable('var2', null, { start: { line: 2 } });
      handler.addVarVariable('var3', null, { start: { line: 3 } });

      handler.allocateGvarSlots();

      expect(handler.getSymbol('var1').gvarIndex).toBe(7);
      expect(handler.getSymbol('var2').gvarIndex).toBe(6);
      expect(handler.getSymbol('var3').gvarIndex).toBe(5);
    });

    test('should skip explicitly used gvar slots', () => {
      const ast = {
        statements: [
          {
            type: 'Assignment',
            target: 'gvar[7]',
            value: 100
          },
          {
            type: 'Assignment',
            target: 'gvar[6]',
            value: 200
          }
        ]
      };

      handler.detectUsedGvars(ast);
      handler.addVarVariable('var1', null, { start: { line: 1 } });
      handler.addVarVariable('var2', null, { start: { line: 2 } });

      handler.allocateGvarSlots();

      // Should skip 7 and 6, use 5 and 4
      expect(handler.getSymbol('var1').gvarIndex).toBe(5);
      expect(handler.getSymbol('var2').gvarIndex).toBe(4);
    });

    test('should error when no gvar slots available', () => {
      // Mark all slots as used
      for (let i = 0; i < 8; i++) {
        handler.usedGvars.add(i);
      }

      handler.addVarVariable('var1', null, { start: { line: 1 } });
      handler.allocateGvarSlots();

      const errors = handler.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Cannot allocate gvar');
      expect(errors[0].message).toContain('All 8 gvar slots in use');
      expect(errors[0].code).toBe('gvar_exhaustion');
    });

    test('should provide helpful suggestion in exhaustion error', () => {
      // Use 6 slots explicitly
      for (let i = 0; i < 6; i++) {
        handler.usedGvars.add(i);
      }

      // Try to allocate 3 var variables (only 2 slots available)
      handler.addVarVariable('var1', null, { start: { line: 1 } });
      handler.addVarVariable('var2', null, { start: { line: 2 } });
      handler.addVarVariable('var3', null, { start: { line: 3 } });

      handler.allocateGvarSlots();

      const errors = handler.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain("Use 'let' for constants");
    });

    test('should not allocate slots for let variables', () => {
      handler.addLetVariable('letVar', { type: 'Literal', value: 5 }, { start: { line: 1 } });
      handler.addVarVariable('varVar', null, { start: { line: 2 } });

      handler.allocateGvarSlots();

      expect(handler.getSymbol('letVar').gvarIndex).toBeNull();
      expect(handler.getSymbol('varVar').gvarIndex).toBe(7);
    });
  });

  describe('checkLetReassignment', () => {
    test('should error on let reassignment', () => {
      handler.addLetVariable('foo', { type: 'Literal', value: 5 }, { start: { line: 1 } });

      const isError = handler.checkLetReassignment('foo', { start: { line: 2 } });

      expect(isError).toBe(true);
      const errors = handler.getErrors();
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('Cannot reassign');
      expect(errors[0].message).toContain('let');
      expect(errors[0].code).toBe('let_reassignment');
    });

    test('should allow var reassignment', () => {
      handler.addVarVariable('counter', { type: 'Literal', value: 0 }, { start: { line: 1 } });

      const isError = handler.checkLetReassignment('counter', { start: { line: 2 } });

      expect(isError).toBe(false);
      expect(handler.getErrors()).toHaveLength(0);
    });

    test('should not error for undeclared variable', () => {
      const isError = handler.checkLetReassignment('undeclared', { start: { line: 1 } });

      expect(isError).toBe(false);
      expect(handler.getErrors()).toHaveLength(0);
    });
  });

  describe('resolveVariable', () => {
    test('should resolve let variable to expression AST', () => {
      const expr = { type: 'Literal', value: 5 };
      handler.addLetVariable('foo', expr, { start: { line: 1 } });

      const result = handler.resolveVariable('foo');

      expect(result).not.toBeNull();
      expect(result.type).toBe('let_expression');
      expect(result.ast).toEqual(expr);
    });

    test('should resolve var variable to gvar reference', () => {
      handler.addVarVariable('counter', { type: 'Literal', value: 0 }, { start: { line: 1 } });
      handler.allocateGvarSlots();

      const result = handler.resolveVariable('counter');

      expect(result).not.toBeNull();
      expect(result.type).toBe('var_gvar');
      expect(result.gvarRef).toBe('gvar[7]');
    });

    test('should return null for undeclared variable', () => {
      const result = handler.resolveVariable('undeclared');

      expect(result).toBeNull();
    });

    test('should throw error for var without allocation', () => {
      handler.addVarVariable('counter', null, { start: { line: 1 } });
      // Don't call allocateGvarSlots()

      expect(() => {
        handler.resolveVariable('counter');
      }).toThrow('no gvar allocation');
    });
  });

  describe('getVarInitializations', () => {
    test('should return var initializations with gvar indices', () => {
      handler.addVarVariable('var1', { type: 'Literal', value: 5 }, { start: { line: 1 } });
      handler.addVarVariable('var2', { type: 'Literal', value: 10 }, { start: { line: 2 } });
      handler.allocateGvarSlots();

      const inits = handler.getVarInitializations();

      expect(inits).toHaveLength(2);
      expect(inits[0]).toEqual({
        name: 'var1',
        gvarIndex: 7,
        initExpr: { type: 'Literal', value: 5 }
      });
      expect(inits[1]).toEqual({
        name: 'var2',
        gvarIndex: 6,
        initExpr: { type: 'Literal', value: 10 }
      });
    });

    test('should not include var without initializer', () => {
      handler.addVarVariable('var1', { type: 'Literal', value: 5 }, { start: { line: 1 } });
      handler.addVarVariable('var2', null, { start: { line: 2 } });
      handler.allocateGvarSlots();

      const inits = handler.getVarInitializations();

      expect(inits).toHaveLength(1);
      expect(inits[0].name).toBe('var1');
    });

    test('should not include let variables', () => {
      handler.addLetVariable('letVar', { type: 'Literal', value: 5 }, { start: { line: 1 } });
      handler.addVarVariable('varVar', { type: 'Literal', value: 10 }, { start: { line: 2 } });
      handler.allocateGvarSlots();

      const inits = handler.getVarInitializations();

      expect(inits).toHaveLength(1);
      expect(inits[0].name).toBe('varVar');
    });
  });

  describe('isVariable', () => {
    test('should return true for declared let variable', () => {
      handler.addLetVariable('foo', { type: 'Literal', value: 5 }, { start: { line: 1 } });

      expect(handler.isVariable('foo')).toBe(true);
    });

    test('should return true for declared var variable', () => {
      handler.addVarVariable('bar', null, { start: { line: 1 } });

      expect(handler.isVariable('bar')).toBe(true);
    });

    test('should return false for undeclared variable', () => {
      expect(handler.isVariable('undeclared')).toBe(false);
    });
  });

  describe('getAllocationSummary', () => {
    test('should provide allocation summary', () => {
      const ast = {
        statements: [
          {
            type: 'Assignment',
            target: 'gvar[0]',
            value: 100
          }
        ]
      };

      handler.detectUsedGvars(ast);
      handler.addLetVariable('letVar', { type: 'Literal', value: 5 }, { start: { line: 1 } });
      handler.addVarVariable('varVar1', null, { start: { line: 2 } });
      handler.addVarVariable('varVar2', null, { start: { line: 3 } });
      handler.allocateGvarSlots();

      const summary = handler.getAllocationSummary();

      expect(summary.letCount).toBe(1);
      expect(summary.varCount).toBe(2);
      expect(summary.usedGvars).toContain(0);  // Explicitly used
      expect(summary.usedGvars).toContain(7);  // Allocated to varVar1
      expect(summary.usedGvars).toContain(6);  // Allocated to varVar2
      expect(summary.allocatedGvars).toHaveLength(2);
    });
  });

  describe('error management', () => {
    test('should collect multiple errors', () => {
      handler.addLetVariable('foo', { type: 'Literal', value: 5 }, { start: { line: 1 } });
      handler.addLetVariable('foo', { type: 'Literal', value: 10 }, { start: { line: 2 } });  // Redeclaration
      handler.checkLetReassignment('foo', { start: { line: 3 } });  // Reassignment

      const errors = handler.getErrors();
      expect(errors).toHaveLength(2);
    });

    test('should clear errors', () => {
      handler.addLetVariable('foo', { type: 'Literal', value: 5 }, { start: { line: 1 } });
      handler.addLetVariable('foo', { type: 'Literal', value: 10 }, { start: { line: 2 } });

      expect(handler.getErrors()).toHaveLength(1);

      handler.clearErrors();

      expect(handler.getErrors()).toHaveLength(0);
    });
  });
});
