'use strict';

const BitHelper = require('./bitHelper');

let FwApproachCollection = function () {

    let self = {},
        data = [],
        maxFwApproachCount = 17;

    self.setMaxFwApproachCount = function (value) {
        maxFwApproachCount = value;
    };

    self.getMaxFwApproachCount = function () {
        return maxFwApproachCount;
    }

    self.put = function (element) {
        element.setNumber(data.length);
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

    self.isEmpty = () => {
        return data.length == 0;
    };

    self.fwApproachCount = () => {
        return data.length;
    }

    self.drop = (idx) => {
        data.forEach(f => {
            if (f.getNumber() >= idx) {
                f.setNumber(f.getNumber() - 1);
            }
        });   
        data.splice(idx, 1);
    }

    self.insert = (fwApprach, idx) => {
        data.forEach(f => {
            if (f.getNumber() >= idx) {
                f.setNumber(f.getNumber() + 1);
            }
        });
        data.splice(idx, 0, fwApprach);
    }
        
    self.updateFwApproach = function(newFwApproach) {
        data[newFwApproach.getNumber()] = newFwApproach;
    };
    
    self.extractBuffer = function(fwApproachId) {
        let buffer = [];
        let fwApproach = data[fwApproachId];
        if (fwApproachId < self.fwApproachCount()) {    
            buffer.push(fwApproach.getNumber());    // sbufReadU8(src);    // number
            buffer.push(BitHelper.specificByte(fwApproach.getApproachAltAsl(), 0));
            buffer.push(BitHelper.specificByte(fwApproach.getApproachAltAsl(), 1));
            buffer.push(BitHelper.specificByte(fwApproach.getApproachAltAsl(), 2));
            buffer.push(BitHelper.specificByte(fwApproach.getApproachAltAsl(), 3));
            buffer.push(BitHelper.specificByte(fwApproach.getLandAltAsl(), 0));
            buffer.push(BitHelper.specificByte(fwApproach.getLandAltAsl(), 1));
            buffer.push(BitHelper.specificByte(fwApproach.getLandAltAsl(), 2));
            buffer.push(BitHelper.specificByte(fwApproach.getLandAltAsl(), 3));
            buffer.push(fwApproach.getApproachDirection());
            buffer.push(BitHelper.specificByte(fwApproach.getLandHeading1(), 0));
            buffer.push(BitHelper.specificByte(fwApproach.getLandHeading1(), 1));
            buffer.push(BitHelper.specificByte(fwApproach.getLandHeading2(), 0));
            buffer.push(BitHelper.specificByte(fwApproach.getLandHeading2(), 1));
            buffer.push(fwApproach.getIsSeaLevelRef());
        } else {
            buffer = Array(15).fill(0);
            buffer[0] = safehomeId;
        }
        
        return buffer;
    } 

    return self;
};

module.exports = FwApproachCollection;
