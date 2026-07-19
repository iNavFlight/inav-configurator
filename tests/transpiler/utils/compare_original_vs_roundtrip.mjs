import { Transpiler } from '/home/raymorris/Documents/planes/inavflight/inav-configurator/js/transpiler/transpiler/index.js';
import { Decompiler } from '/home/raymorris/Documents/planes/inavflight/inav-configurator/js/transpiler/transpiler/decompiler.js';
import { readFileSync } from 'fs';

// Load original LCs
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
      operandBValue: parseInt(parts[8]),
      raw: line
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
      enabled: parseInt(parts[2]),
      activatorId: parseInt(parts[3]),
      operation: parseInt(parts[4]),
      operandAType: parseInt(parts[5]),
      operandAValue: parseInt(parts[6]),
      operandBType: parseInt(parts[7]),
      operandBValue: parseInt(parts[8]),
      raw: cmd
    };
  });

console.log('=== LC Count Comparison ===');
console.log('Original:    ' + originalLCs.length + ' LCs');
console.log('Recompiled:  ' + recompiled.length + ' LCs');
console.log('Difference:  ' + (recompiled.length - originalLCs.length) + ' LC\n');

// Find which LC is missing/different
console.log('=== Detailed Comparison ===\n');

// Create a canonical form for comparison (operation + operands, ignoring index)
function getCanonicalForm(lc) {
  return lc.enabled + '|' + lc.activatorId + '|' + lc.operation + '|' + lc.operandAType + ':' + lc.operandAValue + '|' + lc.operandBType + ':' + lc.operandBValue;
}

const originalCanonical = originalLCs.map((lc, i) => ({ canonical: getCanonicalForm(lc), index: i, lc }));
const recompiledCanonical = recompiled.map((lc, i) => ({ canonical: getCanonicalForm(lc), index: i, lc }));

// Find LCs in original that aren't in recompiled
const missingFromRecompiled = [];
for (const orig of originalCanonical) {
  const found = recompiledCanonical.find(r => r.canonical === orig.canonical);
  if (!found) {
    missingFromRecompiled.push(orig);
  }
}

// Find LCs in recompiled that aren't in original
const extraInRecompiled = [];
for (const recomp of recompiledCanonical) {
  const found = originalCanonical.find(o => o.canonical === recomp.canonical);
  if (!found) {
    extraInRecompiled.push(recomp);
  }
}

if (missingFromRecompiled.length > 0) {
  console.log('Missing from recompiled (in original but not in recompiled):');
  for (const item of missingFromRecompiled) {
    console.log('  LC ' + item.lc.index + ': ' + item.lc.raw);
    console.log('    Operation: ' + getOpName(item.lc.operation));
    console.log('    Activator: ' + item.lc.activatorId);
    console.log('');
  }
}

if (extraInRecompiled.length > 0) {
  console.log('Extra in recompiled (not in original):');
  for (const item of extraInRecompiled) {
    console.log('  LC ' + item.lc.index + ': ' + item.lc.raw);
    console.log('    Operation: ' + getOpName(item.lc.operation));
    console.log('    Activator: ' + item.lc.activatorId);
    console.log('');
  }
}

if (missingFromRecompiled.length === 0 && extraInRecompiled.length === 0) {
  console.log('✓ All LCs match! The difference is just in LC count/indexing.');
}

// Show side-by-side comparison
console.log('\n=== Side-by-Side LC Comparison ===\n');
const maxLen = Math.max(originalLCs.length, recompiled.length);
for (let i = 0; i < maxLen; i++) {
  const orig = originalLCs[i];
  const recomp = recompiled[i];

  if (orig && !recomp) {
    console.log('LC ' + i + ': MISSING IN RECOMPILED');
    console.log('  Original: ' + orig.raw);
  } else if (!orig && recomp) {
    console.log('LC ' + i + ': EXTRA IN RECOMPILED');
    console.log('  Recompiled: ' + recomp.raw);
  } else if (orig && recomp) {
    const origCanon = getCanonicalForm(orig);
    const recompCanon = getCanonicalForm(recomp);
    if (origCanon !== recompCanon) {
      console.log('LC ' + i + ': DIFFERENT');
      console.log('  Original:    ' + orig.raw);
      console.log('  Recompiled:  ' + recomp.raw);
    }
  }
}

function getOpName(opCode) {
  const ops = {
    0: 'TRUE', 1: 'EQUAL', 2: 'GREATER', 3: 'LOWER', 4: 'LOW', 5: 'MID', 6: 'HIGH',
    7: 'AND', 8: 'OR', 9: 'XOR', 10: 'NAND', 11: 'NOR', 12: 'NOT', 13: 'STICKY',
    14: 'ADD', 15: 'SUB', 16: 'MUL', 17: 'DIV', 18: 'GVAR_SET', 38: 'RC_OVERRIDE',
    47: 'EDGE', 48: 'DELAY', 51: 'APPROX_EQUAL'
  };
  return ops[opCode] || 'OP' + opCode;
}
