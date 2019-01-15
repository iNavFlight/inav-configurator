'use strict';

var helper = helper || {};

helper.task = (function () {

    var publicScope = {},
        privateScope = {};

    privateScope.getStatusPullInterval = function () {
        //TODO use serial connection speed to determine update interval
        return 250;
    };

    publicScope.statusPullStart = function () {
        helper.interval.add('status_pull', function () {
            MSP.send_message(MSPCodes.MSP_STATUS, false, false, function () {
                MSP.send_message(MSPCodes.MSP_SENSOR_STATUS);
            });

        }, privateScope.getStatusPullInterval(), true);
    };

    return publicScope;
})();