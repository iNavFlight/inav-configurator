import { Transpiler } from '/home/raymorris/Documents/planes/inavflight/inav-configurator/js/transpiler/transpiler/index.js';
import { Decompiler } from '/home/raymorris/Documents/planes/inavflight/inav-configurator/js/transpiler/transpiler/decompiler.js';
import { readFileSync } from 'fs';

// Load original
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

// Decompile and recompile
const decompiler = new Decompiler();
const decompileResult = decompiler.decompile(originalLCs);
const decompiled = decompileResult.code;

const transpiler = new Transpiler();
const transpileResult = transpiler.transpile(decompiled);

const recompiled = transpileResult.commands
  .filter(cmd => cmd.startsWith('logic '))
  .map(cmd => {
    const parts = cmd.split(/\s+/);
    return {
      index: parseInt(parts[1]),
      operation: parseInt(parts[4]),
      operandAType: parseInt(parts[5]),
      operandAValue: parseInt(parts[6]),
      operandBType: parseInt(parts[7]),
      operandBValue: parseInt(parts[8]),
      cmd
    };
  });

console.log('=== Analyzing Remaining +3 LC Gap ===\n');
console.log(`Original: ${originalLCs.length} LCs`);
console.log(`Recompiled: ${recompiled.length} LCs`);
console.log(`Gap: +${recompiled.length - originalLCs.length} LCs\n`);

// Find duplicate patterns in recompiled
console.log('=== Looking for Duplicates in Recompiled ===\n');

const patterns = new Map();
for (const lc of recompiled) {
  const key = `op=${lc.operation} A=${lc.operandAType}:${lc.operandAValue} B=${lc.operandBType}:${lc.operandBValue}`;
  if (!patterns.has(key)) {
    patterns.set(key, []);
  }
  patterns.get(key).push(lc.index);
}

console.log('Duplicate patterns (appearing 2+ times):');
let foundDupes = false;
for (const [pattern, indices] of patterns.entries()) {
  if (indices.length > 1) {
    foundDupes = true;
    const opName = getOpName(parseInt(pattern.match(/op=(\d+)/)[1]));
    console.log(`  ${opName}: ${pattern}`);
    console.log(`    Used in LCs: ${indices.join(', ')}`);
  }
}

if (!foundDupes) {
  console.log('  (none found - all operations are unique)');
}

// Compare specific operations
console.log('\n=== Extra Operations in Recompiled ===\n');

const originalOps = countOperations(originalLCs);
const recompiledOps = countOperations(recompiled);

const extras = [];
for (const [op, count] of recompiledOps.entries()) {
  const origCount = originalOps.get(op) || 0;
  if (count > origCount) {
    extras.push({ op, extra: count - origCount, origCount, newCount: count });
  }
}

extras.sort((a, b) => b.extra - a.extra);

for (const { op, extra, origCount, newCount } of extras) {
  console.log(`${op}: +${extra} (${origCount} → ${newCount})`);

  // Find these operations in recompiled
  const instances = recompiled.filter(lc => getOpName(lc.operation) === op);
  console.log(`  LCs: ${instances.map(lc => lc.index).join(', ')}`);

  if (instances.length <= 3) {
    instances.forEach(lc => console.log(`    ${lc.cmd}`));
  }
  console.log('');
}

function countOperations(lcs) {
  const counts = new Map();
  for (const lc of lcs) {
    if (lc.operation === undefined) continue;
    const opName = getOpName(lc.operation);
    counts.set(opName, (counts.get(opName) || 0) + 1);
  }
  return counts;
}

function getOpName(opCode) {
  const ops = {
    0: 'TRUE', 1: 'EQUAL', 2: 'GREATER', 3: 'LOWER', 4: 'LOW', 5: 'MID', 6: 'HIGH',
    7: 'AND', 8: 'OR', 9: 'XOR', 10: 'NAND', 11: 'NOR', 12: 'NOT', 13: 'STICKY',
    14: 'ADD', 15: 'SUB', 16: 'MUL', 17: 'DIV', 18: 'GVAR_SET', 38: 'RC_OVERRIDE',
    47: 'EDGE', 48: 'DELAY'
  };
  return ops[opCode] || `OP${opCode}`;
}
