#!/usr/bin/env node
/**
 * Test top-level assignment support
 */

import { Transpiler } from '../index.js';
import { Decompiler } from '../decompiler.js';

const testCode = `const { flight, override, rc, gvar, edge } = inav;

let distance_to_ground = flight.agl;
var msl = flight.altitude;

gvar[0] = msl - distance_to_ground;
`;

console.log('=== Original JavaScript ===\n');
console.log(testCode);

const transpiler = new Transpiler();
const result = transpiler.transpile(testCode);

if (!result.success) {
  console.error('❌ Transpilation failed:', result.error);
  process.exit(1);
}

console.log('\n=== Generated CLI Commands ===\n');
result.commands.forEach(cmd => console.log(cmd));

console.log('\n=== Variable Map ===\n');
console.log(JSON.stringify(result.variableMap, null, 2));

// Parse and decompile
const logicConditions = result.commands.map((cmd) => {
  const parts = cmd.split(/\s+/);
  return {
    index: parseInt(parts[1]),
    enabled: parseInt(parts[2]),
    activatorId: parseInt(parts[3]),
    operation: parseInt(parts[4]),
    operandAType: parseInt(parts[5]),
    operandAValue: parseInt(parts[6]),
    operandBType: parseInt(parts[7]),
    operandBValue: parseInt(parts[8]),
    flags: parseInt(parts[9]) || 0
  };
});

const decompiler = new Decompiler();
const decompileResult = decompiler.decompile(logicConditions, result.variableMap);

console.log('\n=== Decompiled JavaScript ===\n');
console.log(decompileResult.code);

console.log('\n✅ Test passed!');
