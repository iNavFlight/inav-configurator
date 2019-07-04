'use strict';
/*global chrome*/
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
        button.text(chrome.i18n.getMessage("cliCopySuccessful"));
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

    function nwCopy(text) {
        try {
            let clipboard = require('nw.gui').Clipboard.get();
            clipboard.set(text, "text");
            onCopySuccessful();
        } catch (ex) {
            onCopyFailed(ex);
        }
    }

    function webCopy(text) {
        navigator.clipboard.writeText(text)
            .then(onCopySuccessful, onCopyFailed);
    }

    let copyFunc;
    try {
        let nwGui = require('nw.gui');
        copyFunc = nwCopy;
    } catch (e) {
        copyFunc = webCopy;
    }
    copyFunc(text);
}

function sendLinesWithDelay(outputArray) {
    return (delay, line, index) => {
        return new Promise((resolve) => {
            helper.timeout.add('CLI_send_slowly', () => {
                var processingDelay = self.lineDelayMs;
                if (line.toLowerCase().startsWith('profile')) {
                    processingDelay = self.profileSwitchDelayMs;
                }
                const isLastCommand = outputArray.length === index + 1;
                if (isLastCommand && self.cliBuffer) {
                    line = getCliCommand(line, self.cliBuffer);
                }
                TABS.cli.sendLine(line, () => {
                    resolve(processingDelay);
                });
            }, delay);
        });
    };
}

TABS.cli.initialize = function (callback) {
    var self = this;

    if (GUI.active_tab != 'cli') {
        GUI.active_tab = 'cli';
        googleAnalytics.sendAppView('CLI');
    }

    // Flush MSP queue as well as all MSP registered callbacks
    helper.mspQueue.flush();
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
        Promise.reduce(outputArray, sendLinesWithDelay(outputArray), 0);
    }

    $('#content').load("./tabs/cli.html", function () {
        // translate to user-selected language
        localize();

        CONFIGURATOR.cliActive = true;

        var textarea = $('.tab-cli textarea[name="commands"]');

        $('.tab-cli .save').click(function() {
            var prefix = 'cli';
            var suffix = 'txt';

            var filename = generateFilename(prefix, suffix);

            var accepts = [{
                description: suffix.toUpperCase() + ' files', extensions: [suffix],
            }];

            chrome.fileSystem.chooseEntry({type: 'saveFile', suggestedName: filename, accepts: accepts}, function(entry) {
                if (chrome.runtime.lastError) {
                    if (chrome.runtime.lastError.message === 'User cancelled') {
                        GUI.log(chrome.i18n.getMessage('cliSaveToFileAborted'));
                    } else {
                        GUI.log(chrome.i18n.getMessage('cliSaveToFileFailed'));
                        console.error(chrome.runtime.lastError.message);
                    }
                    return;
                }

                if (!entry) {
                    GUI.log(chrome.i18n.getMessage('cliSaveToFileAborted'));
                    return;
                }

                entry.createWriter(function (writer) {
                    writer.onerror = function (){
                        GUI.log(chrome.i18n.getMessage('cliSaveToFileFailed'));
                    };

                    writer.onwriteend = function () {
                        if (self.outputHistory.length > 0 && writer.length === 0) {
                            writer.write(new Blob([self.outputHistory], {type: 'text/plain'}));
                        } else {
                            GUI.log(chrome.i18n.getMessage('cliSaveToFileCompleted'));
                        }
                    };

                    writer.truncate(0);
                }, function (){
                    GUI.log(chrome.i18n.getMessage('cliSaveToFileFailed'));
                    console.error('Failed to get file writer');
                });
            });
        });

        $('.tab-cli .clear').click(function() {
            self.outputHistory = "";
            $('.tab-cli .window .wrapper').empty();
        });

        if (clipboardCopySupport) {
            $('.tab-cli .copy').click(function() {
                copyToClipboard(self.outputHistory);
            });
        } else {
            $('.tab-cli .copy').hide();
        }

        $('.tab-cli .load').click(function() {
            var accepts = [
                {
                    description: 'Config files', extensions: ["txt", "config"],
                },
                {
                    description: 'All files',
                },
            ];

            chrome.fileSystem.chooseEntry({type: 'openFile', accepts: accepts}, function(entry) {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    return;
                }

                if (!entry) {
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
                            title: chrome.i18n.getMessage("cliConfirmSnippetDialogTitle"),
                            content: $('#snippetpreviewcontent'),
                            onCreated: () => $("#snippetpreviewcontent a.confirm").click(() => executeSnippet()),
                        });
                    }
                    previewArea.val(result);
                    self.GUI.snippetPreviewWindow.open();
                }

                entry.file((file) => {
                    let reader = new FileReader();
                    reader.onload =
                        () => previewCommands(reader.result);
                    reader.onerror = () => console.error(reader.error);
                    reader.readAsText(file);
                });
            });
        });

        // Tab key detection must be on keydown,
        // `keypress`/`keyup` happens too late, as `textarea` will have already lost focus.
        textarea.keydown(function (event) {
            const tabKeyCode = 9;
            if (event.which == tabKeyCode) {
                // prevent default tabbing behaviour
                event.preventDefault();
                const outString = textarea.val();
                const lastCommand = outString.split("\n").pop();
                const command = getCliCommand(lastCommand, self.cliBuffer);
                if (command) {
                    self.sendAutoComplete(command);
                    textarea.val('');
                }
            }
        });

        textarea.keypress(function (event) {
            const enterKeyCode = 13;
            if (event.which == enterKeyCode) {
                event.preventDefault(); // prevent the adding of new line

                var out_string = textarea.val();
                self.history.add(out_string.trim());

                var outputArray = out_string.split("\n");
                Promise.reduce(outputArray, sendLinesWithDelay(outputArray), 0);

                textarea.val('');
            }
        });

        textarea.keyup(function (event) {
            var keyUp = {38: true},
                keyDown = {40: true};

            if (event.keyCode in keyUp) {
                textarea.val(self.history.prev());
            }

            if (event.keyCode in keyDown) {
                textarea.val(self.history.next());
            }
        });

        // give input element user focus
        textarea.focus();

        helper.timeout.add('enter_cli', function enter_cli() {
            // Enter CLI mode
            var bufferOut = new ArrayBuffer(1);
            var bufView = new Uint8Array(bufferOut);

            bufView[0] = 0x23; // #

            serial.send(bufferOut);
        }, 250);

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

        this.outputHistory += currentChar;

        if (this.cliBuffer == 'Rebooting') {
            CONFIGURATOR.cliActive = false;
            CONFIGURATOR.cliValid = false;
            GUI.log(chrome.i18n.getMessage('cliReboot'));
            GUI.log(chrome.i18n.getMessage('deviceRebooting'));
            GUI.handleReconnect();
        }

    }

    if (!CONFIGURATOR.cliValid && validateText.indexOf('CLI') !== -1) {
        GUI.log(chrome.i18n.getMessage('cliEnter'));
        CONFIGURATOR.cliValid = true;
        validateText = "";
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

    serial.send(bufferOut, callback);
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
        helper.timeout.add('waiting_for_bootup', function waiting_for_bootup() {
            if (callback) callback();
        }, 1000); // if we dont allow enough time to reboot, CRC of "first" command sent will fail, keep an eye for this one
        CONFIGURATOR.cliActive = false;
    });
};
