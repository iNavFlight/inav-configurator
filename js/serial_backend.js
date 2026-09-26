'use strict';

import semver from 'semver';

import GUI from './gui';
import MSP from './msp';
import FC from './fc';
import MSPCodes from './msp/MSPCodes';
import mspHelper from './msp/MSPHelper';
import { ConnectionType, Connection } from './connection/connection';
import connectionFactory from './connection/connectionFactory';
import CONFIGURATOR from './data_storage';
import  { PortHandler } from './port_handler';
import { requestDfuPermission } from './web/dfu';
import ConnectionWebSerial from './connection/connectionWebSerial';
import i18n from './../js/localization';
import interval from './intervals';
import periodicStatusUpdater from './periodicStatusUpdater';
import mspQueue from './serial_queue';
import timeout from './timeouts';
import defaultsDialog from './defaults_dialog';
import { SITLProcess } from './sitl';
import update from './globalUpdates';
import BitHelper from './bitHelper';
import jBox from 'jbox';
import groundstation from './groundstation';
import ltmDecoder from './ltmDecoder';
import createLtmProtocolGate from './ltmProtocolGate';
import mspDeduplicationQueue from './msp/mspDeduplicationQueue';
import store from './store';
import cliTab from '../tabs/cli';
import javascriptProgrammingTab from '../tabs/javascript_programming';
import { MavlinkLink } from './mavlink/mavlinkLink';
import { concatFrames } from './mavlink/mavlinkProtocol';
import { MavlinkTelemetryFeed, isTelemetryFeedEnabled, mspCodeOfFrame } from './mavlink/mavlinkTelemetryFeed';
import { TunnelRebootMonitor } from './mavlink/tunnelRebootMonitor';

// Probe attempts on top of the first one: a weak radio link may lose the first request.
const MAVLINK_TUNNEL_PROBE_RETRIES = 2;
const MAVLINK_GCS_HEARTBEAT_INTERVAL_MS = 1000;
const CONNECTING_TIMEOUT_MS = 10000;
// A port serving MSP and MAVLink answers the raw probe within this window; plain MSP wins there.
const RAW_MSP_PRIORITY_WINDOW_MS = 500;

var SerialBackend = (function () {

    var publicScope = {},
        privateScope = {};

    privateScope.isDemoRunning = false;

    privateScope.isWirelessMode = false;

    privateScope.reopenTab = null;

    privateScope.mavlinkLink = new MavlinkLink({
        onHeartbeat: frame => privateScope.onMavlinkHeartbeat(frame),
        onTunnelChunk: bytes => privateScope.onTunnelChunk(bytes),
        onMessage: frame => privateScope.onMavlinkMessage(frame),
        onReassemblyTimeout: () => MSP.resetDecoder(),
    });
    privateScope.telemetryFeed = null;

    privateScope.rebootMonitor = new TunnelRebootMonitor({
        sendProbe: done => MSP.sendLinkProbe(MSPCodes.MSP_API_VERSION, response => done(response !== false), 0),
        resendReboot: () => MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false),
        readUptime: done => MSP.sendLinkProbe(MSPCodes.MSP2_INAV_MISC2, response => done(response ? FC.MISC2.onTime : null), 1),
        onStart: () => privateScope.onTunnelRebootStart(),
        onBack: () => privateScope.onTunnelRebootBack(),
        onNotRebooted: () => privateScope.onTunnelRebootNotRebooted(),
        onGone: () => privateScope.onTunnelRebootGone(),
        log: (key, args) => GUI.log(i18n.getMessage(key, args)),
    });
    privateScope.tunnelRebootModal = null;
    // handleReconnect() may name the tab to reopen before or after the reboot request is sent.
    privateScope.tunnelRebootTabChosen = false;

    // Latched per connection; tunnel decisions never read the DOM.
    privateScope.newMavlinkSession = function () {
        return { tunnel: false, v1HeartbeatSeen: false, pendingHeartbeat: null, rawProbeSentAt: Date.now(), foreignSystems: new Set() };
    };
    privateScope.mavlinkSession = privateScope.newMavlinkSession();
    privateScope.gcsHeartbeatTimer = null;

    privateScope.ltmProtocolGate = createLtmProtocolGate({
        ltmDecoder,
        wasMspReceiving: function () {
            return MSP.wasEverReceiving();
        },
        activateGroundstation: function () {
            groundstation.activate($('#main-wrapper'));
        }
    });

    /*
     * Handle "Wireless" mode with strict queueing of messages
     */
    publicScope.init = function() {

        privateScope.$port = $('#port'),
        privateScope.$baud = $('#baud'),
        publicScope.$portOverride = $('#port-override'),
        mspHelper.setSensorStatusEx(privateScope.sensor_status_ex);
        mspHelper.onWriteLostRecovery = privateScope.onWriteLost;

        $('#wireless-mode').on('change', function () {
            var $this = $(this);

            if ($this.is(':checked')) {
                mspQueue.setLockMethod('hard');
            } else {
                mspQueue.setLockMethod('soft');
            }
        });

        GUI.handleReconnect = function (reopenLastTab = true) {

            privateScope.chooseReopenTab(reopenLastTab);

            // The tunnel survives the reboot: the reboot monitor reconnects without closing the port.
            if (CONFIGURATOR.mavlinkTunnelActive) {
                privateScope.tunnelRebootTabChosen = true;
                return;
            }

            let modal = privateScope.openRebootModal();

            /*
            Disconnect
            */
            setTimeout(function () {
                privateScope.reConnect();
            }, 100);

            /*
            Connect again
            */
            setTimeout(function start_connection() {
                modal.close();
                privateScope.reConnect();
            }, 5000);
        };

        privateScope.chooseReopenTab = function (reopenLastTab) {
            if (typeof reopenLastTab === 'boolean') {
                const $anchor = $('#tabs > ul li.active a');
                privateScope.reopenTab = reopenLastTab && $anchor.length ? $anchor : null;
            } else {
                privateScope.reopenTab = privateScope.tabAnchorOf(reopenLastTab);
            }
        };

        // Callers may pass an <a> or an <li>; normalize to the <a> element
        privateScope.tabAnchorOf = function (tab) {
            if (!tab) {
                return null;
            }
            const $el = $(tab);
            const anchor = $el.is('a') ? $el : $('a', $el);
            return anchor.length ? anchor : null;
        };

        privateScope.openRebootModal = function () {
            return new jBox('Modal', {
                width: 400,
                height: 120,
                animation: false,
                closeOnClick: false,
                closeOnEsc: false,
                content: '<div id="modal-reconnect"><div data-i18n="deviceRebooting">Device - <span style="color: red">Rebooting</span></div></div>'
            }).open();
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
            } else if (selected_port.data().isSitl && globalThis.__INAV_BROWSER_BUILD__) {
                // Browser build talks to WASM SITL in-process via ccall, not TCP.
                type = ConnectionType.serialEXT;
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
            var selected_port = privateScope.$port.find('option:selected');
            if (selected_port.data().isDfuPermission) {
                requestDfuPermission().then(() => PortHandler.check_usb_devices());
            }
            if (privateScope.$port.val() === ConnectionWebSerial.CHOOSE_PORT_ID) {
                // Deferred one tick so the select's own native dropdown has
                // fully closed before requestPort() tries to open a new native
                // popup - opening it synchronously here can be silently
                // dropped by the OS while the previous popup is still
                // tearing down. User activation survives this; its window is
                // several seconds, not one task.
                setTimeout(() => {
                    privateScope.reopenTab = null;
                    privateScope.reConnect();
                }, 0);
            }
            GUI.updateManualPortVisibility();
        });

    $('div.connect_controls a.connect').on('click', () => {
        privateScope.reopenTab = null;
        privateScope.reConnect()
    });

    privateScope.reConnect = function() {
        if (groundstation.isActivated()) {
            groundstation.deactivate();
        }

        if (GUI.connect_lock != true) { // GUI control overrides the user control

                // Use the real connection state, not a toggle flag that competing
                // async aborts could desync.
                const isIdle = (GUI.connected_to === false) && (GUI.connecting_to === false);
                var selected_baud = parseInt(privateScope.$baud.val());
                var selected_port = privateScope.$port.find('option:selected').data().isManual ?
                    publicScope.$portOverride.val() :
                        String(privateScope.$port.val());

                if (selected_port === 'DFU') {
                    GUI.log(i18n.getMessage('dfu_connect_message'));
                }
                else if (selected_port != '0') {
                    if (isIdle) {
                        console.log('Connecting to: ' + selected_port);
                        GUI.connecting_to = selected_port;

                        // Clear leftover MSP state so a fast reconnect isn't
                        // blocked by a previous session's retrying requests.
                        mspQueue.flush();
                        mspQueue.freeHardLock();
                        mspQueue.freeSoftLock();
                        mspDeduplicationQueue.flush();
                        MSP.disconnect_cleanup();
                        privateScope.ltmProtocolGate.reset();

                        // lock port select & baud while we are connecting / connected
                        $('#port, #baud, #delay').prop('disabled', true);
                        $('div.connect_controls a.connect_state').text(i18n.getMessage('connecting'));

                        if (selected_port == 'tcp' || selected_port == 'udp') {
                            CONFIGURATOR.connection.connect(publicScope.$portOverride.val(), {}, privateScope.onOpen);
                        } else if (selected_port == 'sitl' && globalThis.__INAV_BROWSER_BUILD__) {
                            // WASM SITL must already be running (started from the SITL
                            // tab); connectionExt reports a clean failure via onOpen
                            // if it isn't, same as a native SITL not listening on TCP.
                            CONFIGURATOR.connection.connect(0, {}, privateScope.onOpen);
                        } else if (selected_port == 'sitl') {
                            CONFIGURATOR.connection.connect("127.0.0.1:5760", {}, privateScope.onOpen);
                        } else if (selected_port == 'sitl-demo') {
                            SITLProcess.stop();
                            SITLProcess.start("demo.bin");
                            this.isDemoRunning = true;

                            // Wait 1 sec until SITL is ready
                            setTimeout(() => {
                                CONFIGURATOR.connection.connect("127.0.0.1:5760", {}, privateScope.onOpen);
                            }, 1000);
                        } else {
                            CONFIGURATOR.connection.connect(selected_port, {bitrate: selected_baud}, privateScope.onOpen);
                        }
                    } else {
                        // Check for unsaved changes in JavaScript Programming tab. A dead session (FC gone after a
                        // tunnel reboot) cannot save anyway; the landing-tab switch still asks before discarding.
                        if (GUI.active_tab === javascriptProgrammingTab &&
                            javascriptProgrammingTab.isDirty && CONFIGURATOR.connectionValid) {
                            console.log('[Disconnect] Checking for unsaved changes in JavaScript Programming tab');
                            const confirmMsg = i18n.getMessage('unsavedChanges') ||
                                'You have unsaved changes. Leave anyway?';

                            if (!confirm(confirmMsg)) {
                                console.log('[Disconnect] User cancelled disconnect due to unsaved changes');
                                return; // Cancel disconnect
                            }
                            console.log('[Disconnect] User confirmed, proceeding with disconnect');
                            // Clear isDirty flag so tab switch during disconnect doesn't show warning again
                            javascriptProgrammingTab.isDirty = false;
                        }

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
                            GUI.connecting_to = false;
                            GUI.allowedTabs = GUI.defaultAllowedTabsWhenDisconnected.slice();

                            /*
                            * Flush
                            */
                            mspQueue.flush();
                            mspQueue.freeHardLock();
                            mspQueue.freeSoftLock();
                            mspDeduplicationQueue.flush();

                            const connection = CONFIGURATOR.connection;
                            // The port closes once the FC got its stream defaults back (bounded, see RESTORE_DEADLINE_MS).
                            privateScope.stopTelemetryFeed(true, () => connection.disconnect(privateScope.onClosed));
                            MSP.disconnect_cleanup();
                            privateScope.ltmProtocolGate.reset();
                            privateScope.endMavlinkSession();

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
                }
            }
        }

        PortHandler.initialize();
    }

    privateScope.onValidFirmware = function ()
    {
    MSP.send_message(MSPCodes.MSP_BUILD_INFO, false, false, function (response) {
        if (privateScope.isTunnelReplyLost(response, MSPCodes.MSP_BUILD_INFO)) {
            return;
        }

        GUI.log(i18n.getMessage('buildInfoReceived', [FC.CONFIG.buildInfo]));

        MSP.send_message(MSPCodes.MSP_BOARD_INFO, false, false, function (response) {
            if (privateScope.isTunnelReplyLost(response, MSPCodes.MSP_BOARD_INFO)) {
                return;
            }

            GUI.log(i18n.getMessage('boardInfoReceived', [FC.CONFIG.boardIdentifier, FC.CONFIG.boardVersion]));

            MSP.send_message(MSPCodes.MSP_UID, false, false, function (response) {
                if (privateScope.isTunnelReplyLost(response, MSPCodes.MSP_UID)) {
                    return;
                }

                GUI.log(i18n.getMessage('uniqueDeviceIdReceived', [FC.CONFIG.uid[0].toString(16) + FC.CONFIG.uid[1].toString(16) + FC.CONFIG.uid[2].toString(16)]));

                // continue as usually
                CONFIGURATOR.connectionValid = true;
                GUI.allowedTabs = privateScope.connectedTabs();
                privateScope.showLinkType(CONFIGURATOR.mavlinkTunnelActive);
                privateScope.startTelemetryFeed();
                privateScope.onConnect();

                defaultsDialog.init().then( () => {

                    privateScope.reopenLastTab();

                    update.firmwareVersion();
                });
            });
        });
    });
}

    privateScope.onInvalidFirmwareVariant = function ()
    {
        GUI.log(i18n.getMessage('firmwareVariantNotSupported'));
        if (CONFIGURATOR.mavlinkTunnelActive) {
            privateScope.refuseCliOverTunnel();
            return;
        }
        CONFIGURATOR.connectionValid = true; // making it possible to open the CLI tab
        GUI.allowedTabs = ['cli'];
        privateScope.onConnect();
        $('#tabs .tab_cli a').trigger( "click" );
    }

    privateScope.onInvalidFirmwareVersion = function ()
    {
        GUI.log(i18n.getMessage('firmwareVersionNotSupported', [CONFIGURATOR.minfirmwareVersionAccepted, CONFIGURATOR.maxFirmwareVersionAccepted]));
        if (CONFIGURATOR.mavlinkTunnelActive) {
            privateScope.refuseCliOverTunnel();
            return;
        }
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
            GUI.log("<span style='color: red; font-weight: bolder'><strong>" + i18n.getMessage("illegalStateRestartRequired") + "</strong></span>");
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

            // Reset state BEFORE adding receive listeners to ensure any
            // garbage bytes or boot messages don't corrupt the MSP decoder
            FC.resetState();
            MSP.disconnect_cleanup();
            privateScope.ltmProtocolGate.reset();
            privateScope.endMavlinkSession();

            CONFIGURATOR.connection.addOnReceiveListener(publicScope.read_serial);
            CONFIGURATOR.connection.addOnReceiveListener(publicScope.read_ltm);
            // Passive detection: an FC on a MAVLink-only port answers with heartbeats, not MSP.
            CONFIGURATOR.connection.addOnReceiveListener(privateScope.read_mavlink);

            privateScope.armConnectingTimeout();

            // LTM is only a fallback for an LTM-only connection. Once MSP has
            // been validated, its payloads (including raw dataflash blocks)
            // must never be interpreted as LTM telemetry.
            interval.add('ltm-connection-check', function () {
                privateScope.ltmProtocolGate.activateGroundstationIfLtmOnly();
            }, 1000);

            // request configuration data. Start with MSPv1 and
            // upgrade to MSPv2 if possible.
            MSP.protocolVersion = MSP.constants.PROTOCOL_V2;
            privateScope.mavlinkSession.rawProbeSentAt = Date.now();
            MSP.send_message(MSPCodes.MSP_API_VERSION, false, false, privateScope.onApiVersion);
        } else {
            console.log('Failed to open serial port');
            GUI.log(i18n.getMessage('serialPortOpenFail'));

            // Clear connecting state so the button reflects "disconnected".
            GUI.connecting_to = false;
            GUI.connected_to = false;

            var $connectButton = $('#connectbutton');

            $connectButton.find('.connect_state').text(i18n.getMessage('connect'));
            $connectButton.find('.connect').removeClass('active');

            // unlock port select & baud
            $('#port, #baud, #delay').prop('disabled', false);
        }
    }

    privateScope.onApiVersion = function (response) {
        if (response === false && CONFIGURATOR.mavlinkTunnelActive) {
            GUI.log(i18n.getMessage('mavlinkTunnelNoReply'));
            privateScope.abortConnecting();
            return;
        }

        if (FC.CONFIG.apiVersion === "0.0.0") {
            GUI.log("<span style='color: red; font-weight: bolder'><strong>" + i18n.getMessage("illegalStateRestartRequired") + "</strong></span>");
            FC.restartRequired = true;
            return;
        }

        GUI.log(i18n.getMessage('apiVersionReceived', [FC.CONFIG.apiVersion]));

        MSP.send_message(MSPCodes.MSP_FC_VARIANT, false, false, privateScope.onFcVariant);
    };

    privateScope.onFcVariant = function (response) {
        if (privateScope.isTunnelReplyLost(response, MSPCodes.MSP_FC_VARIANT)) {
            return;
        }
        if (FC.CONFIG.flightControllerIdentifier == 'INAV') {
            MSP.send_message(MSPCodes.MSP_FC_VERSION, false, false, privateScope.onFcVersion);
        } else {
            privateScope.onInvalidFirmwareVariant();
        }
    };

    privateScope.onFcVersion = function (response) {
        if (privateScope.isTunnelReplyLost(response, MSPCodes.MSP_FC_VERSION)) {
            return;
        }
        const version = FC.CONFIG.flightControllerVersion;
        GUI.log(i18n.getMessage('fcInfoReceived', [FC.CONFIG.flightControllerIdentifier, version]));
        if (!privateScope.isAcceptedFirmwareVersion(version)) {
            privateScope.onInvalidFirmwareVersion();
        } else if (CONFIGURATOR.connection.type == ConnectionType.BLE && semver.lt(version, "5.0.0")) {
            privateScope.onBleNotSupported();
        } else {
            mspHelper.getCraftName(privateScope.onCraftName);
        }
    };

    // semver throws on the empty string a lost or garbled FC_VERSION leaves behind.
    privateScope.isAcceptedFirmwareVersion = function (version) {
        return Boolean(semver.valid(version)) &&
            semver.gte(version, CONFIGURATOR.minfirmwareVersionAccepted) &&
            semver.lt(version, CONFIGURATOR.maxFirmwareVersionAccepted);
    };

    privateScope.onCraftName = function (name) {
        if (privateScope.isTunnelReplyLost(name === null ? false : name, MSPCodes.MSP_NAME)) {
            return;
        }
        if (name) {
            FC.CONFIG.name = name;
        }
        privateScope.onValidFirmware();
    };

    // disconnect after 10 seconds with error if we don't get IDENT data
    privateScope.armConnectingTimeout = function () {
        timeout.remove('connecting');
        timeout.add('connecting', function () {

            //As we add LTM listener, we need to invalidate connection only when both protocols are not listening!
            if (!CONFIGURATOR.connectionValid && !ltmDecoder.isReceiving()) {
                const reason = privateScope.mavlinkSession.v1HeartbeatSeen ? 'mavlinkTunnelV1Only' : 'noConfigurationReceived';
                GUI.log(i18n.getMessage(reason));
                privateScope.abortConnecting();
            }
        }, CONNECTING_TIMEOUT_MS);
    };

    privateScope.abortConnecting = function () {
        mspQueue.flush();
        mspQueue.freeHardLock();
        mspQueue.freeSoftLock();
        mspDeduplicationQueue.flush();
        CONFIGURATOR.connection.emptyOutputBuffer();

        $('div.connect_controls a').click(); // disconnect
    };

    privateScope.connectedTabs = function () {
        const tabs = GUI.defaultAllowedTabsWhenConnected.slice();
        if (!CONFIGURATOR.mavlinkTunnelActive) {
            return tabs;
        }
        return tabs.filter(tab => !GUI.tabsUnavailableOverMavlinkTunnel.includes(tab));
    };

    // The queue ends a lost tunnel request with onFinish(false); the handshake must not go on with stale FC state.
    privateScope.isTunnelReplyLost = function (response, code) {
        if (response !== false || !CONFIGURATOR.mavlinkTunnelActive) {
            return false;
        }
        GUI.log(i18n.getMessage('mavlinkTunnelLostReply', [MSP.getCodeName(code)]));
        privateScope.abortConnecting();
        return true;
    };

    privateScope.refuseCliOverTunnel = function () {
        GUI.log(i18n.getMessage('mavlinkTunnelNoCli'));
        privateScope.abortConnecting();
    };

    privateScope.read_mavlink = function (info) {
        if (!privateScope.mavlinkSession.tunnel && MSP.wasEverReceiving()) {
            // Plain MSP answered first; interleaved MAVLink bytes stay ignored as before.
            CONFIGURATOR.connection.removeOnReceiveCallback(privateScope.read_mavlink);
            return;
        }
        privateScope.mavlinkLink.ingest(info.data);
    };

    privateScope.onMavlinkHeartbeat = function (frame) {
        const session = privateScope.mavlinkSession;
        if (session.tunnel) {
            const target = privateScope.mavlinkLink.getTarget();
            if (frame.sysid !== target.sysid && !session.foreignSystems.has(frame.sysid)) {
                session.foreignSystems.add(frame.sysid);
                console.log('MAVLink tunnel: ignoring heartbeat from system ' + frame.sysid);
            }
            return;
        }
        if (frame.version === 1) {
            session.v1HeartbeatSeen = true;
            return;
        }
        if (session.pendingHeartbeat) {
            return;
        }

        session.pendingHeartbeat = { sysid: frame.sysid, compid: frame.compid };
        const remaining = session.rawProbeSentAt + RAW_MSP_PRIORITY_WINDOW_MS - Date.now();
        timeout.add('mavlink-tunnel-switch', privateScope.onRawMspWindowEnd, Math.max(0, remaining));
    };

    privateScope.onRawMspWindowEnd = function () {
        const session = privateScope.mavlinkSession;
        const heartbeat = session.pendingHeartbeat;
        if (!heartbeat || session.tunnel || GUI.connected_to === false) {
            return;
        }
        if (MSP.wasEverReceiving()) {
            GUI.log(i18n.getMessage('mavlinkTunnelSkippedPlainMsp', [heartbeat.sysid]));
            CONFIGURATOR.connection.removeOnReceiveCallback(privateScope.read_mavlink);
            return;
        }
        privateScope.startTunnelSession(heartbeat.sysid, heartbeat.compid);
    };

    privateScope.startTunnelSession = function (sysid, compid) {
        const link = privateScope.mavlinkLink;
        privateScope.mavlinkSession.tunnel = true;
        CONFIGURATOR.mavlinkTunnelActive = true;
        link.lockTarget(sysid, compid);
        GUI.log(i18n.getMessage('mavlinkTunnelDetected', [sysid]));

        CONFIGURATOR.connection.removeOnReceiveCallback(publicScope.read_serial);
        CONFIGURATOR.connection.removeOnReceiveCallback(publicScope.read_ltm);

        // The raw MSP_API_VERSION still pending would otherwise be answered by the tunnel probe.
        privateScope.resetTunnelQueue();
        mspQueue.setTransportTransform(
            body => privateScope.wrapForTunnel(body),
            () => link.resetReassembly()
        );
        MSP.rebootTracker = privateScope.rebootMonitor;
        privateScope.tunnelRebootTabChosen = false;
        // Own timer: tab switches kill every named interval outside their keep-lists.
        privateScope.sendGcsHeartbeat();
        privateScope.gcsHeartbeatTimer = setInterval(privateScope.sendGcsHeartbeat, MAVLINK_GCS_HEARTBEAT_INTERVAL_MS);
        privateScope.sendTunnelHandshake();
    };

    privateScope.resetTunnelQueue = function () {
        mspQueue.flush();
        mspDeduplicationQueue.flush();
        MSP.callbacks_cleanup();
        MSP.resetDecoder();
        mspQueue.freeHardLock();
        mspQueue.freeSoftLock();
        mspQueue.setTunnelMode(true);
    };

    privateScope.sendTunnelHandshake = function () {
        privateScope.armConnectingTimeout();
        MSP.protocolVersion = MSP.constants.PROTOCOL_V2;
        MSP.sendWithTunnelRetries(MSPCodes.MSP_API_VERSION, false, privateScope.onApiVersion, MAVLINK_TUNNEL_PROBE_RETRIES);
    };

    // The port stays open over the reboot: stop polling and the telemetry feed, keep the MAVLink session.
    privateScope.onTunnelRebootStart = function () {
        if (!privateScope.tunnelRebootTabChosen) {
            privateScope.chooseReopenTab(true);
        }
        privateScope.tunnelRebootModal = privateScope.tunnelRebootModal || privateScope.openRebootModal();
        interval.killAll(['msp-load-update', 'ltm-connection-check']);
        CONFIGURATOR.connectionValid = false;
        privateScope.stopTelemetryFeed(false);
    };

    // rebooted: the caller's reboot callback ran and closed its own dialogs; otherwise close them here.
    privateScope.endTunnelReboot = function (rebooted) {
        if (!rebooted) {
            defaultsDialog.abortSaving();
        }
        if (privateScope.tunnelRebootModal) {
            privateScope.tunnelRebootModal.close();
            privateScope.tunnelRebootModal = null;
        }
        privateScope.tunnelRebootTabChosen = false;
        // The reopened tab must not be the active one, or its click is ignored.
        $('#tabs > ul li').removeClass('active');
    };

    // Same as after the probe; onValidFirmware() then reopens the tab as after a USB reconnect.
    privateScope.onTunnelRebootBack = function () {
        privateScope.endTunnelReboot(true);
        FC.resetState();
        MSP.parseFailures.clear();
        MSP.lostReplies.clear();
        privateScope.resetTunnelQueue();
        privateScope.sendTunnelHandshake();
    };

    privateScope.onTunnelRebootNotRebooted = function () {
        privateScope.endTunnelReboot(false);
        CONFIGURATOR.connectionValid = true;
        privateScope.startTelemetryFeed();
        privateScope.startStatusPolling();
        privateScope.reopenLastTab();
    };

    privateScope.onTunnelRebootGone = function () {
        privateScope.endTunnelReboot(false);
        privateScope.abortConnecting();
    };

    privateScope.reopenLastTab = function () {
        if (privateScope.reopenTab) {
            privateScope.reopenTab.trigger('click');
        } else {
            $(`#tabs ul.mode-connected .tab_setup a`).trigger('click');
        }
    };

    privateScope.wrapForTunnel = function (body) {
        // phase-2 A/B: wire counter.
        if (privateScope.telemetryFeed) {
            privateScope.telemetryFeed.noteWire(mspCodeOfFrame(body));
        }
        return concatFrames(privateScope.mavlinkLink.wrapMsp(body)).buffer;
    };

    privateScope.onMavlinkMessage = function (frame) {
        const target = privateScope.mavlinkLink.getTarget();
        if (target && frame.sysid === target.sysid && frame.compid === target.compid) {
            privateScope.rebootMonitor.noteFcActivity();
        }
        if (privateScope.telemetryFeed) {
            privateScope.telemetryFeed.handleFrame(frame);
        }
    };

    privateScope.startTelemetryFeed = function () {
        // phase-2 A/B: read once per connect; false keeps the whole session on phase-1 behaviour.
        CONFIGURATOR.mavlinkTelemetryFeed = CONFIGURATOR.mavlinkTunnelActive && isTelemetryFeedEnabled(store);
        periodicStatusUpdater.resetTunnelCycle();
        if (!CONFIGURATOR.mavlinkTelemetryFeed) {
            return;
        }
        privateScope.telemetryFeed = new MavlinkTelemetryFeed({
            link: privateScope.mavlinkLink,
            send: (data, callback) => CONFIGURATOR.connection.send(data, callback),
            roundTripMs: () => mspQueue.getRoundtrip(),
            fc: FC,
            msp: MSP,
            onSensorStatus: status => privateScope.sensor_status_ex(status),
            onStreamsReady: privateScope.onTelemetryStreamsReady,
            onFirstVirtual: () => privateScope.showLinkType(true, true),
        });
        MSP.virtualReplies = privateScope.telemetryFeed;
        privateScope.telemetryFeed.start();
    };

    // restore: the port is still open, so the FC gets its stream defaults back. done() always runs once.
    privateScope.stopTelemetryFeed = function (restore, done = null) {
        const feed = privateScope.telemetryFeed;
        privateScope.telemetryFeed = null;
        MSP.virtualReplies = null;
        if (!feed) {
            if (done) {
                done();
            }
            return;
        }
        const portOpen = Boolean(CONFIGURATOR.connection) && CONFIGURATOR.connection.hasConnectionId();
        feed.stop(restore && portOpen, done);
    };

    privateScope.onTelemetryStreamsReady = function (accepted) {
        if (accepted > 0) {
            GUI.log(i18n.getMessage('mavlinkTelemetryStreamsActive', [accepted]));
        } else {
            GUI.log(i18n.getMessage('mavlinkTelemetryNoAck'));
        }
    };

    privateScope.onTunnelChunk = function (bytes) {
        mspQueue.notifyTunnelProgress();
        MSP.read({ data: bytes });
    };

    privateScope.sendGcsHeartbeat = function () {
        if (CONFIGURATOR.connection) {
            CONFIGURATOR.connection.send(privateScope.mavlinkLink.heartbeatFrame().buffer, null);
        }
    };

    privateScope.showLinkType = function (tunnel, telemetry = false) {
        let key = tunnel ? 'linkTypeMavlinkTunnel' : 'linkTypeMsp';
        if (telemetry) {
            key = 'linkTypeMavlinkTunnelTelemetry';
        }
        $('#link-type').attr('data-i18n', key).data('i18n', key).text(i18n.getMessage(key));
    };

    privateScope.clearLinkType = function () {
        $('#link-type').removeAttr('data-i18n').removeData('i18n').text('');
    };

    // Also runs before every connect, so the firmware flasher and the next session start clean.
    privateScope.endMavlinkSession = function () {
        privateScope.rebootMonitor.cancel();
        MSP.rebootTracker = null;
        if (privateScope.tunnelRebootModal) {
            privateScope.endTunnelReboot(false);
        }
        privateScope.stopTelemetryFeed(false);
        CONFIGURATOR.mavlinkTelemetryFeed = false;
        clearInterval(privateScope.gcsHeartbeatTimer);
        privateScope.gcsHeartbeatTimer = null;
        privateScope.mavlinkLink.reset();
        timeout.remove('mavlink-tunnel-switch');
        privateScope.mavlinkSession = privateScope.newMavlinkSession();
        CONFIGURATOR.mavlinkTunnelActive = false;
        mspQueue.setTunnelMode(false);
        mspQueue.setTransportTransform(null);
        privateScope.clearLinkType();
    };

    privateScope.onConnect = function () {
        timeout.remove('connecting'); // kill connecting timer
        $('#connectbutton a.connect_state').text(i18n.getMessage('disconnect')).addClass('active');
        $('#connectbutton a.connect').addClass('active');
        $('.mode-disconnected').hide();
        $('.mode-connected').show();


        MSP.send_message(MSPCodes.MSP_BOXIDS, false, false, function (response) {
            if (privateScope.isTunnelReplyLost(response, MSPCodes.MSP_BOXIDS)) {
                return;
            }
            FC.generateAuxConfig();
        });

        MSP.send_message(MSPCodes.MSP_DATAFLASH_SUMMARY, false, false, function (response) {
            if (privateScope.isTunnelReplyLost(response, MSPCodes.MSP_DATAFLASH_SUMMARY)) {
                return;
            }
            $('#sensor-status').show();
            $('#portsinput').hide();
            $('#dataflash_wrapper_global').show();
            $('#profiles_wrapper_global').show();

            /*
            * Init PIDs bank with a length that depends on the version
            */
            let pidCount = 12;

            for (let i = 0; i < pidCount; i++) {
                FC.PIDs.push(new Array(4));
            }


            interval.add('msp-load-update', function () {
                $('#msp-version').text("MSP version: " + MSP.protocolVersion.toFixed(0));
                $('#msp-load').text("MSP load: " + mspQueue.getLoad().toFixed(1));
                $('#msp-roundtrip').text("MSP round trip: " + mspQueue.getRoundtrip().toFixed(0));
                $('#hardware-roundtrip').text("HW round trip: " + mspQueue.getHardwareRoundtrip().toFixed(0));
            }, 100);

            privateScope.startStatusPolling();
        });
    }

    privateScope.startStatusPolling = function () {
        interval.add('global_data_refresh', periodicStatusUpdater.run, periodicStatusUpdater.getUpdateInterval(CONFIGURATOR.connection.bitrate), false);
    };

    // A lost tunnel write stalls its save chain: undo what the chain had paused or disabled.
    privateScope.onWriteLost = function (code) {
        defaultsDialog.abortSaving();
        $(document).trigger(GUI.EVENT_MSP_WRITE_LOST, [code]);
        if (CONFIGURATOR.connectionValid && !privateScope.rebootMonitor.active) {
            privateScope.startStatusPolling();
        }
    };

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
            cliTab.read(info);
        }
    }

    publicScope.read_ltm = function (info) {
        privateScope.ltmProtocolGate.read(info);
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

export default SerialBackend;
