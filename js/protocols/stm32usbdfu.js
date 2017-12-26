/*
    USB DFU uses:
    control transfers for communicating
    recipient is interface
    request type is class

    Descriptors seems to be broken in current chrome.usb API implementation (writing this while using canary 37.0.2040.0

    General rule to remember is that DFU doesn't like running specific operations while the device isn't in idle state
    that being said, it seems that certain level of CLRSTATUS is required before running another type of operation for
    example switching from DNLOAD to UPLOAD, etc, clearning the state so device is in dfuIDLE is highly recommended.
*/
'use strict';

var STM32DFU_protocol = function () {
    this.callback; // ref
    this.hex; // ref
    this.verify_hex;

    this.handle = null; // connection handle

    this.request = {
        DETACH:     0x00, // OUT, Requests the device to leave DFU mode and enter the application.
        DNLOAD:     0x01, // OUT, Requests data transfer from Host to the device in order to load them into device internal Flash. Includes also erase commands
        UPLOAD:     0x02, // IN,  Requests data transfer from device to Host in order to load content of device internal Flash into a Host file.
        GETSTATUS:  0x03, // IN,  Requests device to send status report to the Host (including status resulting from the last request execution and the state the device will enter immediately after this request).
        CLRSTATUS:  0x04, // OUT, Requests device to clear error status and move to next step
        GETSTATE:   0x05, // IN,  Requests the device to send only the state it will enter immediately after this request.
        ABORT:      0x06  // OUT, Requests device to exit the current state/operation and enter idle state immediately.
    };

    this.status = {
        OK:                 0x00, // No error condition is present.
        errTARGET:          0x01, // File is not targeted for use by this device.
        errFILE:            0x02, // File is for this device but fails some vendor-specific verification test
        errWRITE:           0x03, // Device is unable to write memory.
        errERASE:           0x04, // Memory erase function failed.
        errCHECK_ERASED:    0x05, // Memory erase check failed.
        errPROG:            0x06, // Program memory function failed.
        errVERIFY:          0x07, // Programmed memory failed verification.
        errADDRESS:         0x08, // Cannot program memory due to received address that is out of range.
        errNOTDONE:         0x09, // Received DFU_DNLOAD with wLength = 0, but device does not think it has all of the data yet.
        errFIRMWARE:        0x0A, // Device's firmware is corrupt. It cannot return to run-time (non-DFU) operations.
        errVENDOR:          0x0B, // iString indicates a vendor-specific error.
        errUSBR:            0x0C, // Device detected unexpected USB reset signaling.
        errPOR:             0x0D, // Device detected unexpected power on reset.
        errUNKNOWN:         0x0E, // Something went wrong, but the device does not know what it was.
        errSTALLEDPKT:      0x0F  // Device stalled an unexpected request.
    };

    this.state = {
        appIDLE:                0, // Device is running its normal application.
        appDETACH:              1, // Device is running its normal application, has received the DFU_DETACH request, and is waiting for a USB reset.
        dfuIDLE:                2, // Device is operating in the DFU mode and is waiting for requests.
        dfuDNLOAD_SYNC:         3, // Device has received a block and is waiting for the host to solicit the status via DFU_GETSTATUS.
        dfuDNBUSY:              4, // Device is programming a control-write block into its nonvolatile memories.
        dfuDNLOAD_IDLE:         5, // Device is processing a download operation. Expecting DFU_DNLOAD requests.
        dfuMANIFEST_SYNC:       6, // Device has received the final block of firmware from the host and is waiting for receipt of DFU_GETSTATUS to begin the Manifestation phase; or device has completed the Manifestation phase and is waiting for receipt of DFU_GETSTATUS.
        dfuMANIFEST:            7, // Device is in the Manifestation phase. (Not all devices will be able to respond to DFU_GETSTATUS when in this state.)
        dfuMANIFEST_WAIT_RESET: 8, // Device has programmed its memories and is waiting for a USB reset or a power on reset. (Devices that must enter this state clear bitManifestationTolerant to 0.)
        dfuUPLOAD_IDLE:         9, // The device is processing an upload operation. Expecting DFU_UPLOAD requests.
        dfuERROR:               10 // An error has occurred. Awaiting the DFU_CLRSTATUS request.
    };

    this.chipInfo = null; // information about chip's memory
    this.flash_layout = { 'start_address': 0, 'total_size': 0, 'sectors': []};
};

STM32DFU_protocol.prototype.connect = function (device, hex, options, callback) {
    var self = this;
    self.hex = hex;
    self.callback = callback;

    self.options = {
        erase_chip:     false
    };

    if (options.erase_chip) {
        self.options.erase_chip = true;
    }

    // reset and set some variables before we start
    self.upload_time_start = new Date().getTime();
    self.verify_hex = [];

    // reset progress bar to initial state
    self.progress_bar_e = $('.progress');
    self.progress_bar_e.val(0);
    self.progress_bar_e.removeClass('valid invalid');

    chrome.usb.getDevices(device, function (result) {
        if (result.length) {
            console.log('USB DFU detected with ID: ' + result[0].device);

            self.openDevice(result[0]);
        } else {
            console.log('USB DFU not found');
            GUI.log('USB DFU not found');
        }
    });
};

STM32DFU_protocol.prototype.checkChromeError = function() {
    if (chrome.runtime.lastError) {
        if(chrome.runtime.lastError.message)
            console.log('reporting chrome error: ' + chrome.runtime.lastError.message);
        else
            console.log('reporting chrome error: ' + chrome.runtime.lastError);

        return true;
    }

    return false;
}

STM32DFU_protocol.prototype.openDevice = function (device) {
    var self = this;

    chrome.usb.openDevice(device, function (handle) {
        if(self.checkChromeError()) {
            console.log('Failed to open USB device!');
            GUI.log(chrome.i18n.getMessage('usbDeviceOpenFail'));
            if(GUI.operating_system === 'Linux') {
                GUI.log(chrome.i18n.getMessage('usbDeviceUdevNotice'));
            }
            return;
        }

        self.handle = handle;

        GUI.log(chrome.i18n.getMessage('usbDeviceOpened', handle.handle.toString()));
        console.log('Device opened with Handle ID: ' + handle.handle);
        self.claimInterface(0);
    });
};

STM32DFU_protocol.prototype.closeDevice = function () {
    var self = this;

    chrome.usb.closeDevice(this.handle, function closed() {
        if(self.checkChromeError()) {
            console.log('Failed to close USB device!');
            GUI.log(chrome.i18n.getMessage('usbDeviceCloseFail'));
        }

        GUI.log(chrome.i18n.getMessage('usbDeviceClosed'));
        console.log('Device closed with Handle ID: ' + self.handle.handle);

        self.handle = null;
    });
};

STM32DFU_protocol.prototype.claimInterface = function (interfaceNumber) {
    var self = this;

    chrome.usb.claimInterface(this.handle, interfaceNumber, function claimed() {
        if(self.checkChromeError()) {
            console.log('Failed to claim USB device!');
            self.upload_procedure(99);
        }

        console.log('Claimed interface: ' + interfaceNumber);

        self.upload_procedure(0);
    });
};

STM32DFU_protocol.prototype.releaseInterface = function (interfaceNumber) {
    var self = this;

    chrome.usb.releaseInterface(this.handle, interfaceNumber, function released() {
        console.log('Released interface: ' + interfaceNumber);

        self.closeDevice();
    });
};

STM32DFU_protocol.prototype.resetDevice = function (callback) {
    chrome.usb.resetDevice(this.handle, function (result) {
        console.log('Reset Device: ' + result);

        if (callback) callback();
    });
};

STM32DFU_protocol.prototype.getString = function (index, callback) {
    var self = this;

    chrome.usb.controlTransfer(self.handle, {
        'direction':    'in',
        'recipient':    'device',
        'requestType':  'standard',
        'request':      6,
        'value':        0x300 | index,
        'index':        0,  // specifies language
        'length':       255 // max length to retreive
    }, function (result) {
        if(self.checkChromeError()) {
            console.log('USB transfer failed! ' + result.resultCode);
            callback("", result.resultCode);
            return;
        }
        var view = new DataView(result.data);
        var length = view.getUint8(0);
        var descriptor = "";
        for (var i = 2; i < length; i += 2) {
            var charCode = view.getUint16(i, true);
            descriptor += String.fromCharCode(charCode);
        }
        callback(descriptor, result.resultCode);
    });
}

STM32DFU_protocol.prototype.getInterfaceDescriptors = function (interfaceNum, callback) {
    var self = this;

    chrome.usb.getConfiguration( this.handle, function (config) {
        if(self.checkChromeError()) {
            console.log('USB getConfiguration failed!');
            callback([], -200);
            return;
        }

    var interfaceID = 0;
    var descriptorStringArray = [];
    var getDescriptorString = function () {
        if(interfaceID < config.interfaces.length) {
            self.getInterfaceDescriptor(interfaceID, function (descriptor, resultCode) {
                if (resultCode) {
                    callback([], resultCode);
                    return;
                }
                interfaceID++;
                self.getString(descriptor.iInterface, function (descriptorString, resultCode) {
                    if (resultCode) {
                        callback([], resultCode);
                        return;
                    }
                    if (descriptor.bInterfaceNumber == interfaceNum) {
                        descriptorStringArray.push(descriptorString);
                    }
                    getDescriptorString();
                });
            });
        } else {
            //console.log(descriptorStringArray);
            callback(descriptorStringArray, 0);
            return;
        }
    }
    getDescriptorString();
    });
}


STM32DFU_protocol.prototype.getInterfaceDescriptor = function (_interface, callback) {
    var self = this;
    chrome.usb.controlTransfer(this.handle, {
        'direction':    'in',
        'recipient':    'device',
        'requestType':  'standard',
        'request':      6,
        'value':        0x200,
        'index':        0,
        'length':       18 + _interface * 9
    }, function (result) {
        if(self.checkChromeError()) {
            console.log('USB transfer failed! ' + result.resultCode);
            callback({}, result.resultCode);
            return;
        }

        var buf = new Uint8Array(result.data, 9 + _interface * 9);
        var descriptor = {
            'bLength':            buf[0],
            'bDescriptorType':    buf[1],
            'bInterfaceNumber':   buf[2],
            'bAlternateSetting':  buf[3],
            'bNumEndpoints':      buf[4],
            'bInterfaceClass':    buf[5],
            'bInterfaceSubclass': buf[6],
            'bInterfaceProtocol': buf[7],
            'iInterface':         buf[8]
        };

        callback(descriptor, result.resultCode);
    });
}

STM32DFU_protocol.prototype.getChipInfo = function (_interface, callback) {
    var self = this;

    self.getInterfaceDescriptors(0, function (descriptors, resultCode) {
        if (resultCode) {
            callback({}, resultCode);
            return;
        }

    var parseDescriptor = function(str) {
            // F303: "@Internal Flash  /0x08000000/128*0002Kg"
            // F40x: "@Internal Flash  /0x08000000/04*016Kg,01*064Kg,07*128Kg"
            // F72x: "@Internal Flash  /0x08000000/04*016Kg,01*64Kg,03*128Kg"
            // F74x: "@Internal Flash  /0x08000000/04*032Kg,01*128Kg,03*256Kg"
            // split main into [location, start_addr, sectors]
            var tmp0 = str.replace(/[^\x20-\x7E]+/g, "");
            var tmp1 = tmp0.split('/');
            if (tmp1.length != 3 || !tmp1[0].startsWith("@")) {
                return null;
            }
            var type = tmp1[0].trim().replace('@', '');
            var start_address = parseInt(tmp1[1]);

            // split sectors into array
            var sectors = [];
            var total_size = 0;
            var tmp2 = tmp1[2].split(',');
            if (tmp2.length < 1) {
                return null;
            }
            for (var i = 0; i < tmp2.length; i++) {
                // split into [num_pages, page_size]
                var tmp3 = tmp2[i].split('*');
                if (tmp3.length != 2) {
                    return null;
                }
                var num_pages = parseInt(tmp3[0]);
                var page_size = parseInt(tmp3[1]);
                if (!page_size) {
                    return null;
                }
                var unit = tmp3[1].slice(-2, -1);
                switch (unit) {
                    case 'M':
                        page_size *= 1024; //  fall through to K as well
                    case 'K':
                        page_size *= 1024;
                        break;
/*          case ' ':
            break;
                    default:
                        return null;
*/
                }

                sectors.push({
                    'num_pages'    : num_pages,
                    'start_address': start_address + total_size,
                    'page_size'    : page_size,
                    'total_size'   : num_pages * page_size
                });

                total_size += num_pages * page_size;
            }

            var memory = {
                'type'         : type,
                'start_address': start_address,
                'sectors'      : sectors,
                'total_size'   : total_size
            }
        return memory;
    }
    var chipInfo = descriptors.map(parseDescriptor).reduce(function(o, v, i) {
        o[v.type.toLowerCase().replace(' ', '_')] = v;
        return o;
    }, {});
        callback(chipInfo, resultCode);
    });
}

STM32DFU_protocol.prototype.controlTransfer = function (direction, request, value, _interface, length, data, callback, _timeout) {
    var self = this;

    // timeout support was added in chrome v43
    var timeout;
    if (typeof _timeout === "undefined") {
    timeout = 0; // default is 0 (according to chrome.usb API)
    } else {
        timeout = _timeout;
    }

    if (direction == 'in') {
        // data is ignored
        chrome.usb.controlTransfer(this.handle, {
            'direction':    'in',
            'recipient':    'interface',
            'requestType':  'class',
            'request':      request,
            'value':        value,
            'index':        _interface,
            'length':       length,
            'timeout':      timeout
        }, function (result) {
            if(self.checkChromeError()) {
                console.log('USB transfer failed!');
            }
            if (result.resultCode) console.log('USB transfer result code: ' + result.resultCode);

            var buf = new Uint8Array(result.data);
            callback(buf, result.resultCode);
        });
    } else {
        // length is ignored
        if (data) {
            var arrayBuf = new ArrayBuffer(data.length);
            var arrayBufView = new Uint8Array(arrayBuf);
            arrayBufView.set(data);
        } else {
            var arrayBuf = new ArrayBuffer(0);
        }

        chrome.usb.controlTransfer(this.handle, {
            'direction':    'out',
            'recipient':    'interface',
            'requestType':  'class',
            'request':      request,
            'value':        value,
            'index':        _interface,
            'data':         arrayBuf,
            'timeout':      timeout
        }, function (result) {
            if(self.checkChromeError()) {
                console.log('USB transfer failed!');
            }
            if (result.resultCode) console.log('USB transfer result code: ' + result.resultCode);

            callback(result);
        });
    }
};

// routine calling DFU_CLRSTATUS until device is in dfuIDLE state
STM32DFU_protocol.prototype.clearStatus = function (callback) {
    var self = this;

    function check_status() {
        self.controlTransfer('in', self.request.GETSTATUS, 0, 0, 6, 0, function (data) {
            if (data[4] == self.state.dfuIDLE) {
                callback(data);
            } else {
                var delay = data[1] | (data[2] << 8) | (data[3] << 16);

                setTimeout(clear_status, delay);
            }
        });
    }

    function clear_status() {
        self.controlTransfer('out', self.request.CLRSTATUS, 0, 0, 0, 0, check_status);
    }

    check_status();
};

STM32DFU_protocol.prototype.loadAddress = function (address, callback, abort) {
    var self = this;

    self.controlTransfer('out', self.request.DNLOAD, 0, 0, 0, [0x21, address, (address >> 8), (address >> 16), (address >> 24)], function () {
        self.controlTransfer('in', self.request.GETSTATUS, 0, 0, 6, 0, function (data) {
            if (data[4] == self.state.dfuDNBUSY) {
                var delay = data[1] | (data[2] << 8) | (data[3] << 16);

                setTimeout(function () {
                    self.controlTransfer('in', self.request.GETSTATUS, 0, 0, 6, 0, function (data) {
                        if (data[4] == self.state.dfuDNLOAD_IDLE) {
                            callback(data);
                        } else {
                            console.log('Failed to execute address load');
                if(typeof abort === "undefined" || abort) {
                                self.upload_procedure(99);
                } else {
                callback(data);
                }
                        }
                    });
                }, delay);
            } else {
                console.log('Failed to request address load');
                self.upload_procedure(99);
            }
        });
    });
};

// first_array = usually hex_to_flash array
// second_array = usually verify_hex array
// result = true/false
STM32DFU_protocol.prototype.verify_flash = function (first_array, second_array) {
    for (var i = 0; i < first_array.length; i++) {
        if (first_array[i] != second_array[i]) {
            console.log('Verification failed on byte: ' + i + ' expected: 0x' + first_array[i].toString(16) + ' received: 0x' + second_array[i].toString(16));
            return false;
        }
    }

    console.log('Verification successful, matching: ' + first_array.length + ' bytes');

    return true;
};

STM32DFU_protocol.prototype.upload_procedure = function (step) {
    var self = this;

    switch (step) {
        case 0:
            self.getChipInfo(0, function (chipInfo, resultCode) {
                if (resultCode != 0 || typeof chipInfo === "undefined") {
                    console.log('Failed to detect chip info, resultCode: ' + resultCode);
                    self.upload_procedure(99);
                } else {
                    if (typeof chipInfo.internal_flash === "undefined") {
                        console.log('Failed to detect internal flash');
                        self.upload_procedure(99);
            }

                self.chipInfo = chipInfo;

                    self.flash_layout = chipInfo.internal_flash;
                    self.available_flash_size = self.flash_layout.total_size - (self.hex.start_linear_address - self.flash_layout.start_address);

                    GUI.log(chrome.i18n.getMessage('dfu_device_flash_info', (self.flash_layout.total_size / 1024).toString()));

                    if (self.hex.bytes_total > self.available_flash_size) {
                        GUI.log(chrome.i18n.getMessage('dfu_error_image_size',
                            [(self.hex.bytes_total / 1024.0).toFixed(1),
                            (self.available_flash_size / 1024.0).toFixed(1)]));
                        self.upload_procedure(99);
                    } else {
                        self.clearStatus(function () {
                            self.upload_procedure(1);
                        });
                    }
                }
            });
            break;
        case 1:
        if (typeof self.chipInfo.option_bytes === "undefined") {
            console.log('Failed to detect option bytes');
            self.upload_procedure(99);
        }

        var unprotect = function() {
            console.log('Initiate read unprotect');
            GUI.log('Chip seems read protected. Initiating read unprotect');
            $('span.progressLabel').text('Board seems read protected. Unprotecting. Do not disconnect/unplug!');
            self.progress_bar_e.addClass('actionRequired');

            self.controlTransfer('out', self.request.DNLOAD, 0, 0, 0, [0x92], function () { // 0x92 initiates read unprotect
                    self.controlTransfer('in', self.request.GETSTATUS, 0, 0, 6, 0, function (data) {
                        if (data[4] == self.state.dfuDNBUSY) { // completely normal
                            var delay = data[1] | (data[2] << 8) | (data[3] << 16);
                    var total_delay = delay + 20000; // wait at least 20 seconds to make sure the user does not disconnect the board while erasing the memory
                    var timeSpentWaiting = 0;
                    var incr = 1000; // one sec incements
                            var waitForErase = setInterval(function () {
                    self.progress_bar_e.val( Math.min(timeSpentWaiting/total_delay,1) * 100);
                    if(timeSpentWaiting < total_delay)
                    {
                        timeSpentWaiting += incr;
                        return;
                    }
                    clearInterval(waitForErase);
                                self.controlTransfer('in', self.request.GETSTATUS, 0, 0, 6, 0, function (data, error) { // should stall/disconnect
                        if(error) { // we encounter an error, but this is expected. should be a stall.
                            console.log('Unprotect memory command ran successfully. Unplug flight controller. Connect again in DFU mode and try flashing again.');
                            GUI.log('Unprotect successful. ACTION REQUIRED: Unplug and re-connect flight controller in DFU mode to try flashing again!');
                            $('span.progressLabel').text('ACTION REQUIRED: Unplug and re-connect flight controller in DFU mode to try flashing again!');
                            self.progress_bar_e.val(0);
                            self.progress_bar_e.addClass('actionRequired');
                        } else { // unprotecting the flight controller did not work. It did not reboot.
                                            console.log('Failed to execute unprotect memory command');
                            GUI.log('Failed to unprotect chip');
                            $('span.progressLabel').text('Failed to unprotect board');
                            self.progress_bar_e.addClass('invalid');
                            console.log(data);
                                            self.upload_procedure(99);
                        }
                                }, 2000); // this should stall/disconnect anyways. so we only wait 2 sec max.
                            }, incr);
                        } else {
                            console.log('Failed to initiate unprotect memory command');
                    GUI.log('Failed to initiate unprotect routine');
                    $('span.progressLabel').text('Failed to initate unprotect');
                    self.progress_bar_e.addClass('invalid');
                            self.upload_procedure(99);
                        }
                    });
                });
        }


        var tryReadOB = function() {
            // the following should fail if read protection is active
                self.controlTransfer('in', self.request.UPLOAD, 2, 0, self.chipInfo.option_bytes.total_size, 0, function (ob_data, errcode) {
            if(errcode) {
                console.log('USB transfer error while reading option bytes: ' + errcode1);
                self.upload_procedure(99);
                return;
            }
            self.controlTransfer('in', self.request.GETSTATUS, 0, 0, 6, 0, function (data) {
                if (data[4] == self.state.dfuUPLOAD_IDLE && ob_data.length == self.chipInfo.option_bytes.total_size) {
                    console.log('Option bytes read successfully');
                    console.log('Chip does not appear read protected');
                    GUI.log('Read protection not active');
                    // it is pretty safe to continue to erase flash
                    self.clearStatus(function() {
                        self.upload_procedure(2);
                    });
                    /* // this snippet is to protect the flash memory (only for the brave)
                    ob_data[1] = 0x0;
                    var writeOB = function() {
                        self.controlTransfer('out', self.request.DNLOAD, 2, 0, 0, ob_data, function () {
                            self.controlTransfer('in', self.request.GETSTATUS, 0, 0, 6, 0, function (data) {
                                if (data[4] == self.state.dfuDNBUSY) {
                                var delay = data[1] | (data[2] << 8) | (data[3] << 16);

                                setTimeout(function () {
                                    self.controlTransfer('in', self.request.GETSTATUS, 0, 0, 6, 0, function (data) {
                                    if (data[4] == self.state.dfuDNLOAD_IDLE) {
                                        console.log('Failed to write ob');
                                        self.upload_procedure(99);
                                    } else {
                                        console.log('Success writing ob');
                                        self.upload_procedure(99);
                                    }
                                    });
                                }, delay);
                                } else {
                                console.log('Failed to initiate write ob');
                                self.upload_procedure(99);
                                }
                            });
                        });
                    }
                    self.clearStatus(function () {
                        self.loadAddress(self.chipInfo.option_bytes.start_address, function () {
                            self.clearStatus(writeOB);
                        });
                    }); // */
                } else {
                    console.log('Option bytes could not be read. Quite possibly read protected.');
                    self.clearStatus(unprotect);
                }
                });
                });
        }

        var initReadOB = function (loadAddressResponse) {
            // contrary to what is in the docs. Address load should in theory work even if read protection is active
            // if address load fails with this specific error though, it is very likely bc of read protection
            if(loadAddressResponse[4] == self.state.dfuERROR && loadAddressResponse[0] == self.status.errVENDOR) {
                // read protected
            GUI.log('Address load for option bytes sector failed. Very likely due to read protection.');
                        self.clearStatus(unprotect);
            return;
                } else if(loadAddressResponse[4] == self.state.dfuDNLOAD_IDLE) {
            console.log('Address load for option bytes sector succeeded.');
            self.clearStatus(tryReadOB);
            } else {
            GUI.log('Address load for option bytes sector failed with unknown error. Aborting.');
            self.upload_procedure(99);
            }
        }

            self.clearStatus(function () {
            // load address fails if read protection is active unlike as stated in the docs
            self.loadAddress(self.chipInfo.option_bytes.start_address, initReadOB, false);
            });
            break;
        case 2:
            // erase
                // find out which pages to erase
                var erase_pages = [];
                for (var i = 0; i < self.flash_layout.sectors.length; i++) {
                    for (var j = 0; j < self.flash_layout.sectors[i].num_pages; j++) {
                        if (self.options.erase_chip) {
                            // full chip erase
                            erase_pages.push({'sector': i, 'page': j});
                        } else {
                            // local erase
                        var page_start = self.flash_layout.sectors[i].start_address + j * self.flash_layout.sectors[i].page_size;
                        var page_end = page_start + self.flash_layout.sectors[i].page_size - 1;
                        for (var k = 0; k < self.hex.data.length; k++) {
                            var starts_in_page = self.hex.data[k].address >= page_start && self.hex.data[k].address <= page_end;
                            var end_address = self.hex.data[k].address + self.hex.data[k].bytes - 1;
                            var ends_in_page = end_address >= page_start && end_address <= page_end;
                            var spans_page = self.hex.data[k].address < page_start && end_address > page_end;
                            if (starts_in_page || ends_in_page || spans_page) {
                                var idx = erase_pages.findIndex(function (element, index, array) {
                                    return element.sector == i && element.page == j;
                                });
                                if (idx == -1)
                                    erase_pages.push({'sector': i, 'page': j});
                            }
                        }
                    }
                  }
                }
                $('span.progressLabel').text('Erasing ...');
                console.log('Executing local chip erase');

                var page = 0;
                var total_erased = 0; // bytes

                var erase_page = function() {
                    var page_addr = erase_pages[page].page * self.flash_layout.sectors[erase_pages[page].sector].page_size +
                            self.flash_layout.sectors[erase_pages[page].sector].start_address;
                    var cmd = [0x41, page_addr & 0xff, (page_addr >> 8) & 0xff, (page_addr >> 16) & 0xff, (page_addr >> 24) & 0xff];
                    total_erased += self.flash_layout.sectors[erase_pages[page].sector].page_size;
                    console.log('Erasing. sector ' + erase_pages[page].sector +
                                ', page ' + erase_pages[page].page + ' @ 0x' + page_addr.toString(16));

                    self.controlTransfer('out', self.request.DNLOAD, 0, 0, 0, cmd, function () {
                        self.controlTransfer('in', self.request.GETSTATUS, 0, 0, 6, 0, function (data) {
                            if (data[4] == self.state.dfuDNBUSY) { // completely normal
                                var delay = data[1] | (data[2] << 8) | (data[3] << 16);

                                setTimeout(function () {
                                    self.controlTransfer('in', self.request.GETSTATUS, 0, 0, 6, 0, function (data) {
                                        if (data[4] == self.state.dfuDNLOAD_IDLE) {
                                            // update progress bar
                                            self.progress_bar_e.val((page + 1) / erase_pages.length * 100);
                                            page++;

                                            if(page == erase_pages.length) {
                                                console.log("Erase: complete");
                                                GUI.log(chrome.i18n.getMessage('dfu_erased_kilobytes', (total_erased / 1024).toString()));
                                                self.upload_procedure(4);
                                            }
                                            else
                                                erase_page();
                                        } else {
                                            console.log('Failed to erase page 0x' + page_addr.toString(16));
                                            self.upload_procedure(99);
                                        }
                                    });
                                }, delay);
                            } else {
                                console.log('Failed to initiate page erase, page 0x' + page_addr.toString(16));
                                self.upload_procedure(99);
                            }
                        });
                    });
                };

                // start
                erase_page();
            break;

        case 4:
            // upload
            // we dont need to clear the state as we are already using DFU_DNLOAD
            console.log('Writing data ...');
            $('span.progressLabel').text('Flashing ...');

            var blocks = self.hex.data.length - 1;
            var flashing_block = 0;
            var address = self.hex.data[flashing_block].address;

            var bytes_flashed = 0;
            var bytes_flashed_total = 0; // used for progress bar
            var wBlockNum = 2; // required by DFU

            var write = function () {
                if (bytes_flashed < self.hex.data[flashing_block].bytes) {
                    var bytes_to_write = ((bytes_flashed + 2048) <= self.hex.data[flashing_block].bytes) ? 2048 : (self.hex.data[flashing_block].bytes - bytes_flashed);

                    var data_to_flash = self.hex.data[flashing_block].data.slice(bytes_flashed, bytes_flashed + bytes_to_write);

                    address += bytes_to_write;
                    bytes_flashed += bytes_to_write;
                    bytes_flashed_total += bytes_to_write;

                    self.controlTransfer('out', self.request.DNLOAD, wBlockNum++, 0, 0, data_to_flash, function () {
                        self.controlTransfer('in', self.request.GETSTATUS, 0, 0, 6, 0, function (data) {
                            if (data[4] == self.state.dfuDNBUSY) {
                                var delay = data[1] | (data[2] << 8) | (data[3] << 16);

                                setTimeout(function () {
                                    self.controlTransfer('in', self.request.GETSTATUS, 0, 0, 6, 0, function (data) {
                                        if (data[4] == self.state.dfuDNLOAD_IDLE) {
                                            // update progress bar
                                            self.progress_bar_e.val(bytes_flashed_total / (self.hex.bytes_total * 2) * 100);

                                            // flash another page
                                            write();
                                        } else {
                                            console.log('Failed to write ' + bytes_to_write + 'bytes to 0x' + address.toString(16));
                                            self.upload_procedure(99);
                                        }
                                    });
                                }, delay);
                            } else {
                                console.log('Failed to initiate write ' + bytes_to_write + 'bytes to 0x' + address.toString(16));
                                self.upload_procedure(99);
                            }
                        });
                    })
                } else {
                    if (flashing_block < blocks) {
                        // move to another block
                        flashing_block++;

                        address = self.hex.data[flashing_block].address;
                        bytes_flashed = 0;
                        wBlockNum = 2;

                        self.loadAddress(address, write);
                    } else {
                        // all blocks flashed
                        console.log('Writing: done');

                        // proceed to next step
                        self.upload_procedure(5);
                    }
                }
            }

            // start
            self.loadAddress(address, write);

            break;
        case 5:
            // verify
            console.log('Verifying data ...');
            $('span.progressLabel').text('Verifying ...');

            var blocks = self.hex.data.length - 1;
            var reading_block = 0;
            var address = self.hex.data[reading_block].address;

            var bytes_verified = 0;
            var bytes_verified_total = 0; // used for progress bar
            var wBlockNum = 2; // required by DFU

            // initialize arrays
            for (var i = 0; i <= blocks; i++) {
                self.verify_hex.push([]);
            }

            // start
            self.clearStatus(function () {
                self.loadAddress(address, function () {
                    self.clearStatus(read);
                });
            });

            var read = function () {
                if (bytes_verified < self.hex.data[reading_block].bytes) {
                    var bytes_to_read = ((bytes_verified + 2048) <= self.hex.data[reading_block].bytes) ? 2048 : (self.hex.data[reading_block].bytes - bytes_verified);

                    self.controlTransfer('in', self.request.UPLOAD, wBlockNum++, 0, bytes_to_read, 0, function (data, code) {
                        for (var i = 0; i < data.length; i++) {
                            self.verify_hex[reading_block].push(data[i]);
                        }

                        address += bytes_to_read;
                        bytes_verified += bytes_to_read;
                        bytes_verified_total += bytes_to_read;

                        // update progress bar
                        self.progress_bar_e.val((self.hex.bytes_total + bytes_verified_total) / (self.hex.bytes_total * 2) * 100);

                        // verify another page
                        read();
                    });
                } else {
                    if (reading_block < blocks) {
                        // move to another block
                        reading_block++;

                        address = self.hex.data[reading_block].address;
                        bytes_verified = 0;
                        wBlockNum = 2;

                        self.clearStatus(function () {
                            self.loadAddress(address, function () {
                                self.clearStatus(read);
                            });
                        });
                    } else {
                        // all blocks read, verify

                        var verify = true;
                        for (var i = 0; i <= blocks; i++) {
                            verify = self.verify_flash(self.hex.data[i].data, self.verify_hex[i]);

                            if (!verify) break;
                        }

                        if (verify) {
                            console.log('Programming: SUCCESSFUL');
                            $('span.progressLabel').text('Programming: SUCCESSFUL');

                            // update progress bar
                            self.progress_bar_e.addClass('valid');

                            // proceed to next step
                            self.upload_procedure(6);
                        } else {
                            console.log('Programming: FAILED');
                            $('span.progressLabel').text('Programming: FAILED');

                            // update progress bar
                            self.progress_bar_e.addClass('invalid');

                            // disconnect
                            self.upload_procedure(99);
                        }
                    }
                }
            }
            break;
        case 6:
            // jump to application code
            var address = self.hex.data[0].address;

            self.clearStatus(function () {
                self.loadAddress(address, leave);
            });

            var leave = function () {
                self.controlTransfer('out', self.request.DNLOAD, 0, 0, 0, 0, function () {
                    self.controlTransfer('in', self.request.GETSTATUS, 0, 0, 6, 0, function (data) {
                        self.upload_procedure(99);
                    });
                });
            }

            break;
        case 99:
            // cleanup
            self.releaseInterface(0);

            GUI.connect_lock = false;

            var timeSpent = new Date().getTime() - self.upload_time_start;

            console.log('Script finished after: ' + (timeSpent / 1000) + ' seconds');

            if (self.callback) self.callback();
            break;
    }
};

// initialize object
var STM32DFU = new STM32DFU_protocol();