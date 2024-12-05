'use strict'

import { ConnectionType } from './connection';
import ConnectionBle from './connectionBle';
import ConnectionSerial from './connectionSerial';
import ConnectionTcp from './connectionTcp';
import ConnectionUdp from './connectionUdp';

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

export default connectionFactory;