'use strict'

import { ConnectionType } from './connection';
import ConnectionBle from './connectionBle';
import ConnectionSerial from './connectionSerial';

/**
 * 连接工厂 - 简化版（仅支持 Serial 和 BLE）
 *
 * 已移除的连接类型：
 * - TCP（网络连接）
 * - UDP（网络连接）
 *
 * @param {ConnectionType} type - 连接类型
 * @param {Connection} instance - 现有连接实例（可选）
 * @returns {Connection} 连接实例
 */
var connectionFactory = function(type, instance) {
    if (instance && (instance.type == type || instance.connectionId)){
        return instance;
    }

    switch (type) {
        case ConnectionType.BLE:
            instance = new ConnectionBle();
            break;
        default:
        case ConnectionType.Serial:
            instance = new ConnectionSerial();
            break;
    }
    return instance;
};

export default connectionFactory;
