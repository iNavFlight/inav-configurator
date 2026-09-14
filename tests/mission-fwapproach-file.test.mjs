import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import xml2js from 'xml2js';

import { FwApproach } from '../js/fwApproach.js';
import {
    buildFwApproachItems,
    parseFwApproachAttributes,
    resolveFwApproachSlot
} from '../js/missionFwApproach.js';

const MAX_SAFEHOMES = 8;
const MAX_APPROACHES = 17;

/* The mission planner fills the collection with empty approaches on tab load */
function approachCollection() {
    return Array.from({ length: MAX_APPROACHES }, (unused, i) => new FwApproach(i));
}

function missionApproach(approaches, missionIndex = 0) {
    return approaches[MAX_SAFEHOMES + missionIndex];
}

function values(approach) {
    return {
        approachAlt: approach.getApproachAltAsl(),
        landAlt: approach.getLandAltAsl(),
        direction: approach.getApproachDirection(),
        heading1: approach.getLandHeading1(),
        heading2: approach.getLandHeading2(),
        seaLevelRef: approach.getIsSeaLevelRef()
    };
}

function toMissionXml(items) {
    return new xml2js.Builder({ rootName: 'mission' }).buildObject({
        version: { $: { value: '2.3-pre8' } },
        fwapproach: items
    });
}

/* Mirrors what loadMissionFile() does with the parsed fwapproach elements */
async function loadInto(approaches, xml) {
    const result = await xml2js.parseStringPromise(xml, { explicitChildren: true, preserveChildrenOrder: true });

    for (const node of result.mission.$$ || []) {
        if (!/fwapproach/i.test(node['#name']) || !node.$) continue;

        const parsed = parseFwApproachAttributes(node.$);
        const slot = resolveFwApproachSlot(parsed, MAX_SAFEHOMES, MAX_APPROACHES);

        if (slot >= 0) {
            // FwApproachCollection.updateFwApproach() stores by approach number
            approaches[slot] = new FwApproach(slot,
                                              parsed.approachAltAsl,
                                              parsed.landAltAsl,
                                              parsed.approachDirection,
                                              parsed.landHeading1,
                                              parsed.landHeading2,
                                              parsed.isSeaLevelRef);
        }
    }

    return approaches;
}

describe('Mission file fwapproach writing', () => {
    test('keeps the landing information of a landing point that has no landing heading', () => {
        const approaches = approachCollection();
        const approach = missionApproach(approaches);
        approach.setApproachAltAsl(6000);
        approach.setLandAltAsl(500);

        const items = buildFwApproachItems(approaches, MAX_SAFEHOMES, MAX_APPROACHES, [0]);

        assert.equal(items.length, 1);
        assert.deepEqual(items[0].$, {
            'index': 0,
            'no': 8,
            'approach-alt': 6000,
            'land-alt': 500,
            'approach-direction': 'left',
            'landheading1': 0,
            'landheading2': 0,
            'sealevel-ref': 'false'
        });
    });

    test('writes an entry for every mission that ends with a landing point', () => {
        const items = buildFwApproachItems(approachCollection(), MAX_SAFEHOMES, MAX_APPROACHES, [0, 2]);

        assert.deepEqual(items.map((item) => item.$.index), [0, 2]);
        assert.deepEqual(items.map((item) => item.$.no), [8, 10]);
    });

    test('writes nothing for missions without a landing point and without approach data', () => {
        assert.deepEqual(buildFwApproachItems(approachCollection(), MAX_SAFEHOMES, MAX_APPROACHES, []), []);
    });

    test('keeps approach data of a mission whose landing point is not part of this save', () => {
        const approaches = approachCollection();
        missionApproach(approaches, 1).setLandHeading1(300);

        const items = buildFwApproachItems(approaches, MAX_SAFEHOMES, MAX_APPROACHES, []);

        assert.deepEqual(items.map((item) => item.$.index), [1]);
    });

    test('never writes the safehome approaches', () => {
        const approaches = approachCollection();
        approaches[0].setLandHeading1(120);

        assert.deepEqual(buildFwApproachItems(approaches, MAX_SAFEHOMES, MAX_APPROACHES, []), []);
    });
});

describe('Mission file fwapproach reading', () => {
    test('reads the entries written by Configurator 7.1', async () => {
        const xml = [
            '<mission>',
            '<version value="2.3-pre8"/>',
            '<fwapproach index="0" no="8" approach-alt="6000" land-alt="1000" approach-direction="left" landheading1="300" landheading2="0" sealevel-ref="false"/>',
            '</mission>'
        ].join('');

        const approaches = await loadInto(approachCollection(), xml);

        assert.deepEqual(values(missionApproach(approaches)), {
            approachAlt: 6000,
            landAlt: 1000,
            direction: 0,
            heading1: 300,
            heading2: 0,
            seaLevelRef: 0
        });
    });

    test('reads entries that only carry the collection slot', async () => {
        const xml = '<mission><fwapproach no="9" approach-alt="4000" land-alt="200" approach-direction="right" sealevel-ref="true"/></mission>';

        const approaches = await loadInto(approachCollection(), xml);

        assert.deepEqual(values(missionApproach(approaches, 1)), {
            approachAlt: 4000,
            landAlt: 200,
            direction: 1,
            heading1: 0,
            heading2: 0,
            seaLevelRef: 1
        });
        assert.deepEqual(values(missionApproach(approaches, 0)), values(new FwApproach(0)));
    });

    test('ignores entries that address no mission slot', async () => {
        const xml = [
            '<mission>',
            '<fwapproach approach-alt="4000"/>',
            '<fwapproach index="42" approach-alt="4000"/>',
            '</mission>'
        ].join('');

        const approaches = await loadInto(approachCollection(), xml);

        assert.equal(approaches.length, MAX_APPROACHES);
        approaches.forEach((approach) => assert.equal(approach.getApproachAltAsl(), 0));
    });

    test('loading the same mission twice does not shift or duplicate the approaches', async () => {
        const xml = '<mission><fwapproach index="0" no="8" approach-alt="6000" land-alt="500" approach-direction="left" landheading1="300" landheading2="0" sealevel-ref="false"/></mission>';

        const approaches = await loadInto(await loadInto(approachCollection(), xml), xml);

        assert.equal(approaches.length, MAX_APPROACHES);
        assert.equal(missionApproach(approaches).getNumber(), 8);
        assert.equal(missionApproach(approaches).getLandHeading1(), 300);
        assert.equal(missionApproach(approaches, 1).getLandHeading1(), 0);
    });
});

describe('Mission file fwapproach round trip', () => {
    test('a landing point keeps every approach setting', async () => {
        const saved = approachCollection();
        const approach = missionApproach(saved);
        approach.setApproachAltAsl(6000);
        approach.setLandAltAsl(1000);
        approach.setApproachDirection(1);
        approach.setLandHeading1(-300);
        approach.setLandHeading2(120);
        approach.setIsSeaLevelRef(1);

        const xml = toMissionXml(buildFwApproachItems(saved, MAX_SAFEHOMES, MAX_APPROACHES, [0]));
        const loaded = await loadInto(approachCollection(), xml);

        assert.deepEqual(values(missionApproach(loaded)), values(approach));
    });

    test('a landing point without a landing heading keeps its altitudes', async () => {
        const saved = approachCollection();
        const approach = missionApproach(saved);
        approach.setApproachAltAsl(6000);
        approach.setLandAltAsl(500);

        const xml = toMissionXml(buildFwApproachItems(saved, MAX_SAFEHOMES, MAX_APPROACHES, [0]));
        const loaded = await loadInto(approachCollection(), xml);

        assert.deepEqual(values(missionApproach(loaded)), values(approach));
    });
});

test('a selected later mission exports its approach as standalone mission zero', async () => {
    const saved = approachCollection();
    missionApproach(saved, 0).setApproachAltAsl(1000);
    const selected = missionApproach(saved, 2);
    selected.setApproachAltAsl(6200);
    selected.setLandAltAsl(400);
    const items = buildFwApproachItems(saved, MAX_SAFEHOMES, MAX_APPROACHES, [2], 2);
    assert.equal(items.length, 1);
    assert.equal(items[0].$.index, 0);
    assert.equal(items[0].$.no, MAX_SAFEHOMES);
    const loaded = await loadInto(approachCollection(), toMissionXml(items));
    assert.deepEqual(values(missionApproach(loaded, 0)), values(selected));
    assert.equal(missionApproach(loaded, 2).getApproachAltAsl(), 0);
});

test('a no-only safehome slot cannot overwrite a mission approach', async () => {
    const loaded = await loadInto(approachCollection(), '<mission><fwapproach no="7" approach-alt="6200"/></mission>');
    loaded.forEach(approach => assert.equal(approach.getApproachAltAsl(), 0));
});
