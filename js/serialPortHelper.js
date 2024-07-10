'use strict';

const FC = require('./fc');
const i18n = require('./localization');
const bitHelper = require('./bitHelper');

const serialPortHelper = (function () {

    let publicScope = {},
        privateScope = {};

    privateScope.namesGenerated = false;

    // This is a list of all the rules for the serial ports as well as their names
    privateScope.rules = [
        {
            name: 'MSP',
            groups: ['data']
        },
        {
            name: 'GPS',
            groups: ['sensors'],
            defaultBaud: 115200,
            isUnique: true
        },
        {
            name: 'TELEMETRY_FRSKY',
            groups: ['telemetry']
        },
        {
            name: 'TELEMETRY_HOTT',
            groups: ['telemetry']
        },
        {
            name: 'TELEMETRY_SMARTPORT',
            groups: ['telemetry']
        },
        {
            name: 'TELEMETRY_LTM',
            groups: ['telemetry']
        },
        {
            name: 'RX_SERIAL',
            groups: ['rx'],
            isUnique: true
        },
        {
            name: 'BLACKBOX',
            groups: ['peripherals']
        },
        {
            name: 'TELEMETRY_MAVLINK',
            groups: ['telemetry'],
        },
        {
            name: 'TELEMETRY_IBUS',
            groups: ['telemetry'],
        },
        {
            name: 'RANGEFINDER',
            groups: ['sensors'],
            isUnique: true
        },
        {
            name: 'GSM_SMS',
            groups: ['telemetry'],
        },
        {
            name: 'RUNCAM_DEVICE_CONTROL',
            groups: ['peripherals'],
        },
        {
            name: 'TBS_SMARTAUDIO',
            groups: ['peripherals'],
            isUnique: true
        },
        {
            name: 'IRC_TRAMP',
            groups: ['peripherals'],
            isUnique: true
        },
        {
            name: 'VTX_FFPV',
            groups: ['peripherals'],
            isUnique: true
        },
        {
            name: 'ESC',
            groups: ['peripherals'],
            defaultBaud: 115200,
            isUnique: true
        },
        {
            name: 'OPFLOW',
            groups: ['sensors'],
            isUnique: true
        },
        {
            name: 'FRSKY_OSD',
            groups: ['peripherals'],
            defaultBaud: 250000,
            isUnique: true
        },
        {
            name: 'DJI_FPV',
            groups: ['peripherals'],
            defaultBaud: 115200,
            isUnique: true
        },
        {
            name: 'MSP_DISPLAYPORT',
            groups: ['peripherals'],
            isUnique: true
        },
        {
            name: 'SMARTPORT_MASTER',
            groups: ['peripherals'],
            defaultBaud: 57600
        },
        {
            name: 'SBUS_OUTPUT',
            groups: ['peripherals'],
            defaultBaud: 115200
        },
        {
            name: 'GIMBAL',
            groups: ['peripherals'],
            defaultBaud: 115200
        },
        {
            name: 'HEADTRACKER',
            groups: ['peripherals'],
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
        'GIMBAL': 26,
        'HEADTRACKER': 27
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

    privateScope.bauds = {
        'SENSOR': [
            '9600',
            '19200',
            '38400',
            '57600',
            '115200',
            '230400'
        ],
        'MSP': [
            '2400',
            '4800',            
            '9600',
            '19200',
            '38400',
            '57600',
            '115200',
            '230400'
        ],
        'TELEMETRY': [
            'AUTO',
            '1200',
            '2400',
            '4800',
            '9600',
            '19200',
            '38400',
            '57600',
            '115200',
            '230400',
            '460800'
        ],
        'PERIPHERAL': [
            '19200',
            '38400',
            '57600',
            '115200',
            '230400',
            '250000'
        ]
    };

    privateScope.generateNames = function () {
        if (privateScope.namesGenerated) {
            return;
        }

        for (var i = 0; i < privateScope.rules.length; i++) {
            privateScope.rules[i].displayName = i18n.getMessage('portsFunction_' + privateScope.rules[i].name);
        }

        privateScope.namesGenerated = true;
    };

    publicScope.getRules = function () {
        privateScope.generateNames();

        return privateScope.rules;
    };

    publicScope.getRuleByName = function (name) {
        for (var i = 0; i < privateScope.rules.length; i++) {
            if (privateScope.rules[i].name === name) {
                return privateScope.rules[i];
            }
        }

        return null;
    }

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
                mask = bitHelper.bit_set(mask, bitIndex);
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
            if (bitHelper.bit_check(mask, bit)) {
                functions.push(key);
            }
        }
        return functions;
    };

    publicScope.getPortName = function (identifier) {
        return privateScope.identifierToName[identifier];
    };

    publicScope.getPortIdentifiersForFunction = function (functionName) {
        let identifiers = [];

        for (let index = 0; index < FC.SERIAL_CONFIG.ports.length; index++) {
            let config = FC.SERIAL_CONFIG.ports[index];
            if (config.functions.indexOf(functionName) != -1) {
                identifiers.push(config.identifier);
            }
        }

        return identifiers;
    }

    publicScope.getPortList = function () {

        let list = [];

        for (let index = 0; index < FC.SERIAL_CONFIG.ports.length; index++) {
            let config = FC.SERIAL_CONFIG.ports[index];

            //exclude USB VCP port
            if (config.identifier == 20) {
                continue;
            }

            let port = {
                identifier: config.identifier,
                displayName: privateScope.identifierToName[config.identifier]
            };
            list.push(port);
        }
        return list;
    };

    publicScope.getBauds = function (functionName) {
        return privateScope.bauds[functionName];
    };

    publicScope.getPortByIdentifier = function (identifier) {
        for (let index = 0; index < FC.SERIAL_CONFIG.ports.length; index++) {
            let config = FC.SERIAL_CONFIG.ports[index];
            if (config.identifier == identifier) {
                return config;
            }
        }
        return null;
    };

    publicScope.clearByFunction = function (functionName) {
        for (let index = 0; index < FC.SERIAL_CONFIG.ports.length; index++) {
            let config = FC.SERIAL_CONFIG.ports[index];
            if (config.functions.indexOf(functionName) != -1) {
                config.functions = [];
            }
        }
    };

    publicScope.set = function(port, functionName, baudrate) {

        publicScope.clearByFunction(functionName);

        let config = publicScope.getPortByIdentifier(port);

        if (config) {

            config.functions = [functionName];

            //set baudrate
            //TODO add next entries as we progress
            if (functionName == 'MSP') {
                config.msp_baudrate = baudrate;
            } else if (functionName == 'GPS') {
                config.sensors_baudrate = baudrate;
            }
        }
    }

    return publicScope;
})();

module.exports = serialPortHelper;