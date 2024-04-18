'use strict';

const MotorMixRule = require('./motorMixRule');

var MotorMixerRuleCollection = function () {

    let self = {},
        data = [],
        inactiveData = [],
        maxMotorCount = 8;

    self.setMotorCount = function (value) {
        maxMotorCount = value;
    };

    self.getMotorCount = function () {
        return maxMotorCount;
    };

    self.put = function (element) {
        if (data.length < self.getMotorCount()){
            data.push(element);            
        }else{
            inactiveData.push(element); //store the data for mixer_profile 2
        }
    };

    self.get = function () {
        return data;
    };

    self.drop = function (index) {
        data[index].setThrottle(0);
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
            self.put(new MotorMixRule(0, 0, 0, 0));
        }
    };

    self.hasFreeSlots = function () {
        return data.length < self.getMotorCount();
    };

    self.getNumberOfConfiguredMotors = function () {
        return data.length > inactiveData.length ? data.length : inactiveData.length;
    };

    return self;
};

module.exports = MotorMixerRuleCollection;
