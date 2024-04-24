'use strict';

const ServoMixRule = require('./servoMixRule');

var ServoMixerRuleCollection = function () {

    let self = {},
        data = [],
        inactiveData = [],
        maxServoCount = 16;

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
        if (data.length < self.getServoRulesCount()) {
            data.push(element);
        }else{
            inactiveData.push(element); //store the data for mixer_profile 2
        }
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
        inactiveData = [];
    };

    self.cleanup = function () {
        var tmpData = [];
        var tmpInactiveData = [];
        data.forEach(function (element) {
            if (element.isUsed()) {
                tmpData.push(element);
            }
        });
        inactiveData.forEach(function (element) {
            if (element.isUsed()) {
                tmpInactiveData.push(element);
            }
        });
        data = tmpData;
        inactiveData = tmpInactiveData;
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
        for (let ruleIndex in inactiveData) {
            if (inactiveData.hasOwnProperty(ruleIndex)) {
                let rule = inactiveData[ruleIndex];

                if (rule.getTarget() == servoId && rule.isUsed()) {
                    return true;
                }
            }
        }
        return false;
    };

    self.getServoMixRuleFromTarget = function(wantedTarget) {
        let returnTarget = null;

        for (let ruleIndex in data) {
            if (data.hasOwnProperty(ruleIndex)) {
                if (data[ruleIndex].getTarget() == wantedTarget) {
                    returnTarget = data[ruleIndex];
                    break;
                }
            }
        }

        return returnTarget;
    }

    self.getNumberOfConfiguredServos = function () {
        let count = 0;
        for (let i = 0; i < self.getServoCount(); i ++) {
            if (self.isServoConfigured(i)) {
                count++;
            }
        }
        return count;
    };

    self.getUsedServoIndexes = function () {
        let out = [];

        for (let ruleIndex in data) {
            if (data.hasOwnProperty(ruleIndex)) {
                let rule = data[ruleIndex];
                out.push(rule.getTarget());
            }
        }
        for (let ruleIndex in inactiveData) {
            if (inactiveData.hasOwnProperty(ruleIndex)) {
                let rule = inactiveData[ruleIndex];
                out.push(rule.getTarget());
            }
        }


        let minIndex = Math.min(...out);
        let maxIndex = Math.max(...out);
        return Array.from({ length: maxIndex - minIndex + 1 }, (_, index) => minIndex + index);
    }

    self.getNextUnusedIndex = function() {
        let nextTarget = 0;

        for (let ruleIndex in data) {
            if (data.hasOwnProperty(ruleIndex)) {
                let target = data[ruleIndex].getTarget();
                if (target > nextTarget) {
                    nextTarget = target;
                }
            }
        }

        return nextTarget+1;
    }

    return self;
};

module.exports = ServoMixerRuleCollection;