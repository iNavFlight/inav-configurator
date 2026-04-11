'use strict';

import { marked } from 'marked';
import semver from 'semver';

import i18n from './../js/localization';
import { GUI, TABS } from './../js/gui';
import MSP from './../js/msp';
import MSPCodes from './../js/msp/MSPCodes';
import FC from './../js/fc';
import { usbDevices, PortHandler } from './../js/port_handler';
import CONFIGURATOR from './../js/data_storage';
import SerialBackend from './../js/serial_backend';
import timeout from './../js/timeouts';
import interval from './../js/intervals';
import mspQueue from './../js/serial_queue';
import mspHelper from './../js/msp/MSPHelper';
import STM32 from './../js/protocols/stm32';
import STM32DFU from './../js/protocols/stm32usbdfu';
import ConnectionSerial from './../js/connection/connectionSerial';
import mspDeduplicationQueue from './../js/msp/mspDeduplicationQueue';
import store from './../js/store';
import dialog from '../js/dialog.js';
import BackupRestore from './../js/backup_restore';
import MigrationHandler from './../js/migration/migration_handler';

TABS.firmware_flasher = {};

// Normalize target names to underscores for consistent dictionary lookups.
// Hyphens supported as workaround for 9.0.0 filename inconsistency.
function normalizeTargetName(name) {
    if (name == null) return '';
    return String(name).replace(/-/g, '_');
}

/**
 * Disconnect with a timeout fallback.
 * After save/exit the FC reboots and the serial port may vanish before
 * the disconnect callback fires, which would leave connect_lock stuck.
 */
function disconnectSafely(callback) {
    var done = false;
    var fallback = setTimeout(function() {
        if (!done) {
            done = true;
            console.warn('Disconnect timed out, forcing unlock');
            callback();
        }
    }, 3000);

    try {
        CONFIGURATOR.connection.disconnect(function() {
            if (!done) {
                done = true;
                clearTimeout(fallback);
                callback();
            }
        });
    } catch (e) {
        if (!done) {
            done = true;
            clearTimeout(fallback);
            console.warn('Disconnect threw:', e);
            callback();
        }
    }
}

TABS.firmware_flasher.initialize = function (callback) {

    if (GUI.active_tab != 'firmware_flasher') {
        GUI.active_tab = 'firmware_flasher';
    }

    var intel_hex = false, // standard intel hex in string format
        parsed_hex = false, // parsed raw hex in array format
        fileName = "inav.hex";

    import('./firmware_flasher.html?raw').then(({default: html}) => GUI.load(html, function () {
        // translate to user-selected language
        i18n.localize();

        function enable_load_online_button() {
            $(".load_remote_file").text(i18n.getMessage('firmwareFlasherButtonLoadOnline')).removeClass('disabled');
        }

        function parse_hex(str, callback) {
            // parsing hex in different thread
            const worker = new Worker(new URL('./../js/workers/hex_parser.js', import.meta.url));
            
            // "callback"
            worker.onmessage = function (event) {
                callback(event.data);
            };

            // send data/string over for processing
            worker.postMessage(str);
            
        }

        function getReleaseMajor(releaseName) {
            // "name":"inav-9.0.0-dev-20250124-28-d1ef85e82d8aa5bb8b85e518893c8e4f6ab61d6e"
            var releaseNameExpression = /^inav-(\d+)([\d.]+)-(ci|dev)-(\d{4})(\d{2})(\d{2})-(\d+)-(\w+)$/;
            var match = releaseNameExpression.exec(releaseName);

            if(!match) {
                console.log(releaseName + " not matched");
                //alert(releaseName);
                return 0;
            }

            return match[1];
        }

        function parseDevFilename(filename) {
            //var targetFromFilenameExpression = /inav_([\d.]+)?_?([^.]+)\.(.*)/;
            // inav_8.0.0_TUNERCF405_dev-20240617-88fb1d0.hex
            // inav_8.0.0_TUNERCF405_ci-20240617-88fb1d0.hex
            var targetFromFilenameExpression = /^inav_(\d+)([\d.]+)_([A-Za-z0-9_-]+)_(ci|dev)-(\d{4})(\d{2})(\d{2})-(\w+)\.(hex)$/;
            var match = targetFromFilenameExpression.exec(filename);

            if (!match) {
                console.log(filename + " not matched");
                return null;
            }

            var rawMatch = match[3];  // e.g., "TBS-LUCID-H7-WING" or "TBS_LUCID_H7_WING"
            return {
                target_id: normalizeTargetName(rawMatch),
                target: rawMatch.replace(/_/g, " ").replace(/-/g, " "),  // Display: "TBS LUCID H7 WING"
                format: match[9],
                version: match[1]+match[2],
                major: match[1]
            };
        }

        function parseFilename(filename) {
            //var targetFromFilenameExpression = /inav_([\d.]+)?_?([^.]+)\.(.*)/;
            var targetFromFilenameExpression = /inav_([\d.]+(?:-rc\d+)?)?_?([^.]+)\.(.*)/;
            var match = targetFromFilenameExpression.exec(filename);

            if (!match) {
                return null;
            }

            //GUI.log("non dev: match[2]: " + match[2] + " match[3]: " + match[3]);

            var rawMatch = match[2];  // e.g., "MATEKF405" or "MATEK-F405"
            return {
                target_id: normalizeTargetName(rawMatch),
                target: rawMatch.replace(/_/g, " ").replace(/-/g, " "),  // Display: "MATEKF405"
                format: match[3],
            };
        }

        $('input.show_development_releases').on('click', function () {
            let selectedTarget = String($('select[name="board"]').val());
            GUI.log(i18n.getMessage('selectedTarget') + selectedTarget);
            buildBoardOptions();
            GUI.log(i18n.getMessage('toggledRCs'));
            if (selectedTarget === "0") {
                TABS.firmware_flasher.getTarget();
            } else {
                $('select[name="board"] option[value="' + selectedTarget + '"]').attr("selected", "selected");
                $('select[name="board"]').trigger('change');
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

        var buildBoardOptions = function(releasesData) {
            const start = performance.now();
            var boards_e = $('select[name="board"]').empty();
            var versions_e = $('select[name="firmware_version"]').empty();
            var showDevReleases = ($('input.show_development_releases').is(':checked'));
            
            boards_e.append($("<option value='0'>{0}</option>".format(i18n.getMessage('firmwareFlasherOptionLabelSelectBoard'))));
            versions_e.append($("<option value='0'>{0}</option>".format(i18n.getMessage('firmwareFlasherOptionLabelSelectFirmwareVersion'))));

            var releases = {};
            var sortedTargets = [];
            var unsortedTargets = [];

            TABS.firmware_flasher.releasesData.forEach(function(release){
                release.assets.forEach(function(asset){
                    var result = parseFilename(asset.name);

                    if ((!showDevReleases && release.prerelease) || !result) {
                        return;
                    }
                    if($.inArray(result.target_id, unsortedTargets) == -1) {
                        unsortedTargets.push(result.target_id);
                    }
                });
            });

            if (showDevReleases) {
                var majorCount = {};
                TABS.firmware_flasher.devReleasesData.forEach(function (release) {
                    release.assets.forEach(function (asset) {
                        var result = parseDevFilename(asset.name);

                        if (result) {
                            if ($.inArray(result.target_id, unsortedTargets) == -1) {
                                unsortedTargets.push(result.target_id);
                            }
                        }
                    });
                });
            }

            sortedTargets = unsortedTargets.sort();

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
                        "target_id" : result.target_id,
                        "target"    : result.target,
                        "date"      : formattedDate,
                        "notes"     : release.body,
                        "status"    : release.prerelease ? "release-candidate" : "stable"
                    };
                    // Skip duplicate entries (e.g. both hyphen and underscore variants of same target+version)
                    if (!releases[result.target_id].some(d => d.version === descriptor.version && d.status === descriptor.status)) {
                        releases[result.target_id].push(descriptor);
                    }
                });
            });

            if(showDevReleases && TABS.firmware_flasher.devReleasesData) {
                var majorCount = {};
                TABS.firmware_flasher.devReleasesData.forEach(function(release){
                    var major = getReleaseMajor(release.name);

                    if (!(major in majorCount)) {
                        majorCount[major] = 0;
                    }

                    if(majorCount[major] >= 10) {
                        return;
                    }

                    majorCount[major]++;

                    var versionFromTagExpression = /v?(.*)/;
                    var matchVersionFromTag = versionFromTagExpression.exec(release.tag_name);
                    var version = matchVersionFromTag[1];

                    release.assets.forEach(function(asset){
                        var result = parseDevFilename(asset.name);
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
                            "target_id" : result.target_id,
                            "target"    : result.target,
                            "date"      : formattedDate,
                            "notes"     : release.body,
                            "status"    : release.prerelease ? "nightly" : "stable"
                        };
                        // Skip duplicate entries (e.g. both hyphen and underscore variants of same target+version)
                        if (!releases[result.target_id].some(d => d.version === descriptor.version && d.status === descriptor.status)) {
                            releases[result.target_id].push(descriptor);
                        }
                    });
                });
            }
            
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
                                            descriptor.target_id,
                                            descriptor.target
                                    )).data('summary', descriptor);
                            boards_e.append(select_e);
                        }
                    });
                });
            TABS.firmware_flasher.releases = releases;
            const end = performance.now();
            console.log(`buildBoardOptions: ${end - start} ms`)
            return;
        };

        $.get('https://api.github.com/repos/iNavFlight/inav-nightly/releases?per_page=50', function(releasesData) {
            TABS.firmware_flasher.devReleasesData = releasesData;
        }).fail(function (data){
            TABS.firmware_flasher.devReleasesData = {};
            if (data["responseJSON"]){
                GUI.log("<b>GITHUB Query Failed: <code>{0}</code></b>".format(data["responseJSON"].message));
            }
            $('select[name="board"]').empty().append('<option value="0">Offline</option>');
            $('select[name="firmware_version"]').empty().append('<option value="0">Offline</option>');
            $('a.auto_select_target').addClass('disabled');
        });


        $.get('https://api.github.com/repos/iNavFlight/inav/releases?per_page=10', function (releasesData){
            TABS.firmware_flasher.releasesData = releasesData;
            buildBoardOptions(releasesData);

            // bind events
            $('select[name="board"]').on('change', function () {

                $("a.load_remote_file").addClass('disabled');
                var target = $(this).children("option:selected").val();
                var targetDisplay = $(this).children("option:selected").text();

                if (!GUI.connect_lock) {
                    $('.progress').val(0).removeClass('valid invalid');
                    $('span.progressLabel').text(i18n.getMessage('firmwareFlasherLoadFirmwareFile'));
                    $('div.git_info').slideUp();
                    $('div.release_info').slideUp();
                    $('a.flash_firmware').addClass('disabled');

                    var versions_e = $('select[name="firmware_version"]').empty();
                    if(target == 0) {
                        versions_e.append($("<option value='0'>{0}</option>".format(i18n.getMessage('firmwareFlasherOptionLabelSelectFirmwareVersion'))));
                    } else {
                        versions_e.append($("<option value='0'>{0} {1}</option>".format(i18n.getMessage('firmwareFlasherOptionLabelSelectFirmwareVersionFor'), targetDisplay)));
                    }

                    if (typeof TABS.firmware_flasher.releases[target]?.forEach === 'function') {
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

            var options = {
                filters: [ { name: "HEX file", extensions: ['hex'] } ]
            };
            dialog.showOpenDialog(options).then(result =>  {
                if (result.canceled) {
                    return;
                }

                let filename;
                if (result.filePaths.length == 1) {
                    filename = result.filePaths[0];
                }
                
                $('div.git_info').slideUp();

                console.log('Loading file from: ' + filename);

                window.electronAPI.readFile(filename).then(response => {

                    if (response.error) {
                        console.log("Error loading local file", response.erroe);
                        return;
                    }

                    console.log('File loaded');

                    parse_hex(response.data.toString(), function (data) {
                        parsed_hex = data;

                        if (parsed_hex) {
                            $('a.flash_firmware').removeClass('disabled');

                            $('span.progressLabel').text('Loaded Local Firmware: (' + parsed_hex.bytes_total + ' bytes)');
                        } else {
                            $('span.progressLabel').text(i18n.getMessage('firmwareFlasherHexCorrupted'));
                        }
                    });
                });

            });

        });

        /**
         * Lock / Unlock the firmware download button according to the firmware selection dropdown.
         */
        $('select[name="firmware_version"]').on('change', function(evt){
            $('div.release_info').slideUp();
            $('a.flash_firmware').addClass('disabled');
            if (evt.target.value=="0") {
                $("a.load_remote_file").addClass('disabled');
            }
            else {
                enable_load_online_button();
            }
        });

        $('a.load_remote_file').on('click', function () {

            if ($('select[name="firmware_version"]').val() == "0") {
                GUI.log(i18n.getMessage('noFirmwareSelectedToLoad'));
                return;
            }

            function process_hex(data, summary) {
                intel_hex = data;

                parse_hex(intel_hex, function (data) {
                    parsed_hex = data;

                    if (parsed_hex) {
                        var url;

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
                            $('div.release_info .status').html(i18n.getMessage('firmwareFlasherReleaseStatusReleaseCandidate')).show();
                        } else {
                            status_e.hide();
                        }

                        $('div.release_info .name').text(summary.name).prop('href', summary.releaseUrl);
                        $('div.release_info .date').text(summary.date);
                        $('div.release_info .status').text(summary.status);
                        $('div.release_info .file').text(summary.file).prop('href', summary.url);

                        var formattedNotes = marked.parse(summary.notes);
                        $('div.release_info .notes').html(formattedNotes);
                        // Make links in the release notes open in a new window
                        $('div.release_info .notes a').each(function () {
                            $(this).attr('target', '_blank');
                        });

                        $('div.release_info').slideDown();

                    } else {
                        $('span.progressLabel').text(i18n.getMessage('firmwareFlasherHexCorrupted'));
                    }
                });
            }

            function failed_to_load() {
                $('span.progressLabel').text(i18n.getMessage('firmwareFlasherFailedToLoadOnlineFirmware'));
                $('a.flash_firmware').addClass('disabled');
                enable_load_online_button();
            }

            var summary = $('select[name="firmware_version"] option:selected').data('summary');
            if (summary) { // undefined while list is loading or while running offline
                fileName = summary.file;
                $(".load_remote_file").text(i18n.getMessage('firmwareFlasherButtonLoading')).addClass('disabled');
                $.get(summary.url, function (data) {
                    enable_load_online_button();
                    process_hex(data, summary);
                }).fail(failed_to_load);
            } else {
                $('span.progressLabel').text(i18n.getMessage('firmwareFlasherFailedToLoadOnlineFirmware'));
            }
        });

        // --- Shared helpers for migration preview (used by flash + manual restore) ---

        // Show progress label with a link to open the backups folder
        function showBackupSavedMessage(messageKey) {
            $('span.progressLabel').html(
                i18n.getMessage(messageKey) +
                ' <a class="open_backup_dir" href="#">' +
                i18n.getMessage('backupRestoreOpenBackupsFolder') + '</a>'
            );
            $('.open_backup_dir').on('click', function(e) {
                e.preventDefault();
                window.electronAPI.openBackupDir();
            });
        }

        // Build migration changes text for preview overlay
        function buildMigrationChangesText(summary) {
            var sections = [
                { key: 'removedSettings', header: 'migrationPreviewRemovedHeader' },
                { key: 'renamedSettings', header: 'migrationPreviewRenamedSettingsHeader' },
                { key: 'renamedCommands', header: 'migrationPreviewRenamedCommandsHeader' },
                { key: 'valueReplacements', header: 'migrationPreviewValueReplacementsHeader' },
                { key: 'settingRemappings', header: 'migrationPreviewSettingRemappingsHeader' },
            ];
            var lines = [];
            for (var s = 0; s < sections.length; s++) {
                var items = summary[sections[s].key];
                if (items && items.length > 0) {
                    if (lines.length > 0) lines.push('');
                    lines.push(i18n.getMessage(sections[s].header, [items.length.toString()]));
                    for (var j = 0; j < items.length; j++) {
                        lines.push('  • ' + items[j]);
                    }
                }
            }
            return lines.join('\n');
        }

        // Show migration preview overlay with changes and warnings
        function showMigrationPreview(summary, onContinue, onCancel) {
            var $preview = $('#migration-preview-overlay');
            var $changes = $preview.find('.migration-preview__changes');
            var $warnings = $preview.find('.migration-preview__warnings');
            var $continueBtn = $preview.find('.migration-preview__btn--continue');
            var $cancelBtn = $preview.find('.migration-preview__btn--cancel');

            $preview.find('.migration-preview__subtitle').text(
                i18n.getMessage('migrationPreviewSubtitle', [summary.fromVersion, summary.toVersion])
            );
            $changes.text(buildMigrationChangesText(summary));

            if (summary.warnings.length > 0) {
                $warnings.text(summary.warnings.map(function(w) { return '⚠ ' + w; }).join('\n'));
            } else {
                $warnings.text('');
            }

            $preview.removeClass('is-hidden');
            i18n.localize($preview);

            function cleanup() {
                $continueBtn.off('click.migPreview');
                $cancelBtn.off('click.migPreview');
                $preview.addClass('is-hidden');
            }

            $cancelBtn.on('click.migPreview', function(e) {
                e.preventDefault();
                cleanup();
                onCancel();
            });

            $continueBtn.on('click.migPreview', function(e) {
                e.preventDefault();
                cleanup();
                onContinue();
            });
        }

        $('a.flash_firmware').on('click', function () {
            if (!$(this).hasClass('disabled')) {
                if (!GUI.connect_lock) { // button disabled while flashing is in progress
                    if (parsed_hex != false) {
                        var options = {};
                        var skipAutoRestore = false;

                        if ($('input.erase_chip').is(':checked')) {
                            options.erase_chip = true;
                        }

                        // Save original port before flash (port picker may change during DFU)
                        var originalPort = String($('div#port-picker #port').val());
                        var originalBaud = parseInt($('div#port-picker #baud').val());

                        // Determine version update type (patch / minor / major)
                        var currentVersion = FC.CONFIG.flightControllerVersion;
                        var selectedSummary = $('select[name="firmware_version"] option:selected').data('summary');
                        var targetVersion = selectedSummary ? semver.clean(selectedSummary.version) : null;
                        var isMinorOrMajorUpdate = false;

                        if (currentVersion && targetVersion && semver.valid(currentVersion) && semver.valid(targetVersion)) {
                            var diffType = semver.diff(currentVersion, targetVersion);
                            // minor, major, premajor, preminor all count as non-patch
                            if (diffType && diffType !== 'patch' && diffType !== 'prepatch' && diffType !== 'prerelease') {
                                isMinorOrMajorUpdate = true;
                            }
                        }

                        // Version check gate: warn if minor/major update without chip erase
                        if (isMinorOrMajorUpdate && !options.erase_chip) {
                            showVersionWarning(currentVersion, targetVersion, function onContinue() {
                                skipAutoRestore = true;
                                proceedWithFlash();
                            });
                            return; // wait for user decision
                        }

                        proceedWithFlash();
                        return;

                        // Shows the version warning overlay; calls onContinue if user proceeds
                        function showVersionWarning(fromVer, toVer, onContinue) {
                            var $warn = $('#version-warning-overlay');
                            $warn.find('.version-warning-overlay__text').text(
                                i18n.getMessage('firmwareFlasherVersionWarningText', [fromVer, toVer])
                            );
                            $warn.removeClass('is-hidden');
                            i18n.localize($warn);

                            var $continueBtn = $warn.find('.version-warning-overlay__btn--continue');
                            var $cancelBtn = $warn.find('.version-warning-overlay__btn--cancel');

                            function cleanup() {
                                $continueBtn.off('click.versionWarn');
                                $cancelBtn.off('click.versionWarn');
                                $warn.addClass('is-hidden');
                            }

                            $cancelBtn.on('click.versionWarn', function(e) {
                                e.preventDefault();
                                cleanup();
                                // User cancelled — do nothing
                            });

                            $continueBtn.on('click.versionWarn', function(e) {
                                e.preventDefault();
                                cleanup();
                                onContinue();
                            });
                        }

                        function proceedWithFlash() {

                        // Common completion handler for both serial and DFU flash paths
                        function onFlashComplete() {
                            // Update stored FC version to what we just flashed
                            // so subsequent version checks are accurate without reconnecting
                            if (targetVersion) {
                                FC.CONFIG.flightControllerVersion = targetVersion;
                            }

                            var backup = BackupRestore.getLastAutoBackup();
                            if (backup) {
                                GUI.log(i18n.getMessage('backupRestoreAutoBackupSaved', [backup.filePath]));

                                // Check for major version downgrade — no auto-restore for downgrades
                                var backupVersion = MigrationHandler.extractBackupVersion(backup.data);
                                var isMajorDowngrade = false;
                                if (backupVersion && targetVersion && semver.valid(backupVersion) && semver.valid(targetVersion)) {
                                    if (semver.major(backupVersion) > semver.major(targetVersion)) {
                                        isMajorDowngrade = true;
                                    }
                                }

                                if (isMajorDowngrade) {
                                    // Major downgrade — inform user, no auto-restore
                                    GUI.log(i18n.getMessage('backupRestoreDowngradeNoAutoRestore'));
                                    showBackupSavedMessage('backupRestoreDowngradeNoAutoRestore');
                                    BackupRestore.clearLastAutoBackup();
                                } else if (options.erase_chip && !skipAutoRestore) {
                                    // Full chip erase — offer auto-restore

                                    // Pre-compute migration to decide which dialog to show
                                    var migrationNeeded = targetVersion && MigrationHandler.isMigrationNeeded(backup.data, targetVersion);
                                    var missingProfiles = targetVersion && MigrationHandler.hasMissingProfiles(backup.data, targetVersion);
                                    var migrationResult = null;
                                    var dataToRestore = backup.data;

                                    if (migrationNeeded) {
                                        migrationResult = MigrationHandler.migrateBackupData(backup.data, targetVersion);
                                        dataToRestore = migrationResult.migratedContent;
                                    }

                                    // Inject missing-profile warning into summary if applicable
                                    if (missingProfiles) {
                                        if (!migrationResult) {
                                            var backupVer = MigrationHandler.extractBackupVersion(backup.data) || 'unknown';
                                            migrationResult = MigrationHandler.createEmptyResult(backupVer, targetVersion, dataToRestore);
                                        }
                                        migrationResult.summary.warnings.push(
                                            i18n.getMessage('migrationMissingProfileWarning', [
                                                migrationResult.summary.fromVersion,
                                                migrationResult.summary.toVersion,
                                            ])
                                        );
                                    }

                                    if (migrationResult && (migrationResult.summary.totalChanges > 0 || migrationResult.summary.warnings.length > 0)) {
                                        // Show migration preview overlay instead of simple confirm
                                        showMigrationPreview(migrationResult.summary, function onContinue() {
                                            // Log migration info
                                            GUI.log(i18n.getMessage('backupRestoreMigrationApplied', [
                                                migrationResult.summary.fromVersion,
                                                migrationResult.summary.toVersion,
                                                migrationResult.summary.totalChanges.toString()
                                            ]));
                                            startPortPollingAndRestore(dataToRestore);
                                        }, function onCancel() {
                                            BackupRestore.clearLastAutoBackup();
                                            showBackupSavedMessage('backupRestoreFlashCompleteBackupSaved');
                                        });
                                    } else {
                                        // No migration needed — show simple confirm overlay
                                        $('span.progressLabel').text(i18n.getMessage('backupRestoreFlashCompleteOfferRestore'));

                                        var $confirmOverlay = $('#restore-confirm-overlay');
                                        $confirmOverlay.removeClass('is-hidden');
                                        i18n.localize($confirmOverlay);

                                        var $yesBtn = $confirmOverlay.find('.restore-confirm-overlay__btn--yes');
                                        var $noBtn = $confirmOverlay.find('.restore-confirm-overlay__btn--no');

                                        function confirmCleanup() {
                                            $yesBtn.off('click.autoRestore');
                                            $noBtn.off('click.autoRestore');
                                            $confirmOverlay.addClass('is-hidden');
                                        }

                                        $noBtn.on('click.autoRestore', function(e) {
                                            e.preventDefault();
                                            confirmCleanup();
                                            BackupRestore.clearLastAutoBackup();
                                            $('span.progressLabel').text(i18n.getMessage('backupRestoreFlashCompleteBackupSaved'));
                                        });

                                        $yesBtn.on('click.autoRestore', function(e) {
                                            e.preventDefault();
                                            confirmCleanup();
                                            startPortPollingAndRestore(dataToRestore);
                                        });
                                    }
                                } else {
                                    // No full chip erase — just show backup info
                                    showBackupSavedMessage('backupRestoreFlashCompleteBackupSaved');
                                    BackupRestore.clearLastAutoBackup();
                                }
                            }
                        }

                        // Start port polling and auto-restore with given data
                        function startPortPollingAndRestore(restoreData) {
                            var restorePort = originalPort;
                            var restoreBaud = originalBaud;

                            var $overlay = $('#restore-overlay');
                            var $overlayStatus = $overlay.find('.restore-overlay__status');
                            var $overlayFill = $overlay.find('.restore-overlay__progress-fill');
                            var $overlayText = $overlay.find('.restore-overlay__progress-text');
                            $overlayFill.css('width', '0%');
                            $overlayText.text('');
                            $overlayStatus.text(i18n.getMessage('backupRestoreAutoRestoreWaitingPort', [restorePort]));
                            $overlay.removeClass('is-hidden');

                            var portPollRetries = 0;
                            var maxPortPollRetries = 60; // 30 seconds max
                            var portPollInterval = setInterval(function() {
                                portPollRetries++;
                                if (portPollRetries > maxPortPollRetries) {
                                    clearInterval(portPollInterval);
                                    $overlay.addClass('is-hidden');
                                    GUI.connect_lock = false;
                                    GUI.log(i18n.getMessage('backupRestoreRestoreFailed'));
                                    $('span.progressLabel').text(i18n.getMessage('backupRestoreRestoreFailed'));
                                    BackupRestore.clearLastAutoBackup();
                                    return;
                                }

                                ConnectionSerial.getDevices().then(function(devices) {
                                    if (devices && devices.includes(restorePort)) {
                                        clearInterval(portPollInterval);
                                        $overlayStatus.text(i18n.getMessage('backupRestoreStatusConnecting'));
                                        setTimeout(function() {
                                            doAutoRestore(restorePort, restoreBaud, restoreData, $overlay, $overlayStatus, $overlayFill, $overlayText);
                                        }, 2000);
                                    }
                                });
                            }, 500);
                        }

                        // Extracted restore logic — restoreData is already migrated if needed
                        function doAutoRestore(restorePort, restoreBaud, restoreData, $overlay, $overlayStatus, $overlayFill, $overlayText) {
                            GUI.connect_lock = true;

                            CONFIGURATOR.connection.connect(restorePort, {bitrate: restoreBaud}, function(openInfo) {
                                if (!openInfo) {
                                    $overlay.addClass('is-hidden');
                                    GUI.connect_lock = false;
                                    GUI.log(i18n.getMessage('failedToOpenSerialPort'));
                                    $('span.progressLabel').text(i18n.getMessage('backupRestoreRestoreFailed'));
                                    BackupRestore.clearLastAutoBackup();
                                    return;
                                }

                                function onProgress(info) {
                                    if (info.phase === 'entering-cli') {
                                        $overlayStatus.text(i18n.getMessage('backupRestoreStatusEnteringCli'));
                                    } else if (info.phase === 'restoring') {
                                        var pct = info.total > 0 ? Math.round((info.current / info.total) * 100) : 0;
                                        $overlayStatus.text(i18n.getMessage('backupRestoreStatusRestoringProgress', [info.current, info.total]));
                                        $overlayFill.css('width', pct + '%');
                                        $overlayText.text(info.current + ' / ' + info.total);
                                    }
                                }

                                BackupRestore.performRestore(restoreData, onProgress).then(function(result) {
                                    $overlay.addClass('is-hidden');

                                    if (result.errors.length > 0) {
                                        // Show error dialog
                                        var $errorDlg = $('#restore-error-dialog');
                                        $errorDlg.find('.restore-error-dialog__errors').text(result.errors.join('\n'));
                                        $errorDlg.removeClass('is-hidden');

                                        var $saveBtn = $errorDlg.find('.restore-error-dialog__btn--save');
                                        var $abortBtn = $errorDlg.find('.restore-error-dialog__btn--abort');

                                        function cleanup() {
                                            $saveBtn.off('click.restoreErr');
                                            $abortBtn.off('click.restoreErr');
                                            $errorDlg.addClass('is-hidden');
                                        }

                                        $saveBtn.on('click.restoreErr', function(e) {
                                            e.preventDefault();
                                            cleanup();
                                            BackupRestore.saveAndReboot().then(function() {
                                                GUI.log(i18n.getMessage('backupRestoreRestoreComplete'));
                                                $('span.progressLabel').text(i18n.getMessage('backupRestoreRestoreComplete'));
                                                disconnectSafely(function() {
                                                    GUI.connect_lock = false;
                                                });
                                            });
                                        });

                                        $abortBtn.on('click.restoreErr', function(e) {
                                            e.preventDefault();
                                            cleanup();
                                            BackupRestore.abortRestore().then(function() {
                                                GUI.log(i18n.getMessage('backupRestoreRestoreAborted'));
                                                $('span.progressLabel').text(i18n.getMessage('backupRestoreRestoreAborted'));
                                                disconnectSafely(function() {
                                                    GUI.connect_lock = false;
                                                });
                                            });
                                        });
                                    } else {
                                        BackupRestore.saveAndReboot().then(function() {
                                            GUI.log(i18n.getMessage('backupRestoreRestoreComplete'));
                                            $('span.progressLabel').text(i18n.getMessage('backupRestoreRestoreComplete'));
                                            disconnectSafely(function() {
                                                GUI.connect_lock = false;
                                            });
                                        });
                                    }
                                    BackupRestore.clearLastAutoBackup();
                                }).catch(function(err) {
                                    $overlay.addClass('is-hidden');
                                    console.error('Auto-restore failed:', err);
                                    GUI.log(i18n.getMessage('backupRestoreRestoreFailed'));
                                    $('span.progressLabel').text(i18n.getMessage('backupRestoreRestoreFailed'));
                                    BackupRestore.clearLastAutoBackup();
                                    disconnectSafely(function() {
                                        GUI.connect_lock = false;
                                    });
                                });
                            });
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

                                // Add auto-backup handler: captures diff all while CLI is
                                // active during the reboot sequence (before DFU command)
                                if (!options.no_reboot) {
                                    options.onCliReady = BackupRestore.createOnCliReadyHandler(function(msgKey) {
                                        $('span.progressLabel').text(i18n.getMessage(msgKey));
                                    });
                                }

                                STM32.connect(port, baud, parsed_hex, options, onFlashComplete);
                            } else {
                                console.log('Please select valid serial port');
                                GUI.log(i18n.getMessage('selectValidSerialPort'));
                            }
                        } else {
                            STM32DFU.connect(usbDevices, parsed_hex, options, onFlashComplete);
                        }

                        } // end proceedWithFlash

                    } else {
                        $('span.progressLabel').text(i18n.getMessage('firmwareFlasherFirmwareNotLoaded'));
                    }
                }
            }
        });

        // Backup Config button
        $('a.backup_config').on('click', function () {
            if (GUI.connect_lock) return;

            var port = String($('div#port-picker #port').val());
            if (port === '0' || port === 'DFU') {
                GUI.log(i18n.getMessage('selectValidSerialPort'));
                return;
            }

            $('span.progressLabel').text(i18n.getMessage('backupRestoreStatusConnecting'));

            // Connect to FC, perform backup via CLI, then disconnect
            var rebootBaud = parseInt($('div#port-picker #baud').val());
            GUI.connect_lock = true;

            CONFIGURATOR.connection.connect(port, {bitrate: rebootBaud}, function(openInfo) {
                if (!openInfo) {
                    GUI.connect_lock = false;
                    GUI.log(i18n.getMessage('failedToOpenSerialPort'));
                    return;
                }

                BackupRestore.performBackupToFile(function(msgKey) {
                    $('span.progressLabel').text(i18n.getMessage(msgKey));
                }).then(function(result) {
                    if (result) {
                        GUI.log(i18n.getMessage('backupRestoreBackupSaved', [result.filePath]));
                        $('span.progressLabel').text(i18n.getMessage('backupRestoreBackupComplete'));
                    } else {
                        $('span.progressLabel').text(i18n.getMessage('backupRestoreBackupCancelled'));
                    }
                    // FC reboots after CLI exit, disconnect and unlock
                    disconnectSafely(function() {
                        GUI.connect_lock = false;
                    });
                }).catch(function(err) {
                    console.error('Backup failed:', err);
                    GUI.log(i18n.getMessage('backupRestoreBackupFailed'));
                    $('span.progressLabel').text(i18n.getMessage('backupRestoreBackupFailed'));
                    disconnectSafely(function() {
                        GUI.connect_lock = false;
                    });
                });
            });
        });

        // Restore Config button
        $('a.restore_config').on('click', async function () {
            if (GUI.connect_lock) return;

            var port = String($('div#port-picker #port').val());
            if (port === '0' || port === 'DFU') {
                GUI.log(i18n.getMessage('selectValidSerialPort'));
                return;
            }

            // Show file dialog BEFORE connecting to avoid idle connection during user interaction
            var backupDir = await window.electronAPI.getBackupDir();
            var fileResult = await window.electronAPI.showOpenDialog({
                defaultPath: backupDir,
                filters: [
                    { name: 'CLI/TXT', extensions: ['cli', 'txt'] },
                    { name: 'ALL', extensions: ['*'] },
                ],
                properties: ['openFile'],
            });

            if (fileResult.canceled || !fileResult.filePaths || fileResult.filePaths.length === 0) {
                $('span.progressLabel').text(i18n.getMessage('backupRestoreRestoreCancelled'));
                return;
            }

            var fileResponse = await window.electronAPI.readFile(fileResult.filePaths[0]);
            if (fileResponse.error) {
                GUI.log(i18n.getMessage('backupRestoreRestoreFailed'));
                $('span.progressLabel').text(i18n.getMessage('backupRestoreRestoreFailed'));
                return;
            }

            var fileData = fileResponse.data;
            var currentFcVersion = FC.CONFIG.flightControllerVersion;

            // Run migration before connecting (text-only, no FC needed)
            var migrationNeeded = currentFcVersion && MigrationHandler.isMigrationNeeded(fileData, currentFcVersion);
            var missingProfiles = currentFcVersion && MigrationHandler.hasMissingProfiles(fileData, currentFcVersion);
            var migrationResult = null;

            if (migrationNeeded) {
                migrationResult = MigrationHandler.migrateBackupData(fileData, currentFcVersion);
                fileData = migrationResult.migratedContent;
            }

            // Inject missing-profile warning if applicable
            if (missingProfiles) {
                if (!migrationResult) {
                    var backupVer = MigrationHandler.extractBackupVersion(fileResponse.data) || 'unknown';
                    migrationResult = MigrationHandler.createEmptyResult(backupVer, currentFcVersion, fileData);
                }
                migrationResult.summary.warnings.push(
                    i18n.getMessage('migrationMissingProfileWarning', [
                        migrationResult.summary.fromVersion,
                        migrationResult.summary.toVersion,
                    ])
                );
            }

            // If migration has changes or warnings, show preview overlay and wait for user decision
            if (migrationResult && (migrationResult.summary.totalChanges > 0 || migrationResult.summary.warnings.length > 0)) {
                await new Promise(function(resolve) {
                    showMigrationPreview(migrationResult.summary, function onContinue() {
                        GUI.log(i18n.getMessage('backupRestoreMigrationApplied', [
                            migrationResult.summary.fromVersion,
                            migrationResult.summary.toVersion,
                            migrationResult.summary.totalChanges.toString()
                        ]));
                        resolve(true);
                    }, function onCancel() {
                        fileData = null; // signal cancellation
                        resolve(false);
                    });
                });

                if (!fileData) {
                    $('span.progressLabel').text(i18n.getMessage('backupRestoreRestoreCancelled'));
                    return;
                }
            }

            // Show overlay and lock UI
            var $overlay = $('#restore-overlay');
            var $overlayStatus = $overlay.find('.restore-overlay__status');
            var $overlayFill = $overlay.find('.restore-overlay__progress-fill');
            var $overlayText = $overlay.find('.restore-overlay__progress-text');
            $overlayFill.css('width', '0%');
            $overlayText.text('');
            $overlayStatus.text(i18n.getMessage('backupRestoreStatusConnecting'));
            $overlay.removeClass('is-hidden');

            $('span.progressLabel').text(i18n.getMessage('backupRestoreStatusConnecting'));

            var rebootBaud = parseInt($('div#port-picker #baud').val());
            GUI.connect_lock = true;

            CONFIGURATOR.connection.connect(port, {bitrate: rebootBaud}, function(openInfo) {
                if (!openInfo) {
                    $overlay.addClass('is-hidden');
                    GUI.connect_lock = false;
                    GUI.log(i18n.getMessage('failedToOpenSerialPort'));
                    return;
                }

                // Progress callback from performRestore
                function onProgress(info) {
                    switch (info.phase) {
                        case 'entering-cli':
                            $overlayStatus.text(i18n.getMessage('backupRestoreStatusEnteringCli'));
                            $overlayFill.css('width', '0%');
                            $overlayText.text('');
                            break;
                        case 'restoring':
                            $overlayStatus.text(i18n.getMessage('backupRestoreStatusRestoringProgress', [info.current, info.total]));
                            var pct = info.total > 0 ? Math.round((info.current / info.total) * 100) : 0;
                            $overlayFill.css('width', pct + '%');
                            $overlayText.text(info.current + ' / ' + info.total);
                            $('span.progressLabel').text(i18n.getMessage('backupRestoreStatusRestoringProgress', [info.current, info.total]));
                            break;
                        case 'saving':
                            $overlayStatus.text(i18n.getMessage('backupRestoreStatusSaving'));
                            $overlayFill.css('width', '100%');
                            break;
                    }
                }

                BackupRestore.performRestore(fileData, onProgress).then(function(result) {
                    $overlay.addClass('is-hidden');

                    if (result.errors.length > 0) {
                        // Show error dialog — let user decide to save or abort
                        var $errorDlg = $('#restore-error-dialog');
                        var $errorList = $errorDlg.find('.restore-error-dialog__errors');
                        $errorList.text(result.errors.join('\n'));
                        $errorDlg.removeClass('is-hidden');

                        // Wait for user choice via one-time click handlers
                        var $saveBtn = $errorDlg.find('.restore-error-dialog__btn--save');
                        var $abortBtn = $errorDlg.find('.restore-error-dialog__btn--abort');

                        function cleanup() {
                            $saveBtn.off('click.restoreErr');
                            $abortBtn.off('click.restoreErr');
                            $errorDlg.addClass('is-hidden');
                        }

                        $saveBtn.on('click.restoreErr', function(e) {
                            e.preventDefault();
                            cleanup();
                            $('span.progressLabel').text(i18n.getMessage('backupRestoreStatusSaving'));
                            BackupRestore.saveAndReboot().then(function() {
                                GUI.log(i18n.getMessage('backupRestoreRestoreComplete'));
                                $('span.progressLabel').text(i18n.getMessage('backupRestoreRestoreComplete'));
                                disconnectSafely(function() {
                                    GUI.connect_lock = false;
                                });
                            });
                        });

                        $abortBtn.on('click.restoreErr', function(e) {
                            e.preventDefault();
                            cleanup();
                            $('span.progressLabel').text(i18n.getMessage('backupRestoreRestoreAborted'));
                            BackupRestore.abortRestore().then(function() {
                                GUI.log(i18n.getMessage('backupRestoreRestoreAborted'));
                                disconnectSafely(function() {
                                    GUI.connect_lock = false;
                                });
                            });
                        });
                    } else {
                        // No errors — save immediately
                        $('span.progressLabel').text(i18n.getMessage('backupRestoreStatusSaving'));
                        BackupRestore.saveAndReboot().then(function() {
                            GUI.log(i18n.getMessage('backupRestoreRestoreComplete'));
                            $('span.progressLabel').text(i18n.getMessage('backupRestoreRestoreComplete'));
                            disconnectSafely(function() {
                                GUI.connect_lock = false;
                            });
                        });
                    }
                }).catch(function(err) {
                    $overlay.addClass('is-hidden');
                    console.error('Restore failed:', err);
                    GUI.log(i18n.getMessage('backupRestoreRestoreFailed'));
                    $('span.progressLabel').text(i18n.getMessage('backupRestoreRestoreFailed'));
                    disconnectSafely(function() {
                        GUI.connect_lock = false;
                    });
                });
            });
        });

        // Open Backups Folder button
        $('a.open_backups_folder').on('click', function () {
            window.electronAPI.openBackupDir();
        });

        $(document).on('click', 'span.progressLabel a.save_firmware', function () {
            var options = {
                defaultPath: fileName,
                filters: [ {name: "HEX File", extensions: ['hex'] } ]
            };
            dialog.showSaveDialog(options).then(result => {
                if (result.canceled) {
                    return;
                }
                fs.writeFileSync(result.filePath, intel_hex, (err) => {
                    if (err) {
                        GUI.log(i18n.getMessage('ErrorWritingFile'));
                        return console.error(err);
                    }
                });
                let sFilename = String(result.filePath.split('\\').pop().split('/').pop());
                GUI.log(sFilename + i18n.getMessage('savedSuccessfully'));
            });
        });

        
        if (store.get('no_reboot_sequence', false)) {
            $('input.updating').prop('checked', true);
            $('.flash_on_connect_wrapper').show();
        } else {
            $('input.updating').prop('checked', false);
        }

        // bind UI hook so the status is saved on change
        $('input.updating').on('change', function () {
            var status = $(this).is(':checked');

            if (status) {
                $('.flash_on_connect_wrapper').show();
            } else {
                $('input.flash_on_connect').prop('checked', false).trigger('change');
                $('.flash_on_connect_wrapper').hide();
            }

            store.set('no_reboot_sequence', status);
        });

        $('input.updating').trigger('change');
        
        if (store.get('flash_manual_baud', false)) {
            $('input.flash_manual_baud').prop('checked', true);
        } else {
            $('input.flash_manual_baud').prop('checked', false);
        }

        // bind UI hook so the status is saved on change
        $('input.flash_manual_baud').on('change', function () {
            var status = $(this).is(':checked');
            store.set('flash_manual_baud', status);
        });

        $('input.flash_manual_baud').trigger('change');
        

        var flash_manual_baud_rate = store.get('flash_manual_baud_rate', '');
        $('#flash_manual_baud_rate').val(flash_manual_baud_rate);

        // bind UI hook so the status is saved on change
        $('#flash_manual_baud_rate').on('change', function () {
            var baud = parseInt($('#flash_manual_baud_rate').val());
            store.set('flash_manual_baud_rate', baud);
        });

        $('input.flash_manual_baud_rate').trigger('change');

        
        if (store.get('flash_on_connect', false)) {
            $('input.flash_on_connect').prop('checked', true);
        } else {
            $('input.flash_on_connect').prop('checked', false);
        }

        $('input.flash_on_connect').on('change', function () {
            var status = $(this).is(':checked');

            if (status) {
                var catch_new_port = function () {
                    PortHandler.port_detected('flash_detected_device', function (result) {
                        var port = result[0];

                        if (!GUI.connect_lock) {
                            GUI.log('Detected: <strong>' + port + '</strong> - triggering flash on connect');
                            console.log('Detected: ' + port + ' - triggering flash on connect');

                            // Trigger regular Flashing sequence
                            timeout.add('initialization_timeout', function () {
                                $('a.flash_firmware').trigger( "click" );
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

            store.set('flash_on_connect', status);
        }).trigger('change');
        

        
        if (store.get('erase_chip', false)) {
            $('input.erase_chip').prop('checked', true);
        } else {
            $('input.erase_chip').prop('checked', false);
        }

        // bind UI hook so the status is saved on change
        $('input.erase_chip').on('change', async function () {
            store.set('erase_chip', $(this).is(':checked'));
        });

        $('input.erase_chip').trigger('change');

        

        $(document).keypress(function (e) {
            if (e.which == 13) { // enter
                // Trigger regular Flashing sequence
                $('a.flash_firmware').trigger( "click" );
            }
        });

        $('a.auto_select_target').on('click', function () {
            TABS.firmware_flasher.getTarget();
        });

        GUI.content_ready(callback);
    }));
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
    GUI.log(i18n.getMessage('automaticTargetSelect'));
    
    var selected_baud = parseInt($('#baud').val());
    var selected_port = $('#port').find('option:selected').data().isManual ? $('#port-override').val() : String($('#port').val());
    
    if (selected_port !== 'DFU') {
        if (!selected_port || selected_port == '0') {
            GUI.log(i18n.getMessage('targetPrefetchFailNoPort'));
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
        GUI.log(i18n.getMessage('targetPrefetchFailDFU'));
    }
};

TABS.firmware_flasher.onOpen = async function(openInfo) {
    if (openInfo) {
        GUI.connected_to = GUI.connecting_to;

        // reset connecting_to
        GUI.connecting_to = false;

        // save selected port with chrome.storage if the port differs
        var last_used_port = store.get('last_used_port', '');
        if (last_used_port) {
            if (last_used_port != GUI.connected_to) {
                // last used port doesn't match the one found in local db, we will store the new one
                store.set('last_used_port', GUI.connected_to);
            }
        } else {
            // variable isn't stored yet, saving
            store.set('last_used_port', GUI.connected_to);
        }
        

        store.set('last_used_bps', CONFIGURATOR.connection.bitrate);
        store.set('wireless_mode_enabled', $('#wireless-mode').is(":checked"));

        CONFIGURATOR.connection.addOnReceiveListener(SerialBackend.read_serial);

        // disconnect after 10 seconds with error if we don't get IDENT data
        timeout.add('connecting', function () {
            if (!CONFIGURATOR.connectionValid) {
                GUI.log(i18n.getMessage('targetPrefetchFail') + i18n.getMessage('noConfigurationReceived'));

                TABS.firmware_flasher.closeTempConnection();
            }
        }, 10000);

        FC.resetState();

        // request configuration data. Start with MSPv1 and
        // upgrade to MSPv2 if possible.
        MSP.protocolVersion = MSP.constants.PROTOCOL_V2;
        MSP.send_message(MSPCodes.MSP_API_VERSION, false, false, function () {
            
            if (FC.CONFIG.apiVersion === "0.0.0") {
                GUI.log("Cannot prefetch target: <span style='color: red; font-weight: bolder'><strong>" + i18n.getMessage("illegalStateRestartRequired") + "</strong></span>");
                FC.restartRequired = true;
                return;
            }

            MSP.send_message(MSPCodes.MSP_FC_VARIANT, false, false, function () {
                if (FC.CONFIG.flightControllerIdentifier == 'INAV') {
                    MSP.send_message(MSPCodes.MSP_FC_VERSION, false, false, function () {
                        if (semver.lt(FC.CONFIG.flightControllerVersion, "5.0.0")) {
                            GUI.log(i18n.getMessage('targetPrefetchFailOld'));
                            TABS.firmware_flasher.closeTempConnection();
                        } else {
                            mspHelper.getCraftName(function(name) {
                                if (name) {
                                    FC.CONFIG.name = name;
                                }
                                TABS.firmware_flasher.onValidFirmware();  
                            });
                        }
                    });
                } else {
                    GUI.log(i18n.getMessage('targetPrefetchFailNonINAV'));
                    TABS.firmware_flasher.closeTempConnection();
                }
            });
        });
    } else {
        GUI.log(i18n.getMessage('targetPrefetchFail') + i18n.getMessage('serialPortOpenFail'));
        return;
    }
};

TABS.firmware_flasher.onValidFirmware = function() {
    MSP.send_message(MSPCodes.MSP_BUILD_INFO, false, false, function () {
        MSP.send_message(MSPCodes.MSP_BOARD_INFO, false, false, function () {
            var boardSelect = $('select[name="board"]');
            var normalizedTarget = normalizeTargetName(FC.CONFIG.target);
            boardSelect.val(normalizedTarget);

            GUI.log(i18n.getMessage('targetPrefetchsuccessful') + FC.CONFIG.target);

            TABS.firmware_flasher.closeTempConnection();

            // Only trigger change if the board was actually found and selected
            if (boardSelect.val() === normalizedTarget) {
                boardSelect.trigger('change');
            }
        });
    });
};

TABS.firmware_flasher.closeTempConnection = function() {
    timeout.killAll();
    interval.killAll(['global_data_refresh', 'msp-load-update', 'ltm-connection-check']);

    mspQueue.flush();
    mspQueue.freeHardLock();
    mspQueue.freeSoftLock();
    mspDeduplicationQueue.flush();
    CONFIGURATOR.connection.emptyOutputBuffer();

    CONFIGURATOR.connectionValid = false;
    GUI.connected_to = false;

    CONFIGURATOR.connection.disconnect();
    MSP.disconnect_cleanup();
};