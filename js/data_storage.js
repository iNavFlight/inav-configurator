'use strict';

import semver from 'semver';

function firmwareVersionBound(majorOffset) {
    const major = semver.major(window.electronAPI.appGetVersion());
    return `${major + majorOffset}.0.0`;
}

var CONFIGURATOR = {
    'connectionValid': false,
    'connectionValidCliOnly': false,
    'cliActive': false,
    'cliValid': false,
    'connection': false
};

// all versions are specified and compared using semantic versioning http://semver.org/
// Computed lazily (not at module load) so importing this module doesn't require
// window.electronAPI to already exist, e.g. under plain-Node test harnesses.
Object.defineProperties(CONFIGURATOR, {
    'minfirmwareVersionAccepted': { get: () => firmwareVersionBound(0), enumerable: true },
    'maxFirmwareVersionAccepted': { get: () => firmwareVersionBound(1), enumerable: true }, // Condition is < (lt)
});

export default CONFIGURATOR;
