'use strict'

const CONFIGURATOR = require('./data_storage');
const FC = require('./fc');
const { globalSettings } = require('./globalSettings');
const i18n = require('./localization');

var update = {

    activatedTab: function() {
        var activeTab = $('#tabs > ul li.active');
        activeTab.removeClass('active');
        $('a', activeTab).trigger('click');
    },

    firmwareVersion: function() {
        if (CONFIGURATOR.connectionValid) {
            $('[data-firmware-version-info]').text(`[${FC.CONFIG.target}] ${FC.CONFIG.flightControllerVersion}`);
            globalSettings.docsTreeLocation = 'https://github.com/iNavFlight/inav/blob/' + FC.CONFIG.flightControllerVersion + '/docs/';

            // If this is a master branch firmware, this will find a 404 as there is no tag tree. So default to master for docs.
            $.ajax({
                url: globalSettings.docsTreeLocation + 'Settings.md',
                method: "HEAD",
                statusCode: {
                    404: function () {
                        globalSettings.docsTreeLocation = 'https://github.com/iNavFlight/inav/blob/master/docs/';
                    }
                }
            });
        } else {
            $('[data-firmware-version-info]').text(i18n.getMessage('fcNotConnected'));

            globalSettings.docsTreeLocation = 'https://github.com/iNavFlight/inav/blob/master/docs/';
        }
    }
};

module.exports = update;

