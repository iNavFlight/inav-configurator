'use strict';

const mspHelper = require('./msp/MSPHelper');
const serialPortHelper = require('./serialPortHelper');
const FC = require('./fc');

const wizardUiBindings = (function () {

    let self = {};

    self.gps = function ($context) {
        mspHelper.loadFeatures(mspHelper.loadSerialPorts(function () {
        
            let $port = $('#wizard-gps-port');
            let $baud = $('#wizard-gps-baud');
            let $protocol = $('#wizard-gps-protocol');

            let ports = serialPortHelper.getPortIdentifiersForFunction('GPS');

            let currentPort = null;

            if (ports.length == 1) {
                currentPort = ports[0];
            }

            let availablePorts = serialPortHelper.getPortList();
            $port.append('<option value="-1">None</option>');
            for (let i = 0; i < availablePorts.length; i++) {
                let port = availablePorts[i];
                $port.append('<option value="' + port.identifier + '">' + port.displayName + '</option>');
            }

            serialPortHelper.getBauds('SENSOR').forEach(function (baud) {
                $baud.append('<option value="' + baud + '">' + baud + '</option>');
            });

            let gpsProtocols = FC.getGpsProtocols();
            for (let i = 0; i < gpsProtocols.length; i++) {
                $protocol.append('<option value="' + i + '">' + gpsProtocols[i] + '</option>');
            }

            if (currentPort !== null) {
                $port.val(currentPort);
            } else {
                $port.val(-1);
            }

            $port.on('change', function () {
                let port = $(this).val();
                
                $baud.val(serialPortHelper.getRuleByName('GPS').defaultBaud);
                if (port == -1) {
                    $('#wizard-gps-baud-container').hide();
                    $('#wizard-gps-protocol-container').hide();
                } else {
                    $('#wizard-gps-baud-container').show();
                    $('#wizard-gps-protocol-container').show();
                }
            }).trigger('change');

        }));
        
    };

    self.receiver = function ($content) {

        mspHelper.loadSerialPorts(function () {
            let $receiverPort = $content.find('#wizard-receiver-port');
            let ports = serialPortHelper.getPortIdentifiersForFunction('RX_SERIAL');
            let currentPort = null;

            if (ports.length > 0) {
                currentPort = ports[0];
            }

            let availablePorts = serialPortHelper.getPortList();

            $receiverPort.append('<option value="-1">NONE</option>');
            for (let i = 0; i < availablePorts.length; i++) {
                let port = availablePorts[i];
                $receiverPort.append('<option value="' + port.identifier + '">' + port.displayName + '</option>');
            }

            if (currentPort !== null) {
                $receiverPort.val(currentPort);
            } else {
                $receiverPort.val(-1);
            }
        });

    }

    return self;
})();

module.exports = wizardUiBindings;