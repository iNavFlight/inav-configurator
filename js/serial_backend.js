/*global chrome, chrome.i18n*/
'use strict';

$(document).ready(function () {

    var $port = $('#port'),
        $baud = $('#baud'),
        $portOverride = $('#port-override');

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

        if (BOARD.find_board_definition(CONFIG.boardIdentifier).vcp) { // VCP-based flight controls may crash old drivers, we catch and reconnect

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
                $('a.connect').click();

                /*
                 Open configuration tab
                 */
                if ($tabElement != null) {
                    setTimeout(function () {
                        $tabElement.click();
                    }, 500);
                }

            }, 5000);
        } else {

            helper.timeout.add('waiting_for_bootup', function waiting_for_bootup() {
                MSP.send_message(MSPCodes.MSP_STATUS, false, false, function () {
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
        if (selected_port.data().isManual) {
            $('#port-override-option').show();
        }
        else {
            $('#port-override-option').hide();
        }
        if (selected_port.data().isDFU) {
            $baud.hide();
        }
        else {
            $baud.show();
        }
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

                    serial.connect(selected_port, {bitrate: selected_baud}, onOpen);
                } else {
                    var wasConnected = CONFIGURATOR.connectionValid;

                    helper.timeout.killAll();
                    helper.interval.killAll(['global_data_refresh', 'msp-load-update']);
                    helper.mspBalancedInterval.flush();

                    GUI.tab_switch_cleanup();
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

                    serial.disconnect(onClosed);
                    MSP.disconnect_cleanup();

                    // Reset various UI elements
                    $('span.i2c-error').text(0);
                    $('span.cycle-time').text(0);
                    $('span.cpu-load').text('');

                    // unlock port select & baud
                    $port.prop('disabled', false);
                    if (!GUI.auto_connect) {
                        $baud.prop('disabled', false);
                    }

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

                $(this).data("clicks", !clicks);
            }
        }
    });

    // auto-connect
    chrome.storage.local.get('auto_connect', function (result) {
        if (result.auto_connect === 'undefined' || result.auto_connect) {
            // default or enabled by user
            GUI.auto_connect = true;

            $('input.auto_connect').prop('checked', true);
            $('input.auto_connect, span.auto_connect').prop('title', chrome.i18n.getMessage('autoConnectEnabled'));

            $baud.val(115200).prop('disabled', true);
        } else {
            // disabled by user
            GUI.auto_connect = false;

            $('input.auto_connect').prop('checked', false);
            $('input.auto_connect, span.auto_connect').prop('title', chrome.i18n.getMessage('autoConnectDisabled'));
        }

        // bind UI hook to auto-connect checkbos
        $('input.auto_connect').change(function () {
            GUI.auto_connect = $(this).is(':checked');

            // update title/tooltip
            if (GUI.auto_connect) {
                $('input.auto_connect, span.auto_connect').prop('title', chrome.i18n.getMessage('autoConnectEnabled'));

                $baud.val(115200).prop('disabled', true);
            } else {
                $('input.auto_connect, span.auto_connect').prop('title', chrome.i18n.getMessage('autoConnectDisabled'));

                if (!GUI.connected_to && !GUI.connecting_to) $('select#baud').prop('disabled', false);
            }

            chrome.storage.local.set({'auto_connect': GUI.auto_connect});


        });
    });

    PortHandler.initialize();
});

function onOpen(openInfo) {
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

        chrome.storage.local.set({last_used_bps: serial.bitrate});
        chrome.storage.local.set({wireless_mode_enabled: $('#wireless-mode').is(":checked")});

        serial.onReceive.addListener(read_serial);

        // disconnect after 10 seconds with error if we don't get IDENT data
        helper.timeout.add('connecting', function () {
            if (!CONFIGURATOR.connectionValid) {
                GUI.log(chrome.i18n.getMessage('noConfigurationReceived'));

                $('div.connect_controls ').click(); // disconnect
            }
        }, 10000);

        FC.resetState();

        // request configuration data. Start with MSPv1 and
        // upgrade to MSPv2 if possible.
        MSP.protocolVersion = MSP.constants.PROTOCOL_V1;
        MSP.send_message(MSPCodes.MSP_API_VERSION, false, false, function () {
            if (CONFIG.apiVersion && semver.gte(CONFIG.apiVersion, "2.0.0")) {
                MSP.protocolVersion = MSP.constants.PROTOCOL_V2;
            }
            GUI.log(chrome.i18n.getMessage('apiVersionReceived', [CONFIG.apiVersion]));

            if (semver.gte(CONFIG.apiVersion, CONFIGURATOR.apiVersionAccepted)) {

                MSP.send_message(MSPCodes.MSP_FC_VARIANT, false, false, function () {

                    MSP.send_message(MSPCodes.MSP_FC_VERSION, false, false, function () {

                        googleAnalytics.sendEvent('Firmware', 'Variant', CONFIG.flightControllerIdentifier + ',' + CONFIG.flightControllerVersion);
                        GUI.log(chrome.i18n.getMessage('fcInfoReceived', [CONFIG.flightControllerIdentifier, CONFIG.flightControllerVersion]));

                        if (CONFIG.flightControllerIdentifier == 'INAV') {

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
                                        //TODO here we can remove led_strip tab from NAZE and CC3D at least!

                                        if (semver.lt(CONFIG.flightControllerVersion, "1.5.0")) {
                                            GUI.allowedTabs.splice(GUI.allowedTabs.indexOf('osd'), 1);
                                        }

                                        /*
                                         * Remove Presets on older than 1.6
                                         */
                                        if (semver.lt(CONFIG.flightControllerVersion, "1.6.0")) {
                                            GUI.allowedTabs.splice(GUI.allowedTabs.indexOf('profiles'), 1);
                                            GUI.allowedTabs.splice(GUI.allowedTabs.indexOf('advanced_tuning'), 1);
                                        }

                                        onConnect();

                                        $('#tabs ul.mode-connected .tab_setup a').click();
                                    });
                                });
                            });
                        } else  {
                            GUI.log(chrome.i18n.getMessage('firmwareVariantNotSupported'));
                            CONFIGURATOR.connectionValid = true; // making it possible to open the CLI tab
                            GUI.allowedTabs = ['cli'];
                            onConnect();
                            $('#tabs .tab_cli a').click();
                        }
                    });
                });
            } else {
                GUI.log(chrome.i18n.getMessage('firmwareVersionNotSupported', [CONFIGURATOR.apiVersionAccepted]));
                CONFIGURATOR.connectionValid = true; // making it possible to open the CLI tab
                GUI.allowedTabs = ['cli'];
                onConnect();
                $('#tabs .tab_cli a').click();
            }
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

    helper.interval.add('msp-load-update', function () {
        $('#msp-version').text("MSP version: " + MSP.protocolVersion.toFixed(0));
        $('#msp-load').text("MSP load: " + helper.mspQueue.getLoad().toFixed(1));
        $('#msp-roundtrip').text("MSP round trip: " + helper.mspQueue.getRoundtrip().toFixed(0));
        $('#hardware-roundtrip').text("HW round trip: " + helper.mspQueue.getHardwareRoundtrip().toFixed(0));
        $('#drop-rate').text("Drop ratio: " + helper.mspQueue.getDropRatio().toFixed(0) + "%");
    }, 100);

    helper.interval.add('global_data_refresh', helper.periodicStatusUpdater.run, helper.periodicStatusUpdater.getUpdateInterval(serial.bitrate), false);
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
