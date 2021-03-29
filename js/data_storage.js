'use strict';

var CONFIGURATOR = {
     // all versions are specified and compared using semantic versioning http://semver.org/
    'minfirmwareVersionAccepted': '2.6.0',
    'maxFirmwareVersionAccepted': '3.1.0', // Condition is < (lt) so we accept all in 2.2 branch, not 2.3 actualy
    'connectionValid': false,
    'connectionValidCliOnly': false,
    'cliActive': false,
    'cliValid': false
};
