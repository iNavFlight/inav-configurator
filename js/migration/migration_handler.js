'use strict';

import semver from 'semver';

import profile_7_to_8 from './7_to_8.json';
import profile_8_to_9 from './8_to_9.json';

/**
 * All available migration profiles, ordered by version.
 * To add a new profile: import the JSON and append it here.
 */
const MIGRATION_PROFILES = [
    profile_7_to_8,
    profile_8_to_9,
];

/**
 * Migration handler for INAV CLI backup data.
 * Transforms CLI commands from one INAV version to another using
 * JSON-based migration profiles that can be chained for multi-version jumps.
 */
const MigrationHandler = {

    /**
     * Extract the INAV version from a backup file's header comments.
     * Looks for "# Version: X.Y.Z" pattern.
     * @param {string} fileContent - Full backup file content
     * @returns {string|null} Semver version string or null
     */
    extractBackupVersion(fileContent) {
        const match = fileContent.match(/^#\s*Version:\s*(\S+)/m);
        if (!match) return null;
        const ver = match[1];
        return semver.valid(semver.coerce(ver));
    },

    /**
     * Build a chain of migration profiles to go from fromVersion to toVersion.
     * @param {string} fromVersion - Source version (semver)
     * @param {string} toVersion - Target version (semver)
     * @returns {object[]} Ordered array of profiles to apply, or empty if none needed
     */
    buildMigrationChain(fromVersion, toVersion) {
        if (!fromVersion || !toVersion) return [];

        const fromMajor = semver.major(fromVersion);
        const toMajor = semver.major(toVersion);

        if (fromMajor >= toMajor) return [];

        const chain = [];
        for (const profile of MIGRATION_PROFILES) {
            const profileFrom = parseInt(profile.fromVersion, 10);
            const profileTo = parseInt(profile.toVersion, 10);

            if (profileFrom >= fromMajor && profileTo <= toMajor) {
                chain.push(profile);
            }
        }

        chain.sort((a, b) => parseInt(a.fromVersion, 10) - parseInt(b.fromVersion, 10));

        return chain;
    },

    /**
     * Apply a single migration profile to a CLI command line.
     * @param {string} line - A single CLI command line (trimmed)
     * @param {object} profile - Migration profile object
     * @returns {{line: string|null, changes: string[]}} Transformed line (null = removed) and list of changes
     */
    _applyProfileToLine(line, profile) {
        const changes = [];
        let currentLine = line;

        const parts = currentLine.split(/\s+/);
        if (parts.length === 0) return { line: currentLine, changes };

        const command = parts[0].toLowerCase();

        // 1. Command renames
        if (profile.commandRenames) {
            const lowerParts = parts.map(p => p.toLowerCase());
            for (const [oldCmd, newCmd] of Object.entries(profile.commandRenames)) {
                const idx = lowerParts.indexOf(oldCmd);
                if (idx !== -1) {
                    parts[idx] = newCmd;
                    changes.push(`Command renamed: "${oldCmd}" → "${newCmd}"`);
                }
            }
            currentLine = parts.join(' ');
        }

        // 2. Check if this is a "set" command for setting-level operations
        if (command === 'set' && parts.length >= 3) {
            const settingName = parts[1].toLowerCase();

            // 2a. Removed settings — drop the entire line
            if (profile.removed && profile.removed.includes(settingName)) {
                changes.push(`Removed setting: "${settingName}"`);
                return { line: null, changes };
            }

            // 2b. Setting renames
            if (profile.settingRenames && profile.settingRenames[settingName]) {
                const newName = profile.settingRenames[settingName];
                parts[1] = newName;
                changes.push(`Setting renamed: "${settingName}" → "${newName}"`);
                currentLine = parts.join(' ');
            }

            // 2c. Value replacements
            if (profile.valueReplacements && profile.valueReplacements[settingName]) {
                const valueMap = profile.valueReplacements[settingName];
                const eqIdx = parts.indexOf('=');
                if (eqIdx !== -1 && eqIdx + 1 < parts.length) {
                    const oldValue = parts[eqIdx + 1];
                    if (valueMap[oldValue]) {
                        parts[eqIdx + 1] = valueMap[oldValue];
                        changes.push(`Value replaced: "${settingName}" value "${oldValue}" → "${valueMap[oldValue]}"`);
                        currentLine = parts.join(' ');
                    }
                }
            }
        }

        // 3. Setting pattern mappings
        if (command === 'set' && profile.settingPatternMappings && profile.settingPatternMappings.length > 0) {
            const settingName = parts[1] ? parts[1].toLowerCase() : '';
            for (const mapping of profile.settingPatternMappings) {
                if (new RegExp(mapping.pattern).test(settingName)) {
                    const eqIdx = parts.indexOf('=');
                    if (eqIdx !== -1 && eqIdx + 1 < parts.length) {
                        const oldVal = parts[eqIdx + 1];
                        if (mapping.valueMap[oldVal]) {
                            parts[eqIdx + 1] = mapping.valueMap[oldVal];
                            const desc = mapping.description || 'Setting value remapped';
                            changes.push(`${desc}: "${settingName}" ${oldVal} → ${mapping.valueMap[oldVal]}`);
                            currentLine = parts.join(' ');
                        }
                    }
                    break;
                }
            }
        }

        return { line: currentLine, changes };
    },

    /**
     * Migrate backup file content from one INAV version to another.
     * Applies all necessary migration profiles in chain.
     *
     * @param {string} fileContent - Full backup file content (with header)
     * @param {string} targetVersion - Target INAV version (semver)
     * @returns {{
     *   migratedContent: string,
     *   summary: {
     *     fromVersion: string,
     *     toVersion: string,
     *     profilesApplied: string[],
     *     totalChanges: number,
     *     removedSettings: string[],
     *     renamedSettings: string[],
     *     renamedCommands: string[],
     *     valueReplacements: string[],
     *     settingRemappings: string[],
     *     warnings: string[]
     *   }
     * }}
     */
    migrateBackupData(fileContent, targetVersion) {
        const fromVersion = this.extractBackupVersion(fileContent);

        const summary = {
            fromVersion: fromVersion || 'unknown',
            toVersion: targetVersion,
            profilesApplied: [],
            totalChanges: 0,
            removedSettings: [],
            renamedSettings: [],
            renamedCommands: [],
            valueReplacements: [],
            settingRemappings: [],
            warnings: [],
        };

        if (!fromVersion || !targetVersion) {
            return { migratedContent: fileContent, summary };
        }

        const chain = this.buildMigrationChain(fromVersion, targetVersion);

        if (chain.length === 0) {
            return { migratedContent: fileContent, summary };
        }

        for (const profile of chain) {
            summary.profilesApplied.push(`${profile.fromVersion} → ${profile.toVersion}: ${profile.description}`);
            if (profile.warnings) {
                summary.warnings.push(...profile.warnings);
            }
        }

        const lines = fileContent.split('\n');
        const migratedLines = [];

        for (const rawLine of lines) {
            const trimmed = rawLine.trim();

            if (trimmed.length === 0 || trimmed.startsWith('#')) {
                migratedLines.push(rawLine);
                continue;
            }

            const lower = trimmed.toLowerCase();
            if (lower === 'save' || lower === 'exit') {
                migratedLines.push(rawLine);
                continue;
            }

            let currentLine = trimmed;
            let lineRemoved = false;

            for (const profile of chain) {
                if (lineRemoved) break;

                const result = this._applyProfileToLine(currentLine, profile);

                if (result.line === null) {
                    lineRemoved = true;
                }  else {
                    currentLine = result.line;
                }

                for (const change of result.changes) {
                    summary.totalChanges++;
                    if (change.startsWith('Removed')) {
                        summary.removedSettings.push(change);
                    } else if (change.startsWith('Setting renamed')) {
                        summary.renamedSettings.push(change);
                    } else if (change.startsWith('Command renamed')) {
                        summary.renamedCommands.push(change);
                    } else if (change.startsWith('Value replaced')) {
                        summary.valueReplacements.push(change);
                    } else {
                        summary.settingRemappings.push(change);
                    }
                }
            }

            if (!lineRemoved) {
                migratedLines.push(currentLine);
            }
        }

        return {
            migratedContent: migratedLines.join('\n'),
            summary,
        };
    },

    /**
     * Check if migration is needed for the given backup content and target version.
     * @param {string} fileContent - Backup file content
     * @param {string} targetVersion - Target INAV version
     * @returns {boolean}
     */
    isMigrationNeeded(fileContent, targetVersion) {
        const fromVersion = this.extractBackupVersion(fileContent);
        if (!fromVersion || !targetVersion) return false;
        const chain = this.buildMigrationChain(fromVersion, targetVersion);
        return chain.length > 0;
    },

    /**
     * Check if there is a major version jump that is NOT fully covered by migration profiles.
     * Returns true when profiles are missing for one or more major version steps.
     * @param {string} fileContent - Backup file content
     * @param {string} targetVersion - Target INAV version (semver)
     * @returns {boolean}
     */
    hasMissingProfiles(fileContent, targetVersion) {
        const fromVersion = this.extractBackupVersion(fileContent);
        if (!fromVersion || !targetVersion) return false;

        const fromMajor = semver.major(semver.coerce(fromVersion));
        const toMajor = semver.major(semver.coerce(targetVersion));

        if (toMajor <= fromMajor) return false;

        const chain = this.buildMigrationChain(fromVersion, targetVersion);
        const coveredSteps = chain.length;
        const requiredSteps = toMajor - fromMajor;

        return coveredSteps < requiredSteps;
    },

    /**
     * Get all available migration profiles (for developer tools / UI).
     * @returns {object[]}
     */
    getAvailableProfiles() {
        return MIGRATION_PROFILES.map(p => ({
            from: p.fromVersion,
            to: p.toVersion,
            description: p.description,
        }));
    },

    /**
     * Format the migration summary for display.
     * @param {object} summary - Summary from migrateBackupData()
     * @returns {string} Human-readable summary text
     */
    formatSummary(summary) {
        if (summary.totalChanges === 0 && summary.warnings.length === 0) {
            return '';
        }

        const lines = [];
        lines.push(`Migration: ${summary.fromVersion} → ${summary.toVersion}`);

        if (summary.profilesApplied.length > 0) {
            lines.push(`Profiles: ${summary.profilesApplied.join(', ')}`);
        }

        if (summary.removedSettings.length > 0) {
            lines.push(`\nRemoved settings (${summary.removedSettings.length}):`);
            for (const r of summary.removedSettings) {
                lines.push(`  - ${r}`);
            }
        }

        if (summary.renamedSettings.length > 0) {
            lines.push(`\nRenamed settings (${summary.renamedSettings.length}):`);
            for (const r of summary.renamedSettings) {
                lines.push(`  - ${r}`);
            }
        }

        if (summary.renamedCommands.length > 0) {
            lines.push(`\nRenamed commands (${summary.renamedCommands.length}):`);
            for (const r of summary.renamedCommands) {
                lines.push(`  - ${r}`);
            }
        }

        if (summary.valueReplacements.length > 0) {
            lines.push(`\nValue replacements (${summary.valueReplacements.length}):`);
            for (const r of summary.valueReplacements) {
                lines.push(`  - ${r}`);
            }
        }

        if (summary.settingRemappings.length > 0) {
            lines.push(`\nSetting remappings (${summary.settingRemappings.length}):`);
            for (const r of summary.settingRemappings) {
                lines.push(`  - ${r}`);
            }
        }

        if (summary.warnings.length > 0) {
            lines.push(`\nWarnings:`);
            for (const w of summary.warnings) {
                lines.push(`  ⚠ ${w}`);
            }
        }

        return lines.join('\n');
    },

    /**
     * Create an empty migration summary object.
     * Useful when no migration profiles exist but a summary structure is needed.
     * @param {string} fromVersion
     * @param {string} toVersion
     * @param {string} migratedContent - The (unmodified) backup content
     * @returns {{migratedContent: string, summary: object}}
     */
    createEmptyResult(fromVersion, toVersion, migratedContent) {
        return {
            migratedContent,
            summary: {
                fromVersion: fromVersion || 'unknown',
                toVersion: toVersion || 'unknown',
                profilesApplied: [],
                totalChanges: 0,
                removedSettings: [],
                renamedSettings: [],
                renamedCommands: [],
                valueReplacements: [],
                settingRemappings: [],
                warnings: [],
            },
        };
    },
};

export default MigrationHandler;
