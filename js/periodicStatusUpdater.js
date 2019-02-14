'use strict';

var helper = helper || {};

helper.periodicStatusUpdater = (function () {

    var publicScope = {},
        privateScope = {};

    /**
     *
     * @param {number=} baudSpeed
     * @returns {number}
     */
    publicScope.getUpdateInterval = function (baudSpeed) {

        if (!baudSpeed) {
            baudSpeed = 115200;
        }

        if (baudSpeed >= 115200) {
            return 300;
        } else if (baudSpeed >= 57600) {
            return 600;
        } else if (baudSpeed >= 38400) {
            return 800;
        } else {
            return 1000;
        }
    };

    privateScope.updateView = function () {

        var active = ((Date.now() - MSP.analog_last_received_timestamp) < publicScope.getUpdateInterval(serial.bitrate) * 3);

        if (FC.isModeEnabled('ARM'))
            $(".armedicon").css({
                'background-image': 'url("../images/icons/cf_icon_armed_active.svg")'
            });
        else
            $(".armedicon").css({
                'background-image': 'url("../images/icons/cf_icon_armed_grey.svg")'
            });
        if (FC.isModeEnabled('FAILSAFE'))
            $(".failsafeicon").css({
                'background-image': 'url("../images/icons/cf_icon_failsafe_active.svg")'
            });
        else
            $(".failsafeicon").css({
                'background-image': 'url("../images/icons/cf_icon_failsafe_grey.svg")'
            });

        if (ANALOG != undefined) {
            var nbCells;

            if (semver.gte(CONFIG.flightControllerVersion, '1.8.1')) {
                nbCells = ANALOG.cell_count;
            } else {
                nbCells = Math.floor(ANALOG.voltage / MISC.vbatmaxcellvoltage) + 1;
                if (ANALOG.voltage == 0)
                    nbCells = 1;
            }

            var min = MISC.vbatmincellvoltage * nbCells;
            var max = MISC.vbatmaxcellvoltage * nbCells;
            var warn = MISC.vbatwarningcellvoltage * nbCells;

            if (semver.gte(CONFIG.flightControllerVersion, '1.8.1')) {
                $(".battery-status").css({
                    width: ANALOG.battery_percentage + "%",
                    display: 'inline-block'
                });
            } else {
                $(".battery-status").css({
                    width: ((ANALOG.voltage - min) / (max - min) * 100) + "%",
                    display: 'inline-block'
                });
            }

            if (active) {
                $(".linkicon").css({
                    'background-image': 'url("../images/icons/cf_icon_link_active.svg")'
                });
            } else {
                $(".linkicon").css({
                    'background-image': 'url("../images/icons/cf_icon_link_grey.svg")'
                });
            }

            if (((semver.gte(CONFIG.flightControllerVersion, '1.8.1')) && (((ANALOG.use_capacity_thresholds) && (ANALOG.battery_remaining_capacity <= (MISC.battery_capacity_warning - MISC.battery_capacity_critical))) || ((!ANALOG.use_capacity_thresholds) && (ANALOG.voltage < warn))) || (ANALOG.voltage < min)) || ((semver.lt(CONFIG.flightControllerVersion, '1.8.1')) && (ANALOG.voltage < warn))) {
                $(".battery-status").css('background-color', '#D42133');
            } else {
                $(".battery-status").css('background-color', '#59AA29');
            }

            $(".battery-legend").text(ANALOG.voltage + " V");
        }

        $('#quad-status_wrapper').show();
    };

    publicScope.run = function () {

        if (!CONFIGURATOR.connectionValid) {
            return;
        }

        $(".quad-status-contents").css({
            display: 'inline-block'
        });

        if (GUI.active_tab != 'cli') {

            if (helper.mspQueue.shouldDropStatus()) {
                return;
            }

            if (semver.gte(CONFIG.flightControllerVersion, "1.5.0")) {
                MSP.send_message(MSPCodes.MSP_SENSOR_STATUS, false, false);
            }

            if (semver.gte(CONFIG.flightControllerVersion, "2.0.0")) {
                MSP.send_message(MSPCodes.MSPV2_INAV_STATUS, false, false);
            } else {
                MSP.send_message(MSPCodes.MSP_STATUS_EX, false, false);
            }

            MSP.send_message(MSPCodes.MSP_ACTIVEBOXES, false, false);

            if (semver.gte(CONFIG.flightControllerVersion, '1.8.1')) {
                MSP.send_message(MSPCodes.MSPV2_INAV_ANALOG, false, false);
            } else {
                MSP.send_message(MSPCodes.MSP_ANALOG, false, false);
            }

            privateScope.updateView();
        }
    };

    return publicScope;
})();
