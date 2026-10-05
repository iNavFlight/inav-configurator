import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * Factory for a per-test rewriteAndWrite(relSrcPath, rules, outNamePrefix)
 * helper: rewrites the listed import specifiers in a real source file and
 * writes the result to a temp module, so plain Node's ESM resolver can load
 * a file that otherwise uses this codebase's Vite-style extensionless
 * imports. Throws loudly if a pattern stops matching, so a future reshuffle
 * of those imports fails the test instead of passing vacuously.
 */
export function makeRewriteAndWrite(repoRoot, tmpDir, testFileName) {
    return function rewriteAndWrite(relSrcPath, rules, outNamePrefix) {
        let source = readFileSync(join(repoRoot, relSrcPath), 'utf8');
        for (const [regex, replacement, label] of rules) {
            if (!regex.test(source)) {
                throw new Error(
                    `${testFileName}: expected to find and replace "${label}" in ${relSrcPath} ` +
                    `but the pattern ${regex} did not match. Update the test's substitution rules.`
                );
            }
            source = source.replace(regex, replacement);
        }
        const outPath = join(tmpDir, `${outNamePrefix}.mjs`);
        writeFileSync(outPath, source, 'utf8');
        return pathToFileURL(outPath).href;
    };
}
