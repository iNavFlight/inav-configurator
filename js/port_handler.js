'use strict';

import GUI from './../js/gui';
import ConnectionSerial from './connection/connectionSerial';
import store from './store';

var usbDevices =  [
    { 'vendorId': 1155, 'productId': 57105}, 
    { 'vendorId': 11836, 'productId': 57105},
    { 'vendorId': 12619, 'productId': 262}, // APM32 DFU Bootloader
];


var PortHandler = new function () {
    this.initial_ports = false;
    this.port_detected_callbacks = [];
    this.port_removed_callbacks = [];
    this.dfu_available = false;
};

PortHandler.initialize = function () {
    // start listening, check after 250ms
    this.check();
};

PortHandler.check = function () {
    var self = this;

    // 简化检查逻辑，只初始化端口选择器
    if (!self.initial_ports) {
        self.initial_ports = true;

        // 初始化端口选择
        self.update_port_select([]);

        // 恢复上次使用的连接方式
        store.get('last_connection_type', 'serial').then(last_type => {
            if (last_type == 'ble') {
                $('#port').val('ble');
            } else {
                $('#port').val('serial');
            }
            $('#port').trigger('change');
        });

        // 恢复波特率设置
        store.get('last_used_bps', false).then(last_used_bps => {
            if (last_used_bps) {
                $('#baud').val(last_used_bps);
            }
        });
    }

    // 检查 DFU 设备
    self.check_usb_devices();

    GUI.updateManualPortVisibility();

    setTimeout(function () {
        self.check();
    }, 1000); // 降低检查频率
};

PortHandler.check_usb_devices = function (callback) {
    
    self.dfu_available = false;
    
    navigator.usb.getDevices().then(devices => {
        devices.forEach(device  => {
            usbDevices.forEach(usbDev => {
                if (device.vendorId == usbDev.vendorId && device.productId == usbDev.productId) {
                    self.dfu_available = true;
                    return;
                }
            });
        });

        if (self.dfu_available) {
            if (!$("div#port-picker #port [value='DFU']").length) {
                $('div#port-picker #port').append($('<option/>', {value: "DFU", text: "DFU", data: {isDFU: true}}));
                $('div#port-picker #port').val('DFU');
            }
        } else {
            if ($("div#port-picker #port [value='DFU']").length) {
                $("div#port-picker #port [value='DFU']").remove();
            }
        }
    
        if (callback) 
            callback(self.dfu_available);
    });
}

PortHandler.update_port_select = function (ports) {
    $('div#port-picker #port').html(''); // drop previous one

    // 只显示两种连接方式
    $('div#port-picker #port').append($("<option/>", {value: 'serial', text: '串口连接 (Serial)', data: {isSerial: true}}));
    $('div#port-picker #port').append($("<option/>", {value: 'ble', text: '蓝牙连接 (BLE)', data: {isBle: true}}));
};

PortHandler.port_detected = function(name, code, timeout, ignore_timeout) {
    var self = this;
    var obj = {'name': name, 'code': code, 'timeout': (timeout) ? timeout : 10000};

    if (!ignore_timeout) {
        obj.timer = setTimeout(function() {
            console.log('PortHandler - timeout - ' + obj.name);

            // trigger callback
            code(false);

            // remove object from array
            var index = self.port_detected_callbacks.indexOf(obj);
            if (index > -1) self.port_detected_callbacks.splice(index, 1);
        }, (timeout) ? timeout : 10000);
    } else {
        obj.timer = false;
        obj.timeout = false;
    }

    this.port_detected_callbacks.push(obj);

    return obj;
};

PortHandler.port_removed = function (name, code, timeout, ignore_timeout) {
    var self = this;
    var obj = {'name': name, 'code': code, 'timeout': (timeout) ? timeout : 10000};

    if (!ignore_timeout) {
        obj.timer = setTimeout(function () {
            console.log('PortHandler - timeout - ' + obj.name);

            // trigger callback
            code(false);

            // remove object from array
            var index = self.port_removed_callbacks.indexOf(obj);
            if (index > -1) self.port_removed_callbacks.splice(index, 1);
        }, (timeout) ? timeout : 10000);
    } else {
        obj.timer = false;
        obj.timeout = false;
    }

    this.port_removed_callbacks.push(obj);

    return obj;
};

// accepting single level array with "value" as key
PortHandler.array_difference = function (firstArray, secondArray) {
    var cloneArray = [];

    // create hardcopy
    for (var i = 0; i < firstArray.length; i++) {
        cloneArray.push(firstArray[i]);
    }

    for (var i = 0; i < secondArray.length; i++) {
        if (cloneArray.indexOf(secondArray[i]) != -1) {
            cloneArray.splice(cloneArray.indexOf(secondArray[i]), 1);
        }
    }

    return cloneArray;
};

PortHandler.flush_callbacks = function () {
    var killed = 0;

    for (var i = this.port_detected_callbacks.length - 1; i >= 0; i--) {
        if (this.port_detected_callbacks[i].timer) clearTimeout(this.port_detected_callbacks[i].timer);
        this.port_detected_callbacks.splice(i, 1);

        killed++;
    }

    for (var i = this.port_removed_callbacks.length - 1; i >= 0; i--) {
        if (this.port_removed_callbacks[i].timer) clearTimeout(this.port_removed_callbacks[i].timer);
        this.port_removed_callbacks.splice(i, 1);

        killed++;
    }

    return killed;
};

export  { usbDevices, PortHandler };
