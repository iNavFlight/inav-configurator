'use strict';

const { GUI } = require('./gui');
const FC = require('./fc');
const CONFIGURATOR = require('./data_storage');
const MSP = require('./msp');
const MSPCodes = require('./msp/MSPCodes');
const mspQueue = require('./serial_queue');

 var periodicStatusUpdater = (function () {

    var publicScope = {},
        privateScope = {};

    var stoppped = false;

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

        var active = ((Date.now() - MSP.analog_last_received_timestamp) < publicScope.getUpdateInterval(CONFIGURATOR.connection.bitrate) * 3);

        if (FC.isModeEnabled('ARM'))
            $(".armedicon").css({
                'background-image': 'url("./images/icons/cf_icon_armed_active.svg")'
            });
        else
            $(".armedicon").css({
                'background-image': 'url("./images/icons/cf_icon_armed_grey.svg")'
            });
        if (FC.isModeEnabled('FAILSAFE'))
            $(".failsafeicon").css({
                'background-image': 'url("./images/icons/cf_icon_failsafe_active.svg")'
            });
        else
            $(".failsafeicon").css({
                'background-image': 'url("./images/icons/cf_icon_failsafe_grey.svg")'
            });

        if (FC.ANALOG != undefined) {
            var nbCells;

            nbCells = FC.ANALOG.cell_count;
            var min = FC.MISC.vbatmincellvoltage * nbCells;
            var max = FC.MISC.vbatmaxcellvoltage * nbCells;
            var warn = FC.MISC.vbatwarningcellvoltage * nbCells;

            $(".battery-status").css({
                width: FC.ANALOG.battery_percentage + "%",
                display: 'inline-block'
            });
        
            if (active) {
                $(".linkicon").css({
                    'background-image': 'url("./images/icons/cf_icon_link_active.svg")'
                });
            } else {
                $(".linkicon").css({
                    'background-image': 'url("./images/icons/cf_icon_link_grey.svg")'
                });
            }

            if (((FC.ANALOG.use_capacity_thresholds && FC.ANALOG.battery_remaining_capacity <= FC.MISC.battery_capacity_warning - FC.MISC.battery_capacity_critical) || (!FC.ANALOG.use_capacity_thresholds && FC.ANALOG.voltage < warn)) || FC.ANALOG.voltage < min) {
                $(".battery-status").css('background-color', '#D42133');
            } else {
                $(".battery-status").css('background-color', '#59AA29');
            }

            $(".battery-legend").text(FC.ANALOG.voltage + " V");
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

        if (!stoppped && GUI.active_tab != 'cli') {

            MSP.send_message(MSPCodes.MSP_SENSOR_STATUS, false, false);
            MSP.send_message(MSPCodes.MSPV2_INAV_STATUS, false, false);
            MSP.send_message(MSPCodes.MSP_ACTIVEBOXES, false, false);
            MSP.send_message(MSPCodes.MSPV2_INAV_ANALOG, false, false);
            

            privateScope.updateView();
        }
    };

    publicScope.stop = function() {
        stoppped = true;
    }

    publicScope.resume = function() {
        stoppped = false;
    }

    return publicScope;
})();

module.exports = periodicStatusUpdater;
