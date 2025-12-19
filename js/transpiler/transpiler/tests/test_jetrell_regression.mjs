import { Decompiler } from '../decompiler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fileContent = fs.readFileSync(path.join(__dirname, '../../../../../claude/projects/transpiler-pid-support/jetrell-logic.txt'), 'utf8');

const lcLines = fileContent
  .split('\n')
  .filter(line => line.startsWith('logic '));

const lcObjects = lcLines.map(cmd => {
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

const decompiler = new Decompiler();
const decompiled = decompiler.decompile(lcObjects);

console.log(decompiled.code);
