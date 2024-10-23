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
    self.POWER_MIN = 1;

    self.LOW_POWER_DISARM_MIN = 0;
    self.LOW_POWER_DISARM_MAX = 2;

    self.MAX_FREQUENCY_MHZ = 5999;

    return self;
})();

module.exports = VTX;
