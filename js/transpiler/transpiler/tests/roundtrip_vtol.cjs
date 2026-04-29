#!/usr/bin/env node
/**
 * Round-trip test for VTOL logic conditions
 * Decompile original LCs, recompile, compare
 */
'use strict';

const fs = require('fs');
const path = require('path');

async function main() {
  // Parse original LCs
  const lcPath = path.join(__dirname, '../../../../../claude/developer/work-in-progress/vtol-transistion-lcs.txt');
  const lcText = fs.readFileSync(lcPath, 'utf8');
  const originalLCs = lcText.trim().split('\n').map(line => {
    const parts = line.split(' ');
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

  const { Decompiler } = await import('../decompiler.js');
  const { Transpiler } = await import('../index.js');

  // Step 1: Decompile
  const decompiler = new Decompiler();
  const decompiled = decompiler.decompile(originalLCs);

  console.log('=== Step 1: Decompile ===');
  console.log('Success:', decompiled.success);
  console.log('Warnings:', decompiled.warnings.length);
  decompiled.warnings.forEach(w => console.log('  -', w));

  // Step 2: Recompile
  const transpiler = new Transpiler();
  const recompiled = transpiler.transpile(decompiled.code);

  console.log('\n=== Step 2: Recompile ===');
  console.log('Success:', recompiled.success);
  if (!recompiled.success) {
    console.log('Error:', recompiled.error);
    console.log('Errors:', recompiled.errors);
    process.exit(1);
  }
  console.log('Commands generated:', recompiled.commands.length);

  // Step 3: Compare key behaviors
  console.log('\n=== Step 3: Key Behavior Comparison ===');

  // Parse recompiled commands
  const recompiledLCs = recompiled.commands
    .filter(cmd => cmd.startsWith('logic '))
    .map(cmd => {
      const parts = cmd.split(' ');
      return {
        index: parseInt(parts[1]),
        operation: parseInt(parts[4]),
        operandAType: parseInt(parts[5]),
        operandAValue: parseInt(parts[6]),
        operandBType: parseInt(parts[7]),
        operandBValue: parseInt(parts[8])
      };
    });

  // Check for override operations (38 = RC_CHANNEL_OVERRIDE)
  const origOverrides = originalLCs.filter(lc => lc.operation === 38);
  const recompOverrides = recompiledLCs.filter(lc => lc.operation === 38);

  console.log('Original override count:', origOverrides.length);
  console.log('Recompiled override count:', recompOverrides.length);

  // Check specific overrides
  let allFound = true;
  for (const orig of origOverrides) {
    const channel = orig.operandAValue;
    const value = orig.operandBValue;
    const found = recompOverrides.some(r => r.operandAValue === channel && r.operandBValue === value);
    console.log(`  rc[${channel}] = ${value}: ${found ? 'FOUND' : 'MISSING'}`);
    if (!found) allFound = false;
  }

  console.log('\n=== Result ===');
  if (allFound && recompiled.success) {
    console.log('✅ Round-trip successful - all overrides preserved');
  } else {
    console.log('❌ Round-trip has issues');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
