'use strict';

import GUI from './gui';
import FC from './fc';
import CONFIGURATOR from './data_storage';
import MSP from './msp';
import MSPCodes from './msp/MSPCodes';

// The FC's isMspConfigActive() lapses 1000 ms after the last MSP_SENSOR_STATUS, so a telemetry-fed tunnel polls it at 2 Hz.
const TUNNEL_SENSOR_STATUS_INTERVAL_MS = 500;
const TUNNEL_STATUS_INTERVAL_MS = 1000;

 var periodicStatusUpdater = (function () {

    var publicScope = {},
        privateScope = {};

    var stoppped = false;
    var tunnelRunCount = 0;

    /**
     *
     * @param {number=} baudSpeed
     * @returns {number}
     */
    publicScope.getUpdateInterval = function (baudSpeed) {

        if (CONFIGURATOR.mavlinkTunnelActive) {
            // phase-2 A/B: without the telemetry feed the tunnel keeps phase 1's single 1 Hz run.
            return CONFIGURATOR.mavlinkTelemetryFeed ? TUNNEL_SENSOR_STATUS_INTERVAL_MS : TUNNEL_STATUS_INTERVAL_MS;
        }

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

        var active = ((Date.now() - MSP.analog_last_received_timestamp) < privateScope.analogFreshWindowMs());

        if (FC.isModeEnabled('ARM')) {
            $("#armedIcon").removeClass('armed');
            $("#armedIcon").addClass('armed-active');
        } else {
            $("#armedIcon").removeClass('armed-active');
            $("#armedIcon").addClass('armed');
        }
        if (FC.isModeEnabled('FAILSAFE')) {
            $("#failsafeicon").removeClass('failsafe');
            $("#failsafeicon").addClass('failsafe-active');
        } else {
            $("#failsafeicon").removeClass('failsafe-active');
            $("#failsafeicon").addClass('failsafe');
        }

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
                $("#linkicon").removeClass('link');
                $("#linkicon").addClass('link-active');
            } else {
                $("#linkicon").removeClass('link-active');
                $("#linkicon").addClass('link');
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

    privateScope.analogFreshWindowMs = function () {
        const interval = CONFIGURATOR.mavlinkTunnelActive ? TUNNEL_STATUS_INTERVAL_MS : publicScope.getUpdateInterval(CONFIGURATOR.connection.bitrate);
        return interval * 3;
    };

    // Only every second tunnel run polls the rest, which keeps them at 1 Hz.
    privateScope.skipSlowStatus = function () {
        // phase-2 A/B: gated on the feed flag.
        if (!CONFIGURATOR.mavlinkTunnelActive || !CONFIGURATOR.mavlinkTelemetryFeed) {
            return false;
        }
        tunnelRunCount = (tunnelRunCount + 1) % (TUNNEL_STATUS_INTERVAL_MS / TUNNEL_SENSOR_STATUS_INTERVAL_MS);
        return tunnelRunCount !== 1;
    };

    publicScope.run = function () {

        if (!CONFIGURATOR.connectionValid) {
            return;
        }

        $(".quad-status-contents").css({
            display: 'inline-block'
        });

        if (!stoppped && !CONFIGURATOR.cliActive) {

            MSP.send_message(MSPCodes.MSP_SENSOR_STATUS, false, false);
            if (privateScope.skipSlowStatus()) {
                return;
            }
            MSP.send_message(MSPCodes.MSPV2_INAV_STATUS, false, false);
            // MSPV2_INAV_STATUS carries the same box bitmask; a tunnel request per poll is not free.
            if (!CONFIGURATOR.mavlinkTunnelActive) {
                MSP.send_message(MSPCodes.MSP_ACTIVEBOXES, false, false);
            }
            MSP.send_message(MSPCodes.MSPV2_INAV_ANALOG, false, false);
            

            privateScope.updateView();
        }
    };

    // A new session starts with a full run.
    publicScope.resetTunnelCycle = function () {
        tunnelRunCount = 0;
    };

    publicScope.stop = function() {
        stoppped = true;
    }

    publicScope.resume = function() {
        stoppped = false;
    }

    return publicScope;
})();

export default periodicStatusUpdater;
