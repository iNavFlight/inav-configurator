import { Decompiler } from '../decompiler.js';
import { Transpiler } from '../index.js';

// Test APPROX_EQUAL round-trip
const originalLCs = [
  {
    index: 0,
    enabled: 1,
    activatorId: -1,
    operation: 51, // APPROX_EQUAL
    operandAType: 1, // RC_CHANNEL
    operandAValue: 11,
    operandBType: 0, // VALUE
    operandBValue: 2000,
    flags: 0
  },
  {
    index: 1,
    enabled: 1,
    activatorId: 0,
    operation: 38, // OVERRIDE_RC_CHANNEL
    operandAType: 0,
    operandAValue: 15,
    operandBType: 0,
    operandBValue: 1900,
    flags: 0
  }
];

console.log('=== Step 1: Decompile ===');
const decompiler = new Decompiler();
const decompiled = decompiler.decompile(originalLCs);
console.log('Success:', decompiled.success);
console.log('Code:\n' + decompiled.code);

console.log('\n=== Step 2: Recompile ===');
const transpiler = new Transpiler();
const recompiled = transpiler.transpile(decompiled.code);
console.log('Success:', recompiled.success);
if (!recompiled.success) {
  console.log('Error:', recompiled.error);
  console.log('Errors:', recompiled.errors);
} else {
  console.log('Commands:', recompiled.commands);

  // Check if APPROX_EQUAL (51) is preserved
  const hasApproxEqual = recompiled.commands.some(cmd => cmd.includes(' 51 '));
  const hasOverride = recompiled.commands.some(cmd => cmd.includes(' 38 ') && cmd.includes(' 15 ') && cmd.includes(' 1900 '));

  console.log('\n=== Result ===');
  console.log('APPROX_EQUAL (op 51) preserved:', hasApproxEqual ? 'YES' : 'NO');
  console.log('Override rc[15]=1900 preserved:', hasOverride ? 'YES' : 'NO');

  if (hasApproxEqual && hasOverride) {
    console.log('\n✅ Round-trip successful!');
  } else {
    console.log('\n❌ Round-trip failed');
    process.exit(1);
  }
}
