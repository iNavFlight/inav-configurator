'use strict';

/**
 * This module is a queue for deduplication of MSP requests.
 * We do not want to process the same request multiple times unless response is received.
 * This improves wireless handling and lower amount of data that is put on the air
 */
var mspDeduplicationQueue = function() {

    let publicScope = {},
        privateScope = {};

    privateScope.queue = [];

    publicScope.put = function(item) {
        privateScope.queue.push(item);
    };

    publicScope.remove = function(item) {
        const index = privateScope.queue.indexOf(item);
        if (index > -1) {
            privateScope.queue.splice(index, 1);
        }
    };

    publicScope.check = function(item) {
        return privateScope.queue.includes(item);
    };

    publicScope.flush = function() {
        privateScope.queue = [];
    };

    publicScope.get = function() {
        return privateScope.queue;
    };

    return publicScope;
}();

module.exports = mspDeduplicationQueue;