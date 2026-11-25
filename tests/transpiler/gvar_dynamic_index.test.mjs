#!/usr/bin/env node
// Write index of a gvar assignment may be any operand; read index must be a literal.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Transpiler } from '../../js/transpiler/transpiler/index.js';
import { Decompiler } from '../../js/transpiler/transpiler/decompiler.js';

const GVAR_SET = 18, GVAR_INC = 19, RC = 1, GVAR = 5, VALUE = 0;

function compile(code) {
    const result = new Transpiler().transpile(code);
    assert.ok(result.success, `transpile failed: ${result.error || JSON.stringify(result.errors)}`);
    return result;
}

function toLcs(result) {
    // transpile() returns "logic i en act op aT aV bT bV flags" command strings
    return result.commands.map(c => {
        const f = c.trim().split(/\s+/).slice(1).map(Number);
        return { index: f[0], enabled: f[1], activatorId: f[2], operation: f[3],
                 operandAType: f[4], operandAValue: f[5], operandBType: f[6], operandBValue: f[7], flags: f[8] };
    });
}

describe('dynamic gvar write index', () => {
    test('gvar[rc[1]] = 0 compiles to GVAR_SET with an RC operand A', () => {
        const lcs = toLcs(compile('inav.gvar[inav.rc[1]] = 0;'));
        assert.equal(lcs[0].operation, GVAR_SET);
        assert.equal(lcs[0].operandAType, RC);
        assert.equal(lcs[0].operandAValue, 1);
        assert.equal(lcs[0].operandBType, VALUE);
        assert.equal(lcs[0].operandBValue, 0);
    });

    test('gvar[gvar[2]] = 50 uses a GVAR operand as the index', () => {
        const lcs = toLcs(compile('inav.gvar[2] = 5;\ninav.gvar[inav.gvar[2]] = 50;'));
        assert.equal(lcs[1].operation, GVAR_SET);
        assert.equal(lcs[1].operandAType, GVAR);
        assert.equal(lcs[1].operandAValue, 2);
    });

    test('a dynamic write is not collapsed into GVAR_INC', () => {
        const lcs = toLcs(compile('inav.gvar[inav.rc[1]] = inav.gvar[0] + 1;'));
        assert.ok(lcs.every(lc => lc.operation !== GVAR_INC));
    });

    test('round trip: decompile output matches the source', () => {
        const lcs = toLcs(compile('inav.gvar[2] = 5;\ninav.gvar[inav.gvar[2]] = 50;'));
        const out = new Decompiler().decompile(lcs).code;
        assert.match(out, /inav\.gvar\[inav\.gvar\[2\]\] = 50;/);
    });

    test('round trip: logic conditions from the issue decompile with the RC index and read gvar[4] literally', () => {
        const lcs = [
            { index: 0, enabled: 1, activatorId: -1, operation: 18, operandAType: 1, operandAValue: 1, operandBType: 0, operandBValue: 0, flags: 0 },
            { index: 1, enabled: 1, activatorId: -1, operation: 1, operandAType: 5, operandAValue: 4, operandBType: 0, operandBValue: 0, flags: 0 },
        ];
        const out = new Decompiler().decompile(lcs).code;
        assert.match(out, /inav\.gvar\[inav\.rc\[1\]\] = 0;/);
        const recompiled = toLcs(compile(out));
        assert.equal(recompiled[0].operation, 18);
        assert.equal(recompiled[0].operandAType, 1);
        assert.equal(recompiled[0].operandAValue, 1);
    });

    test('a read still needs a literal gvar index', () => {
        const result = new Transpiler().transpile('inav.gvar[0] = inav.gvar[inav.rc[1]];');
        assert.ok(!result.success, 'dynamic read index should be rejected');
    });
});
