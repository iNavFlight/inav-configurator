'use strict';

var CONFIGURATOR = {
     // all versions are specified and compared using semantic versioning http://semver.org/
    'minfirmwareVersionAccepted': '2.1.0',
    'maxFirmwareVersionAccepted': '2.3.0', // COndition is < (lt) so we accept all in 2.2 branch, not 2.3 actualy
    'connectionValid': false,
    'connectionValidCliOnly': false,
    'cliActive': false,
    'cliValid': false
};
