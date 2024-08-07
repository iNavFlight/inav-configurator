
'use strict';

var MSPChainerClass = function () {

    var self = {};

    self.chain = [];
    self.exitPoint = null;
    self.chainIndex = 0;

    self.setChain = function (chain) {
        self.chain = chain;
    };

    self.setExitPoint = function (exitPoint) {
        self.exitPoint = exitPoint;
    };

    self.returnCallback = function () {
        self.chainIndex++;
        if (self.chain[self.chainIndex]) {
            self.chain[self.chainIndex](self.returnCallback);
        } else if (self.exitPoint) {
            self.exitPoint();
        }
    };

    self.execute = function () {
        self.chainIndex = 0;
        self.chain[self.chainIndex](self.returnCallback);
    };

    return self;
};

module.exports = MSPChainerClass;