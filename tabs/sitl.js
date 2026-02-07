'use strict'

import smalltalk from 'smalltalk';

import GUI from './../js/gui';
import i18n from './../js/localization';
import { SITLProcess, SitlSerialPortUtils } from './../js/sitl';
import dialog from './../js/dialog';
import {bridge, Platform} from './../js/bridge';
import SITLWebAssembly from '../js/web/SITL-Webassembly';

const localhost = "127.0.0.1"

const simulators = [
    {
        name: "X-Plane",
        port: 49001,
        isPortFixed: false,
        inputChannels: 4,
        fixedChanMap: ["Throttle", "Roll", "Pitch", "Yaw" ]
    },
    {
        name: "RealFlight",
        port: 18083,
        isPortFixed: true,
        inputChannels: 12,
        fixedChanMap: false
    }
];

const stdProfiles = [
    {
        name: "[Standard] Configurator",
        sim: "X-Plane",
        eepromFileName: "standard-configurator.bin",
        isStdProfile: true,
        simEnabled: false,
        port: 49001,
        ip: "127.0.0.1",
        useImu: false,
        channelMap: [ 1, 15, 13, 16],
        useSerialReceiver: true,
        serialPort: "",
        serialUart: 3,
        serialProtocol: "SBus",
        baudRate: false,
        stopBits: false,
        parity: false
    },
    {
        name: "[Standard] X-Plane",
        sim: "X-Plane",
        eepromFileName: "standard-x-plane.bin",
        isStdProfile: true,
        simEnabled: true,
        port: 49001,
        ip: "127.0.0.1",
        useImu: false,
        channelMap: [ 1, 15, 13, 16],
        useSerialReceiver: true,
        serialPort: "",
        serialUart: 3,
        serialProtocol: "SBus",
        baudRate: false,
        stopBits: false,
        parity: false
    },
    {
        name: "[Standard] RealFlight Flying Wing",
        sim: "RealFlight",
        eepromFileName: "standard-realflight.bin",
        isStdProfile: true,
        simEnabled: true,
        port: 49001,
        ip: "127.0.0.1",
        useImu: false,
        channelMap: [ 1, 13, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        useSerialReceiver: true,
        serialPort: "",
        serialUart: 3,
        serialProtocol: "SBus",
        baudRate: false,
        stopBits: false,
        parity: false
    }
];

var SITL_LOG = "";

const sitlTab = {};
sitlTab.initialize = (callback) => {
 
    if (GUI.active_tab !== this) {
        GUI.active_tab = this;
    }

    import('./sitl.html?raw').then(({default: html}) => GUI.load(html, function () {
        
        i18n.localize();

        if (bridge.getPlatform() === Platform.Web) {
            $('#sitlWebAssemblyInfo').show();
            $('#wasmProxy').removeClass('is-hidden');
            $('#wasmProxyPort').removeClass('is-hidden');
            $('#eepromFiles').removeClass('is-hidden');
        }
    
        var currentSim, currentProfile, profiles, sitlWasmProxyEnabled, sitlWasmProxyPort;
        var mapping = new Array(28).fill(0);
        var serialProtocolls = SitlSerialPortUtils.getProtocolls();
        var sim_e = $('#simulator');
        var enableSim_e = $('#sitlEnableSim');
        var port_e = $('#simPort');
        var simIp_e = $('#simIP');
        var useImu_e = $('#sitlUseImu');
        var profiles_e = $('#sitlProfile');
        var profileSaveBtn_e = $('#sitlProfileSave');
        var profileNewBtn_e = $('#sitlProfileNew');
        var profileDeleteBtn_e = $('#sitlProfileDelete');
        var serialPorts_e = $('#sitlSerialPort');
        var serialReceiverEnable_e = $('#serialReceiverEnable');
        var serialUart_e = $('#sitlSerialUART');
        var protocollPreset_e = $('#serialProtocoll'); 
        var baudRate_e = $('#sitlBaud');
        var stopBits_e = $('#serialStopbits');
        var parity_e = $('#serialParity');
        var wasmProxy_e = $('#sitlEnableWasmProxy');
        var wasmProxyPort_e = $('#sitlWasmProxyPort');
        
        if (bridge.getPlatform() === Platform.Electron) {
            if (SITLProcess.isRunning) {
                $('.sitlStart').addClass('disabled');
                $('.sitlStop').removeClass('disabled');
            } else {
                $('.sitlStop').addClass('disabled');
                $('.sitlStart').removeClass('disabled');
            }
        } else {
            if (SITLWebAssembly.isRunning()) {
                $('.sitlStart').addClass('disabled');
                $('.sitlStop').removeClass('disabled');
            } else {
                $('.sitlStop').addClass('disabled');
                $('.sitlStart').removeClass('disabled');
            }
             renderEepromFilesTable();

        }

        var $sitlLog = $('#sitlLog');
        $sitlLog.val(SITL_LOG);
        if ($sitlLog && $sitlLog.length == 1) {
            $sitlLog.val(SITL_LOG);
            $sitlLog.animate({scrollTop: $sitlLog[0].scrollHeight -  $sitlLog.height()}, 1);
        }

        profiles = structuredClone(stdProfiles);
        const sitlProfiles = bridge.storeGet('sitlProfiles', false);
        if (sitlProfiles) {
            profiles.push(...sitlProfiles);
        }
        initElements(true);

        sitlWasmProxyEnabled = bridge.storeGet('sitlWasmProxyEnabled', true);
        wasmProxy_e.prop('checked', sitlWasmProxyEnabled);
        wasmProxyPort_e.prop('disabled', !sitlWasmProxyEnabled);
        

        sitlWasmProxyPort = bridge.storeGet('sitlWasmProxyPort', 8081);
        wasmProxyPort_e.val(sitlWasmProxyPort);

        if (bridge.getPlatform() === Platform.Electron) {
            SitlSerialPortUtils.resetPortsList();
            SitlSerialPortUtils.pollSerialPorts(ports => {
                serialPorts_e.find('*').remove();
                ports.forEach(port => {
                    serialPorts_e.append(`<option value="${port}">${port}</option>`)
                });

            });
        } else {
            $('#serialReceiver').hide();
        }
        
        enableSim_e.on('change', () => {
            currentProfile.simEnabled = enableSim_e.is(':checked');
            updateSim();
        });

        sim_e.on('change', () => {     
            updateSim();
        });
        
        profiles_e.on('change', () => {
            updateCurrentProfile();
        });

        port_e.on('change', () => {
            if (!currentSim.isPortFixed) {
                var port = parseInt(port_e.val());
                if (port != NaN)
                    currentProfile.port = parseInt(port_e.val());
            } 
        });

        simIp_e.on('change', () => {
            currentProfile.ip = simIp_e.val();
        });

        useImu_e.on('change', () => {
            currentProfile.useImu = useImu_e.is(':checked');
        });

        wasmProxy_e.on('change', () => {
            sitlWasmProxyEnabled = wasmProxy_e.is(':checked');
            bridge.storeSet('sitlWasmProxyEnabled', sitlWasmProxyEnabled);
            wasmProxyPort_e.prop('disabled', !sitlWasmProxyEnabled);

        });

        wasmProxyPort_e.on('change', () => {
            sitlWasmProxyPort = parseInt(wasmProxyPort_e.val());
            if (sitlWasmProxyPort != NaN) {
                bridge.storeSet('sitlWasmProxyPort', sitlWasmProxyPort);
            }
        });

        $('.sitlStart').on('click', ()=> {
            $('.sitlStart').addClass('disabled');
            $('.sitlStop').removeClass('disabled');
            
            if (bridge.getPlatform() === Platform.Web) {
                $('.eepromActionButton').prop('disabled', true);
            }
   
            var sim, simPort, simIp, channelMap = "";

            if (enableSim_e.is(':checked')) {
                switch(currentSim.name) {
                    case 'X-Plane':
                        sim = 'xp';
                        break;
                    case 'RealFlight':
                        sim = 'rf'
                        break;
                }
            }

            if (port_e.val() !== "") {
                simPort = port_e.val();
            }
            
            if (simIp_e.val() !== "") {
                simIp = simIp_e.val();
            }
            
            const zeroPad = (num, places) => String(num).padStart(places, '0');

            for (let i = 0; i < currentSim.inputChannels; i++) {
                var inavChan = mapping[i];
                if (inavChan == 0) {
                    continue;
                } else if (inavChan < 13) {
                    channelMap += `M${zeroPad(inavChan, 2)}-${zeroPad(i + 1, 2)},`;
                } else {
                    channelMap += `S${zeroPad(inavChan - 12, 2)}-${zeroPad(i + 1, 2)},`;
                }
            }
            channelMap = channelMap.substring(0, channelMap.length - 1);
            if (bridge.getPlatform() === Platform.Electron) {
                var serialOptions = null;
                if ( serialReceiverEnable_e.is(':checked') && !!serialPorts_e.val()) {
                    var selectedProtocoll = protocollPreset_e.find(':selected').val();
                    if (selectedProtocoll == "manual") {
                        serialOptions = {
                            protocollName: "manual",
                            baudRate: baudRate_e.val() || currentProfile.baudRate || "115200",
                            stopBits: stopBits_e.val() || currentProfile.stopBits || "One",
                            parity: parity_e.val() || currentProfile.parity || "None",
                            serialPort: serialPorts_e.val() || currentProfile.serialPort || "",
                            serialUart: serialUart_e.val() || currentProfile.serialUart || -1
                        }
                    } else {;
                        serialOptions = {
                            protocollName: selectedProtocoll || "SBus",
                            serialPort: serialPorts_e.val() || currentProfile.serialPort || "" ,
                            serialUart: serialUart_e.val() || currentProfile.serialUart || -1
                        }
                    }
                }
            }

            appendLog("\n");
            
            if (bridge.getPlatform() === Platform.Electron) {
                SITLProcess.start(currentProfile.eepromFileName, sim, useImu_e.is(':checked'), simIp, simPort, channelMap, serialOptions, result => {
                    appendLog(result);
                });
            } else {
                SITLWebAssembly.reset();
                SITLWebAssembly.start( 
                    {
                        eepromFile: currentProfile.eepromFileName,
                        sim: sim,
                        useIMU: useImu_e.is(':checked'),
                        simIp: simIp,
                        simPort: simPort,
                        channelMap: channelMap,
                        proxyPort: sitlWasmProxyEnabled ? sitlWasmProxyPort : 0
                    },
                    (error, commandLineArgs) => {
                        if (error)
                            appendLog(error);

                        appendLog(`SITL started with args: ${commandLineArgs}\n`);
                    }
                );

                setTimeout(() => {
                    renderEepromFilesTable();
                }, sitlWasmProxyEnabled ? 7500 : 2500);
            }

        });

        $('.sitlStop').on('click', ()=> {
               
            if (bridge.getPlatform() === Platform.Electron) {
                SITLProcess.stop();
            } else {
                try {
                    SITLWebAssembly.stop();
                } catch (e) {
                    appendLog(e.message);
                    return;
                }
            }
            
            $('.sitlStop').addClass('disabled');
            $('.sitlStart').removeClass('disabled');

            $('.eepromActionButton').prop('disabled', false);
            
            appendLog(i18n.getMessage('sitlStopped'));
        });

        profileSaveBtn_e.on('click', function () {
            saveProfiles();
        });

        profileNewBtn_e.on('click', function () {
            smalltalk.prompt(i18n.getMessage('sitlNewProfile'), i18n.getMessage('sitlEnterName')).then(rawName => {
                const name = (rawName || '').trim();
                if (!name)
                    return;

                if (profiles.find(e => e.name == name )) {
                    dialog.alert(i18n.getMessage('sitlProfileExists'));
                    return;
                }
                const safeText = $('<div>').text(name).html(); // escape
                const eepromName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.bin';;
                var profile = {
                        name: name,
                        sim: 'RealFlight',
                        isStdProfile: false,
                        simEnabled: false,
                        eepromFileName: eepromName,
                        port: 49001,
                        ip: '127.0.0.1',
                        useImu: false,
                        channelMap: [ 1, 13, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                        useSerialReceiver: true,
                        serialPort: serialPorts_e.val(),
                        serialUart: 3,
                        serialProtocol: 'SBus',
                        baudRate: false,
                        stopBits: false,
                        parity: false
                };
                profiles.push(profile);
                profiles_e.append(`<option value="${safeText}">${safeText}</option>`)
                profiles_e.val(name);
                updateCurrentProfile();
                saveProfiles();
            }).catch(() => {});
        });

        profileDeleteBtn_e.on('click', function () {

            if (currentProfile.isStdProfile) {
                dialog.alert(i18n.getMessage('sitlStdProfileCantDeleted'));            
                return;
            }

            var selected = profiles_e.find(':selected').val();
            profiles = profiles.filter(profile => {
                return profile.name != selected;
            });
            
            SITLProcess.deleteEepromFile(currentProfile.eepromFileName);
            profiles_e.find('*').remove();
            
            initElements(false);
        });

        serialReceiverEnable_e.on('change', () => {
        currentProfile.useSerialReceiver = serialReceiverEnable_e.is(':checked');
        });

        protocollPreset_e.on('change', () => {
            var selectedProtocoll = protocollPreset_e.find(':selected').val();
            
            var protocoll = serialProtocolls.find(protocoll => {
                return protocoll.name == selectedProtocoll;
            });

            if (selectedProtocoll != 'manual'){  
                baudRate_e.prop('disabled', true);
                baudRate_e.val(protocoll.baudRate);
                stopBits_e.prop('disabled', true);
                stopBits_e.val(protocoll.stopBits);
                parity_e.prop('disabled', true);
                parity_e.val(protocoll.parity);
                serialUart_e.prop('disabled', selectedProtocoll == "Flight Controller Proxy");
            } else {
                baudRate_e.prop('disabled', false);
                stopBits_e.prop('disabled', false);
                parity_e.prop('disabled', false);
                serialUart_e.prop('disabled', false);
            }

            currentProfile.serialProtocol = selectedProtocoll;
        });

        serialPorts_e.on('change', () => {
            currentProfile.serialPort = serialPorts_e.val();
        });

        serialUart_e.on('change', () => {
            currentProfile.serialUart = parseInt(serialUart_e.val());
        });

        baudRate_e.on('change', () => {
            var baud = parseInt(baudRate_e.val());
            if (baud != NaN)
                currentProfile.baudRate = baud
        });

        stopBits_e.on('change', () => {
            currentProfile.stopBits = stopBits_e.val();
        });

        parity_e.on('change', () => {
            currentProfile.parity = parity_e.val();
            });
        
        if (bridge.getPlatform() === Platform.Electron) {
            window.electronAPI.onChildProcessStdout(data => {
                appendLog(data);
            });

            window.electronAPI.onChildProcessStderr(data => {
                appendLog(data);
            });

            window.electronAPI.onChildProcessError(error => {
                SITLProcess.stop();
                appendLog(error);
            });
        } else {

            SITLWebAssembly.onPrint((data) => {
                appendLog(data);
            });

            SITLWebAssembly.onPrintErr((data) => {
                appendLog(data);
            });
        }

        function initElements(init)
        {
            profiles.forEach(profile => {
                profiles_e.append(`<option value="${profile.name}">${profile.name}</option>`)
            });

            if (init) {
                simulators.forEach(simulator => {
                    sim_e.append(`<option value="${simulator.name}">${simulator.name}</option>`)       
                });

                protocollPreset_e.append('<option value="manual">Manual</option>');
                serialProtocolls.forEach(protocoll => {
                    protocollPreset_e.append(`<option value="${protocoll.name}">${protocoll.name}</option>`);
                });

                const sitlLastProfile = bridge.storeGet('sitlLastProfile', false);
                if (sitlLastProfile) {    
                    var element = profiles.find(profile => {
                        return profile.name == sitlLastProfile;
                    });

                    if (element)
                        profiles_e.val(element.name).trigger('change');
                }
            }
            
            updateCurrentProfile();
        }

        function saveProfiles() {
            if (currentProfile.isStdProfile) {
                dialog.alert(i18n.getMessage('sitlStdProfileCantOverwritten'));
                return;
            }        
            var profilesToSave = [];
            profiles.forEach(profile => {
                if (!profile.isStdProfile)
                    profilesToSave.push(profile);
            });

            bridge.storeSet('sitlProfiles', profilesToSave);
        
        }

        function updateSim() {
            simulators.forEach(simulator => {
                if (simulator.name == sim_e.find(':selected').text()) {         
                    currentSim = simulator;
                    //currentProfile.sim = currentSim.name;
                    if (currentSim.isPortFixed) {
                    port_e.val(currentSim.port).trigger('change');
                    } else {
                        port_e.val(currentProfile.port);
                    }
                    currentProfile.sim = currentSim.name;
                    sim_e.prop('disabled', !currentProfile.simEnabled);
                    simIp_e.prop('disabled', !currentProfile.simEnabled);
                    port_e.prop('disabled', simulator.isPortFixed || !currentProfile.simEnabled);
                    useImu_e.prop('disabled', !currentProfile.simEnabled);
                    
                    renderChanMapTable();
                    return;
                }
            });
        }

        function updateCurrentProfile() {
            var selected = profiles_e.find(':selected').val(); 
            var selectedIndex = profiles.findIndex(element => {     
                return element.name == selected;
            });
            currentProfile = profiles[selectedIndex];
            
            protocollPreset_e.val(currentProfile.serialProtocol);
            if (currentProfile.serialProtocol == "manual")
            {
                baudRate_e.val(currentProfile.baudRate);
                baudRate_e.prop('disabled', false);
                stopBits_e.val(currentProfile.stopBits);
                stopBits_e.prop('disabled', false);
                parity_e.val(currentProfile.parity);
                parity_e.prop('disabled', false);
                serialUart_e.prop('disabled', false);
            } else {      
                var protocoll = serialProtocolls.find(protocoll => {
                    return protocoll.name == currentProfile.serialProtocol;
                });
                baudRate_e.prop('disabled', true);
                baudRate_e.val(protocoll.baudRate);
                stopBits_e.prop('disabled', true);
                stopBits_e.val(protocoll.stopBits);
                parity_e.prop('disabled', true);
                parity_e.val(protocoll.parity);   
                serialUart_e.prop('disabled', currentProfile.serialProtocol == "Flight Controller Proxy");
            }
            
            if (currentProfile.serialPort != "")
                serialPorts_e.val(currentProfile.serialPort);
            
            enableSim_e.prop('checked', currentProfile.simEnabled).trigger('change');
            serialReceiverEnable_e.prop('checked', currentProfile.useSerialReceiver).trigger('change');
            serialUart_e.val(currentProfile.serialUart);
            mapping = currentProfile.channelMap;
            sim_e.val(currentProfile.sim);
            updateSim();
            simIp_e.val(currentProfile.ip).trigger('change'); 
            useImu_e.prop('checked', currentProfile.useImu).trigger('change');

            bridge.storeSet('sitlLastProfile', selected);
        }

        function renderChanMapTable() 
        {
            var mapTableBody = $('.mapTableBody');
            mapTableBody.find('*').remove();
            for (let i = 0; i < currentSim.inputChannels; i++) {
            
                var output;
                if (currentSim.fixedChanMap) {
                    output = currentSim.fixedChanMap[i];
                } else {
                    output = i + 1;
                }
                
                mapTableBody.append("<tr><td>" + output + "</td><td><select data-out=\"" + i + "\" class=\"inavChannel\"\"></select></td></td>");
                const row = mapTableBody.find('tr:last');
                GUI.fillSelect(row.find(".inavChannel"), getInavChannels(), mapping[i]);

                row.find(".inavChannel").val(mapping[i]).on('change', (sender) => {
                    mapping[$(sender.target).data('out')] = parseInt($(sender.target).val());
                    bridge.storeSet('sitlMapping', mapping);
                });
            }
        }

        async function renderEepromFilesTable()
        {
            var eepromFilesBody = $('.eepromFilesTableBody');
            eepromFilesBody.find('*').remove();

            const dirHandle = await navigator.storage.getDirectory();
            const files = dirHandle.values();
            for await (const handle of files) {
                if (handle.kind === 'file' && handle.name.endsWith('.bin')) {
                    const row = `<tr><td>${handle.name}</td>
                                 <td>
                                    <button title="${i18n.getMessage('sitlDeleteEeprom')}" class="button eepromActionButton deleteEepromFileBtn" data-filename="${handle.name}">🗑️</button> 
                                    <button title="${i18n.getMessage('sitlDownloadEeprom')}" class="button eepromActionButton downloadEepromFileBtn" data-filename="${handle.name}">⬇️</button>
                                 </td></tr>`;
                    eepromFilesBody.append(row);
                }
            }

            if (SITLWebAssembly.isRunning()) {
                $('.eepromActionButton').prop('disabled', true);
            } else {
                $('.eepromActionButton').prop('disabled', false);
            }

        $('.downloadEepromFileBtn').on('click', async (event) => {
            const filename = $(event.currentTarget).data('filename');
            const dirHandle = await navigator.storage.getDirectory();
            try {
                const fileHandle = await dirHandle.getFileHandle(filename);
                const file = await fileHandle.getFile();
                const arrayBuffer = await file.arrayBuffer();
                bridge.writeFile(filename, new Uint8Array(arrayBuffer), true);
                appendLog(`EEPROM file '${filename}' downloaded.\n`);
            } catch (e) {
                appendLog(`Failed to download EEPROM file '${filename}': ${e.message}\n`);
            }
        });

        $('.deleteEepromFileBtn').on('click', async (event) => {
            const filename = $(event.currentTarget).data('filename');
            const dirHandle = await navigator.storage.getDirectory();
            try {
                await dirHandle.removeEntry(filename);
                appendLog(`EEPROM file '${filename}' deleted.\n`);
                renderEepromFilesTable();
            } catch (e) {
                appendLog(`Failed to delete EEPROM file '${filename}': ${e.message}\n`);
            }
        });
        }

        function getInavChannels() {
            var channels = [];
            for (var i = 0; i <= 12; i++) {
                if (i == 0)
                    channels.push("None");
                else
                    channels.push("Motor " + i);
            }

            for (var i = 1; i <= 16; i++) {
                if (i == 0)
                    channels.push("None");
                else    
                    channels.push("Servo " + i);
            }
            return channels;
        }

        function appendLog(message){
            SITL_LOG += message;
            var $sitlLog = $('#sitlLog');
            if ($sitlLog && $sitlLog.length == 1) {
                $sitlLog.val(SITL_LOG);
                $sitlLog.animate({scrollTop: $sitlLog[0].scrollHeight -  $sitlLog.height()}, 1);
            }
        }

        GUI.content_ready(callback);
    }));  
};

sitlTab.cleanup = (callback) => {
    SitlSerialPortUtils.stopPollSerialPorts();
    if (callback) 
        callback();
};

export default sitlTab;
