#!/usr/bin/env node
/**
 * #2294: Save in the Mixer tab's Logic Conditions overlay threw "MSPChainerClass is not defined".
 * Only the two MSP imports are pointed at stubs; plain Node cannot resolve the extensionless specifiers.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const tmpDir = mkdtempSync(join(tmpdir(), 'logic-conditions-collection-save-'));
process.on('exit', () => rmSync(tmpDir, { recursive: true, force: true }));

function dataModule(code) {
    const encoded = encodeURIComponent(code).replace(/['()!*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
    return 'data:text/javascript,' + encoded;
}

const helperStubUrl = dataModule(`
    export default { sendLogicConditions() {}, saveToEeprom() {} };
`);
const chainerStubUrl = dataModule(`
    export default function MSPChainerClass() {
        return {
            setChain(chain) { globalThis.__lcSave.chain = chain; },
            execute() { globalThis.__lcSave.executed++; },
        };
    }
`);

const source = readFileSync(join(repoRoot, 'js/logicConditionsCollection.js'), 'utf8')
    .replace(/'\.\/msp\/MSPHelper'/, `'${helperStubUrl}'`)
    .replace(/'\.\/msp\/MSPchainer'/, `'${chainerStubUrl}'`);
const modulePath = join(tmpDir, 'logicConditionsCollection.mjs');
writeFileSync(modulePath, source, 'utf8');

const { default: LogicConditionsCollection } = await import(pathToFileURL(modulePath).href);
const { default: mspHelperStub } = await import(helperStubUrl);

test('onSave() sends the logic conditions, then writes the EEPROM', () => {
    globalThis.__lcSave = { chain: null, executed: 0 };

    assert.doesNotThrow(() => new LogicConditionsCollection().onSave());

    assert.deepEqual(globalThis.__lcSave.chain, [mspHelperStub.sendLogicConditions, mspHelperStub.saveToEeprom]);
    assert.equal(globalThis.__lcSave.executed, 1);
});
