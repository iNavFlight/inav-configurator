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
            self.put(new Safehome(data.length, 0, 0, 0));
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
    
    self.getSafehome = function(safehomeId) {
        for (let safehomeIndex in data) {
            if (data.hasOwnProperty(safehomeIndex)) {
                let safehome = data[safehomeIndex];
                if (safehome.getNumber() == safehomeId ) {
                    return safehome;
                }
            }
        }
    };
    
    self.updateSafehome = function(newSafehome) {
        data[newSafehome.getNumber()] = newSafehome;
    };
    
    self.extractBuffer = function(safehomeId) {
        let buffer = [];
        let safehome = self.getSafehome(safehomeId);
        buffer.push(safehome.getNumber());    // sbufReadU8(src);    // number
        buffer.push(safehome.getEnabled());    // sbufReadU8(src);    // action
        buffer.push(specificByte(safehome.getLat(), 0));    // sbufReadU32(src);      // lat
        buffer.push(specificByte(safehome.getLat(), 1));
        buffer.push(specificByte(safehome.getLat(), 2));
        buffer.push(specificByte(safehome.getLat(), 3));
        buffer.push(specificByte(safehome.getLon(), 0));    // sbufReadU32(src);      // lon
        buffer.push(specificByte(safehome.getLon(), 1));
        buffer.push(specificByte(safehome.getLon(), 2));
        buffer.push(specificByte(safehome.getLon(), 3));
        
        return buffer;
    }
    
    self.safehomeDisplayDebug = function() {
        if (data && data.length != 0) {
            data.forEach(function (element) {
                console.log("N° : ", element.getNumber(),
                            "Enabled : ", element.getEnabled(),
                            "Lon : ", element.getLon(),
                            "Lat : ", element.getLat(),
                           );
            });
        }
    }
    

    return self;
};