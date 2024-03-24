'use strict';

var helper = helper || {};

helper.serialPortHelper = (function () {

    let publicScope = {},
        privateScope = {};

    privateScope.namesGenerated = false;

    // This is a list of all the rules for the serial ports as well as their names
    privateScope.rules = [
        { name: 'MSP', groups: ['data', 'msp'], maxPorts: 2 },
        { name: 'GPS', groups: ['sensors'], maxPorts: 1, defaultBaud: 115200 },
        { name: 'TELEMETRY_FRSKY', groups: ['telemetry'], sharableWith: ['msp'], notSharableWith: ['blackbox'], maxPorts: 1 },
        { name: 'TELEMETRY_HOTT', groups: ['telemetry'], sharableWith: ['msp'], notSharableWith: ['blackbox'], maxPorts: 1 },
        { name: 'TELEMETRY_SMARTPORT', groups: ['telemetry'], maxPorts: 1 },
        { name: 'TELEMETRY_LTM', groups: ['telemetry'], sharableWith: ['msp'], notSharableWith: ['blackbox'], maxPorts: 1 },
        { name: 'RX_SERIAL', groups: ['rx'], maxPorts: 1 },
        { name: 'BLACKBOX', groups: ['peripherals'], sharableWith: ['msp'], notSharableWith: ['telemetry'], maxPorts: 1 },
        {
            name: 'TELEMETRY_MAVLINK',
            groups: ['telemetry'],
            sharableWith: ['msp'],
            notSharableWith: ['blackbox'],
            maxPorts: 1
        },
        {
            name: 'TELEMETRY_IBUS',
            groups: ['telemetry'],
            sharableWith: ['msp'],
            notSharableWith: ['blackbox'],
            maxPorts: 1
        },
        {
            name: 'RANGEFINDER',
            groups: ['sensors'],
            maxPorts: 1
        },
        {
            name: 'GSM_SMS',
            groups: ['telemetry'],
            maxPorts: 1
        },
        {
            name: 'RUNCAM_DEVICE_CONTROL',
            groups: ['peripherals'],
            maxPorts: 1
        },
        {
            name: 'TBS_SMARTAUDIO',
            groups: ['peripherals'],
            maxPorts: 1
        },
        {
            name: 'IRC_TRAMP',
            groups: ['peripherals'],
            maxPorts: 1
        },
        {
            name: 'VTX_FFPV',
            groups: ['peripherals'],
            maxPorts: 1
        },
        {
            name: 'ESC',
            groups: ['peripherals'],
            maxPorts: 1,
            defaultBaud: 115200
        },
        {
            name: 'OPFLOW',
            groups: ['sensors'],
            maxPorts: 1
        },
        {
            name: 'FRSKY_OSD',
            groups: ['peripherals'],
            maxPorts: 1,
            defaultBaud: 250000
        },
        {
            name: 'DJI_FPV',
            groups: ['peripherals'],
            maxPorts: 1,
            defaultBaud: 115200
        },
        {
            name: 'MSP_DISPLAYPORT',
            groups: ['peripherals'],
            maxPorts: 1
        },
        {
            name: 'SMARTPORT_MASTER',
            groups: ['peripherals'],
            maxPorts: 1,
            defaultBaud: 57600
        },
        {
            name: 'SBUS_OUTPUT',
            groups: ['peripherals'],
            maxPorts: 1,
            defaultBaud: 115200
        }
    ];

    // This is a mapping of the function names to their IDs required by the firmware and MSP protocol
    privateScope.functionIDs = {
        'MSP': 0,
        'GPS': 1,
        'TELEMETRY_FRSKY': 2,
        'TELEMETRY_HOTT': 3,
        'TELEMETRY_LTM': 4, // LTM replaced MSP
        'TELEMETRY_SMARTPORT': 5,
        'RX_SERIAL': 6,
        'BLACKBOX': 7,
        'TELEMETRY_MAVLINK': 8,
        'TELEMETRY_IBUS': 9,
        'RUNCAM_DEVICE_CONTROL': 10,
        'TBS_SMARTAUDIO': 11,
        'IRC_TRAMP': 12,
        'OPFLOW': 14,
        'LOG': 15,
        'RANGEFINDER': 16,
        'VTX_FFPV': 17,
        'ESC': 18,
        'GSM_SMS': 19,
        'FRSKY_OSD': 20,
        'DJI_FPV': 21,
        'SBUS_OUTPUT': 22,
        'SMARTPORT_MASTER': 23,
        'MSP_DISPLAYPORT': 25,
    };

    privateScope.identifierToName = {
        0: 'UART1',
        1: 'UART2',
        2: 'UART3',
        3: 'UART4',
        4: 'UART5',
        5: 'UART6',
        6: 'UART7',
        7: 'UART8',
        20: 'USB VCP',
        30: 'SOFTSERIAL1',
        31: 'SOFTSERIAL2'
     };

    privateScope.generateNames = function () {
        if (privateScope.namesGenerated) {
            return;
        }

        for (var i = 0; i < privateScope.rules.length; i++) {
            privateScope.rules[i].displayName = chrome.i18n.getMessage('portsFunction_' + privateScope.rules[i].name);
        }

        privateScope.namesGenerated = true;
    };

    publicScope.getRules = function () {
        privateScope.generateNames();

        return privateScope.rules;
    };

    /**
     * 
     * @param {array} functions 
     * @returns {number}
     */
    publicScope.functionsToMask = function (functions) {
        let mask = 0;
        for (let index = 0; index < functions.length; index++) {
            let key = functions[index];
            let bitIndex = privateScope.functionIDs[key];
            if (bitIndex >= 0) {
                mask = bit_set(mask, bitIndex);
            }
        }
        return mask;
    };

    /**
     * 
     * @param {number} mask 
     * @returns {array}
     */
    publicScope.maskToFunctions = function (mask) {
        let functions = [];

        let keys = Object.keys(privateScope.functionIDs);
        for (let index = 0; index < keys.length; index++) {
            let key = keys[index];
            let bit = privateScope.functionIDs[key];
            if (bit_check(mask, bit)) {
                functions.push(key);
            }
        }
        return functions;
    };

    publicScope.getPortName = function (identifier) {
        return privateScope.identifierToName[identifier];
    };

    return publicScope;
})();