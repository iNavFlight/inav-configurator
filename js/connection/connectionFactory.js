'use strict'

const { ConnectionType } = require('./connection');
const ConnectionBle = require('./connectionBle');
const ConnectionSerial = require('./connectionSerial');
const ConnectionTcp = require('./connectionTcp');
const ConnectionUdp = require('./connectionUdp');

var connectionFactory = function(type, instance) {
    if (instance && (instance.type == type || instance.connectionId)){
        return instance;
    }
    
    switch (type) {
        case ConnectionType.BLE:
            instance = new ConnectionBle();
            break;
        case ConnectionType.TCP:
            instance = new ConnectionTcp();
            break;
        case ConnectionType.UDP:
            instance = new ConnectionUdp();
            break;
        default:
        case ConnectionType.Serial:
            instance = new ConnectionSerial();
            break;
    }
    return instance;
};

module.exports = connectionFactory;