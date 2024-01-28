'use strict';

var CONFIGURATOR = {
     // all versions are specified and compared using semantic versioning http://semver.org/
    'minfirmwareVersionAccepted': '7.0.0',
    'maxFirmwareVersionAccepted': '8.0.0', // Condition is < (lt) so we accept all in 7.x branch
    'connectionValid': false,
    'connectionValidCliOnly': false,
    'cliActive': false,
    'cliValid': false,
    'connection': false
};
