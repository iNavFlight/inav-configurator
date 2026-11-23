import assert from 'node:assert/strict';
import { register } from 'node:module';
import { describe, test } from 'node:test';
import xml2js from 'xml2js';

register('./helpers/extensionless-import-hook.mjs', import.meta.url);

const { FwApproach } = await import('../js/fwApproach.js');
const { buildFwApproachItems, fwApproachFromElement } = await import('../js/missionFwApproach.js');

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

/* Same steps as loadMissionFile() for the parsed fwapproach elements */
async function loadInto(approaches, xml) {
    const result = await xml2js.parseStringPromise(xml, { explicitChildren: true, preserveChildrenOrder: true });

    for (const node of result.mission.$$ || []) {
        if (!/fwapproach/i.test(node['#name']) || !node.$) continue;

        const approach = fwApproachFromElement(node.$, MAX_SAFEHOMES, MAX_APPROACHES);
        if (approach) {
            // FwApproachCollection.updateFwApproach() stores by approach number
            approaches[approach.getNumber()] = approach;
        }
    }

    return approaches;
}

describe('Mission file fwapproach writing', () => {
    test('writes the attributes of an approach with a landing heading unchanged', () => {
        const approaches = approachCollection();
        const approach = missionApproach(approaches);
        approach.setApproachAltAsl(6000);
        approach.setLandAltAsl(500);
        approach.setLandHeading1(300);

        const items = buildFwApproachItems(approaches, MAX_SAFEHOMES, MAX_APPROACHES);

        assert.equal(items.length, 1);
        assert.deepEqual(items[0].$, {
            'index': 0,
            'no': 8,
            'approach-alt': 6000,
            'land-alt': 500,
            'approach-direction': 'left',
            'landheading1': 300,
            'landheading2': 0,
            'sealevel-ref': 'false'
        });
    });

    test('writes nothing for an approach without a landing heading, as the firmware ignores it', () => {
        const approaches = approachCollection();
        missionApproach(approaches).setApproachAltAsl(6000);
        missionApproach(approaches).setLandAltAsl(500);

        assert.deepEqual(buildFwApproachItems(approaches, MAX_SAFEHOMES, MAX_APPROACHES), []);
    });

    test('writes one entry per mission approach of a multi mission file', () => {
        const approaches = approachCollection();
        missionApproach(approaches, 0).setLandHeading1(90);
        missionApproach(approaches, 2).setLandHeading2(-270);

        const items = buildFwApproachItems(approaches, MAX_SAFEHOMES, MAX_APPROACHES);

        assert.deepEqual(items.map((item) => item.$.index), [0, 2]);
        assert.deepEqual(items.map((item) => item.$.no), [8, 10]);
    });

    test('never writes the safehome approaches', () => {
        const approaches = approachCollection();
        approaches[0].setLandHeading1(120);

        assert.deepEqual(buildFwApproachItems(approaches, MAX_SAFEHOMES, MAX_APPROACHES), []);
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

    test('reads the attribute names written by mwp', async () => {
        const xml = '<mission><fwapproach no="8" index="0" approachalt="5500" landalt="700" landheading1="120" landheading2="-200" approachdirection="right" sealevelref="true"/></mission>';

        const approaches = await loadInto(approachCollection(), xml);

        assert.deepEqual(values(missionApproach(approaches)), {
            approachAlt: 5500,
            landAlt: 700,
            direction: 1,
            heading1: 120,
            heading2: -200,
            seaLevelRef: 1
        });
    });

    test('reads entries that only carry the mission index', async () => {
        const xml = '<mission><fwapproach index="1" approach-alt="4000" land-alt="200" landheading1="45"/></mission>';

        const approaches = await loadInto(approachCollection(), xml);

        assert.equal(missionApproach(approaches, 1).getLandHeading1(), 45);
        assert.equal(missionApproach(approaches, 1).getNumber(), MAX_SAFEHOMES + 1);
        approaches.slice(0, MAX_SAFEHOMES).forEach((approach) => assert.equal(approach.getApproachAltAsl(), 0));
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

        const xml = toMissionXml(buildFwApproachItems(saved, MAX_SAFEHOMES, MAX_APPROACHES));
        const loaded = await loadInto(approachCollection(), xml);

        assert.deepEqual(values(missionApproach(loaded)), values(approach));
    });
});

test('a selected later mission exports its approach as standalone mission zero', async () => {
    const saved = approachCollection();
    missionApproach(saved, 0).setLandHeading1(90);
    const selected = missionApproach(saved, 2);
    selected.setApproachAltAsl(6200);
    selected.setLandAltAsl(400);
    selected.setLandHeading1(270);
    const items = buildFwApproachItems(saved, MAX_SAFEHOMES, MAX_APPROACHES, 2);
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
