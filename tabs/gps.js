'use strict';

TABS.gps = {};
TABS.gps.initialize = function (callback) {

    if (GUI.active_tab != 'gps') {
        GUI.active_tab = 'gps';
        googleAnalytics.sendAppView('GPS');
    }

    function load_html() {
        $('#content').load("./tabs/gps.html", process_html);
    }

    load_html();

    function process_html() {
        localize();

        function get_raw_gps_data() {
            MSP.send_message(MSPCodes.MSP_RAW_GPS, false, false, get_comp_gps_data);
        }

        function get_comp_gps_data() {
            MSP.send_message(MSPCodes.MSP_COMP_GPS, false, false, get_gpsstatistics_data);
        }

        function get_gpsstatistics_data() {
            MSP.send_message(MSPCodes.MSP_GPSSTATISTICS, false, false, update_ui);
        }

        function update_ui() {

            if (GPS_DATA.fix > 0) {
                $('#loadmap').show();
                $('#waiting').hide();
            } else {
                $('#loadmap').hide();
                $('#waiting').show();
            }

            var lat = GPS_DATA.lat / 10000000;
            var lon = GPS_DATA.lon / 10000000;

            var gpsFixType = chrome.i18n.getMessage('gpsFixNone');
            if (GPS_DATA.fix >= 2)
                gpsFixType = chrome.i18n.getMessage('gpsFix3D');
            else if (GPS_DATA.fix >= 1)
                gpsFixType = chrome.i18n.getMessage('gpsFix2D');

            $('.GPS_info td.fix').html(gpsFixType);
            $('.GPS_info td.alt').text(GPS_DATA.alt + ' m');
            $('.GPS_info td.lat').text(lat.toFixed(4) + ' deg');
            $('.GPS_info td.lon').text(lon.toFixed(4) + ' deg');
            $('.GPS_info td.speed').text(GPS_DATA.speed + ' cm/s');
            $('.GPS_info td.sats').text(GPS_DATA.numSat);
            $('.GPS_info td.distToHome').text(GPS_DATA.distanceToHome + ' m');

            var gpsRate = 0;
            if (GPS_DATA.messageDt > 0) {
                gpsRate = 1000 / GPS_DATA.messageDt;
            }

            $('.GPS_stat td.messages').text(GPS_DATA.packetCount);
            $('.GPS_stat td.rate').text(gpsRate.toFixed(1) + ' Hz');
            $('.GPS_stat td.errors').text(GPS_DATA.errors);
            $('.GPS_stat td.timeouts').text(GPS_DATA.timeouts);
            $('.GPS_stat td.eph').text((GPS_DATA.eph / 100).toFixed(2) + ' m');
            $('.GPS_stat td.epv').text((GPS_DATA.epv / 100).toFixed(2) + ' m');
            $('.GPS_stat td.hdop').text((GPS_DATA.hdop / 100).toFixed(2));

            var message = {
                action: 'update',
                lat: lat,
                lon: lon
            };

            var frame = document.getElementById('map');

            frame.contentWindow.postMessage(message, '*');
        }

        /*
         * enable data pulling
         * GPS is usually refreshed at 5Hz, there is no reason to pull it much more often, really...
         */
        helper.mspBalancedInterval.add('gps_pull', 200, 3, function gps_update() {
            // avoid usage of the GPS commands until a GPS sensor is detected for targets that are compiled without GPS support.
            if (!have_sensor(CONFIG.activeSensors, 'gps')) {
                update_ui();
                return;
            }

            if (helper.mspQueue.shouldDrop()) {
                return;
            }

            get_raw_gps_data();
        });

        GUI.content_ready(callback);
    }

};

TABS.gps.cleanup = function (callback) {
    if (callback) callback();
};