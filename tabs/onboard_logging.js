'use strict';

const { dialog } = require("@electron/remote");
const fs = require('fs');
const path = require('path');

const MSPCodes = require('./../js/msp/MSPCodes');
const MSP = require('./../js/msp');
const mspHelper = require("./../js/msp/MSPHelper");
const { GUI, TABS } = require('./../js/gui');
const FC = require('./../js/fc');
const CONFIGURATOR = require('./../js/data_storage');
const features = require('./../js/feature_framework');
const i18n = require('./../js/localization');
const BitHelper = require('./../js/bitHelper');

var sdcardTimer;

TABS.onboard_logging = {
};

TABS.onboard_logging.initialize = function (callback) {
    let
        saveCancelled, eraseCancelled;

    //Add future blackbox values here and in messages.json, the checkbox are drawn by js
    const blackBoxFields = [
        "BLACKBOX_FEATURE_NAV_ACC",
        "BLACKBOX_FEATURE_NAV_POS",
        "BLACKBOX_FEATURE_NAV_PID",
        "BLACKBOX_FEATURE_MAG",
        "BLACKBOX_FEATURE_ACC",
        "BLACKBOX_FEATURE_ATTITUDE",
        "BLACKBOX_FEATURE_RC_DATA",
        "BLACKBOX_FEATURE_RC_COMMAND",
        "BLACKBOX_FEATURE_MOTORS",
        "BLACKBOX_FEATURE_GYRO_RAW",
        "BLACKBOX_FEATURE_GYRO_PEAKS_ROLL",
        "BLACKBOX_FEATURE_GYRO_PEAKS_PITCH",
        "BLACKBOX_FEATURE_GYRO_PEAKS_YAW",
        "BLACKBOX_FEATURE_SERVOS",
    ];

    if (GUI.active_tab != 'onboard_logging') {
        GUI.active_tab = 'onboard_logging';
    }

    if (CONFIGURATOR.connectionValid) {
        MSP.send_message(MSPCodes.MSP_FEATURE, false, false, function() {
            MSP.send_message(MSPCodes.MSP_DATAFLASH_SUMMARY, false, false, function() {
                MSP.send_message(MSPCodes.MSP_SDCARD_SUMMARY, false, false, function() {
		            MSP.send_message(MSPCodes.MSP2_BLACKBOX_CONFIG, false, false, load_html);
                });
            });
        });
    }

    function gcd(a, b) {
        if (b == 0)
            return a;

        return gcd(b, a % b);
    }

    function save_to_eeprom() {
        MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, reboot);
    }

    function reboot() {
        GUI.log(i18n.getMessage('configurationEepromSaved'));

        GUI.tab_switch_cleanup(function() {
            MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, reinitialize);
        });
    }

    function reinitialize() {
        GUI.log(i18n.getMessage('deviceRebooting'));
        GUI.handleReconnect($('.tab_onboard_logging a'));
    }

    function load_html() {
        GUI.load(path.join(__dirname, "onboard_logging.html"), function() {
            // translate to user-selected language
           i18n.localize();;

            var
                dataflashPresent = FC.DATAFLASH.totalSize > 0,
                blackboxSupport = false;

            if ((FC.BLACKBOX.supported || FC.DATAFLASH.supported) && BitHelper.bit_check(FC.FEATURES, 19)) {
                blackboxSupport = true;
            }

            $(".tab-onboard_logging")
                .addClass("serial-supported")
                .toggleClass("dataflash-supported", FC.DATAFLASH.supported)
                .toggleClass("dataflash-present", dataflashPresent)
                .toggleClass("sdcard-supported", FC.SDCARD.supported)
                .toggleClass("blackbox-config-supported", FC.BLACKBOX.supported)
                .toggleClass("blackbox-supported", blackboxSupport)
                .toggleClass("blackbox-unsupported", !blackboxSupport);

            if (dataflashPresent) {
                // UI hooks
                $('.tab-onboard_logging a.erase-flash').on('click', ask_to_erase_flash);

                $('.tab-onboard_logging a.erase-flash-confirm').on('click', flash_erase);
                $('.tab-onboard_logging a.erase-flash-cancel').on('click', flash_erase_cancel);

                $('.tab-onboard_logging a.save-flash').on('click', flash_save_begin);
                $('.tab-onboard_logging a.save-flash-cancel').on('click', flash_save_cancel);
                $('.tab-onboard_logging a.save-flash-dismiss').on('click', dismiss_saving_dialog);
            }

            $('.save-blackbox-feature').on('click', function () {
                features.reset();
                features.fromUI($('.require-blackbox-unsupported'));
                features.execute(save_to_eeprom);
            });

            if (FC.BLACKBOX.supported) {
                $(".tab-onboard_logging a.save-settings").on('click', function () {
                    var rate = $(".blackboxRate select").val().split('/');

                    FC.BLACKBOX.blackboxRateNum = parseInt(rate[0], 10);
                    FC.BLACKBOX.blackboxRateDenom = parseInt(rate[1], 10);
                    FC.BLACKBOX.blackboxDevice = parseInt($(".blackboxDevice select").val(), 10);
                    FC.BLACKBOX.blackboxIncludeFlags = getIncludeFlags();
                    features.reset();
                    features.fromUI($('.require-blackbox-supported'));
                    features.execute(function () {
                        mspHelper.sendBlackboxConfiguration(save_to_eeprom);
                    });
                });
            }

            //Add checkboxes for each blackbox field
            const blackboxFieldsDiv = $("#blackBoxFlagsDiv");
            for (let i = 0; i < blackBoxFields.length; i++) {
                const FIELD_ID = blackBoxFields[i];
                const isEnabled = (FC.BLACKBOX.blackboxIncludeFlags & 1<<i) !==0;
                const input = $('<input type="checkbox" class="toggle feature" />')
                input.attr("id",FIELD_ID);
                input.attr("checked",isEnabled);

                const label = $("<label></label>");
                label.attr("for",FIELD_ID)

                const span = $('<span></span>');
                span.html(i18n.getMessage(FIELD_ID))
                label.append(span);

                const checkbox = $('<div class="checkbox"></div>')
                    .append([
                        input,label
                    ])
                blackboxFieldsDiv.append(checkbox);
            }

            populateLoggingRates();
            populateDevices();

            update_html();

            GUI.content_ready(callback);
        });
    }

    function populateDevices() {
        var
            deviceSelect = $(".blackboxDevice select").empty();

        deviceSelect.append('<option value="0">Serial port</option>');
        if (FC.DATAFLASH.ready) {
            deviceSelect.append('<option value="1">On-board dataflash chip</option>');
        }
        if (FC.SDCARD.supported) {
            deviceSelect.append('<option value="2">On-board SD card slot</option>');
        }

        deviceSelect.val(FC.BLACKBOX.blackboxDevice);
    }

    function populateLoggingRates() {
        var
            userRateGCD = gcd(FC.BLACKBOX.blackboxRateNum, FC.BLACKBOX.blackboxRateDenom),
            userRate = {num: FC.BLACKBOX.blackboxRateNum / userRateGCD, denom: FC.BLACKBOX.blackboxRateDenom / userRateGCD};

        // Offer a reasonable choice of logging rates (if people want weird steps they can use CLI)
        var
            loggingRates = [
                 {num: 1, denom: 32},
                 {num: 1, denom: 16},
                 {num: 1, denom: 8},
                 {num: 1, denom: 5},
                 {num: 1, denom: 4},
                 {num: 1, denom: 3},
                 {num: 1, denom: 2},
                 {num: 2, denom: 3},
                 {num: 3, denom: 4},
                 {num: 4, denom: 5},
                 {num: 7, denom: 8},
                 {num: 1, denom: 1},
            ],
            loggingRatesSelect = $(".blackboxRate select");

        var
            addedCurrentValue = false;

        for (var i = 0; i < loggingRates.length; i++) {
            if (!addedCurrentValue && userRate.num / userRate.denom <= loggingRates[i].num / loggingRates[i].denom) {
                if (userRate.num / userRate.denom < loggingRates[i].num / loggingRates[i].denom) {
                    loggingRatesSelect.append('<option value="' + userRate.num + '/' + userRate.denom + '">'
                            + userRate.num + '/' + userRate.denom + ' (' + Math.round(userRate.num / userRate.denom * 100) + '%)</option>');
                }
                addedCurrentValue = true;
            }

            loggingRatesSelect.append('<option value="' + loggingRates[i].num + '/' + loggingRates[i].denom + '">'
                + loggingRates[i].num + '/' + loggingRates[i].denom + ' (' + Math.round(loggingRates[i].num / loggingRates[i].denom * 100) + '%)</option>');

        }
        loggingRatesSelect.val(userRate.num + '/' + userRate.denom);
    }

    function formatFilesizeKilobytes(kilobytes) {
        if (kilobytes < 1024) {
            return Math.round(kilobytes) + "kB";
        }

        var
            megabytes = kilobytes / 1024,
            gigabytes;

        if (megabytes < 900) {
            return megabytes.toFixed(1) + "MB";
        } else {
            gigabytes = megabytes / 1024;

            return gigabytes.toFixed(1) + "GB";
        }
    }

    function formatFilesizeBytes(bytes) {
        if (bytes < 1024) {
            return bytes + "B";
        }
        return formatFilesizeKilobytes(bytes / 1024);
    }

    function update_bar_width(bar, value, total, label, valuesAreKilobytes) {
        if (value > 0) {
            bar.css({
                width: (value / total * 100) + "%",
                display: 'block'
            });

            $("div", bar).text((label ? label + " " : "") + (valuesAreKilobytes ? formatFilesizeKilobytes(value) : formatFilesizeBytes(value)));
        } else {
            bar.css({
                display: 'none'
            });
        }
    }

    function update_html() {
        update_bar_width($(".tab-onboard_logging .dataflash-used"), FC.DATAFLASH.usedSize, FC.DATAFLASH.totalSize, "Used space", false);
        update_bar_width($(".tab-onboard_logging .dataflash-free"), FC.DATAFLASH.totalSize - FC.DATAFLASH.usedSize, FC.DATAFLASH.totalSize, "Free space", false);

        update_bar_width($(".tab-onboard_logging .sdcard-other"), FC.SDCARD.totalSizeKB - FC.SDCARD.freeSizeKB, FC.SDCARD.totalSizeKB, "Unavailable space", true);
        update_bar_width($(".tab-onboard_logging .sdcard-free"), FC.SDCARD.freeSizeKB, FC.SDCARD.totalSizeKB, "Free space for logs", true);

        $(".btn a.erase-flash, .btn a.save-flash").toggleClass("disabled", FC.DATAFLASH.usedSize == 0);

        $(".tab-onboard_logging")
            .toggleClass("sdcard-error", FC.SDCARD.state == MSP.SDCARD_STATE_FATAL)
            .toggleClass("sdcard-initializing", FC.SDCARD.state == MSP.SDCARD_STATE_CARD_INIT || FC.SDCARD.state == MSP.SDCARD_STATE_FS_INIT)
            .toggleClass("sdcard-ready", FC.SDCARD.state == MSP.SDCARD_STATE_READY);

        switch (FC.SDCARD.state) {
            case MSP.SDCARD_STATE_NOT_PRESENT:
                $(".sdcard-status").text("No card inserted");
            break;
            case MSP.SDCARD_STATE_FATAL:
                $(".sdcard-status").html("Fatal error<br>Reboot to retry");
            break;
            case MSP.SDCARD_STATE_READY:
                $(".sdcard-status").text("Card ready");
            break;
            case MSP.SDCARD_STATE_CARD_INIT:
                $(".sdcard-status").text("Card starting...");
            break;
            case MSP.SDCARD_STATE_FS_INIT:
                $(".sdcard-status").text("Filesystem starting...");
            break;
            default:
                $(".sdcard-status").text("Unknown state " + FC.SDCARD.state);
        }

        if (FC.SDCARD.supported && !sdcardTimer) {
            // Poll for changes in SD card status
            sdcardTimer = setTimeout(function() {
                sdcardTimer = false;
                if (CONFIGURATOR.connectionValid) {
                    MSP.send_message(MSPCodes.MSP_SDCARD_SUMMARY, false, false, function() {
                        update_html();
                    });
                }
            }, 2000);
        }
    }

    // IO related methods
    function zeroPad(value, width) {
        value = "" + value;

        while (value.length < width) {
            value = "0" + value;
        }

        return value;
    }

    function flash_save_cancel() {
        saveCancelled = true;
    }

    function show_saving_dialog() {
        $(".dataflash-saving progress").attr("value", 0);
        saveCancelled = false;
        $(".dataflash-saving").removeClass("done");

        $(".dataflash-saving")[0].showModal();
    }

    function dismiss_saving_dialog() {
        $(".dataflash-saving")[0].close();
    }

    function mark_saving_dialog_done() {
        $(".dataflash-saving").addClass("done");
    }

    function flash_update_summary(onDone) {
        MSP.send_message(MSPCodes.MSP_DATAFLASH_SUMMARY, false, false, function() {
            update_html();

            if (onDone) {
                onDone();
            }
        });
    }

    function flash_save_begin() {
        if (GUI.connected_to) {
            // Begin by refreshing the occupied size in case it changed while the tab was open
            flash_update_summary(function() {
                const maxBytes = FC.DATAFLASH.usedSize;

                prepare_file(function(filename) {
                    let nextAddress = 0;

                    show_saving_dialog();

                    function onChunkRead(chunkAddress, chunk) {
                        if (chunk != null) {
                            // Did we receive any data?
                            if (chunk.byteLength > 0) {
                                nextAddress += chunk.byteLength;

                                $(".dataflash-saving progress").attr("value", nextAddress / maxBytes * 100);

                                fs.writeFileSync(filename, new Uint8Array(chunk), {
                                    "flag": "a"
                                })

                                if (saveCancelled) {
                                    dismiss_saving_dialog();
                                } else if (nextAddress >= maxBytes) {
                                    mark_saving_dialog_done();
                                }else {
                                    mspHelper.dataflashRead(nextAddress, onChunkRead);
                                }

                            } else {
                                // A zero-byte block indicates end-of-file, so we're done
                                mark_saving_dialog_done();
                            }
                        } else {
                            // There was an error with the received block (address didn't match the one we asked for), retry
                            mspHelper.dataflashRead(nextAddress, onChunkRead);
                        }
                    }

                    // Fetch the initial block
                    mspHelper.dataflashRead(nextAddress, onChunkRead);
                });
            });
        }
    }

    function prepare_file(onComplete) {
        const date = new Date();
        const filename = 'blackbox_log_' + date.getFullYear() + '-'  + zeroPad(date.getMonth() + 1, 2) + '-'
                + zeroPad(date.getDate(), 2) + '_' + zeroPad(date.getHours(), 2) + zeroPad(date.getMinutes(), 2)
                + zeroPad(date.getSeconds(), 2) + '.TXT';

        var options = {
            defaultPath: filename,
            filters: [ { name: "TXT file", extensions: ['txt'] } ]
        };
        dialog.showSaveDialog(options).then(result => {
            if (result.canceled) {
                return;
            }
            onComplete(result.filePath);
        });
    }

    function ask_to_erase_flash() {
        eraseCancelled = false;
        $(".dataflash-confirm-erase").removeClass('erasing');
        $(".dataflash-confirm-erase")[0].showModal();
    }

    function poll_for_erase_completion() {
        flash_update_summary(function() {
            if (CONFIGURATOR.connectionValid && !eraseCancelled) {
                if (FC.DATAFLASH.ready) {
                    $(".dataflash-confirm-erase")[0].close();
                } else {
                    setTimeout(poll_for_erase_completion, 500);
                }
            }
        });
    }

    function flash_erase() {
        $(".dataflash-confirm-erase").addClass('erasing');

        MSP.send_message(MSPCodes.MSP_DATAFLASH_ERASE, false, false, poll_for_erase_completion);
    }

    function flash_erase_cancel() {
        eraseCancelled = true;
        $(".dataflash-confirm-erase")[0].close();
    }

    function getIncludeFlags(){
        let flags = 0;
        for (let i = 0; i < blackBoxFields.length; i++) {
            const FIELD_ID = blackBoxFields[i];

            const checkbox = $("#"+FIELD_ID);
            if(checkbox.prop("checked")){
                flags=flags|1<<i;
            }
        }
        return flags;
    }
};

TABS.onboard_logging.cleanup = function (callback) {
    if (sdcardTimer) {
        clearTimeout(sdcardTimer);
        sdcardTimer = false;
    }

    if (callback) {
        callback();
    }
};
