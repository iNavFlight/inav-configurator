import { Decompiler } from '/home/raymorris/Documents/planes/inavflight/inav-configurator/js/transpiler/transpiler/decompiler.js';
import { readFileSync } from 'fs';

const originalText = readFileSync(new URL('../test-data/vtol-transistion-lcs.txt', import.meta.url), 'utf-8');
const originalLCs = originalText.trim().split('\n')
  .filter(line => line.match(/^logic \d+/))
  .map(line => {
    const parts = line.split(/\s+/);
    return {
      index: parseInt(parts[1]),
      enabled: parseInt(parts[2]),
      activatorId: parseInt(parts[3]),
      operation: parseInt(parts[4]),
      operandAType: parseInt(parts[5]),
      operandAValue: parseInt(parts[6]),
      operandBType: parseInt(parts[7]),
      operandBValue: parseInt(parts[8])
    };
  });

console.log('=== Finding Duplicate Patterns in Original LCs ===\n');

// Group by operation + operands (ignoring activator)
const patterns = new Map();
for (const lc of originalLCs) {
  const key = `op=${lc.operation} A=${lc.operandAType}:${lc.operandAValue} B=${lc.operandBType}:${lc.operandBValue}`;
  if (!patterns.has(key)) {
    patterns.set(key, []);
  }
  patterns.get(key).push({ index: lc.index, activatorId: lc.activatorId });
}

console.log('Patterns appearing 2+ times in original:\n');
for (const [pattern, instances] of patterns.entries()) {
  if (instances.length >= 2) {
    const opCode = parseInt(pattern.match(/op=(\d+)/)[1]);
    const opName = getOpName(opCode);
    console.log(`${opName}: ${pattern}`);
    console.log(`  Instances: ${instances.map(i => `LC${i.index}(act=${i.activatorId})`).join(', ')}`);
    console.log('');
  }
}

// Decompile and check what got hoisted
const decompiler = new Decompiler();
const result = decompiler.decompile(originalLCs);
const lines = result.code.split('\n');

console.log('=== Const Variables in Decompiled Code ===\n');
const constVars = lines.filter(line => line.trim().startsWith('const cond'));
constVars.forEach(line => console.log(line.trim()));

function getOpName(opCode) {
  const ops = {
    0: 'TRUE', 1: 'EQUAL', 2: 'GREATER', 3: 'LOWER', 4: 'LOW', 5: 'MID', 6: 'HIGH',
    7: 'AND', 8: 'OR', 9: 'XOR', 10: 'NAND', 11: 'NOR', 12: 'NOT', 13: 'STICKY',
    17: 'DIV', 18: 'GVAR_SET', 38: 'RC_OVERRIDE', 47: 'EDGE', 48: 'DELAY'
  };
  return ops[opCode] || `OP${opCode}`;
}
