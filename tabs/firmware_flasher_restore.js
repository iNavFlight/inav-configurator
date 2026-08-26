'use strict';

import $ from 'jquery';
import semver from 'semver';
import i18n from '../js/localization';
import BackupRestore from '../js/backup_restore';
import MigrationHandler from '../js/migration/migration_handler';
import CONFIGURATOR from '../js/data_storage';
import GUI from '../js/gui';
import FC from '../js/fc';
import ConnectionSerial from '../js/connection/connectionSerial';

/**
 * Manages the post-flash restore UI flow for the Firmware Flasher tab.
 *
 * Extracted from firmware_flasher.js to break the 8-level closure nesting.
 * All dependencies are passed explicitly so this class is independently testable.
 */
export class FlashRestoreFlow {
    /**
     * @param {object}        options            Flash options (erase_chip, no_reboot, ...)
     * @param {boolean}       skipAutoRestore    True when user accepted a major-version warning
     * @param {string}        originalPort       Port to reconnect to after flash
     * @param {number}        originalBaud       Baud rate for reconnect
     * @param {string|null}   targetVersion      Semver of firmware being flashed, or null if unknown
     * @param {function}      disconnectSafely   Cleanly close the serial port and call back
     */
    constructor({ options, skipAutoRestore, originalPort, originalBaud, targetVersion, disconnectSafely }) {
        this._options = options;
        this._skipAutoRestore = skipAutoRestore;
        this._originalPort = originalPort;
        this._originalBaud = originalBaud;
        this._targetVersion = targetVersion;
        this._disconnectSafely = disconnectSafely;
    }

    /**
     * Called by the STM32/DFU flash driver when flashing completes.
     * Decides whether to offer auto-restore, show migration preview, or just confirm backup saved.
     */
    onFlashComplete() {
        if (this._targetVersion && FC.CONFIG) {
            FC.CONFIG.flightControllerVersion = this._targetVersion;
        }

        var backup = BackupRestore.getLastAutoBackup();
        if (!backup) return;

        GUI.log(i18n.getMessage('backupRestoreAutoBackupSaved', [backup.filePath]));

        var backupVersion = MigrationHandler.extractBackupVersion(backup.data);
        var isMajorDowngrade = false;
        if (backupVersion && this._targetVersion &&
            semver.valid(backupVersion) && semver.valid(this._targetVersion)) {
            if (semver.major(backupVersion) > semver.major(this._targetVersion)) {
                isMajorDowngrade = true;
            }
        }

        if (!this._targetVersion) {
            this._showBackupSavedMessage('backupRestoreFlashCompleteBackupSaved');
            BackupRestore.clearLastAutoBackup();
        } else if (isMajorDowngrade) {
            GUI.log(i18n.getMessage('backupRestoreDowngradeNoAutoRestore'));
            this._showBackupSavedMessage('backupRestoreDowngradeNoAutoRestore');
            BackupRestore.clearLastAutoBackup();
        } else if (this._options.erase_chip && !this._skipAutoRestore) {
            this._offerAutoRestore(backup);
        } else {
            this._showBackupSavedMessage('backupRestoreFlashCompleteBackupSaved');
            BackupRestore.clearLastAutoBackup();
        }
    }

    /**
     * Polls for the serial port to reappear after the FC reboots, then triggers restore.
     * @param {string} restoreData  The backed-up CLI diff content to restore
     */
    startPortPollingAndRestore(restoreData) {
        var restorePort = this._originalPort;
        var restoreBaud = this._originalBaud;

        var $overlay = $('#restore-overlay');
        var $overlayStatus = $overlay.find('.restore-overlay__status');
        var $overlayFill = $overlay.find('.restore-overlay__progress-fill');
        var $overlayText = $overlay.find('.restore-overlay__progress-text');
        $overlayFill.css('width', '0%');
        $overlayText.text('');
        $overlayStatus.text(i18n.getMessage('backupRestoreAutoRestoreWaitingPort', [restorePort]));
        $overlay.removeClass('is-hidden');

        var portPollRetries = 0;
        var maxPortPollRetries = 60;
        var restoreScheduled = false;
        var portPollInterval = setInterval(() => {
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

            ConnectionSerial.getDevices().then((devices) => {
                if (!restoreScheduled && devices && devices.includes(restorePort)) {
                    restoreScheduled = true;
                    clearInterval(portPollInterval);
                    $overlayStatus.text(i18n.getMessage('backupRestoreStatusConnecting'));
                    setTimeout(() => {
                        executeRestore(restorePort, restoreBaud, restoreData, $overlay, {
                            disconnectSafely: this._disconnectSafely,
                            clearAutoBackup: true,
                        });
                    }, 2000);
                }
            }).catch((err) => {
                console.warn('Port poll getDevices error:', err);
            });
        }, 500);
    }

    // -------------------------------------------------------------------------
    // Private methods
    // -------------------------------------------------------------------------

    _offerAutoRestore(backup) {
        const { dataToRestore, migrationResult } = prepareRestoreData(backup.data, this._targetVersion);

        if (migrationResult && (migrationResult.summary.totalChanges > 0 ||
                                migrationResult.summary.warnings.length > 0)) {
            showMigrationPreview(migrationResult.summary, () => {
                GUI.log(i18n.getMessage('backupRestoreMigrationApplied', [
                    migrationResult.summary.fromVersion,
                    migrationResult.summary.toVersion,
                    migrationResult.summary.totalChanges.toString(),
                ]));
                this.startPortPollingAndRestore(dataToRestore);
            }, () => {
                BackupRestore.clearLastAutoBackup();
                this._showBackupSavedMessage('backupRestoreFlashCompleteBackupSaved');
            });
        } else {
            this._offerRestoreConfirm(dataToRestore);
        }
    }

    _offerRestoreConfirm(dataToRestore) {
        $('span.progressLabel').text(i18n.getMessage('backupRestoreFlashCompleteOfferRestore'));

        var $confirmOverlay = $('#restore-confirm-overlay');
        $confirmOverlay.removeClass('is-hidden');
        i18n.localize($confirmOverlay);

        var $yesBtn = $confirmOverlay.find('.restore-confirm-overlay__btn--yes');
        var $noBtn  = $confirmOverlay.find('.restore-confirm-overlay__btn--no');

        var cleanup = function() {
            $yesBtn.off('click.autoRestore');
            $noBtn.off('click.autoRestore');
            $confirmOverlay.addClass('is-hidden');
        };

        $noBtn.on('click.autoRestore', (e) => {
            e.preventDefault();
            cleanup();
            BackupRestore.clearLastAutoBackup();
            $('span.progressLabel').text(i18n.getMessage('backupRestoreFlashCompleteBackupSaved'));
        });

        $yesBtn.on('click.autoRestore', (e) => {
            e.preventDefault();
            cleanup();
            this.startPortPollingAndRestore(dataToRestore);
        });
    }

    _showBackupSavedMessage(messageKey) {
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
}

// ---------------------------------------------------------------------------
// Standalone exports
// ---------------------------------------------------------------------------

/**
 * Run the migration check on backup data and return ready-to-restore content.
 * Used by both the auto-restore flow (FlashRestoreFlow) and the manual Restore
 * Config handler so the migration logic is not duplicated between them.
 *
 * @param {string}      data           Raw backup file content
 * @param {string|null} targetVersion  FC firmware version being targeted
 * @returns {{ dataToRestore: string, migrationResult: object|null }}
 */
export function prepareRestoreData(data, targetVersion) {
    const migrationNeeded = targetVersion && MigrationHandler.isMigrationNeeded(data, targetVersion);
    const missingProfiles = targetVersion && MigrationHandler.hasMissingProfiles(data, targetVersion);
    let migrationResult = null;
    let dataToRestore = data;

    if (migrationNeeded) {
        migrationResult = MigrationHandler.migrateBackupData(data, targetVersion);
        dataToRestore = migrationResult.migratedContent;
    }

    if (missingProfiles) {
        if (!migrationResult) {
            const backupVer = MigrationHandler.extractBackupVersion(data) || 'unknown';
            migrationResult = MigrationHandler.createEmptyResult(backupVer, targetVersion, dataToRestore);
        }
        migrationResult.summary.warnings.push(
            i18n.getMessage('migrationMissingProfileWarning', [
                migrationResult.summary.fromVersion,
                migrationResult.summary.toVersion,
            ])
        );
    }

    return { dataToRestore, migrationResult };
}

/**
 * Connect to the FC, restore backup data, then save and reboot.
 * Shared between the auto-restore flow (post-flash) and the manual Restore
 * Config handler so the connect/restore/error-dialog/saveAndReboot sequence
 * is not duplicated between them.
 *
 * @param {string}   port                  Serial port path
 * @param {number}   baud                  Baud rate
 * @param {string}   data                  Backup content to restore
 * @param {jQuery}   $overlay              The restore progress overlay element
 * @param {object}   opts
 * @param {function} opts.disconnectSafely Callback to cleanly close the port
 * @param {boolean}  [opts.clearAutoBackup=false] Clear lastAutoBackup when done
 */
export function executeRestore(port, baud, data, $overlay, { disconnectSafely, clearAutoBackup = false }) {
    const $overlayStatus = $overlay.find('.restore-overlay__status');
    const $overlayFill   = $overlay.find('.restore-overlay__progress-fill');
    const $overlayText   = $overlay.find('.restore-overlay__progress-text');
    const onProgress = makeRestoreProgressHandler($overlayStatus, $overlayFill, $overlayText);

    GUI.connect_lock = true;

    CONFIGURATOR.connection.connect(port, { bitrate: baud }, (openInfo) => {
        if (!openInfo) {
            $overlay.addClass('is-hidden');
            GUI.connect_lock = false;
            GUI.log(i18n.getMessage('failedToOpenSerialPort'));
            $('span.progressLabel').text(i18n.getMessage('backupRestoreRestoreFailed'));
            if (clearAutoBackup) BackupRestore.clearLastAutoBackup();
            return;
        }

        BackupRestore.performRestore(data, onProgress).then((result) => {
            $overlay.addClass('is-hidden');
            if (clearAutoBackup) BackupRestore.clearLastAutoBackup();

            if (result.errors.length > 0) {
                showRestoreErrorDialog(result.errors, disconnectSafely);
            } else {
                BackupRestore.saveAndReboot().then(() => {
                    GUI.log(i18n.getMessage('backupRestoreRestoreComplete'));
                    $('span.progressLabel').text(i18n.getMessage('backupRestoreRestoreComplete'));
                    disconnectSafely(() => { GUI.connect_lock = false; });
                });
            }
        }).catch((err) => {
            $overlay.addClass('is-hidden');
            console.error('Restore failed:', err);
            GUI.log(i18n.getMessage('backupRestoreRestoreFailed'));
            $('span.progressLabel').text(i18n.getMessage('backupRestoreRestoreFailed'));
            if (clearAutoBackup) BackupRestore.clearLastAutoBackup();
            disconnectSafely(() => { GUI.connect_lock = false; });
        });
    });
}

/**
 * Show the migration preview overlay, used by both the auto-restore and manual
 * restore flows.
 */
export function showMigrationPreview(summary, onContinue, onCancel) {
    var $preview     = $('#migration-preview-overlay');
    var $continueBtn = $preview.find('.migration-preview__btn--continue');
    var $cancelBtn   = $preview.find('.migration-preview__btn--cancel');

    $preview.find('.migration-preview__changes').text(
        buildMigrationChangesText(summary)
    );
    $preview.find('.migration-preview__warnings').text(
        summary.warnings.length > 0 ? summary.warnings.map(w => '⚠ ' + w).join('\n') : ''
    );

    $preview.removeClass('is-hidden');
    i18n.localize($preview);

    var cleanup = function() {
        $continueBtn.off('click.migPreview');
        $cancelBtn.off('click.migPreview');
        $preview.addClass('is-hidden');
    };

    $cancelBtn.on('click.migPreview', function(e) {
        e.preventDefault(); cleanup(); onCancel();
    });
    $continueBtn.on('click.migPreview', function(e) {
        e.preventDefault(); cleanup(); onContinue();
    });
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

function makeRestoreProgressHandler($overlayStatus, $overlayFill, $overlayText) {
    return function(info) {
        switch (info.phase) {
            case 'entering-cli':
                $overlayStatus.text(i18n.getMessage('backupRestoreStatusEnteringCli'));
                $overlayFill.css('width', '0%');
                $overlayText.text('');
                break;
            case 'restoring': {
                const pct = info.total > 0 ? Math.round((info.current / info.total) * 100) : 0;
                $overlayStatus.text(i18n.getMessage('backupRestoreStatusRestoringProgress',
                    [info.current, info.total]));
                $overlayFill.css('width', pct + '%');
                $overlayText.text(info.current + ' / ' + info.total);
                break;
            }
            case 'saving':
                $overlayStatus.text(i18n.getMessage('backupRestoreStatusSaving'));
                $overlayFill.css('width', '100%');
                break;
        }
    };
}

function showRestoreErrorDialog(errors, disconnectSafely) {
    var $errorDlg = $('#restore-error-dialog');
    $errorDlg.find('.restore-error-dialog__errors').text(errors.join('\n'));
    $errorDlg.removeClass('is-hidden');

    var $saveBtn  = $errorDlg.find('.restore-error-dialog__btn--save');
    var $abortBtn = $errorDlg.find('.restore-error-dialog__btn--abort');

    var cleanup = function() {
        $saveBtn.off('click.restoreErr');
        $abortBtn.off('click.restoreErr');
        $errorDlg.addClass('is-hidden');
    };

    $saveBtn.on('click.restoreErr', function(e) {
        e.preventDefault();
        cleanup();
        BackupRestore.saveAndReboot().then(function() {
            GUI.log(i18n.getMessage('backupRestoreRestoreComplete'));
            $('span.progressLabel').text(i18n.getMessage('backupRestoreRestoreComplete'));
            disconnectSafely(function() { GUI.connect_lock = false; });
        }).catch(function(err) {
            console.error('saveAndReboot failed:', err);
            disconnectSafely(function() { GUI.connect_lock = false; });
        });
    });

    $abortBtn.on('click.restoreErr', function(e) {
        e.preventDefault();
        cleanup();
        BackupRestore.abortRestore().then(function() {
            GUI.log(i18n.getMessage('backupRestoreRestoreAborted'));
            $('span.progressLabel').text(i18n.getMessage('backupRestoreRestoreAborted'));
            disconnectSafely(function() { GUI.connect_lock = false; });
        }).catch(function(err) {
            console.error('abortRestore failed:', err);
            disconnectSafely(function() { GUI.connect_lock = false; });
        });
    });
}

function buildMigrationChangesText(summary) {
    var sections = [
        { key: 'removedSettings',    header: 'migrationPreviewRemovedHeader' },
        { key: 'renamedSettings',    header: 'migrationPreviewRenamedSettingsHeader' },
        { key: 'renamedCommands',    header: 'migrationPreviewRenamedCommandsHeader' },
        { key: 'valueReplacements',  header: 'migrationPreviewValueReplacementsHeader' },
        { key: 'settingRemappings',  header: 'migrationPreviewSettingRemappingsHeader' },
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
