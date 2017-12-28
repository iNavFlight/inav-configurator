'use strict';

var appUpdater = appUpdater || {};

appUpdater.checkRelease = function (currVersion) {
    var modalStart;
    $.get('https://api.github.com/repos/iNavFlight/inav-configurator/releases', function (releaseData) {
        GUI.log('Loaded release information from GitHub.');
        //Git return sorted list, 0 - last release
        if (semver.gt(releaseData[0].tag_name, currVersion)) {
            GUI.log(releaseData[0].tag_name, chrome.runtime.getManifest().version);
            GUI.log(currVersion);

            //For download zip
            // releaseData[0].assets.forEach(function(item, i) {
            //     if (str.indexOf(item.name) !== -1) {
            //         console.log(item);
            //         downloadUrl = item.browser_download_url;
            //     }
            // });

            GUI.log('New version aviable!');
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