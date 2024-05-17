'use strict';

const mspHelper = require('./msp/MSPHelper');
const serialPortHelper = require('./serialPortHelper');

const wizardUiBindings = (function () {

    let self = {};

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