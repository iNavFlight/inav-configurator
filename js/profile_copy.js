'use strict';

// Index = profile type used by the header copy buttons (0 control, 1 battery, 2 mixer)
const PROFILE_COPY_COMMANDS = ['control_profile', 'battery_profile', 'mixer_profile'];

const CLI_SETTLE_MS = 200;
const CLI_EXIT_TIMEOUT_MS = 1000;
const DUMP_ATTEMPTS = 3;
// Lines a complete "dump mixer_profile" always ends with, after its last "# " section header
const MIXER_DUMP_MARKERS = ['mmix reset', 'smix reset'];
const REPLAY_LINE = /^(set|mmix|smix) /;
const CLI_ERROR = /### ERROR|Invalid|Unknown command|^ERR/;
const ANSI_ESCAPE = /\x1B\[[0-9;]*[A-Za-z]/g;

function cliLines(output) {
    return output.replace(ANSI_ESCAPE, '').split(/\r?\n|\r/).map(line => line.trim());
}

/**
 * Picks the lines to replay from "dump <command>" output. Throws unless the dump belongs to the
 * expected source slot, so a garbled or truncated read never reaches the destination profile.
 */
export function extractProfileCopyLines(dumpOutput, command, fromIndex) {
    const lines = cliLines(dumpOutput);
    if (!lines.includes(`${command} ${fromIndex + 1}`)) {
        throw new Error(`dump did not report ${command} ${fromIndex + 1}`);
    }
    if (command === 'mixer_profile' && !MIXER_DUMP_MARKERS.every(marker => lines.includes(marker))) {
        throw new Error('dump mixer_profile is incomplete');
    }
    const replay = lines.filter(line => REPLAY_LINE.test(line));
    if (replay.length === 0) {
        throw new Error(`dump ${command} returned no settings`);
    }
    return replay;
}

export function findCliErrors(response, sentLine) {
    return cliLines(response).filter(line => line !== sentLine && CLI_ERROR.test(line));
}

async function sendChecked(cli, line) {
    const errors = findCliErrors(await cli.sendCommand(line), line);
    if (errors.length > 0) {
        throw new Error(`${line}: ${errors[0]}`);
    }
}

async function readProfileDump(cli, command, fromIndex, settleMs) {
    for (let attempt = 1; ; attempt++) {
        // Each "# " header can end a read chunk and look like the prompt, so validate and retry
        await new Promise(resolve => setTimeout(resolve, settleMs));
        try {
            return extractProfileCopyLines(await cli.sendCommand(`dump ${command}`), command, fromIndex);
        } catch (err) {
            if (attempt >= DUMP_ATTEMPTS) {
                throw err;
            }
        }
    }
}

async function selectProfile(cli, command, index) {
    const line = `${command} ${index + 1}`;
    // The CLI echoes the command; only a second copy of the line is the FC's confirmation
    if (cliLines(await cli.sendCommand(line)).filter(l => l === line).length < 2) {
        throw new Error(`${command} ${index + 1} was not confirmed`);
    }
}

/**
 * Copies one profile slot onto another through the CLI: dump the source, replay it on the
 * destination, select the source again. Needs no MSP support, so it works on firmware already
 * in the field. `cli` provides enterCli() and sendCommand(line) -> Promise<output>. The caller
 * keeps MSP traffic off the port and sends "save" afterwards. Each CLI profile selection writes
 * the EEPROM, so `progress` records how far the copy got: once `destinationActive` is set the FC
 * boots on the destination slot unless the source is selected again, and once `sourceRequested`
 * is set the copied values may already be stored.
 */
export async function copyProfileViaCli(cli, type, fromIndex, toIndex, settleMs = CLI_SETTLE_MS, progress = {}) {
    const command = PROFILE_COPY_COMMANDS[type];
    if (!command || fromIndex === toIndex) {
        throw new Error('invalid profile copy request');
    }
    // Set before waiting: the "#" alone already switches the FC to CLI mode
    progress.cliRequested = true;
    await cli.enterCli();
    progress.cliEntered = true;
    const lines = await readProfileDump(cli, command, fromIndex, settleMs);
    // Set before sending: an unconfirmed answer can still have switched the slot
    progress.destinationActive = true;
    await selectProfile(cli, command, toIndex);
    for (const line of lines) {
        await sendChecked(cli, line);
    }
    progress.sourceRequested = true;
    await selectProfile(cli, command, fromIndex);
    progress.destinationActive = false;
    return lines.length;
}

/**
 * Leaves the CLI of a copy cut off by a disconnect, before the port closes. The FC stays in CLI
 * mode until it reads "exit", and the next connection would get no MSP answer. `cli.exitCli()`
 * resolves to whether "exit" was written. Resolves to false when the CLI was never requested,
 * the write failed or it did not finish within `timeoutMs`.
 */
export async function leaveProfileCopyCli(cli, progress, timeoutMs = CLI_EXIT_TIMEOUT_MS) {
    if (!progress.cliRequested) {
        return false;
    }
    let timer;
    const timedOut = new Promise(resolve => {
        timer = setTimeout(() => resolve(false), timeoutMs);
    });
    try {
        return await Promise.race([cli.exitCli(), timedOut]);
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Picks the log message for a copy cut off by a disconnect: without a written "exit" the FC may
 * still be in CLI mode.
 */
export function profileCopyInterruptedKey(progress, exited) {
    return progress.cliRequested && !exited ? 'copyProfileInterruptedCli' : 'copyProfileInterrupted';
}

/**
 * Picks the log message for a finished copy attempt from the `progress` of copyProfileViaCli.
 */
export function profileCopyResultKey(copied, progress) {
    if (copied) {
        return 'copyProfileDone';
    }
    if (progress.sourceRequested) {
        return 'copyProfileUnconfirmed';
    }
    return progress.destinationActive ? 'copyProfileFailedSlotChanged' : 'copyProfileFailed';
}
