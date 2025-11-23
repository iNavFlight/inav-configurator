'use strict';

import semver from 'semver';

import { GUI } from './gui';
import jBox from 'jbox';
import i18n from './localization';

var appUpdater = appUpdater || {};

appUpdater.checkRelease = function (currVersion) {
    var modalStart;
    $.get('https://api.github.com/repos/iNavFlight/inav-configurator/releases/latest', function (releaseData) {
        GUI.log(i18n.getMessage('loadedReleaseInfo'));

        let newVersion = releaseData.tag_name;
        let newPrerelase = releaseData.prerelease;

        if (newPrerelase == false && semver.gt(newVersion, currVersion)) {
            
            window.electronAPI.appGetVersion().then(currentVersion => {
                GUI.log(newVersion, currentVersion);
                GUI.log(currVersion);

                GUI.log(i18n.getMessage('newVersionAvailable'));
                modalStart = new jBox('Modal', {
                    width: 400,
                    height: 200,
                    animation: false,
                    closeOnClick: false,
                    closeOnEsc: true,
                    content: $('#appUpdateNotification')
                }).open();
            });
        }
    });

    $('#update-notification-close').on('click', function () {
        modalStart.close();
    });
    $('#update-notification-download').on('click', function () {
        modalStart.close();
    });
};

export default appUpdater;
