'use strict';

const semver = require('semver');

const { GUI } = require('./gui');
const jBox = require('./libraries/jBox/jBox.min');
const i18n = require('./localization');

var appUpdater = appUpdater || {};

appUpdater.checkRelease = function (currVersion) {
    var modalStart;
    $.get('https://api.github.com/repos/iNavFlight/inav-configurator/releases/latest', function (releaseData) {
        GUI.log(i18n.getMessage('loadedReleaseInfo'));

        let newVersion = releaseData.tag_name;
        let newPrerelase = releaseData.prerelease;

        if (newPrerelase == false && semver.gt(newVersion, currVersion)) {
            GUI.log(newVersion, app.getVersion());
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

module.exports = appUpdater;
