/*global $, ServoMixRule*/
'use strict';

var ServoMixerRuleCollection = function () {

    var self = {};
    var data = [];

    self.put = function (element) {
        data.push(element);
    };

    self.get = function () {
        return data;
    };

    self.drop = function (index) {
        data[index].setRate(0);
        self.cleanup();
    };

    self.flush = function () {
        data = [];
    };

    self.cleanup = function () {
        var tmpData = [];

        data.forEach(function (element) {
            if (element.isUsed()) {
                tmpData.push(element);
            }
        });

        data = tmpData;
    };

    self.inflate = function () {
        while (self.hasFreeSlots()) {
            self.put(new ServoMixRule(0, 0, 0, 0));
        }
    };

    self.hasFreeSlots = function () {
        return data.length < 16;
    };

    return self;
};