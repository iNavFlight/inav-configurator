'use strict';

var CONFIGURATOR = {
     // all versions are specified and compared using semantic versioning http://semver.org/
    'minfirmwareVersionAccepted': '4.1.0',
    'maxFirmwareVersionAccepted': '6.0.0', // Condition is < (lt) so we accept all in 4.x branch
    'connectionValid': false,
    'connectionValidCliOnly': false,
    'cliActive': false,
    'cliValid': false,
    'connection': false
};
