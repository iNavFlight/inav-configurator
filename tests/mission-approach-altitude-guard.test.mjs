import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {parse} from 'acorn';

// The approach altitude field handlers branch on this check, so it has to answer with a
// plain boolean; a Promise is truthy and would let every below-ground altitude through.
const source = readFileSync(process.env.MISSION_CONTROL_SOURCE || new URL('../tabs/mission_control.js', import.meta.url), 'utf8');
let checkSource = null;
function visit(node) {
    if (!node || typeof node !== 'object' || checkSource) return;
    if (node.type === 'FunctionDeclaration' && node.id.name === 'checkApproachAltitude') {
        checkSource = source.slice(node.start, node.end);
        return;
    }
    for (const value of Object.values(node)) {
        if (Array.isArray(value)) value.forEach(visit);
        else if (value && typeof value === 'object') visit(value);
    }
}
visit(parse(source, {ecmaVersion: 'latest', sourceType: 'module'}));

function harness() {
    const alerts = [];
    const ctx = vm.createContext({
        dialog: {alert: message => {alerts.push(message);}},
        i18n: {getMessage: key => key},
    });
    vm.runInContext(checkSource, ctx);
    return {check: ctx.checkApproachAltitude, alerts};
}

test('approach altitude below ground is refused with a boolean', () => {
    const {check, alerts} = harness();
    // sea level reference: 300 m ground, 250 m approach altitude (cm)
    assert.equal(check(25000, true, 300), false);
    // relative to home: negative approach altitude
    assert.equal(check(-100, false, 300), false);
    assert.deepEqual(alerts, ['MissionPlannerAltitudeChangeReset', 'MissionPlannerAltitudeChangeReset']);
});

test('approach altitude above ground is accepted', () => {
    const {check, alerts} = harness();
    assert.equal(check(35000, true, 300), true);
    assert.equal(check(4000, false, 300), true);
    assert.deepEqual(alerts, []);
});
