'use strict';

var appUpdater = appUpdater || {};

appUpdater.checkRelease = function (currVersion) {
    var modalStart;
    $.get('https://api.github.com/repos/iNavFlight/inav-configurator/releases', function (releaseData) {
        GUI.log('Loaded release information from GitHub.');
        //Git return sorted list, 0 - last release

        let newVersion = releaseData[0].tag_name;
        let newPrerelase = releaseData[0].prerelease;

        if (newPrerelase == false && semver.gt(newVersion, currVersion)) {
            GUI.log(newVersion, chrome.runtime.getManifest().version);
            GUI.log(currVersion);

            GUI.log('New version available!');
            modalStart = new jBox('Modal', {
                width: 400,
                height: 200,
                animation: false,
                closeOnClick: false,
                closeOnEsc: true,
                content: $('#appUpdateNotification')
            }).open();
        }
    });

    $('#update-notification-close').on('click', function () {
        modalStart.close();
    });
    $('#update-notification-download').on('click', function () {
        modalStart.close();
    });
};
