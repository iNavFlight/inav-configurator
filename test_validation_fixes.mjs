#!/usr/bin/env node

/**
 * Regression test for validation fixes
 * Verifies that the transpiler catches invalid code that was previously silently dropped
 */

import { Transpiler } from './js/transpiler/transpiler/index.js';

console.log('Testing validation fixes...\n');

const testCases = [
  {
    name: 'Invalid function call (intermediate object)',
    code: 'inav.override.flightAxis(180);',
    shouldError: true,
    expectedError: /Cannot call.*flightAxis.*as a function/
  },
  {
    name: 'Invalid function call (unknown function)',
    code: 'someRandomFunction();',
    shouldError: true,
    expectedError: /Cannot call.*someRandomFunction.*as a function/
  },
  {
    name: 'Assign to intermediate object (2-level)',
    code: 'inav.override.vtx = 3;',
    shouldError: true,
    expectedError: /Cannot (use|assign to).*vtx.*object/i
  },
  {
    name: 'Assign to intermediate object (3-level)',
    code: 'inav.override.flightAxis.yaw = 180;',
    shouldError: true,
    expectedError: /Cannot (use|assign to).*yaw.*object/i
  },
  {
    name: 'Use intermediate object in expression',
    code: 'gvar[0] = inav.flight + 1;',
    shouldError: true,
    expectedError: /Cannot use.*flight.*object/i
  },
  {
    name: 'Valid yaw angle assignment',
    code: 'inav.override.flightAxis.yaw.angle = 180;',
    shouldError: false
  },
  {
    name: 'Valid VTX power assignment',
    code: 'inav.override.vtx.power = 3;',
    shouldError: false
  },
  {
    name: 'Valid helper function call',
    code: 'sticky(() => inav.flight.altitude > 100, () => inav.flight.altitude < 50, () => { gvar[0] = 1; });',
    shouldError: false
  }
];

let passCount = 0;
let failCount = 0;

for (const test of testCases) {
  try {
    const transpiler = new Transpiler();
    const result = transpiler.transpile(test.code);

    // Check if compilation failed (success: false means error occurred)
    const hasErrors = !result.success && result.error;

    if (test.shouldError) {
      if (hasErrors) {
        // Check if error message matches expected pattern
        const errorMessage = result.error.message || result.error;
        if (test.expectedError && !test.expectedError.test(errorMessage)) {
          failCount++;
          console.log(`❌ ${test.name}`);
          console.log(`   Expected error matching: ${test.expectedError}`);
          console.log(`   Got: ${errorMessage}`);
        } else {
          passCount++;
          console.log(`✅ ${test.name}`);
          const shortError = errorMessage.split('\n')[0];
          console.log(`   Error: ${shortError}`);
        }
      } else {
        failCount++;
        console.log(`❌ ${test.name}`);
        console.log(`   Expected error but compilation succeeded!`);
        console.log(`   Generated ${result.logicConditionCount} logic conditions`);
      }
    } else {
      if (hasErrors) {
        failCount++;
        console.log(`❌ ${test.name}`);
        console.log(`   Unexpected error: ${result.error.message || result.error}`);
      } else {
        passCount++;
        console.log(`✅ ${test.name}`);
      }
    }
  } catch (error) {
    failCount++;
    console.log(`❌ ${test.name}`);
    console.log(`   Exception: ${error.message}`);
  }
}

console.log(`\n${'='.repeat(60)}`);
console.log(`Results: ${passCount} passed, ${failCount} failed`);

if (failCount > 0) {
  process.exit(1);
} else {
  console.log(`\n✅ All validation tests pass!`);
  process.exit(0);
}
