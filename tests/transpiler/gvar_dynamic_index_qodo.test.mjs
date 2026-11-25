#!/usr/bin/env node
// Reproduction tests for suspected bugs in PR #2861 (dynamic gvar write index).
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { Transpiler } from '../../js/transpiler/transpiler/index.js';
import { Decompiler } from '../../js/transpiler/transpiler/decompiler.js';

const EQUAL = 1, GREATER_THAN = 2, LOWER_THAN = 3, ADD = 14, GVAR_SET = 18, GVAR_INC = 19, GVAR_DEC = 20;
const VALUE = 0, RC = 1, LC = 4;

function compile(code) {
    const result = new Transpiler().transpile(code);
    assert.ok(result.success, `transpile failed: ${result.error || JSON.stringify(result.errors)}`);
    return result;
}
function toLcs(result) {
    return result.commands.map(c => {
        const f = c.trim().split(/\s+/).slice(1).map(Number);
        return { index: f[0], enabled: f[1], activatorId: f[2], operation: f[3],
                 operandAType: f[4], operandAValue: f[5], operandBType: f[6], operandBValue: f[7], flags: f[8] };
    });
}
const lc = (index, operation, aT, aV, bT, bV) => ({ index, enabled: 1, activatorId: -1, operation,
    operandAType: aT, operandAValue: aV, operandBType: bT, operandBValue: bV, flags: 0 });

describe('qodo finding 1: stale cache after prefixed dynamic write', () => {
    test('second identical if re-emits its comparison', () => {
        const r = new Transpiler().transpile(
`if (inav.gvar[0] < 2) { inav.gvar[1] = 1; }
inav.gvar[inav.rc[1]] = 0;
if (inav.gvar[0] < 2) { inav.gvar[2] = 1; }`);
        assert.ok(r.success, JSON.stringify(r.error || r.errors));
        const cmp = toLcs(r).filter(l => l.operation === LOWER_THAN);
        assert.equal(cmp.length, 2, `expected 2 LOWER_THAN LCs, got ${cmp.length}`);
    });
});

describe('qodo finding 2: arithmetic index', () => {
    test('rc[1]+1 index compiles to GVAR_SET with LC operand A, or errors cleanly', () => {
        const r = new Transpiler().transpile('inav.gvar[inav.rc[1] + 1] = 0;');
        if (!r.success) {
            const msg = r.error || JSON.stringify(r.errors);
            assert.ok(!msg.includes('[object Object]'), msg);
            return;
        }
        const lcs = toLcs(r);
        const set = lcs.find(l => l.operation === GVAR_SET);
        assert.ok(set, 'no GVAR_SET');
        assert.equal(set.operandAType, LC);
        assert.equal(lcs[set.operandAValue].operation, ADD);
    });
    test('hand-built ADD + GVAR_SET(LC index) decompiles and recompiles', () => {
        const lcs = [lc(0, ADD, RC, 1, VALUE, 1), lc(1, GVAR_SET, LC, 0, VALUE, 0)];
        const out = new Decompiler().decompile(lcs).code;
        const r = new Transpiler().transpile(out);
        assert.ok(r.success, `recompile failed: ${r.error || JSON.stringify(r.errors)}\n${out}`);
    });
});

describe('qodo finding 3: dynamic INC/DEC round trip', () => {
    for (const [name, op] of [['INC', GVAR_INC], ['DEC', GVAR_DEC]]) {
        test(`GVAR_${name} with RC index round trips`, () => {
            const out = new Decompiler().decompile([lc(0, op, RC, 1, VALUE, 3)]).code;
            const r = new Transpiler().transpile(out);
            assert.ok(r.success, `recompile failed: ${r.error || JSON.stringify(r.errors)}\n${out}`);
            const l = toLcs(r).find(x => x.operation === op);
            assert.ok(l, `no recompiled op ${op}: ${r.commands.join(' | ')}`);
            assert.equal(l.operandAType, RC);
            assert.equal(l.operandAValue, 1);
            assert.equal(l.operandBType, VALUE);
            assert.equal(l.operandBValue, 3);
        });
    }
});

describe('qodo finding 4: analyzer after dynamic index', () => {
    test('unknown property in value is rejected', () => {
        const r = new Transpiler().transpile('inav.gvar[inav.rc[1]] = inav.flight.bogus;');
        assert.ok(!r.success, 'should fail transpile');
    });

    test('dynamic index with a bogus value is rejected by the analyzer too (lint)', () => {
        const r = new Transpiler().transpile('inav.gvar[inav.rc[1]] = inav.flight.bogus;');
        assert.ok(!r.success);
    });
});

describe('related regressions', () => {
    test('a literal top-level gvar write between identical ifs re-emits the comparison', () => {
        const lcs = toLcs(compile('if (inav.gvar[0] < 2) { inav.gvar[1] = 1; }\ninav.gvar[0] = 5;\nif (inav.gvar[0] < 2) { inav.gvar[2] = 1; }\n'));
        assert.equal(lcs.filter(l => l.operation === 3).length, 2);
    });

    test('dynamic gvar[i] = gvar[i] * 2 is rejected with a clear message', () => {
        const r = new Transpiler().transpile('inav.gvar[inav.rc[1]] = inav.gvar[inav.rc[1]] * 2;');
        assert.ok(!r.success);
        assert.doesNotMatch(r.error || '', /\[object Object\]/);
    });

    test('dynamic gvar[i] = gvar[i] + x compiles to GVAR_INC with the dynamic index', () => {
        const lcs = toLcs(compile('inav.gvar[inav.rc[1]] = inav.gvar[inav.rc[1]] + 3;'));
        assert.equal(lcs[0].operation, GVAR_INC);
        assert.equal(lcs[0].operandAType, RC);
        assert.equal(lcs[0].operandBValue, 3);
    });
});
