'use strict'

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
        name: "[Standard] X-Plane",
        sim: "X-Plane",
        eepromFileName: "standard-x-plane.bin",
        isStdProfile: true,
        simEnabeld: true,
        port: 49001,
        ip: "127.0.0.1",
        useImu: false,
        channelMap: [ 1, 15, 13, 16],
        useSerialTcp: true,
        comPort: "",
        tcpPort: 5762,
        serialProtocol: "SBus",
        baudrate: false,
        stopbits: false,
        parity: false
    },
    {
        name: "[Standard] RealFlight Flying Wing",
        sim: "RealFlight",
        eepromFileName: "standard-realflight.bin",
        isStdProfile: true,
        simEnabeld: true,
        port: 49001,
        ip: "127.0.0.1",
        useImu: false,
        channelMap: [ 1, 13, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        useSerialTcp: true,
        comPort: "",
        tcpPort: 5762,
        serialProtocol: "SBus",
        baudrate: false,
        stopbits: false,
        parity: false
        
    }
];

var SITL_LOG = "";

TABS.sitl = {};
TABS.sitl.initialize = (callback) => {
 
    if (GUI.active_tab != 'sitl') {
        GUI.active_tab = 'sitl';
        googleAnalytics.sendAppView('SITL');
    }

    if (GUI.active_tab != 'sitl') {
        GUI.active_tab = 'sitl';
        googleAnalytics.sendAppView('SITL');
    }

    GUI.load("./tabs/sitl.html", function () {
        localize();
    
    var os = GUI.operating_system;
    if (os != 'Windows' && os != 'Linux') {

        $('.content_wrapper').find('*').remove();
        $('.content_wrapper').append(`<h2>${chrome.i18n.getMessage('sitlOSNotSupported')}</h2>`);
        
        GUI.content_ready(callback);
        return;
    }


    var currentSim, currentProfile, profiles;
    var mapping = new Array(28).fill(0);
    var serialProtocolls = Ser2TCP.getProtocolls();
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
    var serialTcpEnable = $('#serialTcpEnable')
    var tcpPort_e = $('#serialTCPPort');
    var protocollPreset_e = $('#serialProtocoll'); 
    var baudRate_e = $('#sitlBaud');
    var stopBits_e = $('#serialStopbits');
    var parity_e = $('#serialParity');
    var serialTcpEable_e = $('#serialTcpEnable');
    
    if (SITLProcess.isRunning) {
        $('.sitlStart').addClass('disabled');
        $('.sitlStop').removeClass('disabled');
    } else {
        $('.sitlStop').addClass('disabled');
        $('.sitlStart').removeClass('disabled');
    }

    $('#sitlLog').val(SITL_LOG);
    $('#sitlLog').animate({scrollTop: $('#sitlLog').scrollHeight}, "fast");

    profiles = stdProfiles.slice(0);
    chrome.storage.local.get('sitlProfiles', (result) => {
        if(result.sitlProfiles) 
            profiles.push(...result.sitlProfiles);
  
        initElements(true);
    });
    
    Ser2TCP.resetPortsList();
    Ser2TCP.pollSerialPorts(ports => {
        serialPorts_e.find('*').remove();
        ports.forEach(port => {
            serialPorts_e.append(`<option value="${port}">${port}</option>`)
        });

    });
    
    enableSim_e.on('change', () => {
        currentProfile.simEnabeld = enableSim_e.is(':checked');
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

    $('.sitlStart').on('click', ()=> {
        $('.sitlStart').addClass('disabled');
        $('.sitlStop').removeClass('disabled');

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
        
        var serialOptions;
        var selectedProtocoll = protocollPreset_e.find(':selected').val();
        if (selectedProtocoll == "manual") {
            serialOptions = {
                protocollName: "manual",
                bitrate: currentProfile.baudrate,
                stopBits: currentProfile.stopBits,
                parityBit: currentProfile.parity
            }
        } else {;
            serialOptions = {
                protocollName: selectedProtocoll
            }
        }
        
        SITLProcess.start(currentProfile.eepromFileName, sim, useImu_e.is(':checked'), simIp, simPort, channelMap, result => {
                        
        appendLog(result);            
        if (serialTcpEnable.is(':checked') && result == `[SIM] Connection with ${currentProfile.sim} successfully established.\n`) {
            Ser2TCP.start(serialPorts_e.val(), serialOptions, currentProfile.ip, currentProfile.tcpPort, result => {
                appendLog(`[Serial2TCP] ${result}`);
            });
        }
        });
    });

    $('.sitlStop').on('click', ()=> {
        $('.sitlStop').addClass('disabled');
        $('.sitlStart').removeClass('disabled');
        Ser2TCP.stop();
        SITLProcess.stop();
        appendLog(chrome.i18n.getMessage('sitlStopped'));
    });

    profileSaveBtn_e.on('click', () => {
        saveProfiles();
    });

    profileNewBtn_e.on('click', () => {
        var name = prompt(chrome.i18n.getMessage('sitlNewProfile'), chrome.i18n.getMessage('sitlEnterName'));
        if (!name)
            return;

        if (profiles.find(e => { return e.name == name })) {
            alert(chrome.i18n.getMessage('sitlProfileExists'))
            return;
        }
        var eerpromName = name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + ".bin";
        var profile = {
                name: name,
                sim: "RealFlight",
                isStdProfile: false,
                simEnabeld: true,
                eepromFileName: eerpromName,
                port: 49001,
                ip: "127.0.0.1",
                useImu: false,
                channelMap: [ 1, 13, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                useSerialTcp: true,
                tcpPort: 5762,
                serialProtocol: "SBus",
                baudrate: false,
                stopbits: false,
                parity: false
        }
        profiles.push(profile);
        profiles_e.append(`<option value="${name}">${name}</option>`)
        profiles_e.val(name);
        updateCurrentProfile();
        saveProfiles();
    });

    profileDeleteBtn_e.on('click', () => {

        if (currentProfile.isStdProfile) {
            alert(chrome.i18n.getMessage('sitlStdProfileCantDeleted'));
            return;
        }

        var selected = profiles_e.find(':selected').val();
        profiles = profiles.filter(profile => {
            return profile.name != selected;
        });
        
        SITLProcess.deleteEepromFile(currentProfile.eepromFileName);
        profiles_e.find('*').remove();
        
        initElements(false);
        saveProfiles();
    });

    serialTcpEable_e.on('change', () => {
       currentProfile.useSerialTcp = serialTcpEable_e.is(':checked');
    });

    protocollPreset_e.on('change', () => {
        var selectedProtocoll = protocollPreset_e.find(':selected').val();
        
        var protocoll = serialProtocolls.find(protocoll => {
            return protocoll.name == selectedProtocoll;
        });

        if (selectedProtocoll != 'manual'){  
            baudRate_e.prop('disabled', true);
            baudRate_e.val(protocoll.baudrate);
            stopBits_e.prop('disabled', true);
            stopBits_e.val(protocoll.stopBits);
            parity_e.prop('disabled', true);
            parity_e.val(protocoll.parity);

        } else {
            baudRate_e.prop('disabled', false);
            baudRate_e.val('');
            stopBits_e.prop('disabled', false);
            stopBits_e.val('');
            parity_e.prop('disabled', false);
            parity_e.val('');
        }

        currentProfile.serialProtocol = selectedProtocoll;
    });

    serialPorts_e.on('change', () => {
        currentProfile.comPort = serialPorts_e.val();
    });

    tcpPort_e.on('change', () => {
        currentProfile.tcpPort = parseInt(tcpPort_e.val());
    });

    baudRate_e.on('change', () => {
        var baud = parseInt(baudRate_e.val());
        if (baud != NaN)
            currentProfile.baudrate = baud
    });

    stopBits_e.on('change', () => {
        currentProfile.stopBits = stopBits_e.val();
    });

    parity_e.on('change', () => {
        currentProfile.parity = parity_e.val();
    });

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

            chrome.storage.local.get('sitlLastProfile', (result) => {
                if (result.sitlLastProfile) {    
                    var element = profiles.find(profile => {
                        return profile.name == result.sitlLastProfile;
                    });

                    if (element)
                        profiles_e.val(element.name).trigger('change');
                }
            });

        }
        
        updateCurrentProfile();
    }

    function saveProfiles() {
        if (currentProfile.isStdProfile) {
            alert(chrome.i18n.getMessage('sitlStdProfileCantOverwritten'));
            return;
        }        
        var profilesToSave = [];
        profiles.forEach(profile => {
            if (!profile.isStdProfile)
                profilesToSave.push(profile);
        });

        chrome.storage.local.set({
            'sitlProfiles': profilesToSave
        });
    
    }

    function updateSim() {
        simulators.forEach(simulator => {
            if (simulator.name == sim_e.find(':selected').text()) {         
                currentSim = simulator;
                currentProfile.sim = currentSim.name;
                if (currentSim.isPortFixed) {
                   port_e.val(currentSim.port).trigger('change');
                } else {
                    port_e.val(currentProfile.port);
                }
                port_e.prop('disabled', simulator.isPortFixed);
                
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
        
        if (currentProfile.isStdProfile) {
            currentProfile = structuredClone(stdProfiles.find((profile) => {
                return profile.sim == currentProfile.sim;
            }));
        }

        protocollPreset_e.val(currentProfile.serialProtocol);
        if (currentProfile.serialProtocol == "manual")
        {
            baudRate_e.val(currentProfile.baudrate);
            baudRate_e.prop('disabled', false);
            stopBits_e.val(currentProfile.stopBits);
            stopBits_e.prop('disabled', false);
            parity_e.val(currentProfile.parity);
            parity_e.prop('disabled', false);
        } else {      
            var protocoll = serialProtocolls.find(protocoll => {
                return protocoll.name == currentProfile.serialProtocol;
            });
            baudRate_e.prop('disabled', true);
            baudRate_e.val(protocoll.baudrate);
            stopBits_e.prop('disabled', true);
            stopBits_e.val(protocoll.stopBits);
            parity_e.prop('disabled', true);
            parity_e.val(protocoll.parity);   
        }
        
        if (currentProfile.comPort != "")
            serialPorts_e.val(currentProfile.comPort);
        
        enableSim_e.prop('checked', currentProfile.simEnabeld).trigger('change');
        serialTcpEable_e.prop('checked', currentProfile.useSerialTcp).trigger('change');
        tcpPort_e.val(currentProfile.tcpPort);
        mapping = currentProfile.channelMap;
        sim_e.val(currentProfile.sim);
        updateSim();
        simIp_e.val(currentProfile.ip).trigger('change'); 
        useImu_e.prop('checked', currentProfile.useImu).trigger('change');

        chrome.storage.local.set({
            'sitlLastProfile': selected
        });
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
                chrome.storage.local.set({'sitlMapping': mapping});
            });
        }
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
        $('#sitlLog').val(SITL_LOG);
        $('#sitlLog').animate({scrollTop: $('#sitlLog')[0].scrollHeight}, "fast");
    }

    GUI.content_ready(callback);
    });
};

TABS.sitl.cleanup = (callback) => {
    Ser2TCP.stopPollSerialPorts();
    if (callback) 
        callback();
};