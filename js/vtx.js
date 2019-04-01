var VTX = (function() {
    var self = {};

    self.DEV_SMARTAUDIO = 3;
    self.DEV_TRAMP = 4;
    self.DEV_UNKNOWN = 0xFF;

    self.BANDS = [
        {code: 1, name: 'Boscam A'},
        {code: 2, name: 'Boscam B'},
        {code: 3, name: 'Boscam E'},
        {code: 4, name: 'Fatshark'},
        {code: 5, name: 'Raceband'},
    ];

    self.BAND_MIN = 1;
    self.BAND_MAX = 5;

    self.CHANNEL_MIN = 1;
    self.CHANNEL_MAX = 8;

    self.getMinPower = function(vtxDev) {
        return 1;
    }

    self.getMaxPower = function(vtxDev) {
        if ((vtxDev == self.DEV_SMARTAUDIO) || (vtxDev == self.DEV_TRAMP)) {
            return 5;
        }
        return 3;
    }

    self.LOW_POWER_DISARM_MIN = 0;
    self.LOW_POWER_DISARM_MAX = 2;

    self.MAX_FREQUENCY_MHZ = 5999;

    return self;
})();
