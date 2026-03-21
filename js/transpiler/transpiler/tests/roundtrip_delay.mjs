import { Decompiler } from '../decompiler.js';
import { Transpiler } from '../index.js';

// Test delay round-trip
// LC 0: rc[12].high (condition)
// LC 1: DELAY(LC0, 500) - delay pattern
// LC 2: Override rc[15]=1900, active when LC 1
const originalLCs = [
  {
    index: 0,
    enabled: 1,
    activatorId: -1,
    operation: 6, // HIGH
    operandAType: 1, // RC_CHANNEL
    operandAValue: 12,
    operandBType: 0,
    operandBValue: 0,
    flags: 0
  },
  {
    index: 1,
    enabled: 1,
    activatorId: -1,
    operation: 48, // DELAY
    operandAType: 4, // LC
    operandAValue: 0,
    operandBType: 0, // VALUE (duration)
    operandBValue: 500,
    flags: 0
  },
  {
    index: 2,
    enabled: 1,
    activatorId: 1,
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
  process.exit(1);
} else {
  console.log('Commands:', recompiled.commands);

  // Check if DELAY (48) is preserved
  const hasDelay = recompiled.commands.some(cmd => cmd.includes(' 48 '));
  const hasOverride = recompiled.commands.some(cmd => cmd.includes(' 38 '));

  console.log('\n=== Result ===');
  console.log('DELAY preserved:', hasDelay ? 'YES' : 'NO');
  console.log('Override preserved:', hasOverride ? 'YES' : 'NO');

  if (hasDelay && hasOverride) {
    console.log('\n✅ Round-trip successful!');
  } else {
    console.log('\n❌ Round-trip failed');
    process.exit(1);
  }
}
