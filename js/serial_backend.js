'use strict';

const semver = require('semver');
const Store = require('electron-store');
const store = new Store();

const { GUI, TABS } = require('./gui');
const MSP = require('./msp');
const FC = require('./fc');
const MSPCodes = require('./msp/MSPCodes');
const mspHelper = require('./msp/MSPHelper');
const { ConnectionType, Connection } = require('./connection/connection');
const connectionFactory = require('./connection/connectionFactory');
const CONFIGURATOR = require('./data_storage');
const  { PortHandler } = require('./port_handler');
const i18n = require('./../js/localization');
const interval = require('./intervals');
const periodicStatusUpdater = require('./periodicStatusUpdater');
const mspQueue = require('./serial_queue');
const timeout = require('./timeouts');
const defaultsDialog = require('./defaults_dialog');
const { SITLProcess } = require('./sitl');
const update = require('./globalUpdates');
const BitHelper = require('./bitHelper');
const BOARD = require('./boards');
const jBox = require('./libraries/jBox/jBox.min');
const groundstation = require('./groundstation');
const ltmDecoder = require('./ltmDecoder');
const mspDeduplicationQueue = require('./msp/mspDeduplicationQueue');

var SerialBackend = (function () {

    var publicScope = {},
        privateScope = {};
        
    privateScope.isDemoRunning = false;

    privateScope.isWirelessMode = false;

    /*
     * Handle "Wireless" mode with strict queueing of messages
     */
    publicScope.init = function() {
        
        privateScope.$port = $('#port'),
        privateScope.$baud = $('#baud'),
        publicScope.$portOverride = $('#port-override'),
        mspHelper.setSensorStatusEx(privateScope.sensor_status_ex);
        
        $('#wireless-mode').on('change', function () {
            var $this = $(this);

            if ($this.is(':checked')) {
                mspQueue.setLockMethod('hard');
            } else {
                mspQueue.setLockMethod('soft');
            }
        });

        GUI.handleReconnect = function ($tabElement) {

            let modal;

            if (BOARD.hasVcp(FC.CONFIG.boardIdentifier)) { // VCP-based flight controls may crash old drivers, we catch and reconnect

                modal = new jBox('Modal', {
                    width: 400,
                    height: 120,
                    animation: false,
                    closeOnClick: false,
                    closeOnEsc: false,
                    content: $('#modal-reconnect')
                }).open();

                /*
                Disconnect
                */
                setTimeout(function () {
                    $('a.connect').trigger( "click" );
                }, 100);

                /*
                Connect again
                */
                setTimeout(function start_connection() {
                    modal.close();
                    $('a.connect').trigger( "click" );

                    /*
                    Open configuration tab
                    */
                    if ($tabElement != null) {
                        setTimeout(function () {
                            $tabElement.trigger( "click" );
                        }, 500);
                    }

                }, 7000);
            } else {
                timeout.add('waiting_for_bootup', function waiting_for_bootup() {
                    MSP.send_message(MSPCodes.MSPV2_INAV_STATUS, false, false, function () {
                        //noinspection JSUnresolvedVariable
                        GUI.log(i18n.getMessage('deviceReady'));
                        //noinspection JSValidateTypes
                        TABS.configuration.initialize(false, $('#content').scrollTop());
                    });
                },1500); // 1500 ms seems to be just the right amount of delay to prevent data request timeouts
            }
        };

        

        GUI.updateManualPortVisibility = function(){
            var selected_port = privateScope.$port.find('option:selected');
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
                privateScope.$baud.hide();
            }
            else {
                privateScope.$baud.show();
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
            CONFIGURATOR.connection = connectionFactory(type, CONFIGURATOR.connection);
            
        };

        GUI.updateManualPortVisibility();

        publicScope.$portOverride.on('change', function () {
            store.set('portOverride', publicScope.$portOverride.val());
        });

        publicScope.$portOverride.val(store.get('portOverride', ''));
        

        privateScope.$port.on('change', function (target) {
            GUI.updateManualPortVisibility();
        });

    $('div.connect_controls a.connect').click(function () {

        if (groundstation.isActivated()) {
            groundstation.deactivate();
        }

        if (GUI.connect_lock != true) { // GUI control overrides the user control

                var clicks = $(this).data('clicks');
                var selected_baud = parseInt(privateScope.$baud.val());
                var selected_port = privateScope.$port.find('option:selected').data().isManual ?
                    publicScope.$portOverride.val() :
                        String(privateScope.$port.val());
                
                if (selected_port === 'DFU') {
                    GUI.log(i18n.getMessage('dfu_connect_message'));
                }
                else if (selected_port != '0') {
                    if (!clicks) {
                        console.log('Connecting to: ' + selected_port);
                        GUI.connecting_to = selected_port;

                        // lock port select & baud while we are connecting / connected
                        $('#port, #baud, #delay').prop('disabled', true);
                        $('div.connect_controls a.connect_state').text(i18n.getMessage('connecting'));

                        if (selected_port == 'tcp' || selected_port == 'udp') {
                            CONFIGURATOR.connection.connect(publicScope.$portOverride.val(), {}, privateScope.onOpen);
                        } else if (selected_port == 'sitl') {
                            CONFIGURATOR.connection.connect("127.0.0.1:5760", {}, privateScope.onOpen);
                        } else if (selected_port == 'sitl-demo') {
                            if (SITLProcess.isRunning) {
                                SITLProcess.stop();
                            }
                            SITLProcess.start("demo.bin"), 1000;                        
                            this.isDemoRunning = true;

                            // Wait 1 sec until SITL is ready
                            setTimeout(() => {
                                CONFIGURATOR.connection.connect("127.0.0.1:5760", {}, privateScope.onOpen);
                            }, 1000);
                        } else {
                            CONFIGURATOR.connection.connect(selected_port, {bitrate: selected_baud}, privateScope.onOpen);
                        }
                    } else {
                        if (this.isDemoRunning) {
                            SITLProcess.stop();
                            this.isDemoRunning = false;
                        }
                        
                        var wasConnected = CONFIGURATOR.connectionValid;

                        timeout.killAll();
                        interval.killAll(['global_data_refresh', 'msp-load-update']);

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
                            mspQueue.flush();
                            mspQueue.freeHardLock();
                            mspQueue.freeSoftLock();
                            mspDeduplicationQueue.flush();

                            CONFIGURATOR.connection.disconnect(privateScope.onClosed);
                            MSP.disconnect_cleanup();

                            // Reset various UI elements
                            $('span.i2c-error').text(0);
                            $('span.cycle-time').text(0);
                            $('span.cpu-load').text('');

                            // unlock port select & baud
                            privateScope.$port.prop('disabled', false);
                            privateScope.$baud.prop('disabled', false);

                            // reset connect / disconnect button
                            $('div.connect_controls a.connect').removeClass('active');
                            $('div.connect_controls a.connect_state').text(i18n.getMessage('connect'));

                            // reset active sensor indicators
                            privateScope.sensor_status(0);

                            if (wasConnected) {
                                // detach listeners and remove element data
                                $('#content').empty();
                            }

                            $('#tabs .tab_landing a').trigger( "click" );
                        }
                    }

                    $(this).data("clicks", !clicks);
                }
            }
        });

        PortHandler.initialize();
    }

    privateScope.onValidFirmware = function ()
    {
    MSP.send_message(MSPCodes.MSP_BUILD_INFO, false, false, function () {

        GUI.log(i18n.getMessage('buildInfoReceived', [FC.CONFIG.buildInfo]));

        MSP.send_message(MSPCodes.MSP_BOARD_INFO, false, false, function () {

            GUI.log(i18n.getMessage('boardInfoReceived', [FC.CONFIG.boardIdentifier, FC.CONFIG.boardVersion]));

            MSP.send_message(MSPCodes.MSP_UID, false, false, function () {

                GUI.log(i18n.getMessage('uniqueDeviceIdReceived', [FC.CONFIG.uid[0].toString(16) + FC.CONFIG.uid[1].toString(16) + FC.CONFIG.uid[2].toString(16)]));

                // continue as usually
                CONFIGURATOR.connectionValid = true;
                GUI.allowedTabs = GUI.defaultAllowedTabsWhenConnected.slice();
                privateScope.onConnect();

                defaultsDialog.init();

                $('#tabs ul.mode-connected .tab_setup a').trigger( "click" );

                GUI.updateEzTuneTabVisibility(true);
                update.firmwareVersion();
            });
        });
    });
}

    privateScope.onInvalidFirmwareVariant = function ()
    {
        GUI.log(i18n.getMessage('firmwareVariantNotSupported'));
        CONFIGURATOR.connectionValid = true; // making it possible to open the CLI tab
        GUI.allowedTabs = ['cli'];
        privateScope.onConnect();
        $('#tabs .tab_cli a').trigger( "click" );
    }

    privateScope.onInvalidFirmwareVersion = function ()
    {
        GUI.log(i18n.getMessage('firmwareVersionNotSupported', [CONFIGURATOR.minfirmwareVersionAccepted, CONFIGURATOR.maxFirmwareVersionAccepted]));
        CONFIGURATOR.connectionValid = true; // making it possible to open the CLI tab
        GUI.allowedTabs = ['cli'];
        privateScope.onConnect();
        $('#tabs .tab_cli a').trigger( "click" );
    }

    privateScope.onBleNotSupported = function () {
        GUI.log(i18n.getMessage('connectionBleNotSupported'));
        CONFIGURATOR.connection.abort();
    }


    privateScope.onOpen = function (openInfo) {

        if (FC.restartRequired) {
            GUI_control.prototype.log("<span style='color: red; font-weight: bolder'><strong>" + i18n.getMessage("illegalStateRestartRequired") + "</strong></span>");
            $('div.connect_controls a').trigger( "click" ); // disconnect
            return;
        }

        if (openInfo) {
            // update connected_to
            GUI.connected_to = GUI.connecting_to;

            // reset connecting_to
            GUI.connecting_to = false;

            GUI.log(i18n.getMessage('serialPortOpened', [openInfo.connectionId]));

            // save selected port if the port differs
            var last_used_port = store.get('last_used_port', false);
            if (last_used_port) {
                if (last_used_port != GUI.connected_to) {
                    // last used port doesn't match the one found in local db, we will store the new one
                    store.set('last_used_port', GUI.connected_to);
                }
            } else {
                // variable isn't stored yet, saving
                store.set('last_used_port', GUI.connected_to);
            }
        

            store.set('last_used_bps', CONFIGURATOR.connection.bitrate);
            store.set('wireless_mode_enabled', $('#wireless-mode').is(":checked"));

            CONFIGURATOR.connection.addOnReceiveListener(publicScope.read_serial);
            CONFIGURATOR.connection.addOnReceiveListener(ltmDecoder.read);

            // disconnect after 10 seconds with error if we don't get IDENT data
            timeout.add('connecting', function () {

                //As we add LTM listener, we need to invalidate connection only when both protocols are not listening!
                if (!CONFIGURATOR.connectionValid && !ltmDecoder.isReceiving()) {
                    GUI.log(i18n.getMessage('noConfigurationReceived'));

                        mspQueue.flush();
                        mspQueue.freeHardLock();
                        mspQueue.freeSoftLock();
                        mspDeduplicationQueue.flush();
                        CONFIGURATOR.connection.emptyOutputBuffer();

                    $('div.connect_controls a').click(); // disconnect
                }
            }, 10000);

            //Add a timer that every 1s will check if LTM stream is receiving data and display alert if so
            interval.add('ltm-connection-check', function () {
                if (ltmDecoder.isReceiving()) {
                    groundstation.activate($('#main-wrapper'));
                }
            }, 1000);

            FC.resetState();

            // request configuration data. Start with MSPv1 and
            // upgrade to MSPv2 if possible.
            MSP.protocolVersion = MSP.constants.PROTOCOL_V2;
            MSP.send_message(MSPCodes.MSP_API_VERSION, false, false, function () {
                
                if (FC.CONFIG.apiVersion === "0.0.0") {
                    GUI_control.prototype.log("<span style='color: red; font-weight: bolder'><strong>" + i18n.getMessage("illegalStateRestartRequired") + "</strong></span>");
                    FC.restartRequired = true;
                    return;
                }

                GUI.log(i18n.getMessage('apiVersionReceived', [FC.CONFIG.apiVersion]));

                MSP.send_message(MSPCodes.MSP_FC_VARIANT, false, false, function () {
                    if (FC.CONFIG.flightControllerIdentifier == 'INAV') {
                        MSP.send_message(MSPCodes.MSP_FC_VERSION, false, false, function () {

                            GUI.log(i18n.getMessage('fcInfoReceived', [FC.CONFIG.flightControllerIdentifier, FC.CONFIG.flightControllerVersion]));
                            if (semver.gte(FC.CONFIG.flightControllerVersion, CONFIGURATOR.minfirmwareVersionAccepted) && semver.lt(FC.CONFIG.flightControllerVersion, CONFIGURATOR.maxFirmwareVersionAccepted)) {
                                if (CONFIGURATOR.connection.type == ConnectionType.BLE && semver.lt(FC.CONFIG.flightControllerVersion, "5.0.0")) {  
                                    privateScope.onBleNotSupported();
                                } else {
                                    mspHelper.getCraftName(function(name) {
                                        if (name) {
                                            FC.CONFIG.name = name;
                                        }
                                        privateScope.onValidFirmware();  
                                    });
                                }
                            } else  {
                                privateScope.onInvalidFirmwareVersion();
                            }
                        });
                    } else {
                        privateScope.onInvalidFirmwareVariant();
                    }
                });
            });
        } else {
            console.log('Failed to open serial port');
            GUI.log(i18n.getMessage('serialPortOpenFail'));

            var $connectButton = $('#connectbutton');

            $connectButton.find('.connect_state').text(i18n.getMessage('connect'));
            $connectButton.find('.connect').removeClass('active');

            // unlock port select & baud
            $('#port, #baud, #delay').prop('disabled', false);

            // reset data
            $connectButton.find('.connect').data("clicks", false);
        }
    }

    privateScope.onConnect = function () {
        timeout.remove('connecting'); // kill connecting timer
        $('#connectbutton a.connect_state').text(i18n.getMessage('disconnect')).addClass('active');
        $('#connectbutton a.connect').addClass('active');
        $('.mode-disconnected').hide();
        $('.mode-connected').show();

        
        MSP.send_message(MSPCodes.MSP_BOXIDS, false, false, function () {
            FC.generateAuxConfig();
        });

        MSP.send_message(MSPCodes.MSP_DATAFLASH_SUMMARY, false, false, function () {
            $('#sensor-status').show();
            $('#portsinput').hide();
            $('#dataflash_wrapper_global').show();
            $('#profiles_wrapper_global').show();

            /*
            * Init PIDs bank with a length that depends on the version
            */
            let pidCount = 11;

            for (let i = 0; i < pidCount; i++) {
                FC.PIDs.push(new Array(4));
            }

            interval.add('msp-load-update', function () {
                $('#msp-version').text("MSP version: " + MSP.protocolVersion.toFixed(0));
                $('#msp-load').text("MSP load: " + mspQueue.getLoad().toFixed(1));
                $('#msp-roundtrip').text("MSP round trip: " + mspQueue.getRoundtrip().toFixed(0));
                $('#hardware-roundtrip').text("HW round trip: " + mspQueue.getHardwareRoundtrip().toFixed(0));
            }, 100);

            interval.add('global_data_refresh', periodicStatusUpdater.run, periodicStatusUpdater.getUpdateInterval(CONFIGURATOR.connection.bitrate), false);
        });
    }

    privateScope.onClosed = function (result) {
        if (result) { // All went as expected
            GUI.log(i18n.getMessage('serialPortClosedOk'));
        } else { // Something went wrong
            GUI.log(i18n.getMessage('serialPortClosedFail'));
        }

        $('.mode-connected').hide();
        $('.mode-disconnected').show();

        $('#sensor-status').hide();
        $('#portsinput').show();
        $('#dataflash_wrapper_global').hide();
        $('#profiles_wrapper_global').hide();
        $('#quad-status_wrapper').hide();

        //updateFirmwareVersion();
    }

    publicScope.read_serial = function (info) {
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
    privateScope.sensor_status_ex = function (hw_status)
    {
        var statusHash = privateScope.sensor_status_hash(hw_status);

        if (privateScope.sensor_status_ex.previousHash == statusHash) {
            return;
        }

        privateScope.sensor_status_ex.previousHash = statusHash;

        privateScope.sensor_status_update_icon('.gyro',      '.gyroicon',        hw_status.gyroHwStatus);
        privateScope.sensor_status_update_icon('.accel',     '.accicon',         hw_status.accHwStatus);
        privateScope.sensor_status_update_icon('.mag',       '.magicon',         hw_status.magHwStatus);
        privateScope.sensor_status_update_icon('.baro',      '.baroicon',        hw_status.baroHwStatus);
        privateScope.sensor_status_update_icon('.gps',       '.gpsicon',         hw_status.gpsHwStatus);
        privateScope.sensor_status_update_icon('.sonar',     '.sonaricon',       hw_status.rangeHwStatus);
        privateScope.sensor_status_update_icon('.airspeed',  '.airspeedicon',    hw_status.speedHwStatus);
        privateScope.sensor_status_update_icon('.opflow',    '.opflowicon',      hw_status.flowHwStatus);
    }

    privateScope.sensor_status_update_icon = function (sensId, sensIconId, status)
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

    privateScope.sensor_status_hash = function (hw_status)
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
    privateScope.sensor_status = function (sensors_detected) {

        if (typeof SENSOR_STATUS === 'undefined') {
            return;
        }

        SENSOR_STATUS.isHardwareHealthy = 1;
        SENSOR_STATUS.gyroHwStatus      = publicScope.have_sensor(sensors_detected, 'gyro') ? 1 : 0;
        SENSOR_STATUS.accHwStatus       = publicScope.have_sensor(sensors_detected, 'acc') ? 1 : 0;
        SENSOR_STATUS.magHwStatus       = publicScope.have_sensor(sensors_detected, 'mag') ? 1 : 0;
        SENSOR_STATUS.baroHwStatus      = publicScope.have_sensor(sensors_detected, 'baro') ? 1 : 0;
        SENSOR_STATUS.gpsHwStatus       = publicScope.have_sensor(sensors_detected, 'gps') ? 1 : 0;
        SENSOR_STATUS.rangeHwStatus     = publicScope.have_sensor(sensors_detected, 'sonar') ? 1 : 0;
        SENSOR_STATUS.speedHwStatus     = publicScope.have_sensor(sensors_detected, 'airspeed') ? 1 : 0;
        SENSOR_STATUS.flowHwStatus      = publicScope.have_sensor(sensors_detected, 'opflow') ? 1 : 0;
        privateScope.sensor_status_ex(SENSOR_STATUS);
    }

    publicScope.have_sensor = function (sensors_detected, sensor_code) {
        switch(sensor_code) {
            case 'acc':
            case 'gyro':
                return BitHelper.bit_check(sensors_detected, 0);
            case 'baro':
                return BitHelper.bit_check(sensors_detected, 1);
            case 'mag':
                return BitHelper.bit_check(sensors_detected, 2);
            case 'gps':
                return BitHelper.bit_check(sensors_detected, 3);
            case 'sonar':
                return BitHelper.bit_check(sensors_detected, 4);
            case 'opflow':
                return BitHelper.bit_check(sensors_detected, 5);
            case 'airspeed':
                return BitHelper.bit_check(sensors_detected, 6);
        }
        return false;
    }


    return publicScope;

})();

module.exports = SerialBackend;
