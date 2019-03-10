/*global ServoMixRule*/
'use strict';

let ServoMixerRuleCollection = function () {

    let self = {},
        data = [],
        maxServoCount = 8;

    self.setServoCount = function (value) {
        maxServoCount = value;
    };

    self.getServoCount = function () {
        return maxServoCount;
    }

    self.getServoRulesCount = function () {
        return self.getServoCount() * 2;
    }

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
        return data.length < self.getServoRulesCount();
    };

    self.isServoConfigured = function(servoId) {

        for (let ruleIndex in data) {
            if (data.hasOwnProperty(ruleIndex)) {
                let rule = data[ruleIndex];

                if (rule.getTarget() == servoId && rule.isUsed()) {
                    return true;
                }
            }
        }
        return false;
    }

    return self;
};