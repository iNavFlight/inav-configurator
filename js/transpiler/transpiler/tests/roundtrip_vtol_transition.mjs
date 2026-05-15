/**
 * VTOL Transition Logic Conditions Round-Trip Test
 *
 * Tests decompile -> recompile cycle for the full VTOL transition config
 */

import { Decompiler } from '../decompiler.js';
import { Transpiler } from '../index.js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse LC commands from file
function parseLCCommands(text) {
  const lines = text.trim().split('\n').filter(l => l.startsWith('logic '));
  return lines.map(line => {
    const parts = line.split(/\s+/);
    // logic INDEX ENABLED ACTIVATOR OPERATION OPERAND_A_TYPE OPERAND_A_VALUE OPERAND_B_TYPE OPERAND_B_VALUE FLAGS
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
}

// Parse a logic command string back to comparable format
function parseLogicCommand(cmd) {
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
}

// Read the VTOL transition LCs
const lcFile = join(__dirname, '../../../../../claude/developer/work-in-progress/vtol-transistion-lcs.txt');
const lcText = readFileSync(lcFile, 'utf-8');
const originalLCs = parseLCCommands(lcText);

console.log(`=== Original: ${originalLCs.length} Logic Conditions ===\n`);

// Step 1: Decompile
console.log('=== Step 1: Decompile ===');
const decompiler = new Decompiler();
const decompiled = decompiler.decompile(originalLCs);
console.log('Success:', decompiled.success);
if (decompiled.warnings.length > 0) {
  console.log('Warnings:', decompiled.warnings);
}
console.log('\nDecompiled JavaScript:');
console.log('─'.repeat(60));
console.log(decompiled.code);
console.log('─'.repeat(60));

// Step 2: Recompile
console.log('\n=== Step 2: Recompile ===');
const transpiler = new Transpiler();
const recompiled = transpiler.transpile(decompiled.code);
console.log('Success:', recompiled.success);
if (!recompiled.success) {
  console.log('Error:', recompiled.error);
  console.log('Errors:', recompiled.errors);
  process.exit(1);
}

console.log(`\nRecompiled: ${recompiled.commands.length} Logic Conditions`);

// Step 3: Compare
console.log('\n=== Step 3: Compare ===\n');

// Parse recompiled commands
const recompiledLCs = recompiled.commands.map(parseLogicCommand);

// Build maps for comparison by semantic meaning
function getLCKey(lc) {
  // Key by operation and operands (ignoring index which may differ)
  return `op${lc.operation}_${lc.operandAType}:${lc.operandAValue}_${lc.operandBType}:${lc.operandBValue}`;
}

const originalByKey = new Map();
for (const lc of originalLCs) {
  const key = getLCKey(lc);
  if (!originalByKey.has(key)) originalByKey.set(key, []);
  originalByKey.get(key).push(lc);
}

const recompiledByKey = new Map();
for (const lc of recompiledLCs) {
  const key = getLCKey(lc);
  if (!recompiledByKey.has(key)) recompiledByKey.set(key, []);
  recompiledByKey.get(key).push(lc);
}

// Check which operations are preserved
const preserved = [];
const missing = [];
const added = [];

for (const [key, originals] of originalByKey) {
  if (recompiledByKey.has(key)) {
    preserved.push({ key, original: originals[0], recompiled: recompiledByKey.get(key)[0] });
  } else {
    missing.push({ key, original: originals[0] });
  }
}

for (const [key, recompileds] of recompiledByKey) {
  if (!originalByKey.has(key)) {
    added.push({ key, recompiled: recompileds[0] });
  }
}

console.log(`Preserved: ${preserved.length}`);
console.log(`Missing:   ${missing.length}`);
console.log(`Added:     ${added.length}`);

if (missing.length > 0) {
  console.log('\n❌ Missing operations:');
  for (const m of missing) {
    console.log(`  LC ${m.original.index}: op=${m.original.operation} A=${m.original.operandAType}:${m.original.operandAValue} B=${m.original.operandBType}:${m.original.operandBValue}`);
  }
}

if (added.length > 0) {
  console.log('\n➕ Added operations:');
  for (const a of added) {
    console.log(`  LC ${a.recompiled.index}: op=${a.recompiled.operation} A=${a.recompiled.operandAType}:${a.recompiled.operandAValue} B=${a.recompiled.operandBType}:${a.recompiled.operandBValue}`);
  }
}

// Summary
console.log('\n=== Summary ===');
if (missing.length === 0 && added.length === 0) {
  console.log('✅ Perfect round-trip! All operations preserved.');
} else if (missing.length === 0) {
  console.log('⚠️  Round-trip added some helper LCs but preserved all original operations.');
} else {
  console.log('❌ Round-trip lost some operations.');
  process.exit(1);
}
