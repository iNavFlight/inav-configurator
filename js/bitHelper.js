'use strict'

var BitHelper = function() {
    
    var self = {};
    
    self.highByte = function (num) {
        return num >> 8;
    }
    
    self.lowByte = function (num) {
        return 0x00FF & num;
    }
    
    self.specificByte = function (num, pos) {
        return 0x000000FF & (num >> (8 * pos));
    }
    
    self.bit_check = function (num, bit) {
        return ((1 << bit) & num) != 0;
    }
    
    self.bit_set = function (num, bit) {
        return num | 1 << bit;
    }
    
    self.bit_clear = function(num, bit) {
        return num & ~(1 << bit);
    }

    return self;
}();

module.exports = BitHelper;