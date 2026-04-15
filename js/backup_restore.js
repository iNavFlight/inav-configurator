'use strict';

import CONFIGURATOR from './data_storage';
import { GUI } from './gui';
import FC from './fc';
import i18n from './localization';
import semver from 'semver';
import MigrationHandler from './migration/migration_handler';

const BACKUP_TIMEOUT_MS = 15000;
const CLI_ENTER_TIMEOUT_MS = 3000;
const LINE_DELAY_MS = 50;
const PROFILE_SWITCH_DELAY_MS = 100;
const REBOOT_WAIT_MS = 1500;

let lastAutoBackup = null;

/**
 * Backup & Restore module for INAV flight controller settings.
 * Uses CLI text protocol (diff all / batch commands) over the active connection.
 */
const BackupRestore = {
    _receiveCallback: null,
    _cliBuffer: '',
    _outputHistory: '',
    _cliReady: false,

    _sendString(str, callback) {
        const buf = new ArrayBuffer(str.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < str.length; i++) {
            view[i] = str.charCodeAt(i);
        }
        CONFIGURATOR.connection.send(buf, callback);
    },

    /**
     * Enter CLI mode by sending '#' and waiting for 'CLI' prompt.
     * Returns a Promise that resolves when CLI is ready.
     */
    _enterCli() {
        return new Promise((resolve, reject) => {
            this._cliBuffer = '';
            this._outputHistory = '';
            this._cliReady = false;

            let timeoutHandle = null;

            this._receiveCallback = (info) => {
                const data = new Uint8Array(info.data);
                for (let i = 0; i < data.length; i++) {
                    const ch = String.fromCharCode(data[i]);
                    this._outputHistory += ch;
                    this._cliBuffer += ch;
                }

                if (this._cliBuffer.includes('CLI')) {
                    this._cliReady = true;
                    if (timeoutHandle) {
                        clearTimeout(timeoutHandle);
                    }
                    resolve();
                }
            };
            CONFIGURATOR.connection.addOnReceiveCallback(this._receiveCallback);

            timeoutHandle = setTimeout(() => {
                if (!this._cliReady) {
                    this._cleanup();
                    reject(new Error('Timeout entering CLI mode'));
                }
            }, CLI_ENTER_TIMEOUT_MS);

            this._sendString('#');
        });
    },

    /**
     * Send a CLI command and wait for the prompt to return.
     * The prompt is detected by a line ending with '# ' pattern.
     */
    _sendCommand(command) {
        return new Promise((resolve, reject) => {
            this._outputHistory = '';
            this._cliBuffer = '';

            let timeoutHandle = null;
            const originalCallback = this._receiveCallback;

            this._receiveCallback = (info) => {
                const data = new Uint8Array(info.data);
                for (let i = 0; i < data.length; i++) {
                    const ch = String.fromCharCode(data[i]);
                    this._outputHistory += ch;

                    if (data[i] === 10 || data[i] === 13) {
                        this._cliBuffer = '';
                    } else {
                        this._cliBuffer += ch;
                    }
                }

                if (this._cliBuffer.endsWith('# ') || this._cliBuffer === '# ') {
                    if (timeoutHandle) {
                        clearTimeout(timeoutHandle);
                    }
                    CONFIGURATOR.connection.removeOnReceiveCallback(this._receiveCallback);
                    this._receiveCallback = originalCallback;
                    if (originalCallback) {
                        CONFIGURATOR.connection.addOnReceiveCallback(originalCallback);
                    }
                    resolve(this._outputHistory);
                }
            };

            if (originalCallback) {
                CONFIGURATOR.connection.removeOnReceiveCallback(originalCallback);
            }
            CONFIGURATOR.connection.addOnReceiveCallback(this._receiveCallback);

            timeoutHandle = setTimeout(() => {
                CONFIGURATOR.connection.removeOnReceiveCallback(this._receiveCallback);
                this._receiveCallback = originalCallback;
                if (originalCallback) {
                    CONFIGURATOR.connection.addOnReceiveCallback(originalCallback);
                }
                reject(new Error('Timeout waiting for CLI response to: ' + command));
            }, BACKUP_TIMEOUT_MS);

            this._sendString(command + '\n');
        });
    },

    _cleanup() {
        if (this._receiveCallback) {
            CONFIGURATOR.connection.removeOnReceiveCallback(this._receiveCallback);
            this._receiveCallback = null;
        }
    },

    /**
     * Exit CLI mode by sending 'exit' and waiting for the send to complete.
     * The FC will reboot after receiving the exit command.
     * Returns a Promise that resolves after the command is sent and a brief
     * delay to allow the FC to begin processing.
     */
    _exitCli() {
        return new Promise((resolve) => {
            this._cleanup();
            this._sendString('exit\r', () => {
                setTimeout(resolve, 500);
            });
        });
    },

    _saveCli() {
        return new Promise((resolve) => {
            this._cleanup();
            this._sendString('save\r', () => {
                setTimeout(resolve, 500);
            });
        });
    },

    generateBackupFilename(prefix) {
        const date = new Date();
        const pad = (n) => String(n).padStart(2, '0');
        const version = FC.CONFIG.flightControllerVersion || 'unknown';
        const board = (FC.CONFIG.target || FC.CONFIG.boardIdentifier || 'unknown').replace(/\s+/g, '_');
        const timestamp = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
        return `${prefix || ''}inav_backup_${version}_${board}_${timestamp}.txt`;
    },

    /**
     * Perform a backup: enter CLI, run 'diff all', save output to file.
     * @param {function} onProgress - Optional callback for status updates: onProgress(messageKey)
     * @returns {Promise<{filePath: string, version: string, data: string}>}
     */
    async performBackup(onProgress) {
        if (!CONFIGURATOR.connection) {
            throw new Error('Not connected to flight controller');
        }

        const version = FC.CONFIG.flightControllerVersion;

        if (onProgress) onProgress('backupRestoreStatusEnteringCli');

        await this._enterCli();

        if (onProgress) onProgress('backupRestoreStatusReadingConfig');

        const diffOutput = await this._sendCommand('diff all');
        const cleanedOutput = this._cleanDiffOutput(diffOutput);

        if (onProgress) onProgress('backupRestoreStatusSavingFile');

        const backupDir = await window.electronAPI.getBackupDir();
        const filename = this.generateBackupFilename();
        const filePath = backupDir + '/' + filename;

        const header = `# INAV Backup\n# Version: ${version}\n# Board: ${FC.CONFIG.target || FC.CONFIG.boardIdentifier}\n# Date: ${new Date().toISOString()}\n# Craft: ${FC.CONFIG.name || ''}\n#\n`;
        const fileContent = header + cleanedOutput;

        const err = await window.electronAPI.writeFile(filePath, fileContent);
        if (err) {
            throw new Error('Failed to write backup file: ' + err);
        }

        if (onProgress) onProgress('backupRestoreStatusExitingCli');

        await this._exitCli();

        return { filePath, version, data: fileContent };
    },

    /**
     * Perform a backup to a user-chosen file location.
     * Opens a save dialog starting at the default backup directory.
     * @param {function} onProgress - Optional callback for status updates
     * @returns {Promise<{filePath: string, version: string, data: string}|null>} null if user cancelled
     */
    async performBackupToFile(onProgress) {
        if (!CONFIGURATOR.connection) {
            throw new Error('Not connected to flight controller');
        }

        const version = FC.CONFIG.flightControllerVersion;
        const backupDir = await window.electronAPI.getBackupDir();
        const filename = this.generateBackupFilename();

        const result = await window.electronAPI.showSaveDialog({
            defaultPath: backupDir + '/' + filename,
            filters: [
                { name: 'TXT', extensions: ['txt'] },
                { name: 'CLI', extensions: ['cli'] },
            ],
        });

        if (result.canceled) {
            return null;
        }

        if (onProgress) onProgress('backupRestoreStatusEnteringCli');

        await this._enterCli();

        if (onProgress) onProgress('backupRestoreStatusReadingConfig');

        const diffOutput = await this._sendCommand('diff all');
        const cleanedOutput = this._cleanDiffOutput(diffOutput);

        if (onProgress) onProgress('backupRestoreStatusSavingFile');

        const header = `# INAV Backup\n# Version: ${version}\n# Board: ${FC.CONFIG.target || FC.CONFIG.boardIdentifier}\n# Date: ${new Date().toISOString()}\n# Craft: ${FC.CONFIG.name || ''}\n#\n`;
        const fileContent = header + cleanedOutput;

        const err = await window.electronAPI.writeFile(result.filePath, fileContent);
        if (err) {
            throw new Error('Failed to write backup file: ' + err);
        }

        if (onProgress) onProgress('backupRestoreStatusExitingCli');

        await this._exitCli();

        return { filePath: result.filePath, version, data: fileContent };
    },

    /**
     * Restore settings from a backup file.
     * Sends each CLI command individually, waits for the FC response, and
     * detects errors (lines containing "### ERROR:" or "Invalid" or "Error").
     *
     * @param {string} fileContent - The content of the backup file
     * @param {function} onProgress - Callback receiving progress objects:
     *   { phase: 'entering-cli' | 'restoring' | 'done',
     *     current: number, total: number, errors: string[] }
     * @returns {Promise<{errors: string[]}>} List of errors encountered
     */
    async performRestore(fileContent, onProgress) {
        if (!CONFIGURATOR.connection) {
            throw new Error('Not connected to flight controller');
        }

        const errors = [];
        const report = (phase, current, total) => {
            if (onProgress) onProgress({ phase, current, total, errors: [...errors] });
        };

        report('entering-cli', 0, 0);
        await this._enterCli();

        const lines = fileContent.split('\n')
            .map(line => line.trim())
            .filter(line => {
                if (line.length === 0 || line.startsWith('#')) return false;
                const lower = line.toLowerCase();
                if (lower === 'save' || lower === 'exit') return false;
                return true;
            });

        const total = lines.length;
        report('restoring', 0, total);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            if (line.toLowerCase().includes('_profile')) {
                await new Promise(resolve => setTimeout(resolve, PROFILE_SWITCH_DELAY_MS));
            }

            try {
                const response = await this._sendCommand(line);

                const responseLines = response.split('\n');
                for (const rl of responseLines) {
                    const trimmed = rl.trim();
                    if (trimmed.length === 0) continue;
                    if (trimmed === line) continue;
                    if (trimmed === '#' || trimmed === '# ') continue;

                    if (trimmed.includes('### ERROR:') ||
                        trimmed.includes('Invalid') ||
                        trimmed.startsWith('ERR') ||
                        trimmed.includes('Unknown command')) {
                        errors.push(`Line ${i + 1}: ${line} → ${trimmed}`);
                    }
                }
            } catch (err) {
                errors.push(`Line ${i + 1}: ${line} → Timeout`);
            }

            report('restoring', i + 1, total);
        }

        report('done', total, total);

        return { errors };
    },

    async saveAndReboot() {
        await this._saveCli();
    },

    async abortRestore() {
        await this._exitCli();
    },

    async performRestoreFromFile(onProgress) {
        if (!CONFIGURATOR.connection) {
            throw new Error('Not connected to flight controller');
        }

        const backupDir = await window.electronAPI.getBackupDir();

        const result = await window.electronAPI.showOpenDialog({
            defaultPath: backupDir,
            filters: [
                { name: 'CLI/TXT', extensions: ['cli', 'txt'] },
                { name: 'ALL', extensions: ['*'] },
            ],
            properties: ['openFile'],
        });

        if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
            return false;
        }

        const response = await window.electronAPI.readFile(result.filePaths[0]);
        if (response.error) {
            throw new Error('Failed to read backup file');
        }

        await this.performRestore(response.data, onProgress);
        return true;
    },

    _cleanDiffOutput(raw) {
        let lines = raw.split('\n');

        if (lines.length > 0 && lines[0].includes('diff all')) {
            lines.shift();
        }

        while (lines.length > 0) {
            const last = lines[lines.length - 1].trim();
            if (last === '#' || last === '# ' || last === '') {
                lines.pop();
            } else {
                break;
            }
        }

        const ansiRegex = /\x1B\[[0-9;]*[A-Za-z]/g;
        return lines.map(line => line.replace(ansiRegex, '')).join('\n') + '\n';
    },

    getVersionChangeType(fromVersion, toVersion) {
        if (!fromVersion || !toVersion) return null;
        if (!semver.valid(fromVersion) || !semver.valid(toVersion)) return null;
        if (semver.eq(fromVersion, toVersion)) return 'same';
        return semver.diff(fromVersion, toVersion);
    },

    isAutoRestoreSafe(fromVersion, toVersion) {
        const changeType = this.getVersionChangeType(fromVersion, toVersion);
        return changeType === 'minor' || changeType === 'patch' ||
               changeType === 'prepatch' || changeType === 'preminor';
    },

    getLastAutoBackup() {
        return lastAutoBackup;
    },

    clearLastAutoBackup() {
        lastAutoBackup = null;
    },

    /**
     * Capture `diff all` output over a raw serial connection that is already in CLI mode.
     * Used by the STM32 flash process (onCliReady callback).
     *
     * @param {object} connection - The active serial connection
     * @param {function} onProgress - Optional progress callback: onProgress(messageKey)
     * @param {function} done - Called when capture is complete
     */
    captureCliDiffAll(connection, onProgress, done) {
        const self = this;
        let outputBuffer = '';
        let lineBuffer = '';
        let receiveCallback = null;
        let timeoutHandle = null;

        if (onProgress) onProgress('backupRestoreStatusReadingConfig');

        receiveCallback = function(info) {
            const data = new Uint8Array(info.data);
            for (let i = 0; i < data.length; i++) {
                const ch = String.fromCharCode(data[i]);
                outputBuffer += ch;

                if (data[i] === 10 || data[i] === 13) {
                    lineBuffer = '';
                } else {
                    lineBuffer += ch;
                }
            }

            if (lineBuffer.endsWith('# ') && outputBuffer.length > 20) {
                if (timeoutHandle) {
                    clearTimeout(timeoutHandle);
                }
                connection.removeOnReceiveCallback(receiveCallback);

                const versionMatch = outputBuffer.match(/INAV\/\S+\s+(\d+\.\d+\.\d+)/);
                if (versionMatch) {
                    FC.CONFIG.flightControllerVersion = versionMatch[1];
                    console.log('FC version detected from diff output: ' + versionMatch[1]);
                }

                const cleanedOutput = self._cleanDiffOutput(outputBuffer);

                if (onProgress) onProgress('backupRestoreStatusSavingFile');

                self._saveAutoBackup(cleanedOutput).then(function(result) {
                    lastAutoBackup = result;
                    console.log('Auto-backup saved to: ' + result.filePath);
                    if (onProgress) onProgress('backupRestoreStatusBackupComplete');
                    done();
                }).catch(function(err) {
                    console.error('Auto-backup failed to save:', err);
                    done();
                });
            }
        };

        connection.addOnReceiveCallback(receiveCallback);

        timeoutHandle = setTimeout(function() {
            console.warn('Auto-backup timed out, proceeding with flash');
            connection.removeOnReceiveCallback(receiveCallback);
            done();
        }, BACKUP_TIMEOUT_MS);

        const cmd = 'diff all\n';
        const buf = new ArrayBuffer(cmd.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < cmd.length; i++) {
            view[i] = cmd.charCodeAt(i);
        }
        connection.send(buf);
    },

    async _saveAutoBackup(cleanedOutput) {
        const version = FC.CONFIG.flightControllerVersion || 'unknown';
        const backupDir = await window.electronAPI.getBackupDir();
        const filename = this.generateBackupFilename('UPDATE_');
        const filePath = backupDir + '/' + filename;

        const header = `# INAV Auto-Backup (pre-flash)\n# Version: ${version}\n# Board: ${FC.CONFIG.target || FC.CONFIG.boardIdentifier || 'unknown'}\n# Date: ${new Date().toISOString()}\n# Craft: ${FC.CONFIG.name || ''}\n#\n`;
        const fileContent = header + cleanedOutput;

        const err = await window.electronAPI.writeFile(filePath, fileContent);
        if (err) {
            throw new Error('Failed to write backup file: ' + err);
        }

        await this._pruneAutoBackups(backupDir, 10);

        return { filePath, version, data: fileContent };
    },

    async _pruneAutoBackups(backupDir, maxKeep) {
        const AUTO_BACKUP_PATTERN = /^UPDATE_inav_backup_.*_\d{4}-\d{2}-\d{2}_\d{6}\.txt$/;

        try {
            const allFiles = await window.electronAPI.listBackups();
            const autoBackups = allFiles
                .filter(f => AUTO_BACKUP_PATTERN.test(f))
                .sort(function(a, b) {
                    var tsA = a.match(/(\d{4}-\d{2}-\d{2}_\d{6})\.txt$/);
                    var tsB = b.match(/(\d{4}-\d{2}-\d{2}_\d{6})\.txt$/);
                    return (tsA ? tsA[1] : a).localeCompare(tsB ? tsB[1] : b);
                });

            if (autoBackups.length > maxKeep) {
                const toDelete = autoBackups.slice(0, autoBackups.length - maxKeep);
                for (const file of toDelete) {
                    await window.electronAPI.rm(backupDir + '/' + file);
                }
                console.log(`Pruned ${toDelete.length} old auto-backup(s)`);
            }
        } catch (err) {
            console.warn('Failed to prune auto-backups:', err);
        }
    },

    createOnCliReadyHandler(onProgress) {
        const self = this;
        return function(connection, done) {
            self.captureCliDiffAll(connection, onProgress, done);
        };
    },

    /**
     * Perform restore with automatic migration if needed.
     * Detects version mismatch between backup and current FC,
     * applies migration profiles, and then restores.
     *
     * @param {string} fileContent - The backup file content
     * @param {string} targetVersion - The target INAV version on the FC
     * @param {function} onProgress - Progress callback
     * @returns {Promise<{errors: string[], migrationSummary: object|null}>}
     */
    async performRestoreWithMigration(fileContent, targetVersion, onProgress) {
        let dataToRestore = fileContent;
        let migrationSummary = null;

        if (targetVersion && MigrationHandler.isMigrationNeeded(fileContent, targetVersion)) {
            const result = MigrationHandler.migrateBackupData(fileContent, targetVersion);
            dataToRestore = result.migratedContent;
            migrationSummary = result.summary;

            console.log('Migration applied:', MigrationHandler.formatSummary(result.summary));
        }

        const restoreResult = await this.performRestore(dataToRestore, onProgress);

        return {
            errors: restoreResult.errors,
            migrationSummary,
        };
    },
};

export default BackupRestore;
