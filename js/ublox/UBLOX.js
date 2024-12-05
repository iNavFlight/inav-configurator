'use strict';

const semver = require('semver');

require('./../injected_methods');
const jBox = require('./../libraries/jBox/jBox.min');
const i18n = require('./../localization');
const { GUI } = require('./../gui');
const { globalSettings } = require('../globalSettings');
const Store = require('electron-store');


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
        //console.log("Reset ublox state");
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

    function splitUbloxData(ubxBytesBuffer) {
        //console.log("type of data: " +typeof(ubxBytesBuffer));
        //console.log("splitUbloxData: " + ubxBytesBuffer.byteLength);
        let ubxBytes = new DataView(ubxBytesBuffer);

        var ubxCommands = []
        resetUbloxState()

        for(var i = 0; i < ubxBytes.byteLength;++i) {
            let c = ubxBytes.getUint8(i);
            //console.log("byte: 0x" + c.toString(16));
            if (!hasFirstHeader) {
                if (c == 0xb5) {
                    //console.log("First header");
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
                    //console.log("Second header");
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
                //console.log("ubxClass: 0x"+ (c).toString(16));
                currentCommand.push(c)
                continue;
            }
            if (!ubxId) {
                ubxId = true;
                //console.log("ubxId: 0x"+ (c).toString(16));
                currentCommand.push(c);
                continue;
            }
            if (!lenLow) {
                //console.log("Len low");
                lenLow = true;
                //(int) c
                payloadLen = c;
                currentCommand.push(c);
                continue;
            }
            if (!lenHigh) {
                //console.log("Len high");
                lenHigh = true;
                // (int)c
                payloadLen = (c << 8) | payloadLen;
                //console.log("Payload len " + payloadLen);
                payloadLen += 2; // add crc bytes;
                currentCommand.push(c);
                continue
            }
            if (skipped < payloadLen - 1) {
                //console.log("payload + crc");
                skipped = skipped + 1;
                currentCommand.push(c);
                continue;
            }
            if (skipped == payloadLen - 1) {
                skipped = skipped + 1;
                currentCommand.push(c);
                ubxCommands.push(currentCommand);
                //console.log("Adding command");
                resetUbloxState();
                continue;
            }
        }
        return ubxCommands
    }

    function getBinaryData(url, successCallback, failCallback) {
        const req = new XMLHttpRequest();
        req.open("GET", url, true);
        req.responseType = "arraybuffer";

        if (successCallback != null) {
            req.onload = (event) => {
                if(req.status == 200) {
                    successCallback(req.response);
                } else {
                    failCallback(event);
                }
            };
        }

        if (failCallback != null) {
            req.onerror = (event) => {
                failCallback(event);
            }
        }
          
        try {
            req.send(null);
        } catch(error) {
            GUI.alert(i18n.getMessage("gpsAssistnowLoadDataError"));
            console.log(i18n.getMessage("gpsAssistnowLoadDataError") + ':' + error.toString());
        }
    }


    function loadError(event) {
        GUI.alert(i18n.getMessage("gpsAssistnowLoadDataError"));
    }

    // For more info on assistnow, check:
    // https://developer.thingstream.io/guides/location-services/assistnow-user-guide
    // Currently only supported for M8+ units
    self.loadAssistnowOffline = function(callback) {

        let url = `https://${ offlineServers[0] }/GetOfflineData.ashx?token=${globalSettings.assistnowApiKey};gnss=${offline_gnss};format=${fmt};period=${period};resolution=1;alm=${offline_alm};`
        //console.log(url);

        function processOfflineData(data) {
            if(globalSettings.assistnowOfflineData == null || ((Date.now() / 1000)-globalSettings.assistnowOfflineDate) > (60*60*24*3))  {
                console.log("AssistnowOfflineData older than 3 days, refreshing.");
                globalSettings.assistnowOfflineData = splitUbloxData(data);
                globalSettings.assistnowOfflineDate = Math.floor(Date.now() / 1000);
                globalSettings.saveAssistnowData();
            } else {
                console.log("AssitnowOfflineData newer than 3 days. Re-using.");
            }
            //console.log("Assitnow offline commands:" + globalSettings.assistnowOfflineData.length);
            callback(globalSettings.assistnowOfflineData);
        }

        getBinaryData(url, processOfflineData, loadError);
        //$.get(url, processOfflineData).fail(function() {GUI.alert("Error loading Offline data")});
    };

    self.loadAssistnowOnline = function(callback) {
        //url = "https://online-live1.services.u-blox.com/GetOnlineData.ashx?token=" + online_token + ";gnss=" + gnss + ";datatype=eph,alm,aux,pos;format=" + fmt + ";"
        let url = `https://${ onlineServers[0] }/GetOnlineData.ashx?token=${globalSettings.assistnowApiKey};gnss=${ gnss };datatype=eph,alm,aux,pos;format=${ fmt }`;

        function processOnlineData(data) {
            assistnowOnline = splitUbloxData(data);

            //console.log("Assitnow online commands:" + assistnowOnline.length);
            callback(assistnowOnline);
        }

        //$.get(url, processOnlineData).fail(function() {GUI.alert("Error loading Offline data")});
        getBinaryData(url, processOnlineData, loadError);
    }

    self.isAssistnowDataRelevant = function(ubxMessage, cy, cm, cd) {
        if ((ubxMessage[2] == 0x13 /*UBX_CLASS_MGA*/) && (ubxMessage[3] == 0x20 /*UBX_MGA_ANO*/))
            {
                // UBX-MGA-ANO
                const payloadOffset = 6;
                if (((ubxMessage[payloadOffset + 4] + 2000) == cy) && (ubxMessage[payloadOffset + 5] == cm) && (ubxMessage[payloadOffset + 6] == cd))
                {
                    //console.log("UBX-MGA_ANO date matches");
                    return true;
                }
            } else {
                //console.log("UBX-CMD: class: 0x" + ubxMessage[2].toString(16) + " id: 0x" + ubxMessage[3].toString(16));
                return true;
            }
        
            return false;
    }


    return self;
})();


module.exports = ublox;
