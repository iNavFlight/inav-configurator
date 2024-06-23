'use strict';

const semver = require('semver');

require('./../injected_methods');
const jBox = require('./../libraries/jBox/jBox.min');
const i18n = require('./../localization');
const { GUI } = require('./../gui');
const { globalSettings } = require('../globalSettings');


var ublox = (function () {
    var self = {};
    var assistnowOnline = null;
    var assistnowOffline = null;

    // m7 = aid, not supported
    // m8+ = mga
    const fmt="mga";;
    const gnss="gps,gal,bds,glo,qzss";

    const onlineServers = [
        'online-live1.services.u-blox.com',
        'online-live2.services.u-blox.com',
    ];

    const period=5

    const offline_gnss="gps,gal,bds,glo";
    const offline_alm="gps,gal,bds,glo";

    const offlineServers = [
        'offline-live1.services.u-blox.com',
        'offline-live2.services.u-blox.com'
    ];
    
    self.init = function() {

    };

    var hasFirstHeader;
    var hasSecondHeader;
    var ubxClass;
    var ubxId;
    var lenLow;
    var lenHigh;
    var payloadLen;
    var skipped;
    var currentCommand;

    function resetUbloxState() {
        console.log("Reset ublox state");
        hasFirstHeader = false;
        hasSecondHeader = false;
        ubxClass = false;
        ubxId = false;
        lenLow = false;
        lenHigh = false;
        payloadLen = 0;
        skipped = 0;
        currentCommand = [];
    }

    function splitUbloxData(ubxBytes) {
        console.log("type of data: " +typeof(ubxBytes));
        console.log("splitUbloxData: " + ubxBytes.length);

        var ubxCommands = []
        resetUbloxState()

        for(var i = 0; i < ubxBytes.length;++i) {
            let c = ubxBytes.charCodeAt(i);
            //let c = ubxBytes[i];
            if (!hasFirstHeader) {
                if (c == 0xb5) {
                    console.log("First header");
                    hasFirstHeader = true;
                    currentCommand.push(c);
                    continue;
                } 
                else
                {
                    resetUbloxState();
                    continue;
                }
            }
            if (!hasSecondHeader) {
                if (c == 0x62) {
                    console.log("Second header");
                    hasSecondHeader = true;
                    currentCommand.push(c);
                    continue;
                }
                else
                {
                    resetUbloxState();
                    continue;
                }
            }
            if (!ubxClass) {
                ubxClass = true;
                console.log("ubxClass: 0x"+ (c).toString(16));
                currentCommand.push(c)
                continue;
            }
            if (!ubxId) {
                ubxId = true;
                console.log("ubxId: 0x"+ (c).toString(16));
                currentCommand.push(c);
                continue;
            }
            if (!lenLow) {
                console.log("Len low");
                lenLow = true;
                //(int) c
                payloadLen = c;
                currentCommand.push(c);
                continue;
            }
            if (!lenHigh) {
                console.log("Len high");
                lenHigh = true;
                // (int)c
                payloadLen = (c << 8) | payloadLen;
                console.log("Payload len " + payloadLen);
                payloadLen += 2; // add crc bytes;
                currentCommand.push(c);
                continue
            }
            if (skipped < payloadLen - 1) {
                console.log("payload + crc");
                skipped = skipped + 1;
                currentCommand.push(c);
                continue;
            }
            if (skipped == payloadLen - 1) {
                skipped = skipped + 1;
                currentCommand.push(c);
                ubxCommands.push(currentCommand);
                console.log("Adding command");
                resetUbloxState();
                continue;
            }
        }
        return ubxCommands
    }

    function processOnlineData(data) {
        assistnowOnline = splitUbloxData(data);

        console.log("Assitnow online commands:" + assistnowOnline.length);
    }

    function processOfflineData(data) {
        assistnowOffline = splitUbloxData(data);
        console.log("Assitnow offline commands:" + assistnowOffline.length);
    }



    // For more info on assistnow, check:
    // https://developer.thingstream.io/guides/location-services/assistnow-user-guide
    // Currently only supported for M8+ units
    self.loadAssistnowOffline = function(callback) {
        // offline_url = "https://offline-live1.services.u-blox.com/GetOfflineData.ashx?token=" + offline_token + ";gnss=" + offline_gnss + ";format=" + fmt + ";period=" + period + ";resolution=1;alm=" + alm + ";"

        let url = `https://${ offlineServers[0] }/GetOfflineData.ashx?token=${globalSettings.assistnowApiKey};gnss=${offline_gnss};format=${fmt};period=${period};resolution=1;alm=${offline_alm};`
        console.log(url);

        $.get(url, processOfflineData).fail(function() {GUI.alert("Error loading Offline data")});

        if(callback != null) {
            callback("");
        }
    };

    self.loadAssistnowOnline = function(callback) {
        //url = "https://online-live1.services.u-blox.com/GetOnlineData.ashx?token=" + online_token + ";gnss=" + gnss + ";datatype=eph,alm,aux,pos;format=" + fmt + ";"
        let url = `https://${ onlineServers[0] }/GetOnlineData.ashx?token=${globalSettings.assistnowApiKey};gnss=${ gnss };datatype=eph,alm,aux,pos;format=${ fmt }`;

        $.get(url, processOnlineData).fail(function() {GUI.alert("Error loading Offline data")});

        if(callback != null) {
            callback("");
        }
    }

    return self;
})();


module.exports = ublox;
