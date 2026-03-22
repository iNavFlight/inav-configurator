'use strict';

import semver from 'semver';

import { GUI } from './gui';
import jBox from 'jbox';
import i18n from './localization';
import platform from './platform';

var appUpdater = appUpdater || {};

appUpdater.checkRelease = function (currVersion) {
    if (platform.isWeb) {
        return;
    }

    const currentVersion = semver.coerce(currVersion);
    if (!currentVersion) {
        return;
    }

    var modalStart;
    $.get('https://api.github.com/repos/iNavFlight/inav-configurator/releases/latest', function (releaseData) {
        GUI.log(i18n.getMessage('loadedReleaseInfo'));

        let newVersion = releaseData.tag_name;
        let newPrerelase = releaseData.prerelease;
        const latestVersion = semver.coerce(newVersion);

        if (newPrerelase == false && latestVersion && semver.gt(latestVersion, currentVersion)) {
            GUI.log(newVersion, platform.app.getVersion());
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
