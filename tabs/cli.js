'use strict';

import MSP from './../js/msp';
import mspQueue from './../js/serial_queue';
import GUI from './../js/gui';
import CONFIGURATOR from './../js/data_storage';
import timeout from './../js/timeouts';
import i18n from './../js/localization';
import { globalSettings } from './../js/globalSettings';
import CliAutoComplete from './../js/CliAutoComplete';
import { ConnectionType } from './../js/connection/connection';
import jBox from 'jbox';
import mspDeduplicationQueue from './../js/msp/mspDeduplicationQueue';
import FC from './../js/fc';
import { generateFilename } from './../js/helpers';
import dialog from '../js/dialog';

const cliTab = {
    outputHistory: "",
    cliBuffer: "",
    rawReceiveBuffer: new Uint8Array(0),
    promptCallback: null,
    promptTimeoutId: null,
    GUI: {
        snippetPreviewWindow: null,
    },
};

cliTab.nextTab = null;

function xorChecksum(bytes) {
    return bytes.reduce((checksum, byte) => checksum ^ byte, 0);
}

function crc8DvbS2(bytes) {
    let crc = 0;
    for (const byte of bytes) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) {
            crc = (crc & 0x80) ? ((crc << 1) ^ 0xd5) & 0xff : (crc << 1) & 0xff;
        }
    }
    return crc;
}

function appendBytes(left, right) {
    const combined = new Uint8Array(left.length + right.length);
    combined.set(left);
    combined.set(right, left.length);
    return combined;
}

/**
 * CLI mode is entered while an MSP status request can still be in flight.
 * Discard complete, checksum-valid MSP frames so their binary bytes cannot be
 * treated as CLI input. Partial frames are held until the rest arrives.
 */
function removeMspFrames(data) {
    const input = appendBytes(cliTab.rawReceiveBuffer, data);
    const output = [];
    let offset = 0;

    while (offset < input.length) {
        if (input[offset] !== 0x24) { // '$'
            output.push(input[offset++]);
            continue;
        }

        if (offset + 3 > input.length) {
            break;
        }

        const isV1 = input[offset + 1] === 0x4d; // 'M'
        const isV2 = input[offset + 1] === 0x58; // 'X'
        const direction = input[offset + 2];
        if ((!isV1 && !isV2) || ![0x3c, 0x3e, 0x21].includes(direction)) {
            output.push(input[offset++]);
            continue;
        }

        let frameLength;
        let checksumValid;
        if (isV1) {
            if (offset + 6 > input.length) {
                break;
            }
            const payloadLength = input[offset + 3];
            if (payloadLength === 0xff) {
                if (offset + 8 > input.length) {
                    break;
                }
                frameLength = 8 + input[offset + 5] + (input[offset + 6] << 8);
            } else {
                frameLength = 6 + payloadLength;
            }
            if (offset + frameLength > input.length) {
                break;
            }
            checksumValid = xorChecksum(input.slice(offset + 3, offset + frameLength - 1)) === input[offset + frameLength - 1];
        } else {
            if (offset + 9 > input.length) {
                break;
            }
            frameLength = 9 + input[offset + 6] + (input[offset + 7] << 8);
            if (offset + frameLength > input.length) {
                break;
            }
            checksumValid = crc8DvbS2(input.slice(offset + 3, offset + frameLength - 1)) === input[offset + frameLength - 1];
        }

        if (checksumValid) {
            offset += frameLength;
        } else {
            output.push(input[offset++]);
        }
    }

    cliTab.rawReceiveBuffer = input.slice(offset);
    return new Uint8Array(output);
}

function removePromptHash(promptText) {
    return promptText.replace(/^# /, '');
}

function cliBufferCharsToDelete(command, buffer) {
    var commonChars = 0;
    for (var i = 0;i < buffer.length;i++) {
        if (command[i] === buffer[i]) {
            commonChars++;
        } else {
            break;
        }
    }

    return buffer.length - commonChars;
}

function commandWithBackSpaces(command, buffer, noOfCharsToDelete) {
    const backspace = String.fromCharCode(127);
    return backspace.repeat(noOfCharsToDelete) + command.substring(buffer.length - noOfCharsToDelete, command.length);
}

function getCliCommand(command, cliBuffer) {
    const buffer = removePromptHash(cliBuffer);
    const bufferRegex = new RegExp('^' + buffer, 'g');
    if (command.match(bufferRegex)) {
        return command.replace(bufferRegex, '');
    }

    const noOfCharsToDelete = cliBufferCharsToDelete(command, buffer);

    return commandWithBackSpaces(command, buffer, noOfCharsToDelete);
}

function copyToClipboard(text) {
    function onCopySuccessful() {
        const button = $('.tab-cli .copy');
        const origText = button.text();
        const origWidth = button.css("width");
        button.text(i18n.getMessage("cliCopySuccessful"));
        button.css({
            width: origWidth,
            textAlign: "center",
        });
        setTimeout(() => {
            button.text(origText);
            button.css({
                width: "",
                textAlign: "",
            });
        }, 1500);
    }

    function onCopyFailed(ex) {
        console.warn(ex);
    }

    navigator.clipboard.writeText(text)
        .then(onCopySuccessful, onCopyFailed);
}

cliTab.initialize = function (callback) {
    var self = this;
    self.nextTab = null;

    if (GUI.active_tab !== this) {
        GUI.active_tab = this;
    }

    // Flush MSP queue as well as all MSP registered callbacks
    mspQueue.flush();
    mspDeduplicationQueue.flush();
    MSP.callbacks_cleanup();

    // Any MSP request sent while the FC is in CLI mode is echoed back as "typed"
    // characters, corrupting the prompt and the auto-complete cache builder.
    // Lock the queue so pollers/retries cannot transmit until the tab is left.
    mspQueue.lock();

    self.outputHistory = "";
    self.cliBuffer = "";
    self.rawReceiveBuffer = new Uint8Array(0);

    const clipboardCopySupport = !!(navigator.clipboard?.writeText) || document.queryCommandSupported?.('copy');


    function executeCommands(out_string) {
        self.history.add(out_string.trim());

        const lines = out_string.split("\n").filter(l => l.length > 0);
        if (lines.length === 0) return Promise.resolve();

        return new Promise((resolve) => {
            let nextToSend = 0;
            let promptsReceived = 0;
            let promptGeneration = 0;

            function sendOne() {
                const line = lines[nextToSend];
                const isLast = nextToSend === lines.length - 1;
                const cmd = isLast ? getCliCommand(line, cliTab.cliBuffer) : line;
                nextToSend++;
                cliTab.sendLine(cmd);
            }

            function armCallback() {
                clearTimeout(cliTab.promptTimeoutId);
                const myGen = ++promptGeneration;
                cliTab.promptTimeoutId = setTimeout(() => {
                    if (myGen !== promptGeneration) return; // real prompt already fired
                    cliTab.promptCallback = null;
                    onPrompt();
                }, 5000);
                cliTab.promptCallback = onPrompt;
            }

            function onPrompt() {
                promptsReceived++;
                if (nextToSend < lines.length) sendOne();
                if (promptsReceived === lines.length) {
                    resolve();
                } else {
                    armCallback();
                }
            }

            sendOne();
            if (lines.length > 1) sendOne();
            armCallback();
        });
    }
    import('./cli.html?raw').then(({default: html}) => GUI.load(html, function () {
        // translate to user-selected language
       i18n.localize();

        $('.cliDocsBtn').attr('href', globalSettings.docsTreeLocation + 'Settings.md');

        CONFIGURATOR.cliActive = true;

        var textarea = $('.tab-cli textarea[name="commands"]');
        CliAutoComplete.initialize(textarea, self.sendLine.bind(self), writeToOutput);
        $(CliAutoComplete).on('build:start', function() {
            textarea
                .val('')
                .attr('placeholder', i18n.getMessage('cliInputPlaceholderBuilding'))
                .prop('disabled', true);
        });
        $(CliAutoComplete).on('build:stop', function() {
            textarea
                .attr('placeholder', i18n.getMessage('cliInputPlaceholder'))
                .prop('disabled', false)
                .focus();
        });

        $('.tab-cli .save').on('click', function () {
            var prefix = 'cli';
            var suffix = 'txt';
            var filename = generateFilename(FC.CONFIG, prefix, suffix);
            var options = {
                defaultPath: filename,
                filters: [
                    { name: suffix.toUpperCase(), extensions: [suffix] },
                    { name: prefix.toUpperCase(), extensions: [prefix] }
                ],
            };
            dialog.showSaveDialog(options).then(result => {
                if (result.canceled) {
                    GUI.log(i18n.getMessage('cliSaveToFileAborted'));
                    return;
                }

                window.electronAPI.writeFile(result.filePath, self.outputHistory).then(err => {
                    if (err) {
                        GUI.log(i18n.getMessage('ErrorWritingFile'));
                        return console.error(err);
                    }    
                });
                GUI.log(i18n.getMessage('FileSaved'));

            }).catch (err => {
                console.log(err);
            });
        });

        $('.tab-cli .exit').on('click', function () {
            self.send(getCliCommand('exit\n', cliTab.cliBuffer));
        });

        $('.tab-cli .savecmd').on('click', function () {
            self.send(getCliCommand('save\n', cliTab.cliBuffer));
        });

        $('.tab-cli .msc').on('click', function () {
            self.send(getCliCommand('msc\n', cliTab.cliBuffer));
        });

        $('.tab-cli .diffall').on('click', function () {
            self.outputHistory = "";
            $('.tab-cli .window .wrapper').empty();
            self.send(getCliCommand('diff all\n', cliTab.cliBuffer));
        });

        $('.tab-cli .clear').on('click', function () {
            self.outputHistory = "";
            $('.tab-cli .window .wrapper').empty();
        });

        if (clipboardCopySupport) {
            $('.tab-cli .copy').on('click', function () {
                copyToClipboard(self.outputHistory);
            });
        } else {
            $('.tab-cli .copy').hide();
        }

        $('.tab-cli .load').on('click', function () {
            var options = {
                filters: [
                    { name: 'CLI/TXT', extensions: ['cli', 'txt'] },
                    { name: 'ALL', extensions: ['*'] }
                ],
            };
            dialog.showOpenDialog(options).then( result => {
                if (result.canceled) {
                    console.log('No file selected');
                    return;
                }

                let previewArea = $("#snippetpreviewcontent textarea#preview");

                function executeSnippet() {
                    const commands = previewArea.val();
                    executeCommands(commands);
                    self.GUI.snippetPreviewWindow.close();
                }

                function previewCommands(result) {
                    if (!self.GUI.snippetPreviewWindow) {
                        self.GUI.snippetPreviewWindow = new jBox("Modal", {
                            id: "snippetPreviewWindow",
                            width: 'auto',
                            height: 'auto',
                            closeButton: 'title',
                            animation: false,
                            isolateScroll: false,
                            title: i18n.getMessage("cliConfirmSnippetDialogTitle"),
                            content: $('#snippetpreviewcontent'),
                            onCreated: () => $("#snippetpreviewcontent a.confirm").on('click', executeSnippet),
                        });
                    }
                    previewArea.val(result);
                    self.GUI.snippetPreviewWindow.open();
                }

                if (result.filePaths.length == 1) {
                    window.electronAPI.readFile(result.filePaths[0]).then(response => {
                        if (response.error) {
                            GUI.log(i18n.getMessage('ErrorReadingFile'));
                            console.error(response.error);
                            return;                        }

                        previewCommands(response.data);
                    });
                }
            }).catch (err => {
                console.log(err);
            });
        });

        // Tab key detection must be on keydown,
        // `keypress`/`keyup` happens too late, as `textarea` will have already lost focus.
        textarea.on('keydown', function (event) {
            const tabKeyCode = 9;
            if (event.which == tabKeyCode) {
                // prevent default tabbing behaviour
                event.preventDefault();
                if (!CliAutoComplete.isEnabled()) {
                    const outString = textarea.val();
                    const lastCommand = outString.split("\n").pop();
                    const command = getCliCommand(lastCommand, self.cliBuffer);
                    if (command) {
                        self.sendAutoComplete(command);
                        textarea.val('');
                    }
                }
                else if (!CliAutoComplete.isOpen() && !CliAutoComplete.isBuilding()) {
                    // force show autocomplete on Tab
                    CliAutoComplete.openLater(true);
                }
            }
        });

        textarea.on('keypress', function (event) {
            const enterKeyCode = 13;
            if (event.which == enterKeyCode) {
                event.preventDefault(); // prevent the adding of new line

                if (CliAutoComplete.isBuilding()) {
                    return; // silently ignore commands if autocomplete is still building
                }

                var out_string = textarea.val();
                self.history.add(out_string.trim());

                if (out_string.trim().toLowerCase() == "cls" || out_string.trim().toLowerCase() == "clear") {
                    self.outputHistory = "";
                    $('.tab-cli .window .wrapper').empty();
                } else {
                    executeCommands(out_string);
                }

                textarea.val('');
            }
        });

        textarea.on('keyup', function (event) {
            var keyUp = {38: true},
                keyDown = {40: true};

                if (CliAutoComplete.isOpen()) {
                    return; // disable history keys if autocomplete is open
                }

            if (event.keyCode in keyUp) {
                textarea.val(self.history.prev());
            }

            if (event.keyCode in keyDown) {
                textarea.val(self.history.next());
            }
        });

        // give input element user focus
        textarea.focus();

        timeout.add('enter_cli', function enter_cli() {
            // Enter CLI mode
            var bufferOut = new ArrayBuffer(1);
            var bufView = new Uint8Array(bufferOut);

            bufView[0] = 0x23; // #

            CONFIGURATOR.connection.send(bufferOut);
        }, 250);

        if (CONFIGURATOR.connection.type == ConnectionType.UDP) {
            CONFIGURATOR.connection.isCli = true;
        }

        if (CONFIGURATOR.connection.type == ConnectionType.BLE) {
            let delay = CONFIGURATOR.connection.deviceDescription.delay;
            if (delay > 0) {
                timeout.add('cli_delay', () =>  {
                    self.send(getCliCommand("cli_delay " +  delay + '\n', cliTab.cliBuffer));
                    self.send(getCliCommand('# ' + i18n.getMessage('connectionBleCliEnter') + '\n', cliTab.cliBuffer));
                }, 400);
            }
        }

        GUI.content_ready(callback);
    }));
};

cliTab.history = {
    history: [],
    index:  0
};

cliTab.history.add = function (str) {
    this.history.push(str);
    this.index = this.history.length;
};

cliTab.history.prev = function () {
    if (this.index > 0) this.index -= 1;
    return this.history[this.index];
};

cliTab.history.next = function () {
    if (this.index < this.history.length) this.index += 1;
    return this.history[this.index - 1];
};

const backspaceCode = 8;
const lineFeedCode = 10;
const carriageReturnCode = 13;

function writeToOutput(text) {
    $('.tab-cli .window .wrapper').append(text);
    $('.tab-cli .window').scrollTop($('.tab-cli .window .wrapper').height());
}

function writeLineToOutput(text) {
    if (CliAutoComplete.isBuilding()) {
        CliAutoComplete.builderParseLine(text);
        return; // suppress output if in building state
    }

    if (text.startsWith("### ERROR: ")) {
        writeToOutput('<span class="error_message">' + text + '</span><br>');
    } else {
        writeToOutput(text + "<br>");
    }
}

function setPrompt(text) {
    $('.tab-cli textarea').val(text);
}

cliTab.read = function (readInfo) {
    /*  Some info about handling line feeds and carriage return

        line feed = LF = \n = 0x0A = 10
        carriage return = CR = \r = 0x0D = 13

        MAC only understands CR
        Linux and Unix only understand LF
        Windows understands (both) CRLF
        Chrome OS currently unknown
    */
    var data = removeMspFrames(new Uint8Array(readInfo.data)),
        validateText = "",
        sequenceCharsToSkip = 0;

    for (var i = 0; i < data.length; i++) {
        const currentChar = String.fromCharCode(data[i]);

        if (!CONFIGURATOR.cliValid) {
            // try to catch part of valid CLI enter message
            validateText += currentChar;
            writeToOutput(currentChar);
            continue;
        }

        const escapeSequenceCode = 27;
        const escapeSequenceCharLength = 3;
        if (data[i] == escapeSequenceCode && !sequenceCharsToSkip) { // ESC + other
            sequenceCharsToSkip = escapeSequenceCharLength;
        }

        if (sequenceCharsToSkip) {
            sequenceCharsToSkip--;
            continue;
        }

        switch (data[i]) {
            case lineFeedCode:
                if (GUI.operating_system === "Windows") {
                    writeLineToOutput(this.cliBuffer);
                    this.cliBuffer = "";
                }
                break;
            case carriageReturnCode:
                if (GUI.operating_system !== "Windows") {
                    writeLineToOutput(this.cliBuffer);
                    this.cliBuffer = "";
                }
                break;
            case 60:
                this.cliBuffer += '&lt';
                break;
            case 62:
                this.cliBuffer += '&gt';
                break;
            case backspaceCode:
                this.cliBuffer = this.cliBuffer.slice(0, -1);
                break;

            default:
                this.cliBuffer += currentChar;
        }

        if (!CliAutoComplete.isBuilding()) {
            // do not include the building dialog into the history
            this.outputHistory += currentChar;
        }

        if (this.cliBuffer == 'Rebooting') {
            CONFIGURATOR.cliActive = false;
            CONFIGURATOR.cliValid = false;
            GUI.log(i18n.getMessage('cliReboot'));
            GUI.log(i18n.getMessage('deviceRebooting'));
            GUI.handleReconnect(cliTab.nextTab || false);
        }

    }

    if (!CONFIGURATOR.cliValid && validateText.indexOf('CLI') !== -1) {
        GUI.log(i18n.getMessage('cliEnter'));
        CONFIGURATOR.cliValid = true;
        this.rawReceiveBuffer = new Uint8Array(0);

        if (CliAutoComplete.isEnabled() && !CliAutoComplete.isBuilding()) {
            // start building autoComplete
            CliAutoComplete.builderStart();
        }
    }

    // fallback to native autocomplete
    if (!CliAutoComplete.isEnabled()) {
        setPrompt(removePromptHash(this.cliBuffer));
    }

    setPrompt(removePromptHash(this.cliBuffer));

    if (cliTab.promptCallback && this.cliBuffer.endsWith('# ')) {
        const cb = cliTab.promptCallback;
        cliTab.promptCallback = null;
        clearTimeout(cliTab.promptTimeoutId);
        cb();
    }
};

cliTab.sendLine = function (line, callback) {
    this.send(line + '\n', callback);
};

cliTab.sendAutoComplete = function (line, callback) {
    this.send(line + '\t', callback);
};

cliTab.send = function (line, callback) {
    var bufferOut = new ArrayBuffer(line.length);
    var bufView = new Uint8Array(bufferOut);

    for (var c_key = 0; c_key < line.length; c_key++) {
        bufView[c_key] = line.charCodeAt(c_key);
    }

    CONFIGURATOR.connection.send(bufferOut, callback);
};

cliTab.exit = function(nextTab) {
    this.nextTab = nextTab;
    this.send(getCliCommand('exit\r', this.cliBuffer));
};

cliTab.cleanup = function (callback) {
    clearTimeout(cliTab.promptTimeoutId);
    cliTab.promptCallback = null;

    // Re-allow MSP traffic regardless of how the tab is being left.
    mspQueue.unlock();

    if (!(CONFIGURATOR.connectionValid && CONFIGURATOR.cliValid && CONFIGURATOR.cliActive)) {
        if (callback) callback();
        return;
    }

    CONFIGURATOR.cliActive = false;
    CONFIGURATOR.cliValid = false;
    CliAutoComplete.cleanup();
    $(CliAutoComplete).off();

    // The UI promises that disconnecting from the CLI sends "exit" so the FC
    // returns to MSP mode. Without this the FC stays in CLI mode and the next
    // connection's MSP requests are echoed back, never answered. Flags are
    // cleared first so the echoed output is not re-parsed as CLI data.
    this.send(getCliCommand('exit\r', this.cliBuffer));
    this.cliBuffer = "";

    if (callback) {
        // Let the in-flight "exit" bytes flush before the caller closes the port.
        setTimeout(callback, 200);
    }
};

export default cliTab;
