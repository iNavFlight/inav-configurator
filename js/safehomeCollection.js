/*global ServoMixRule*/
'use strict';

let SafehomeCollection = function () {

    let self = {},
        data = [],
        maxSafehomeCount = 8;

    self.setMaxSafehomeCount = function (value) {
        maxSafehomeCount = value;
    };

    self.getMaxSafehomeCount = function () {
        return maxSafehomeCount;
    }

    self.put = function (element) {
        data.push(element);
    };

    self.get = function () {
        return data;
    };
    
    self.clean = function (index){
        data[index].cleanup();
    };

    self.flush = function () {
        data = [];
    };

    self.inflate = function () {
        while (self.hasFreeSlots()) {
            self.put(new Safehome(0, 0, 0, 0));
        }
    };

    self.hasFreeSlots = function () {
        return data.length < self.getMaxSafehomeCount();
    };

    self.isSafehomeConfigured = function(safehomeId) {

        for (let safehomeIndex in data) {
            if (data.hasOwnProperty(safehomeIndex)) {
                let safehome = data[safehomeIndex];

                if (safehome.getNumber() == safehomeId && safehome.isUsed()) {
                    return true;
                }
            }
        }
        return false;
    };

    self.getNumberOfConfiguredSafehome = function () {
        let count = 0;
        for (let i = 0; i < self.getMaxSafehomeCount(); i ++) {
            if (self.isSafehomeConfigured(i)) {
                count++;
            }
        }
        return count;
    };

    self.getUsedSafehomeIndexes = function () {
        let out = [];

        for (let safehomeIndex in data) {
            if (data.hasOwnProperty(safehomeIndex)) {
                let safehome = data[safehomeIndex];
                out.push(safehome.getNumber());
            }
        }

        let unique = [...new Set(out)];

        return unique.sort(function(a, b) {
            return a-b;
        });
    }

    return self;
};