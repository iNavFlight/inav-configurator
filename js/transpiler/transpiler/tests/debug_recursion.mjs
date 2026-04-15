import { Transpiler } from '../index.js';

const transpiler = new Transpiler();

// Add recursion tracking for condition_generator.generate
let depth = 0;

const code = `
if (approxEqual(rc[11], 2000)) {
  rc[5] = 1500;
}
`;

try {
  const result = transpiler.transpile(code);
  console.log("Success:", result.success);
} catch (e) {
  console.log("Error:", e.message);
}
