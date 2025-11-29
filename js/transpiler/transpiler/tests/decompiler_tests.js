/**
 * Decompiler Test Cases
 * 
 * Location: js/transpiler/transpiler/tests/decompiler.test.js
 * 
 * Tests use correct INAV firmware operation codes and operand types.
 */

'use strict';

const { Decompiler } = require('../decompiler.js');

describe('Decompiler', () => {
  let decompiler;
  
  beforeEach(() => {
    decompiler = new Decompiler();
  });
  
  describe('Basic Decompilation', () => {
    test('should handle empty logic conditions', () => {
      const result = decompiler.decompile([]);
      
      expect(result.success).toBe(true);
      expect(result.code).toContain('No logic conditions found');
      expect(result.warnings).toHaveLength(1);
    });
    
    test('should handle null input', () => {
      const result = decompiler.decompile(null);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid logic conditions');
    });
    
    test('should handle disabled conditions', () => {
      const conditions = [
        { index: 0, enabled: 0, operation: 0 }
      ];
      
      const result = decompiler.decompile(conditions);
      
      expect(result.success).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });
  
  describe('if statement with armTimer', () => {
    test('should decompile if armTimer > delay as simple if statement', () => {
      const conditions = [
        // Condition: flight.armTimer > 1000
        {
          index: 0,
          enabled: 1,
          activatorId: -1,
          operation: 2, // GREATER_THAN
          operandAType: 2, // FLIGHT
          operandAValue: 0, // armTimer
          operandBType: 0, // VALUE
          operandBValue: 1000
        },
        // Action: gvar[0] = 100
        {
          index: 1,
          enabled: 1,
          activatorId: 0,
          operation: 18, // GVAR_SET
          operandAType: 0, // VALUE - specifies which gvar
          operandAValue: 0, // gvar index
          operandBType: 0, // VALUE
          operandBValue: 100
        }
      ];
      
      const result = decompiler.decompile(conditions);
      
      expect(result.success).toBe(true);
      expect(result.code).toContain('if (flight.armTimer > 1000)');
      expect(result.code).toContain('gvar[0] = 100');
    });
  });
  
  describe('if statement Handler', () => {
    test('should decompile simple if condition', () => {
      const conditions = [
        // Condition: flight.homeDistance > 100
        {
          index: 0,
          enabled: 1,
          activatorId: -1,
          operation: 2, // GREATER_THAN
          operandAType: 2, // FLIGHT
          operandAValue: 1, // homeDistance
          operandBType: 0, // VALUE
          operandBValue: 100
        },
        // Action: override.vtx.power = 3
        {
          index: 1,
          enabled: 1,
          activatorId: 0,
          operation: 25, // SET_VTX_POWER_LEVEL
          operandAType: 0,
          operandAValue: 0,
          operandBType: 0,
          operandBValue: 3
        }
      ];
      
      const result = decompiler.decompile(conditions);
      
      expect(result.success).toBe(true);
      expect(result.code).toContain('if (flight.homeDistance > 100)');
      expect(result.code).toContain('override.vtx.power = 3');
    });
    
    test('should decompile if with multiple actions', () => {
      const conditions = [
        // Condition: flight.cellVoltage < 350
        {
          index: 0,
          enabled: 1,
          activatorId: -1,
          operation: 3, // LOWER_THAN
          operandAType: 2, // FLIGHT
          operandAValue: 5, // cellVoltage
          operandBType: 0, // VALUE
          operandBValue: 350
        },
        // Action 1: override.throttleScale = 50
        {
          index: 1,
          enabled: 1,
          activatorId: 0,
          operation: 23, // OVERRIDE_THROTTLE_SCALE
          operandAType: 0,
          operandAValue: 0,
          operandBType: 0,
          operandBValue: 50
        },
        // Action 2: gvar[0] = 1
        {
          index: 2,
          enabled: 1,
          activatorId: 0,
          operation: 18, // GVAR_SET
          operandAType: 0, // VALUE
          operandAValue: 0,
          operandBType: 0,
          operandBValue: 1
        }
      ];
      
      const result = decompiler.decompile(conditions);
      
      expect(result.success).toBe(true);
      expect(result.code).toContain('if (flight.cellVoltage < 350)');
      expect(result.code).toContain('override.throttleScale = 50');
      expect(result.code).toContain('gvar[0] = 1');
    });
  });
  
  describe('Operand Decompilation', () => {
    test('should decompile flight parameters', () => {
      const param = decompiler.decompileOperand(2, 1); // FLIGHT, homeDistance
      expect(param).toBe('flight.homeDistance');
    });
    
    test('should decompile gvar references', () => {
      const param = decompiler.decompileOperand(5, 0); // GVAR[0] (type 5)
      expect(param).toBe('gvar[0]');
    });
    
    test('should decompile literal values', () => {
      const param = decompiler.decompileOperand(0, 100); // VALUE, 100
      expect(param).toBe('100');
    });
    
    test('should warn on unknown flight parameter', () => {
      decompiler.warnings = [];
      const param = decompiler.decompileOperand(2, 999); // Unknown param
      
      expect(param).toContain('unknown');
      expect(decompiler.warnings.length).toBeGreaterThan(0);
    });
  });
  
  describe('Condition Decompilation', () => {
    test('should decompile comparison operators', () => {
      const conditions = [
        { operation: 1, operandAType: 2, operandAValue: 1, operandBType: 0, operandBValue: 100 }, // EQUAL
        { operation: 2, operandAType: 2, operandAValue: 1, operandBType: 0, operandBValue: 100 }, // GREATER_THAN
        { operation: 3, operandAType: 2, operandAValue: 1, operandBType: 0, operandBValue: 100 }  // LOWER_THAN
      ];
      
      expect(decompiler.decompileCondition(conditions[0])).toContain('===');
      expect(decompiler.decompileCondition(conditions[1])).toContain('>');
      expect(decompiler.decompileCondition(conditions[2])).toContain('<');
    });
    
    test('should decompile RC channel states', () => {
      const lc = {
        operation: 6, // HIGH
        operandAType: 1, // RC_CHANNEL
        operandAValue: 5,
        operandBType: 0,
        operandBValue: 0
      };
      
      const condition = decompiler.decompileCondition(lc);
      expect(condition).toContain('.high');
    });
    
    test('should decompile logical operators', () => {
      const andLC = {
        operation: 7, // AND
        operandAType: 0,
        operandAValue: 1,
        operandBType: 0,
        operandBValue: 1
      };
      
      const condition = decompiler.decompileCondition(andLC);
      expect(condition).toContain('&&');
    });
  });
  
  describe('Action Decompilation', () => {
    test('should decompile gvar operations', () => {
      const setGvar = {
        operation: 18, // GVAR_SET
        operandAType: 0, // VALUE
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 100
      };
      
      const action = decompiler.decompileAction(setGvar);
      expect(action).toBe('gvar[0] = 100;');
    });
    
    test('should decompile increment/decrement', () => {
      const incGvar = {
        operation: 19, // GVAR_INC
        operandAType: 0, // VALUE
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 1
      };
      
      const action = decompiler.decompileAction(incGvar);
      expect(action).toContain('gvar[0] = gvar[0] + 1');
    });
    
    test('should decompile override operations', () => {
      const vtxPower = {
        operation: 25, // SET_VTX_POWER_LEVEL
        operandAType: 0,
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 3
      };
      
      const action = decompiler.decompileAction(vtxPower);
      expect(action).toBe('override.vtx.power = 3;');
    });
    
    test('should decompile throttle scale override', () => {
      const throttleScale = {
        operation: 23, // OVERRIDE_THROTTLE_SCALE
        operandAType: 0,
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 50
      };
      
      const action = decompiler.decompileAction(throttleScale);
      expect(action).toBe('override.throttleScale = 50;');
    });
  });
  
  describe('Complex Scenarios', () => {
    test('should decompile multiple independent if statements', () => {
      const conditions = [
        // First if: homeDistance > 100
        { index: 0, enabled: 1, activatorId: -1, operation: 2, 
          operandAType: 2, operandAValue: 1, operandBType: 0, operandBValue: 100 },
        { index: 1, enabled: 1, activatorId: 0, operation: 25,
          operandAType: 0, operandAValue: 0, operandBType: 0, operandBValue: 3 },
        
        // Second if: cellVoltage < 350
        { index: 2, enabled: 1, activatorId: -1, operation: 3, 
          operandAType: 2, operandAValue: 5, operandBType: 0, operandBValue: 350 },
        { index: 3, enabled: 1, activatorId: 2, operation: 23,
          operandAType: 0, operandAValue: 0, operandBType: 0, operandBValue: 50 }
      ];
      
      const result = decompiler.decompile(conditions);
      
      expect(result.success).toBe(true);
      expect(result.stats.groups).toBe(2);
      expect(result.code).toContain('flight.homeDistance > 100');
      expect(result.code).toContain('flight.cellVoltage < 350');
    });
  });
  
  describe('Edge Cases', () => {
    test('should handle conditions with no actions', () => {
      const conditions = [
        { index: 0, enabled: 1, activatorId: -1, operation: 2, 
          operandAType: 2, operandAValue: 1, operandBType: 0, operandBValue: 100 }
      ];
      
      const result = decompiler.decompile(conditions);
      
      expect(result.success).toBe(true);
    });
    
    test('should skip conditions with invalid structure', () => {
      const conditions = [
        { index: 0, enabled: 1 }, // Missing required fields
        { index: 1, enabled: 1, activatorId: -1, operation: 2, 
          operandAType: 2, operandAValue: 1, operandBType: 0, operandBValue: 100 }
      ];
      
      const result = decompiler.decompile(conditions);
      
      expect(result.success).toBe(true);
    });
  });
  
  describe('Warning Generation', () => {
    test('should warn about unsupported features', () => {
      decompiler.warnings = [];
      
      // Use an unsupported operand type
      decompiler.decompileOperand(6, 0); // PID
      
      expect(decompiler.warnings.length).toBeGreaterThan(0);
      expect(decompiler.warnings[0]).toContain('PID');
    });
    
    test('should include warnings in output', () => {
      const conditions = [
        {
          index: 0,
          enabled: 1,
          activatorId: -1,
          operation: 2,
          operandAType: 6, // PID (unsupported)
          operandAValue: 0,
          operandBType: 0,
          operandBValue: 100
        }
      ];
      
      const result = decompiler.decompile(conditions);
      
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.code).toContain('// Decompilation Warnings:');
    });
  });
});

/**
 * Integration test examples
 */
describe('Decompiler Integration', () => {
  test('should handle real-world VTX power example', () => {
    const decompiler = new Decompiler();
    
    const conditions = [
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 2,
        operandAType: 2,
        operandAValue: 1,
        operandBType: 0,
        operandBValue: 100
      },
      {
        index: 1,
        enabled: 1,
        activatorId: 0,
        operation: 25, // SET_VTX_POWER_LEVEL
        operandAType: 0,
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 3
      }
    ];
    
    const result = decompiler.decompile(conditions);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('if (');
    expect(result.code).toContain('flight.homeDistance > 100');
    expect(result.code).toContain('override.vtx.power = 3');
  });
  
  test('should handle battery protection example', () => {
    const decompiler = new Decompiler();
    
    const conditions = [
      {
        index: 0,
        enabled: 1,
        activatorId: -1,
        operation: 3,
        operandAType: 2,
        operandAValue: 5,
        operandBType: 0,
        operandBValue: 350
      },
      {
        index: 1,
        enabled: 1,
        activatorId: 0,
        operation: 23, // OVERRIDE_THROTTLE_SCALE
        operandAType: 0,
        operandAValue: 0,
        operandBType: 0,
        operandBValue: 50
      }
    ];
    
    const result = decompiler.decompile(conditions);
    
    expect(result.success).toBe(true);
    expect(result.code).toContain('if (flight.cellVoltage < 350)');
    expect(result.code).toContain('override.throttleScale = 50');
  });
});
