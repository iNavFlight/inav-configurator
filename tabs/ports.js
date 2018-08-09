'use strict';

TABS.ports = {};

TABS.ports.initialize = function (callback) {
    var board_definition = {};


    var functionRules = [
         {name: 'MSP',                  groups: ['data', 'msp'], maxPorts: 2},
         {name: 'GPS',                  groups: ['sensors'], maxPorts: 1},
         {name: 'TELEMETRY_FRSKY',      groups: ['telemetry'], sharableWith: ['msp'], notSharableWith: ['blackbox'], maxPorts: 1},
         {name: 'TELEMETRY_HOTT',       groups: ['telemetry'], sharableWith: ['msp'], notSharableWith: ['blackbox'], maxPorts: 1},
         {name: 'TELEMETRY_SMARTPORT',  groups: ['telemetry'], maxPorts: 1},
         {name: 'TELEMETRY_LTM',        groups: ['telemetry'], sharableWith: ['msp'], notSharableWith: ['blackbox'], maxPorts: 1},
         {name: 'RX_SERIAL',            groups: ['rx'], maxPorts: 1},
         {name: 'BLACKBOX',             groups: ['peripherals'], sharableWith: ['msp'], notSharableWith: ['telemetry'], maxPorts: 1}
    ];

    functionRules.push({
        name: 'TELEMETRY_MAVLINK',
        groups: ['telemetry'],
        sharableWith: ['msp'],
        notSharableWith: ['blackbox'],
        maxPorts: 1
    });

    /*
     * Support for FlySky iBus Telemetry
     */
    functionRules.push({
        name: 'TELEMETRY_IBUS',
        groups: ['telemetry'],
        sharableWith: ['msp'],
        notSharableWith: ['blackbox'],
        maxPorts: 1
    });

    // support configure RunCam Device
    if (semver.gte(CONFIG.flightControllerVersion, "1.7.3")) {
        functionRules.push({
            name: 'RUNCAM_DEVICE_CONTROL',
            groups: ['peripherals'],
            maxPorts: 1 }
        );
    }

    if (semver.gte(CONFIG.flightControllerVersion, "1.7.4")) {
        functionRules.push({
            name: 'TBS_SMARTAUDIO',
            groups: ['peripherals'],
            maxPorts: 1 }
        );
        functionRules.push({
            name: 'IRC_TRAMP',
            groups: ['peripherals'],
            maxPorts: 1 }
        );
    }
 
    for (var i = 0; i < functionRules.length; i++) {
        functionRules[i].displayName = chrome.i18n.getMessage('portsFunction_' + functionRules[i].name);
    }

    var mspBaudRates = [
        '9600',
        '19200',
        '38400',
        '57600',
        '115200'
    ];

    var gpsBaudRates = [
        '9600',
        '19200',
        '38400',
        '57600',
        '115200'
    ];

    var telemetryBaudRates_pre1_6_3 = [
        'AUTO',
        '9600',
        '19200',
        '38400',
        '57600',
        '115200'
    ];

    var telemetryBaudRates_post1_6_3 = [
        'AUTO',
        '1200',
        '2400',
        '4800',
        '9600',
        '19200',
        '38400',
        '57600',
        '115200'
    ];

    var peripheralBaudRates = [
        '19200',
        '38400',
        '57600',
        '115200',
        '230400',
        '250000'
    ];

    var portOptions = [
        {
            title: 'portOptionsSerialInversion',
            entries: [
                {
                    title: 'portOptionNotInverted',
                    abbr: 'portOptionNotInvertedAbbr',
                    bit: 0,
                },
                {
                    title: 'portOptionInverted',
                    abbr: 'portOptionInvertedAbbr',
                    bit: 1,
                },
            ]
        },
        {
            title: 'portOptionsFullHalfDuplex',
            entries: [
                {
                    title: 'portOptionFullDuplex',
                    abbr: 'portOptionFullDuplexAbbr',
                    bit: 2,
                },
                {
                    title: 'portOptionHalfDuplex',
                    abbr: 'portOptionHalfDuplexAbbr',
                    bit: 3,
                },
            ]
        },
    ];

    var columns = ['telemetry', 'sensors', 'peripherals'];

    if (GUI.active_tab != 'ports') {
        GUI.active_tab = 'ports';
        googleAnalytics.sendAppView('Ports');
    }

    load_configuration_from_fc();

    function load_configuration_from_fc() {
        MSP.send_message(MSPCodes.MSP_CF_SERIAL_CONFIG, false, false, on_configuration_loaded_handler);

        function on_configuration_loaded_handler() {
            $('#content').load("./tabs/ports.html", on_tab_loaded_handler);

            board_definition = BOARD.find_board_definition(CONFIG.boardIdentifier);
        }
    }

    function update_ui() {

        function getPortName(serialPort) {
            return portIdentifierToNameMapping[serialPort.identifier];
        }

        function updatePortOptionsDescription(serialPort, element) {
            var titles = [];
            var abbrs = [];
            for (var ii = 0; ii < portOptions.length; ii++) {
                for (var jj = 0; jj < portOptions[ii].entries.length; jj++) {
                    var opt = portOptions[ii].entries[jj];
                    if (serialPort.options & (1 << opt.bit)) {
                        titles.push(chrome.i18n.getMessage(opt.title));
                        abbrs.push(chrome.i18n.getMessage(opt.abbr));
                        break;
                    }
                }
            }
            var text;
            var title;
            if (abbrs.length > 0) {
                text = abbrs.join(', ');
                title = titles.join(', ');
            } else {
                text = chrome.i18n.getMessage('portOptionAuto');
                title = '';
            }
            element.text(text);
            element.attr('title', title);
        }

        function updatePortOptionsSelect(serialPort, selects) {
            selects.find('option').prop('selected', false);
            selects.find('option:first').prop('selected', true);
            selects.find('option').each(function() {
                var bit = $(this).data('bit');
                if (bit !== undefined) {
                    if (serialPort.options & (1 << bit)) {
                        $(this).prop('selected', true);
                    }
                }
            });
        }

        var portOptionsContent = $('#tab-ports-options-modal');
        for (var ii = 0; ii < portOptions.length; ii++) {
            var option = $('<h3>').addClass('port-option');
            $('<span>').text(chrome.i18n.getMessage(portOptions[ii].title)).appendTo(option);
            var select = $('<select>').appendTo(option);
            $('<option>').text(chrome.i18n.getMessage('portOptionAuto')).appendTo(select);
            for (var jj = 0; jj < portOptions[ii].entries.length; jj++) {
                var opt = portOptions[ii].entries[jj];
                $('<option>').text(chrome.i18n.getMessage(opt.title)).data('bit', opt.bit).appendTo(select);
            }
            option.appendTo(portOptionsContent);
        }
        var portOptionsSelects = portOptionsContent.find('select');

        function showPortOptions(serialPort, portIndex) {
            return function() {
                var anchor = $(this);
                updatePortOptionsSelect(serialPort, portOptionsSelects);
                portOptionsSelects.prop('disabled', serialPort.options == 0 && portIndex == 0);
                portOptionsSelects.on('change', function() {
                    var mask = 0;
                    var set = 0;
                    var select = $(this);
                    select.find('option').each(function() {
                        var option = $(this);
                        var bit = option.data('bit');
                        if (bit !== undefined) {
                            mask |= 1 << bit;
                            if (option.prop('selected')) {
                                set |= 1 << bit;
                            }
                        }
                        serialPort.options &= ~mask;
                        serialPort.options |= set;
                    });
                    updatePortOptionsDescription(serialPort, anchor);
                });
                var jbox = new jBox('Modal', {
                    width: 280,
                    height: 100,
                    closeButton: 'title',
                    animation: false,
                    title: chrome.i18n.getMessage('portOptionsTitle', [getPortName(serialPort)]),
                    content: portOptionsContent,
                    onClose: function() {
                        portOptionsSelects.off('change')
                    }
                });
                jbox.open();
            }
        }

        $(".tab-ports").addClass("supported");

        var portIdentifierToNameMapping = {
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

        var i,
            $elements;

        $elements = $('select.sensors_baudrate');
        for (i = 0; i < gpsBaudRates.length; i++) {
            $elements.append('<option value="' + gpsBaudRates[i] + '">' + gpsBaudRates[i] + '</option>');
        }

        $elements = $('select.msp_baudrate');
        for (i = 0; i < mspBaudRates.length; i++) {
            $elements.append('<option value="' + mspBaudRates[i] + '">' + mspBaudRates[i] + '</option>');
        }

        $elements = $('select.telemetry_baudrate');
        var telemetryBaudRates = semver.gte(CONFIG.flightControllerVersion, "1.6.3") ? telemetryBaudRates_post1_6_3 : telemetryBaudRates_pre1_6_3;
        for (i = 0; i < telemetryBaudRates.length; i++) {
            $elements.append('<option value="' + telemetryBaudRates[i] + '">' + telemetryBaudRates[i] + '</option>');
        }

        $elements = $('select.peripheral_baudrate');
        for (i = 0; i < peripheralBaudRates.length; i++) {
            $elements.append('<option value="' + peripheralBaudRates[i] + '">' + peripheralBaudRates[i] + '</option>');
        }

        var ports_e = $('.tab-ports .ports');
        var port_configuration_template_e = $('#tab-ports-templates .portConfiguration');

        for (var portIndex = 0; portIndex < SERIAL_CONFIG.ports.length; portIndex++) {
            var port_configuration_e = port_configuration_template_e.clone();
            var serialPort = SERIAL_CONFIG.ports[portIndex];

            port_configuration_e.data('serialPort', serialPort);

            port_configuration_e.find('select.msp_baudrate').val(serialPort.msp_baudrate);
            port_configuration_e.find('select.telemetry_baudrate').val(serialPort.telemetry_baudrate);
            port_configuration_e.find('select.sensors_baudrate').val(serialPort.sensors_baudrate);
            port_configuration_e.find('select.peripheral_baudrate').val(serialPort.peripheral_baudrate);

            port_configuration_e.find('.identifier').text(getPortName(serialPort));

            port_configuration_e.data('index', portIndex);
            port_configuration_e.data('port', serialPort);

            var optionsAnchor = port_configuration_e.find('.options');
            optionsAnchor.click(showPortOptions(serialPort, portIndex));
            updatePortOptionsDescription(serialPort, optionsAnchor);

            if (serialPort.functions.indexOf('MSP') >= 0) {
                port_configuration_e.find('.msp_enabled').prop('checked', true);
                if (portIndex == 0) {
                    port_configuration_e.find('.msp_enabled').prop('disabled', true);
                }
            }

            if (serialPort.functions.indexOf('RX_SERIAL') >= 0) {
                port_configuration_e.find('.rx_serial_enabled').prop('checked', true);
            }

            for (var columnIndex = 0; columnIndex < columns.length; columnIndex++) {
                var column = columns[columnIndex];

                var functions_e = $(port_configuration_e).find('.functionsCell-' + column);

                for (i = 0; i < functionRules.length; i++) {
                    var functionRule = functionRules[i];
                    var functionName = functionRule.name;

                    if (functionRule.groups.indexOf(column) == -1) {
                        continue;
                    }

                    var selectElementName = 'function-' + column;
                    var selectElementSelector = 'select[name=' + selectElementName + ']';
                    var select_e = functions_e.find(selectElementSelector);

                    if (select_e.size() == 0) {
                        functions_e.prepend('<span class="function"><select name="' + selectElementName + '" /></span>');
                        select_e = functions_e.find(selectElementSelector);
                        var disabledText = chrome.i18n.getMessage('portsTelemetryDisabled');
                        select_e.append('<option value="">' + disabledText + '</option>');
                    }
                    select_e.append('<option value="' + functionName + '">' + functionRule.displayName + '</option>');

                    if (serialPort.functions.indexOf(functionName) >= 0) {
                        select_e.val(functionName);
                    }
                }
            }

            ports_e.find('tbody').append(port_configuration_e);
        }
    }

    function on_tab_loaded_handler() {

        localize();

        update_ui();

        $('a.save').click(on_save_handler);

        GUI.content_ready(callback);
    }

   function on_save_handler() {

        // update configuration based on current ui state
        SERIAL_CONFIG.ports = [];

        $('.tab-ports .portConfiguration').each(function () {

            var portConfiguration_e = this;

            var oldSerialPort = $(this).data('serialPort');

            var functions = $(portConfiguration_e).find('input:checkbox:checked').map(function() {
                return this.value;
            }).get();

            var telemetryFunction = $(portConfiguration_e).find('select[name=function-telemetry]').val();
            if (telemetryFunction) {
                functions.push(telemetryFunction);
            }

            var peripheralFunction = $(portConfiguration_e).find('select[name=function-peripherals]').val();
            if (peripheralFunction) {
                functions.push(peripheralFunction);
            }

            var sensorsFunction = $(portConfiguration_e).find('select[name=function-sensors]').val();
            if (sensorsFunction) {
                functions.push(sensorsFunction);
            }

            if (telemetryFunction.length > 0) {
                googleAnalytics.sendEvent('Setting', 'Telemetry Protocol', telemetryFunction);
            }

            var serialPort = {
                functions: functions,
                msp_baudrate: $(portConfiguration_e).find('.msp_baudrate').val(),
                telemetry_baudrate: $(portConfiguration_e).find('.telemetry_baudrate').val(),
                sensors_baudrate: $(portConfiguration_e).find('.sensors_baudrate').val(),
                peripheral_baudrate: $(portConfiguration_e).find('.peripheral_baudrate').val(),
                identifier: oldSerialPort.identifier,
                options: oldSerialPort.options,
            };
            SERIAL_CONFIG.ports.push(serialPort);
        });

        MSP.send_message(MSPCodes.MSP_SET_CF_SERIAL_CONFIG, mspHelper.crunch(MSPCodes.MSP_SET_CF_SERIAL_CONFIG), false, save_to_eeprom);

        function save_to_eeprom() {
            MSP.send_message(MSPCodes.MSP_EEPROM_WRITE, false, false, on_saved_handler);
        }

        function on_saved_handler() {
            GUI.log(chrome.i18n.getMessage('configurationEepromSaved'));

            GUI.tab_switch_cleanup(function() {
                MSP.send_message(MSPCodes.MSP_SET_REBOOT, false, false, on_reboot_success_handler);
            });
        }

        function on_reboot_success_handler() {
            GUI.log(chrome.i18n.getMessage('deviceRebooting'));
            GUI.handleReconnect($('.tab_ports a'));
        }
    }
};

TABS.ports.cleanup = function (callback) {
    if (callback) callback();
};
