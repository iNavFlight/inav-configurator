import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeRewriteAndWrite } from './rewriteAndWrite.mjs';

/**
 * Shared setup for the source-rewriting regression tests: computes the repo
 * root from the calling test file's URL, makes a per-run temp directory that
 * is removed on exit, and returns a rewriteAndWrite() bound to both.
 */
export function makeHarness(importMetaUrl, testFileName, tmpPrefix) {
    const testDir = dirname(fileURLToPath(importMetaUrl));
    const repoRoot = resolve(testDir, '..');
    const tmpDir = mkdtempSync(join(tmpdir(), tmpPrefix));
    process.on('exit', () => rmSync(tmpDir, { recursive: true, force: true }));
    const rewriteAndWrite = makeRewriteAndWrite(repoRoot, tmpDir, testFileName);
    return { repoRoot, tmpDir, rewriteAndWrite };
}
