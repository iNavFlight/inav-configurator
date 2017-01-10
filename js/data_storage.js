'use strict';

var CONFIGURATOR = {
    'releaseDate': 1478083274093, // new Date().getTime() - Wed Nov 02 2016 20:41:30 GMT+1000

     // all versions are specified and compared using semantic versioning http://semver.org/
    'apiVersionAccepted': '1.2.1',
    'backupRestoreMinApiVersionAccepted': '1.5.0',

    'backupFileMinVersionAccepted': '0.55.0', // chrome.runtime.getManifest().version is stored as string, so does this one

    'connectionValid': false,
    'connectionValidCliOnly': false,
    'cliActive': false,
    'cliValid': false
};
