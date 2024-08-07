'use strict';

const Store = require('electron-store');
const store = new Store();

const { GUI } = require('./../js/gui');
const ConnectionSerial = require('./connection/connectionSerial');

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

    ConnectionSerial.getDevices(function(all_ports) {

        // filter out ports that are not serial
        let current_ports = [];
        for (var i = 0; i < all_ports.length; i++) {
            if (all_ports[i].indexOf(':') === -1) {
                current_ports.push(all_ports[i]);
            }
        }
        
        // port got removed or initial_ports wasn't initialized yet
        if (self.array_difference(self.initial_ports, current_ports).length > 0 || !self.initial_ports) {
            var removed_ports = self.array_difference(self.initial_ports, current_ports);

            if (self.initial_ports != false) {
                if (removed_ports.length > 1) {
                    console.log('PortHandler - Removed: ' + removed_ports);
                } else {
                    console.log('PortHandler - Removed: ' + removed_ports[0]);
                }
            }

            // disconnect "UI" if necessary
            // Keep in mind that this routine can not fire during atmega32u4 reboot procedure !!!
            if (GUI.connected_to) {
                for (var i = 0; i < removed_ports.length; i++) {
                    if (removed_ports[i] == GUI.connected_to) {
                        $('div#port-picker a.connect').trigger( "click" );
                    }
                }
            }

            self.update_port_select(current_ports);

            // trigger callbacks (only after initialization)
            if (self.initial_ports) {
                for (var i = (self.port_removed_callbacks.length - 1); i >= 0; i--) {
                    var obj = self.port_removed_callbacks[i];

                    // remove timeout
                    clearTimeout(obj.timer);

                    // trigger callback
                    obj.code(removed_ports);

                    // remove object from array
                    var index = self.port_removed_callbacks.indexOf(obj);
                    if (index > -1) self.port_removed_callbacks.splice(index, 1);
                }
            }

            // auto-select last used port (only during initialization)
            if (!self.initial_ports) {
                var last_used_port = store.get('last_used_port', false);
                // if last_used_port was set, we try to select it
                if (last_used_port) {
                    if (last_used_port == "ble" || last_used_port == "tcp" || last_used_port == "udp" || last_used_port == "sitl" || last_used_port == "sitl-demo") {
                        $('#port').val(last_used_port);
                    } else {
                        current_ports.forEach(function(port) {
                            if (port == last_used_port) {
                                console.log('Selecting last used port: ' + last_used_port);
                                $('#port').val(last_used_port);
                            }
                        });
                    }
                } else {
                    console.log('Last used port wasn\'t saved "yet", auto-select disabled.');
                }
                
                var last_used_bps = store.get('last_used_bps', false);
                if (last_used_bps) {
                    $('#baud').val(last_used_bps);
                }

                if (store.get('wireless_mode_enabled', false)) {
                    $('#wireless-mode').prop('checked', true).trigger('change');
                }

            }

            if (!self.initial_ports) {
                // initialize
                self.initial_ports = current_ports;
            } else {
                for (var i = 0; i < removed_ports.length; i++) {
                    self.initial_ports.splice(self.initial_ports.indexOf(removed_ports[i]), 1);
                }
            }
        }

        // new port detected
        var new_ports = self.array_difference(current_ports, self.initial_ports);

        if (new_ports.length) {
            if (new_ports.length > 1) {
                console.log('PortHandler - Found: ' + new_ports);
            } else {
                console.log('PortHandler - Found: ' + new_ports[0]);
            }

            self.update_port_select(current_ports);

            // select / highlight new port, if connected -> select connected port
            if (!GUI.connected_to) {
                $('div#port-picker #port').val(new_ports[0]);
            } else {
                $('div#port-picker #port').val(GUI.connected_to);
            }

            // trigger callbacks
            for (var i = (self.port_detected_callbacks.length - 1); i >= 0; i--) {
                var obj = self.port_detected_callbacks[i];

                // remove timeout
                clearTimeout(obj.timer);

                // trigger callback
                obj.code(new_ports);

                // remove object from array
                var index = self.port_detected_callbacks.indexOf(obj);
                if (index > -1) self.port_detected_callbacks.splice(index, 1);
            }

            self.initial_ports = current_ports;
        }

        self.check_usb_devices();

        GUI.updateManualPortVisibility();
        setTimeout(function () {
            self.check();
        }, 250);
    });
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

    for (var i = 0; i < ports.length; i++) {
        $('div#port-picker #port').append($("<option/>", {value: ports[i], text: ports[i], data: {isManual: false}}));
    }

    $('div#port-picker #port').append($("<option/>", {value: 'manual', text: 'Manual Selection', data: {isManual: true}}));
    $('div#port-picker #port').append($("<option/>", {value: 'ble', text: 'BLE', data: {isBle: true}}));
    $('div#port-picker #port').append($("<option/>", {value: 'tcp', text: 'TCP', data: {isTcp: true}}));
    $('div#port-picker #port').append($("<option/>", {value: 'udp', text: 'UDP', data: {isUdp: true}}));
    $('div#port-picker #port').append($("<option/>", {value: 'sitl', text: 'SITL', data: {isSitl: true}}));
    $('div#port-picker #port').append($("<option/>", {value: 'sitl-demo', text: 'Demo mode', data: {isSitl: true}}));
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

module.exports = { usbDevices, PortHandler };
