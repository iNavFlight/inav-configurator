#!/usr/bin/env node

/**
 * A tiny utility for patching GLB files in place.
 *
 * What does it do?
 * ----------------
 * It finds all `roughnessFactor` values inside the JSON chunk of a GLB 2.0 file
 * and changes them to `1` without rebuilding the file.
 *
 * Why is it needed?
 * -----------------
 * Some tools export GLB materials that look too glossy.
 * This simple utility removes visible shiny highlights by forcing
 * `roughnessFactor` to `1` through direct byte replacement in the binary file.
 *
 * Usage
 * -----
 *   node glb-force-roughness.js input.glb output.glb
 *
 * If output file is omitted, the input file is modified in place.
 *
 * Notes
 * -----
 * - Supports GLB version 2 only.
 * - Modifies only JSON chunk content.
 * - Does not rebuild the GLB container.
 * - Keeps file structure intact by preserving exact byte count.
 */

import fs from 'fs';
import path from 'path';

const GLB_MAGIC = 0x46546c67;
const GLB_VERSION = 2;
const CHUNK_TYPE_JSON = 0x4e4f534a;

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

const input = process.argv[2];
const output = process.argv[3] || input;

if (!input) {
  console.error('Usage: node glb_set_roughtness_1.js input.glb [output.glb]');
  process.exit(1);
}

const buffer = fs.readFileSync(input);

// --- validate header ---
if (buffer.readUInt32LE(0) !== GLB_MAGIC) fail('Not GLB');
if (buffer.readUInt32LE(4) !== GLB_VERSION) fail('Unsupported GLB version');

const jsonLength = buffer.readUInt32LE(12);
const jsonType = buffer.readUInt32LE(16);

if (jsonType !== CHUNK_TYPE_JSON) fail('No JSON chunk');

const jsonStart = 20;
const jsonEnd = jsonStart + jsonLength;

function isNum(ch) {
  return (
    (ch >= 48 && ch <= 57) ||
    ch === 45 || ch === 43 || ch === 46 ||
    ch === 101 || ch === 69
  );
}

const jsonText = buffer.subarray(jsonStart, jsonEnd).toString('utf8');

let pos = 0;
let count = 0;

while (true) {
  const keyPos = jsonText.indexOf('"roughnessFactor"', pos);
  if (keyPos === -1) break;

  let p = keyPos + 17;

  while (/\s/.test(jsonText[p])) p++;
  if (jsonText[p] !== ':') { pos = p; continue; }

  p++;
  while (/\s/.test(jsonText[p])) p++;

  const start = p;
  let end = p;

  while (end < jsonText.length && isNum(jsonText.charCodeAt(end))) end++;

  const len = end - start;
  if (len <= 0) { pos = end; continue; }

  const replacement = '1' + ' '.repeat(len - 1);
  buffer.write(replacement, jsonStart + start, len, 'utf8');

  count++;
  pos = end;
}

fs.writeFileSync(output, buffer);

console.log(`Patched ${count} values`);