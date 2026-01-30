import { Transpiler } from '../index.js';

const transpiler = new Transpiler();
const code = `
const cond3 = flight.activeMixerProfile === 2 ? ((flight.mode.rth === 1 || flight.mode.poshold === 1)) : 0;

if (!cond3) {
  rc[5] = 1500;
}
`;

// Add debug logging to trace the flow
const originalTranspile = transpiler.transpile.bind(transpiler);
transpiler.transpile = function(code) {
  const result = originalTranspile(code);
  console.log("After transpile, analyzer variableHandler:", [...this.analyzer.variableHandler.symbols.keys()]);
  console.log("After transpile, codegen variableHandler:", this.codegen.variableHandler ? [...this.codegen.variableHandler.symbols.keys()] : 'undefined');
  return result;
};

const result = transpiler.transpile(code);
console.log("Success:", result.success);
console.log("Error:", result.error);
console.log("Commands:", result.commands);
