'use strict';

import semver from 'semver';

const configuratorMajor = semver.major(window.electronAPI.appGetVersion());

var CONFIGURATOR = {
     // all versions are specified and compared using semantic versioning http://semver.org/
    'minfirmwareVersionAccepted': `${configuratorMajor}.0.0`,
    'maxFirmwareVersionAccepted': `${configuratorMajor + 1}.0.0`, // Condition is < (lt)
    'connectionValid': false,
    'connectionValidCliOnly': false,
    'cliActive': false,
    'cliValid': false,
    'connection': false
};

export default CONFIGURATOR;
