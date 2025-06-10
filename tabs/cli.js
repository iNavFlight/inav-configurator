'use strict';

const path = require('path');
const fs = require('fs');
const { dialog } = require("@electron/remote");

const MSP = require('./../js/msp');
const mspQueue =  require('./../js/serial_queue');
const { GUI, TABS } = require('./../js/gui');
const CONFIGURATOR = require('./../js/data_storage');
var timeout = require('./../js/timeouts');
const i18n = require('./../js/localization');
const { globalSettings } = require('./../js/globalSettings');
const CliAutoComplete = require('./../js/CliAutoComplete');
const { ConnectionType } = require('./../js/connection/connection');
const jBox = require('./../js/libraries/jBox/jBox.min');
const mspDeduplicationQueue = require('./../js/msp/mspDeduplicationQueue');
const FC = require('./../js/fc');
const { generateFilename } = require('./../js/helpers');

TABS.cli = {
    lineDelayMs: 50,
    profileSwitchDelayMs: 100,
    outputHistory: "",
    cliBuffer: "",
    GUI: {
        snippetPreviewWindow: null,
    },
};

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

TABS.cli.initialize = function (callback) {
    var self = this;

    if (GUI.active_tab != 'cli') {
        GUI.active_tab = 'cli';
    }

    // Flush MSP queue as well as all MSP registered callbacks
    mspQueue.flush();
    mspDeduplicationQueue.flush();
    MSP.callbacks_cleanup();

    self.outputHistory = "";
    self.cliBuffer = "";

    const clipboardCopySupport = (() => {
        let nwGui = null;
        try {
            nwGui = require('nw.gui');
        } catch (e) {}
        return !(nwGui == null && !navigator.clipboard)
        })();


    function executeCommands(out_string) {
        self.history.add(out_string.trim());

        var outputArray = out_string.split("\n");
        return outputArray.reduce((p, line, index) =>
            p.then((delay) =>
                new Promise((resolve) => {
                    timeout.add('CLI_send_slowly', () => {
                        let processingDelay = TABS.cli.lineDelayMs;
                        if (line.toLowerCase().includes('_profile')) {
                            processingDelay = TABS.cli.profileSwitchDelayMs;
                        }
                        const isLastCommand = outputArray.length === index + 1;
                        if (isLastCommand && TABS.cli.cliBuffer) {
                            line = getCliCommand(line, TABS.cli.cliBuffer);
                        }
                        TABS.cli.sendLine(line, () => {
                            resolve(processingDelay);
                        });
                    }, delay);
                })
            ), Promise.resolve(0),
        );
    }

    GUI.load(path.join(__dirname, "cli.html"), function () {
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

                fs.writeFile(result.filePath, self.outputHistory, (err) => {
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
            self.send(getCliCommand('exit\n', TABS.cli.cliBuffer));
        });

        $('.tab-cli .savecmd').on('click', function () {
            self.send(getCliCommand('save\n', TABS.cli.cliBuffer));
        });

        $('.tab-cli .msc').on('click', function () {
            self.send(getCliCommand('msc\n', TABS.cli.cliBuffer));
        });

        $('.tab-cli .diffall').on('click', function () {
            self.outputHistory = "";
            $('.tab-cli .window .wrapper').empty();
            self.send(getCliCommand('diff all\n', TABS.cli.cliBuffer));
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
                    fs.readFile(result.filePaths[0], (err, data) => {
                        if (err) {
                            GUI.log(i18n.getMessage('ErrorReadingFile'));
                            return console.error(err);
                        }

                        previewCommands(data);
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
                    self.send(getCliCommand("cli_delay " +  delay + '\n', TABS.cli.cliBuffer));
                    self.send(getCliCommand('# ' + i18n.getMessage('connectionBleCliEnter') + '\n', TABS.cli.cliBuffer));
                }, 400);
            }
        }

        GUI.content_ready(callback);
    });
};

TABS.cli.history = {
    history: [],
    index:  0
};

TABS.cli.history.add = function (str) {
    this.history.push(str);
    this.index = this.history.length;
};

TABS.cli.history.prev = function () {
    if (this.index > 0) this.index -= 1;
    return this.history[this.index];
};

TABS.cli.history.next = function () {
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

TABS.cli.read = function (readInfo) {
    /*  Some info about handling line feeds and carriage return

        line feed = LF = \n = 0x0A = 10
        carriage return = CR = \r = 0x0D = 13

        MAC only understands CR
        Linux and Unix only understand LF
        Windows understands (both) CRLF
        Chrome OS currently unknown
    */
    var data = new Uint8Array(readInfo.data),
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
            GUI.handleReconnect();
        }

    }

    if (!CONFIGURATOR.cliValid && validateText.indexOf('CLI') !== -1) {
        GUI.log(i18n.getMessage('cliEnter'));
        CONFIGURATOR.cliValid = true;

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
};

TABS.cli.sendLine = function (line, callback) {
    this.send(line + '\n', callback);
};

TABS.cli.sendAutoComplete = function (line, callback) {
    this.send(line + '\t', callback);
};

TABS.cli.send = function (line, callback) {
    var bufferOut = new ArrayBuffer(line.length);
    var bufView = new Uint8Array(bufferOut);

    for (var c_key = 0; c_key < line.length; c_key++) {
        bufView[c_key] = line.charCodeAt(c_key);
    }

    CONFIGURATOR.connection.send(bufferOut, callback);
};

TABS.cli.cleanup = function (callback) {
    if (!(CONFIGURATOR.connectionValid && CONFIGURATOR.cliValid && CONFIGURATOR.cliActive)) {
        if (callback) callback();
        return;
    }
    this.send(getCliCommand('exit\r', this.cliBuffer), function (writeInfo) {
        // we could handle this "nicely", but this will do for now
        // (another approach is however much more complicated):
        // we can setup an interval asking for data lets say every 200ms, when data arrives, callback will be triggered and tab switched
        // we could probably implement this someday
        timeout.add('waiting_for_bootup', function waiting_for_bootup() {
            if (callback) callback();
        }, 1000); // if we dont allow enough time to reboot, CRC of "first" command sent will fail, keep an eye for this one
        CONFIGURATOR.cliActive = false;

        CliAutoComplete.cleanup();
        $(CliAutoComplete).off();
    });
};
