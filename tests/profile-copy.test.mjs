import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    extractProfileCopyLines, findCliErrors, copyProfileViaCli, profileCopyResultKey,
    leaveProfileCopyCli, profileCopyInterruptedKey,
} from '../js/profile_copy.js';

const CONTROL_DUMP = '# dump control_profile\r\n\r\n# control_profile\r\ncontrol_profile 1\r\n\r\n'
    + 'set mc_p_pitch = 44\r\nset mc_i_pitch = 75\r\n\r\n# ';

const MIXER_DUMP = '# dump mixer_profile\r\n\r\n# mixer_profile\r\nmixer_profile 2\r\n\r\nset motor_direction_inverted = OFF\r\n'
    + '\r\n# Mixer: motor mixer\r\n\r\nmmix reset\r\n\r\nmmix 0  1.000 -1.000  1.000 -1.000\r\n'
    + '\r\n# Mixer: servo mixer\r\nsmix reset\r\n\r\nsmix 0 1 0 100 0 -1\r\n\r\n# ';

function fakeCli(answers) {
    const sent = [];
    return {
        sent,
        enterCli: async () => {},
        sendCommand: async line => {
            sent.push(line);
            const answer = answers[line];
            return typeof answer === 'function' ? answer() : (answer ?? `# ${line}\r\n# `);
        },
    };
}

test('control dump keeps only set lines of the expected source slot', () => {
    assert.deepEqual(extractProfileCopyLines(CONTROL_DUMP, 'control_profile', 0),
        ['set mc_p_pitch = 44', 'set mc_i_pitch = 75']);
    assert.throws(() => extractProfileCopyLines(CONTROL_DUMP, 'control_profile', 1), /control_profile 2/);
});

test('mixer dump replays motor and servo rules including their resets', () => {
    assert.deepEqual(extractProfileCopyLines(MIXER_DUMP, 'mixer_profile', 1), [
        'set motor_direction_inverted = OFF',
        'mmix reset',
        'mmix 0  1.000 -1.000  1.000 -1.000',
        'smix reset',
        'smix 0 1 0 100 0 -1',
    ]);
});

test('a mixer dump cut at a section header is rejected', () => {
    const cut = MIXER_DUMP.slice(0, MIXER_DUMP.indexOf('# Mixer: servo mixer') + 2);
    assert.throws(() => extractProfileCopyLines(cut, 'mixer_profile', 1), /incomplete/);
});

test('CLI errors are found, the echoed command is not one', () => {
    assert.deepEqual(findCliErrors('set foo = 1\r\n### ERROR: INVALID NAME ###\r\n# ', 'set foo = 1'),
        ['### ERROR: INVALID NAME ###']);
    assert.deepEqual(findCliErrors('# set mc_p_pitch = 44\r\nmc_p_pitch set to 44\r\n# ', 'set mc_p_pitch = 44'), []);
});

test('copy selects the target, replays the dump and selects the source again', async () => {
    const cli = fakeCli({
        'dump control_profile': CONTROL_DUMP,
        'control_profile 2': 'control_profile 2\r\ncontrol_profile 2\r\n\r\n# ',
        'control_profile 1': 'control_profile 1\r\ncontrol_profile 1\r\n\r\n# ',
    });
    assert.equal(await copyProfileViaCli(cli, 0, 0, 1, 0), 2);
    assert.deepEqual(cli.sent, ['dump control_profile', 'control_profile 2', 'set mc_p_pitch = 44',
        'set mc_i_pitch = 75', 'control_profile 1']);
});

test('a truncated dump is read again before anything is written', async () => {
    let reads = 0;
    const cli = fakeCli({
        'dump control_profile': () => (++reads === 1 ? '# dump control_profile\r\n\r\n# ' : CONTROL_DUMP),
        'control_profile 2': 'control_profile 2\r\ncontrol_profile 2\r\n# ',
        'control_profile 1': 'control_profile 1\r\ncontrol_profile 1\r\n# ',
    });
    await copyProfileViaCli(cli, 0, 0, 1, 0);
    assert.deepEqual(cli.sent.slice(0, 3), ['dump control_profile', 'dump control_profile', 'control_profile 2']);
});

test('a rejected line stops the copy before the source is selected again', async () => {
    const cli = fakeCli({
        'dump battery_profile': CONTROL_DUMP.replaceAll('control_profile', 'battery_profile'),
        'battery_profile 3': 'battery_profile 3\r\nbattery_profile 3\r\n# ',
        'set mc_p_pitch = 44': '### ERROR: INVALID NAME ###\r\n# ',
    });
    await assert.rejects(copyProfileViaCli(cli, 1, 0, 2, 0), /INVALID NAME/);
    assert.equal(cli.sent.includes('battery_profile 1'), false);
});

test('a slot the FC does not confirm (echo only) stops the copy before any line is replayed', async () => {
    const cli = fakeCli({ 'dump control_profile': CONTROL_DUMP, 'control_profile 4': 'control_profile 4\r\n\r\n# ' });
    await assert.rejects(copyProfileViaCli(cli, 0, 0, 3, 0), /not confirmed/);
    assert.deepEqual(cli.sent, ['dump control_profile', 'control_profile 4']);
});

test('progress tells which slot the FC boots on after a failed copy', async () => {
    const answers = {
        'dump control_profile': CONTROL_DUMP,
        'control_profile 2': 'control_profile 2\r\ncontrol_profile 2\r\n# ',
        'control_profile 1': 'control_profile 1\r\ncontrol_profile 1\r\n# ',
    };
    const dumpFails = {};
    await assert.rejects(copyProfileViaCli(fakeCli({ ...answers, 'dump control_profile': '# ' }), 0, 0, 1, 0, dumpFails));
    assert.equal(profileCopyResultKey(false, dumpFails), 'copyProfileFailed');

    const replayFails = {};
    await assert.rejects(copyProfileViaCli(fakeCli({ ...answers, 'set mc_i_pitch = 75': '### ERROR: x ###\r\n# ' }), 0, 0, 1, 0, replayFails));
    assert.equal(profileCopyResultKey(false, replayFails), 'copyProfileFailedSlotChanged');

    const sourceUnconfirmed = {};
    await assert.rejects(copyProfileViaCli(fakeCli({ ...answers, 'control_profile 1': '\r\n# ' }), 0, 0, 1, 0, sourceUnconfirmed));
    assert.equal(profileCopyResultKey(false, sourceUnconfirmed), 'copyProfileUnconfirmed');

    const done = {};
    await copyProfileViaCli(fakeCli(answers), 0, 0, 1, 0, done);
    assert.equal(done.destinationActive, false);
    assert.equal(profileCopyResultKey(true, done), 'copyProfileDone');
});

test('unknown type or identical slots never enter the CLI', async () => {
    const cli = fakeCli({});
    await assert.rejects(copyProfileViaCli(cli, 3, 0, 1, 0));
    await assert.rejects(copyProfileViaCli(cli, 0, 1, 1, 0));
    assert.deepEqual(cli.sent, []);
});

test('a disconnect after the CLI was requested sends exit before the port closes', async () => {
    const order = [];
    const progress = {};
    const cli = {
        enterCli: () => new Promise(() => {}),
        sendCommand: async () => '',
        exitCli: async () => { order.push('exit'); return true; },
    };
    // The FC has not answered "#" yet: the CLI was requested but not confirmed
    copyProfileViaCli(cli, 0, 0, 1, 0, progress);
    assert.equal(progress.cliRequested, true);
    assert.equal(progress.cliEntered, undefined);

    const exited = await leaveProfileCopyCli(cli, progress).then(result => { order.push('close'); return result; });
    assert.equal(exited, true);
    assert.deepEqual(order, ['exit', 'close']);
    assert.equal(profileCopyInterruptedKey(progress, exited), 'copyProfileInterrupted');
});

test('no exit before the CLI was requested', async () => {
    let calls = 0;
    const exited = await leaveProfileCopyCli({ exitCli: async () => { calls++; return true; } }, {});
    assert.equal(exited, false);
    assert.equal(calls, 0);
    assert.equal(profileCopyInterruptedKey({}, exited), 'copyProfileInterrupted');
});

test('a failed or hanging exit write is reported as a possible CLI mode', async () => {
    const progress = { cliRequested: true };
    assert.equal(await leaveProfileCopyCli({ exitCli: async () => false }, progress), false);
    assert.equal(await leaveProfileCopyCli({ exitCli: () => new Promise(() => {}) }, progress, 20), false);
    assert.equal(profileCopyInterruptedKey(progress, false), 'copyProfileInterruptedCli');
});
