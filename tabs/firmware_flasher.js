/*global $,nwdialog*/
'use strict';

TABS.firmware_flasher = {};
TABS.firmware_flasher.initialize = function (callback) {

    if (GUI.active_tab != 'firmware_flasher') {
        GUI.active_tab = 'firmware_flasher';
        googleAnalytics.sendAppView('Firmware Flasher');
    }


    var intel_hex = false, // standard intel hex in string format
        parsed_hex = false; // parsed raw hex in array format

    GUI.load("./tabs/firmware_flasher.html", function () {
        // translate to user-selected language
        localize();

        function enable_load_online_button() {
            $(".load_remote_file").text(chrome.i18n.getMessage('firmwareFlasherButtonLoadOnline')).removeClass('disabled');
        }

        function parse_hex(str, callback) {
            // parsing hex in different thread
            var worker = new Worker('./build/hex_parser.js');

            // "callback"
            worker.onmessage = function (event) {
                callback(event.data);
            };

            // send data/string over for processing
            worker.postMessage(str);
        }

        function parseFilename(filename) {
            //var targetFromFilenameExpression = /inav_([\d.]+)?_?([^.]+)\.(.*)/;
            var targetFromFilenameExpression = /inav_([\d.]+(?:-rc\d+)?)?_?([^.]+)\.(.*)/;
            var match = targetFromFilenameExpression.exec(filename);

            if (!match) {
                return null;
            }

            return {
                raw_target: match[2],
                target: match[2].replace("_", " "),
                format: match[3],
            };
        }

        $('input.show_development_releases').click(function() {
            let selectedTarget = String($('select[name="board"]').val());
            GUI.log(chrome.i18n.getMessage('selectedTarget') + selectedTarget);
            buildBoardOptions();
            GUI.log(chrome.i18n.getMessage('toggledRCs'));
            if (selectedTarget === "0") {
                TABS.firmware_flasher.getTarget();
            } else {
                $('select[name="board"] option[value=' + selectedTarget + ']').attr("selected", "selected");
                $('select[name="board"]').change();
            }
        });

        $('.target_search').on('input', function(){
            var searchText = $('.target_search').val().toLocaleLowerCase();

            $('#board_targets option').each(function(i){
                var target = $(this);
                //alert("Comparing " + searchText + " with " + target.text());
                if (searchText.length > 0 && i !== 0) { 
                    if (target.text().toLowerCase().includes(searchText) || target.val().toLowerCase().includes(searchText)) {
                        target.show();
                    } else {
                        target.hide();
                    }
                } else {
                    target.show();
                }
            });
        });

        var buildBoardOptions = function(){
            var boards_e = $('select[name="board"]').empty();
            var versions_e = $('select[name="firmware_version"]').empty();
            var showDevReleases = ($('input.show_development_releases').is(':checked'));
            
            boards_e.append($("<option value='0'>{0}</option>".format(chrome.i18n.getMessage('firmwareFlasherOptionLabelSelectBoard'))));
            versions_e.append($("<option value='0'>{0}</option>".format(chrome.i18n.getMessage('firmwareFlasherOptionLabelSelectFirmwareVersion'))));

            var releases = {};
            var sortedTargets = [];
            var unsortedTargets = [];
            TABS.firmware_flasher.releasesData.forEach(function(release){
                release.assets.forEach(function(asset){
                    var result = parseFilename(asset.name);

                    if ((!showDevReleases && release.prerelease) || !result) {
                        return;
                    }
                    if($.inArray(result.target, unsortedTargets) == -1) {
                        unsortedTargets.push(result.target);
                    }
                });
                sortedTargets = unsortedTargets.sort();
            });
            sortedTargets.forEach(function(release) {
                releases[release] = [];
            });

            TABS.firmware_flasher.releasesData.forEach(function(release){

                var versionFromTagExpression = /v?(.*)/;
                var matchVersionFromTag = versionFromTagExpression.exec(release.tag_name);
                var version = matchVersionFromTag[1];

                release.assets.forEach(function(asset){
                    var result = parseFilename(asset.name);
                    if ((!showDevReleases && release.prerelease) || !result) {
                        return;
                    }

                    if (result.format != 'hex') {
                        return;
                    }

                    var date = new Date(release.published_at);
                    var formattedDate = "{0}-{1}-{2} {3}:{4}".format(
                            date.getFullYear(),
                            date.getMonth() + 1,
                            date.getDate(),
                            date.getUTCHours(),
                            date.getMinutes()
                    );

                    var descriptor = {
                        "releaseUrl": release.html_url,
                        "name"      : semver.clean(release.name),
                        "version"   : release.tag_name,
                        "url"       : asset.browser_download_url,
                        "file"      : asset.name,
                        "raw_target": result.raw_target,
                        "target"    : result.target,
                        "date"      : formattedDate,
                        "notes"     : release.body,
                        "status"    : release.prerelease ? "release-candidate" : "stable"
                    };
                    releases[result.target].push(descriptor);
                });
            });
            
            var selectTargets = [];
            Object.keys(releases)
                .sort()
                .forEach(function(target, i) {
                    var descriptors = releases[target];
                    descriptors.forEach(function(descriptor){
                        if($.inArray(target, selectTargets) == -1) {
                            selectTargets.push(target);
                            var select_e =
                                    $("<option value='{0}'>{1}</option>".format(
                                            descriptor.raw_target,
                                            descriptor.target
                                    )).data('summary', descriptor);
                            boards_e.append(select_e);
                        }
                    });
                });
            TABS.firmware_flasher.releases = releases;
            return;
        };

        $.get('https://api.github.com/repos/iNavFlight/inav/releases?per_page=10', function (releasesData){
            TABS.firmware_flasher.releasesData = releasesData;
            buildBoardOptions();

            // bind events
            $('select[name="board"]').change(function() {

                $("a.load_remote_file").addClass('disabled');
                var target = $(this).children("option:selected").text();

                if (!GUI.connect_lock) {
                    $('.progress').val(0).removeClass('valid invalid');
                    $('span.progressLabel').text(chrome.i18n.getMessage('firmwareFlasherLoadFirmwareFile'));
                    $('div.git_info').slideUp();
                    $('div.release_info').slideUp();
                    $('a.flash_firmware').addClass('disabled');

                    var versions_e = $('select[name="firmware_version"]').empty();
                    if(target == 0) {
                        versions_e.append($("<option value='0'>{0}</option>".format(chrome.i18n.getMessage('firmwareFlasherOptionLabelSelectFirmwareVersion'))));
                    } else {
                        versions_e.append($("<option value='0'>{0} {1}</option>".format(chrome.i18n.getMessage('firmwareFlasherOptionLabelSelectFirmwareVersionFor'), target)));
                    }

                    TABS.firmware_flasher.releases[target].forEach(function(descriptor) {
                        var select_e =
                                $("<option value='{0}'>{0} - {1} - {2} ({3})</option>".format(
                                        descriptor.version,
                                        descriptor.target,
                                        descriptor.date,
                                        descriptor.status
                                )).data('summary', descriptor);

                        versions_e.append(select_e);
                    });
                }
            });

            $('a.auto_select_target').removeClass('disabled');
            TABS.firmware_flasher.getTarget();
        }).fail(function (data){
            if (data["responseJSON"]){
                GUI.log("<b>GITHUB Query Failed: <code>{0}</code></b>".format(data["responseJSON"].message));
            }
            $('select[name="board"]').empty().append('<option value="0">Offline</option>');
            $('select[name="firmware_version"]').empty().append('<option value="0">Offline</option>');
            $('a.auto_select_target').addClass('disabled');
        });

        $('a.load_file').on('click', function () {

            nwdialog.setContext(document);
            nwdialog.openFileDialog('.hex', function(filename) {
                const fs = require('fs');
                
                $('div.git_info').slideUp();

                console.log('Loading file from: ' + filename);

                fs.readFile(filename, (err, data) => {

                    if (err) {
                        console.log("Error loading local file", err);
                        return;
                    }

                    console.log('File loaded');

                    parse_hex(data.toString(), function (data) {
                        parsed_hex = data;

                        if (parsed_hex) {
                            googleAnalytics.sendEvent('Flashing', 'Firmware', 'local');
                            $('a.flash_firmware').removeClass('disabled');

                            $('span.progressLabel').text('Loaded Local Firmware: (' + parsed_hex.bytes_total + ' bytes)');
                        } else {
                            $('span.progressLabel').text(chrome.i18n.getMessage('firmwareFlasherHexCorrupted'));
                        }
                    });
                });

            });

        });

        /**
         * Lock / Unlock the firmware download button according to the firmware selection dropdown.
         */
        $('select[name="firmware_version"]').change(function(evt){
            $('div.release_info').slideUp();
            $('a.flash_firmware').addClass('disabled');
            if (evt.target.value=="0") {
                $("a.load_remote_file").addClass('disabled');
            }
            else {
                enable_load_online_button();
            }
        });

        $('a.load_remote_file').click(function (evt) {

            if ($('select[name="firmware_version"]').val() == "0") {
                GUI.log(chrome.i18n.getMessage('noFirmwareSelectedToLoad'));
                return;
            }

            function process_hex(data, summary) {
                intel_hex = data;

                parse_hex(intel_hex, function (data) {
                    parsed_hex = data;

                    if (parsed_hex) {
                        var url;

                        googleAnalytics.sendEvent('Flashing', 'Firmware', 'online');
                        $('span.progressLabel').html('<a class="save_firmware" href="#" title="Save Firmware">Loaded Online Firmware: (' + parsed_hex.bytes_total + ' bytes)</a>');

                        $('a.flash_firmware').removeClass('disabled');

                        if (summary.commit) {
                            $.get('https://api.github.com/repos/iNavFlight/inav/commits/' + summary.commit, function (data) {
                                var data = data,
                                    d = new Date(data.commit.author.date),
                                    offset = d.getTimezoneOffset() / 60,
                                    date;

                                date = d.getFullYear() + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + ('0' + (d.getDate())).slice(-2);
                                date += ' @ ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
                                date += (offset > 0) ? ' GMT+' + offset : ' GMT' + offset;

                                $('div.git_info .committer').text(data.commit.author.name);
                                $('div.git_info .date').text(date);
                                $('div.git_info .hash').text(data.sha.slice(0, 7)).prop('href', 'https://api.github.com/repos/iNavFlight/inav/commit/' + data.sha);

                                $('div.git_info .message').text(data.commit.message);

                                $('div.git_info').slideDown();
                            });
                        }

                        $('div.release_info .target').text(summary.target);

                        var status_e = $('div.release_info .status');
                        if (summary.status == 'release-candidate') {
                            $('div.release_info .status').html(chrome.i18n.getMessage('firmwareFlasherReleaseStatusReleaseCandidate')).show();
                        } else {
                            status_e.hide();
                        }

                        $('div.release_info .name').text(summary.name).prop('href', summary.releaseUrl);
                        $('div.release_info .date').text(summary.date);
                        $('div.release_info .status').text(summary.status);
                        $('div.release_info .file').text(summary.file).prop('href', summary.url);

                        var formattedNotes = marked(summary.notes);
                        $('div.release_info .notes').html(formattedNotes);
                        // Make links in the release notes open in a new window
                        $('div.release_info .notes a').each(function () {
                            $(this).attr('target', '_blank');
                        });

                        $('div.release_info').slideDown();

                    } else {
                        $('span.progressLabel').text(chrome.i18n.getMessage('firmwareFlasherHexCorrupted'));
                    }
                });
            }

            function failed_to_load() {
                $('span.progressLabel').text(chrome.i18n.getMessage('firmwareFlasherFailedToLoadOnlineFirmware'));
                $('a.flash_firmware').addClass('disabled');
                enable_load_online_button();
            }

            var summary = $('select[name="firmware_version"] option:selected').data('summary');
            if (summary) { // undefined while list is loading or while running offline
                $(".load_remote_file").text(chrome.i18n.getMessage('firmwareFlasherButtonLoading')).addClass('disabled');
                $.get(summary.url, function (data) {
                    enable_load_online_button();
                    process_hex(data, summary);
                }).fail(failed_to_load);
            } else {
                $('span.progressLabel').text(chrome.i18n.getMessage('firmwareFlasherFailedToLoadOnlineFirmware'));
            }
        });

        $('a.flash_firmware').click(function () {
            if (!$(this).hasClass('disabled')) {
                if (!GUI.connect_lock) { // button disabled while flashing is in progress
                    if (parsed_hex != false) {
                        var options = {};

                        if ($('input.erase_chip').is(':checked')) {
                            options.erase_chip = true;
                        }

                        if (String($('div#port-picker #port').val()) != 'DFU') {
                            if (String($('div#port-picker #port').val()) != '0') {
                                var port = String($('div#port-picker #port').val()),
                                    baud;

                                switch (GUI.operating_system) {
                                    case 'Windows':
                                    case 'MacOS':
                                    case 'ChromeOS':
                                    case 'Linux':
                                    case 'UNIX':
                                        baud = 921600;
                                        break;

                                    default:
                                        baud = 115200;
                                }

                                if ($('input.updating').is(':checked')) {
                                    options.no_reboot = true;
                                } else {
                                    options.reboot_baud = parseInt($('div#port-picker #baud').val());
                                }

                                if ($('input.flash_manual_baud').is(':checked')) {
                                    baud = parseInt($('#flash_manual_baud_rate').val());
                                }


                                STM32.connect(port, baud, parsed_hex, options);
                            } else {
                                console.log('Please select valid serial port');
                                GUI.log(chrome.i18n.getMessage('selectValidSerialPort'));
                            }
                        } else {
                            STM32DFU.connect(usbDevices, parsed_hex, options);
                        }
                    } else {
                        $('span.progressLabel').text(chrome.i18n.getMessage('firmwareFlasherFirmwareNotLoaded'));
                    }
                }
            }
        });

        $(document).on('click', 'span.progressLabel a.save_firmware', function () {
            chrome.fileSystem.chooseEntry({type: 'saveFile', suggestedName: 'inav', accepts: [{extensions: ['hex']}]}, function (fileEntry) {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                    return;
                }

                chrome.fileSystem.getDisplayPath(fileEntry, function (path) {
                    console.log('Saving firmware to: ' + path);

                    // check if file is writable
                    chrome.fileSystem.isWritableEntry(fileEntry, function (isWritable) {
                        if (isWritable) {
                            var blob = new Blob([intel_hex], {type: 'text/plain'});

                            fileEntry.createWriter(function (writer) {
                                var truncated = false;

                                writer.onerror = function (e) {
                                    console.error(e);
                                };

                                writer.onwriteend = function() {
                                    if (!truncated) {
                                        // onwriteend will be fired again when truncation is finished
                                        truncated = true;
                                        writer.truncate(blob.size);

                                        return;
                                    }
                                };

                                writer.write(blob);
                            }, function (e) {
                                console.error(e);
                            });
                        } else {
                            console.log('You don\'t have write permissions for this file, sorry.');
                            GUI.log(chrome.i18n.getMessage('writePermissionsForFile'));
                        }
                    });
                });
            });
        });

        chrome.storage.local.get('no_reboot_sequence', function (result) {
            if (result.no_reboot_sequence) {
                $('input.updating').prop('checked', true);
                $('.flash_on_connect_wrapper').show();
            } else {
                $('input.updating').prop('checked', false);
            }

            // bind UI hook so the status is saved on change
            $('input.updating').change(function() {
                var status = $(this).is(':checked');

                if (status) {
                    $('.flash_on_connect_wrapper').show();
                } else {
                    $('input.flash_on_connect').prop('checked', false).change();
                    $('.flash_on_connect_wrapper').hide();
                }

                chrome.storage.local.set({'no_reboot_sequence': status});
            });

            $('input.updating').change();
        });

        chrome.storage.local.get('flash_manual_baud', function (result) {
            if (result.flash_manual_baud) {
                $('input.flash_manual_baud').prop('checked', true);
            } else {
                $('input.flash_manual_baud').prop('checked', false);
            }

            // bind UI hook so the status is saved on change
            $('input.flash_manual_baud').change(function() {
                var status = $(this).is(':checked');
                chrome.storage.local.set({'flash_manual_baud': status});
            });

            $('input.flash_manual_baud').change();
        });

        chrome.storage.local.get('flash_manual_baud_rate', function (result) {
            $('#flash_manual_baud_rate').val(result.flash_manual_baud_rate);

            // bind UI hook so the status is saved on change
            $('#flash_manual_baud_rate').change(function() {
                var baud = parseInt($('#flash_manual_baud_rate').val());
                chrome.storage.local.set({'flash_manual_baud_rate': baud});
            });

            $('input.flash_manual_baud_rate').change();
        });

        chrome.storage.local.get('flash_on_connect', function (result) {
            if (result.flash_on_connect) {
                $('input.flash_on_connect').prop('checked', true);
            } else {
                $('input.flash_on_connect').prop('checked', false);
            }

            $('input.flash_on_connect').change(function () {
                var status = $(this).is(':checked');

                if (status) {
                    var catch_new_port = function () {
                        PortHandler.port_detected('flash_detected_device', function (result) {
                            var port = result[0];

                            if (!GUI.connect_lock) {
                                GUI.log('Detected: <strong>' + port + '</strong> - triggering flash on connect');
                                console.log('Detected: ' + port + ' - triggering flash on connect');

                                // Trigger regular Flashing sequence
                                helper.timeout.add('initialization_timeout', function () {
                                    $('a.flash_firmware').click();
                                }, 100); // timeout so bus have time to initialize after being detected by the system
                            } else {
                                GUI.log('Detected <strong>' + port + '</strong> - previous device still flashing, please replug to try again');
                            }

                            // Since current port_detected request was consumed, create new one
                            catch_new_port();
                        }, false, true);
                    };

                    catch_new_port();
                } else {
                    PortHandler.flush_callbacks();
                }

                chrome.storage.local.set({'flash_on_connect': status});
            }).change();
        });

        chrome.storage.local.get('erase_chip', function (result) {
            if (result.erase_chip) {
                $('input.erase_chip').prop('checked', true);
            } else {
                $('input.erase_chip').prop('checked', false);
            }

            // bind UI hook so the status is saved on change
            $('input.erase_chip').change(function () {
                chrome.storage.local.set({'erase_chip': $(this).is(':checked')});
            });

            $('input.erase_chip').change();

        });

        $(document).keypress(function (e) {
            if (e.which == 13) { // enter
                // Trigger regular Flashing sequence
                $('a.flash_firmware').click();
            }
        });

        $('a.auto_select_target').click(function () {
            TABS.firmware_flasher.getTarget();
        });

        GUI.content_ready(callback);
    });
};

TABS.firmware_flasher.FLASH_MESSAGE_TYPES = {NEUTRAL : 'NEUTRAL',
                                             VALID   : 'VALID',
                                             INVALID : 'INVALID',
                                             ACTION  : 'ACTION'};

TABS.firmware_flasher.flashingMessage = function(message, type) {
    let self = this;

    let progressLabel_e = $('span.progressLabel');
    switch (type) {
        case self.FLASH_MESSAGE_TYPES.VALID:
            progressLabel_e.removeClass('invalid actionRequired')
                           .addClass('valid');
            break;
        case self.FLASH_MESSAGE_TYPES.INVALID:
            progressLabel_e.removeClass('valid actionRequired')
                           .addClass('invalid');
            break;
        case self.FLASH_MESSAGE_TYPES.ACTION:
            progressLabel_e.removeClass('valid invalid')
                           .addClass('actionRequired');
            break;
        case self.FLASH_MESSAGE_TYPES.NEUTRAL:
        default:
            progressLabel_e.removeClass('valid invalid actionRequired');
            break;
    }
    if (message != null) {
        progressLabel_e.html(message);
    }

    return self;
};

TABS.firmware_flasher.flashProgress = function(value) {
    $('.progress').val(value);

    return this;
};

TABS.firmware_flasher.cleanup = function (callback) {
    PortHandler.flush_callbacks();

    // unbind "global" events
    $(document).unbind('keypress');
    $(document).off('click', 'span.progressLabel a');

    if (callback) callback();
};

TABS.firmware_flasher.getTarget = function() {
    GUI.log(chrome.i18n.getMessage('automaticTargetSelect'));
    
    var selected_baud = parseInt($('#baud').val());
    var selected_port = $('#port').find('option:selected').data().isManual ? $('#port-override').val() : String($('#port').val());
    
    if (selected_port !== 'DFU') {
        if (selected_port == '0') {
            GUI.log(chrome.i18n.getMessage('targetPrefetchFailNoPort'));
        } else {
            console.log('Connecting to: ' + selected_port);
            GUI.connecting_to = selected_port;

            if (selected_port == 'tcp' || selected_port == 'udp') {
                CONFIGURATOR.connection.connect($portOverride.val(), {}, TABS.firmware_flasher.onOpen);
            } else {
                CONFIGURATOR.connection.connect(selected_port, {bitrate: selected_baud}, TABS.firmware_flasher.onOpen);
            }
        }
    } else {
        GUI.log(chrome.i18n.getMessage('targetPrefetchFailDFU'));
    }
};

TABS.firmware_flasher.onOpen = function(openInfo) {
    if (openInfo) {
        GUI.connected_to = GUI.connecting_to;

        // reset connecting_to
        GUI.connecting_to = false;

        // save selected port with chrome.storage if the port differs
        chrome.storage.local.get('last_used_port', function (result) {
            if (result.last_used_port) {
                if (result.last_used_port != GUI.connected_to) {
                    // last used port doesn't match the one found in local db, we will store the new one
                    chrome.storage.local.set({'last_used_port': GUI.connected_to});
                }
            } else {
                // variable isn't stored yet, saving
                chrome.storage.local.set({'last_used_port': GUI.connected_to});
            }
        });

        chrome.storage.local.set({last_used_bps: CONFIGURATOR.connection.bitrate});
        chrome.storage.local.set({wireless_mode_enabled: $('#wireless-mode').is(":checked")});

        CONFIGURATOR.connection.addOnReceiveListener(read_serial);

        // disconnect after 10 seconds with error if we don't get IDENT data
        helper.timeout.add('connecting', function () {
            if (!CONFIGURATOR.connectionValid) {
                GUI.log(chrome.i18n.getMessage('targetPrefetchFail') + chrome.i18n.getMessage('noConfigurationReceived'));

                TABS.firmware_flasher.closeTempConnection();
            }
        }, 10000);

        FC.resetState();

        // request configuration data. Start with MSPv1 and
        // upgrade to MSPv2 if possible.
        MSP.protocolVersion = MSP.constants.PROTOCOL_V2;
        MSP.send_message(MSPCodes.MSP_API_VERSION, false, false, function () {
            
            if (CONFIG.apiVersion === "0.0.0") {
                GUI_control.prototype.log("Cannot prefetch target: <span style='color: red; font-weight: bolder'><strong>" + chrome.i18n.getMessage("illegalStateRestartRequired") + "</strong></span>");
                FC.restartRequired = true;
                return;
            }

            MSP.send_message(MSPCodes.MSP_FC_VARIANT, false, false, function () {
                if (CONFIG.flightControllerIdentifier == 'INAV') {
                    MSP.send_message(MSPCodes.MSP_FC_VERSION, false, false, function () {
                        if (semver.lt(CONFIG.flightControllerVersion, "5.0.0")) {
                            GUI.log(chrome.i18n.getMessage('targetPrefetchFailOld'));
                            TABS.firmware_flasher.closeTempConnection();
                        } else {
                            mspHelper.getCraftName(function(name) {
                                if (name) {
                                    CONFIG.name = name;
                                }
                                TABS.firmware_flasher.onValidFirmware();  
                            });
                        }
                    });
                } else {
                    GUI.log(chrome.i18n.getMessage('targetPrefetchFailNonINAV'));
                    TABS.firmware_flasher.closeTempConnection();
                }
            });
        });
    } else {
        GUI.log(chrome.i18n.getMessage('targetPrefetchFail') + chrome.i18n.getMessage('serialPortOpenFail'));
        return;
    }
};

TABS.firmware_flasher.onValidFirmware = function() {
    MSP.send_message(MSPCodes.MSP_BUILD_INFO, false, false, function () {
        MSP.send_message(MSPCodes.MSP_BOARD_INFO, false, false, function () {
            $('select[name="board"] option[value=' + CONFIG.target + ']').attr("selected", "selected");
            GUI.log(chrome.i18n.getMessage('targetPrefetchsuccessful') + CONFIG.target);

            TABS.firmware_flasher.closeTempConnection();
            $('select[name="board"]').change();
        });
    });
};

TABS.firmware_flasher.closeTempConnection = function() {
    helper.timeout.killAll();
    helper.interval.killAll(['global_data_refresh', 'msp-load-update']);
    helper.mspBalancedInterval.flush();

    helper.mspQueue.flush();
    helper.mspQueue.freeHardLock();
    helper.mspQueue.freeSoftLock();
    CONFIGURATOR.connection.emptyOutputBuffer();

    CONFIGURATOR.connectionValid = false;
    GUI.connected_to = false;

    CONFIGURATOR.connection.disconnect(onClosed);
    MSP.disconnect_cleanup();
};