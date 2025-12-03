'use strict'

import CONFIGURATOR from './data_storage';
import FC from './fc';
import { globalSettings } from './globalSettings';
import i18n from './localization';
import bridge from './bridge';

var update = {

    activatedTab: function() {
        var activeTab = $('#tabs > ul li.active');
        activeTab.removeClass('active');
        $('a', activeTab).trigger('click');
    },

    firmwareVersion: function() {
        if (CONFIGURATOR.connectionValid) {
            $('#logo .firmware_version').text(FC.CONFIG.flightControllerVersion + " [" + FC.CONFIG.target + "]");
            globalSettings.docsTreeLocation = 'https://github.com/iNavFlight/inav/blob/' + FC.CONFIG.flightControllerVersion + '/docs/';
            globalSettings.configuratorTreeLocation = 'https://github.com/iNavFlight/inav-configurator/tree/' + FC.CONFIG.flightControllerVersion + '/';

            // If this is a master branch firmware, this will find a 404 as there is no tag tree. So default to master for docs.
            $.ajax({
                url: bridge.proxy(globalSettings.docsTreeLocation + 'Settings.md'),
                method: "HEAD",
                statusCode: {
                    404: function () {
                        globalSettings.docsTreeLocation = 'https://github.com/iNavFlight/inav/blob/master/docs/';
                    }
                }
            });
        } else {
            $('#logo .firmware_version').text(i18n.getMessage('fcNotConnected'));

            globalSettings.docsTreeLocation = 'https://github.com/iNavFlight/inav/blob/master/docs/';
        }
    }
};

export default update;

