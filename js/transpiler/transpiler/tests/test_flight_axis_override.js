#!/usr/bin/env node

/**
 * Test flight axis override compilation and decompilation
 */

import { Transpiler } from '../index.js';
import { Decompiler } from '../decompiler.js';

function testFlightAxisOverride() {
  console.log('Testing Flight Axis Override...\n');

  const testCases = [
    {
      name: 'Roll angle override',
      code: `
const { flight, override } = inav;

if (flight.altitude > 100) {
  override.flightAxis.roll.angle = 45;
}
`
    },
    {
      name: 'Pitch rate override',
      code: `
const { flight, override } = inav;

if (flight.homeDistance > 500) {
  override.flightAxis.pitch.rate = 100;
}
`
    },
    {
      name: 'Yaw angle override',
      code: `
const { flight, override } = inav;

if (flight.heading < 180) {
  override.flightAxis.yaw.angle = 90;
}
`
    },
    {
      name: 'Multiple axis overrides',
      code: `
const { flight, override } = inav;

if (flight.isArmed) {
  override.flightAxis.roll.angle = 30;
  override.flightAxis.pitch.angle = -15;
  override.flightAxis.yaw.rate = 50;
}
`
    }
  ];

  testCases.forEach((test, index) => {
    console.log(`Test ${index + 1}: ${test.name}`);
    console.log('='.repeat(60));

    try {
      const transpiler = new Transpiler();
      const result = transpiler.transpile(test.code);

      if (result.success) {
        console.log('✓ Compilation successful');

        // Show the result structure
        console.log('Result:', JSON.stringify(result, null, 2));

        const logicConditions = result.logic_conditions || result.logicConditions || [];
        console.log(`  Logic conditions generated: ${logicConditions.length}`);

        // Show generated logic conditions
        logicConditions.forEach((lc, i) => {
          console.log(`  LC ${i}: Op=${lc.operation}, OpA=${lc.operandAType}:${lc.operandAValue}, OpB=${lc.operandBType}:${lc.operandBValue}`);
        });

        // Test decompilation
        const decompiler = new Decompiler();
        const decompiled = decompiler.decompile(logicConditions);
        if (decompiled.success) {
          console.log('✓ Decompilation successful');
          console.log('Decompiled code:');
          console.log(decompiled.code);
        } else {
          console.log('✗ Decompilation failed:', decompiled.error || decompiled.errors);
        }
      } else {
        console.log('✗ Compilation failed:', result.error || result.errors);
      }
    } catch (error) {
      console.log('✗ Error:', error.message);
      console.log(error.stack);
    }

    console.log('\n');
  });
}

// Run tests
testFlightAxisOverride();
