import { Decompiler } from '../decompiler.js';
import { Transpiler } from '../index.js';

// Test round-trip with explicit inav.flight syntax (no destructuring)
const testCode = `// Auto VTX power based on distance

if (inav.flight.homeDistance > 100) {
  inav.override.vtx.power = 3; // High power
}

if (inav.flight.homeDistance > 500) {
  inav.override.vtx.power = 4; // Max power
}`;

console.log('=== Step 1: Compile explicit syntax ===');
console.log('Code:\n' + testCode);

const transpiler = new Transpiler();
const compiled = transpiler.transpile(testCode);
console.log('\nSuccess:', compiled.success);
if (!compiled.success) {
  console.log('Error:', compiled.error);
  process.exit(1);
}
console.log('Commands:', compiled.commands);

console.log('\n=== Step 2: Decompile back ===');
// Parse commands into LC array
const lcs = [];
for (const cmd of compiled.commands) {
  const parts = cmd.split(' ');
  if (parts[0] === 'logic' && parts.length >= 9) {
    lcs.push({
      index: parseInt(parts[1]),
      enabled: parseInt(parts[2]),
      activatorId: parseInt(parts[3]),
      operation: parseInt(parts[4]),
      operandAType: parseInt(parts[5]),
      operandAValue: parseInt(parts[6]),
      operandBType: parseInt(parts[7]),
      operandBValue: parseInt(parts[8]),
      flags: parseInt(parts[9] || 0)
    });
  }
}

const decompiler = new Decompiler();
const decompiled = decompiler.decompile(lcs);
console.log('Success:', decompiled.success);
console.log('Decompiled Code:\n' + decompiled.code);

console.log('\n=== Step 3: Verify no destructuring ===');
const hasDestructuring = decompiled.code.includes('const {') || decompiled.code.includes('const{');
const hasExplicitSyntax = decompiled.code.includes('inav.flight.homeDistance') &&
                          decompiled.code.includes('inav.override.vtx.power');

console.log('Has destructuring:', hasDestructuring ? 'YES ❌' : 'NO ✅');
console.log('Has explicit syntax:', hasExplicitSyntax ? 'YES ✅' : 'NO ❌');

if (!hasDestructuring && hasExplicitSyntax) {
  console.log('\n✅ Round-trip successful! No destructuring in output.');
} else {
  console.log('\n❌ Round-trip failed');
  process.exit(1);
}
