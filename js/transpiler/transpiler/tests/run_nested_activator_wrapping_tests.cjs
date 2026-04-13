#!/usr/bin/env node

/**
 * Tests to prevent nested activator wrapping bugs
 * These tests ensure that when decompiling LCs with activators,
 * we don't get monstrosities like: latch3 ? (latch3 ? (latch3 ? ...))
 */

const { Transpiler } = require('../index.js');
const { Decompiler } = require('../decompiler.js');

let passCount = 0;
let failCount = 0;

function test(description, fn) {
  try {
    fn();
    console.log(`  ✅ ${description}`);
    passCount++;
  } catch (error) {
    console.log(`  ❌ ${description}`);
    console.log(`     ${error.message}`);
    failCount++;
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertNotIncludes(str, substring, message) {
  if (str.includes(substring)) {
    throw new Error(message || `String should not contain "${substring}"`);
  }
}

function parseLCs(commands) {
  return commands
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
        operandFlags: parseInt(parts[9])
      };
    });
}

console.log('📦 Nested Activator Wrapping Prevention Tests');

test('should not produce monstrosity lines (heuristic: max 30 words per line)', () => {
  const code = `
    const latch3 = sticky(rc[10].high, rc[10].low);
    const latch2 = sticky(rc[11].high, rc[11].low);

    if (!latch2) {
      gvar[0] = Math.min(110, Math.max(0, (rc[12] - 1000) * 110 / 1000)) * 28;
    }

    if (latch3) {
      const min = Math.min(1800, (pid[3].output + 3000) / 2);
      const max = Math.max(1250, min);
      override.throttle = Math.max(min, max);
    }
  `;

  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);
  const lcObjects = parseLCs(result.commands);

  const decompiler = new Decompiler();
  const decompiled = decompiler.decompile(lcObjects);

  // Check for overly long lines (monstrosity indicator)
  const lines = decompiled.code.split('\n');
  for (const line of lines) {
    // Skip comments and blank lines
    if (line.trim().startsWith('//') || line.trim() === '') continue;

    // Count words (split by whitespace and operators)
    const words = line.split(/[\s\(\)\{\}\[\],;]+/).filter(w => w.length > 0);

    if (words.length > 30) {
      throw new Error(
        `Line has ${words.length} words (max 30 allowed). This suggests nested wrapping bug.\n` +
        `Line: ${line.trim().substring(0, 100)}...`
      );
    }
  }
});

test('should not produce nested wrapping with sticky activator and Math functions', () => {
  const code = `
    const latch3 = sticky(rc[10].high, rc[10].low);

    if (latch3) {
      const min = Math.min(1800, (pid[3].output + 3000) / 2);
      const max = Math.max(1250, min);
      rc[16] = max;
    }
  `;

  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);
  const lcObjects = parseLCs(result.commands);

  const decompiler = new Decompiler();
  const decompiled = decompiler.decompile(lcObjects);

  // Check for the monstrosity pattern: latch3 ? (latch3 ?
  assertNotIncludes(
    decompiled.code,
    'latch3 ? (latch3 ?',
    'Decompiled code contains nested latch3 activator wrapping'
  );

  // Also check for any repeated activator pattern
  const lines = decompiled.code.split('\n');
  for (const line of lines) {
    const match = line.match(/(\w+)\s*\?\s*\([^)]*\1\s*\?/);
    if (match) {
      throw new Error(`Found nested activator wrapping with variable "${match[1]}" in line: ${line.trim()}`);
    }
  }
});

test('should not produce nested wrapping with multiple nested operations', () => {
  const code = `
    const active = rc[12].high;

    if (active) {
      const a = flight.altitude / 100;
      const b = Math.min(500, a);
      const c = Math.max(100, b);
      const d = c * 2;
      rc[16] = d;
    }
  `;

  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);
  const lcObjects = parseLCs(result.commands);

  const decompiler = new Decompiler();
  const decompiled = decompiler.decompile(lcObjects);

  // Check that hoisted variables don't have nested activator wrapping
  const hoistedVarPattern = /const (cond\d+|min|max|a|b|c|d) = /g;
  const matches = decompiled.code.matchAll(hoistedVarPattern);

  for (const match of matches) {
    const varDecl = decompiled.code.substring(match.index);
    const lineEnd = varDecl.indexOf(';');
    const line = varDecl.substring(0, lineEnd);

    // Check for pattern like: const x = (active ? (active ? ...))
    const nestedMatch = line.match(/(\w+)\s*\?\s*\([^)]*\1\s*\?/);
    if (nestedMatch) {
      throw new Error(`Variable "${match[1]}" has nested activator wrapping: ${line}`);
    }
  }
});

test('should not produce nested wrapping with deeply nested expressions', () => {
  const code = `
    const latch = sticky(rc[5].high, rc[5].low);

    if (latch) {
      const inner = (pid[0].output + 1000) / 2;
      const middle = Math.min(800, inner);
      const outer = Math.max(200, middle);
      rc[16] = outer;
    }
  `;

  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);
  const lcObjects = parseLCs(result.commands);

  const decompiler = new Decompiler();
  const decompiled = decompiler.decompile(lcObjects);

  // Count occurrences of "latch ?" in const declarations
  // Should appear at most once per variable declaration
  const constLines = decompiled.code
    .split('\n')
    .filter(line => line.trim().startsWith('const '));

  for (const line of constLines) {
    const latchCount = (line.match(/latch\s*\?/g) || []).length;
    assert(
      latchCount <= 1,
      `Line has ${latchCount} occurrences of "latch ?" (should be ≤ 1): ${line.trim()}`
    );
  }
});

test('should not produce nested wrapping when referencing hoisted variables', () => {
  const code = `
    const enabled = rc[10].high;

    if (enabled) {
      const speed = flight.airSpeed;
      const knots = speed / 28;
      if (knots > 50) {
        rc[16] = 1800;
      }
    }
  `;

  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);
  const lcObjects = parseLCs(result.commands);

  const decompiler = new Decompiler();
  const decompiled = decompiler.decompile(lcObjects);

  // The hoisted variable "speed" should be referenced by name in "knots",
  // not inlined with extra activator wrapping
  assertNotIncludes(
    decompiled.code,
    'enabled ? (enabled ?',
    'Found nested activator wrapping'
  );

  // Check that const declarations don't have duplicate activator checks
  const lines = decompiled.code.split('\n');
  for (const line of lines) {
    if (line.trim().startsWith('const ')) {
      const activatorMatches = line.match(/(\w+)\s*\?/g) || [];
      const uniqueActivators = new Set(activatorMatches.map(m => m.replace(/\s*\?/, '')));

      // Each activator variable should appear at most once per line
      for (const activator of uniqueActivators) {
        const count = activatorMatches.filter(m => m.startsWith(activator)).length;
        assert(
          count <= 1,
          `Activator "${activator}" appears ${count} times in: ${line.trim()}`
        );
      }
    }
  }
});

test('should handle complex case with multiple activators and nested operations', () => {
  const code = `
    const latch1 = sticky(rc[5].high, rc[5].low);
    const latch2 = sticky(rc[6].high, rc[6].low);

    if (latch1 && latch2) {
      const value = Math.max(100, Math.min(200, flight.altitude / 10));
      rc[16] = value;
    }
  `;

  const transpiler = new Transpiler();
  const result = transpiler.transpile(code);
  const lcObjects = parseLCs(result.commands);

  const decompiler = new Decompiler();
  const decompiled = decompiler.decompile(lcObjects);

  // Check no variable has nested wrapping with the same activator
  const lines = decompiled.code.split('\n');
  for (const line of lines) {
    const match = line.match(/(\w+)\s*\?\s*\([^)]*\1\s*\?/);
    if (match) {
      throw new Error(`Found nested wrapping with "${match[1]}" in: ${line.trim()}`);
    }
  }
});

console.log('\n==================================================\n');
console.log('📊 Test Results:');
console.log(`   Passed: ${passCount}`);
console.log(`   Failed: ${failCount}`);
console.log(`   Total:  ${passCount + failCount}`);

if (failCount === 0) {
  console.log('\n✅ ALL TESTS PASSED\n');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED\n');
  process.exit(1);
}
