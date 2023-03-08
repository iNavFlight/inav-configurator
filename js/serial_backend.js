/*global chrome, chrome.i18n*/
'use strict';

$(document).ready(function () {

    var $port = $('#port'),
        $baud = $('#baud'),
        $portOverride = $('#port-override'),
        isDemoRunning = false;

    /*
     * Handle "Wireless" mode with strict queueing of messages
     */
    $('#wireless-mode').change(function () {
        var $this = $(this);

        if ($this.is(':checked')) {
            helper.mspQueue.setLockMethod('hard');
        } else {
            helper.mspQueue.setLockMethod('soft');
        }
    });

    GUI.handleReconnect = function ($tabElement) {

        let modal;

        if (BOARD.hasVcp(CONFIG.boardIdentifier)) { // VCP-based flight controls may crash old drivers, we catch and reconnect

            modal = new jBox('Modal', {
                width: 400,
                height: 100,
                animation: false,
                closeOnClick: false,
                closeOnEsc: false,
                content: $('#modal-reconnect')
            }).open();

            /*
             Disconnect
             */
            setTimeout(function () {
                $('a.connect').click();
            }, 100);

            /*
             Connect again
             */
            setTimeout(function start_connection() {
                modal.close();
                $('a.connect').click();

                /*
                 Open configuration tab
                 */
                if ($tabElement != null) {
                    setTimeout(function () {
                        $tabElement.click();
                    }, 500);
                }

            }, 7000);
        } else {

            helper.timeout.add('waiting_for_bootup', function waiting_for_bootup() {
                MSP.send_message(MSPCodes.MSPV2_INAV_STATUS, false, false, function () {
                    //noinspection JSUnresolvedVariable
                    GUI.log(chrome.i18n.getMessage('deviceReady'));
                    //noinspection JSValidateTypes
                    TABS.configuration.initialize(false, $('#content').scrollTop());
                });
            },1500); // 1500 ms seems to be just the right amount of delay to prevent data request timeouts
        }
    };

    

    GUI.updateManualPortVisibility = function(){
        var selected_port = $port.find('option:selected');
        if (selected_port.data().isManual || selected_port.data().isTcp || selected_port.data().isUdp) {
            $('#port-override-option').show();
        }
        else {
            $('#port-override-option').hide();
        }

        if (selected_port.data().isTcp || selected_port.data().isUdp) {
            $('#port-override-label').text("IP:Port");
        } else {
            $('#port-override-label').text("Port");
        }

        if (selected_port.data().isDFU || selected_port.data().isBle || selected_port.data().isTcp || selected_port.data().isUdp || selected_port.data().isSitl) {
            $baud.hide();
        }
        else {
            $baud.show();
        }        

        if (selected_port.data().isBle || selected_port.data().isTcp || selected_port.data().isUdp || selected_port.data().isSitl) {
            $('.tab_firmware_flasher').hide();
        } else {
            $('.tab_firmware_flasher').show();
        }
        var type = ConnectionType.Serial;
        if (selected_port.data().isBle) {
            type = ConnectionType.BLE;
        } else if (selected_port.data().isTcp || selected_port.data().isSitl) {
            type = ConnectionType.TCP;
        } else if (selected_port.data().isUdp) {
            type = ConnectionType.UDP;
        } 
        CONFIGURATOR.connection = Connection.create(type);
        
    };

    GUI.updateManualPortVisibility();

    $portOverride.change(function () {
        chrome.storage.local.set({'portOverride': $portOverride.val()});
    });

    chrome.storage.local.get('portOverride', function (data) {
        $portOverride.val(data.portOverride);
    });

    $port.change(function (target) {
        GUI.updateManualPortVisibility();
    });

    $('div.connect_controls a.connect').click(function () {
        if (GUI.connect_lock != true) { // GUI control overrides the user control

            var clicks = $(this).data('clicks');
            var selected_baud = parseInt($baud.val());
            var selected_port = $port.find('option:selected').data().isManual ?
                    $portOverride.val() :
                    String($port.val());
            
            if (selected_port === 'DFU') {
                GUI.log(chrome.i18n.getMessage('dfu_connect_message'));
            }
            else if (selected_port != '0') {
                if (!clicks) {
                    console.log('Connecting to: ' + selected_port);
                    GUI.connecting_to = selected_port;

                    // lock port select & baud while we are connecting / connected
                    $('#port, #baud, #delay').prop('disabled', true);
                    $('div.connect_controls a.connect_state').text(chrome.i18n.getMessage('connecting'));

                    if (selected_port == 'tcp' || selected_port == 'udp') {
                        CONFIGURATOR.connection.connect($portOverride.val(), {}, onOpen);
                    } else if (selected_port == 'sitl') {
                        CONFIGURATOR.connection.connect("127.0.0.1:5760", {}, onOpen);
                    } else if (selected_port == 'sitl-demo') {
                        if (SITLProcess.isRunning) {
                            SITLProcess.stop();
                        }
                        SITLProcess.start("demo.bin");
                        this.isDemoRunning = true;
                        CONFIGURATOR.connection.connect("127.0.0.1:5760", {}, onOpen);
                    } else {
                        CONFIGURATOR.connection.connect(selected_port, {bitrate: selected_baud}, onOpen);
                    }
                } else {
                     if (this.isDemoRunning) {
                        SITLProcess.stop();
                        this.isDemoRunning = false;
                     }
                    
                    var wasConnected = CONFIGURATOR.connectionValid;

                    helper.timeout.killAll();
                    helper.interval.killAll(['global_data_refresh', 'msp-load-update']);
                    helper.mspBalancedInterval.flush();

                    if (CONFIGURATOR.cliActive) {
                        GUI.tab_switch_cleanup(finishDisconnect);
                    } else {
                        GUI.tab_switch_cleanup();
                        finishDisconnect();

                    }

                    function finishDisconnect() {
                        GUI.tab_switch_in_progress = false;
                        CONFIGURATOR.connectionValid = false;
                        GUI.connected_to = false;
                        GUI.allowedTabs = GUI.defaultAllowedTabsWhenDisconnected.slice();

                        /*
                         * Flush
                         */
                        helper.mspQueue.flush();
                        helper.mspQueue.freeHardLock();
                        helper.mspQueue.freeSoftLock();

                        CONFIGURATOR.connection.disconnect(onClosed);
                        MSP.disconnect_cleanup();

                        // Reset various UI elements
                        $('span.i2c-error').text(0);
                        $('span.cycle-time').text(0);
                        $('span.cpu-load').text('');

                        // unlock port select & baud
                        $port.prop('disabled', false);
                        $baud.prop('disabled', false);

                        // reset connect / disconnect button
                        $('div.connect_controls a.connect').removeClass('active');
                        $('div.connect_controls a.connect_state').text(chrome.i18n.getMessage('connect'));

                        // reset active sensor indicators
                        sensor_status(0);

                        if (wasConnected) {
                            // detach listeners and remove element data
                            $('#content').empty();
                        }

                        $('#tabs .tab_landing a').click();
                    }
                }

                $(this).data("clicks", !clicks);
            }
        }
    });

    PortHandler.initialize();
});

function onValidFirmware()
{
    MSP.send_message(MSPCodes.MSP_BUILD_INFO, false, false, function () {

        googleAnalytics.sendEvent('Firmware', 'Using', CONFIG.buildInfo);
        GUI.log(chrome.i18n.getMessage('buildInfoReceived', [CONFIG.buildInfo]));

        MSP.send_message(MSPCodes.MSP_BOARD_INFO, false, false, function () {

            googleAnalytics.sendEvent('Board', 'Using', CONFIG.boardIdentifier + ',' + CONFIG.boardVersion);
            GUI.log(chrome.i18n.getMessage('boardInfoReceived', [CONFIG.boardIdentifier, CONFIG.boardVersion]));

            MSP.send_message(MSPCodes.MSP_UID, false, false, function () {

                GUI.log(chrome.i18n.getMessage('uniqueDeviceIdReceived', [CONFIG.uid[0].toString(16) + CONFIG.uid[1].toString(16) + CONFIG.uid[2].toString(16)]));

                // continue as usually
                CONFIGURATOR.connectionValid = true;
                GUI.allowedTabs = GUI.defaultAllowedTabsWhenConnected.slice();
                onConnect();

                helper.defaultsDialog.init();

                $('#tabs ul.mode-connected .tab_setup a').click();

                updateFirmwareVersion();
            });
        });
    });
}

function onInvalidFirmwareVariant()
{
    GUI.log(chrome.i18n.getMessage('firmwareVariantNotSupported'));
    CONFIGURATOR.connectionValid = true; // making it possible to open the CLI tab
    GUI.allowedTabs = ['cli'];
    onConnect();
    $('#tabs .tab_cli a').click();
}

function onInvalidFirmwareVersion()
{
    GUI.log(chrome.i18n.getMessage('firmwareVersionNotSupported', [CONFIGURATOR.minfirmwareVersionAccepted, CONFIGURATOR.maxFirmwareVersionAccepted]));
    CONFIGURATOR.connectionValid = true; // making it possible to open the CLI tab
    GUI.allowedTabs = ['cli'];
    onConnect();
    $('#tabs .tab_cli a').click();
}

function onBleNotSupported() {
    GUI.log(chrome.i18n.getMessage('connectionBleNotSupported'));
    CONFIGURATOR.connection.abort();
}


function onOpen(openInfo) {

    if (FC.restartRequired) {
        GUI_control.prototype.log("<span style='color: red; font-weight: bolder'><strong>" + chrome.i18n.getMessage("illegalStateRestartRequired") + "</strong></span>");
        $('div.connect_controls a').click(); // disconnect
        return;
    }

    if (openInfo) {
        // update connected_to
        GUI.connected_to = GUI.connecting_to;

        // reset connecting_to
        GUI.connecting_to = false;

        GUI.log(chrome.i18n.getMessage('serialPortOpened', [openInfo.connectionId]));

        // save selected port with chrome.storage if the port differs
        chrome.storage.local.get('last_used_port', function (result) {
            if (result.last_used_port) {
                if (result.last_used_port != GUI.connected_to) {
                    // last used port doesn't match the one found in local db, we will store the new one
                    chrome.storage.local.set({'last_used_port': GUI.connected_to});
                }
            } else {
                // variable isn't stored yet, saving
                chrome.storage.local.set({'last_used_port': GUI.connected_to});
            }
        });

        chrome.storage.local.set({last_used_bps: CONFIGURATOR.connection.bitrate});
        chrome.storage.local.set({wireless_mode_enabled: $('#wireless-mode').is(":checked")});

        CONFIGURATOR.connection.addOnReceiveListener(read_serial);

        // disconnect after 10 seconds with error if we don't get IDENT data
        helper.timeout.add('connecting', function () {
            if (!CONFIGURATOR.connectionValid) {
                GUI.log(chrome.i18n.getMessage('noConfigurationReceived'));

                helper.mspQueue.flush();
                helper.mspQueue.freeHardLock();
                helper.mspQueue.freeSoftLock();
                CONFIGURATOR.connection.emptyOutputBuffer();

                $('div.connect_controls a').click(); // disconnect
            }
        }, 10000);

        FC.resetState();

        // request configuration data. Start with MSPv1 and
        // upgrade to MSPv2 if possible.
        MSP.protocolVersion = MSP.constants.PROTOCOL_V2;
        MSP.send_message(MSPCodes.MSP_API_VERSION, false, false, function () {
            
            if (CONFIG.apiVersion === "0.0.0") {
                GUI_control.prototype.log("<span style='color: red; font-weight: bolder'><strong>" + chrome.i18n.getMessage("illegalStateRestartRequired") + "</strong></span>");
                FC.restartRequired = true;
                return;
            }

            GUI.log(chrome.i18n.getMessage('apiVersionReceived', [CONFIG.apiVersion]));

            MSP.send_message(MSPCodes.MSP_FC_VARIANT, false, false, function () {
                if (CONFIG.flightControllerIdentifier == 'INAV') {
                    MSP.send_message(MSPCodes.MSP_FC_VERSION, false, false, function () {
                        googleAnalytics.sendEvent('Firmware', 'Variant', CONFIG.flightControllerIdentifier + ',' + CONFIG.flightControllerVersion);
                        GUI.log(chrome.i18n.getMessage('fcInfoReceived', [CONFIG.flightControllerIdentifier, CONFIG.flightControllerVersion]));
                        if (semver.gte(CONFIG.flightControllerVersion, CONFIGURATOR.minfirmwareVersionAccepted) && semver.lt(CONFIG.flightControllerVersion, CONFIGURATOR.maxFirmwareVersionAccepted)) {
                            if (CONFIGURATOR.connection.type == ConnectionType.BLE && semver.lt(CONFIG.flightControllerVersion, "5.0.0")) {  
                                onBleNotSupported();
                            } else {
                                mspHelper.getCraftName(function(name) {
                                    if (name) {
                                        CONFIG.name = name;
                                    }
                                    onValidFirmware();  
                                });
                            }
                        } else  {
                            onInvalidFirmwareVersion();
                        }
                    });
                } else {
                    onInvalidFirmwareVariant();
                }
            });
        });
    } else {
        console.log('Failed to open serial port');
        GUI.log(chrome.i18n.getMessage('serialPortOpenFail'));

        var $connectButton = $('#connectbutton');

        $connectButton.find('.connect_state').text(chrome.i18n.getMessage('connect'));
        $connectButton.find('.connect').removeClass('active');

        // unlock port select & baud
        $('#port, #baud, #delay').prop('disabled', false);

        // reset data
        $connectButton.find('.connect').data("clicks", false);
    }
}

function onConnect() {
    helper.timeout.remove('connecting'); // kill connecting timer
    $('#connectbutton a.connect_state').text(chrome.i18n.getMessage('disconnect')).addClass('active');
    $('#connectbutton a.connect').addClass('active');
    $('.mode-disconnected').hide();
    $('.mode-connected').show();

    MSP.send_message(MSPCodes.MSP_DATAFLASH_SUMMARY, false, false);

    $('#sensor-status').show();
    $('#portsinput').hide();
    $('#dataflash_wrapper_global').show();

    /*
     * Get BOXNAMES since it is used for some reason....
     */
    MSP.send_message(MSPCodes.MSP_BOXNAMES, false, false);

    /*
     * Init PIDs bank with a length that depends on the version
     */
    let pidCount = 11;

    for (let i = 0; i < pidCount; i++) {
        PIDs.push(new Array(4));
    }

    helper.interval.add('msp-load-update', function () {
        $('#msp-version').text("MSP version: " + MSP.protocolVersion.toFixed(0));
        $('#msp-load').text("MSP load: " + helper.mspQueue.getLoad().toFixed(1));
        $('#msp-roundtrip').text("MSP round trip: " + helper.mspQueue.getRoundtrip().toFixed(0));
        $('#hardware-roundtrip').text("HW round trip: " + helper.mspQueue.getHardwareRoundtrip().toFixed(0));
        $('#drop-rate').text("Drop ratio: " + helper.mspQueue.getDropRatio().toFixed(0) + "%");
    }, 100);

    helper.interval.add('global_data_refresh', helper.periodicStatusUpdater.run, helper.periodicStatusUpdater.getUpdateInterval(CONFIGURATOR.connection.bitrate), false);
}

function onClosed(result) {
    if (result) { // All went as expected
        GUI.log(chrome.i18n.getMessage('serialPortClosedOk'));
    } else { // Something went wrong
        GUI.log(chrome.i18n.getMessage('serialPortClosedFail'));
    }

    $('.mode-connected').hide();
    $('.mode-disconnected').show();

    $('#sensor-status').hide();
    $('#portsinput').show();
    $('#dataflash_wrapper_global').hide();
    $('#quad-status_wrapper').hide();

    updateFirmwareVersion();
}

function read_serial(info) {
    if (!CONFIGURATOR.cliActive) {
        MSP.read(info);
    } else if (CONFIGURATOR.cliActive) {
        TABS.cli.read(info);
    }
}

/**
 * Sensor handler used in INAV >= 1.5
 * @param hw_status
 */
function sensor_status_ex(hw_status)
{
    var statusHash = sensor_status_hash(hw_status);

    if (sensor_status_ex.previousHash == statusHash) {
        return;
    }

    sensor_status_ex.previousHash = statusHash;

    sensor_status_update_icon('.gyro',      '.gyroicon',        hw_status.gyroHwStatus);
    sensor_status_update_icon('.accel',     '.accicon',         hw_status.accHwStatus);
    sensor_status_update_icon('.mag',       '.magicon',         hw_status.magHwStatus);
    sensor_status_update_icon('.baro',      '.baroicon',        hw_status.baroHwStatus);
    sensor_status_update_icon('.gps',       '.gpsicon',         hw_status.gpsHwStatus);
    sensor_status_update_icon('.sonar',     '.sonaricon',       hw_status.rangeHwStatus);
    sensor_status_update_icon('.airspeed',  '.airspeedicon',    hw_status.speedHwStatus);
    sensor_status_update_icon('.opflow',    '.opflowicon',      hw_status.flowHwStatus);
}

function sensor_status_update_icon(sensId, sensIconId, status)
{
    var e_sensor_status = $('#sensor-status');

    if (status == 0) {
        $(sensId, e_sensor_status).removeClass('on');
        $(sensIconId, e_sensor_status).removeClass('active');
        $(sensIconId, e_sensor_status).removeClass('error');
    }
    else if (status == 1) {
        $(sensId, e_sensor_status).addClass('on');
        $(sensIconId, e_sensor_status).addClass('active');
        $(sensIconId, e_sensor_status).removeClass('error');
    }
    else {
        $(sensId, e_sensor_status).removeClass('on');
        $(sensIconId, e_sensor_status).removeClass('active');
        $(sensIconId, e_sensor_status).addClass('error');
    }
}

function sensor_status_hash(hw_status)
{
    return "S" +
           hw_status.isHardwareHealthy +
           hw_status.gyroHwStatus +
           hw_status.accHwStatus +
           hw_status.magHwStatus +
           hw_status.baroHwStatus +
           hw_status.gpsHwStatus +
           hw_status.rangeHwStatus +
           hw_status.speedHwStatus +
           hw_status.flowHwStatus;
}

/**
 * Legacy sensor handler used in INAV < 1.5 versions
 * @param sensors_detected
 * @deprecated
 */
function sensor_status(sensors_detected) {

    if (typeof SENSOR_STATUS === 'undefined') {
        return;
    }

    SENSOR_STATUS.isHardwareHealthy = 1;
    SENSOR_STATUS.gyroHwStatus      = have_sensor(sensors_detected, 'gyro') ? 1 : 0;
    SENSOR_STATUS.accHwStatus       = have_sensor(sensors_detected, 'acc') ? 1 : 0;
    SENSOR_STATUS.magHwStatus       = have_sensor(sensors_detected, 'mag') ? 1 : 0;
    SENSOR_STATUS.baroHwStatus      = have_sensor(sensors_detected, 'baro') ? 1 : 0;
    SENSOR_STATUS.gpsHwStatus       = have_sensor(sensors_detected, 'gps') ? 1 : 0;
    SENSOR_STATUS.rangeHwStatus     = have_sensor(sensors_detected, 'sonar') ? 1 : 0;
    SENSOR_STATUS.speedHwStatus     = have_sensor(sensors_detected, 'airspeed') ? 1 : 0;
    SENSOR_STATUS.flowHwStatus      = have_sensor(sensors_detected, 'opflow') ? 1 : 0;
    sensor_status_ex(SENSOR_STATUS);
}

function have_sensor(sensors_detected, sensor_code) {
    switch(sensor_code) {
        case 'acc':
        case 'gyro':
            return bit_check(sensors_detected, 0);
        case 'baro':
            return bit_check(sensors_detected, 1);
        case 'mag':
            return bit_check(sensors_detected, 2);
        case 'gps':
            return bit_check(sensors_detected, 3);
        case 'sonar':
            return bit_check(sensors_detected, 4);
        case 'opflow':
            return bit_check(sensors_detected, 5);
        case 'airspeed':
            return bit_check(sensors_detected, 6);
    }
    return false;
}

function highByte(num) {
    return num >> 8;
}

function lowByte(num) {
    return 0x00FF & num;
}

function specificByte(num, pos) {
    return 0x000000FF & (num >> (8 * pos));
}

function bit_check(num, bit) {
    return ((num >> bit) % 2 != 0);
}

function bit_set(num, bit) {
    return num | 1 << bit;
}

function bit_clear(num, bit) {
    return num & ~(1 << bit);
}

function update_dataflash_global() {
    function formatFilesize(bytes) {
        if (bytes < 1024) {
            return bytes + "B";
        }
        var kilobytes = bytes / 1024;

        if (kilobytes < 1024) {
            return Math.round(kilobytes) + "kB";
        }

        var megabytes = kilobytes / 1024;

        return megabytes.toFixed(1) + "MB";
    }

    var supportsDataflash = DATAFLASH.totalSize > 0;

    if (supportsDataflash){
        $(".noflash_global").css({
           display: 'none'
        });

        $(".dataflash-contents_global").css({
           display: 'block'
        });

        $(".dataflash-free_global").css({
           width: (100-(DATAFLASH.totalSize - DATAFLASH.usedSize) / DATAFLASH.totalSize * 100) + "%",
           display: 'block'
        });
        $(".dataflash-free_global div").text('Dataflash: free ' + formatFilesize(DATAFLASH.totalSize - DATAFLASH.usedSize));
     } else {
        $(".noflash_global").css({
           display: 'block'
        });

        $(".dataflash-contents_global").css({
           display: 'none'
        });
     }
}
