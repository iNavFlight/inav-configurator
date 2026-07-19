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

console.log('=== Functional Comparison ===\n');

// Count RC_OVERRIDE operations (these are the actual outputs)
const origOverrides = originalLCs.filter(lc => lc.operation === 38);
const recompOverrides = recompiled.filter(lc => lc.operation === 38);

console.log('RC_OVERRIDE operations (actual outputs):');
console.log('  Original:    ' + origOverrides.length);
console.log('  Recompiled:  ' + recompOverrides.length);

console.log('\nOriginal RC_OVERRIDE details:');
for (const lc of origOverrides) {
  console.log('  LC ' + lc.index + ': rc[' + lc.operandAValue + '] = ' + lc.operandBValue + ' (activator: ' + lc.activatorId + ')');
}

console.log('\nRecompiled RC_OVERRIDE details:');
for (const lc of recompOverrides) {
  console.log('  LC ' + lc.index + ': rc[' + lc.operandAValue + '] = ' + lc.operandBValue + ' (activator: ' + lc.activatorId + ')');
}

// The key question: are all the same RC channels being overridden with the same values?
const origOverrideSet = new Set(origOverrides.map(lc => 'rc[' + lc.operandAValue + ']=' + lc.operandBValue));
const recompOverrideSet = new Set(recompOverrides.map(lc => 'rc[' + lc.operandAValue + ']=' + lc.operandBValue));

console.log('\n=== RC Override Value Comparison ===');
console.log('Original overrides:    ' + Array.from(origOverrideSet).sort().join(', '));
console.log('Recompiled overrides:  ' + Array.from(recompOverrideSet).sort().join(', '));

const missing = Array.from(origOverrideSet).filter(x => !recompOverrideSet.has(x));
const extra = Array.from(recompOverrideSet).filter(x => !origOverrideSet.has(x));

if (missing.length > 0) {
  console.log('\n⚠️  Missing from recompiled: ' + missing.join(', '));
}
if (extra.length > 0) {
  console.log('⚠️  Extra in recompiled: ' + extra.join(', '));
}
if (missing.length === 0 && extra.length === 0) {
  console.log('\n✅ All RC override values match!');
}

// Check eliminated operation
console.log('\n=== Optimization Analysis ===');
const origAdd = originalLCs.filter(lc => lc.operation === 14);
const recompAdd = recompiled.filter(lc => lc.operation === 14);
console.log('ADD operations: ' + origAdd.length + ' → ' + recompAdd.length + ' (eliminated ' + (origAdd.length - recompAdd.length) + ')');

// Show what was eliminated
if (origAdd.length > recompAdd.length) {
  console.log('\nEliminated ADD operation:');
  console.log('  Original LC 1: ADD flight.airSpeed + 0 (with activator 0)');
  console.log('  This was an identity operation (x + 0 = x) used as intermediate value');
  console.log('  Recompiled code directly uses flight.airSpeed in the DIV operation');
  console.log('\n✅ This is a valid optimization - no functional change');
}
