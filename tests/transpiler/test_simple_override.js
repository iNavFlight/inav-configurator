#!/usr/bin/env node

import { Transpiler } from '../../js/transpiler/transpiler/index.js';

const code = `
const { flight, override } = inav;
if (flight.armed) {
  override.throttle = 1500;
}`;

const transpiler = new Transpiler();
const result = transpiler.transpile(code);

console.log('Result:', JSON.stringify(result, null, 2));
