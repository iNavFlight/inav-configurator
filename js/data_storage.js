'use strict';

var CONFIGURATOR = {
     // all versions are specified and compared using semantic versioning http://semver.org/
    'minfirmwareVersionAccepted': '8.0.0',
    'maxFirmwareVersionAccepted': '10.0.0', // Condition is < (lt) so we accept all in 8.x branch
    'connectionValid': false,
    'connectionValidCliOnly': false,
    'cliActive': false,
    'cliValid': false,
    'connection': false
};

export default CONFIGURATOR;
